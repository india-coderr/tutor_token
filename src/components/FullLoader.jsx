import React from "react";
import { Zap } from "lucide-react";
import { T, cardStyle } from "../lib/ui";

export default function FullLoader() {
  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"flex", alignItems:"center",
      justifyContent:"center", background:T.bg }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ background:T.surface, borderRadius:14, width:52, height:52,
          display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px",
          border:`1px solid ${T.border}`, boxShadow:`0 0 24px ${T.pink}20` }}>
          <Zap size={24} color={T.pink} fill={T.pink} className="pulse" />
        </div>
        <div style={{ fontSize:14, color:T.muted }}>Loading courses…</div>
      </div>
    </div>
  );
}
