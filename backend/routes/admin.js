// routes/admin.js
const router = require("express").Router();
const db     = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");

// GET /api/admin/users
router.get("/users", verifyToken, requireRole("admin","hod"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.user_id, u.name, u.email, u.role, u.is_active, u.created_at,
              d.dept_name
       FROM users u
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       ORDER BY u.role, u.name`
    );
    res.json({ success: true, users: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/users/:user_id/toggle — activate/deactivate
router.patch("/users/:user_id/toggle", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await db.query(
      "UPDATE users SET is_active = NOT is_active WHERE user_id = ?",
      [req.params.user_id]
    );
    res.json({ success: true, message: "User status toggled" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/rooms
router.get("/rooms", verifyToken, requireRole("admin","hod"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, d.dept_name FROM rooms r
       LEFT JOIN departments d ON r.dept_id = d.dept_id
       ORDER BY r.floor, r.room_number`
    );
    res.json({ success: true, rooms: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/rooms — add new room
router.post("/rooms", verifyToken, requireRole("admin","hod"), async (req, res) => {
  const { room_number, floor, building, dept_id } = req.body;
  const qr_code_hash = `QR_${uuidv4()}`;
  try {
    const [result] = await db.query(
      `INSERT INTO rooms (room_number, floor, building, dept_id, qr_code_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [room_number, floor, building || "Main Block", dept_id || null, qr_code_hash]
    );
    res.status(201).json({ success: true, room_id: result.insertId, qr_code_hash });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/subjects — add subject
router.post("/subjects", verifyToken, requireRole("admin","hod"), async (req, res) => {
  const { subject_code, subject_name, dept_id, semester, credits } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO subjects (subject_code, subject_name, dept_id, semester, credits)
       VALUES (?, ?, ?, ?, ?)`,
      [subject_code, subject_name, dept_id, semester, credits || 3]
    );
    res.status(201).json({ success: true, subject_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/nodues/bulk-create — Admin creates nodues records for a semester batch
router.post("/nodues/bulk-create", verifyToken, requireRole("admin","hod"),
  async (req, res) => {
    const { semester, dept_id } = req.body;
    // For every student in this dept+semester,
    // create nodues_requirements rows for each faculty-subject pair
    try {
      const [students] = await db.query(
        `SELECT s.student_id FROM students s
         JOIN users u ON s.user_id = u.user_id
         WHERE u.dept_id = ? AND s.semester = ? AND u.is_active = 1`,
        [dept_id, semester]
      );
      const [subjects] = await db.query(
        `SELECT sj.subject_id,
                (SELECT f.faculty_id FROM timetable t
                 JOIN faculty f ON t.faculty_id = f.faculty_id
                 WHERE t.subject_id = sj.subject_id LIMIT 1) AS faculty_id
         FROM subjects sj WHERE sj.dept_id = ? AND sj.semester = ?`,
        [dept_id, semester]
      );

      let created = 0;
      for (const stu of students) {
        for (const sub of subjects) {
          if (!sub.faculty_id) continue;
          try {
            await db.query(
              `INSERT IGNORE INTO nodues_requirements
                 (subject_id, faculty_id, student_id, semester)
               VALUES (?, ?, ?, ?)`,
              [sub.subject_id, sub.faculty_id, stu.student_id, semester]
            );
            created++;
          } catch (_) {}
        }
      }
      res.json({ success: true, message: `${created} no-dues records created` });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// GET /api/admin/stats — Dashboard stats
router.get("/stats", verifyToken, requireRole("admin","hod"), async (req, res) => {
  try {
    const [[{ students }]] = await db.query(
      "SELECT COUNT(*) AS students FROM students");
    const [[{ faculty }]] = await db.query(
      "SELECT COUNT(*) AS faculty FROM faculty");
    const [[{ pending }]] = await db.query(
      "SELECT COUNT(*) AS pending FROM nodues_requirements WHERE overall_status='pending'");
    const [[{ approved }]] = await db.query(
      "SELECT COUNT(*) AS approved FROM nodues_requirements WHERE overall_status='approved'");
    res.json({ success: true, stats: { students, faculty, pending, approved } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
