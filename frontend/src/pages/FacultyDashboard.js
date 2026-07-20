// src/pages/FacultyDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const STATUS_OPTIONS = [
  { value: "available",  label: "Available",  color: "#4CAF50", emoji: "✅" },
  { value: "busy",       label: "Busy",        color: "#FF9800", emoji: "⏳" },
  { value: "in_class",   label: "In Class",    color: "#1565C0", emoji: "📚" },
  { value: "in_meeting", label: "In Meeting",  color: "#9C27B0", emoji: "🤝" },
  { value: "absent",     label: "Absent",      color: "#f44336", emoji: "❌" },
];

export default function FacultyDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab,          setTab]          = useState("status");
  const [curStatus,    setCurStatus]    = useState("available");
  const [rooms,        setRooms]        = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [availUntil,   setAvailUntil]   = useState("");
  const [notes,        setNotes]        = useState("");
  const [schedule,     setSchedule]     = useState([]);
  const [pending,      setPending]      = useState([]);
  const [pinModal,     setPinModal]     = useState(null);
  const [pin,          setPin]          = useState("");
  const [qrInput,      setQrInput]      = useState("");

  // ── Student Management State ──────────────────────────────
  const [students,     setStudents]     = useState([]);
  const [loadStudents, setLoadStudents] = useState(false);
  const [stuSearch,    setStuSearch]    = useState("");
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [stuForm,      setStuForm]      = useState({
    name: "", email: "", password: "student123",
    dept_id: "1", roll_number: "", semester: "",
    batch_year: new Date().getFullYear(), section: "",
  });
  const [addingStudent, setAddingStudent] = useState(false);

  useEffect(() => {
    loadSchedule();
    loadPending();
    loadRooms();
  }, []);

  // Load students when tab changes to students
  useEffect(() => {
    if (tab === "students") loadStudents_();
  }, [tab]);

  const loadRooms = async () => {
    try {
      const { data } = await axios.get(
        "https://smart-campus-w54h.onrender.com/api/admin/rooms");
      setRooms(data.rooms || []);
    } catch (_) {}
  };

  const loadSchedule = async () => {
    try {
      const { data } = await axios.get(
        "https://smart-campus-w54h.onrender.com/api/faculty/today-schedule");
      setSchedule(data.schedule || []);
    } catch (_) {}
  };

  const loadPending = async () => {
    try {
      const { data } = await axios.get(
        "https://smart-campus-w54h.onrender.com/api/nodues/faculty/pending");
      setPending(data.requests || []);
    } catch (_) {}
  };

  const loadStudents_ = async () => {
    setLoadStudents(true);
    try {
      const { data } = await axios.get(
        "https://smart-campus-w54h.onrender.com/api/admin/users");
      const studs = (data.users || []).filter(u => u.role === "student");
      setStudents(studs);
    } catch (_) {}
    finally { setLoadStudents(false); }
  };

  const updateStatus = async () => {
    try {
      await axios.put("https://smart-campus-w54h.onrender.com/api/faculty/status", {
        status: curStatus,
        room_id: selectedRoom || null,
        available_until: availUntil || null,
        notes: notes || null,
      });
      toast.success("Status updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleQrCheckin = async () => {
    if (!qrInput.trim()) return toast.error("Enter QR code value");
    try {
      const { data } = await axios.post(
        "https://smart-campus-w54h.onrender.com/api/faculty/qr-checkin", {
        qr_code_hash: qrInput.trim(),
        device_id:    navigator.userAgent,
      });
      toast.success(data.message);
      setQrInput("");
      loadSchedule();
    } catch (err) {
      toast.error(err.response?.data?.message || "QR check-in failed");
    }
  };

  const approveRequest = async (req_id, action) => {
    if (!pin.trim()) return toast.error("Enter your PIN");
    try {
      await axios.post(
        `https://smart-campus-w54h.onrender.com/api/nodues/approve/${req_id}`, {
        pin, action,
        remarks: action === "reject" ? "Incomplete submissions" : "",
      });
      toast.success(`Request ${action}d!`);
      setPinModal(null);
      setPin("");
      loadPending();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const updateItems = async (req_id, field, value) => {
    try {
      await axios.post(
        `https://smart-campus-w54h.onrender.com/api/nodues/update-items/${req_id}`,
        { [field]: value });
      toast.success("Updated");
      loadPending();
    } catch (_) { toast.error("Failed"); }
  };

  const addStudent = async () => {
    if (!stuForm.name || !stuForm.email ||
        !stuForm.roll_number || !stuForm.semester) {
      toast.error("Please fill Name, Email, Roll Number and Semester");
      return;
    }
    setAddingStudent(true);
    try {
      await axios.post("https://smart-campus-w54h.onrender.com/api/auth/register", {
        name:        stuForm.name,
        email:       stuForm.email,
        password:    stuForm.password || "student123",
        role:        "student",
        dept_id:     parseInt(stuForm.dept_id),
        roll_number: stuForm.roll_number,
        semester:    parseInt(stuForm.semester),
        batch_year:  parseInt(stuForm.batch_year),
        section:     stuForm.section,
      });
      toast.success(`✅ ${stuForm.name} added to MySQL!`);
      setStuForm({
        name: "", email: "", password: "student123",
        dept_id: "1", roll_number: "", semester: "",
        batch_year: new Date().getFullYear(), section: "",
      });
      setShowAddForm(false);
      loadStudents_();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add student");
    } finally {
      setAddingStudent(false);
    }
  };

  const TABS = [
    { key: "status",   label: "My Status"                      },
    { key: "schedule", label: "Today's Classes"                 },
    { key: "approvals",label: `Approvals (${pending.length})`  },
    { key: "qr",       label: "QR Check-In"                    },
    { key: "students", label: "🎓 My Students"                  },
  ];

  const DEPTS = [
    { id:1, name:"CSE" }, { id:2, name:"ECE" },
    { id:3, name:"MECH" }, { id:4, name:"MATHS" }, { id:5, name:"PHY" },
  ];

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(stuSearch.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(stuSearch.toLowerCase())
  );

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <div style={{ color:"#90CAF9", fontSize:10,
            textTransform:"uppercase", letterSpacing:1 }}>
            Faculty Portal
          </div>
          <div style={{ color:"white", fontSize:20,
            fontWeight:800, marginTop:2 }}>
            {user?.name}
          </div>
          <div style={{ color:"#90CAF9", fontSize:12 }}>
            {user?.designation || "Faculty"} · {user?.dept_name}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column",
          gap:8, alignItems:"flex-end" }}>
          <button onClick={logout} style={S.logoutBtn}>Logout</button>
          <button onClick={() => navigate("/faculty/students")}
            style={S.studentsBtn}>
            🎓 Student Page
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{
            ...S.tabItem,
            color:        tab === t.key ? "#00695C" : "#999",
            borderBottom: tab === t.key
              ? "2.5px solid #00695C" : "2.5px solid transparent",
          }}>
            {t.label}
          </div>
        ))}
      </div>

      <div style={S.content}>

        {/* ── STATUS TAB ── */}
        {tab === "status" && (
          <div style={S.section}>
            <div style={S.sectionTitle}>Update Your Status</div>
            <div style={S.statusGrid}>
              {STATUS_OPTIONS.map(opt => (
                <div key={opt.value} onClick={() => setCurStatus(opt.value)}
                  style={{
                    ...S.statusOption,
                    border: `2px solid ${curStatus === opt.value
                      ? opt.color : "#eee"}`,
                    background: curStatus === opt.value
                      ? `${opt.color}11` : "white",
                  }}>
                  <span style={{ fontSize:20 }}>{opt.emoji}</span>
                  <span style={{ fontSize:12, fontWeight:700,
                    color: curStatus === opt.value ? opt.color : "#555" }}>
                    {opt.label}
                  </span>
                </div>
              ))}
            </div>

            <div style={S.formGroup}>
              <label style={S.label}>Current Room</label>
              <select value={selectedRoom}
                onChange={e => setSelectedRoom(e.target.value)}
                style={S.input}>
                <option value="">Select room</option>
                {rooms.map(r => (
                  <option key={r.room_id} value={r.room_id}>
                    Room {r.room_number} — Floor {r.floor}
                  </option>
                ))}
              </select>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Available Until</label>
              <input type="datetime-local" value={availUntil}
                onChange={e => setAvailUntil(e.target.value)}
                style={S.input} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Notes (optional)</label>
              <input type="text"
                placeholder="e.g. Will be back after lunch"
                value={notes} onChange={e => setNotes(e.target.value)}
                style={S.input} />
            </div>
            <button onClick={updateStatus} style={S.btn}>
              Update Status
            </button>
          </div>
        )}

        {/* ── SCHEDULE TAB ── */}
        {tab === "schedule" && (
          <div style={S.section}>
            <div style={S.sectionTitle}>Today's Timetable</div>
            {schedule.length === 0 ? (
              <div style={S.empty}>No classes scheduled for today 🎉</div>
            ) : schedule.map((cls, i) => (
              <div key={i} style={S.classCard}>
                <div style={{ width:4, borderRadius:4,
                  background:"#1A237E", alignSelf:"stretch" }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700,
                    color:"#1a1a2e" }}>{cls.subject_name}</div>
                  <div style={{ fontSize:12, color:"#888",
                    marginTop:2 }}>{cls.subject_code}</div>
                  <div style={{ fontSize:12, color:"#555", marginTop:4 }}>
                    📍 Room {cls.room_number}, Floor {cls.floor}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:700,
                    color:"#1565C0" }}>
                    {cls.start_time.slice(0,5)}
                  </div>
                  <div style={{ fontSize:11, color:"#aaa" }}>
                    to {cls.end_time.slice(0,5)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── APPROVALS TAB ── */}
        {tab === "approvals" && (
          <div style={S.section}>
            <div style={S.sectionTitle}>Pending No-Dues Approvals</div>
            {pending.length === 0 ? (
              <div style={S.empty}>No pending requests ✅</div>
            ) : pending.map(req => (
              <div key={req.request_id} style={S.approvalCard}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700 }}>
                    {req.student_name}
                  </div>
                  <div style={{ fontSize:12, color:"#888" }}>
                    {req.roll_number} · {req.subject_name}
                  </div>
                  <div style={{ fontSize:11, color:"#aaa", marginTop:2 }}>
                    Requested: {new Date(req.requested_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap",
                  gap:8, marginTop:12 }}>
                  {[
                    { key:"assign1_submitted", label:"Assign 1",
                      val:req.assign1_submitted },
                    { key:"assign2_submitted", label:"Assign 2",
                      val:req.assign2_submitted },
                    { key:"assign3_submitted", label:"Assign 3",
                      val:req.assign3_submitted },
                    { key:"mcq1_cleared", label:"MCQ 1",
                      val:req.mcq1_cleared },
                    { key:"mcq2_cleared", label:"MCQ 2",
                      val:req.mcq2_cleared },
                    { key:"mcq3_cleared", label:"MCQ 3",
                      val:req.mcq3_cleared },
                    { key:"seminar_done", label:"Seminar",
                      val:req.seminar_done },
                  ].map(item => (
                    <div key={item.key}
                      onClick={() => updateItems(
                        req.req_id, item.key, !item.val)}
                      style={{
                        ...S.toggleChip,
                        background: item.val ? "#4CAF50" : "#f5f5f5",
                        color:      item.val ? "white"   : "#555",
                        border: `1.5px solid ${item.val
                          ? "#4CAF50" : "#ddd"}`,
                      }}>
                      {item.val ? "✓ " : ""}{item.label}
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:10, marginTop:14 }}>
                  <button
                    onClick={() => setPinModal({
                      req_id: req.req_id, action:"approve" })}
                    style={{ ...S.approveBtn, background:"#4CAF50" }}>
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => setPinModal({
                      req_id: req.req_id, action:"reject" })}
                    style={{ ...S.approveBtn, background:"#f44336" }}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── QR CHECK-IN TAB ── */}
        {tab === "qr" && (
          <div style={S.section}>
            <div style={S.sectionTitle}>QR Code Check-In</div>
            <p style={{ color:"#666", fontSize:13, lineHeight:1.6 }}>
              Scan the QR code posted at your classroom door to confirm
              your physical location in real-time.
            </p>
            <div style={S.formGroup}>
              <label style={S.label}>QR Code Value</label>
              <input type="text"
                placeholder="e.g. QR_CSE_208"
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                style={S.input} />
            </div>
            <button onClick={handleQrCheckin} style={S.btn}>
              📍 Check In to This Room
            </button>
          </div>
        )}

        {/* ── STUDENTS TAB ── */}
        {tab === "students" && (
          <div style={S.section}>

            {/* Header row */}
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", flexWrap:"wrap", gap:10 }}>
              <div style={S.sectionTitle}>
                My Students ({students.length})
              </div>
              <button onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  padding:"10px 18px",
                  background: showAddForm ? "#f44336" : "#00695C",
                  color:"white", border:"none", borderRadius:10,
                  fontSize:13, fontWeight:700, cursor:"pointer",
                }}>
                {showAddForm ? "✕ Cancel" : "➕ Add New Student"}
              </button>
            </div>

            {/* ── ADD STUDENT FORM ── */}
            {showAddForm && (
              <div style={{
                background:"white", borderRadius:14, overflow:"hidden",
                border:"1px solid #e0e0e0",
                boxShadow:"0 2px 12px rgba(0,0,0,0.08)",
              }}>
                <div style={{
                  background:"linear-gradient(135deg,#1A237E,#1565C0)",
                  padding:"14px 18px",
                }}>
                  <div style={{ color:"white", fontWeight:800,
                    fontSize:14 }}>🎓 Add New Student</div>
                  <div style={{ color:"#90CAF9", fontSize:11,
                    marginTop:2 }}>
                    Student will be saved to MySQL and can login immediately
                  </div>
                </div>

                <div style={{ padding:16, display:"flex",
                  flexDirection:"column", gap:12 }}>

                  {/* Row 1 */}
                  <div style={{ display:"grid",
                    gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div style={S.formGroup}>
                      <label style={S.label}>
                        Full Name <span style={{color:"red"}}>*</span>
                      </label>
                      <input placeholder="e.g. Arjun Nair"
                        value={stuForm.name}
                        onChange={e => setStuForm(f =>
                          ({...f, name: e.target.value}))}
                        style={S.input} />
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>
                        Email <span style={{color:"red"}}>*</span>
                      </label>
                      <input type="email"
                        placeholder="roll@college.edu"
                        value={stuForm.email}
                        onChange={e => setStuForm(f =>
                          ({...f, email: e.target.value}))}
                        style={S.input} />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div style={{ display:"grid",
                    gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                    <div style={S.formGroup}>
                      <label style={S.label}>
                        Roll Number <span style={{color:"red"}}>*</span>
                      </label>
                      <input placeholder="21CS045"
                        value={stuForm.roll_number}
                        onChange={e => setStuForm(f =>
                          ({...f, roll_number: e.target.value}))}
                        style={S.input} />
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>
                        Semester <span style={{color:"red"}}>*</span>
                      </label>
                      <input type="number" placeholder="6"
                        min="1" max="8"
                        value={stuForm.semester}
                        onChange={e => setStuForm(f =>
                          ({...f, semester: e.target.value}))}
                        style={S.input} />
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Section</label>
                      <input placeholder="A"
                        value={stuForm.section}
                        onChange={e => setStuForm(f =>
                          ({...f, section: e.target.value}))}
                        style={S.input} />
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div style={{ display:"grid",
                    gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                    <div style={S.formGroup}>
                      <label style={S.label}>Department</label>
                      <select value={stuForm.dept_id}
                        onChange={e => setStuForm(f =>
                          ({...f, dept_id: e.target.value}))}
                        style={S.input}>
                        {DEPTS.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Batch Year</label>
                      <input type="number" placeholder="2021"
                        value={stuForm.batch_year}
                        onChange={e => setStuForm(f =>
                          ({...f, batch_year: e.target.value}))}
                        style={S.input} />
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Login Password</label>
                      <input placeholder="student123"
                        value={stuForm.password}
                        onChange={e => setStuForm(f =>
                          ({...f, password: e.target.value}))}
                        style={S.input} />
                    </div>
                  </div>

                  <button onClick={addStudent}
                    disabled={addingStudent}
                    style={{
                      ...S.btn,
                      background: addingStudent ? "#aaa" : "#1A237E",
                      fontSize:14,
                    }}>
                    {addingStudent
                      ? "⏳ Saving to MySQL..."
                      : "➕ Add Student to MySQL"}
                  </button>
                </div>
              </div>
            )}

            {/* ── SEARCH BAR ── */}
            <input
              placeholder="🔍 Search student by name or email..."
              value={stuSearch}
              onChange={e => setStuSearch(e.target.value)}
              style={{
                ...S.input, width:"100%",
                boxSizing:"border-box",
              }} />

            {/* ── STUDENT LIST ── */}
            {loadStudents ? (
              <div style={S.empty}>Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div style={{
                background:"white", borderRadius:14, padding:40,
                textAlign:"center", color:"#aaa",
                boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize:48, marginBottom:10 }}>🎓</div>
                <div style={{ fontWeight:700, marginBottom:4 }}>
                  No students found
                </div>
                <div style={{ fontSize:13 }}>
                  Click "➕ Add New Student" to add one!
                </div>
              </div>
            ) : (
              <div style={{
                background:"white", borderRadius:14, overflow:"hidden",
                boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
                border:"1px solid #eee",
              }}>
                {/* Table header */}
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"2fr 1fr 1fr 1fr",
                  padding:"10px 16px",
                  background:"#E0F2F1",
                  borderBottom:"1px solid #eee",
                }}>
                  {["Student","Semester","Section","Dept"].map(h => (
                    <div key={h} style={{ fontSize:10, fontWeight:800,
                      color:"#00695C", textTransform:"uppercase",
                      letterSpacing:0.5 }}>{h}</div>
                  ))}
                </div>

                {filteredStudents.map((s, i) => (
                  <div key={s.user_id} style={{
                    display:"grid",
                    gridTemplateColumns:"2fr 1fr 1fr 1fr",
                    padding:"12px 16px", alignItems:"center",
                    background: i % 2 === 0 ? "white" : "#f9f9f9",
                    borderBottom:"1px solid #f0f0f0",
                  }}>
                    {/* Name + roll */}
                    <div style={{ display:"flex",
                      alignItems:"center", gap:10 }}>
                      <div style={{
                        width:36, height:36, borderRadius:9,
                        background:"#1A237E", color:"white",
                        display:"flex", alignItems:"center",
                        justifyContent:"center",
                        fontWeight:800, fontSize:14, flexShrink:0,
                      }}>
                        {s.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700,
                          color:"#1a1a2e" }}>{s.name}</div>
                        <div style={{ fontSize:11,
                          color:"#888" }}>{s.email}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:13,
                      color:"#333" }}>Sem {s.semester || "—"}</div>
                    <div style={{ fontSize:13,
                      color:"#333" }}>{s.section || "—"}</div>
                    <div style={{ fontSize:12,
                      color:"#888" }}>{s.dept_name || "CSE"}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Refresh button */}
            <button onClick={loadStudents_}
              style={{ ...S.btn, background:"#455A64", fontSize:13 }}>
              🔄 Refresh List
            </button>

          </div>
        )}
      </div>

      {/* ── PIN Modal ── */}
      {pinModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ fontSize:16, fontWeight:800, marginBottom:8,
              color: pinModal.action==="approve" ? "#2E7D32" : "#C62828" }}>
              {pinModal.action === "approve"
                ? "✅ Confirm Approval" : "❌ Confirm Rejection"}
            </div>
            <p style={{ fontSize:13, color:"#555", marginBottom:16 }}>
              Enter your login password as approval PIN.
              This digitally signs the record.
            </p>
            <input type="password" placeholder="Your password / PIN"
              value={pin} onChange={e => setPin(e.target.value)}
              style={{ ...S.input, marginBottom:12 }} />
            <div style={{ display:"flex", gap:10 }}>
              <button
                onClick={() => approveRequest(
                  pinModal.req_id, pinModal.action)}
                style={{
                  ...S.btn, flex:1,
                  background: pinModal.action === "approve"
                    ? "#4CAF50" : "#f44336",
                }}>
                Confirm
              </button>
              <button onClick={() => { setPinModal(null); setPin(""); }}
                style={{ ...S.btn, background:"#aaa", flex:1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { minHeight:"100vh", background:"#f2f4f8",
    fontFamily:"'Segoe UI', sans-serif" },
  header: {
    background:"linear-gradient(135deg,#00695C,#00897B)",
    padding:"20px 24px", display:"flex",
    justifyContent:"space-between", alignItems:"flex-start",
  },
  logoutBtn: {
    padding:"8px 16px", background:"#ff444422",
    color:"#ffaaaa", border:"1px solid #ff444444",
    borderRadius:8, fontSize:12, cursor:"pointer",
  },
  studentsBtn: {
    padding:"8px 14px", background:"rgba(255,255,255,0.2)",
    color:"white", border:"1px solid rgba(255,255,255,0.4)",
    borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer",
  },
  tabBar: { display:"flex", background:"white",
    borderBottom:"1px solid #eee", overflowX:"auto" },
  tabItem: {
    padding:"13px 16px", fontSize:12, fontWeight:700,
    cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.2s",
  },
  content: { padding:"16px 20px" },
  section: { display:"flex", flexDirection:"column", gap:12 },
  sectionTitle: { fontSize:15, fontWeight:800, color:"#1a1a2e" },
  statusGrid: { display:"grid",
    gridTemplateColumns:"1fr 1fr 1fr", gap:10 },
  statusOption: {
    borderRadius:12, padding:"12px 8px",
    display:"flex", flexDirection:"column",
    alignItems:"center", gap:6,
    cursor:"pointer", transition:"all 0.2s",
  },
  formGroup: { display:"flex", flexDirection:"column", gap:6 },
  label: { fontSize:12, fontWeight:600, color:"#555" },
  input: {
    padding:"11px 14px", border:"1.5px solid #ddd",
    borderRadius:10, fontSize:13, outline:"none",
  },
  btn: {
    padding:"13px", background:"#00695C", color:"white",
    border:"none", borderRadius:10, fontSize:14,
    fontWeight:700, cursor:"pointer",
  },
  classCard: {
    background:"white", borderRadius:14, padding:"14px 16px",
    display:"flex", gap:14, alignItems:"flex-start",
    boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
  },
  approvalCard: {
    background:"white", borderRadius:14, padding:16,
    boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
  },
  toggleChip: {
    padding:"6px 12px", borderRadius:20, fontSize:11,
    fontWeight:700, cursor:"pointer", transition:"all 0.2s",
  },
  approveBtn: {
    flex:1, padding:12, color:"white", border:"none",
    borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer",
  },
  empty: { textAlign:"center", color:"#aaa",
    padding:"40px 0", fontSize:14 },
  overlay: {
    position:"fixed", inset:0, background:"#00000066",
    display:"flex", alignItems:"center",
    justifyContent:"center", zIndex:999,
  },
  modal: {
    background:"white", borderRadius:20, padding:28,
    width:320, boxShadow:"0 20px 60px rgba(0,0,0,0.3)",
  },
};