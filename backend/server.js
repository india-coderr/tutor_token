import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import admin from "firebase-admin";
import { Groq } from "groq-sdk";

const {
  PORT = 4000,
  FRONTEND_ORIGIN = "http://localhost:5190",
  JWT_SECRET,
  ADMIN_EMAIL,
  ADMIN_PASSWORD_HASH,
  // ── SMTP ────────────────────────────────────────────────────────────────────
  SMTP_HOST,
  SMTP_PORT = 465,
  SMTP_SECURE = "true",
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM = SMTP_USER,
  // ── Supabase / Firebase ──────────────────────────────────────────────────────
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  FIREBASE_DATABASE_URL,
  FIREBASE_SERVICE_ACCOUNT_JSON,
  // ── Groq ─────────────────────────────────────────────────────────────────────
  GROQ_API_KEY,
  GROQ_MODEL = "openai/gpt-oss-120b",
} = process.env;

if (!JWT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn("[config] JWT_SECRET, SUPABASE_URL and SUPABASE_SERVICE_KEY are required for production use.");
}

const app = express();
const supabase = createClient(SUPABASE_URL || "", SUPABASE_SERVICE_KEY || "");

// ── Groq client ──────────────────────────────────────────────────────────────────
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;
if (!groq) console.warn("[config] GROQ_API_KEY not set — Groq endpoints will return 503.");

// ── Firebase ─────────────────────────────────────────────────────────────────
if (!admin.apps.length && FIREBASE_DATABASE_URL) {
  const credential = FIREBASE_SERVICE_ACCOUNT_JSON
    ? admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON))
    : admin.credential.applicationDefault();
  admin.initializeApp({ credential, databaseURL: FIREBASE_DATABASE_URL });
}

// ── Nodemailer ────────────────────────────────────────────────────────────────
const mailer =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE === "true",
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: FRONTEND_ORIGIN.split(",").map((s) => s.trim()), credentials: true }));
app.use(express.json({ limit: "12mb" }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }));

const adminLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const aiLimiter    = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

// ── Helpers ───────────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Missing admin token" });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function nextMentorId() {
  const year = new Date().getFullYear();
  const db = admin.apps.length ? admin.database() : null;
  if (!db) {
    const random = Math.floor(Math.random() * 900) + 100;
    return `TTM-${year}-${random}`;
  }
  const counterRef = db.ref(`mentorIdCounter/${year}`);
  const result = await counterRef.transaction((current) => (current || 0) + 1);
  const seq = result.snapshot.val();
  return `TTM-${year}-${String(seq).padStart(3, "0")}`;
}

async function sendApprovalEmail(application, mentorId) {
  if (!mailer) return { skipped: true };
  await mailer.sendMail({
    from: MAIL_FROM,
    to: application.email,
    subject: "Your Mentor Application has been Approved!",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2>Welcome to TT Time Trade, ${application.full_name}.</h2>
        <p>Your mentor application has been approved.</p>
        <p>Your permanent Mentor ID is:</p>
        <div style="font-size:24px;font-weight:800;padding:14px 18px;background:#fff1f5;border-radius:10px;color:#ff3370;display:inline-block">${mentorId}</div>
        <p>Open TT, choose Mentor Dashboard, and sign in with your email and this Mentor ID.</p>
      </div>
    `,
  });
  return { sent: true };
}

// ── Admin routes ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/admin/login", adminLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  const validEmail    = email.toLowerCase() === String(ADMIN_EMAIL || "").toLowerCase();
  const validPassword = ADMIN_PASSWORD_HASH ? await bcrypt.compare(password, ADMIN_PASSWORD_HASH) : false;
  if (!validEmail || !validPassword) return res.status(401).json({ error: "Invalid admin credentials" });
  const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
  await supabase.from("admin_sessions").insert([{ admin_email: email, expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() }]);
  res.json({ token, admin: { email } });
});

app.get("/api/admin/applications", adminLimiter, requireAdmin, async (_req, res) => {
  const { data, error } = await supabase.from("mentor_applications").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ applications: data || [] });
});

app.post("/api/admin/applications/:id/reject", adminLimiter, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { note = "" } = req.body || {};
  const { data, error } = await supabase.from("mentor_applications")
    .update({ status: "rejected", admin_note: note, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ application: data });
});

app.post("/api/admin/approve-mentor", adminLimiter, requireAdmin, async (req, res) => {
  const { applicationId } = req.body || {};
  const { data: application, error } = await supabase.from("mentor_applications").select("*").eq("id", applicationId).single();
  if (error || !application) return res.status(404).json({ error: error?.message || "Application not found" });

  let mentorId = application.mentor_id;
  if (!mentorId) mentorId = await nextMentorId();

  if (admin.apps.length) {
    const db = admin.database();
    await db.ref(`mentorIds/${mentorId}`).set({ userId: application.user_uid, email: application.email, createdAt: Date.now() });
    await db.ref(`users/${application.user_uid}`).update({ mentorId, role: "mentor", mentorApprovedAt: Date.now() });
  }

  const { data, error: updateError } = await supabase.from("mentor_applications")
    .update({ status: "approved", mentor_id: mentorId, updated_at: new Date().toISOString() })
    .eq("id", applicationId).select().single();
  if (updateError) return res.status(500).json({ error: updateError.message });

  const mail = await sendApprovalEmail(application, mentorId);
  res.json({ application: data, mentorId, mail });
});

app.get("/api/admin/users", adminLimiter, requireAdmin, async (_req, res) => {
  if (!admin.apps.length) return res.json({ users: [] });
  const snap  = await admin.database().ref("users").once("value");
  const users = Object.entries(snap.val() || {}).map(([uid, value]) => ({ uid, ...value }));
  res.json({ users });
});

app.post("/api/admin/suspend-mentor", adminLimiter, requireAdmin, async (req, res) => {
  const { uid, suspended = true } = req.body || {};
  if (!uid || !admin.apps.length) return res.status(400).json({ error: "uid and Firebase admin are required" });
  await admin.database().ref(`users/${uid}`).update({ mentorSuspended: suspended });
  res.json({ ok: true });
});

app.get("/api/admin/courses", adminLimiter, requireAdmin, async (_req, res) => {
  const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ courses: data || [] });
});

app.post("/api/admin/approve-course", adminLimiter, requireAdmin, async (req, res) => {
  const { courseId, status, reason = "" } = req.body || {};
  if (!courseId || !["approved", "rejected"].includes(status))
    return res.status(400).json({ error: "courseId and valid status are required" });
  const { data, error } = await supabase.from("courses")
    .update({ status, rejection_reason: reason })
    .eq("id", courseId).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ course: data });
});

app.post("/api/courses/submit", async (req, res) => {
  const course = req.body || {};
  if (!course.mentor_uid || !course.title || !course.skill) {
    return res.status(400).json({ error: "mentor_uid, title and skill are required" });
  }
  const payload = {
    ...course,
    status: "pending",
    rating: Number(course.rating || 0),
    sessions_count: Number(course.sessions_count || 0),
    credits: Number(course.credits || 1),
    pricing: Number(course.pricing || 0),
  };
  const { data, error } = await supabase.from("courses").insert([payload]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ course: data });
});

app.get("/api/mentors", async (_req, res) => {
  if (!admin.apps.length) return res.json({ mentors: [] });
  const snap = await admin.database().ref("users").once("value");
  const mentors = Object.entries(snap.val() || {})
    .map(([uid, value]) => ({ uid, ...value }))
    .filter((user) => (user.mentorId || user.role === "mentor") && !user.mentorSuspended)
    .map((user) => ({
      uid: user.uid,
      displayName: user.displayName || user.name || user.email || "Mentor",
      email: user.email || "",
      photoURL: user.photoURL || "",
      mentorId: user.mentorId || "",
      skills: user.skills || [],
    }));
  res.json({ mentors });
});

app.post("/api/urgent-requests", async (req, res) => {
  const request = req.body || {};
  if (!request.learner_uid || !request.topic) {
    return res.status(400).json({ error: "learner_uid and topic are required" });
  }
  const { data, error } = await supabase.from("urgent_requests").insert([{ ...request, status: "open" }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ urgentRequest: data });
});

app.post("/api/urgent-requests/:id/accept", async (req, res) => {
  const { id } = req.params;
  const { mentorUid, mentorName, meetLink } = req.body || {};
  if (!id || !mentorUid) return res.status(400).json({ error: "Request id and mentorUid are required" });
  const { data, error } = await supabase.from("urgent_requests")
    .update({
      status: "accepted",
      accepted_by_uid: mentorUid,
      accepted_by_name: mentorName || "Mentor",
      meet_link: meetLink || "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ urgentRequest: data });
});

app.get("/api/admin/urgent-requests", adminLimiter, requireAdmin, async (_req, res) => {
  const { data, error } = await supabase.from("urgent_requests").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ urgentRequests: data || [] });
});

app.get("/api/admin/ai-usage", adminLimiter, requireAdmin, async (_req, res) => {
  const { data, error } = await supabase.from("ai_chat_logs").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ logs: data || [] });
});

// ── Compatibility AI routes (legacy frontend expects /api/ai/*) ──────────────
// These proxy to the Groq client so the existing frontend does not need changes.
// POST /api/ai/chat — multi-turn text chat (compat)
app.post("/api/ai/chat", aiLimiter, async (req, res) => {
  const { message, history = [], user } = req.body || {};
  if (!message) return res.status(400).json({ error: "Message is required" });
  if (!groq) return res.status(503).json({ error: "GROQ_API_KEY is not configured" });
  try {
    const messages = [
      ...history,
      { role: "user", content: message }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: GROQ_MODEL,
      temperature: 0.7,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const answer = chatCompletion.choices[0]?.message?.content || "";

    await supabase.from("ai_chat_logs").insert([{
      user_uid: user?.uid, user_email: user?.email,
      provider: "groq", model: GROQ_MODEL,
      prompt: message, response: answer,
    }]);
    res.json({ answer });
  } catch (err) {
    console.error("[ai/chat]", err);
    res.status(500).json({ error: err.message || "AI request failed" });
  }
});

// POST /api/ai/vision — image understanding (compat)
app.post("/api/ai/vision", aiLimiter, async (req, res) => {
  const {
    message = "Explain this image step by step.",
    imageUrl,
    imageBase64,
    mimeType = "image/jpeg",
    user,
  } = req.body || {};

  if (!imageUrl && !imageBase64) return res.status(400).json({ error: "imageUrl or imageBase64 is required" });
  if (!groq) return res.status(503).json({ error: "GROQ_API_KEY is not configured" });
  try {
    // If frontend uploaded the image to storage, we will reference the public URL in the prompt.
    const content = imageUrl ? `Analyze this image: ${imageUrl}\n\n${message}` : `${message} (image provided as base64)`;

    const messages = [{ role: "user", content }];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: GROQ_MODEL,
      temperature: 0.7,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const answer = chatCompletion.choices[0]?.message?.content || "";

    await supabase.from("ai_chat_logs").insert([{
      user_uid: user?.uid, user_email: user?.email,
      provider: "groq", model: GROQ_MODEL, mode: "vision",
      prompt: message, response: answer,
    }]);
    res.json({ answer });
  } catch (err) {
    console.error("[ai/vision]", err);
    res.status(500).json({ error: err.message || "Vision request failed" });
  }
});

// ── Groq AI routes ───────────────────────────────────────────────────────────

// POST /api/groq/chat — multi-turn streaming chat
app.post("/api/groq/chat", aiLimiter, async (req, res) => {
  const { message, history = [], user } = req.body || {};
  if (!message) return res.status(400).json({ error: "Message is required" });
  if (!groq)   return res.status(503).json({ error: "GROQ_API_KEY is not configured" });
  try {
    // Convert history to Groq format if needed
    const messages = [
      ...history,
      { role: "user", content: message }
    ];
    
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: GROQ_MODEL,
      temperature: 0.7,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
    });
    
    const answer = chatCompletion.choices[0]?.message?.content || "";

    await supabase.from("ai_chat_logs").insert([{
      user_uid: user?.uid, user_email: user?.email,
      provider: "groq", model: GROQ_MODEL,
      prompt: message, response: answer,
    }]);
    res.json({ answer });
  } catch (err) {
    console.error("[groq/chat]", err);
    res.status(500).json({ error: err.message || "Groq request failed" });
  }
});

// POST /api/groq/stream — streaming chat response
app.post("/api/groq/stream", aiLimiter, async (req, res) => {
  const { message, history = [], user } = req.body || {};
  if (!message) return res.status(400).json({ error: "Message is required" });
  if (!groq)   return res.status(503).json({ error: "GROQ_API_KEY is not configured" });
  try {
    res.setHeader("Content-Type", "application/x-ndjson");
    
    const messages = [
      ...history,
      { role: "user", content: message }
    ];
    
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: GROQ_MODEL,
      temperature: 0.7,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
    });

    let fullResponse = "";
    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        res.write(JSON.stringify({ chunk: content }) + "\n");
      }
    }

    await supabase.from("ai_chat_logs").insert([{
      user_uid: user?.uid, user_email: user?.email,
      provider: "groq", model: GROQ_MODEL, mode: "stream",
      prompt: message, response: fullResponse,
    }]);
    res.end();
  } catch (err) {
    console.error("[groq/stream]", err);
    res.status(500).json({ error: err.message || "Groq streaming request failed" });
  }
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(Number(PORT), () => {
  console.log(`TT secure backend listening on http://localhost:${PORT}`);
});
