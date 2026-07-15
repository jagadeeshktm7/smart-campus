// routes/nodues.js — Full Digital No-Dues Workflow
const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db      = require("../config/db");
const firebase = require("../config/firebase");
const { verifyToken, requireRole, auditLog } = require("../middleware/auth");

// ── Helper: send Firebase notification ───────────────────────
async function pushNotification(userId, title, body, type = "system") {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, title, body, type) VALUES (?,?,?,?)`,
      [userId, title, body, type]
    );
    await firebase.database()
      .ref(`notifications/${userId}`)
      .push({ title, body, type, createdAt: new Date().toISOString(), read: false });
  } catch (_) {}
}

// ── GET /api/nodues/student — Student sees all their dues ─────
router.get("/student", verifyToken, requireRole("student"), async (req, res) => {
  try {
    const [stu] = await db.query(
      "SELECT student_id FROM students WHERE user_id = ?", [req.user.user_id]);
    if (!stu.length)
      return res.status(404).json({ success: false, message: "Student not found" });

    const [rows] = await db.query(
      `SELECT nr.req_id, nr.overall_status, nr.approved_at,
              nr.assign1_submitted, nr.assign2_submitted, nr.assign3_submitted,
              nr.mcq1_cleared, nr.mcq2_cleared, nr.mcq3_cleared,
              nr.seminar_done, nr.faculty_remarks, nr.signature_data,
              nr.qr_verify_hash,
              s.subject_code, s.subject_name, s.semester,
              u.name AS faculty_name, d.dept_name,
              f.designation
       FROM nodues_requirements nr
       JOIN subjects    s  ON nr.subject_id  = s.subject_id
       JOIN faculty     f  ON nr.faculty_id  = f.faculty_id
       JOIN users       u  ON f.user_id      = u.user_id
       JOIN departments d  ON u.dept_id      = d.dept_id
       WHERE nr.student_id = ?
       ORDER BY s.subject_code`,
      [stu[0].student_id]
    );

    const total    = rows.length;
    const approved = rows.filter(r => r.overall_status === "approved").length;
    const allClear = total > 0 && approved === total;

    res.json({ success: true, allClear, approved, total, dues: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/nodues/request/:req_id — Student requests approval
router.post("/request/:req_id", verifyToken, requireRole("student"),
  async (req, res) => {
    const { message } = req.body;
    try {
      const [stu] = await db.query(
        "SELECT student_id FROM students WHERE user_id = ?", [req.user.user_id]);

      // Ensure the requirement belongs to this student
      const [nr] = await db.query(
        `SELECT nr.req_id, nr.faculty_id, f.user_id AS fac_user_id,
                nr.overall_status, s.subject_name, u.name AS student_name
         FROM nodues_requirements nr
         JOIN faculty f   ON nr.faculty_id  = f.faculty_id
         JOIN subjects s  ON nr.subject_id  = s.subject_id
         JOIN students st ON nr.student_id  = st.student_id
         JOIN users u     ON st.user_id     = u.user_id
         WHERE nr.req_id = ? AND nr.student_id = ?`,
        [req.params.req_id, stu[0].student_id]
      );
      if (!nr.length)
        return res.status(404).json({ success: false, message: "Record not found" });
      if (nr[0].overall_status === "approved")
        return res.status(400).json({ success: false, message: "Already approved" });

      // Upsert request
      await db.query(
        `INSERT INTO nodues_requests (student_id, req_id, message, status)
         VALUES (?, ?, ?, 'pending')
         ON DUPLICATE KEY UPDATE message = VALUES(message), status = 'pending',
           requested_at = CURRENT_TIMESTAMP`,
        [stu[0].student_id, req.params.req_id, message || ""]
      );

      // Notify faculty
      await pushNotification(
        nr[0].fac_user_id,
        "No-Dues Approval Request",
        `${nr[0].student_name} requests approval for ${nr[0].subject_name}`,
        "approval"
      );

      res.json({ success: true, message: "Request sent to faculty" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/nodues/faculty/pending — Faculty sees pending requests
router.get("/faculty/pending", verifyToken, requireRole("faculty","hod"),
  async (req, res) => {
    try {
      const [fac] = await db.query(
        "SELECT faculty_id FROM faculty WHERE user_id = ?", [req.user.user_id]);
      if (!fac.length)
        return res.status(404).json({ success: false, message: "Faculty not found" });

      const [rows] = await db.query(
        `SELECT nreq.request_id, nreq.message, nreq.requested_at,
                nr.req_id,
                nr.assign1_submitted, nr.assign2_submitted, nr.assign3_submitted,
                nr.mcq1_cleared, nr.mcq2_cleared, nr.mcq3_cleared,
                nr.seminar_done,
                s.subject_code, s.subject_name,
                u.name AS student_name, st.roll_number, st.semester
         FROM nodues_requests nreq
         JOIN nodues_requirements nr ON nreq.req_id     = nr.req_id
         JOIN subjects            s  ON nr.subject_id   = s.subject_id
         JOIN students            st ON nreq.student_id = st.student_id
         JOIN users               u  ON st.user_id      = u.user_id
         WHERE nr.faculty_id = ? AND nreq.status = 'pending'
         ORDER BY nreq.requested_at DESC`,
        [fac[0].faculty_id]
      );
      res.json({ success: true, count: rows.length, requests: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── POST /api/nodues/approve/:req_id — Faculty approves with PIN
router.post("/approve/:req_id", verifyToken, requireRole("faculty","hod"),
  auditLog("APPROVE_NODUES","nodues_requirements"),
  async (req, res) => {
    const { pin, remarks, action } = req.body; // action: 'approve' | 'reject'
    if (!pin)
      return res.status(400).json({ success: false, message: "Approval PIN required" });
    if (!["approve","reject"].includes(action))
      return res.status(400).json({ success: false, message: "action must be approve or reject" });

    try {
      // Verify faculty PIN (stored as bcrypt hash of their password)
      const [userRow] = await db.query(
        "SELECT password_hash FROM users WHERE user_id = ?", [req.user.user_id]);
      const pinValid = await bcrypt.compare(pin, userRow[0].password_hash);
      if (!pinValid)
        return res.status(401).json({ success: false, message: "Incorrect PIN" });

      const [fac] = await db.query(
        "SELECT faculty_id FROM faculty WHERE user_id = ?", [req.user.user_id]);
      const fid = fac[0].faculty_id;

      // Confirm this requirement belongs to this faculty
      const [nr] = await db.query(
        `SELECT nr.*, s.subject_name, u_stu.user_id AS stu_user_id,
                u_stu.name AS student_name, st.roll_number
         FROM nodues_requirements nr
         JOIN subjects    s   ON nr.subject_id  = s.subject_id
         JOIN students    st  ON nr.student_id  = st.student_id
         JOIN users       u_stu ON st.user_id   = u_stu.user_id
         WHERE nr.req_id = ? AND nr.faculty_id = ?`,
        [req.params.req_id, fid]
      );
      if (!nr.length)
        return res.status(404).json({ success: false, message: "Record not found" });

      const newStatus = action === "approve" ? "approved" : "rejected";

      // Generate unique verification hash for this approval
      const verifyHash = action === "approve"
        ? `${uuidv4()}-${nr[0].student_id}-${fid}-${Date.now()}`
        : null;

      // Signature data (initials + timestamp)
      const initials = req.user.name.split(" ").map(w => w[0]).join("").toUpperCase();
      const signatureData = action === "approve"
        ? JSON.stringify({
            initials,
            faculty_name: req.user.name,
            timestamp: new Date().toISOString(),
            ip: req.ip,
          })
        : null;

      await db.query(
        `UPDATE nodues_requirements
         SET overall_status = ?, faculty_remarks = ?,
             approval_pin_verified = ?, approved_at = ?,
             signature_data = ?, qr_verify_hash = ?
         WHERE req_id = ?`,
        [newStatus, remarks || null, action === "approve",
         action === "approve" ? new Date() : null,
         signatureData, verifyHash, req.params.req_id]
      );

      await db.query(
        `UPDATE nodues_requests SET status = ?, responded_at = NOW()
         WHERE req_id = ? AND status = 'pending'`,
        [newStatus, req.params.req_id]
      );

      // Notify student
      const msg = action === "approve"
        ? `✅ No-dues approved for ${nr[0].subject_name} by ${req.user.name}`
        : `❌ No-dues rejected for ${nr[0].subject_name}. Reason: ${remarks || "See faculty"}`;
      await pushNotification(nr[0].stu_user_id, "No-Dues Update", msg,
                             action === "approve" ? "approval" : "rejection");

      res.json({
        success: true,
        message: `Request ${newStatus}`,
        qr_verify_hash: verifyHash,
        signature: signatureData,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── POST /api/nodues/update-items/:req_id — Faculty updates individual items
router.post("/update-items/:req_id", verifyToken, requireRole("faculty","hod"),
  async (req, res) => {
    const allowed = [
      "assign1_submitted","assign2_submitted","assign3_submitted",
      "mcq1_cleared","mcq2_cleared","mcq3_cleared","seminar_done",
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = !!req.body[k]; });
    if (!Object.keys(updates).length)
      return res.status(400).json({ success: false, message: "No fields to update" });

    try {
      const [fac] = await db.query(
        "SELECT faculty_id FROM faculty WHERE user_id = ?", [req.user.user_id]);

      const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(", ");
      const values     = [...Object.values(updates), req.params.req_id, fac[0].faculty_id];

      await db.query(
        `UPDATE nodues_requirements SET ${setClauses}
         WHERE req_id = ? AND faculty_id = ?`, values
      );
      res.json({ success: true, message: "Items updated", updated: updates });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/nodues/verify/:hash — Verify QR hash (admin/office use)
router.get("/verify/:hash", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT nr.overall_status, nr.approved_at, nr.signature_data,
              s.subject_name, s.subject_code,
              u_stu.name AS student_name, st.roll_number,
              u_fac.name AS faculty_name, d.dept_name
       FROM nodues_requirements nr
       JOIN subjects  s     ON nr.subject_id  = s.subject_id
       JOIN students  st    ON nr.student_id  = st.student_id
       JOIN users     u_stu ON st.user_id     = u_stu.user_id
       JOIN faculty   f     ON nr.faculty_id  = f.faculty_id
       JOIN users     u_fac ON f.user_id      = u_fac.user_id
       JOIN departments d   ON u_fac.dept_id  = d.dept_id
       WHERE nr.qr_verify_hash = ?`, [req.params.hash]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: "Invalid or fake certificate" });

    res.json({ success: true, valid: true, record: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
