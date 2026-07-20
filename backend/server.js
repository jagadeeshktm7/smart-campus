require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");

const db = require("./config/db");

const authRoutes      = require("./routes/auth");
const facultyRoutes   = require("./routes/faculty");
const studentRoutes   = require("./routes/student");
const noduesRoutes    = require("./routes/nodues");
const timetableRoutes = require("./routes/timetable");
const adminRoutes     = require("./routes/admin");
const notifRoutes     = require("./routes/notifications");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS — fix trailing slash issue ──────────────────────────
const FRONTEND = (process.env.FRONTEND_URL || "")
  .replace(/\/$/, ""); // remove trailing slash

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const clean = origin.replace(/\/$/, "");
    const allowed = [
      FRONTEND,
      "https://smartcampustu.netlify.app",
      "http://localhost:3000",
    ].filter(Boolean);
    if (allowed.includes(clean)) {
      callback(null, true);
    } else {
      console.log("CORS blocked:", origin);
      callback(null, true); // allow all for now
    }
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

app.options("*", cors());

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/faculty",       facultyRoutes);
app.use("/api/student",       studentRoutes);
app.use("/api/nodues",        noduesRoutes);
app.use("/api/timetable",     timetableRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/notifications", notifRoutes);

// ── Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Smart Campus Server running on port ${PORT}`);
  console.log(`   Health endpoint: /api/health\n`);
});