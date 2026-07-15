// src/pages/FacultySearch.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ref, onValue } from "firebase/database";
import { db as firebaseDb } from "../firebase";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const STATUS_COLOR = {
  available:  "#4CAF50",
  busy:       "#FF9800",
  in_class:   "#1565C0",
  in_meeting: "#9C27B0",
  absent:     "#f44336",
};
const STATUS_LABEL = {
  available:  "Available",
  busy:       "Busy",
  in_class:   "In Class",
  in_meeting: "In Meeting",
  absent:     "Absent",
};

export default function FacultySearch() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [liveStatus, setLiveStatus] = useState({});

  // Subscribe to Firebase real-time status for each faculty in results
  useEffect(() => {
    if (!results.length) return;
    const unsubs = results.map(fac => {
      const r = ref(firebaseDb, `faculty_status/${fac.faculty_id}`);
      return onValue(r, snap => {
        if (snap.exists()) {
          setLiveStatus(prev => ({
            ...prev,
            [fac.faculty_id]: snap.val(),
          }));
        }
      });
    });
    return () => unsubs.forEach(u => u());
  }, [results]);

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/faculty/search?q=${query}`);
      setResults(data.faculty);
      if (!data.faculty.length) toast("No faculty found for that search.");
    } catch (err) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (fac) => {
    const live = liveStatus[fac.faculty_id];
    return {
      status:         live?.status         || fac.status         || "available",
      room_number:    live?.roomNumber      || fac.room_number    || "—",
      floor:          live?.floor          ?? fac.floor          ?? "—",
      available_until: live?.availableUntil || fac.available_until || null,
    };
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Find Faculty</div>
          <div style={S.headerSub}>Real-time location & availability</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/student/nodues")} style={S.navBtn}>
            No-Dues
          </button>
          <button onClick={logout} style={S.logoutBtn}>Logout</button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={search} style={S.searchForm}>
        <input
          type="text"
          placeholder="Search by name, department or employee ID..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={S.searchInput}
        />
        <button type="submit" disabled={loading} style={S.searchBtn}>
          {loading ? "..." : "Search"}
        </button>
      </form>

      {/* Results */}
      <div style={S.results}>
        {results.map(fac => {
          const { status, room_number, floor, available_until } = getStatus(fac);
          return (
            <div key={fac.faculty_id} style={S.card}>
              {/* Avatar */}
              <div style={{ ...S.avatar, background: "#1A237E" }}>
                {fac.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <div style={S.name}>{fac.name}</div>
                <div style={S.meta}>{fac.designation || "Faculty"} · {fac.dept_name}</div>

                {/* Location */}
                <div style={S.locationRow}>
                  <span style={S.locationIcon}>📍</span>
                  <span style={S.locationText}>
                    {floor !== "—" ? `Floor ${floor}` : ""} · Room {room_number}
                  </span>
                </div>

                {/* Status badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <div style={{
                    ...S.statusBadge,
                    background: STATUS_COLOR[status] || "#888",
                  }}>
                    {STATUS_LABEL[status] || status}
                  </div>
                  {available_until && (
                    <span style={S.until}>
                      Until {new Date(available_until).toLocaleTimeString([], {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {results.length === 0 && !loading && (
          <div style={S.empty}>
            <div style={{ fontSize: 48 }}>🔍</div>
            <div style={{ marginTop: 12, color: "#666" }}>
              Search for a faculty member above
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh", background: "#f2f4f8",
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
    background: "linear-gradient(135deg,#1A237E,#1565C0)",
    padding: "20px 24px", display: "flex",
    justifyContent: "space-between", alignItems: "center",
  },
  headerTitle: { color: "white", fontSize: 20, fontWeight: 800 },
  headerSub:   { color: "#90CAF9", fontSize: 12, marginTop: 2 },
  navBtn: {
    padding: "8px 16px", background: "#ffffff22",
    color: "white", border: "none", borderRadius: 8,
    fontSize: 13, cursor: "pointer", fontWeight: 600,
  },
  logoutBtn: {
    padding: "8px 16px", background: "#ff444422",
    color: "#ffaaaa", border: "1px solid #ff444444",
    borderRadius: 8, fontSize: 13, cursor: "pointer",
  },
  searchForm: {
    display: "flex", gap: 10, padding: "20px 24px 0",
  },
  searchInput: {
    flex: 1, padding: "12px 16px", borderRadius: 10,
    border: "1.5px solid #ddd", fontSize: 14, outline: "none",
  },
  searchBtn: {
    padding: "12px 24px", background: "#1A237E", color: "white",
    border: "none", borderRadius: 10, fontSize: 14,
    fontWeight: 700, cursor: "pointer",
  },
  results: { padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 },
  card: {
    background: "white", borderRadius: 14, padding: 16,
    display: "flex", gap: 14, alignItems: "flex-start",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
  },
  avatar: {
    width: 48, height: 48, borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "white", fontWeight: 700, fontSize: 16, flexShrink: 0,
  },
  name: { fontSize: 15, fontWeight: 700, color: "#1a1a2e" },
  meta: { fontSize: 12, color: "#888", marginTop: 2 },
  locationRow: { display: "flex", alignItems: "center", gap: 4, marginTop: 6 },
  locationIcon: { fontSize: 12 },
  locationText: { fontSize: 12, color: "#555" },
  statusBadge: {
    padding: "3px 10px", borderRadius: 20,
    color: "white", fontSize: 11, fontWeight: 700,
  },
  until: { fontSize: 11, color: "#888" },
  empty: {
    textAlign: "center", padding: "60px 0",
    color: "#aaa",
  },
};
