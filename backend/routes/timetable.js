// routes/timetable.js
const router = require("express").Router();
const db     = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");

router.get("/", verifyToken, async (req, res) => {
  const { faculty_id, dept_id, day } = req.query;
  let query = `
    SELECT t.tt_id, t.day_of_week, t.start_time, t.end_time, t.semester,
           s.subject_code, s.subject_name,
           u.name AS faculty_name, f.faculty_id,
           r.room_number, r.floor, r.building, d.dept_name
    FROM timetable t
    JOIN subjects    s ON t.subject_id = s.subject_id
    JOIN faculty     f ON t.faculty_id = f.faculty_id
    JOIN users       u ON f.user_id    = u.user_id
    JOIN departments d ON u.dept_id    = d.dept_id
    JOIN rooms       r ON t.room_id    = r.room_id
    WHERE 1=1
  `;
  const params = [];
  if (faculty_id) { query += " AND t.faculty_id = ?"; params.push(faculty_id); }
  if (dept_id)    { query += " AND u.dept_id = ?";    params.push(dept_id); }
  if (day)        { query += " AND t.day_of_week = ?"; params.push(day); }
  query += " ORDER BY t.day_of_week, t.start_time";
  try {
    const [rows] = await db.query(query, params);
    res.json({ success: true, timetable: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", verifyToken, requireRole("admin","hod"), async (req, res) => {
  const { faculty_id, subject_id, room_id, day_of_week,
          start_time, end_time, semester, academic_year } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO timetable
         (faculty_id,subject_id,room_id,day_of_week,start_time,end_time,semester,academic_year)
       VALUES (?,?,?,?,?,?,?,?)`,
      [faculty_id, subject_id, room_id, day_of_week,
       start_time, end_time, semester, academic_year]
    );
    res.status(201).json({ success: true, tt_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:tt_id", verifyToken, requireRole("admin","hod"), async (req, res) => {
  try {
    await db.query("DELETE FROM timetable WHERE tt_id = ?", [req.params.tt_id]);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
