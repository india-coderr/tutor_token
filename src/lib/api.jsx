import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref as dbRef, set as dbSet, get as dbGet, update as dbUpdate, onValue, off } from "firebase/database";
import { createClient } from "@supabase/supabase-js";

// FIREBASE CONFIG (kept from original app)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCjaty20ZFloU5VrA4OfaqIZwaOnnEKR3k",
  authDomain: "timetrade-c2424.firebaseapp.com",
  databaseURL: "https://timetrade-c2424-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "timetrade-c2424",
  storageBucket: "timetrade-c2424.firebasestorage.app",
  messagingSenderId: "37103569098",
  appId: "1:37103569098:web:b335e391f91dd1edae8c33",
};

export const SUPABASE_URL      = "https://nsyydxayplotyxwuhdsz.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeXlkeGF5cGxvdHl4d3VoZHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NzI2OTYsImV4cCI6MjA5MzE0ODY5Nn0.zvWiDuVUoqSA4zxybp9QSw3c4wVKS1ylpyzsWRb1Qhc";
export const ZOOM_PROXY_URL = "https://zoom-proxy.rajeshwarisons3134.workers.dev";
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
export const DISCUSSION_ROOM_URL = "https://bhailog-m.vercel.app/";

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(firebaseApp);
export const rtdb = getDatabase(firebaseApp);
export const gProvider = new GoogleAuthProvider();
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// RTDB HELPERS
export async function rtGet(path) {
  const snap = await dbGet(dbRef(rtdb, path));
  return snap.exists() ? snap.val() : null;
}
export async function rtSet(path, data)    { await dbSet(dbRef(rtdb, path), data); }
export async function rtUpdate(path, data) { await dbUpdate(dbRef(rtdb, path), data); }
export function rtListen(path, cb) {
  const r = dbRef(rtdb, path);
  onValue(r, (snap) => cb(snap.exists() ? snap.val() : null));
  return () => off(r);
}

// SUPABASE HELPERS
export async function sbInsertRequest(data) {
  const { data: row, error } = await supabase.from("requests").insert([data]).select().single();
  if (error) throw new Error(error.message);
  return row;
}
export async function sbUpdateRequest(id, data) {
  const { error } = await supabase.from("requests").update(data).eq("id", id);
  if (error) throw new Error(error.message);
}
export async function sbDeleteRequest(id) {
  const { error } = await supabase.from("requests").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
export async function sbGetRequests(field, uid) {
  const { data, error } = await supabase
    .from("requests").select("*").eq(field, uid)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
export async function sbInsertCourse(data) {
  const { data: row, error } = await supabase.from("courses").insert([data]).select().single();
  if (error) throw new Error(error.message);
  return row;
}
export async function sbGetAllCourses() {
  const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
export async function sbGetMentorCourses(mentorUid) {
  const { data, error } = await supabase.from("courses").select("*").eq("mentor_uid", mentorUid).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
export async function sbDeleteCourse(id) {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
export async function sbUploadCourseImage(file, mentorUid) {
  const ext  = file.name.split(".").pop();
  const path = `course-images/${mentorUid}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("course-images").upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("course-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function sbUploadFile(bucket, folder, file) {
  const ext = file.name.split(".").pop();
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, "_");
  const path = `${folder}/${Date.now()}-${safeName}.${ext}`.replace(`.${ext}.${ext}`, `.${ext}`);
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function sbInsertMentorApplication(data) {
  const { data: row, error } = await supabase.from("mentor_applications").insert([data]).select().single();
  if (error) throw new Error(error.message);
  return row;
}

export async function sbGetMyMentorApplication(uid) {
  const { data, error } = await supabase
    .from("mentor_applications").select("*").eq("user_uid", uid)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function sbInsertUrgentRequest(data) {
  const { data: row, error } = await supabase.from("urgent_requests").insert([data]).select().single();
  if (error) throw new Error(error.message);
  return row;
}

export async function sbUpdateUrgentRequest(id, data) {
  const { data: row, error } = await supabase.from("urgent_requests").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return row;
}

export async function apiFetch(path, options = {}, token = "") {
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

export async function submitCourseSecure(course) {
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

export async function getMentorsForRequest() {
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

export async function createUrgentRequestSecure(payload) {
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

export async function acceptUrgentRequestSecure(req, profile, zoomData) {
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

export async function createZoomMeeting(mentorEmail, learnerName, skill) {
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

export function generateFallbackZoomLink(skill = "") {
  const id  = Math.floor(Math.random() * 9000000000) + 1000000000;
  const pwd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return { meetingId: String(id), joinUrl: `https://zoom.us/j/${id}?pwd=${pwd}`, startUrl: `https://zoom.us/s/${id}?zak=PLACEHOLDER`, password: pwd };
}

export function generateMentorId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "MENTOR";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export async function mentorIdExists(mentorId) {
  try {
    const snap = await rtGet(`mentorIds/${mentorId}`);
    return snap !== null;
  } catch { return false; }
}

export async function verifyMentorId(mentorId, userId) {
  try {
    const indexEntry = await rtGet(`mentorIds/${mentorId}`);
    if (indexEntry && indexEntry.userId === userId) return true;
    const userMentorId = await rtGet(`users/${userId}/mentorId`);
    return userMentorId === mentorId;
  } catch { return false; }
}

export async function storeMentorId(userId, mentorId) {
  try {
    await rtSet(`mentorIds/${mentorId}`, { userId, createdAt: Date.now() });
    await rtUpdate(`users/${userId}`, { mentorId, role: "mentor", mentorCreatedAt: Date.now() });
    return true;
  } catch (e) {
    console.error("storeMentorId REAL error:", e.code, e.message);
    return false;
  }
}

export function formatTime(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default {
  rtGet, rtSet, rtUpdate, rtListen,
  sbInsertRequest, sbUpdateRequest, sbDeleteRequest, sbGetRequests,
  sbInsertCourse, sbGetAllCourses, sbGetMentorCourses, sbDeleteCourse,
  sbUploadCourseImage, sbUploadFile,
  sbInsertMentorApplication, sbGetMyMentorApplication,
  sbInsertUrgentRequest, sbUpdateUrgentRequest,
  apiFetch, submitCourseSecure, getMentorsForRequest, createUrgentRequestSecure, acceptUrgentRequestSecure,
  createZoomMeeting, generateFallbackZoomLink, generateMentorId, mentorIdExists, verifyMentorId, storeMentorId, formatTime,
  auth, gProvider, rtdb, supabase,
};