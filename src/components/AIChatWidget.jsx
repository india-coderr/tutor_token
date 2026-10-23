import React, { useRef, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Paperclip, Send, Loader2, Sparkles } from "lucide-react";
import { ToastCtx } from "../contexts/ToastContext";
import { sbUploadFile, apiFetch } from "../lib/api";
import { T, pillStyle } from "../lib/ui";

export default function AIChatWidget({ profile }) {
  const toast = useContext(ToastCtx);
  const fileRef = useRef();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([{ role:"assistant", text:"Ask me a doubt, paste code, or upload a question image." }]);

  const send = async (imageFile = null) => {
    if (!input.trim() && !imageFile) return;
    const prompt = input.trim() || "Please explain this image step by step.";
    setInput("");
    setMessages((p) => [...p, { role:"user", text:prompt, imageName:imageFile?.name }]);
    setLoading(true);
    try {
      let data;
      if (imageFile) {
        const imageUrl = await sbUploadFile("ai-chat", profile.uid, imageFile);
        data = await apiFetch("/api/ai/vision", { method:"POST", body:JSON.stringify({ message:prompt, imageUrl, user:{ uid:profile.uid, email:profile.email } }) });
      } else {
        data = await apiFetch("/api/ai/chat", { method:"POST", body:JSON.stringify({ message:prompt, user:{ uid:profile.uid, email:profile.email } }) });
      }
      setMessages((p) => [...p, { role:"assistant", text:data.answer || "No response returned." }]);
    } catch(e) {
      toast(e.message, "error");
      setMessages((p) => [...p, { role:"assistant", text:"I could not reach the AI service. Check the backend OpenAI configuration." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed", right:22, bottom:22, zIndex:600 }}>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, y:20, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:20, scale:0.96 }}
            style={{ width:"min(380px, calc(100vw - 32px))", height:520, background:T.surface, borderRadius:16, padding:0, overflow:"hidden", marginBottom:12, display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><div style={{ fontWeight:800 }}>AI Doubt Solver</div><div style={{ fontSize:12, color:T.muted }}>GPT-4o text and vision via backend</div></div>
              <button onClick={() => setOpen(false)} style={{ background:"none", border:"none" }}><X size={18} color={T.muted} /></button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:14, display:"grid", gap:10, alignContent:"start" }}>
              {messages.map((m, i) => <div key={i} style={{ justifySelf:m.role==="user"?"end":"start", maxWidth:"86%", padding:"10px 12px", borderRadius:12, background:m.role==="user"?T.pink:T.alt, color:"#fff", whiteSpace:"pre-wrap", fontSize:13, lineHeight:1.45 }}>{m.imageName && <div style={{ fontWeight:800, marginBottom:4 }}>{m.imageName}</div>}{m.text}</div>)}
              {loading && <div style={{ color:T.muted, fontSize:13 }}><Loader2 className="spin" size={14} /> Thinking...</div>}
            </div>
            <div style={{ padding:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={(e) => e.target.files?.[0] && send(e.target.files[0])} />
              <button onClick={() => fileRef.current?.click()} style={pillStyle(false, false, { padding:"10px 12px" })}><Paperclip size={15} /></button>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key==="Enter" && send()} placeholder="Ask a doubt..." style={{ flex:1, padding:"10px 12px", borderRadius:10, border:`1px solid ${T.border}`, background:"#0A0A12", color:T.text, outline:"none" }} />
              <button onClick={() => send()} style={pillStyle(false, true, { padding:"10px 12px" })}><Send size={15} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen((p) => !p)} style={{ ...pillStyle(false, true, { width:58, height:58, borderRadius:"50%", padding:0, justifyContent:"center", boxShadow:`0 10px 36px ${T.pink}60` }) }}>
        <Sparkles size={22} />
      </button>
    </div>
  );
}
