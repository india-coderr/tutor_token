import {
  useState, useEffect, useContext, createContext,
  useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, CheckCircle, XCircle, Video, LogOut, User, Bell,
  Zap, Search, Award, Loader2, MessageSquare,
  AlertTriangle, Coins, Globe, X, Check, Plus,
  BookOpen, Code2, Database, Cpu, Palette, TrendingUp,
  Music, Camera, PenLine, Star, Clock,
  ChevronRight, Sparkles, Shield, Hash, Calendar,
  ExternalLink, RefreshCw, LayoutDashboard, Upload, Trash2,
  Image as ImageIcon, Play, Users, BarChart2,
  Send, Paperclip, Mail, Lock, FileText, Ban,
} from "lucide-react";
import {GlobalStyles,  AnimatedCredits, StatusBadge, SkillGraph, ALL_SKILLS, SKILL_ICONS, SKILL_COLORS, SKILL_BG, SKILL_GRADIENT } from "./lib/ui";
import { ToastProvider, ToastCtx } from "./contexts/ToastContext";
import { AuthProvider, AuthCtx } from "./contexts/AuthContext";
import AIChatWidget from "./components/AIChatWidget";
import CourseCard from "./components/CourseCard";
// LoginScreen moved to src/components/LoginScreen.jsx
import WalletWidget from "./components/WalletWidget";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from "firebase/auth";
import {
  getDatabase, ref as dbRef, set as dbSet, get as dbGet,
  update as dbUpdate, onValue, off,
} from "firebase/database";
import { createClient } from "@supabase/supabase-js";
import LoginScreen from "./components/LoginScreen";

// ── FIREBASE CONFIG ───────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCjaty20ZFloU5VrA4OfaqIZwaOnnEKR3k",
  authDomain: "timetrade-c2424.firebaseapp.com",
  databaseURL: "https://timetrade-c2424-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "timetrade-c2424",
  storageBucket: "timetrade-c2424.firebasestorage.app",
  messagingSenderId: "37103569098",
  appId: "1:37103569098:web:b335e391f91dd1edae8c33",
};

const SUPABASE_URL      = "https://nsyydxayplotyxwuhdsz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeXlkeGF5cGxvdHl4d3VoZHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NzI2OTYsImV4cCI6MjA5MzE0ODY5Nn0.zvWiDuVUoqSA4zxybp9QSw3c4wVKS1ylpyzsWRb1Qhc";
const ZOOM_PROXY_URL = "https://zoom-proxy.rajeshwarisons3134.workers.dev";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const DISCUSSION_ROOM_URL = "https://bhailog-m.vercel.app/";

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const auth        = getAuth(firebaseApp);
const rtdb        = getDatabase(firebaseApp);
const gProvider   = new GoogleAuthProvider();
const supabase    = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── RTDB HELPERS ──────────────────────────────────────────────────────────────
async function rtGet(path) {
  const snap = await dbGet(dbRef(rtdb, path));
  return snap.exists() ? snap.val() : null;
}
async function rtSet(path, data)    { await dbSet(dbRef(rtdb, path), data); }
async function rtUpdate(path, data) { await dbUpdate(dbRef(rtdb, path), data); }
function rtListen(path, cb) {
  const r = dbRef(rtdb, path);
  onValue(r, (snap) => cb(snap.exists() ? snap.val() : null));
  return () => off(r);
}

// ── SUPABASE HELPERS ──────────────────────────────────────────────────────────
async function sbInsertRequest(data) {
  const { data: row, error } = await supabase.from("requests").insert([data]).select().single();
  if (error) throw new Error(error.message);
  return row;
}
async function sbUpdateRequest(id, data) {
  const { error } = await supabase.from("requests").update(data).eq("id", id);
  if (error) throw new Error(error.message);
}
async function sbDeleteRequest(id) {
  const { error } = await supabase.from("requests").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
async function sbGetRequests(field, uid) {
  const { data, error } = await supabase
    .from("requests").select("*").eq(field, uid)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
async function sbInsertCourse(data) {
  const { data: row, error } = await supabase.from("courses").insert([data]).select().single();
  if (error) throw new Error(error.message);
  return row;
}
async function sbGetAllCourses() {
  const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
async function sbGetMentorCourses(mentorUid) {
  const { data, error } = await supabase.from("courses").select("*").eq("mentor_uid", mentorUid).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
async function sbDeleteCourse(id) {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
async function sbUploadCourseImage(file, mentorUid) {
  const ext  = file.name.split(".").pop();
  const path = `course-images/${mentorUid}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("course-images").upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("course-images").getPublicUrl(path);
  return data.publicUrl;
}

async function sbUploadFile(bucket, folder, file) {
  const ext = file.name.split(".").pop();
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, "_");
  const path = `${folder}/${Date.now()}-${safeName}.${ext}`.replace(`.${ext}.${ext}`, `.${ext}`);
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function sbInsertMentorApplication(data) {
  const { data: row, error } = await supabase.from("mentor_applications").insert([data]).select().single();
  if (error) throw new Error(error.message);
  return row;
}

async function sbGetMyMentorApplication(uid) {
  const { data, error } = await supabase
    .from("mentor_applications").select("*").eq("user_uid", uid)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function sbInsertUrgentRequest(data) {
  const { data: row, error } = await supabase.from("urgent_requests").insert([data]).select().single();
  if (error) throw new Error(error.message);
  return row;
}

async function sbUpdateUrgentRequest(id, data) {
  const { data: row, error } = await supabase.from("urgent_requests").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return row;
}

async function apiFetch(path, options = {}, token = "") {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function submitCourseSecure(course) {
  try {
    const data = await apiFetch("/api/courses/submit", {
      method: "POST",
      body: JSON.stringify(course),
    });
    return data.course;
  } catch (apiError) {
    try { return await sbInsertCourse(course); }
    catch (sbError) {
      throw new Error(`${apiError.message}. Supabase fallback also failed: ${sbError.message}`);
    }
  }
}

async function getMentorsForRequest() {
  try {
    const users = await rtGet("users");
    const mentors = Object.entries(users || {})
      .map(([uid, value]) => ({ uid, ...value }))
      .filter((u) => (u.mentorId || u.role === "mentor") && !u.mentorSuspended)
      .map((u) => ({
        uid: u.uid,
        displayName: u.displayName || u.name || u.email || "Mentor",
        email: u.email || "",
        photoURL: u.photoURL || "",
        mentorId: u.mentorId || "",
        skills: u.skills || [],
      }));
    if (mentors.length) return mentors;
  } catch {}
  const data = await apiFetch("/api/mentors");
  return data.mentors || [];
}

async function createUrgentRequestSecure(payload) {
  try {
    const data = await apiFetch("/api/urgent-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data.urgentRequest;
  } catch (apiError) {
    try { return await sbInsertUrgentRequest(payload); }
    catch (sbError) {
      const id = `local-${Date.now()}`;
      return { id, ...payload, status: "open", localOnly: true, error: `${apiError.message}; ${sbError.message}` };
    }
  }
}

async function acceptUrgentRequestSecure(req, profile, zoomData) {
  try {
    const data = await apiFetch(`/api/urgent-requests/${req.id}/accept`, {
      method: "POST",
      body: JSON.stringify({
        mentorUid: profile.uid,
        mentorName: profile.displayName,
        meetLink: zoomData.joinUrl,
      }),
    });
    return data.urgentRequest;
  } catch {
    try {
      return await sbUpdateUrgentRequest(req.id, {
        status: "accepted", accepted_by_uid: profile.uid,
        accepted_by_name: profile.displayName, meet_link: zoomData.joinUrl,
      });
    } catch {
      return {
        ...req,
        status: "accepted",
        accepted_by_uid: profile.uid,
        accepted_by_name: profile.displayName,
        meet_link: zoomData.joinUrl,
      };
    }
  }
}

// ── ZOOM API ──────────────────────────────────────────────────────────────────
async function createZoomMeeting(mentorEmail, learnerName, skill) {
  if (!ZOOM_PROXY_URL || ZOOM_PROXY_URL.includes("YOUR_SUBDOMAIN")) {
    return generateFallbackZoomLink(skill);
  }
  try {
    const res = await fetch(`${ZOOM_PROXY_URL}?action=create_meeting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorEmail, learnerName, skill }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.detail || data.error || "Proxy returned error");
    return { meetingId: data.meetingId, joinUrl: data.joinUrl, startUrl: data.startUrl, password: data.password || "" };
  } catch (err) {
    console.error("[Zoom proxy]", err);
    throw err;
  }
}

function generateFallbackZoomLink(skill = "") {
  const id  = Math.floor(Math.random() * 9000000000) + 1000000000;
  const pwd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return { meetingId: String(id), joinUrl: `https://zoom.us/j/${id}?pwd=${pwd}`, startUrl: `https://zoom.us/s/${id}?zak=PLACEHOLDER`, password: pwd };
}

// ── MENTOR ID HELPERS ─────────────────────────────────────────────────────────
function generateMentorId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "MENTOR";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

async function mentorIdExists(mentorId) {
  try {
    const snap = await rtGet(`mentorIds/${mentorId}`);
    return snap !== null;
  } catch { return false; }
}

async function verifyMentorId(mentorId, userId) {
  try {
    const indexEntry = await rtGet(`mentorIds/${mentorId}`);
    if (indexEntry && indexEntry.userId === userId) return true;
    const userMentorId = await rtGet(`users/${userId}/mentorId`);
    return userMentorId === mentorId;
  } catch { return false; }
}

async function storeMentorId(userId, mentorId) {
  try {
    await rtSet(`mentorIds/${mentorId}`, { userId, createdAt: Date.now() });
    await rtUpdate(`users/${userId}`, { mentorId, role: "mentor", mentorCreatedAt: Date.now() });
    return true;
  } catch (e) {
    console.error("storeMentorId REAL error:", e.code, e.message);
    return false;
  }
}

function formatTime(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const T = {
  bg:       "#0A0A0F",
  surface:  "#12121A",
  alt:      "#1C1C28",
  dark:     "#FFFFFF",
  pink:     "#FF3370",
  pinkDim:  "#FF337018",
  pinkMid:  "#FF337040",
  text:     "#FFFFFF",
  muted:    "#7A7A8C",
  border:   "#1E1E2E",
  danger:   "#FF4444",
  success:  "#22C55E",
  mentor:   "#FF3370",
  mentorLt: "#FF337018",
  yellow:   "#FF3370",
  yellowLt: "#FF337018",
  // New accent for card image backgrounds
  cardGrad1: "#1A1A2E",
  cardGrad2: "#16213E",
};

const pillStyle = (active = false, pink = false, extra = {}) => ({
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "10px 20px", borderRadius: 999, cursor: "pointer",
  border: "none", fontFamily: "inherit", fontWeight: 600,
  fontSize: 14, transition: "all 0.15s ease",
  background: pink ? T.pink : active ? "#FFFFFF" : T.surface,
  color:      pink ? "#fff" : active ? "#0A0A0F"  : T.text,
  boxShadow:  active || pink ? "none" : `0 0 0 1px ${T.border}`,
  ...extra,
});

const cardStyle = (extra = {}) => ({
  background: T.surface, borderRadius: 16,
  border: `1px solid ${T.border}`,
  boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
  padding: 20, ...extra,
});

// ── GLOBAL CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: ${T.bg};
    font-family: 'DM Sans','Segoe UI',sans-serif;
    color: ${T.text};
    width: 100%;
    overflow-x: hidden;
  }
  #root { width: 100%; min-height: 100vh; }
  button { font-family: inherit; cursor: pointer; }
  input, select, textarea { font-family: inherit; color: ${T.text}; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
  input:focus, textarea:focus, select:focus { outline: 2px solid ${T.pink}; outline-offset: 0; }
  @keyframes spin  { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.5;} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  .spin  { animation: spin  1s linear infinite; }
  .pulse { animation: pulse 2s ease-in-out infinite; }
  ::placeholder { color: #3A3A4A; }
  select option { background: #12121A; color: #fff; }
  @media (max-width: 600px) {
    main { padding: 16px 12px 80px !important; }
  }
`;

// Global styles and providers have been extracted to src/lib and src/contexts

// Skills moved to src/lib/ui.js
// (ALL_SKILLS, SKILL_ICONS, SKILL_COLORS, SKILL_BG, SKILL_GRADIENT)
// are imported from the shared ui module.
// const SKILL_COLORS = {
//   React: "#61DAFB", TypeScript: "#a78bfa", Python: "#fcd34d",
//   "UI/UX": "#f472b6", NodeJS: "#6ee7b7", GraphQL: "#c084fc",
//   Figma: "#fb7185", "Data Science": "#34d399", DevOps: "#60a5fa",
//   Flutter: "#38bdf8", Go: "#2dd4bf", Rust: "#fbbf24",
//   "Machine Learning": "#818cf8", SQL: "#4ade80", AWS: "#fb923c",
//   Kubernetes: "#60a5fa", Web3: "#c084fc", Photography: "#f87171",
//   "Music Theory": "#a78bfa", "Technical Writing": "#4ade80",
// };
// const SKILL_BG = {
//   React: "#0d2137", TypeScript: "#1e1040", Python: "#2a2000",
//   "UI/UX": "#2a0620", NodeJS: "#062014", GraphQL: "#1a0830",
//   Figma: "#2a0615", "Data Science": "#031a10", DevOps: "#0d2137",
//   Flutter: "#061a28", Go: "#031a18", Rust: "#2a1600",
//   "Machine Learning": "#121440", SQL: "#031a08", AWS: "#2a1000",
//   Kubernetes: "#0d2137", Web3: "#1a0830", Photography: "#2a0000",
//   "Music Theory": "#1e1040", "Technical Writing": "#031a08",
// };

// // Skill image placeholder gradients for course cards
// const SKILL_GRADIENT = {
//   React: "linear-gradient(135deg, #0d2137 0%, #1a4a6b 50%, #0d2137 100%)",
//   TypeScript: "linear-gradient(135deg, #1e1040 0%, #3d2a80 50%, #1e1040 100%)",
//   Python: "linear-gradient(135deg, #2a2000 0%, #5a4a00 50%, #2a2000 100%)",
//   "UI/UX": "linear-gradient(135deg, #2a0620 0%, #5a1040 50%, #2a0620 100%)",
//   NodeJS: "linear-gradient(135deg, #062014 0%, #0d4028 50%, #062014 100%)",
//   GraphQL: "linear-gradient(135deg, #1a0830 0%, #3a1060 50%, #1a0830 100%)",
//   Figma: "linear-gradient(135deg, #2a0615 0%, #5a1030 50%, #2a0615 100%)",
//   "Data Science": "linear-gradient(135deg, #031a10 0%, #063428 50%, #031a10 100%)",
//   DevOps: "linear-gradient(135deg, #0d2137 0%, #1a4060 50%, #0d2137 100%)",
//   Flutter: "linear-gradient(135deg, #061a28 0%, #0c3050 50%, #061a28 100%)",
//   Go: "linear-gradient(135deg, #031a18 0%, #063430 50%, #031a18 100%)",
//   Rust: "linear-gradient(135deg, #2a1600 0%, #5a2e00 50%, #2a1600 100%)",
//   "Machine Learning": "linear-gradient(135deg, #121440 0%, #242880 50%, #121440 100%)",
//   SQL: "linear-gradient(135deg, #031a08 0%, #063410 50%, #031a08 100%)",
//   AWS: "linear-gradient(135deg, #2a1000 0%, #5a2400 50%, #2a1000 100%)",
//   Kubernetes: "linear-gradient(135deg, #0d2137 0%, #1a4060 50%, #0d2137 100%)",
//   Web3: "linear-gradient(135deg, #1a0830 0%, #3a1860 50%, #1a0830 100%)",
//   Photography: "linear-gradient(135deg, #1a0000 0%, #3a0000 50%, #1a0000 100%)",
//   "Music Theory": "linear-gradient(135deg, #1e1040 0%, #3e2080 50%, #1e1040 100%)",
//   "Technical Writing": "linear-gradient(135deg, #031a08 0%, #063410 50%, #031a08 100%)",
// };

// AnimatedCredits, StatusBadge and SkillGraph moved to src/lib/ui.js

// ═════════════════════════════════════════════════════════════════════════════
// ██  CREATE COURSE MODAL
// ═════════════════════════════════════════════════════════════════════════════
function CreateCourseModal({ profile, mentorId, onClose, onCreated }) {
  const toast = useContext(ToastCtx);
  const fileRef = useRef();
  const notesRef = useRef();
  const [form, setForm] = useState({
    title: "", skill: profile.skills?.[0] || ALL_SKILLS[0],
    subtitle: "", level: "Beginner", topics: "", credits: 1,
    description: "", demoVideoUrl: "", pricing: 0,
  });
  const [imageFile,    setImageFile]    = useState(null);
  const [notesFile,    setNotesFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving,       setSaving]       = useState(false);

  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const handleImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast("Course title is required", "error"); return; }
    setSaving(true);
    try {
      let imageUrl = profile.photoURL || "";
      if (imageFile) {
        try { imageUrl = await sbUploadCourseImage(imageFile, profile.uid); }
        catch { toast("Image upload failed, using default.", "info"); }
      }
      let notesUrl = "";
      if (notesFile) {
        try { notesUrl = await sbUploadFile("course-notes", profile.uid, notesFile); }
        catch { toast("Notes upload failed, submitting course without notes.", "info"); }
      }
      const topicsArr = form.topics.split(",").map((t) => t.trim()).filter(Boolean);
      const row = await submitCourseSecure({
        mentor_uid: profile.uid, mentor_name: profile.displayName,
        mentor_photo: imageUrl, mentor_id: mentorId,
        mentor_email: profile.email, title: form.title.trim(),
        skill: form.skill, subtitle: form.subtitle.trim(),
        level: form.level, topics: topicsArr,
        credits: Number(form.credits), rating: 0, sessions_count: 0,
        status: "pending", description: form.description.trim(),
        category: form.skill, demo_video_url: form.demoVideoUrl.trim(),
        notes_url: notesUrl, pricing: Number(form.pricing || 0),
      });
      await rtUpdate(`users/${profile.uid}`, {
        role: "mentor",
        skills: Array.from(new Set([...(profile.skills||[]), form.skill])),
      });
      toast("Course submitted for admin approval.", "success");
      onCreated(row); onClose();
    } catch (e) { toast(e.message, "error"); }
    setSaving(false);
  };

  const mentorSkills = Array.isArray(profile.skills) && profile.skills.length > 0
    ? profile.skills : ALL_SKILLS;

  const inputStyle = {
    width:"100%", padding:"11px 14px", borderRadius:10,
    border:`1px solid ${T.border}`, background:"#0A0A12",
    fontSize:14, outline:"none", color:T.text,
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)",
        zIndex:700, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <motion.div initial={{ scale:0.88, opacity:0 }} animate={{ scale:1, opacity:1 }}
        exit={{ scale:0.88, opacity:0 }} onClick={(e) => e.stopPropagation()}
        style={{ ...cardStyle({ padding:0 }), width:"100%", maxWidth:540,
          maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"22px 24px 18px", borderBottom:`1px solid ${T.border}`,
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:20 }}>Create Course</div>
            <div style={{ fontSize:13, color:T.muted }}>Submit for admin approval</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none" }}><X size={20} color={T.muted} /></button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"22px 24px" }}>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:13, fontWeight:600, color:T.muted, display:"block", marginBottom:10 }}>Course / Mentor Photo</label>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:72, height:72, borderRadius:16, overflow:"hidden",
                background:"#0A0A12", border:`2px dashed ${T.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0, cursor:"pointer" }}
                onClick={() => fileRef.current?.click()}>
                {imagePreview
                  ? <img src={imagePreview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <ImageIcon size={24} color={T.muted} />}
              </div>
              <motion.button whileTap={{ scale:0.95 }} onClick={() => fileRef.current?.click()}
                style={{ ...pillStyle(false,false,{ padding:"8px 16px", fontSize:13 }) }}>
                <Upload size={13} /> Upload Image
              </motion.button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImage} />
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:T.muted, display:"block", marginBottom:8 }}>Course Title *</label>
            <input value={form.title} onChange={(e) => upd("title", e.target.value)}
              placeholder="e.g. React from Scratch" style={inputStyle} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:T.muted, display:"block", marginBottom:8 }}>Skill / Category *</label>
            <select value={form.skill} onChange={(e) => upd("skill", e.target.value)} style={inputStyle}>
              {mentorSkills.map((s) => <option key={s} value={s}>{s}</option>)}
              {ALL_SKILLS.filter((s) => !mentorSkills.includes(s)).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:T.muted, display:"block", marginBottom:8 }}>Short Description</label>
            <input value={form.subtitle} onChange={(e) => upd("subtitle", e.target.value)}
              placeholder="e.g. Hooks, Context & real projects" style={inputStyle} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:T.muted, display:"block", marginBottom:8 }}>Full Description</label>
            <textarea value={form.description} onChange={(e) => upd("description", e.target.value)}
              placeholder="What will learners be able to do after this session?"
              rows={4} style={{ ...inputStyle, resize:"vertical", lineHeight:1.5 }} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 140px", gap:12, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:T.muted, display:"block", marginBottom:8 }}>Demo Video URL</label>
              <input value={form.demoVideoUrl} onChange={(e) => upd("demoVideoUrl", e.target.value)}
                placeholder="https://..." style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:T.muted, display:"block", marginBottom:8 }}>Pricing</label>
              <input type="number" min="0" value={form.pricing} onChange={(e) => upd("pricing", e.target.value)}
                style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:T.muted, display:"block", marginBottom:8 }}>Notes File</label>
            <input ref={notesRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" style={{ display:"none" }}
              onChange={(e) => setNotesFile(e.target.files?.[0] || null)} />
            <motion.button whileTap={{ scale:0.95 }} onClick={() => notesRef.current?.click()}
              style={{ ...pillStyle(false, false, { padding:"9px 14px", fontSize:13 }) }}>
              <Paperclip size={13} /> {notesFile ? notesFile.name : "Attach notes"}
            </motion.button>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:T.muted, display:"block", marginBottom:8 }}>Level</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["Beginner","Intermediate","Advanced","All levels"].map((lvl) => (
                <motion.button key={lvl} whileTap={{ scale:0.93 }} onClick={() => upd("level", lvl)}
                  style={{ ...pillStyle(form.level===lvl, false, { padding:"7px 14px", fontSize:13 }) }}>
                  {form.level===lvl && <Check size={11} />} {lvl}
                </motion.button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:T.muted, display:"block", marginBottom:8 }}>
              Topics <span style={{ fontWeight:400 }}>(comma-separated)</span>
            </label>
            <input value={form.topics} onChange={(e) => upd("topics", e.target.value)}
              placeholder="e.g. useState, useEffect, Custom Hooks" style={inputStyle} />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:13, fontWeight:600, color:T.muted, display:"block", marginBottom:8 }}>Credits per session</label>
            <div style={{ display:"flex", gap:8 }}>
              {[1, 2, 3].map((n) => (
                <motion.button key={n} whileTap={{ scale:0.93 }} onClick={() => upd("credits", n)}
                  style={{ ...pillStyle(form.credits===n, form.credits===n, { padding:"7px 18px", fontSize:14 }) }}>
                  {n}
                </motion.button>
              ))}
            </div>
          </div>
          <motion.button whileTap={{ scale:0.96 }} disabled={saving} onClick={handleSubmit}
            style={{ ...pillStyle(false, true, { width:"100%", justifyContent:"center",
              padding:"13px", fontSize:15, opacity:saving?0.6:1 }) }}>
            {saving ? <><Loader2 size={15} className="spin" /> Submitting…</> : <><Sparkles size={15} /> Submit for Approval</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// CourseCard and ZoomRequestModal moved to src/components/CourseCard.jsx

// ═════════════════════════════════════════════════════════════════════════════
// ██  MARKETPLACE
// ═════════════════════════════════════════════════════════════════════════════
function Marketplace({ profile }) {
  const toast = useContext(ToastCtx);
  const [courses,    setCourses]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState("All");
  const [reqLoading, setReqLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    sbGetAllCourses()
      .then((rows) => { setCourses(rows.filter((c) => (c.status || "approved") === "approved")); setLoading(false); })
      .catch((e)   => { toast("Could not load courses: "+e.message, "error"); setLoading(false); });
  }, []);

  const categories = ["All", ...new Set(courses.map((c) => c.skill))];
  const filtered = courses.filter((c) => {
    const byCat    = category === "All" || c.skill === category;
    const bySearch = !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.skill?.toLowerCase().includes(search.toLowerCase()) ||
      c.mentor_name?.toLowerCase().includes(search.toLowerCase()) ||
      (c.topics||[]).some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return byCat && bySearch;
  });

  const handleRequest = async (course) => {
    if (!course?.id)                                 { toast("Course data missing. Refresh.", "error"); return; }
    if ((profile.credits||0) < (course.credits||1)) { toast("Not enough credits", "error"); return; }
    if (profile.uid === course.mentor_uid)           { toast("You can't book your own course.", "error"); return; }
    setReqLoading(true);
    try {
      await sbInsertRequest({
        learner_uid: profile.uid, learner_name: profile.displayName,
        mentor_uid: course.mentor_uid, mentor_name: course.mentor_name,
        skill: course.skill, course_id: course.id, course_title: course.title,
        status: "pending", credit_escrow: true, confirmed_by: {},
        meet_link: "", zoom_meeting_id: null, zoom_password: null,
      });
      toast("Zoom request sent! Credit deducted on approval 🔒", "success");
    } catch (e) { toast("Request failed: " + e.message, "error"); }
    setReqLoading(false);
  };

  return (
    <div>
      <UrgentMentorConnect profile={profile} />
      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(140px,100%),1fr))", gap:12, marginBottom:28 }}>
        {[
          { label:"Courses",      value:courses.length,      icon:BookOpen, color:"#60a5fa" },
          { label:"Your Credits", value:profile.credits||0,  icon:Coins,    color:T.pink },
          { label:"Categories",   value:categories.length-1, icon:Globe,    color:"#a78bfa" },
        ].map(({ label, value, icon:Icon, color }) => (
          <div key={label} style={{ ...cardStyle({ padding:"14px 18px" }), display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:color+"18",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:22, lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position:"relative", marginBottom:16 }}>
        <Search size={15} color={T.muted} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses, skills or mentors…"
          style={{ width:"100%", padding:"12px 14px 12px 40px", borderRadius:12,
            border:`1px solid ${T.border}`, background:"#0A0A12",
            fontSize:14, outline:"none", color:T.text }} />
      </div>

      {/* Category pills */}
      {categories.length > 1 && (
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:6, marginBottom:20 }}>
          {categories.map((cat) => (
            <motion.button key={cat} whileTap={{ scale:0.93 }} onClick={() => setCategory(cat)}
              style={{ ...pillStyle(category===cat, false, { whiteSpace:"nowrap", padding:"8px 16px", fontSize:13 }) }}>
              {cat}
            </motion.button>
          ))}
        </div>
      )}

      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:16 }}>
          {category==="All" ? "All Courses" : category}
          <span style={{ color:T.muted, fontWeight:400, fontSize:14 }}> · {filtered.length} available</span>
        </div>
        {(profile.credits||0) < 1 && (
          <div style={{ background:"#3b0000", color:"#f87171", borderRadius:99,
            padding:"4px 12px", fontSize:12, fontWeight:600 }}>⚠️ Need credits to book</div>
        )}
      </div>

      {/* Course list — single column vertical like Eduphoria */}
      {loading ? (
        <div style={{ textAlign:"center", padding:80, color:T.muted }}>
          <Loader2 size={28} className="spin" style={{ marginBottom:10 }} />
          <div style={{ fontSize:14 }}>Loading courses…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...cardStyle({ padding:"80px 20px" }), textAlign:"center", color:T.muted }}>
          <BookOpen size={40} style={{ marginBottom:16, opacity:0.2 }} />
          <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>
            {courses.length === 0 ? "No courses yet" : "No courses match your search"}
          </div>
          <div style={{ fontSize:14 }}>
            {courses.length === 0 ? "Mentors haven't published any courses yet." : "Try a different search."}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <AnimatePresence>
            {filtered.map((course, i) => (
              <motion.div key={course.id}
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0 }} transition={{ delay:i*0.04 }}>
                <CourseCard course={course} profile={profile} onRequest={handleRequest} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ██  MENTOR DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
function MentorDashboard({ profile, mentorId, onExit }) {
  const toast = useContext(ToastCtx);
  const [requests,    setRequests]    = useState([]);
  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [coursesLoad, setCoursesLoad] = useState(true);
  const [busy,        setBusy]        = useState({});
  const [tab,         setTab]         = useState("pending");
  const [showCreate,  setShowCreate]  = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [urgentRequests, setUrgentRequests] = useState([]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try { setRequests(await sbGetRequests("mentor_uid", profile.uid)); setLastRefresh(new Date()); }
    catch(e) { toast("Could not load requests: "+e.message, "error"); }
    setLoading(false);
  }, [profile.uid]);

  const fetchCourses = useCallback(async () => {
    setCoursesLoad(true);
    try { setCourses(await sbGetMentorCourses(profile.uid)); }
    catch(e) { toast("Could not load courses: "+e.message, "error"); }
    setCoursesLoad(false);
  }, [profile.uid]);

  useEffect(() => { fetchRequests(); fetchCourses(); }, [fetchRequests, fetchCourses]);
  useEffect(() => { const id = setInterval(fetchRequests, 10000); return () => clearInterval(id); }, [fetchRequests]);
  useEffect(() => rtListen("urgentRequests", (value) => {
    const rows = Object.values(value || {}).filter((r) =>
      r.status === "open" && (!r.requested_mentor_uid || r.requested_mentor_uid === profile.uid)
    );
    setUrgentRequests(rows);
  }), [profile.uid]);

  const setOne = (id, v) => setBusy((p) => ({ ...p, [id]: v }));

  const handleApprove = async (req) => {
    setOne(req.id, "approving");
    try {
      toast("Creating Zoom meeting…", "info");
      let zoomData;
      try {
        zoomData = await createZoomMeeting(profile.email, req.learner_name, req.skill);
      } catch (zoomErr) {
        toast("Zoom unavailable — using fallback link.", "info");
        zoomData = generateFallbackZoomLink(req.skill);
      }
      await sbUpdateRequest(req.id, {
        status: "approved", meet_link: zoomData.joinUrl,
        zoom_meeting_id: zoomData.meetingId, zoom_password: zoomData.password,
        confirmed_by: { mentor: true },
      });
      const lc = await rtGet(`users/${req.learner_uid}/credits`);
      if ((lc||0) >= 1) {
        await rtUpdate(`users/${req.learner_uid}`, { credits: (lc||0) - 1 });
        toast("Approved! Zoom link created. 1 credit deducted ✅", "success");
      } else {
        toast("Approved (learner has no credits).", "info");
      }
      const ms = await rtGet(`users/${profile.uid}/sessionsAsMentor`);
      await rtUpdate(`users/${profile.uid}`, { sessionsAsMentor: (ms||0)+1 });
      fetchRequests();
    } catch(e) { toast("Approve failed: " + e.message, "error"); }
    setOne(req.id, false);
  };

  const handleDecline = async (req) => {
    setOne(req.id, "declining");
    try {
      await sbUpdateRequest(req.id, { status: "declined" });
      toast("Request declined.", "info");
      fetchRequests();
    } catch(e) { toast(e.message, "error"); }
    setOne(req.id, false);
  };

  const handleDeleteRequest = async (req) => {
    if (!window.confirm(`Delete this request from ${req.learner_name}?`)) return;
    setOne(req.id, "deleting");
    try {
      await sbDeleteRequest(req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast("Request deleted.", "info");
    } catch(e) { toast("Delete failed: " + e.message, "error"); }
    setOne(req.id, false);
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await sbDeleteCourse(courseId);
      setCourses((p) => p.filter((c) => c.id !== courseId));
      toast("Course deleted.", "info");
    } catch(e) { toast(e.message, "error"); }
  };

  const handleAcceptUrgent = async (req) => {
    try {
      const zoomData = generateFallbackZoomLink(req.topic);
      await acceptUrgentRequestSecure(req, profile, zoomData);
      await rtUpdate(`urgentRequests/${req.id}`, {
        status: "accepted", accepted_by_uid: profile.uid,
        accepted_by_name: profile.displayName, meet_link: zoomData.joinUrl,
      });
      setUrgentRequests((rows) => rows.filter((row) => row.id !== req.id));
      toast("Urgent request accepted. Meeting link created.", "success");
    } catch(e) { toast("Accept failed: " + e.message, "error"); }
  };

  const filtered = requests.filter((r) => {
    if (tab==="pending")  return r.status==="pending";
    if (tab==="approved") return ["approved","confirming","completed"].includes(r.status);
    if (tab==="declined") return r.status==="declined";
    return true;
  });
  const pendingCount  = requests.filter((r) => r.status==="pending").length;
  const approvedCount = requests.filter((r) => ["approved","confirming","completed"].includes(r.status)).length;
  const stats = [
    { label:"Pending",  value:pendingCount,                icon:Clock,       color:"#fbbf24", bg:"#3b2200" },
    { label:"Approved", value:approvedCount,               icon:CheckCircle, color:T.success, bg:"#052e1e" },
    { label:"Courses",  value:courses.length,              icon:BookOpen,    color:T.pink,    bg:T.pinkDim },
    { label:"Sessions", value:profile.sessionsAsMentor||0, icon:Award,       color:"#60a5fa", bg:"#0d2137" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:T.bg }}>
      <GlobalStyles />
      {/* Mentor navbar */}
      <div style={{
        display:"flex", justifyContent:"center", padding:"12px 24px",
        position:"sticky", top:0, zIndex:100,
        background:"rgba(10,10,15,0.9)", backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${T.border}`,
      }}>
        <div style={{
          display:"flex", alignItems:"center", gap:8,
          background:T.surface, border:`1px solid ${T.border}`,
          borderRadius:999, padding:"6px 8px",
          boxShadow:"0 4px 24px rgba(0,0,0,0.5)",
          width:"100%", maxWidth:"100%", justifyContent:"space-between",
        }}>
          <ModeToggle isMentor={true} onToggle={onExit} />
          <div style={{ display:"flex", alignItems:"center", gap:4, padding:"0 8px" }}>
            <span style={{ fontWeight:700, fontSize:13, color:T.text }}>Mentor Dashboard</span>
            <span style={{ fontSize:11, color:T.muted, marginLeft:4 }}>ID: {mentorId}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, background:"#0A0A12",
              border:`1px solid ${T.border}`, borderRadius:999, padding:"7px 14px" }}>
              <Coins size={13} color={T.pink} className="pulse" />
              <AnimatedCredits value={profile.credits||0} size={14} />
              <span style={{ fontSize:11, color:T.muted }}>credits</span>
            </div>
            <ProfileAvatar profile={profile} size={32} />
          </div>
        </div>
      </div>

      <main style={{ width:"100%", maxWidth:"100%", padding:"28px 32px 60px" }}>
        <div style={{ maxWidth:1400, margin:"0 auto" }}>
          {urgentRequests.length > 0 && (
            <div style={{ ...cardStyle({ marginBottom:18, borderColor:T.pink }), display:"grid", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, fontWeight:800 }}><Bell size={16} color={T.pink} /> Urgent mentor requests</div>
              {urgentRequests.slice(0, 3).map((req) => (
                <div key={req.id} style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"center", flexWrap:"wrap", background:T.alt, borderRadius:10, padding:12 }}>
                  <div><div style={{ fontWeight:700 }}>{req.topic}</div><div style={{ color:T.muted, fontSize:13 }}>{req.learner_name}: {req.question || "Needs immediate help"}</div></div>
                  <button onClick={() => handleAcceptUrgent(req)} style={pillStyle(false, true, { padding:"8px 12px" })}><Check size={14} /> Accept</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
            flexWrap:"wrap", gap:12, marginBottom:28 }}>
            <div>
              <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:"-1px", marginBottom:4 }}>
                Welcome back, {profile.displayName?.split(" ")?.[0] || "Mentor"} 👋
              </h1>
              <div style={{ fontSize:14, color:T.muted, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <RefreshCw size={13} />
                Last updated: {lastRefresh.toLocaleTimeString()} · auto-refreshes every 10s
                <motion.button whileTap={{ scale:0.9 }} onClick={fetchRequests}
                  style={{ background:T.pinkDim, border:"none", cursor:"pointer",
                    fontSize:13, color:T.pink, fontWeight:600, fontFamily:"inherit",
                    padding:"2px 10px", borderRadius:8 }}>
                  Refresh now
                </motion.button>
              </div>
            </div>
            <motion.button whileTap={{ scale:0.96 }} onClick={() => setShowCreate(true)}
              style={{ ...pillStyle(false, true, { padding:"11px 20px", fontSize:14 }) }}>
              <Plus size={15} /> Create Course
            </motion.button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:28 }}>
            {stats.map(({ label, value, icon:Icon, color, bg }) => (
              <div key={label} style={{ ...cardStyle({ padding:"16px 18px" }), display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:bg,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon size={17} color={color} />
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:24, lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Courses section */}
          <div style={{ ...cardStyle({ marginBottom:28 }) }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>My Courses</div>
                <div style={{ fontSize:13, color:T.muted }}>Published to the Marketplace</div>
              </div>
              <motion.button whileTap={{ scale:0.96 }} onClick={() => setShowCreate(true)}
                style={{ ...pillStyle(false, false, { padding:"8px 14px", fontSize:13 }) }}>
                <Plus size={13} /> New Course
              </motion.button>
            </div>
            {coursesLoad ? (
              <div style={{ textAlign:"center", padding:40, color:T.muted }}><Loader2 size={22} className="spin" /></div>
            ) : courses.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:T.muted }}>
                <BookOpen size={32} style={{ marginBottom:10, opacity:0.3 }} />
                <div style={{ fontWeight:600, fontSize:14, marginBottom:6 }}>No courses yet</div>
                <motion.button whileTap={{ scale:0.95 }} onClick={() => setShowCreate(true)}
                  style={{ ...pillStyle(false, true, { marginTop:16, padding:"10px 20px", fontSize:14 }) }}>
                  <Plus size={14} /> Create First Course
                </motion.button>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
                {courses.map((course) => {
                  const Icon      = SKILL_ICONS[course.skill] || BookOpen;
                  const iconColor = SKILL_COLORS[course.skill] || "#60a5fa";
                  const iconBg    = SKILL_BG[course.skill]    || "#0d2137";
                  return (
                    <div key={course.id} style={{ background:T.alt, borderRadius:14, padding:16, border:`1px solid ${T.border}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        {course.mentor_photo
                          ? <img src={course.mentor_photo} alt=""
                              style={{ width:40, height:40, borderRadius:10, objectFit:"cover" }} />
                          : <div style={{ width:40, height:40, borderRadius:10, background:iconBg,
                              display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <Icon size={18} color={iconColor} />
                            </div>}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:14,
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {course.title}
                          </div>
                          <div style={{ fontSize:12, color:T.muted }}>{course.skill} · {course.level}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"space-between" }}>
                        <span style={{ fontSize:12, color:T.success, background:"#052e1e",
                          borderRadius:99, padding:"3px 10px", fontWeight:600 }}>✓ Live</span>
                        <motion.button whileTap={{ scale:0.9 }} onClick={() => handleDeleteCourse(course.id)}
                          style={{ background:"#3b0000", border:"none", borderRadius:8,
                            padding:"6px 8px", cursor:"pointer", display:"flex", alignItems:"center" }}>
                          <Trash2 size={13} color={T.danger} />
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Session Requests */}
          <div style={{ fontWeight:700, fontSize:18, letterSpacing:"-0.5px", marginBottom:14 }}>Session Requests</div>
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            {[
              { key:"pending",  label:`Pending (${pendingCount})`   },
              { key:"approved", label:`Approved (${approvedCount})` },
              { key:"declined", label:"Declined" },
              { key:"all",      label:"All" },
            ].map(({ key, label }) => (
              <motion.button key={key} whileTap={{ scale:0.93 }} onClick={() => setTab(key)}
                style={{ ...pillStyle(tab===key, false, { padding:"9px 18px", fontSize:13 }) }}>
                {label}
              </motion.button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign:"center", padding:80, color:T.muted }}><Loader2 size={28} className="spin" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ ...cardStyle({ padding:"60px 20px" }), textAlign:"center", color:T.muted }}>
              <MessageSquare size={32} style={{ marginBottom:12, opacity:0.3 }} />
              <div style={{ fontWeight:600, fontSize:15, marginBottom:6 }}>No {tab} requests</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <AnimatePresence>
                {filtered.map((req) => (
                  <MentorRequestCard key={req.id} req={req}
                    busy={busy[req.id]}
                    onApprove={handleApprove}
                    onDecline={handleDecline}
                    onDelete={handleDeleteRequest} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showCreate && (
          <CreateCourseModal profile={profile} mentorId={mentorId}
            onClose={() => setShowCreate(false)}
            onCreated={(row) => setCourses((p) => [row, ...p])} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── MENTOR REQUEST CARD ───────────────────────────────────────────────────────
function MentorRequestCard({ req, busy, onApprove, onDecline, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isNonPending = ["approved","confirming","completed","declined"].includes(req.status);

  return (
    <motion.div layout initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, scale:0.97 }}
      style={{ ...cardStyle({ padding:0 }), overflow:"hidden" }}>
      <div style={{ padding:"18px 20px", display:"flex", flexWrap:"wrap",
        alignItems:"center", justifyContent:"space-between", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, flex:1, minWidth:0 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:T.pink,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"#fff", fontWeight:800, fontSize:18, flexShrink:0 }}>
            {(req.learner_name?.[0]||"?").toUpperCase()}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:3 }}>
              {req.learner_name}
              <span style={{ color:T.muted, fontWeight:400, fontSize:13 }}> wants to learn </span>
              <span style={{ fontWeight:700, color:T.pink }}>{req.skill}</span>
              {req.course_title && (
                <span style={{ color:T.muted, fontWeight:400, fontSize:13 }}> · {req.course_title}</span>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <StatusBadge status={req.status} />
              <span style={{ fontSize:12, color:T.muted, display:"flex", alignItems:"center", gap:4 }}>
                <Calendar size={11} /> {formatTime(req.created_at)}
              </span>
              <span style={{ fontSize:12, color:"#60a5fa", background:"#0d2137",
                borderRadius:99, padding:"2px 8px", fontWeight:600,
                display:"flex", alignItems:"center", gap:4 }}>
                <Video size={11} /> Zoom
              </span>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          {req.status==="pending" && (
            <>
              <motion.button whileTap={{ scale:0.93 }}
                disabled={!!busy} onClick={() => onApprove(req)}
                style={{ ...pillStyle(false, false, { padding:"9px 18px", fontSize:13,
                  opacity:busy?0.5:1, background:"#16A34A", color:"#fff" }) }}>
                {busy==="approving"
                  ? <><Loader2 size={13} className="spin" /> Creating Zoom…</>
                  : <><CheckCircle size={13} /> Approve &amp; Create Zoom</>}
              </motion.button>
              <motion.button whileTap={{ scale:0.93 }}
                disabled={!!busy} onClick={() => onDecline(req)}
                style={{ ...pillStyle(false, false, { padding:"9px 18px", fontSize:13,
                  opacity:busy?0.5:1, color:T.danger, border:`1px solid ${T.danger}30` }) }}>
                {busy==="declining"
                  ? <><Loader2 size={13} className="spin" /> Declining…</>
                  : <><XCircle size={13} /> Decline</>}
              </motion.button>
            </>
          )}

          {["approved","confirming","completed"].includes(req.status) && req.meet_link && (
            <a href={req.meet_link} target="_blank" rel="noopener noreferrer"
              style={{ ...pillStyle(false, true, { padding:"9px 18px", fontSize:13, textDecoration:"none" }) }}>
              <Video size={13} /> Join Zoom
            </a>
          )}

          {isNonPending && (
            <motion.button whileTap={{ scale:0.93 }}
              disabled={busy==="deleting"} onClick={() => onDelete(req)}
              style={{ background:"#3b0000", border:"none", borderRadius:10,
                padding:"9px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                fontSize:13, fontWeight:600, color:T.danger,
                opacity:busy==="deleting"?0.5:1 }}>
              {busy==="deleting" ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
              {busy==="deleting" ? "Deleting…" : "Delete"}
            </motion.button>
          )}

          <motion.button whileTap={{ scale:0.93 }} onClick={() => setExpanded(!expanded)}
            style={{ ...pillStyle(false, false, { padding:"9px 14px", fontSize:13 }) }}>
            <ChevronRight size={14} style={{ transform:expanded?"rotate(90deg)":"rotate(0deg)", transition:"0.2s" }} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} style={{ overflow:"hidden" }}>
            <div style={{ borderTop:`1px solid ${T.border}`, padding:"16px 20px",
              background:T.alt, display:"grid",
              gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:T.muted, marginBottom:6,
                  textTransform:"uppercase", letterSpacing:"0.05em" }}>Learner ID</div>
                <div style={{ fontSize:13, fontFamily:"monospace", color:"#93c5fd" }}>{req.learner_uid?.slice(0,16)}…</div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:T.muted, marginBottom:6,
                  textTransform:"uppercase", letterSpacing:"0.05em" }}>Course ID</div>
                <div style={{ fontSize:13, fontFamily:"monospace", color:"#93c5fd" }}>{req.course_id || "—"}</div>
              </div>
              {req.zoom_meeting_id && (
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:T.muted, marginBottom:6,
                    textTransform:"uppercase", letterSpacing:"0.05em" }}>Zoom Meeting ID</div>
                  <div style={{ fontSize:13, fontFamily:"monospace", color:"#93c5fd" }}>{req.zoom_meeting_id}</div>
                </div>
              )}
              {req.zoom_password && (
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:T.muted, marginBottom:6,
                    textTransform:"uppercase", letterSpacing:"0.05em" }}>Password</div>
                  <div style={{ fontSize:13, fontFamily:"monospace", color:"#93c5fd" }}>{req.zoom_password}</div>
                </div>
              )}
              {req.meet_link && (
                <div style={{ gridColumn:"1/-1" }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.muted, marginBottom:6,
                    textTransform:"uppercase", letterSpacing:"0.05em" }}>Zoom Link</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, fontSize:12, color:"#60a5fa", fontFamily:"monospace",
                      background:"#0d2137", borderRadius:8, padding:"8px 12px",
                      wordBreak:"break-all", lineHeight:1.5 }}>{req.meet_link}</div>
                    <a href={req.meet_link} target="_blank" rel="noopener noreferrer"
                      style={{ ...pillStyle(false, false, { padding:"8px 12px", fontSize:12, textDecoration:"none" }) }}>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ██  REQUESTS PAGE
// ═════════════════════════════════════════════════════════════════════════════
function Requests({ profile }) {
  const toast = useContext(ToastCtx);
  const [tab,      setTab]      = useState("outgoing");
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [busy,     setBusy]     = useState({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const field = tab==="incoming" ? "mentor_uid" : "learner_uid";
      setRequests(await sbGetRequests(field, profile.uid));
    } catch(e) { toast("Could not load requests: "+e.message, "error"); }
    setLoading(false);
  }, [tab, profile.uid]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { const id = setInterval(fetchRequests, 8000); return () => clearInterval(id); }, [fetchRequests]);

  const setOne = (id, v) => setBusy((p) => ({ ...p, [id]: v }));

  const confirm = async (req) => {
    setOne(req.id, true);
    const myRole      = profile.uid===req.mentor_uid ? "mentor" : "learner";
    const confirmedBy = { ...(req.confirmed_by||{}), [myRole]: true };
    const both        = confirmedBy.mentor && confirmedBy.learner;
    try {
      await sbUpdateRequest(req.id, { confirmed_by:confirmedBy, status:both?"completed":"confirming" });
      if (both) {
        const mc  = await rtGet(`users/${req.mentor_uid}/credits`);
        const me  = await rtGet(`users/${req.mentor_uid}/totalEarned`);
        const ms  = await rtGet(`users/${req.mentor_uid}/sessionsAsMentor`);
        const mst = await rtGet(`users/${req.mentor_uid}/streak`);
        await rtUpdate(`users/${req.mentor_uid}`, {
          credits:(mc||0)+1, totalEarned:(me||0)+1,
          sessionsAsMentor:(ms||0)+1, streak:(mst||0)+1,
        });
        const ls      = await rtGet(`users/${req.learner_uid}/sessionsAsLearner`);
        const lSkills = await rtGet(`users/${req.learner_uid}/skills`) || [];
        const exists  = lSkills.some((s) => (typeof s==="string"?s:s.name)===req.skill);
        await rtUpdate(`users/${req.learner_uid}`, {
          sessionsAsLearner: (ls||0)+1,
          skills: exists
            ? lSkills.map((s) => { const n=typeof s==="string"?s:s.name; return n===req.skill?{name:n,count:(s.count||1)+1}:s; })
            : [...lSkills, { name:req.skill, count:1 }],
        });
      }
      toast(both?"Both confirmed! Credits settled 🎉":"Confirmed! Waiting for other party…","success");
      fetchRequests();
    } catch(e) { toast(e.message,"error"); }
    setOne(req.id, false);
  };

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {["outgoing","incoming"].map((t) => (
          <motion.button key={t} whileTap={{ scale:0.93 }} onClick={() => setTab(t)}
            style={{ ...pillStyle(tab===t, false, { padding:"9px 20px", textTransform:"capitalize" }) }}>
            {t}
          </motion.button>
        ))}
      </div>
      {loading
        ? <div style={{ textAlign:"center", padding:80, color:T.muted }}><Loader2 size={24} className="spin" /></div>
        : requests.length === 0
        ? <div style={{ textAlign:"center", padding:80, color:T.muted, fontSize:14 }}>No {tab} requests yet.</div>
        : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {requests.map((req) => {
              const myRole    = profile.uid===req.mentor_uid ? "mentor" : "learner";
              const confirmed = req.confirmed_by?.[myRole];
              const showConfirm = (req.status==="approved"||req.status==="confirming") && !confirmed;
              return (
                <motion.div key={req.id} layout initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  style={{ ...cardStyle() }}>
                  <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center",
                    justifyContent:"space-between", gap:12 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>
                        {tab==="incoming" ? req.learner_name : req.mentor_name}
                        <span style={{ color:T.muted, fontWeight:400, fontSize:13 }}> — {req.skill}</span>
                        {req.course_title && (
                          <span style={{ color:T.muted, fontWeight:400, fontSize:13 }}> · {req.course_title}</span>
                        )}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <StatusBadge status={req.status} />
                        {req.created_at && (
                          <span style={{ fontSize:12, color:T.muted }}>
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        )}
                        <span style={{ fontSize:12, color:"#60a5fa", background:"#0d2137",
                          borderRadius:99, padding:"2px 8px", fontWeight:600,
                          display:"flex", alignItems:"center", gap:4 }}>
                          <Video size={11} /> Zoom
                        </span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {req.status==="approved" && req.meet_link && (
                        <a href={req.meet_link} target="_blank" rel="noopener noreferrer"
                          style={{ ...pillStyle(false, true, { padding:"8px 16px", fontSize:13, textDecoration:"none" }) }}>
                          <Video size={13} /> Join Zoom
                        </a>
                      )}
                      {showConfirm && (
                        <motion.button whileTap={{ scale:0.93 }}
                          disabled={busy[req.id]} onClick={() => confirm(req)}
                          style={{ ...pillStyle(false, false, { padding:"8px 16px", fontSize:13 }) }}>
                          {busy[req.id] ? <Loader2 size={13} className="spin" /> : <Check size={13} />}
                          Confirm Done
                        </motion.button>
                      )}
                    </div>
                  </div>
                  {req.meet_link && (
                    <div style={{ marginTop:14, background:"#0d2137", borderRadius:10,
                      padding:"10px 14px", fontSize:12, color:"#60a5fa",
                      display:"flex", alignItems:"center", gap:8, wordBreak:"break-all" }}>
                      <Video size={13} style={{ flexShrink:0 }} />
                      <span style={{ flex:1 }}>{req.meet_link}</span>
                      <a href={req.meet_link} target="_blank" rel="noopener noreferrer" style={{ color:"#60a5fa", flexShrink:0 }}>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ██  PROFILE PAGE
// ═════════════════════════════════════════════════════════════════════════════
function DiscussionRoom() {
  return (
    <div style={{ ...cardStyle({ padding:0 }), overflow:"hidden", minHeight:"min(760px, calc(100vh - 210px))" }}>
      <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:T.pinkDim,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <MessageSquare size={17} color={T.pink} />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:16 }}>Doubt & Discussion Room</div>
            <div style={{ color:T.muted, fontSize:12 }}>Embedded inside TT</div>
          </div>
        </div>
        <span style={{ color:T.muted, fontSize:12 }}>bhailog-m.vercel.app</span>
      </div>
      <iframe
        title="Doubt and Discussion Room"
        src={DISCUSSION_ROOM_URL}
        style={{ width:"100%", height:"calc(100vh - 250px)", minHeight:620, border:0, display:"block", background:"#fff" }}
        allow="camera; microphone; clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
}

function ProfilePage({ profile }) {
  const toast = useContext(ToastCtx);
  const [selSkills, setSelSkills] = useState(
    (profile.skills||[]).map((s) => typeof s==="string" ? s : s.name)
  );
  const [saving, setSaving] = useState(false);

  const toggle = (s) => setSelSkills((p) => p.includes(s) ? p.filter((x) => x!==s) : [...p, s]);
  const save   = async () => {
    setSaving(true);
    try { await rtUpdate(`users/${profile.uid}`, { skills:selSkills }); toast("Profile saved!","success"); }
    catch(e) { toast(e.message,"error"); }
    setSaving(false);
  };

  const skillObjs = (profile.skills||[])
    .map((s) => typeof s==="string" ? { name:s, count:1 } : s).filter(Boolean);

  const stats = [
    { label:"Credits",   value:<AnimatedCredits value={profile.credits||0} size={26} />, icon:<Coins size={15} color={T.pink} /> },
    { label:"Taught",    value:profile.sessionsAsMentor||0,  icon:<Award size={15} color={T.muted} /> },
    { label:"Learned",   value:profile.sessionsAsLearner||0, icon:<User  size={15} color={T.muted} /> },
    { label:"🔥 Streak", value:profile.streak||0,            icon:<Flame size={15} color="#f97316" /> },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20 }}>
      <div style={{ ...cardStyle() }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:22 }}>
          <div style={{ width:64, height:64, borderRadius:18, overflow:"hidden",
            background:T.alt, flexShrink:0, display:"flex", alignItems:"center",
            justifyContent:"center", color:"#fff", fontSize:26, fontWeight:800,
            border:`2px solid ${T.pink}`, boxShadow:`0 0 0 3px ${T.pinkDim}` }}>
            {profile.photoURL
              ? <img src={profile.photoURL} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : (profile.displayName?.[0]||"?").toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:18 }}>{profile.displayName}</div>
            <div style={{ fontSize:13, color:T.muted }}>{profile.email}</div>
            {profile.mentorId && (
              <div style={{ marginTop:4, fontSize:12, color:T.pink, fontWeight:600,
                background:T.pinkDim, borderRadius:99, padding:"2px 10px", display:"inline-block" }}>
                <Shield size={10} style={{ verticalAlign:"middle", marginRight:4 }} />
                Mentor ID: {profile.mentorId}
              </div>
            )}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:22 }}>
          {stats.map(({ label, value, icon }) => (
            <div key={label} style={{ background:T.alt, borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:4 }}>{icon}</div>
              <div style={{ fontWeight:800, fontSize:22, lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...cardStyle() }}>
        <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>Skills</div>
        <div style={{ fontSize:13, color:T.muted, marginBottom:16 }}>Select skills you can teach or learn</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
          {ALL_SKILLS.map((s) => {
            const sel = selSkills.includes(s);
            return (
              <motion.button key={s} whileTap={{ scale:0.90 }} onClick={() => toggle(s)}
                style={{ ...pillStyle(sel, sel, { padding:"7px 14px", fontSize:13 }) }}>
                {sel && <Check size={11} />} {s}
              </motion.button>
            );
          })}
        </div>
        <motion.button whileTap={{ scale:0.96 }} onClick={save} disabled={saving}
          style={{ ...pillStyle(false, true, { width:"100%", justifyContent:"center", padding:"13px", fontSize:15 }) }}>
          {saving ? <Loader2 size={15} className="spin" /> : null} Save Profile
        </motion.button>
      </div>
      <div style={{ gridColumn:"1/-1" }}>
        <div style={{ ...cardStyle() }}>
          <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>Your Skill Graph</div>
          <div style={{ fontSize:13, color:T.muted, marginBottom:16 }}>Nodes grow with each completed session</div>
          <SkillGraph skills={skillObjs} />
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ██  PROFILE AVATAR
// ═════════════════════════════════════════════════════════════════════════════
function ProfileAvatar({ profile, size = 32 }) {
  const [showMenu, setShowMenu] = useState(false);
  const { logout } = useContext(AuthCtx);

  return (
    <div style={{ position:"relative" }}>
      <motion.div
        whileTap={{ scale:0.92 }}
        onClick={() => setShowMenu((p) => !p)}
        style={{
          width:size, height:size, borderRadius:"50%", overflow:"hidden",
          background:T.alt, display:"flex", alignItems:"center",
          justifyContent:"center", color:"#fff", fontWeight:700,
          fontSize:size * 0.4,
          border:`2px solid ${T.pink}`,
          cursor:"pointer",
          boxShadow:`0 0 0 2px ${T.pinkDim}`,
          flexShrink:0,
        }}>
        {profile?.photoURL
          ? <img src={profile.photoURL} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : (profile?.displayName?.[0]||"?").toUpperCase()}
      </motion.div>
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity:0, y:8, scale:0.95 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:8, scale:0.95 }}
            style={{
              position:"absolute", top:size+8, right:0,
              background:T.surface, border:`1px solid ${T.border}`,
              borderRadius:14, padding:12, zIndex:999,
              minWidth:200, boxShadow:"0 8px 32px rgba(0,0,0,0.7)",
            }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12,
              paddingBottom:12, borderBottom:`1px solid ${T.border}` }}>
              <div style={{ width:36, height:36, borderRadius:10, overflow:"hidden",
                flexShrink:0, border:`1.5px solid ${T.pink}` }}>
                {profile?.photoURL
                  ? <img src={profile.photoURL} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <div style={{ width:"100%", height:"100%", background:T.pink,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:14, fontWeight:800, color:"#fff" }}>
                      {(profile?.displayName?.[0]||"?").toUpperCase()}
                    </div>}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {profile?.displayName}
                </div>
                <div style={{ fontSize:11, color:T.muted,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {profile?.email}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:10, padding:"8px 10px", background:T.alt, borderRadius:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <Coins size={13} color={T.pink} />
                <span style={{ fontSize:13, fontWeight:600 }}>Credits</span>
              </div>
              <span style={{ fontWeight:800, fontSize:15, color:T.pink }}>{profile?.credits || 0}</span>
            </div>
            {profile?.mentorId && (
              <div style={{ display:"flex", alignItems:"center", gap:6,
                marginBottom:10, padding:"6px 10px", background:T.pinkDim, borderRadius:10 }}>
                <Shield size={12} color={T.pink} />
                <span style={{ fontSize:12, color:T.pink, fontWeight:600 }}>{profile.mentorId}</span>
              </div>
            )}
            <motion.button whileTap={{ scale:0.95 }} onClick={() => { logout(); setShowMenu(false); }}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:8,
                padding:"8px 10px", background:"#3b0000", border:"none",
                borderRadius:10, cursor:"pointer", color:T.danger, fontWeight:600, fontSize:13,
                fontFamily:"inherit" }}>
              <LogOut size={13} /> Sign Out
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {showMenu && (
        <div style={{ position:"fixed", inset:0, zIndex:998 }} onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ██  MODE TOGGLE
// ═════════════════════════════════════════════════════════════════════════════
function ModeToggle({ isMentor, onToggle }) {
  return (
    <motion.button
      whileTap={{ scale:0.93 }}
      onClick={onToggle}
      title={isMentor ? "Switch to Learner" : "Switch to Mentor"}
      style={{
        position:"relative",
        display:"inline-flex",
        alignItems:"center",
        background:"#0A0A12",
        border:`1px solid ${T.border}`,
        borderRadius:999,
        padding:"4px",
        cursor:"pointer",
        gap:0,
        flexShrink:0,
        overflow:"hidden",
        width:72,
      }}>
      <motion.div
        animate={{ x: isMentor ? "100%" : "0%" }}
        transition={{ type:"spring", stiffness:400, damping:30 }}
        style={{
          position:"absolute",
          left:4, top:4, bottom:4,
          width:"calc(50% - 4px)",
          background: isMentor ? T.pink : "#FFFFFF",
          borderRadius:999,
          zIndex:0,
        }}
      />
      <div style={{
        position:"relative", zIndex:1,
        width:32, height:28,
        display:"flex", alignItems:"center", justifyContent:"center",
        color: isMentor ? T.muted : "#0A0A0F",
        transition:"color 0.2s",
      }}>
        <User size={14} />
      </div>
      <div style={{
        position:"relative", zIndex:1,
        width:32, height:28,
        display:"flex", alignItems:"center", justifyContent:"center",
        color: isMentor ? "#fff" : T.muted,
        transition:"color 0.2s",
      }}>
        <Shield size={14} />
      </div>
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ██  MENTOR ID GATE
// ═════════════════════════════════════════════════════════════════════════════
function MentorApplicationForm({ profile, onContinueAsLearner }) {
  const toast = useContext(ToastCtx);
  const portfolioRef = useRef();
  const idRef = useRef();
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState({ portfolio: null, govId: null });
  const [form, setForm] = useState({
    fullName: profile.displayName || "",
    email: profile.email || "",
    phone: "",
    skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
    linkedin: "",
    experience: "",
    whyMentor: "",
  });

  useEffect(() => {
    sbGetMyMentorApplication(profile.uid)
      .then(setExisting)
      .catch((e) => toast("Could not load application status: " + e.message, "error"))
      .finally(() => setLoading(false));
  }, [profile.uid]);

  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const inputStyle = { width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${T.border}`, background:"#0A0A12", fontSize:14, outline:"none", color:T.text };

  const submit = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.skills.trim()) {
      toast("Name, email and skills are required.", "error"); return;
    }
    setSaving(true);
    try {
      const portfolioUrl = files.portfolio ? await sbUploadFile("mentor-applications", profile.uid, files.portfolio) : "";
      const governmentIdUrl = files.govId ? await sbUploadFile("mentor-applications", profile.uid, files.govId) : "";
      const row = await sbInsertMentorApplication({
        user_uid: profile.uid,
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        linkedin: form.linkedin.trim(),
        experience: form.experience.trim(),
        portfolio_url: portfolioUrl,
        government_id_url: governmentIdUrl,
        why_mentor: form.whyMentor.trim(),
        status: "pending",
      });
      setExisting(row);
      toast("Application submitted. You will receive an email when approved.", "success");
    } catch(e) { toast(e.message, "error"); }
    setSaving(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, padding:20, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <GlobalStyles />
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ width:"100%", maxWidth:720 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:T.pinkDim, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Shield size={19} color={T.pink} />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:22 }}>Mentor Verification</div>
            <div style={{ fontSize:13, color:T.muted }}>Submit your profile for admin approval.</div>
          </div>
        </div>
        <div style={cardStyle({ padding:22 })}>
          {loading ? (
            <div style={{ padding:40, textAlign:"center", color:T.muted }}><Loader2 className="spin" /></div>
          ) : existing ? (
            <div style={{ display:"grid", gap:14 }}>
              <StatusBadge status={existing.status} />
              <div style={{ fontSize:18, fontWeight:800 }}>
                {existing.status === "approved" ? "Application approved" : existing.status === "rejected" ? "Application rejected" : "Application submitted"}
              </div>
              <p style={{ color:T.muted, lineHeight:1.6 }}>
                {existing.status === "approved"
                  ? `Your Mentor ID is ${existing.mentor_id || "being synced"}. Use the Mentor Dashboard button again after your profile refreshes.`
                  : existing.status === "rejected"
                  ? (existing.admin_note || "Please review your details and contact support before applying again.")
                  : "You will receive an email when an admin approves your mentor profile."}
              </p>
            </div>
          ) : (
            <div style={{ display:"grid", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:12 }}>
                <input value={form.fullName} onChange={(e) => upd("fullName", e.target.value)} placeholder="Full name" style={inputStyle} />
                <input value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="Email" style={inputStyle} />
                <input value={form.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="Phone" style={inputStyle} />
                <input value={form.linkedin} onChange={(e) => upd("linkedin", e.target.value)} placeholder="LinkedIn URL" style={inputStyle} />
              </div>
              <input value={form.skills} onChange={(e) => upd("skills", e.target.value)} placeholder="Skills / expertise, comma separated" style={inputStyle} />
              <textarea value={form.experience} onChange={(e) => upd("experience", e.target.value)} rows={3} placeholder="Experience" style={{ ...inputStyle, resize:"vertical" }} />
              <textarea value={form.whyMentor} onChange={(e) => upd("whyMentor", e.target.value)} rows={4} placeholder="Why do you want to mentor?" style={{ ...inputStyle, resize:"vertical" }} />
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <input ref={portfolioRef} type="file" style={{ display:"none" }} onChange={(e) => setFiles((p) => ({ ...p, portfolio:e.target.files?.[0] || null }))} />
                <input ref={idRef} type="file" style={{ display:"none" }} onChange={(e) => setFiles((p) => ({ ...p, govId:e.target.files?.[0] || null }))} />
                <button onClick={() => portfolioRef.current?.click()} style={pillStyle(false, false, { padding:"9px 14px" })}><FileText size={14} />{files.portfolio?.name || "Portfolio"}</button>
                <button onClick={() => idRef.current?.click()} style={pillStyle(false, false, { padding:"9px 14px" })}><Upload size={14} />{files.govId?.name || "Government ID optional"}</button>
              </div>
              <button disabled={saving} onClick={submit} style={pillStyle(false, true, { width:"100%", justifyContent:"center", padding:"13px", opacity:saving?0.6:1 })}>
                {saving ? <><Loader2 size={15} className="spin" /> Submitting...</> : <><Shield size={15} /> Submit Mentor Verification Form</>}
              </button>
            </div>
          )}
        </div>
        <button onClick={onContinueAsLearner} style={{ ...pillStyle(false, false, { width:"100%", justifyContent:"center", marginTop:12 }) }}>
          <User size={14} /> Continue as Learner
        </button>
      </motion.div>
    </div>
  );
}

function MentorIdGate({ profile, onEnterMentorDashboard, onContinueAsLearner }) {
  const [mentorEmail, setMentorEmail] = useState(profile?.email || "");
  const [mentorId,  setMentorId]  = useState(profile?.mentorId || "");
  const [error,     setError]     = useState("");
  const [checking,  setChecking]  = useState(false);
  const [generated, setGenerated] = useState(false);
  const toast = useContext(ToastCtx);

  if (!profile?.mentorId) {
    return <MentorApplicationForm profile={profile} onContinueAsLearner={onContinueAsLearner} />;
  }

  const handleGenerate = async () => {
    setChecking(true); setError("");
    try {
      let newId = "";
      let attempts = 0;
      do {
        newId = generateMentorId();
        attempts++;
        if (attempts > 15) { setError("Failed to generate unique ID. Try again."); setChecking(false); return; }
      } while (await mentorIdExists(newId));
      const stored = await storeMentorId(profile.uid, newId);
      if (!stored) { setError("Failed to save Mentor ID. Check your connection."); setChecking(false); return; }
      setMentorId(newId); setGenerated(true);
      toast(`Mentor ID generated: ${newId} 🎉`, "success");
      setTimeout(() => onEnterMentorDashboard(newId), 900);
    } catch (e) { setError(e.message || "Unknown error occurred."); }
    setChecking(false);
  };

  const handleEnter = async () => {
    if (mentorEmail.trim().toLowerCase() !== profile.email.toLowerCase()) {
      setError("Email must match your approved mentor account."); return;
    }
    if (!mentorId.trim()) { setError("Please enter your Mentor ID."); return; }
    setChecking(true); setError("");
    try {
      const isValid = await verifyMentorId(mentorId.trim().toUpperCase(), profile.uid);
      if (!isValid) { setError("Invalid Mentor ID or it doesn't belong to your account."); setChecking(false); return; }
      await rtUpdate(`users/${profile.uid}`, {
        mentorId: mentorId.trim().toUpperCase(), role:"mentor",
        skills: Array.isArray(profile.skills) && profile.skills.length > 0
          ? profile.skills : ["React","Python","SQL"],
      });
      toast("Mentor dashboard unlocked 🎉","success");
      onEnterMentorDashboard(mentorId.trim().toUpperCase());
    } catch(e) { setError(e.message); }
    setChecking(false);
  };

  return (
    <div style={{
      minHeight:"100vh",
      width:"100%",
      background: T.bg,
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      padding:20,
      // Full-width background — no white borders
      backgroundImage: `
        radial-gradient(ellipse 60% 50% at 50% -20%, ${T.pink}18 0%, transparent 70%),
        radial-gradient(ellipse 40% 40% at 80% 80%, #3730a318 0%, transparent 60%)
      `,
    }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ width:"100%", maxWidth:400 }}>

        {/* Profile */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24 }}>
          <div style={{ position:"relative", marginBottom:12 }}>
            <div style={{ width:64, height:64, borderRadius:18, overflow:"hidden",
              border:`2px solid ${T.pink}`, boxShadow:`0 0 0 4px ${T.pinkDim}` }}>
              {profile.photoURL
                ? <img src={profile.photoURL} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ width:"100%", height:"100%", background:T.pink,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:24, fontWeight:800, color:"#fff" }}>
                    {(profile.displayName?.[0]||"?").toUpperCase()}
                  </div>}
            </div>
            <div style={{ position:"absolute", bottom:2, right:2, width:14, height:14,
              borderRadius:"50%", background:T.success, border:"2px solid "+T.bg }} />
          </div>
          <div style={{ fontWeight:700, fontSize:16 }}>{profile.displayName}</div>
          <div style={{ fontSize:13, color:T.muted }}>{profile.email}</div>
        </div>

        {/* Logo pill */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8,
            background:T.surface, border:`1px solid ${T.border}`, borderRadius:14,
            padding:"8px 18px" }}>
            <Zap size={16} color={T.pink} fill={T.pink} />
            <span style={{ color:"#fff", fontWeight:800, fontSize:16 }}>TT</span>
            <span style={{ color:T.muted, fontSize:11 }}>Time Trade</span>
          </div>
        </div>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:T.pinkDim,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Shield size={18} color={T.pink} />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:20, letterSpacing:"-0.5px" }}>
              {profile?.mentorId ? "Welcome Back, Mentor!" : "Become a Mentor"}
            </div>
            <div style={{ fontSize:13, color:T.muted }}>
              Hey {profile.displayName?.split(" ")?.[0] || "there"} 👋
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{ ...cardStyle({ padding:22 }), marginBottom:12 }}>
          <label style={{ fontSize:12, fontWeight:600, color:T.muted, display:"flex",
            alignItems:"center", gap:5, marginBottom:10 }}>
            <Mail size={11} /> Approved Email
          </label>
          <input
            value={mentorEmail}
            onChange={(e) => { setMentorEmail(e.target.value); setError(""); }}
            placeholder="mentor@example.com"
            style={{
              width:"100%", padding:"11px 14px", borderRadius:10,
              border:`1px solid ${T.border}`, background:"#0A0A12",
              fontSize:14, outline:"none", color:T.text, marginBottom:14,
            }}
          />
          <label style={{ fontSize:12, fontWeight:600, color:T.muted, display:"flex",
            alignItems:"center", gap:5, marginBottom:10 }}>
            <Hash size={11} /> Mentor ID
          </label>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <input
              value={mentorId}
              onChange={(e) => { setMentorId(e.target.value.toUpperCase()); setError(""); setGenerated(false); }}
              onKeyDown={(e) => e.key==="Enter" && mentorId && handleEnter()}
              placeholder="e.g. MENTOR001"
              disabled={!!profile?.mentorId || generated}
              style={{
                flex:1, padding:"11px 14px", borderRadius:10,
                border:`1px solid ${error ? T.danger : mentorId && !error ? T.success+"80" : T.border}`,
                background:"#0A0A12", fontSize:14, fontWeight:600,
                letterSpacing:"0.05em", outline:"none", color:T.text,
                opacity:(!!profile?.mentorId || generated) ? 0.7 : 1,
              }}
            />
            {!profile?.mentorId && !generated && (
              <motion.button whileTap={{ scale:0.95 }} onClick={handleGenerate}
                disabled={checking}
                style={{ ...pillStyle(false, true, {
                  padding:"11px 16px", fontSize:13,
                  opacity:checking?0.6:1, cursor:checking?"not-allowed":"pointer",
                  flexShrink:0,
                }) }}>
                {checking ? <Loader2 size={13} className="spin" /> : <><Sparkles size={13} /> Generate</>}
              </motion.button>
            )}
          </div>

          {error && (
            <div style={{ fontSize:12, color:T.danger, marginBottom:12,
              display:"flex", alignItems:"center", gap:6,
              background:"#3b0000", borderRadius:8, padding:"8px 12px" }}>
              <AlertTriangle size={12} /> {error}
            </div>
          )}
          {mentorId && !error && (
            <div style={{ fontSize:12, color:T.success, marginBottom:12,
              background:"#052e1e", borderRadius:8, padding:"8px 12px",
              display:"flex", alignItems:"center", gap:6 }}>
              <CheckCircle size={12} />
              {generated ? "ID generated! Entering dashboard…"
                : profile?.mentorId ? "Your existing Mentor ID is verified"
                : "ID ready — tap Enter Mentor Dashboard"}
            </div>
          )}

          <motion.button whileTap={{ scale:0.96 }} onClick={handleEnter}
            disabled={checking || !mentorId || generated}
            style={{ ...pillStyle(false, true, {
              width:"100%", justifyContent:"center",
              padding:"13px", fontSize:14,
              opacity:(checking || !mentorId || generated) ? 0.6 : 1,
            }) }}>
            {checking ? <><Loader2 size={14} className="spin" /> Verifying…</>
              : generated ? <><Loader2 size={14} className="spin" /> Entering…</>
              : <><LayoutDashboard size={14} /> Enter Mentor Dashboard</>}
          </motion.button>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          <div style={{ flex:1, height:1, background:T.border }} />
          <span style={{ fontSize:12, color:T.muted }}>or</span>
          <div style={{ flex:1, height:1, background:T.border }} />
        </div>
        <motion.button whileTap={{ scale:0.96 }} onClick={onContinueAsLearner}
          style={{ ...pillStyle(false, false, {
            width:"100%", justifyContent:"center", padding:"13px", fontSize:14,
          }) }}>
          <User size={14} /> Continue as Learner
        </motion.button>
      </motion.div>
    </div>
  );
}

// WalletWidget component moved to src/components/WalletWidget.jsx
// LoginScreen moved to src/components/LoginScreen.jsx

// ── PILL NAVBAR ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"marketplace", label:"Marketplace", icon:Globe },
  { id:"requests",    label:"My Requests", icon:MessageSquare },
  { id:"discussion",  label:"Doubt Room",  icon:Users },
  { id:"profile",     label:"Profile",     icon:User },
];

function Navbar({ page, onNav, profile, onLogout, onMentorDash }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav style={{
        position:"sticky", top:0, zIndex:200,
        background:"rgba(10,10,15,0.92)", backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${T.border}`,
        display:"flex", justifyContent:"center", padding:"10px 20px",
        width:"100%",
      }}>
        <div style={{
          display:"flex", alignItems:"center",
          background:T.surface, border:`1px solid ${T.border}`,
          borderRadius:999, padding:"5px 8px",
          boxShadow:"0 4px 24px rgba(0,0,0,0.5)",
          width:"100%", maxWidth:1400, justifyContent:"space-between", gap:6,
        }}>
          {/* Left: logo + mode toggle */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <ModeToggle isMentor={false} onToggle={onMentorDash} />
            <div style={{ display:"flex", alignItems:"center", gap:6,
              padding:"0 8px", borderLeft:`1px solid ${T.border}`, marginLeft:4 }}>
              <Zap size={14} color={T.pink} fill={T.pink} />
              <span style={{ fontWeight:800, fontSize:14, letterSpacing:"-0.5px" }}>TT</span>
            </div>
          </div>

          {/* Center: nav links */}
          <div style={{ display:"flex", gap:2, flex:1, justifyContent:"center" }}
            className="desktop-nav">
            {NAV_ITEMS.map(({ id, label, icon:Icon }) => (
              <motion.button key={id} whileTap={{ scale:0.93 }} onClick={() => onNav(id)}
                style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"8px 16px", borderRadius:999, cursor:"pointer",
                  border:"none", fontFamily:"inherit", fontWeight:600,
                  fontSize:13, transition:"all 0.15s ease",
                  background: page===id ? "#FFFFFF" : "transparent",
                  color:      page===id ? "#0A0A0F"  : T.muted,
                }}>
                <Icon size={13} />{label}
              </motion.button>
            ))}
          </div>

          {/* Right: credits + avatar + hamburger */}
          <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
            <WalletWidget credits={profile?.credits} />
            <ProfileAvatar profile={profile} size={32} />
            <motion.button
              whileTap={{ scale:0.9 }}
              onClick={() => setMenuOpen((p) => !p)}
              style={{
                display:"none",
                width:36, height:36, borderRadius:999,
                background: menuOpen ? T.pink : T.surface,
                border:`1px solid ${menuOpen ? T.pink : T.border}`,
                alignItems:"center", justifyContent:"center",
                cursor:"pointer", flexShrink:0,
              }}
              className="hamburger-btn">
              <motion.div animate={{ rotate: menuOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                {menuOpen ? <X size={16} color="#fff" /> : <Hash size={16} color={T.muted} />}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={closeMenu}
              style={{ position:"fixed", inset:0, zIndex:198,
                background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)" }}
            />
            <motion.div
              initial={{ opacity:0, y:-16, scale:0.95 }}
              animate={{ opacity:1, y:0,   scale:1    }}
              exit={{   opacity:0, y:-16,  scale:0.95 }}
              transition={{ type:"spring", stiffness:400, damping:30 }}
              style={{
                position:"fixed", top:80, left:16, right:16,
                zIndex:199, background:T.surface,
                border:`1px solid ${T.border}`, borderRadius:20,
                padding:12, boxShadow:"0 16px 48px rgba(0,0,0,0.8)",
              }}>
              <div style={{ display:"flex", alignItems:"center", gap:12,
                padding:"12px 14px", background:T.alt, borderRadius:14, marginBottom:10 }}>
                <div style={{ width:40, height:40, borderRadius:12, overflow:"hidden",
                  border:`2px solid ${T.pink}`, flexShrink:0 }}>
                  {profile?.photoURL
                    ? <img src={profile.photoURL} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ width:"100%", height:"100%", background:T.pink,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontWeight:800, color:"#fff" }}>
                        {(profile?.displayName?.[0]||"?").toUpperCase()}
                      </div>}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {profile?.displayName}
                  </div>
                  <div style={{ fontSize:12, color:T.muted,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {profile?.email}
                  </div>
                </div>
                <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5,
                  background:T.pinkDim, borderRadius:99, padding:"4px 10px", flexShrink:0 }}>
                  <Coins size={12} color={T.pink} />
                  <span style={{ fontSize:13, fontWeight:800, color:T.pink }}>{profile?.credits||0}</span>
                </div>
              </div>
              {NAV_ITEMS.map(({ id, label, icon:Icon }) => (
                <motion.button key={id} whileTap={{ scale:0.97 }}
                  onClick={() => { onNav(id); closeMenu(); }}
                  style={{
                    width:"100%", display:"flex", alignItems:"center", gap:12,
                    padding:"13px 16px", borderRadius:14, border:"none",
                    background: page===id ? T.pink : "transparent",
                    color:      page===id ? "#fff"  : T.text,
                    fontFamily:"inherit", fontWeight:600, fontSize:15,
                    cursor:"pointer", marginBottom:4, transition:"background 0.15s",
                  }}>
                  <Icon size={17} />{label}
                  {page===id && <ChevronRight size={14} style={{ marginLeft:"auto" }} />}
                </motion.button>
              ))}
              <div style={{ height:1, background:T.border, margin:"8px 0" }} />
              <motion.button whileTap={{ scale:0.97 }}
                onClick={() => { onMentorDash(); closeMenu(); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:12,
                  padding:"13px 16px", borderRadius:14, border:"none",
                  background:"transparent", color:T.pink,
                  fontFamily:"inherit", fontWeight:600, fontSize:15,
                  cursor:"pointer", marginBottom:4 }}>
                <Shield size={17} />Mentor Dashboard
              </motion.button>
              <motion.button whileTap={{ scale:0.97 }}
                onClick={() => { onLogout(); closeMenu(); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:12,
                  padding:"13px 16px", borderRadius:14, border:"none",
                  background:"#3b0000", color:T.danger,
                  fontFamily:"inherit", fontWeight:600, fontSize:15, cursor:"pointer" }}>
                <LogOut size={17} />Sign Out
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}

// ── FULL LOADER ───────────────────────────────────────────────────────────────
function AdminLogin({ onAuthed, onExit }) {
  const toast = useContext(ToastCtx);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const inputStyle = { width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${T.border}`, background:"#0A0A12", color:T.text, outline:"none" };

  const login = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/login", { method:"POST", body:JSON.stringify({ email, password }) });
      onAuthed(data.token);
      toast("Admin dashboard unlocked.", "success");
    } catch(e) { toast(e.message, "error"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <GlobalStyles />
      <div style={{ width:"100%", maxWidth:420, ...cardStyle({ padding:24 }) }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <Shield color={T.pink} /><div><div style={{ fontWeight:800, fontSize:22 }}>Admin Login</div><div style={{ color:T.muted, fontSize:13 }}>Hidden secure control panel</div></div>
        </div>
        <div style={{ display:"grid", gap:12 }}>
          <div style={{ position:"relative" }}><Mail size={15} color={T.muted} style={{ position:"absolute", left:12, top:13 }} /><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" style={{ ...inputStyle, paddingLeft:38 }} /></div>
          <div style={{ position:"relative" }}><Lock size={15} color={T.muted} style={{ position:"absolute", left:12, top:13 }} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key==="Enter" && login()} placeholder="Password" style={{ ...inputStyle, paddingLeft:38 }} /></div>
          <button disabled={loading} onClick={login} style={pillStyle(false, true, { width:"100%", justifyContent:"center", padding:"13px", opacity:loading?0.6:1 })}>{loading ? <Loader2 className="spin" size={15} /> : <Shield size={15} />} Login</button>
          <button onClick={onExit} style={pillStyle(false, false, { width:"100%", justifyContent:"center" })}>Back to app</button>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ token, onExit }) {
  const toast = useContext(ToastCtx);
  const [tab, setTab] = useState("applications");
  const [data, setData] = useState({ applications:[], users:[], courses:[], urgentRequests:[], logs:[] });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apps, users, courses, urgent, ai] = await Promise.all([
        apiFetch("/api/admin/applications", {}, token),
        apiFetch("/api/admin/users", {}, token),
        apiFetch("/api/admin/courses", {}, token),
        apiFetch("/api/admin/urgent-requests", {}, token),
        apiFetch("/api/admin/ai-usage", {}, token),
      ]);
      setData({ applications:apps.applications||[], users:users.users||[], courses:courses.courses||[], urgentRequests:urgent.urgentRequests||[], logs:ai.logs||[] });
    } catch(e) { toast(e.message, "error"); }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const approveMentor = async (id) => { await apiFetch("/api/admin/approve-mentor", { method:"POST", body:JSON.stringify({ applicationId:id }) }, token); toast("Mentor approved.", "success"); load(); };
  const rejectMentor = async (id) => { await apiFetch(`/api/admin/applications/${id}/reject`, { method:"POST", body:JSON.stringify({ note:"Rejected by admin" }) }, token); toast("Application rejected.", "info"); load(); };
  const setCourseStatus = async (courseId, status) => { await apiFetch("/api/admin/approve-course", { method:"POST", body:JSON.stringify({ courseId, status }) }, token); toast(`Course ${status}.`, "success"); load(); };
  const suspend = async (uid, suspended) => { await apiFetch("/api/admin/suspend-mentor", { method:"POST", body:JSON.stringify({ uid, suspended }) }, token); toast(suspended ? "Mentor suspended." : "Mentor restored.", "info"); load(); };
  const tabs = [
    ["applications", "Mentor Applications", data.applications.length],
    ["users", "Users & Mentors", data.users.length],
    ["courses", "Course Approvals", data.courses.length],
    ["ai", "AI Usage", data.logs.length],
    ["urgent", "Urgent Requests", data.urgentRequests.length],
  ];
  const rowStyle = { display:"grid", gap:8, padding:14, border:`1px solid ${T.border}`, borderRadius:12, background:T.alt };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, padding:"24px 32px" }}>
      <GlobalStyles />
      <div style={{ maxWidth:1400, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"center", marginBottom:20 }}>
          <div><h1 style={{ fontSize:28, fontWeight:800 }}>Admin Dashboard</h1><p style={{ color:T.muted }}>Secure operations for mentorship, courses, AI and urgent requests.</p></div>
          <div style={{ display:"flex", gap:8 }}><button onClick={load} style={pillStyle(false, false)}><RefreshCw size={14} />Refresh</button><button onClick={onExit} style={pillStyle(false, true)}>Exit</button></div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>{tabs.map(([id, label, count]) => <button key={id} onClick={() => setTab(id)} style={pillStyle(tab===id, false, { fontSize:13 })}>{label} ({count})</button>)}</div>
        {loading ? <div style={{ padding:70, textAlign:"center", color:T.muted }}><Loader2 className="spin" /></div> : (
          <div style={{ display:"grid", gap:12 }}>
            {tab==="applications" && data.applications.map((a) => <div key={a.id} style={rowStyle}><div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}><strong>{a.full_name}</strong><StatusBadge status={a.status} /></div><div style={{ color:T.muted }}>{a.email} · {(a.skills||[]).join(", ")}</div><div>{a.why_mentor}</div><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}><button disabled={a.status==="approved"} onClick={() => approveMentor(a.id)} style={pillStyle(false, true, { padding:"8px 12px" })}><Check size={14} />Approve</button><button disabled={a.status==="rejected"} onClick={() => rejectMentor(a.id)} style={pillStyle(false, false, { padding:"8px 12px" })}><XCircle size={14} />Reject</button></div></div>)}
            {tab==="users" && data.users.map((u) => <div key={u.uid} style={rowStyle}><div style={{ display:"flex", justifyContent:"space-between", gap:10 }}><strong>{u.displayName || u.email || u.uid}</strong><span style={{ color:T.muted }}>{u.mentorId || "Learner"}</span></div><div style={{ color:T.muted }}>{u.email}</div><button onClick={() => suspend(u.uid, !u.mentorSuspended)} style={pillStyle(false, false, { width:"fit-content", padding:"8px 12px" })}><Ban size={14} />{u.mentorSuspended ? "Restore" : "Suspend mentor"}</button></div>)}
            {tab==="courses" && data.courses.map((c) => <div key={c.id} style={rowStyle}><div style={{ display:"flex", justifyContent:"space-between", gap:10 }}><strong>{c.title}</strong><StatusBadge status={c.status || "approved"} /></div><div style={{ color:T.muted }}>{c.mentor_name} · {c.skill} · {c.level}</div><div>{c.description || c.subtitle}</div><div style={{ display:"flex", gap:8 }}><button onClick={() => setCourseStatus(c.id, "approved")} style={pillStyle(false, true, { padding:"8px 12px" })}><Check size={14} />Approve</button><button onClick={() => setCourseStatus(c.id, "rejected")} style={pillStyle(false, false, { padding:"8px 12px" })}><XCircle size={14} />Reject</button></div></div>)}
            {tab==="ai" && data.logs.map((l) => <div key={l.id} style={rowStyle}><strong>{l.user_email || l.user_uid || "Guest"}</strong><div style={{ color:T.muted }}>{formatTime(l.created_at)} · {l.mode || "chat"} · {l.tokens || 0} tokens</div><div>{l.prompt}</div></div>)}
            {tab==="urgent" && data.urgentRequests.map((r) => <div key={r.id} style={rowStyle}><div style={{ display:"flex", justifyContent:"space-between" }}><strong>{r.topic}</strong><StatusBadge status={r.status} /></div><div style={{ color:T.muted }}>{r.learner_name} · {formatTime(r.created_at)}</div><div>{r.question}</div></div>)}
          </div>
        )}
      </div>
    </div>
  );
}
function FullLoader() {
  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        border: `3px solid ${T.border}`,
        borderTop: `3px solid ${T.pink}`,
        animation: "spin 1s linear infinite",
      }} />
      <div style={{ color: T.muted, fontSize: 14, fontWeight: 600 }}>Loading…</div>
    </div>
  );
}
// AI chat widget has been moved to src/components/AIChatWidget.jsx

function UrgentMentorConnect({ profile }) {
  const toast = useContext(ToastCtx);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [mentors, setMentors] = useState([]);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [selectedMentorUid, setSelectedMentorUid] = useState("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMentorLoading(true);
    getMentorsForRequest()
      .then((rows) => setMentors(rows.filter((m) => m.uid !== profile.uid)))
      .catch((e) => toast("Could not load mentors: " + e.message, "error"))
      .finally(() => setMentorLoading(false));
  }, [open, profile.uid]);

  const submit = async () => {
    if (!topic.trim()) { toast("Topic is required.", "error"); return; }
    setSaving(true);
    try {
      const selectedMentor = mentors.find((m) => m.uid === selectedMentorUid);
      const row = await createUrgentRequestSecure({
        learner_uid: profile.uid, learner_name: profile.displayName, learner_email: profile.email,
        topic: topic.trim(), question: question.trim(), status: "open",
        requested_mentor_uid: selectedMentor?.uid || "",
        requested_mentor_name: selectedMentor?.displayName || "",
      });
      await rtSet(`urgentRequests/${row.id}`, { ...row, createdAtMs: Date.now() });
      toast(selectedMentor ? `Urgent request sent to ${selectedMentor.displayName}.` : "Urgent request sent to online mentors.", "success");
      setOpen(false); setTopic(""); setQuestion(""); setSelectedMentorUid("all");
    } catch(e) { toast(e.message, "error"); }
    setSaving(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ ...pillStyle(false, true, { marginBottom:18, padding:"12px 18px" }) }}><Bell size={15} /> Connect to Mentor Urgently</button>
      <AnimatePresence>
        {open && <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:650, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <motion.div initial={{ scale:0.92 }} animate={{ scale:1 }} exit={{ scale:0.92 }} onClick={(e) => e.stopPropagation()} style={{ width:"100%", maxWidth:480, ...cardStyle({ padding:22 }) }}>
            <div style={{ fontWeight:800, fontSize:20, marginBottom:12 }}>Urgent Mentor Connect</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:13, color:T.muted, fontWeight:700, marginBottom:8 }}>Choose mentor from Firebase</div>
              <div style={{ display:"grid", gap:8, maxHeight:180, overflowY:"auto", paddingRight:4 }}>
                <button onClick={() => setSelectedMentorUid("all")}
                  style={{ ...pillStyle(selectedMentorUid==="all", false, { justifyContent:"flex-start", borderRadius:10, width:"100%" }) }}>
                  <Users size={14} /> All online mentors
                </button>
                {mentorLoading ? (
                  <div style={{ color:T.muted, fontSize:13, padding:10 }}><Loader2 size={14} className="spin" /> Loading mentors...</div>
                ) : mentors.length === 0 ? (
                  <div style={{ color:T.muted, fontSize:13, padding:10, background:T.alt, borderRadius:10 }}>No approved mentors found in Firebase yet.</div>
                ) : mentors.map((mentor) => (
                  <button key={mentor.uid} onClick={() => setSelectedMentorUid(mentor.uid)}
                    style={{ ...pillStyle(selectedMentorUid===mentor.uid, false, { justifyContent:"flex-start", borderRadius:10, width:"100%" }) }}>
                    <ProfileAvatar profile={mentor} size={24} />
                    <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{mentor.displayName}</span>
                    {mentor.mentorId && <span style={{ marginLeft:"auto", color:T.muted, fontSize:11 }}>{mentor.mentorId}</span>}
                  </button>
                ))}
              </div>
            </div>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic, e.g. React hooks bug" style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${T.border}`, background:"#0A0A12", color:T.text, marginBottom:12 }} />
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} placeholder="Describe what you need help with" style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${T.border}`, background:"#0A0A12", color:T.text, marginBottom:12, resize:"vertical" }} />
            <button disabled={saving} onClick={submit} style={pillStyle(false, true, { width:"100%", justifyContent:"center", padding:"13px", opacity:saving?0.6:1 })}>{saving ? <Loader2 className="spin" size={15} /> : <Bell size={15} />} Send Request</button>
          </motion.div>
        </motion.div>}
      </AnimatePresence>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ██  APP SHELL
// ═════════════════════════════════════════════════════════════════════════════
function App() {
  const { user, profile, login, logout } = useContext(AuthCtx);
  const [mode,           setMode]           = useState(null);
  const [activeMentorId, setActiveMentorId] = useState(null);
  const [page,           setPage]           = useState("marketplace");
  const [adminToken,     setAdminToken]     = useState("");
  const [adminOpen,      setAdminOpen]      = useState(() => window.location.hash === "#admin");

  useEffect(() => { if (!profile || mode !== null) return; setMode("gate"); }, [profile]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") setAdminOpen(true);
    };
    const onHash = () => setAdminOpen(window.location.hash === "#admin");
    window.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("hashchange", onHash); };
  }, []);

  if (adminOpen && adminToken) return <AdminDashboard token={adminToken} onExit={() => { setAdminOpen(false); setAdminToken(""); window.location.hash = ""; }} />;
  if (adminOpen) return <AdminLogin onAuthed={setAdminToken} onExit={() => { setAdminOpen(false); window.location.hash = ""; }} />;

  if (user === undefined)        return <FullLoader />;
  if (!user)                     return <LoginScreen onLogin={login} />;
  if (!profile || mode === null) return <FullLoader />;

  // Mentor gate: let approved mentors enter the dashboard
  if (mode === "gate") {
    return (
      <MentorIdGate
        profile={profile}
        onEnterMentorDashboard={(id) => { setActiveMentorId(id); setMode("mentor"); }}
        onContinueAsLearner={() => setMode("learner")}
      />
    );
  }

  // Mentor dashboard mode
  if (mode === "mentor") {
    return (
      <MentorDashboard profile={profile} mentorId={activeMentorId} onExit={() => setMode("learner")} />
    );
  }

  // Main app shell (learner mode / default)
  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <Navbar page={page} onNav={(p) => setPage(p)} profile={profile} onLogout={logout} onMentorDash={() => setMode("gate")} />
      <main style={{ width: "100%", maxWidth: 1400, padding: "28px 32px 60px", margin: "0 auto" }}>
        {page === "marketplace" && <Marketplace profile={profile} />}
        {page === "requests" && <Requests profile={profile} />}
        {page === "discussion" && <DiscussionRoom />}
        {page === "profile" && <ProfilePage profile={profile} />}
      </main>
      <AIChatWidget profile={profile} />
    </div>
  );
}

// Root wrapper with providers — used by src/main.jsx
export function Root() {
  return (
    <AuthProvider>
      <ToastProvider>
        <GlobalStyles />
        <App />
      </ToastProvider>
    </AuthProvider>
  );
}

export default Root;
