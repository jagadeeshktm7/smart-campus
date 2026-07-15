// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login            from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard   from "./pages/AdminDashboard";
import NoDuesPage       from "./pages/NoDuesPage";
import FacultySearch    from "./pages/FacultySearch";
import AdminManagement          from "./pages/AdminManagement";
import FacultyStudentManagement from "./pages/FacultyStudentManagement";

// ── Protected route wrapper ───────────────────────────────────
const Protected = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/" replace />;
  return children;
};

// ── Role-based home redirect ──────────────────────────────────
const Home = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "student") return <Navigate to="/student"  replace />;
  if (user.role === "faculty") return <Navigate to="/faculty"  replace />;
  return <Navigate to="/admin" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />

          {/* Student routes */}
          <Route path="/student" element={
            <Protected roles={["student"]}>
              <StudentDashboard />
            </Protected>
          } />
          <Route path="/student/nodues" element={
            <Protected roles={["student"]}>
              <NoDuesPage />
            </Protected>
          } />
          <Route path="/student/search" element={
            <Protected roles={["student"]}>
              <FacultySearch />
            </Protected>
          } />

          {/* Faculty routes */}
          <Route path="/faculty" element={
            <Protected roles={["faculty","hod"]}>
              <FacultyDashboard />
            </Protected>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <Protected roles={["admin","hod"]}>
              <AdminDashboard />
            </Protected>
          } />
          <Route path="/admin/users" element={
            <Protected roles={["admin","hod"]}>
              <AdminManagement />
            </Protected>
          } />
          <Route path="/faculty/students" element={
            <Protected roles={["faculty","hod"]}>
              <FacultyStudentManagement />
              </Protected>
            } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
