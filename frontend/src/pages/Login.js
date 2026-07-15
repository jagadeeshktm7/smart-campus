// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === "student") navigate("/student");
      else if (user.role === "faculty" || user.role === "hod") navigate("/faculty");
      else navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>SC</div>
          <h1 style={styles.title}>Smart Campus</h1>
          <p style={styles.subtitle}>Faculty Locator & No-Dues System</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>College Email</label>
            <input
              type="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              style={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={styles.note}>
          Contact admin to get your credentials.<br />
          Role is auto-assigned by the system.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg,#1A237E 0%,#1565C0 100%)",
  },
  card: {
    background: "white", borderRadius: 20, padding: 40,
    width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  header: { textAlign: "center", marginBottom: 30 },
  logo: {
    width: 64, height: 64, borderRadius: 16, background: "#1A237E",
    color: "white", fontSize: 24, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 12px",
  },
  title: { fontSize: 22, fontWeight: 800, color: "#1A237E", margin: "0 0 4px" },
  subtitle: { fontSize: 13, color: "#888", margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#444" },
  input: {
    padding: "12px 14px", border: "1.5px solid #ddd", borderRadius: 10,
    fontSize: 14, outline: "none",
    transition: "border-color 0.2s",
  },
  btn: {
    padding: "14px", background: "#1A237E", color: "white",
    border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
    cursor: "pointer", marginTop: 8,
  },
  note: { textAlign: "center", fontSize: 12, color: "#aaa", marginTop: 20 },
};
