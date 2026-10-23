import React, { createContext, useEffect, useState, useContext } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, gProvider, rtGet, rtSet, rtListen } from "../lib/api";
import { ToastCtx } from "./ToastContext";

export const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined);
  const [profile, setProfile] = useState(null);
  const toast = useContext(ToastCtx);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { setUser(null); setProfile(null); return; }
      setUser(u);
      const profilePath = `users/${u.uid}`;
      try {
        const existing = await rtGet(profilePath);
        if (!existing) {
          const p = {
            uid: u.uid, email: u.email,
            displayName: u.displayName || u.email.split("@")[0],
            photoURL: u.photoURL || "",
            credits: 2, totalEarned: 0, streak: 0,
            skills: [], sessionsAsMentor: 0, sessionsAsLearner: 0,
            createdAt: Date.now(),
          };
          await rtSet(profilePath, p);
          setProfile(p);
          toast?.("Welcome! You got 2 free credits 🎉", "success");
        } else {
          setProfile(existing);
        }
      } catch {
        setProfile({
          uid: u.uid, email: u.email,
          displayName: u.displayName || u.email.split("@")[0],
          photoURL: u.photoURL || "", credits: 0,
          totalEarned: 0, streak: 0, skills: [],
          sessionsAsMentor: 0, sessionsAsLearner: 0,
        });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = rtListen(`users/${user.uid}`, (data) => { if (data) setProfile(data); });
    return unsub;
  }, [user]);

  const login  = () => signInWithPopup(auth, gProvider).catch((e) => toast?.(e.message, "error"));
  const logout = () => signOut(auth);
  return (
    <AuthCtx.Provider value={{ user, profile, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export default AuthProvider;
