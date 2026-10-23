import React from "react";
import { Coins } from "lucide-react";
import { T, cardStyle, AnimatedCredits } from "../lib/ui";

export default function WalletWidget({ credits }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6,
      background:"#0A0A12", border:`1px solid ${T.border}`, borderRadius:999, padding:"7px 14px" }}>
      <Coins size={13} color={T.pink} className="pulse" />
      <AnimatedCredits value={credits||0} size={16} />
      <span style={{ fontSize:11, color:T.muted, fontWeight:400 }}>credits</span>
    </div>
  );
}
