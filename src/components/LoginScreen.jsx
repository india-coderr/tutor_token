import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { pillStyle, GLOBAL_CSS, T } from "../lib/ui";
import { GlobalStyles } from "../lib/ui";

export default function LoginScreen({ onLogin }) {
  return (
    <div style={{
      minHeight:"100vh",
      width:"100%",
      background: T.bg,
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      padding:24,
      backgroundImage:`
        radial-gradient(ellipse 80% 60% at 50% -10%, ${T.pink}20 0%, transparent 60%),
        radial-gradient(ellipse 50% 50% at 85% 90%, #3730a320 0%, transparent 55%),
        radial-gradient(ellipse 40% 40% at 10% 80%, #0ea5e910 0%, transparent 50%)
      `,
    }}>
      <motion.div initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }} style={{ textAlign:"center", maxWidth:520, width:"100%" }}>
        <motion.div
          initial={{ scale:0.8, opacity:0 }}
          animate={{ scale:1, opacity:1 }}
          transition={{ delay:0.1, type:"spring" }}
          style={{ display:"inline-flex", alignItems:"center", gap:10,
            background:T.surface, border:`1px solid ${T.border}`, borderRadius:20,
            padding:"14px 28px", marginBottom:48,
            boxShadow:`0 0 40px ${T.pink}20` }}>
          <Zap size={24} color={T.pink} fill={T.pink} />
          <span style={{ color:"#fff", fontWeight:900, fontSize:26, letterSpacing:"-1px" }}>TT</span>
          <span style={{ color:T.muted, fontSize:14 }}>Time Trade</span>
        </motion.div>

        <motion.h1
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          style={{ fontSize:52, fontWeight:900, letterSpacing:"-3px", color:T.text,
            margin:"0 0 16px", lineHeight:1.05 }}>
          Trade time.<br />
          <span style={{
            background:`linear-gradient(135deg, ${T.pink} 0%, #ff6b9d 100%)`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>
            Build skills.
          </span>
        </motion.h1>

        <motion.p initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          style={{ fontSize:17, color:T.muted, marginBottom:48, lineHeight:1.7 }}>
          Teach 1 hour → earn 1 credit<br />
          Learn 1 hour → spend 1 credit
        </motion.p>

        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
          style={{ display:"flex", justifyContent:"center", gap:32, marginBottom:48 }}>
          {[["15+","Top Courses"],["60k+","Learners"],["4.9/5","Avg Rating"]].map(([v,l]) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color:T.text }}>{v}</div>
              <div style={{ fontSize:12, color:T.muted }}>{l}</div>
            </div>
          ))}
        </motion.div>

        <motion.button whileTap={{ scale:0.95 }} whileHover={{ scale:1.02 }} onClick={onLogin}
          style={{ ...pillStyle(false, true, {
            fontSize:16, padding:"16px 40px", gap:12,
            boxShadow:`0 8px 40px ${T.pink}50`,
            letterSpacing:"-0.3px",
          }) }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="G" style={{ width:20, height:20 }} />
          Continue with Google
        </motion.button>

        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
          style={{ marginTop:20, fontSize:13, color:T.muted }}>
          New users receive <span style={{ color:T.pink, fontWeight:700 }}>+2 free credits</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
