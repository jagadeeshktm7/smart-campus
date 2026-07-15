import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const C = {
  teal:   "#00695C",
  tealL:  "#E0F2F1",
  navy:   "#1A237E",
  green:  "#2E7D32",
  red:    "#C62828",
  orange: "#E65100",
  border: "#E0E0E0",
  grey:   "#F5F5F5",
  text:   "#1A1A2E",
  muted:  "#757575",
  light:  "#F0FAF9",
};

const DEPT_OPTIONS = [
  { id: 1, name: "CSE" }, { id: 2, name: "ECE" },
  { id: 3, name: "MECH" }, { id: 4, name: "MATHS" }, { id: 5, name: "PHY" },
];

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      background: type === "success" ? C.green : C.red,
      color: "white", padding: "12px 20px", borderRadius: 12,
      fontWeight: 700, fontSize: 13,
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    }}>
      {type === "success" ? "✅" : "❌"} {msg}
    </div>
  );
}

// ── No-Dues Checklist Modal ───────────────────────────────────
function NoDuesModal({ student, token, onClose, onSaved }) {
  const [items, setItems] = useState({
    assign1_submitted: false, assign2_submitted: false,
    assign3_submitted: false, mcq1_cleared: false,
    mcq2_cleared: false,      mcq3_cleared: false,
    seminar_done: false,
  });
  const [subjects,    setSubjects]    = useState([]);
  const [selSubject,  setSelSubject]  = useState("");
  const [loading,     setLoading]     = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    // Load subjects for faculty's dept
    axios.get("/api/timetable", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => {
      const subs = r.data.timetable || [];
      // unique subjects
      const seen = new Set();
      const unique = subs.filter(s => {
        if (seen.has(s.subject_code)) return false;
        seen.add(s.subject_code);
        return true;
      });
      setSubjects(unique);
      if (unique.length) setSelSubject(unique[0].subject_id || "");
    }).catch(() => {}).finally(() => setLoadingSubs(false));
  }, [token]);

  const toggle = k => setItems(prev => ({ ...prev, [k]: !prev[k] }));

  const save = async () => {
    if (!selSubject) { onSaved("error", "Select a subject first"); return; }
    setLoading(true);
    try {
      // First create the no-dues requirement record
      await axios.post(`/api/nodues/update-items/${selSubject}`, {
        ...items,
      }, { headers: { Authorization: `Bearer ${token}` } });
      onSaved("success", `No-dues updated for ${student.name}`);
      onClose();
    } catch (err) {
      onSaved("error", err.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const CHECKS = [
    { key: "assign1_submitted", label: "Assignment 1", color: "#1565C0" },
    { key: "assign2_submitted", label: "Assignment 2", color: "#1565C0" },
    { key: "assign3_submitted", label: "Assignment 3", color: "#1565C0" },
    { key: "mcq1_cleared",      label: "MCQ Test 1",   color: "#6A1B9A" },
    { key: "mcq2_cleared",      label: "MCQ Test 2",   color: "#6A1B9A" },
    { key: "mcq3_cleared",      label: "MCQ Test 3",   color: "#6A1B9A" },
    { key: "seminar_done",      label: "Seminar",       color: "#00695C" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 999, padding: 20,
    }}>
      <div style={{
        background: "white", borderRadius: 20, width: "100%",
        maxWidth: 480, maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${C.teal}, #00897B)`,
          padding: "18px 22px", borderRadius: "20px 20px 0 0",
          display: "flex", justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ color: "white", fontWeight: 800,
              fontSize: 15 }}>No-Dues Checklist</div>
            <div style={{ color: "#B2DFDB", fontSize: 12,
              marginTop: 2 }}>{student.name} — {student.roll_number}</div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.2)", border: "none",
            color: "white", width: 32, height: 32, borderRadius: "50%",
            fontSize: 16, cursor: "pointer", fontWeight: 700,
          }}>✕</button>
        </div>

        <div style={{ padding: 22 }}>
          {/* Subject selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700,
              color: C.muted, textTransform: "uppercase",
              letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              Subject
            </label>
            {loadingSubs ? (
              <div style={{ color: C.muted, fontSize: 13 }}>
                Loading subjects...
              </div>
            ) : subjects.length === 0 ? (
              <div style={{
                padding: "10px 14px", background: "#FFF3E0",
                borderRadius: 10, fontSize: 13, color: C.orange,
              }}>
                ⚠️ No timetable found. Add timetable first in Admin panel.
              </div>
            ) : (
              <select value={selSubject}
                onChange={e => setSelSubject(e.target.value)}
                style={{ width: "100%", padding: "10px 12px",
                  border: `1.5px solid ${C.border}`, borderRadius: 10,
                  fontSize: 13, background: "white" }}>
                {subjects.map(s => (
                  <option key={s.subject_code} value={s.subject_id}>
                    {s.subject_code} — {s.subject_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Checklist */}
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted,
            textTransform: "uppercase", letterSpacing: 0.5,
            marginBottom: 10 }}>
            Mark Completed Items
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CHECKS.map(c => (
              <div key={c.key} onClick={() => toggle(c.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 12, cursor: "pointer",
                  background: items[c.key] ? `${c.color}11` : C.grey,
                  border: `1.5px solid ${items[c.key] ? c.color+"44" : C.border}`,
                  transition: "all 0.15s",
                }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: items[c.key] ? c.color : "white",
                  border: `2px solid ${items[c.key] ? c.color : C.border}`,
                  display: "flex", alignItems: "center",
                  justifyContent: "center",
                }}>
                  {items[c.key] && (
                    <span style={{ color: "white",
                      fontSize: 13, fontWeight: 700 }}>✓</span>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600,
                  color: items[c.key] ? c.color : C.text }}>
                  {c.label}
                </span>
                {items[c.key] && (
                  <span style={{ marginLeft: "auto", fontSize: 10,
                    color: c.color, fontWeight: 700 }}>DONE</span>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{
            marginTop: 14, padding: "10px 14px",
            background: C.light, borderRadius: 10,
            display: "flex", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 12, color: C.teal, fontWeight: 700 }}>
              Items completed:
            </span>
            <span style={{ fontSize: 14, fontWeight: 900, color: C.teal }}>
              {Object.values(items).filter(Boolean).length} / 7
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={save} disabled={loading}
              style={{
                flex: 1, padding: 13,
                background: loading ? C.muted : C.teal,
                color: "white", border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 800, cursor: "pointer",
              }}>
              {loading ? "Saving..." : "💾 Save to MySQL"}
            </button>
            <button onClick={onClose}
              style={{
                padding: "13px 20px", background: C.grey,
                color: C.muted, border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Student Form ──────────────────────────────────────────
function AddStudentForm({ token, onSuccess }) {
  const blank = {
    name: "", email: "", password: "student123",
    dept_id: "1", roll_number: "", semester: "",
    batch_year: new Date().getFullYear(), section: "",
  };
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.roll_number || !form.semester) {
      onSuccess("error", "Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/auth/register", {
        name:        form.name,
        email:       form.email,
        password:    form.password || "student123",
        role:        "student",
        dept_id:     parseInt(form.dept_id),
        roll_number: form.roll_number,
        semester:    parseInt(form.semester),
        batch_year:  parseInt(form.batch_year),
        section:     form.section,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setForm(blank);
      onSuccess("success", `Student "${form.name}" added to MySQL ✅`);
    } catch (err) {
      onSuccess("error", err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, reqd, ...props }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: C.muted,
        textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label} {reqd && <span style={{ color: C.red }}>*</span>}
      </label>
      <input {...props} style={{
        padding: "9px 12px", border: `1.5px solid ${C.border}`,
        borderRadius: 9, fontSize: 13, outline: "none",
        background: "white", ...props.style,
      }} />
    </div>
  );

  return (
    <div style={{
      background: "white", borderRadius: 16, overflow: "hidden",
      border: `1px solid ${C.border}`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.navy}, #1565C0)`,
        padding: "14px 20px",
      }}>
        <div style={{ color: "white", fontWeight: 800, fontSize: 14 }}>
          🎓 Add New Student
        </div>
        <div style={{ color: "#90CAF9", fontSize: 11, marginTop: 2 }}>
          Student will be added to MySQL and can login immediately
        </div>
      </div>

      <div style={{ padding: 18, display: "flex",
        flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid",
          gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Full Name" reqd placeholder="e.g. Arjun Nair"
            value={form.name} onChange={e => set("name", e.target.value)} />
          <Field label="Email" reqd type="email"
            placeholder="roll@college.edu"
            value={form.email} onChange={e => set("email", e.target.value)} />
        </div>
        <div style={{ display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="Roll Number" reqd placeholder="21CS045"
            value={form.roll_number}
            onChange={e => set("roll_number", e.target.value)} />
          <Field label="Semester" reqd type="number"
            placeholder="6" min="1" max="8"
            value={form.semester}
            onChange={e => set("semester", e.target.value)} />
          <Field label="Section" placeholder="A"
            value={form.section}
            onChange={e => set("section", e.target.value)} />
        </div>
        <div style={{ display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted,
              textTransform: "uppercase", letterSpacing: 0.5 }}>
              Department <span style={{ color: C.red }}>*</span>
            </label>
            <select value={form.dept_id}
              onChange={e => set("dept_id", e.target.value)}
              style={{ padding: "9px 12px", border: `1.5px solid ${C.border}`,
                borderRadius: 9, fontSize: 13, background: "white" }}>
              {DEPT_OPTIONS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <Field label="Batch Year" type="number" placeholder="2021"
            value={form.batch_year}
            onChange={e => set("batch_year", e.target.value)} />
          <Field label="Login Password" placeholder="student123"
            value={form.password}
            onChange={e => set("password", e.target.value)} />
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{
            padding: 12, background: loading ? C.muted : C.navy,
            color: "white", border: "none", borderRadius: 10,
            fontSize: 14, fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
          }}>
          {loading ? "⏳ Saving to MySQL..." : "➕ Add Student"}
        </button>
      </div>
    </div>
  );
}

// ── Student List ──────────────────────────────────────────────
function StudentList({ students, loading, onOpenDues }) {
  const [search, setSearch] = useState("");
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.roll_number || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      background: "white", borderRadius: 16,
      border: `1px solid ${C.border}`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>
          My Students ({filtered.length})
        </div>
        <input placeholder="Search by name or roll..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: "7px 12px", border: `1.5px solid ${C.border}`,
            borderRadius: 8, fontSize: 12, outline: "none", width: 200 }} />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center",
          color: C.muted }}>Loading students...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          No students found. Add one above!
        </div>
      ) : (
        <div>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            padding: "8px 20px", background: C.light,
            borderBottom: `1px solid ${C.border}`,
          }}>
            {["Name / Roll", "Semester", "Section", "Dept", "No-Dues"].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 800,
                color: C.teal, textTransform: "uppercase",
                letterSpacing: 0.5 }}>{h}</div>
            ))}
          </div>

          {filtered.map((s, i) => (
            <div key={s.user_id || i} style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
              padding: "12px 20px", alignItems: "center",
              background: i % 2 === 0 ? "white" : C.grey,
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ display: "flex",
                alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: C.navy, color: "white",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 800, fontSize: 13,
                }}>
                  {s.name?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700,
                    color: C.text }}>{s.name}</div>
                  <div style={{ fontSize: 11,
                    color: C.muted }}>{s.roll_number || s.email}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.text }}>
                Sem {s.semester || "—"}
              </div>
              <div style={{ fontSize: 13, color: C.text }}>
                {s.section || "—"}
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>
                {s.dept_name || "CSE"}
              </div>
              <button onClick={() => onOpenDues(s)}
                style={{
                  padding: "6px 12px", background: C.tealL,
                  color: C.teal, border: `1px solid ${C.teal}44`,
                  borderRadius: 8, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}>
                📋 Manage Dues
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Faculty Student Management ──────────────────────────
export default function FacultyStudentManagement() {
  const [tab,         setTab]         = useState("add");
  const [students,    setStudents]    = useState([]);
  const [loadStudents,setLoadStudents]= useState(false);
  const [duesModal,   setDuesModal]   = useState(null);
  const [toast,       setToast]       = useState(null);

  const token = localStorage.getItem("sc_token");

  const fetchStudents = useCallback(async () => {
    setLoadStudents(true);
    try {
      const { data } = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const studs = (data.users || []).filter(u => u.role === "student");
      setStudents(studs);
    } catch (_) {}
    finally { setLoadStudents(false); }
  }, [token]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const showToast = (type, msg) => setToast({ type, msg });

  const TABS = [
    { key: "add",      label: "➕ Add Student" },
    { key: "students", label: `🎓 My Students (${students.length})` },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#F0FAF9",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {toast && (
        <Toast msg={toast.msg} type={toast.type}
          onClose={() => setToast(null)} />
      )}
      {duesModal && (
        <NoDuesModal
          student={duesModal}
          token={token}
          onClose={() => setDuesModal(null)}
          onSaved={(type, msg) => {
            showToast(type, msg);
            setDuesModal(null);
          }}
        />
      )}

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.teal}, #00897B)`,
        padding: "20px 28px",
        display: "flex", justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ color: "#B2DFDB", fontSize: 11,
            textTransform: "uppercase", letterSpacing: 1 }}>
            Faculty Portal
          </div>
          <div style={{ color: "white", fontSize: 22,
            fontWeight: 900, marginTop: 2 }}>
            Student Management
          </div>
          <div style={{ color: "#B2DFDB", fontSize: 12, marginTop: 2 }}>
            Add students & update their no-dues checklist
          </div>
        </div>
        <button onClick={fetchStudents}
          style={{ padding: "10px 18px",
            background: "rgba(255,255,255,0.15)",
            color: "white", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 10, fontSize: 12, fontWeight: 700,
            cursor: "pointer" }}>
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "white",
        borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "14px 24px", fontSize: 13, fontWeight: 700,
            color: tab === t.key ? C.teal : C.muted,
            borderBottom: tab === t.key
              ? `3px solid ${C.teal}` : "3px solid transparent",
            cursor: "pointer", transition: "all 0.2s",
          }}>{t.label}</div>
        ))}
      </div>

      <div style={{ padding: "24px 28px",
        display: "flex", flexDirection: "column", gap: 20 }}>

        {tab === "add" && (
          <>
            <AddStudentForm token={token} onSuccess={(type, msg) => {
              showToast(type, msg);
              if (type === "success") fetchStudents();
            }} />

            {/* Info */}
            <div style={{
              background: "#E3F2FD", borderRadius: 12,
              padding: "14px 18px", border: "1px solid #90CAF9",
              display: "flex", gap: 12,
            }}>
              <span style={{ fontSize: 20 }}>ℹ️</span>
              <div style={{ fontSize: 13, color: "#1565C0",
                lineHeight: 1.6 }}>
                <strong>After adding a student:</strong><br />
                Go to <strong>"My Students"</strong> tab →
                click <strong>"Manage Dues"</strong> next to any student →
                tick their completed assignments, MCQs and seminars →
                click <strong>"Save to MySQL"</strong>.<br />
                The student can then see their no-dues status in their app.
              </div>
            </div>
          </>
        )}

        {tab === "students" && (
          <StudentList
            students={students}
            loading={loadStudents}
            onOpenDues={s => setDuesModal(s)}
          />
        )}
      </div>
    </div>
  );
}
