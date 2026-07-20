// ============================================================
//  Smart Faculty Locator — Backend Server (server.js)
// ============================================================
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const helmet   = require("helmet");
const morgan   = require("morgan");
const cron     = require("node-cron");

const db       = require("./config/db");
const firebase = require("./config/firebase");

// Routes
const authRoutes      = require("./routes/auth");
const facultyRoutes   = require("./routes/faculty");
const studentRoutes   = require("./routes/student");
const noduesRoutes    = require("./routes/nodues");
const timetableRoutes = require("./routes/timetable");
const adminRoutes     = require("./routes/admin");
const notifRoutes     = require("./routes/notifications");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: "*",
  credentials: false,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ── API Routes ───────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/faculty",    facultyRoutes);
app.use("/api/student",    studentRoutes);
app.use("/api/nodues",     noduesRoutes);
app.use("/api/timetable",  timetableRoutes);
app.use("/api/admin",      adminRoutes);
app.use("/api/notifications", notifRoutes);

// ── Cron: Reset faculty status at midnight ───────────────────
cron.schedule("0 0 * * *", async () => {
  try {
    await db.query(
      `UPDATE faculty_status SET status = 'available', notes = NULL
       WHERE status != 'absent'`
    );
    console.log("[CRON] Faculty statuses reset for new day");
  } catch (err) {
    console.error("[CRON] Error resetting statuses:", err.message);
  }
});

// ── Cron: Auto-update status based on timetable ─────────────
// Runs every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    const now      = new Date();
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday",
                      "Thursday","Friday","Saturday"];
    const today    = dayNames[now.getDay()];
    const timeStr  = now.toTimeString().slice(0, 5); // "HH:MM"

    // Find all classes happening right now
    const [rows] = await db.query(
      `SELECT t.faculty_id, t.room_id, t.start_time, t.end_time
       FROM timetable t
       WHERE t.day_of_week = ?
         AND t.start_time <= ?
         AND t.end_time   >= ?`,
      [today, timeStr, timeStr]
    );

    for (const row of rows) {
      await db.query(
        `INSERT INTO faculty_status (faculty_id, status, room_id, available_until)
         VALUES (?, 'in_class', ?, ?)
         ON DUPLICATE KEY UPDATE
           status = 'in_class',
           room_id = VALUES(room_id),
           available_until = VALUES(available_until)`,
        [row.faculty_id, row.room_id,
         `${now.toISOString().slice(0, 10)} ${row.end_time}`]
      );

      // Mirror to Firebase Realtime DB
      await firebase
        .database()
        .ref(`faculty_status/${row.faculty_id}`)
        .update({
          status: "in_class",
          roomId: row.room_id,
          updatedAt: now.toISOString(),
        });
    }
  } catch (err) {
    console.error("[CRON] Timetable sync error:", err.message);
  }
});

// ── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Smart Campus Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});