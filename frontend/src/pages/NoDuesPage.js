// src/pages/NoDuesPage.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STATUS_COLOR = { approved: "#4CAF50", pending: "#FF9800", rejected: "#f44336" };

const CheckBox = ({ done }) => (
  <div style={{
    width: 22, height: 22, borderRadius: "50%",
    background: done ? "#4CAF50" : "#f5f5f5",
    border: done ? "none" : "2px solid #ddd",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  }}>
    {done && <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>✓</span>}
  </div>
);

export default function NoDuesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dues,    setDues]    = useState([]);
  const [summary, setSummary] = useState({ total: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [tab,     setTab]     = useState("list"); // list | print
  const [pinModal, setPinModal] = useState(null); // req_id for pin entry
  const [requesting, setRequesting] = useState(false);

  const fetchDues = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/nodues/student");
      setDues(data.dues);
      setSummary({ total: data.total, approved: data.approved, allClear: data.allClear });
    } catch (err) {
      toast.error("Failed to load no-dues data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDues(); }, [fetchDues]);

  const requestApproval = async (req_id) => {
    setRequesting(true);
    try {
      await axios.post(`/api/nodues/request/${req_id}`, {
        message: "Requesting no-dues approval",
      });
      toast.success("Request sent to faculty!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setRequesting(false);
    }
  };

  const pct = summary.total
    ? Math.round((summary.approved / summary.total) * 100) : 0;

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={{ color: "#90CAF9", fontSize: 11, fontWeight: 600,
            letterSpacing: 1, textTransform: "uppercase" }}>No-Dues Status</div>
          <div style={{ color: "white", fontSize: 20, fontWeight: 800, marginTop: 2 }}>
            {user?.name}
          </div>
          <div style={{ color: "#90CAF9", fontSize: 12, marginTop: 2 }}>
            {user?.roll_number} · {user?.dept_name} · Sem {user?.semester}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/student/search")} style={S.navBtn}>Search Faculty</button>
          <button onClick={logout} style={S.logoutBtn}>Logout</button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={S.progressCard}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "#555" }}>
            {summary.approved} of {summary.total} subjects cleared
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1A237E" }}>{pct}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 10, background: "#e0e0e0" }}>
          <div style={{
            height: "100%", borderRadius: 10,
            width: `${pct}%`,
            background: pct === 100 ? "#4CAF50" : "linear-gradient(90deg,#1565C0,#42A5F5)",
            transition: "width 0.5s ease",
          }} />
        </div>
        {summary.allClear && (
          <div style={{ marginTop: 10, textAlign: "center", color: "#4CAF50",
            fontWeight: 700, fontSize: 14 }}>
            🎉 All dues cleared! You are eligible for exams.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {["list","print"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{
            ...S.tab,
            color: tab === t ? "#1A237E" : "#aaa",
            borderBottom: tab === t ? "2.5px solid #1A237E" : "2.5px solid transparent",
          }}>
            {t === "list" ? "📋 Subject-wise" : "🖨 Print View"}
          </div>
        ))}
      </div>

      {/* ── LIST VIEW ─────────────────────────────────────────── */}
      {tab === "list" && (
        <div style={S.list}>
          {dues.map(d => (
            <div key={d.req_id} style={S.card}
              onClick={() => setExpanded(expanded === d.req_id ? null : d.req_id)}>
              {/* Card header */}
              <div style={S.cardHead}>
                <div style={{
                  ...S.initials,
                  background: STATUS_COLOR[d.overall_status] || "#888",
                }}>
                  {d.faculty_name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={S.subjectName}>{d.subject_name}</div>
                  <div style={S.subjectMeta}>{d.subject_code} · {d.faculty_name}</div>
                </div>
                <div style={{
                  ...S.badge,
                  background: STATUS_COLOR[d.overall_status],
                }}>
                  {d.overall_status.toUpperCase()}
                </div>
              </div>

              {/* Quick chips */}
              <div style={S.chips}>
                {["A1","A2","A3"].map((lbl, i) => (
                  <Chip key={lbl} label={lbl}
                    done={[d.assign1_submitted, d.assign2_submitted, d.assign3_submitted][i]} />
                ))}
                {["Q1","Q2","Q3"].map((lbl, i) => (
                  <Chip key={lbl} label={lbl}
                    done={[d.mcq1_cleared, d.mcq2_cleared, d.mcq3_cleared][i]}
                    color="#1565C0" />
                ))}
                <Chip label="SEM" done={d.seminar_done} color="#6A1B9A" />
              </div>

              {/* Expanded detail */}
              {expanded === d.req_id && (
                <div style={S.expanded}>
                  <div style={S.expSection}>
                    <div style={S.expTitle}>Assignments</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {[d.assign1_submitted, d.assign2_submitted, d.assign3_submitted]
                        .map((done, i) => (
                        <ItemBox key={i} label={`Assign ${i+1}`} done={done} color="#388E3C" />
                      ))}
                    </div>
                  </div>
                  <div style={S.expSection}>
                    <div style={S.expTitle}>MCQ Tests</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {[d.mcq1_cleared, d.mcq2_cleared, d.mcq3_cleared]
                        .map((done, i) => (
                        <ItemBox key={i} label={`MCQ ${i+1}`} done={done} color="#1565C0" />
                      ))}
                    </div>
                  </div>
                  <div style={S.expSection}>
                    <div style={S.expTitle}>Seminar</div>
                    <ItemBox label="Seminar" done={d.seminar_done} color="#6A1B9A" />
                  </div>

                  {/* Signature block */}
                  <div style={S.signBlock}>
                    {d.overall_status === "approved" ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#2E7D32" }}>
                          ✅ Faculty Signature
                        </div>
                        <div style={{
                          fontFamily: "Georgia, serif",
                          fontSize: 28, color: "#1A237E",
                          fontStyle: "italic", fontWeight: "bold",
                          borderBottom: "2px solid #1A237E44",
                          paddingBottom: 4, marginTop: 4,
                        }}>
                          {d.faculty_name.split(" ").map(w => w[0]).join("")}
                        </div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                          {d.faculty_name} · {new Date(d.approved_at).toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#E65100" }}>
                          ⏳ Pending Faculty Approval
                        </div>
                        {d.faculty_remarks && (
                          <div style={{ fontSize: 12, color: "#d32f2f", marginTop: 4 }}>
                            Note: {d.faculty_remarks}
                          </div>
                        )}
                        <button
                          disabled={requesting}
                          onClick={e => { e.stopPropagation(); requestApproval(d.req_id); }}
                          style={S.reqBtn}>
                          {requesting ? "Sending..." : "Request Approval"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── PRINT VIEW ────────────────────────────────────────── */}
      {tab === "print" && (
        <div style={{ padding: "16px 20px 40px" }}>
          <div style={S.printCard}>
            {/* College header */}
            <div style={S.printHeader}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                STATE ENGINEERING COLLEGE
              </div>
              <div style={{ fontSize: 11, color: "#90CAF9", marginTop: 2 }}>
                Department of {user?.dept_name}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#FFD54F",
                marginTop: 8, letterSpacing: 1 }}>
                NO OBJECTION CERTIFICATE
              </div>
            </div>

            {/* Student info */}
            <div style={S.infoGrid}>
              {[
                ["Name",     user?.name],
                ["Roll No.", user?.roll_number],
                ["Branch",   user?.dept_name],
                ["Semester", `Semester ${user?.semester}`],
              ].map(([l, v]) => (
                <div key={l} style={S.infoCell}>
                  <div style={{ fontSize: 9, color: "#999", textTransform: "uppercase" }}>{l}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={S.tableHeader}>
              {["#","Subject","Faculty","A1","A2","A3","Q1","Q2","Q3","SEM","Signature"].map(h => (
                <div key={h} style={{ ...S.th, flex: h === "Subject" || h === "Faculty" ? 2 : 1 }}>{h}</div>
              ))}
            </div>

            {dues.map((d, i) => (
              <div key={d.req_id} style={{
                ...S.tableRow,
                background: i % 2 === 0 ? "white" : "#fafafa",
              }}>
                <div style={{ ...S.td, flex: 1 }}>{i + 1}</div>
                <div style={{ ...S.td, flex: 2, fontWeight: 600 }}>{d.subject_code}</div>
                <div style={{ ...S.td, flex: 2, fontSize: 10 }}>{d.faculty_name}</div>
                {[d.assign1_submitted, d.assign2_submitted, d.assign3_submitted,
                  d.mcq1_cleared, d.mcq2_cleared, d.mcq3_cleared,
                  d.seminar_done].map((done, j) => (
                  <div key={j} style={{ ...S.td, flex: 1, justifyContent: "center" }}>
                    <CheckBox done={done} />
                  </div>
                ))}
                <div style={{ ...S.td, flex: 1, justifyContent: "center" }}>
                  {d.overall_status === "approved" ? (
                    <span style={{
                      fontFamily: "Georgia,serif", fontSize: 16,
                      color: "#1A237E", fontStyle: "italic", fontWeight: "bold",
                      borderBottom: "1px solid #1A237E",
                    }}>
                      {d.faculty_name.split(" ").map(w => w[0]).join("")}
                    </span>
                  ) : (
                    <span style={{ fontSize: 9, color: "#FF9800",
                      border: "1px dashed #FF9800", borderRadius: 4, padding: "1px 4px" }}>
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Footer */}
            <div style={S.printFooter}>
              <div>
                <div style={{ fontSize: 10, color: "#999" }}>Generated on</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>
                  {new Date().toLocaleString()}
                </div>
                <div style={{ fontSize: 9, color: "#aaa", marginTop: 2 }}>
                  🔒 Data verified from server — cannot be altered
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 80, borderBottom: "1.5px solid #1A237E",
                  marginBottom: 4 }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: "#1A237E" }}>
                  HOD Signature
                </div>
              </div>
            </div>

            {/* Status banner */}
            <div style={{
              background: summary.allClear ? "#4CAF50" : "#FF9800",
              padding: "10px 16px", textAlign: "center",
            }}>
              <div style={{ color: "white", fontSize: 12, fontWeight: 800 }}>
                {summary.allClear
                  ? "✓ ALL DUES CLEARED — ELIGIBLE FOR EXAMINATION"
                  : `⚠ ${summary.total - summary.approved} SUBJECT(S) PENDING`}
              </div>
            </div>
          </div>

          {/* Print button */}
          <button
            disabled={!summary.allClear}
            onClick={() => window.print()}
            style={{
              ...S.printBtn,
              background: summary.allClear ? "#1A237E" : "#ccc",
              cursor: summary.allClear ? "pointer" : "not-allowed",
            }}>
            {summary.allClear
              ? "🖨  Submit for Print / Save PDF"
              : `Complete ${summary.total - summary.approved} pending dues to unlock print`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────
const Chip = ({ label, done, color = "#388E3C" }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  }}>
    <div style={{
      width: 20, height: 20, borderRadius: "50%",
      background: done ? color : "#f0f0f0",
      border: done ? "none" : "1.5px solid #ddd",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {done && <span style={{ color: "white", fontSize: 11 }}>✓</span>}
    </div>
    <div style={{ fontSize: 8, color: "#999" }}>{label}</div>
  </div>
);

const ItemBox = ({ label, done, color }) => (
  <div style={{
    flex: 1, borderRadius: 10, padding: "10px 8px",
    background: done ? `${color}11` : "#fafafa",
    border: `1.5px solid ${done ? color+"44" : "#eee"}`,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
  }}>
    <div style={{
      width: 24, height: 24, borderRadius: "50%",
      background: done ? color : "#eee",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {done && <span style={{ color: "white", fontSize: 13 }}>✓</span>}
    </div>
    <div style={{ fontSize: 10, fontWeight: 600, color: done ? color : "#aaa" }}>
      {label}
    </div>
  </div>
);

const S = {
  page: { minHeight: "100vh", background: "#f2f4f8",
    fontFamily: "'Segoe UI', sans-serif" },
  header: {
    background: "linear-gradient(135deg,#1A237E,#1565C0)",
    padding: "20px 24px", display: "flex",
    justifyContent: "space-between", alignItems: "flex-start",
  },
  navBtn: {
    padding: "8px 14px", background: "#ffffff22", color: "white",
    border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer",
  },
  logoutBtn: {
    padding: "8px 14px", background: "#ff444422", color: "#ffaaaa",
    border: "1px solid #ff444444", borderRadius: 8, fontSize: 12, cursor: "pointer",
  },
  progressCard: {
    background: "white", margin: "16px 20px 0", borderRadius: 14,
    padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  tabs: { display: "flex", background: "white",
    borderBottom: "1px solid #eee", margin: "0 0 0" },
  tab: {
    flex: 1, padding: "14px 0", textAlign: "center",
    fontSize: 13, fontWeight: 700, cursor: "pointer",
    transition: "all 0.2s",
  },
  list: { padding: "14px 20px", display: "flex", flexDirection: "column", gap: 12 },
  card: {
    background: "white", borderRadius: 14, padding: 14,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    cursor: "pointer", transition: "box-shadow 0.2s",
  },
  cardHead: { display: "flex", alignItems: "center", gap: 12 },
  initials: {
    width: 42, height: 42, borderRadius: 10, color: "white",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 14, flexShrink: 0,
  },
  subjectName: { fontSize: 13, fontWeight: 700, color: "#1a1a2e" },
  subjectMeta: { fontSize: 11, color: "#888", marginTop: 2 },
  badge: {
    padding: "4px 10px", borderRadius: 20, color: "white",
    fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
  },
  chips: { display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" },
  expanded: { marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f0f0" },
  expSection: { marginBottom: 14 },
  expTitle: {
    fontSize: 10, fontWeight: 700, color: "#555",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8,
  },
  signBlock: {
    background: "#f8f8f8", borderRadius: 12, padding: "14px 16px",
    marginTop: 4, display: "flex", flexDirection: "column",
  },
  reqBtn: {
    marginTop: 12, padding: "10px 20px", background: "#1A237E",
    color: "white", border: "none", borderRadius: 10, fontSize: 13,
    fontWeight: 700, cursor: "pointer", alignSelf: "flex-start",
  },
  // Print view
  printCard: {
    background: "white", borderRadius: 14, overflow: "hidden",
    border: "1px solid #ddd", boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
  },
  printHeader: {
    background: "#1A237E", padding: "16px 20px", textAlign: "center",
  },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #eee" },
  infoCell: { padding: "10px 14px", borderRight: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0" },
  tableHeader: {
    display: "flex", background: "#E3F2FD",
    padding: "6px 10px", borderBottom: "1px solid #ddd",
  },
  th: {
    fontSize: 8, fontWeight: 800, color: "#1A237E",
    textAlign: "center", textTransform: "uppercase", letterSpacing: 0.3,
  },
  tableRow: { display: "flex", padding: "8px 10px", borderBottom: "1px solid #f0f0f0", alignItems: "center" },
  td: { fontSize: 10, color: "#333", display: "flex", alignItems: "center" },
  printFooter: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-end", padding: "14px 20px", borderTop: "1px solid #eee",
  },
  printBtn: {
    width: "100%", padding: 16, border: "none", borderRadius: 12,
    color: "white", fontSize: 14, fontWeight: 700, marginTop: 14,
    letterSpacing: 0.3,
  },
};
