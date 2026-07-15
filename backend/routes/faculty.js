// routes/faculty.js — Faculty search, status, QR check-in
const router   = require("express").Router();
const QRCode   = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const db       = require("../config/db");
const firebase = require("../config/firebase");
const { verifyToken, requireRole, auditLog } = require("../middleware/auth");

// ── GET /api/faculty/search?q=kumar ──────────────────────────
// Student searches for a faculty member
router.get("/search", verifyToken, async (req, res) => {
  const { q, dept_id } = req.query;
  try {
    let query = `
      SELECT u.user_id, u.name, u.email, u.phone,
             d.dept_name, d.dept_code,
             f.faculty_id, f.employee_id, f.designation,
             fs.status, fs.available_until, fs.notes,
             r.room_number, r.floor, r.building
      FROM users u
      JOIN faculty f       ON u.user_id  = f.user_id
      JOIN departments d   ON u.dept_id  = d.dept_id
      LEFT JOIN faculty_status fs ON f.faculty_id = fs.faculty_id
      LEFT JOIN rooms r           ON fs.room_id   = r.room_id
      WHERE u.role IN ('faculty','hod') AND u.is_active = 1
    `;
    const params = [];

    if (q) {
      query += " AND (u.name LIKE ? OR f.employee_id LIKE ? OR d.dept_name LIKE ?)";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (dept_id) {
      query += " AND u.dept_id = ?";
      params.push(dept_id);
    }
    query += " ORDER BY u.name LIMIT 20";

    const [rows] = await db.query(query, params);
    res.json({ success: true, count: rows.length, faculty: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/faculty/:faculty_id/status ──────────────────────
router.get("/:faculty_id/status", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.name, d.dept_name, d.dept_code,
              fs.status, fs.available_until, fs.notes, fs.updated_at,
              r.room_number, r.floor, r.building
       FROM faculty f
       JOIN users u         ON f.user_id   = u.user_id
       JOIN departments d   ON u.dept_id   = d.dept_id
       LEFT JOIN faculty_status fs ON f.faculty_id = fs.faculty_id
       LEFT JOIN rooms r           ON fs.room_id   = r.room_id
       WHERE f.faculty_id = ?`, [req.params.faculty_id]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: "Faculty not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/faculty/status ───────────────────────────────────
// Faculty updates own status manually
router.put("/status", verifyToken, requireRole("faculty","hod"),
  auditLog("UPDATE_STATUS","faculty_status"),
  async (req, res) => {
    const { status, room_id, available_until, notes } = req.body;
    const VALID = ["available","busy","in_class","in_meeting","absent"];
    if (!VALID.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    try {
      // Get faculty_id for this user
      const [fac] = await db.query(
        "SELECT faculty_id FROM faculty WHERE user_id = ?", [req.user.user_id]);
      if (!fac.length)
        return res.status(404).json({ success: false, message: "Faculty profile not found" });

      const fid = fac[0].faculty_id;

      await db.query(
        `INSERT INTO faculty_status (faculty_id, status, room_id, available_until, notes)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           room_id = VALUES(room_id),
           available_until = VALUES(available_until),
           notes = VALUES(notes)`,
        [fid, status, room_id || null, available_until || null, notes || null]
      );

      // Push to Firebase for real-time update
      await firebase.database().ref(`faculty_status/${fid}`).set({
        status,
        roomId: room_id || null,
        availableUntil: available_until || null,
        notes: notes || null,
        updatedAt: new Date().toISOString(),
      });

      res.json({ success: true, message: "Status updated", status });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── POST /api/faculty/qr-checkin ─────────────────────────────
// Faculty scans room QR → confirms physical presence
router.post("/qr-checkin", verifyToken, requireRole("faculty","hod"),
  async (req, res) => {
    const { qr_code_hash, device_id } = req.body;
    if (!qr_code_hash)
      return res.status(400).json({ success: false, message: "QR code required" });

    try {
      // Find room by QR hash
      const [rooms] = await db.query(
        "SELECT room_id, room_number, floor, building FROM rooms WHERE qr_code_hash = ?",
        [qr_code_hash]
      );
      if (!rooms.length)
        return res.status(404).json({ success: false, message: "Invalid QR code" });

      const room = rooms[0];
      const [fac] = await db.query(
        "SELECT faculty_id FROM faculty WHERE user_id = ?", [req.user.user_id]);
      const fid  = fac[0].faculty_id;

      // Close previous open check-in
      await db.query(
        `UPDATE qr_checkins SET checked_out_at = NOW()
         WHERE faculty_id = ? AND checked_out_at IS NULL`,
        [fid]
      );

      // New check-in
      await db.query(
        `INSERT INTO qr_checkins (faculty_id, room_id, device_id)
         VALUES (?, ?, ?)`,
        [fid, room.room_id, device_id || null]
      );

      // Update status to available at this room
      await db.query(
        `INSERT INTO faculty_status (faculty_id, status, room_id)
         VALUES (?, 'available', ?)
         ON DUPLICATE KEY UPDATE status = 'available', room_id = VALUES(room_id)`,
        [fid, room.room_id]
      );

      await firebase.database().ref(`faculty_status/${fid}`).update({
        status: "available",
        roomId: room.room_id,
        roomNumber: room.room_number,
        floor: room.floor,
        updatedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: `Checked in to Room ${room.room_number}, Floor ${room.floor}`,
        room,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/faculty/qr-generate/:room_id ────────────────────
// Admin generates QR code image for a room
router.get("/qr-generate/:room_id", verifyToken, requireRole("admin","hod"),
  async (req, res) => {
    try {
      const [rows] = await db.query(
        "SELECT * FROM rooms WHERE room_id = ?", [req.params.room_id]);
      if (!rows.length)
        return res.status(404).json({ success: false, message: "Room not found" });

      const qrData = JSON.stringify({
        qr_code_hash: rows[0].qr_code_hash,
        room_number:  rows[0].room_number,
        floor:        rows[0].floor,
      });
      const qrImage = await QRCode.toDataURL(qrData);
      res.json({ success: true, qr_image: qrImage, room: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/faculty/today-schedule ──────────────────────────
// Faculty sees own timetable for today
router.get("/today-schedule", verifyToken, requireRole("faculty","hod"),
  async (req, res) => {
    try {
      const days = ["Sunday","Monday","Tuesday","Wednesday",
                    "Thursday","Friday","Saturday"];
      const today = days[new Date().getDay()];

      const [fac] = await db.query(
        "SELECT faculty_id FROM faculty WHERE user_id = ?", [req.user.user_id]);
      if (!fac.length)
        return res.status(404).json({ success: false, message: "Faculty profile not found" });

      const [rows] = await db.query(
        `SELECT t.start_time, t.end_time,
                s.subject_code, s.subject_name,
                r.room_number, r.floor, r.building
         FROM timetable t
         JOIN subjects s ON t.subject_id = s.subject_id
         JOIN rooms r    ON t.room_id    = r.room_id
         WHERE t.faculty_id = ? AND t.day_of_week = ?
         ORDER BY t.start_time`,
        [fac[0].faculty_id, today]
      );
      res.json({ success: true, day: today, schedule: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
