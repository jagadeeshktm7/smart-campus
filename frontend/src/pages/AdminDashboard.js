// src/pages/AdminDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const DEPTS = [
  { id:1, name:"CSE — Computer Science" },
  { id:2, name:"ECE — Electronics" },
  { id:3, name:"MECH — Mechanical" },
  { id:4, name:"MATHS — Mathematics" },
  { id:5, name:"PHY — Physics" },
];

const ROLE_COLOR = {
  admin:   "#4A148C",
  hod:     "#1565C0",
  faculty: "#00695C",
  student: "#1A237E",
};

const ROLE_BG = {
  admin:   "#F3E5F5",
  hod:     "#E3F2FD",
  faculty: "#E0F2F1",
  student: "#E8EAF6",
};

function Field({ label, required, children, ...props }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:11, fontWeight:700, color:"#757575",
        textTransform:"uppercase", letterSpacing:0.5 }}>
        {label}{required && <span style={{ color:"red" }}> *</span>}
      </label>
      {children ?? (
        <input {...props} style={{
          padding:"10px 12px", border:"1.5px solid #E0E0E0",
          borderRadius:10, fontSize:13, outline:"none",
          background:"white", width:"100%", boxSizing:"border-box",
          ...props.style,
        }} />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background:"white", borderRadius:14, padding:"20px",
      boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
      borderLeft:`4px solid ${color}`,
    }}>
      <div style={{ fontSize:28 }}>{icon}</div>
      <div style={{ fontSize:30, fontWeight:900, color, marginTop:6 }}>
        {value ?? 0}
      </div>
      <div style={{ fontSize:12, color:"#757575",
        fontWeight:600, marginTop:2 }}>{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [tab,      setTab]      = useState("dashboard");
  const [addRole,  setAddRole]  = useState("student");
  const [adding,   setAdding]   = useState(false);
  const [form,     setForm]     = useState(blankForm());

  const [users,      setUsers]      = useState([]);
  const [loadUsers,  setLoadUsers]  = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [stats,    setStats]    = useState({});
  const [rooms,    setRooms]    = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [roomForm, setRoomForm] = useState({
    room_number:"", floor:"", building:"Main Block", dept_id:"1"
  });
  const [addingRoom, setAddingRoom] = useState(false);

  const [subForm, setSubForm] = useState({
    subject_code:"", subject_name:"", dept_id:"1",
    semester:"", credits:"3"
  });
  const [addingSub, setAddingSub] = useState(false);

  const [ttForm, setTtForm] = useState({
    faculty_id:"", subject_id:"", room_id:"",
    day_of_week:"Monday", start_time:"", end_time:"",
    semester:"", academic_year:"2024-25",
  });
  const [addingTt, setAddingTt] = useState(false);

  function blankForm() {
    return {
      name:"", email:"", password:"", dept_id:"1", phone:"",
      roll_number:"", semester:"",
      batch_year: new Date().getFullYear(), section:"",
      employee_id:"", designation:"",
    };
  }

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    fetchStats();
    fetchUsers();
    fetchRooms();
    fetchSubjects();
  }

  const fetchStats = async () => {
    try {
      const { data } = await axios.get("https://smart-campus-w54h.onrender.com//api/admin/stats");
      setStats(data.stats || {});
    } catch (_) {}
  };

  const fetchUsers = useCallback(async () => {
    setLoadUsers(true);
    try {
      const { data } = await axios.get("https://smart-campus-w54h.onrender.com//api/admin/users");
      setUsers(data.users || []);
    } catch (_) {}
    finally { setLoadUsers(false); }
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get("https://smart-campus-w54h.onrender.com/api/admin/rooms");
      setRooms(data.rooms || []);
    } catch (_) {}
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await axios.get("https://smart-campus-w54h.onrender.com/api/timetable");
      const seen = new Set();
      const subs = (data.timetable || []).filter(t => {
        if (seen.has(t.subject_code)) return false;
        seen.add(t.subject_code);
        return true;
      });
      setSubjects(subs);
    } catch (_) {}
  };

  const handleAddUser = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, Email and Password are required"); return;
    }
    if (addRole === "student" && (!form.roll_number || !form.semester)) {
      toast.error("Roll Number and Semester required for students"); return;
    }
    if ((addRole === "faculty" || addRole === "hod") && !form.employee_id) {
      toast.error("Employee ID required for faculty/HOD"); return;
    }
    setAdding(true);
    try {
      await axios.post("https://smart-campus-w54h.onrender.com/api/auth/register", {
        name:     form.name,
        email:    form.email,
        password: form.password,
        role:     addRole,
        dept_id:  parseInt(form.dept_id),
        phone:    form.phone || undefined,
        ...(addRole === "student" && {
          roll_number: form.roll_number,
          semester:    parseInt(form.semester),
          batch_year:  parseInt(form.batch_year),
          section:     form.section,
        }),
        ...((addRole === "faculty" || addRole === "hod") && {
          employee_id: form.employee_id,
          designation: form.designation,
        }),
      });
      toast.success(`✅ ${addRole.toUpperCase()} "${form.name}" added to MySQL!`);
      setForm(blankForm());
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add user");
    } finally { setAdding(false); }
  };

  const toggleUser = async (userId, isActive) => {
    try {
      await axios.patch(
        `https://smart-campus-w54h.onrender.com/api/admin/users/${userId}/toggle`, {});
      toast.success(isActive ? "User deactivated" : "User activated");
      fetchUsers();
      fetchStats();
    } catch (_) { toast.error("Failed"); }
  };

  const handleAddRoom = async () => {
    if (!roomForm.room_number || !roomForm.floor) {
      toast.error("Room number and floor are required"); return;
    }
    setAddingRoom(true);
    try {
      await axios.post("https://smart-campus-w54h.onrender.com/api/admin/rooms", {
        room_number: roomForm.room_number,
        floor:       parseInt(roomForm.floor),
        building:    roomForm.building || "Main Block",
        dept_id:     parseInt(roomForm.dept_id),
      });
      toast.success("✅ Room added!");
      setRoomForm({ room_number:"", floor:"",
        building:"Main Block", dept_id:"1" });
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setAddingRoom(false); }
  };

  const handleAddSubject = async () => {
    if (!subForm.subject_code || !subForm.subject_name || !subForm.semester) {
      toast.error("Code, Name and Semester are required"); return;
    }
    setAddingSub(true);
    try {
      await axios.post("https://smart-campus-w54h.onrender.com/api/admin/subjects", {
        subject_code: subForm.subject_code,
        subject_name: subForm.subject_name,
        dept_id:      parseInt(subForm.dept_id),
        semester:     parseInt(subForm.semester),
        credits:      parseInt(subForm.credits) || 3,
      });
      toast.success("✅ Subject added!");
      setSubForm({ subject_code:"", subject_name:"",
        dept_id:"1", semester:"", credits:"3" });
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setAddingSub(false); }
  };

  const handleAddTimetable = async () => {
    if (!ttForm.faculty_id || !ttForm.subject_id ||
        !ttForm.room_id || !ttForm.start_time || !ttForm.end_time) {
      toast.error("All timetable fields are required"); return;
    }
    setAddingTt(true);
    try {
      await axios.post("https://smart-campus-w54h.onrender.com/api/timetable", {
        faculty_id:    parseInt(ttForm.faculty_id),
        subject_id:    parseInt(ttForm.subject_id),
        room_id:       parseInt(ttForm.room_id),
        day_of_week:   ttForm.day_of_week,
        start_time:    ttForm.start_time,
        end_time:      ttForm.end_time,
        semester:      parseInt(ttForm.semester),
        academic_year: ttForm.academic_year,
      });
      toast.success("✅ Timetable entry added!");
      setTtForm({ faculty_id:"", subject_id:"", room_id:"",
        day_of_week:"Monday", start_time:"", end_time:"",
        semester:"", academic_year:"2024-25" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setAddingTt(false); }
  };

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchQ = u.name.toLowerCase().includes(q) ||
                   u.email.toLowerCase().includes(q);
    const matchR  = roleFilter === "all" || u.role === roleFilter;
    return matchQ && matchR;
  });

  const TABS = [
    { key:"dashboard", label:"📊 Dashboard"  },
    { key:"add",       label:"➕ Add Users"   },
    { key:"users",     label:`👥 All Users (${users.length})` },
    { key:"rooms",     label:"🏫 Rooms"      },
    { key:"subjects",  label:"📚 Subjects"   },
    { key:"timetable", label:"🗓️ Timetable"  },
  ];

  const ROLE_TABS = [
    { key:"student", label:"🎓 Student",  color:"#1A237E" },
    { key:"faculty", label:"👨‍🏫 Faculty",  color:"#00695C" },
    { key:"hod",     label:"🏛️ HOD",      color:"#1565C0" },
    { key:"admin",   label:"🛡️ Admin",    color:"#4A148C" },
  ];

  const DAYS = ["Monday","Tuesday","Wednesday",
    "Thursday","Friday","Saturday"];

  const selStyle = {
    padding:"10px 12px", border:"1.5px solid #E0E0E0",
    borderRadius:10, fontSize:13, outline:"none",
    background:"white", width:"100%", boxSizing:"border-box",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#F3E5F5",
      fontFamily:"'Segoe UI', sans-serif" }}>

      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg,#4A148C,#7B1FA2)",
        padding:"20px 28px", display:"flex",
        justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ color:"#CE93D8", fontSize:11,
            textTransform:"uppercase", letterSpacing:1 }}>
            Smart Campus
          </div>
          <div style={{ color:"white", fontSize:22,
            fontWeight:900, marginTop:2 }}>
            Admin Control Panel
          </div>
          <div style={{ color:"#CE93D8", fontSize:12, marginTop:2 }}>
            Welcome, {user?.name} — Manage everything from here
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={fetchAll}
            style={{ padding:"10px 16px",
              background:"rgba(255,255,255,0.15)", color:"white",
              border:"1px solid rgba(255,255,255,0.3)",
              borderRadius:10, fontSize:12, fontWeight:700,
              cursor:"pointer" }}>
            🔄 Refresh
          </button>
          <button onClick={logout}
            style={{ padding:"10px 16px", background:"#ff444422",
              color:"#ffaaaa", border:"1px solid #ff444444",
              borderRadius:10, fontSize:12, cursor:"pointer" }}>
            Logout
          </button>
        </div>
      </div>

      {/* MAIN TABS */}
      <div style={{ display:"flex", background:"white",
        borderBottom:"1px solid #E0E0E0", overflowX:"auto" }}>
        {TABS.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{
            padding:"14px 20px", fontSize:12, fontWeight:700,
            color: tab===t.key ? "#4A148C" : "#999",
            borderBottom: tab===t.key
              ? "3px solid #4A148C" : "3px solid transparent",
            cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap",
          }}>
            {t.label}
          </div>
        ))}
      </div>

      <div style={{ padding:"24px 28px",
        display:"flex", flexDirection:"column", gap:20 }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab === "dashboard" && (
          <>
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
              <StatCard icon="🎓" label="Total Students"
                value={users.filter(u=>u.role==="student").length}
                color="#1A237E" />
              <StatCard icon="👨‍🏫" label="Total Faculty"
                value={users.filter(u=>
                  u.role==="faculty"||u.role==="hod").length}
                color="#00695C" />
              <StatCard icon="⏳" label="Pending No-Dues"
                value={stats.pending} color="#E65100" />
              <StatCard icon="✅" label="Approved No-Dues"
                value={stats.approved} color="#2E7D32" />
            </div>

            {/* Bar chart */}
            <div style={{ background:"white", borderRadius:14,
              padding:22, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:15, fontWeight:800,
                marginBottom:16 }}>Users by Role</div>
              {["student","faculty","hod","admin"].map(role => {
                const count = users.filter(u=>u.role===role).length;
                const max = Math.max(...["student","faculty","hod","admin"]
                  .map(r=>users.filter(u=>u.role===r).length), 1);
                return (
                  <div key={role} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex",
                      justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:12, fontWeight:700,
                        textTransform:"capitalize",
                        color:ROLE_COLOR[role] }}>
                        {role} ({count})
                      </span>
                    </div>
                    <div style={{ height:10, borderRadius:10,
                      background:"#F5F5F5" }}>
                      <div style={{
                        height:"100%", borderRadius:10,
                        width:`${(count/max)*100}%`,
                        background:ROLE_COLOR[role],
                        transition:"width 0.5s",
                        minWidth: count>0 ? 8 : 0,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent users */}
            <div style={{ background:"white", borderRadius:14,
              padding:22, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:15, fontWeight:800,
                marginBottom:14 }}>Recently Added Users</div>
              {users.slice(-5).reverse().map((u, i) => (
                <div key={u.user_id} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"10px 0",
                  borderBottom: i<4 ? "1px solid #F5F5F5" : "none",
                }}>
                  <div style={{
                    width:36, height:36, borderRadius:10,
                    background:ROLE_COLOR[u.role]||"#333",
                    display:"flex", alignItems:"center",
                    justifyContent:"center", color:"white",
                    fontWeight:800, fontSize:14,
                  }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize:11, color:"#999" }}>
                      {u.email}
                    </div>
                  </div>
                  <span style={{
                    padding:"3px 10px", borderRadius:20,
                    background:ROLE_BG[u.role],
                    color:ROLE_COLOR[u.role],
                    fontSize:10, fontWeight:800,
                    textTransform:"uppercase",
                  }}>
                    {u.role}
                  </span>
                </div>
              ))}
              {users.length === 0 && (
                <div style={{ color:"#aaa", textAlign:"center",
                  padding:20, fontSize:13 }}>
                  No users yet — go to ➕ Add Users!
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ ADD USERS ═══ */}
        {tab === "add" && (
          <>
            {/* Role picker */}
            <div style={{ background:"white", borderRadius:14,
              padding:"16px 20px",
              boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#999",
                textTransform:"uppercase", letterSpacing:0.8,
                marginBottom:12 }}>
                Who do you want to add?
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {ROLE_TABS.map(r => (
                  <div key={r.key} onClick={() => setAddRole(r.key)}
                    style={{
                      padding:"10px 24px", borderRadius:30,
                      border:`2px solid ${addRole===r.key
                        ? r.color : "#E0E0E0"}`,
                      background: addRole===r.key ? r.color : "white",
                      color: addRole===r.key ? "white" : "#757575",
                      fontSize:13, fontWeight:700, cursor:"pointer",
                      transition:"all 0.2s",
                    }}>
                    {r.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div style={{ background:"white", borderRadius:16,
              overflow:"hidden",
              boxShadow:"0 2px 16px rgba(0,0,0,0.08)" }}>

              {/* Form header bar */}
              <div style={{ background:ROLE_COLOR[addRole],
                padding:"16px 22px" }}>
                <div style={{ color:"white", fontWeight:800,
                  fontSize:15 }}>
                  {addRole==="student" && "🎓 Add New Student"}
                  {addRole==="faculty" && "👨‍🏫 Add New Faculty"}
                  {addRole==="hod"     && "🏛️ Add New HOD"}
                  {addRole==="admin"   && "🛡️ Add New Admin"}
                </div>
                <div style={{ color:"rgba(255,255,255,0.7)",
                  fontSize:11, marginTop:3 }}>
                  Saved directly to MySQL — user can login immediately
                </div>
              </div>

              <div style={{ padding:22, display:"flex",
                flexDirection:"column", gap:14 }}>

                {/* Row 1 — Name + Email */}
                <div style={{ display:"grid",
                  gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <Field label="Full Name" required
                    placeholder="e.g. Arjun Nair"
                    value={form.name}
                    onChange={e => setF("name", e.target.value)} />
                  <Field label="Email Address" required
                    type="email" placeholder="name@college.edu"
                    value={form.email}
                    onChange={e => setF("email", e.target.value)} />
                </div>

                {/* Row 2 — Password + Phone + Dept */}
                <div style={{ display:"grid",
                  gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                  <Field label="Password" required
                    type="password" placeholder="Min 6 characters"
                    value={form.password}
                    onChange={e => setF("password", e.target.value)} />
                  <Field label="Phone (optional)"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={e => setF("phone", e.target.value)} />
                  <Field label="Department" required>
                    <select value={form.dept_id}
                      onChange={e => setF("dept_id", e.target.value)}
                      style={selStyle}>
                      {DEPTS.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* STUDENT fields */}
                {addRole === "student" && (
                  <>
                    <div style={{ height:1, background:"#F0F0F0" }} />
                    <div style={{ fontSize:11, fontWeight:800,
                      color:ROLE_COLOR.student,
                      textTransform:"uppercase", letterSpacing:0.8 }}>
                      Student Details
                    </div>
                    <div style={{ display:"grid",
                      gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:14 }}>
                      <Field label="Roll Number" required
                        placeholder="21CS045"
                        value={form.roll_number}
                        onChange={e => setF("roll_number",e.target.value)} />
                      <Field label="Semester" required
                        type="number" placeholder="6" min="1" max="8"
                        value={form.semester}
                        onChange={e => setF("semester",e.target.value)} />
                      <Field label="Batch Year"
                        type="number" placeholder="2021"
                        value={form.batch_year}
                        onChange={e => setF("batch_year",e.target.value)} />
                      <Field label="Section" placeholder="A"
                        value={form.section}
                        onChange={e => setF("section",e.target.value)} />
                    </div>
                  </>
                )}

                {/* FACULTY / HOD fields */}
                {(addRole==="faculty"||addRole==="hod") && (
                  <>
                    <div style={{ height:1, background:"#F0F0F0" }} />
                    <div style={{ fontSize:11, fontWeight:800,
                      color:ROLE_COLOR[addRole],
                      textTransform:"uppercase", letterSpacing:0.8 }}>
                      {addRole==="hod" ? "HOD" : "Faculty"} Details
                    </div>
                    <div style={{ display:"grid",
                      gridTemplateColumns:"1fr 1fr", gap:14 }}>
                      <Field label="Employee ID" required
                        placeholder="EMP001"
                        value={form.employee_id}
                        onChange={e => setF("employee_id",e.target.value)} />
                      <Field label="Designation"
                        placeholder="Associate Professor"
                        value={form.designation}
                        onChange={e => setF("designation",e.target.value)} />
                    </div>
                  </>
                )}

                {/* Submit button */}
                <button onClick={handleAddUser} disabled={adding}
                  style={{
                    padding:"14px",
                    background: adding ? "#aaa" : ROLE_COLOR[addRole],
                    color:"white", border:"none", borderRadius:12,
                    fontSize:15, fontWeight:800, marginTop:4,
                    cursor: adding ? "not-allowed" : "pointer",
                  }}>
                  {adding ? "⏳ Saving to MySQL..." :
                    `➕ Add ${addRole.charAt(0).toUpperCase()
                      + addRole.slice(1)}`}
                </button>
              </div>
            </div>

            {/* Tips */}
            <div style={{ background:"#E8F5E9", borderRadius:12,
              padding:"14px 18px", border:"1px solid #A5D6A7",
              display:"flex", gap:12 }}>
              <span style={{ fontSize:22 }}>💡</span>
              <div style={{ fontSize:12, color:"#388E3C",
                lineHeight:1.8 }}>
                <strong>Tips:</strong><br/>
                • Password you set = the person's login password<br/>
                • Faculty password = their no-dues approval PIN<br/>
                • Roll number must be unique per student<br/>
                • User can login at <strong>localhost:3000</strong> immediately after adding
              </div>
            </div>
          </>
        )}

        {/* ═══ ALL USERS ═══ */}
        {tab === "users" && (
          <div style={{ background:"white", borderRadius:14,
            overflow:"hidden",
            boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>

            {/* Header */}
            <div style={{ padding:"16px 20px",
              borderBottom:"1px solid #F0F0F0",
              display:"flex", justifyContent:"space-between",
              alignItems:"center", flexWrap:"wrap", gap:10 }}>
              <div style={{ fontSize:15, fontWeight:800 }}>
                All Users ({filteredUsers.length})
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <input placeholder="🔍 Search name or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{ padding:"8px 12px",
                    border:"1.5px solid #E0E0E0", borderRadius:8,
                    fontSize:12, outline:"none", width:200 }} />
                <select value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  style={{ padding:"8px 12px",
                    border:"1.5px solid #E0E0E0", borderRadius:8,
                    fontSize:12, background:"white" }}>
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="faculty">Faculty</option>
                  <option value="hod">HOD</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={fetchUsers}
                  style={{ padding:"8px 14px", background:"#4A148C",
                    color:"white", border:"none", borderRadius:8,
                    fontSize:12, fontWeight:700, cursor:"pointer" }}>
                  🔄
                </button>
              </div>
            </div>

            {loadUsers ? (
              <div style={{ padding:40, textAlign:"center",
                color:"#aaa" }}>Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding:40, textAlign:"center",
                color:"#aaa" }}>No users found</div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%",
                  borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#F3E5F5" }}>
                      {["ID","Name","Email","Role",
                        "Department","Status","Action"].map(h => (
                        <th key={h} style={{ padding:"10px 16px",
                          fontSize:10, fontWeight:800, color:"#4A148C",
                          textTransform:"uppercase", letterSpacing:0.5,
                          textAlign:"left", whiteSpace:"nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => (
                      <tr key={u.user_id} style={{
                        borderBottom:"1px solid #F5F5F5",
                        background: i%2===0 ? "white":"#FAFAFA",
                      }}>
                        <td style={{ padding:"10px 16px",
                          fontSize:12, color:"#aaa" }}>
                          {u.user_id}
                        </td>
                        <td style={{ padding:"10px 16px" }}>
                          <div style={{ display:"flex",
                            alignItems:"center", gap:9 }}>
                            <div style={{
                              width:34, height:34, borderRadius:9,
                              background:ROLE_COLOR[u.role]||"#333",
                              display:"flex", alignItems:"center",
                              justifyContent:"center", color:"white",
                              fontWeight:800, fontSize:13, flexShrink:0,
                            }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize:13,
                              fontWeight:700 }}>
                              {u.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding:"10px 16px",
                          fontSize:12, color:"#757575" }}>
                          {u.email}
                        </td>
                        <td style={{ padding:"10px 16px" }}>
                          <span style={{
                            padding:"3px 10px", borderRadius:20,
                            background:ROLE_BG[u.role],
                            color:ROLE_COLOR[u.role],
                            fontSize:10, fontWeight:800,
                            textTransform:"uppercase",
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding:"10px 16px",
                          fontSize:12, color:"#757575" }}>
                          {u.dept_name || "—"}
                        </td>
                        <td style={{ padding:"10px 16px" }}>
                          <span style={{
                            padding:"3px 10px", borderRadius:20,
                            background: u.is_active
                              ? "#E8F5E9":"#FFEBEE",
                            color: u.is_active ? "#2E7D32":"#C62828",
                            fontSize:10, fontWeight:800,
                          }}>
                            {u.is_active ? "ACTIVE":"INACTIVE"}
                          </span>
                        </td>
                        <td style={{ padding:"10px 16px" }}>
                          <button
                            onClick={() => toggleUser(
                              u.user_id, u.is_active)}
                            style={{
                              padding:"5px 12px", border:"none",
                              borderRadius:8,
                              background: u.is_active
                                ? "#FFEBEE":"#E8F5E9",
                              color: u.is_active
                                ? "#C62828":"#2E7D32",
                              fontSize:11, fontWeight:700,
                              cursor:"pointer",
                            }}>
                            {u.is_active ? "Deactivate":"Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══ ROOMS ═══ */}
        {tab === "rooms" && (
          <>
            <div style={{ background:"white", borderRadius:14,
              overflow:"hidden",
              boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{
                background:"linear-gradient(135deg,#1565C0,#1976D2)",
                padding:"14px 20px" }}>
                <div style={{ color:"white", fontWeight:800,
                  fontSize:14 }}>🏫 Add New Room</div>
                <div style={{ color:"#90CAF9", fontSize:11,
                  marginTop:2 }}>
                  Each room gets a unique QR code automatically
                </div>
              </div>
              <div style={{ padding:18, display:"flex",
                flexDirection:"column", gap:12 }}>
                <div style={{ display:"grid",
                  gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12 }}>
                  <Field label="Room Number" required
                    placeholder="208"
                    value={roomForm.room_number}
                    onChange={e => setRoomForm(f =>
                      ({...f,room_number:e.target.value}))} />
                  <Field label="Floor" required
                    type="number" placeholder="2"
                    value={roomForm.floor}
                    onChange={e => setRoomForm(f =>
                      ({...f,floor:e.target.value}))} />
                  <Field label="Building" placeholder="Main Block"
                    value={roomForm.building}
                    onChange={e => setRoomForm(f =>
                      ({...f,building:e.target.value}))} />
                  <Field label="Department">
                    <select value={roomForm.dept_id}
                      onChange={e => setRoomForm(f =>
                        ({...f,dept_id:e.target.value}))}
                      style={selStyle}>
                      {DEPTS.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <button onClick={handleAddRoom} disabled={addingRoom}
                  style={{ padding:12,
                    background:addingRoom?"#aaa":"#1565C0",
                    color:"white", border:"none", borderRadius:10,
                    fontSize:13, fontWeight:800, cursor:"pointer" }}>
                  {addingRoom ? "⏳ Adding..." : "➕ Add Room"}
                </button>
              </div>
            </div>

            <div style={{ background:"white", borderRadius:14,
              overflow:"hidden",
              boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ padding:"14px 20px",
                borderBottom:"1px solid #F0F0F0",
                fontSize:14, fontWeight:800 }}>
                All Rooms ({rooms.length})
              </div>
              {rooms.length === 0 ? (
                <div style={{ padding:30, textAlign:"center",
                  color:"#aaa" }}>No rooms added yet</div>
              ) : rooms.map((r, i) => (
                <div key={r.room_id} style={{
                  display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"12px 20px",
                  background:i%2===0?"white":"#FAFAFA",
                  borderBottom:"1px solid #F5F5F5" }}>
                  <div>
                    <div style={{ fontSize:13,
                      fontWeight:700 }}>Room {r.room_number}</div>
                    <div style={{ fontSize:11, color:"#999" }}>
                      Floor {r.floor} · {r.building} · {r.dept_name}
                    </div>
                  </div>
                  <div style={{ fontSize:10, color:"#bbb",
                    fontFamily:"monospace" }}>
                    {r.qr_code_hash?.slice(0,20)}...
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══ SUBJECTS ═══ */}
        {tab === "subjects" && (
          <>
            <div style={{ background:"white", borderRadius:14,
              overflow:"hidden",
              boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{
                background:"linear-gradient(135deg,#00695C,#00897B)",
                padding:"14px 20px" }}>
                <div style={{ color:"white", fontWeight:800,
                  fontSize:14 }}>📚 Add New Subject</div>
                <div style={{ color:"#B2DFDB", fontSize:11,
                  marginTop:2 }}>
                  Required for timetable and no-dues system
                </div>
              </div>
              <div style={{ padding:18, display:"flex",
                flexDirection:"column", gap:12 }}>
                <div style={{ display:"grid",
                  gridTemplateColumns:"1fr 2fr", gap:12 }}>
                  <Field label="Subject Code" required
                    placeholder="CS301"
                    value={subForm.subject_code}
                    onChange={e => setSubForm(f =>
                      ({...f,subject_code:e.target.value}))} />
                  <Field label="Subject Name" required
                    placeholder="Data Structures & Algorithms"
                    value={subForm.subject_name}
                    onChange={e => setSubForm(f =>
                      ({...f,subject_name:e.target.value}))} />
                </div>
                <div style={{ display:"grid",
                  gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <Field label="Department">
                    <select value={subForm.dept_id}
                      onChange={e => setSubForm(f =>
                        ({...f,dept_id:e.target.value}))}
                      style={selStyle}>
                      {DEPTS.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Semester" required
                    type="number" placeholder="6"
                    value={subForm.semester}
                    onChange={e => setSubForm(f =>
                      ({...f,semester:e.target.value}))} />
                  <Field label="Credits"
                    type="number" placeholder="4"
                    value={subForm.credits}
                    onChange={e => setSubForm(f =>
                      ({...f,credits:e.target.value}))} />
                </div>
                <button onClick={handleAddSubject} disabled={addingSub}
                  style={{ padding:12,
                    background:addingSub?"#aaa":"#00695C",
                    color:"white", border:"none", borderRadius:10,
                    fontSize:13, fontWeight:800, cursor:"pointer" }}>
                  {addingSub ? "⏳ Adding..." : "➕ Add Subject"}
                </button>
              </div>
            </div>

            <div style={{ background:"white", borderRadius:14,
              overflow:"hidden",
              boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ padding:"14px 20px",
                borderBottom:"1px solid #F0F0F0",
                fontSize:14, fontWeight:800 }}>
                All Subjects ({subjects.length})
              </div>
              {subjects.length === 0 ? (
                <div style={{ padding:30, textAlign:"center",
                  color:"#aaa" }}>No subjects yet</div>
              ) : subjects.map((s, i) => (
                <div key={s.subject_code} style={{
                  display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"12px 20px",
                  background:i%2===0?"white":"#FAFAFA",
                  borderBottom:"1px solid #F5F5F5" }}>
                  <div>
                    <div style={{ fontSize:13,
                      fontWeight:700 }}>{s.subject_name}</div>
                    <div style={{ fontSize:11, color:"#999" }}>
                      {s.subject_code} · {s.dept_name}
                    </div>
                  </div>
                  <span style={{ padding:"3px 10px",
                    borderRadius:20, background:"#E0F2F1",
                    color:"#00695C", fontSize:11,
                    fontWeight:700 }}>
                    Sem {s.semester}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══ TIMETABLE ═══ */}
        {tab === "timetable" && (
          <div style={{ background:"white", borderRadius:14,
            overflow:"hidden",
            boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{
              background:"linear-gradient(135deg,#E65100,#F57C00)",
              padding:"14px 20px" }}>
              <div style={{ color:"white", fontWeight:800,
                fontSize:14 }}>🗓️ Add Timetable Entry</div>
              <div style={{ color:"#FFE0B2", fontSize:11,
                marginTop:2 }}>
                Links faculty → subject → room → day → time
              </div>
            </div>
            <div style={{ padding:18, display:"flex",
              flexDirection:"column", gap:12 }}>

              <div style={{ background:"#FFF3E0", borderRadius:10,
                padding:"10px 14px", fontSize:12,
                color:"#E65100" }}>
                ℹ️ Get ID numbers from:
                <strong> All Users tab</strong> (for Faculty ID) and
                <strong> Subjects tab</strong> (for Subject ID) and
                <strong> Rooms tab</strong> (for Room ID)
              </div>

              <div style={{ display:"grid",
                gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <Field label="Faculty ID" required
                  type="number" placeholder="2"
                  value={ttForm.faculty_id}
                  onChange={e => setTtForm(f =>
                    ({...f,faculty_id:e.target.value}))} />
                <Field label="Subject ID" required
                  type="number" placeholder="1"
                  value={ttForm.subject_id}
                  onChange={e => setTtForm(f =>
                    ({...f,subject_id:e.target.value}))} />
                <Field label="Room ID" required
                  type="number" placeholder="3"
                  value={ttForm.room_id}
                  onChange={e => setTtForm(f =>
                    ({...f,room_id:e.target.value}))} />
              </div>

              <div style={{ display:"grid",
                gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <Field label="Day of Week" required>
                  <select value={ttForm.day_of_week}
                    onChange={e => setTtForm(f =>
                      ({...f,day_of_week:e.target.value}))}
                    style={selStyle}>
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Start Time" required type="time"
                  value={ttForm.start_time}
                  onChange={e => setTtForm(f =>
                    ({...f,start_time:e.target.value}))} />
                <Field label="End Time" required type="time"
                  value={ttForm.end_time}
                  onChange={e => setTtForm(f =>
                    ({...f,end_time:e.target.value}))} />
              </div>

              <div style={{ display:"grid",
                gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Semester" required
                  type="number" placeholder="6"
                  value={ttForm.semester}
                  onChange={e => setTtForm(f =>
                    ({...f,semester:e.target.value}))} />
                <Field label="Academic Year" required
                  placeholder="2024-25"
                  value={ttForm.academic_year}
                  onChange={e => setTtForm(f =>
                    ({...f,academic_year:e.target.value}))} />
              </div>

              <button onClick={handleAddTimetable} disabled={addingTt}
                style={{ padding:12,
                  background:addingTt?"#aaa":"#E65100",
                  color:"white", border:"none", borderRadius:10,
                  fontSize:13, fontWeight:800, cursor:"pointer" }}>
                {addingTt ? "⏳ Adding..." : "➕ Add Timetable Entry"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}