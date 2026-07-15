// src/pages/StudentDashboard.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ total:0, approved:0, pending:0, rejected:0 });

  useEffect(() => {
    axios.get("/api/student/nodues-summary")
      .then(r => setSummary(r.data))
      .catch(() => {});
  }, []);

  const pct = summary.total
    ? Math.round((summary.approved / summary.total) * 100) : 0;

  const cards = [
    { label:"Find Faculty",  icon:"🔍", color:"#1565C0", path:"/student/search" },
    { label:"My No-Dues",    icon:"📋", color:"#00695C", path:"/student/nodues" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f2f4f8",
      fontFamily:"'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1A237E,#1565C0)",
        padding:"24px 24px 32px" }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <div>
            <div style={{ color:"#90CAF9", fontSize:11, textTransform:"uppercase",
              letterSpacing:1 }}>Student Portal</div>
            <div style={{ color:"white", fontSize:22, fontWeight:800, marginTop:4 }}>
              Hello, {user?.name?.split(" ")[0]} 👋
            </div>
            <div style={{ color:"#90CAF9", fontSize:12, marginTop:2 }}>
              {user?.roll_number} · {user?.dept_name} · Sem {user?.semester}
            </div>
          </div>
          <button onClick={logout} style={{ padding:"8px 16px",
            background:"#ff444422", color:"#ffaaaa",
            border:"1px solid #ff444444", borderRadius:8,
            fontSize:12, cursor:"pointer", alignSelf:"flex-start" }}>
            Logout
          </button>
        </div>

        {/* Progress mini */}
        <div style={{ marginTop:20, background:"#ffffff22",
          borderRadius:14, padding:"14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ color:"white", fontSize:13, fontWeight:600 }}>
              No-Dues Progress
            </span>
            <span style={{ color:"#FFD54F", fontSize:14, fontWeight:800 }}>{pct}%</span>
          </div>
          <div style={{ height:8, borderRadius:8, background:"#ffffff33" }}>
            <div style={{ height:"100%", borderRadius:8,
              width:`${pct}%`,
              background: pct===100 ? "#4CAF50" : "#FFD54F",
              transition:"width 0.5s" }} />
          </div>
          <div style={{ display:"flex", gap:16, marginTop:10 }}>
            {[
              { label:"Approved", value:summary.approved, color:"#4CAF50" },
              { label:"Pending",  value:summary.pending,  color:"#FF9800" },
              { label:"Total",    value:summary.total,    color:"white"   },
            ].map(s => (
              <div key={s.label}>
                <div style={{ color:s.color, fontSize:18, fontWeight:800 }}>{s.value}</div>
                <div style={{ color:"#90CAF9", fontSize:10 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div style={{ padding:"20px 20px 0",
        display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {cards.map(c => (
          <div key={c.label} onClick={() => navigate(c.path)}
            style={{ background:"white", borderRadius:16, padding:"24px 16px",
              textAlign:"center", cursor:"pointer",
              boxShadow:"0 4px 16px rgba(0,0,0,0.08)",
              border:`2px solid ${c.color}22` }}>
            <div style={{ fontSize:36 }}>{c.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:c.color, marginTop:8 }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* Status banner */}
      {summary.total > 0 && pct === 100 && (
        <div style={{ margin:"20px 20px 0", background:"#4CAF50",
          borderRadius:14, padding:"14px 20px", textAlign:"center" }}>
          <div style={{ color:"white", fontSize:14, fontWeight:800 }}>
            🎉 All dues cleared! You are eligible for the exam.
          </div>
        </div>
      )}
    </div>
  );
}
