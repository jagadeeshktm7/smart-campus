import { useState, useEffect } from "react";
import axios from "axios";

// ── Colours ──────────────────────────────────────────────────
const C = {
  navy:   "#1A237E",
  blue:   "#1565C0",
  teal:   "#00695C",
  purple: "#4A148C",
  orange: "#E65100",
  green:  "#2E7D32",
  red:    "#C62828",
  light:  "#F0F4FF",
  grey:   "#F5F5F5",
  border: "#E0E0E0",
  text:   "#1A1A2E",
  muted:  "#757575",
};

const DEPT_OPTIONS = [
  { id: 1, name: "CSE — Computer Science" },
  { id: 2, name: "ECE — Electronics" },
  { id: 3, name: "MECH — Mechanical" },
  { id: 4, name: "MATHS — Mathematics" },
  { id: 5, name: "PHY — Physics" },
];

const ROLE_COLORS = {
  admin:   C.purple,
  faculty: C.teal,
  hod:     C.blue,
  student: C.navy,
};

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
      fontWeight: 700, fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {type === "success" ? "✅" : "❌"} {msg}
    </div>
  );
}

// ── Input Component ───────────────────────────────────────────
function Input({ label, required, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 700,
        color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label} {required && <span style={{ color: C.red }}>*</span>}
      </label>
      {props.type === "select" ? (
        <select {...props} style={{
          padding: "10px 12px", border: `1.5px solid ${C.border}`,
          borderRadius: 10, fontSize: 13, outline: "none",
          background: "white", color: C.text, ...props.style,
        }}>
          {props.children}
        </select>
      ) : (
        <input {...props} style={{
          padding: "10px 12px", border: `1.5px solid ${C.border}`,
          borderRadius: 10, fontSize: 13, outline: "none",
          background: "white", color: C.text, ...props.style,
        }} />
      )}
    </div>
  );
}

// ── Add User Form ─────────────────────────────────────────────
function AddUserForm({ role, token, onSuccess }) {
  const isStudent = role === "student";
  const isFaculty = role === "faculty" || role === "hod";

  const blank = {
    name: "", email: "", password: "", dept_id: "1",
    // student fields
    roll_number: "", semester: "", batch_year: new Date().getFullYear(), section: "",
    // faculty fields
    employee_id: "", designation: "",
  };
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      onSuccess("error", "Name, email and password are required");
      return;
    }
    if (isStudent && (!form.roll_number || !form.semester)) {
      onSuccess("error", "Roll number and semester are required for students");
      return;
    }
    if (isFaculty && !form.employee_id) {
      onSuccess("error", "Employee ID is required for faculty");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name, email: form.email,
        password: form.password, role,
        dept_id: parseInt(form.dept_id),
        ...(isStudent && {
          roll_number: form.roll_number,
          semester:    parseInt(form.semester),
          batch_year:  parseInt(form.batch_year),
          section:     form.section,
        }),
        ...(isFaculty && {
          employee_id: form.employee_id,
          designation: form.designation,
        }),
      };
      await axios.post("/api/auth/register", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm(blank);
      onSuccess("success",
        `${role.charAt(0).toUpperCase() + role.slice(1)} "${form.name}" added successfully!`);
    } catch (err) {
      onSuccess("error", err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const roleColor = ROLE_COLORS[role] || C.navy;

  return (
    <div style={{
      background: "white", borderRadius: 16, overflow: "hidden",
      border: `1px solid ${C.border}`,
      boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
    }}>
      {/* Form header */}
      <div style={{
        background: roleColor, padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18,
        }}>
          {role === "student" ? "🎓" : role === "admin" ? "🛡️" : "👨‍🏫"}
        </div>
        <div>
          <div style={{ color: "white", fontWeight: 800, fontSize: 14 }}>
            Add New {role.charAt(0).toUpperCase() + role.slice(1)}
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
            Saves directly to MySQL database
          </div>
        </div>
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Common fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Full Name" required placeholder="e.g. Dr. R Kumar"
            value={form.name} onChange={e => set("name", e.target.value)} />
          <Input label="Email Address" required type="email"
            placeholder="name@college.edu"
            value={form.email} onChange={e => set("email", e.target.value)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Password" required type="password"
            placeholder="Min 6 characters"
            value={form.password} onChange={e => set("password", e.target.value)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 700,
              color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Department <span style={{ color: C.red }}>*</span>
            </label>
            <select value={form.dept_id}
              onChange={e => set("dept_id", e.target.value)}
              style={{ padding: "10px 12px", border: `1.5px solid ${C.border}`,
                borderRadius: 10, fontSize: 13, background: "white" }}>
              {DEPT_OPTIONS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Student-specific fields */}
        {isStudent && (
          <>
            <div style={{
              height: 1, background: C.border, margin: "2px 0",
            }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: C.navy,
              textTransform: "uppercase", letterSpacing: 0.8 }}>
              Student Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <Input label="Roll Number" required placeholder="21CS045"
                value={form.roll_number}
                onChange={e => set("roll_number", e.target.value)} />
              <Input label="Semester" required type="number"
                placeholder="6" min="1" max="8"
                value={form.semester}
                onChange={e => set("semester", e.target.value)} />
              <Input label="Batch Year" required type="number"
                placeholder="2021"
                value={form.batch_year}
                onChange={e => set("batch_year", e.target.value)} />
              <Input label="Section" placeholder="A"
                value={form.section}
                onChange={e => set("section", e.target.value)} />
            </div>
          </>
        )}

        {/* Faculty-specific fields */}
        {isFaculty && (
          <>
            <div style={{ height: 1, background: C.border, margin: "2px 0" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: C.teal,
              textTransform: "uppercase", letterSpacing: 0.8 }}>
              Faculty Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Employee ID" required placeholder="EMP001"
                value={form.employee_id}
                onChange={e => set("employee_id", e.target.value)} />
              <Input label="Designation" placeholder="Associate Professor"
                value={form.designation}
                onChange={e => set("designation", e.target.value)} />
            </div>
          </>
        )}

        {/* Submit button */}
        <button onClick={handleSubmit} disabled={loading}
          style={{
            padding: "13px", background: loading ? C.muted : roleColor,
            color: "white", border: "none", borderRadius: 12,
            fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4, transition: "background 0.2s",
          }}>
          {loading
            ? "⏳ Saving to MySQL..."
            : `➕ Add ${role.charAt(0).toUpperCase() + role.slice(1)}`}
        </button>
      </div>
    </div>
  );
}

// ── Users Table ───────────────────────────────────────────────
function UsersTable({ users, onToggle, loading }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div style={{
      background: "white", borderRadius: 16,
      border: `1px solid ${C.border}`,
      boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden",
    }}>
      {/* Table header */}
      <div style={{
        padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>
          All Users ({filtered.length})
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Search name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              padding: "8px 12px", border: `1.5px solid ${C.border}`,
              borderRadius: 8, fontSize: 12, outline: "none", width: 180,
            }} />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            style={{ padding: "8px 12px", border: `1.5px solid ${C.border}`,
              borderRadius: 8, fontSize: 12, background: "white" }}>
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="hod">HOD</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
          Loading users...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
          No users found
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.light }}>
                {["#", "Name", "Email", "Role", "Department", "Status", "Action"]
                  .map(h => (
                  <th key={h} style={{
                    padding: "10px 16px", fontSize: 11,
                    fontWeight: 800, color: C.navy,
                    textTransform: "uppercase", letterSpacing: 0.5,
                    textAlign: "left", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.user_id}
                  style={{ borderBottom: `1px solid ${C.border}`,
                    background: i % 2 === 0 ? "white" : C.grey }}>
                  <td style={{ padding: "10px 16px", fontSize: 12,
                    color: C.muted }}>{u.user_id}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: ROLE_COLORS[u.role] || C.navy,
                        display: "flex", alignItems: "center",
                        justifyContent: "center", color: "white",
                        fontSize: 12, fontWeight: 800, flexShrink: 0,
                      }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600,
                        color: C.text }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 12,
                    color: C.muted }}>{u.email}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 20,
                      background: ROLE_COLORS[u.role] || C.navy,
                      color: "white", fontSize: 10, fontWeight: 800,
                      textTransform: "uppercase",
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 12,
                    color: C.muted }}>{u.dept_name || "—"}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 20,
                      background: u.is_active ? "#E8F5E9" : "#FFEBEE",
                      color: u.is_active ? C.green : C.red,
                      fontSize: 10, fontWeight: 800,
                    }}>
                      {u.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <button onClick={() => onToggle(u.user_id, u.is_active)}
                      style={{
                        padding: "5px 12px", border: "none", borderRadius: 8,
                        background: u.is_active ? "#FFEBEE" : "#E8F5E9",
                        color: u.is_active ? C.red : C.green,
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}>
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Stats Cards ───────────────────────────────────────────────
function StatsRow({ stats }) {
  const cards = [
    { label: "Total Students", value: stats.students || 0,
      icon: "🎓", color: C.navy },
    { label: "Total Faculty",  value: stats.faculty  || 0,
      icon: "👨‍🏫", color: C.teal },
    { label: "Pending Dues",   value: stats.pending  || 0,
      icon: "⏳", color: C.orange },
    { label: "Approved Dues",  value: stats.approved || 0,
      icon: "✅", color: C.green },
  ];
  return (
    <div style={{ display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: "white", borderRadius: 14, padding: "18px 20px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          borderLeft: `4px solid ${c.color}`,
        }}>
          <div style={{ fontSize: 28 }}>{c.icon}</div>
          <div style={{ fontSize: 28, fontWeight: 900,
            color: c.color, marginTop: 6 }}>{c.value}</div>
          <div style={{ fontSize: 12, color: C.muted,
            marginTop: 2 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────
export default function AdminManagement() {
  const [tab,       setTab]       = useState("add");
  const [addRole,   setAddRole]   = useState("student");
  const [users,     setUsers]     = useState([]);
  const [stats,     setStats]     = useState({});
  const [loadUsers, setLoadUsers] = useState(false);
  const [toast,     setToast]     = useState(null);

  // Get token from localStorage
  const token = localStorage.getItem("sc_token");

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(data.stats || {});
    } catch (_) {}
  };

  const fetchUsers = async () => {
    setLoadUsers(true);
    try {
      const { data } = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data.users || []);
    } catch (_) {}
    finally { setLoadUsers(false); }
  };

  const toggleUser = async (userId, isActive) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("success",
        `User ${isActive ? "deactivated" : "activated"} successfully`);
      fetchUsers();
      fetchStats();
    } catch (_) {
      showToast("error", "Failed to update user status");
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
  };

  const TABS = [
    { key: "add",   label: "➕ Add Users",   },
    { key: "users", label: "👥 All Users",   },
    { key: "stats", label: "📊 Stats",       },
  ];

  const ROLE_TABS = [
    { key: "student", label: "🎓 Student",  color: C.navy   },
    { key: "faculty", label: "👨‍🏫 Faculty",  color: C.teal   },
    { key: "hod",     label: "🏛️ HOD",      color: C.blue   },
    { key: "admin",   label: "🛡️ Admin",    color: C.purple },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#F0F4FF",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* Toast */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type}
          onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.purple}, #7B1FA2)`,
        padding: "20px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ color: "#CE93D8", fontSize: 11,
            textTransform: "uppercase", letterSpacing: 1 }}>
            Smart Campus
          </div>
          <div style={{ color: "white", fontSize: 22,
            fontWeight: 900, marginTop: 2 }}>
            Admin Management Panel
          </div>
          <div style={{ color: "#CE93D8", fontSize: 12, marginTop: 2 }}>
            Add students & faculty → saved directly to MySQL
          </div>
        </div>
        <button onClick={fetchUsers}
          style={{ padding: "10px 18px", background: "rgba(255,255,255,0.15)",
            color: "white", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          🔄 Refresh
        </button>
      </div>

      {/* Main Tabs */}
      <div style={{ display: "flex", background: "white",
        borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "14px 24px", fontSize: 13, fontWeight: 700,
            color: tab === t.key ? C.purple : C.muted,
            borderBottom: tab === t.key
              ? `3px solid ${C.purple}` : "3px solid transparent",
            cursor: "pointer", transition: "all 0.2s",
          }}>
            {t.label}
          </div>
        ))}
      </div>

      <div style={{ padding: "24px 28px",
        display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── ADD USERS TAB ── */}
        {tab === "add" && (
          <>
            {/* Role selector */}
            <div style={{
              background: "white", borderRadius: 14, padding: "16px 20px",
              border: `1px solid ${C.border}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted,
                textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
                Select who to add
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {ROLE_TABS.map(r => (
                  <div key={r.key} onClick={() => setAddRole(r.key)}
                    style={{
                      padding: "10px 20px", borderRadius: 30,
                      border: `2px solid ${addRole === r.key ? r.color : C.border}`,
                      background: addRole === r.key ? r.color : "white",
                      color: addRole === r.key ? "white" : C.muted,
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                      transition: "all 0.2s",
                    }}>
                    {r.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <AddUserForm
              key={addRole}
              role={addRole}
              token={token}
              onSuccess={(type, msg) => {
                showToast(type, msg);
                if (type === "success") {
                  fetchUsers();
                  fetchStats();
                }
              }}
            />

            {/* Info box */}
            <div style={{
              background: "#E8F5E9", borderRadius: 12, padding: "14px 18px",
              border: `1px solid #A5D6A7`,
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 20 }}>💡</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700,
                  color: C.green }}>Default Passwords</div>
                <div style={{ fontSize: 12, color: "#388E3C",
                  marginTop: 4, lineHeight: 1.6 }}>
                  You can set any password when adding users.<br />
                  Students use their password to login + faculty use their
                  password as their <strong>approval PIN</strong> when signing no-dues.
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── ALL USERS TAB ── */}
        {tab === "users" && (
          <UsersTable
            users={users}
            onToggle={toggleUser}
            loading={loadUsers}
          />
        )}

        {/* ── STATS TAB ── */}
        {tab === "stats" && (
          <>
            <StatsRow stats={stats} />

            {/* Breakdown by role */}
            <div style={{
              background: "white", borderRadius: 14, padding: 20,
              border: `1px solid ${C.border}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontWeight: 800, fontSize: 15,
                color: C.text, marginBottom: 16 }}>
                Users by Role
              </div>
              {["student","faculty","hod","admin"].map(role => {
                const count = users.filter(u => u.role === role).length;
                const max   = Math.max(...["student","faculty","hod","admin"]
                  .map(r => users.filter(u => u.role === r).length), 1);
                return (
                  <div key={role} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex",
                      justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700,
                        textTransform: "capitalize",
                        color: ROLE_COLORS[role] }}>
                        {role}
                      </span>
                      <span style={{ fontSize: 12,
                        fontWeight: 800, color: C.text }}>{count}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 8,
                      background: C.grey }}>
                      <div style={{
                        height: "100%", borderRadius: 8,
                        width: `${(count / max) * 100}%`,
                        background: ROLE_COLORS[role],
                        transition: "width 0.5s",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
