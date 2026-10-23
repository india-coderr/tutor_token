import React, { createContext, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Bell } from "lucide-react";
import { T } from "../lib/ui";

export const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3800);
  }, []);
  const iconFor = (type) => {
    if (type === "success") return <CheckCircle size={15} color={T.pink} />;
    if (type === "error")   return <XCircle     size={15} color="#fca5a5" />;
    return <Bell size={15} color={T.pink} />;
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999,
        display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id}
              initial={{ opacity:0, x:60, scale:0.9 }}
              animate={{ opacity:1, x:0,  scale:1   }}
              exit={{   opacity:0, x:60,  scale:0.9 }}
              style={{ background:"#1E1E2E", color:"#fff", padding:"12px 18px",
                borderRadius:14, fontSize:14, fontWeight:500, maxWidth:320,
                border:`1px solid ${T.border}`,
                boxShadow:"0 6px 24px rgba(0,0,0,0.5)",
                display:"flex", alignItems:"center", gap:10, pointerEvents:"auto" }}>
              {iconFor(t.type)}{t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export default ToastProvider;
