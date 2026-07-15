// routes/student.js
const router = require("express").Router();
const db     = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");

// GET /api/student/profile
router.get("/profile", verifyToken, requireRole("student"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.name, u.email, u.phone,
              s.roll_number, s.semester, s.batch_year, s.section,
              d.dept_name, d.dept_code
       FROM users u
       JOIN students s    ON u.user_id = s.user_id
       JOIN departments d ON u.dept_id  = d.dept_id
       WHERE u.user_id = ?`, [req.user.user_id]
    );
    res.json({ success: true, profile: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/student/nodues-summary
router.get("/nodues-summary", verifyToken, requireRole("student"), async (req, res) => {
  try {
    const [stu] = await db.query(
      "SELECT student_id FROM students WHERE user_id = ?", [req.user.user_id]);
    const [rows] = await db.query(
      `SELECT COUNT(*) as total,
              SUM(overall_status = 'approved') as approved,
              SUM(overall_status = 'pending')  as pending,
              SUM(overall_status = 'rejected') as rejected
       FROM nodues_requirements WHERE student_id = ?`,
      [stu[0].student_id]
    );
    const r = rows[0];
    res.json({
      success: true,
      total:    r.total    || 0,
      approved: r.approved || 0,
      pending:  r.pending  || 0,
      rejected: r.rejected || 0,
      allClear: r.total > 0 && r.total == r.approved,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
