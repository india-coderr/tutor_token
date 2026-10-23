import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Bell } from "lucide-react";

export const T = {
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
  cardGrad1: "#1A1A2E",
  cardGrad2: "#16213E",
};

export const pillStyle = (active = false, pink = false, extra = {}) => ({
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "10px 20px", borderRadius: 999, cursor: "pointer",
  border: "none", fontFamily: "inherit", fontWeight: 600,
  fontSize: 14, transition: "all 0.15s ease",
  background: pink ? T.pink : active ? "#FFFFFF" : T.surface,
  color:      pink ? "#fff" : active ? "#0A0A0F"  : T.text,
  boxShadow:  active || pink ? "none" : `0 0 0 1px ${T.border}`,
  ...extra,
});

export const cardStyle = (extra = {}) => ({
  background: T.surface, borderRadius: 16,
  border: `1px solid ${T.border}`,
  boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
  padding: 20, ...extra,
});

export const GLOBAL_CSS = `
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
`;

export function GlobalStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

export function AnimatedCredits({ value, size = 32 }) {
  const [display, setDisplay] = useState(value);
  const [bump, setBump] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    setBump(true);
    const start = prev.current, end = value, dur = 600;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisplay(Math.round(start + (end - start) * p));
      if (p < 1) requestAnimationFrame(step);
      else { setBump(false); prev.current = value; }
    };
    requestAnimationFrame(step);
  }, [value]);
  return (
    <motion.span animate={{ scale: bump ? [1,1.35,1] : 1 }} transition={{ duration:0.4 }}
      style={{ fontSize:size, fontWeight:800, color:T.text, fontVariantNumeric:"tabular-nums", lineHeight:1 }}>
      {display}
    </motion.span>
  );
}

export function StatusBadge({ status }) {
  const safeStatus = status || "pending";
  const map = {
    pending:    { bg:"#3b2200", color:"#fbbf24" },
    approved:   { bg:"#052e1e", color:"#34d399" },
    declined:   { bg:"#3b0000", color:"#f87171" },
    confirming: { bg:"#1e3a5f", color:"#60a5fa" },
    completed:  { bg:T.pink,    color:"#fff"    },
    rejected:   { bg:"#3b0000", color:"#f87171" },
    open:       { bg:T.pinkDim, color:T.pink },
    accepted:   { bg:"#052e1e", color:"#34d399" },
  };
  const st = map[safeStatus] || { bg:T.alt, color:T.muted };
  const label = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
  return (
    <span style={{ background:st.bg, color:st.color, borderRadius:99, padding:"3px 12px", fontSize:12, fontWeight:700 }}>{label}</span>
  );
}

export function SkillGraph({ skills = [] }) {
  if (!skills.length) return (
    <div style={{ textAlign:"center", color:T.muted, padding:"40px 0", fontSize:14 }}>
      Complete sessions to grow your skill graph
    </div>
  );
  const cx = 180, cy = 170, r = 110;
  return (
    <svg width="100%" viewBox="0 0 360 340" style={{ overflow:"visible" }}>
      <circle cx={cx} cy={cy} r={28} fill={T.pink} />
      <text x={cx} y={cy+5} textAnchor="middle" fontSize={11} fill="#fff" fontFamily="DM Sans,sans-serif" fontWeight={700}>YOU</text>
      {skills.map((s, i) => {
        const a  = (2*Math.PI*i/skills.length) - Math.PI/2;
        const x  = cx + r*Math.cos(a);
        const y  = cy + r*Math.sin(a);
        const sz = Math.min(14+(s.count||1)*5, 32);
        return (
          <g key={s.name||s}>
            <motion.line x1={cx} y1={cy} x2={x} y2={y}
              stroke={T.border} strokeWidth={1.5}
              initial={{ pathLength:0 }} animate={{ pathLength:1 }} transition={{ duration:0.7, delay:i*0.08 }} />
            <motion.circle cx={x} cy={y} r={sz} fill={T.pink} opacity={0.7}
              initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", delay:i*0.08+0.3 }} />
            <text x={x} y={y+sz+14} textAnchor="middle" fontSize={11} fill={T.muted} fontFamily="DM Sans,sans-serif">
              {typeof s==="string" ? s : s.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export const ALL_SKILLS = [
  "React","TypeScript","Python","UI/UX","NodeJS","GraphQL",
  "Figma","Data Science","DevOps","Flutter","Go","Rust",
  "Machine Learning","SQL","AWS","Kubernetes","Web3",
  "Photography","Music Theory","Technical Writing",
];

export const SKILL_ICONS = {
  React: undefined, TypeScript: undefined, Python: undefined, "UI/UX": undefined,
};

// Minimal placeholders for SKILL_COLORS and SKILL_BG / GRADIENTS to keep components working
// in src/lib/ui.js — replace the empty ones with these:
export const SKILL_COLORS = {
  React: "#61DAFB", TypeScript: "#a78bfa", Python: "#fcd34d",
  "UI/UX": "#f472b6", NodeJS: "#6ee7b7", GraphQL: "#c084fc",
  Figma: "#fb7185", "Data Science": "#34d399", DevOps: "#60a5fa",
  Flutter: "#38bdf8", Go: "#2dd4bf", Rust: "#fbbf24",
  "Machine Learning": "#818cf8", SQL: "#4ade80", AWS: "#fb923c",
  Kubernetes: "#60a5fa", Web3: "#c084fc", Photography: "#f87171",
  "Music Theory": "#a78bfa", "Technical Writing": "#4ade80",
};
export const SKILL_BG = {
  React: "#0d2137", TypeScript: "#1e1040", Python: "#2a2000",
  "UI/UX": "#2a0620", NodeJS: "#062014", GraphQL: "#1a0830",
  Figma: "#2a0615", "Data Science": "#031a10", DevOps: "#0d2137",
  Flutter: "#061a28", Go: "#031a18", Rust: "#2a1600",
  "Machine Learning": "#121440", SQL: "#031a08", AWS: "#2a1000",
  Kubernetes: "#0d2137", Web3: "#1a0830", Photography: "#2a0000",
  "Music Theory": "#1e1040", "Technical Writing": "#031a08",
};
export const SKILL_GRADIENT = {
  React: "linear-gradient(135deg, #0d2137 0%, #1a4a6b 50%, #0d2137 100%)",
  TypeScript: "linear-gradient(135deg, #1e1040 0%, #3d2a80 50%, #1e1040 100%)",
  Python: "linear-gradient(135deg, #2a2000 0%, #5a4a00 50%, #2a2000 100%)",
  "UI/UX": "linear-gradient(135deg, #2a0620 0%, #5a1040 50%, #2a0620 100%)",
  NodeJS: "linear-gradient(135deg, #062014 0%, #0d4028 50%, #062014 100%)",
  GraphQL: "linear-gradient(135deg, #1a0830 0%, #3a1060 50%, #1a0830 100%)",
  Figma: "linear-gradient(135deg, #2a0615 0%, #5a1030 50%, #2a0615 100%)",
  "Data Science": "linear-gradient(135deg, #031a10 0%, #063428 50%, #031a10 100%)",
  DevOps: "linear-gradient(135deg, #0d2137 0%, #1a4060 50%, #0d2137 100%)",
  Flutter: "linear-gradient(135deg, #061a28 0%, #0c3050 50%, #061a28 100%)",
  Go: "linear-gradient(135deg, #031a18 0%, #063430 50%, #031a18 100%)",
  Rust: "linear-gradient(135deg, #2a1600 0%, #5a2e00 50%, #2a1600 100%)",
  "Machine Learning": "linear-gradient(135deg, #121440 0%, #242880 50%, #121440 100%)",
  SQL: "linear-gradient(135deg, #031a08 0%, #063410 50%, #031a08 100%)",
  AWS: "linear-gradient(135deg, #2a1000 0%, #5a2400 50%, #2a1000 100%)",
  Kubernetes: "linear-gradient(135deg, #0d2137 0%, #1a4060 50%, #0d2137 100%)",
  Web3: "linear-gradient(135deg, #1a0830 0%, #3a1860 50%, #1a0830 100%)",
  Photography: "linear-gradient(135deg, #1a0000 0%, #3a0000 50%, #1a0000 100%)",
  "Music Theory": "linear-gradient(135deg, #1e1040 0%, #3e2080 50%, #1e1040 100%)",
  "Technical Writing": "linear-gradient(135deg, #031a08 0%, #063410 50%, #031a08 100%)",
};


// export default {
//   T, pillStyle, cardStyle, GLOBAL_CSS, GlobalStyles, AnimatedCredits, StatusBadge, SkillGraph,
// };
