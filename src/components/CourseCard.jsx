import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Video, Coins, Star, Clock, X, Loader2, BookOpen } from "lucide-react";
import { T, pillStyle, cardStyle, SKILL_ICONS, SKILL_COLORS, SKILL_GRADIENT } from "../lib/ui";

export default function CourseCard({ course, profile, onRequest }) {
  const [hover,    setHover]    = useState(false);
  const [reqModal, setReqModal] = useState(false);
  const canBook   = (profile?.credits || 0) >= (course.credits || 1);
  const isSelf    = profile?.uid === course.mentor_uid;
  const Icon      = SKILL_ICONS[course.skill] || BookOpen;
  const iconColor = SKILL_COLORS[course.skill] || "#60a5fa";
  const gradient  = SKILL_GRADIENT[course.skill] || "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)";

  const levelBadgeColors = {
    Beginner:     { bg:"#052e1e", color:"#34d399" },
    Intermediate: { bg:"#1e3a5f", color:"#60a5fa" },
    Advanced:     { bg:"#3b0a2a", color:"#f472b6" },
    "All levels": { bg:"#242424", color:"#aaa" },
  };
  const lvlStyle = levelBadgeColors[course.level] || { bg:T.alt, color:T.muted };

  return (
    <>
      <motion.div
        onHoverStart={() => setHover(true)} onHoverEnd={() => setHover(false)}
        animate={{
          boxShadow: hover
            ? `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px ${T.pink}30`
            : `0 2px 16px rgba(0,0,0,0.4)`,
        }}
        style={{
          display:"flex", flexDirection:"row", alignItems:"stretch",
          background: T.surface,
          borderRadius: 18,
          border: `1px solid ${hover ? T.pink+"30" : T.border}`,
          overflow:"hidden",
          transition:"border-color 0.2s",
          cursor:"default",
          minHeight: 160,
        }}>

        <div style={{
          width: 200,
          minWidth: 200,
          flexShrink: 0,
          position:"relative",
          background: gradient,
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          overflow:"hidden",
        }}>
          {course.mentor_photo ? (
            <img
              src={course.mentor_photo}
              alt={course.title}
              style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0, opacity:0.7 }}
            />
          ) : null}

          <div style={{
            position:"absolute",
            width:120, height:120,
            borderRadius:"50%",
            background: iconColor + "30",
            filter:"blur(32px)",
            top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
          }} />

          <div style={{
            position:"relative", zIndex:2,
            width:56, height:56, borderRadius:16,
            background:"rgba(0,0,0,0.45)",
            backdropFilter:"blur(8px)",
            border:`1.5px solid ${iconColor}40`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <Icon size={26} color={iconColor} />
          </div>

          <div style={{
            position:"absolute", top:10, left:10,
            background:"rgba(0,0,0,0.6)",
            backdropFilter:"blur(8px)",
            borderRadius:99,
            padding:"3px 9px",
            fontSize:10, fontWeight:700,
            color:"#4ade80",
            display:"flex", alignItems:"center", gap:4,
            border:"1px solid #4ade8040",
          }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
            LIVE
          </div>

          {(course.sessions_count > 0) && (
            <div style={{
              position:"absolute", bottom:10, left:10,
              background:"rgba(0,0,0,0.55)",
              backdropFilter:"blur(6px)",
              borderRadius:99,
              padding:"3px 9px",
              fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.7)",
              display:"flex", alignItems:"center", gap:4,
            }}>
              <Users size={9} />{course.sessions_count} learners
            </div>
          )}
        </div>

        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          padding:"18px 20px", minWidth:0,
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{
                fontSize:11, fontWeight:700, color:iconColor,
                background: iconColor + "18",
                borderRadius:99, padding:"3px 10px",
                letterSpacing:"0.02em",
              }}>
                {course.skill}
              </span>
              <span style={{
                fontSize:11, fontWeight:600,
                color: lvlStyle.color, background: lvlStyle.bg,
                borderRadius:99, padding:"3px 9px",
              }}>
                {course.level || "All levels"}
              </span>
            </div>
            {course.rating > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={10}
                    color="#f59e0b"
                    fill={s <= Math.round(course.rating) ? "#f59e0b" : "transparent"} />
                ))}
                <span style={{ fontSize:12, fontWeight:700, color:"#f59e0b", marginLeft:2 }}>
                  {course.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div style={{ fontWeight:800, fontSize:16, lineHeight:1.3, marginBottom:5,
            overflow:"hidden", display:"-webkit-box",
            WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
            {course.title}
          </div>

          {course.subtitle && (
            <div style={{ fontSize:13, color:T.muted, lineHeight:1.5, marginBottom:10,
              overflow:"hidden", display:"-webkit-box",
              WebkitLineClamp:1, WebkitBoxOrient:"vertical" }}>
              {course.subtitle}
            </div>
          )}

          {Array.isArray(course.topics) && course.topics.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
              {course.topics.slice(0,3).map((t) => (
                <span key={t} style={{
                  background:T.alt, borderRadius:6,
                  padding:"3px 8px", fontSize:11, color:T.muted, fontWeight:500,
                }}>
                  {t}
                </span>
              ))}
              {course.topics.length > 3 && (
                <span style={{ fontSize:11, color:T.muted, padding:"3px 0" }}>+{course.topics.length-3} more</span>
              )}
            </div>
          )}

          <div style={{ flex:1 }} />

          <div style={{
            display:"flex", alignItems:"center",
            justifyContent:"space-between", gap:12,
            flexWrap:"wrap",
            paddingTop:10, borderTop:`1px solid ${T.border}`,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
              <div style={{
                width:28, height:28, borderRadius:8, flexShrink:0,
                overflow:"hidden", border:`1.5px solid ${T.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                background:T.alt, fontWeight:700, fontSize:11, color:"#fff",
              }}>
                {course.mentor_photo
                  ? <img src={course.mentor_photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : (course.mentor_name?.[0]||"?").toUpperCase()}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {course.mentor_name}
                </div>
                <div style={{ fontSize:10, color:T.muted }}>Mentor</div>
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:11, color:T.muted, display:"flex", alignItems:"center", gap:3 }}>
                  <Clock size={10} /> 1 hr
                </span>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <Coins size={12} color={T.pink} />
                  <span style={{ fontSize:13, fontWeight:800, color:T.pink }}>{course.credits||1}</span>
                  <span style={{ fontSize:11, color:T.muted }}>credit</span>
                </span>
              </div>

              {isSelf ? (
                <span style={{ fontSize:12, color:T.muted, fontStyle:"italic", padding:"6px 10px" }}>Your course</span>
              ) : (
                <motion.button
                  whileTap={{ scale:0.93 }}
                  whileHover={{ scale: canBook ? 1.03 : 1 }}
                  disabled={!canBook}
                  onClick={() => setReqModal(true)}
                  style={{
                    display:"inline-flex", alignItems:"center", gap:6,
                    padding:"8px 16px", borderRadius:99,
                    border:"none", fontFamily:"inherit", fontWeight:700,
                    fontSize:13, cursor: canBook ? "pointer" : "not-allowed",
                    background: canBook ? T.pink : T.alt,
                    color: canBook ? "#fff" : T.muted,
                    opacity: canBook ? 1 : 0.5,
                    transition:"all 0.15s",
                    boxShadow: canBook ? `0 4px 16px ${T.pink}40` : "none",
                  }}>
                  <Video size={12} /> Book Session
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {reqModal && (
          <ZoomRequestModal course={course} profile={profile}
            onClose={() => setReqModal(false)}
            onConfirm={() => { onRequest(course); setReqModal(false); }} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── ZOOM REQUEST MODAL ────────────────────────────────────────────────────────
function ZoomRequestModal({ course, profile, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)",
        zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <motion.div initial={{ scale:0.88, opacity:0 }} animate={{ scale:1, opacity:1 }}
        exit={{ scale:0.88, opacity:0 }} onClick={(e) => e.stopPropagation()}
        style={{ ...cardStyle({ padding:28 }), width:"100%", maxWidth:420 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <div style={{ fontWeight:800, fontSize:19 }}>Request Zoom Session</div>
          <button onClick={onClose} style={{ background:"none", border:"none" }}><X size={20} color={T.muted} /></button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, background:T.alt,
          borderRadius:14, padding:"12px 14px", marginBottom:20 }}>
          {course.mentor_photo
            ? <img src={course.mentor_photo} alt=""
                style={{ width:44, height:44, borderRadius:10, objectFit:"cover", flexShrink:0 }} />
            : <div style={{ width:44, height:44, borderRadius:10, background:T.pink,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", fontWeight:700, flexShrink:0 }}>
                {(course.mentor_name?.[0]||"?").toUpperCase()}
              </div>}
          <div>
            <div style={{ fontWeight:700, fontSize:14 }}>{course.title}</div>
            <div style={{ fontSize:12, color:T.muted }}>with {course.mentor_name} · {course.skill}</div>
          </div>
        </div>
        <div style={{ background:"#0d2137", borderRadius:12, padding:"12px 14px", marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#60a5fa", marginBottom:8 }}>How it works:</div>
          {["1. Request sent to mentor","2. Mentor approves → Zoom meeting auto-created",
            "3. 1 credit deducted from your account","4. Both join via the Zoom link"].map((s) => (
            <div key={s} style={{ fontSize:13, color:"#93c5fd", marginBottom:4 }}>{s}</div>
          ))}
        </div>
        <div style={{ background:T.pinkDim, borderRadius:12, padding:"10px 14px",
          marginBottom:22, display:"flex", alignItems:"center", gap:8, border:`1px solid ${T.pinkMid}` }}>
          <Coins size={14} color={T.pink} />
          <span style={{ fontSize:13, color:T.pink, fontWeight:500 }}>
            {course.credits||1} credit deducted on mentor approval
          </span>
        </div>
        <motion.button whileTap={{ scale:0.96 }} disabled={loading}
          onClick={() => { setLoading(true); onConfirm(); }}
          style={{ ...pillStyle(false, true, { width:"100%", justifyContent:"center",
            padding:"13px", fontSize:15, opacity:loading?0.6:1 }) }}>
          {loading ? <><Loader2 size={15} className="spin" /> Sending…</> : <><Video size={15} /> Send Zoom Request</>}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
