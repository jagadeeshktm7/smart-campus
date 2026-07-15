// routes/auth.js — Register, Login, Refresh
const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db      = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// ── Helper: sign JWT ─────────────────────────────────────────
const signToken = (user_id, role) =>
  jwt.sign({ user_id, role }, process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// ── POST /api/auth/register ───────────────────────────────────
router.post("/register", [
  body("name").trim().notEmpty(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("role").isIn(["student","faculty","hod","admin"]),
  body("dept_id").isInt(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, role, dept_id, phone,
          roll_number, semester, batch_year, section,
          employee_id, designation } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Check duplicate email
    const [existing] = await conn.query(
      "SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length)
      return res.status(409).json({ success: false, message: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);

    const [result] = await conn.query(
      `INSERT INTO users (name, email, password_hash, role, dept_id, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hash, role, dept_id, phone || null]
    );
    const userId = result.insertId;

    // Role-specific profile
    if (role === "student") {
      await conn.query(
        `INSERT INTO students (user_id, roll_number, semester, batch_year, section)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, roll_number, semester, batch_year, section || null]
      );
    } else if (role === "faculty" || role === "hod") {
      await conn.query(
        `INSERT INTO faculty (user_id, employee_id, designation)
         VALUES (?, ?, ?)`,
        [userId, employee_id, designation || null]
      );
    }

    await conn.commit();
    const token = signToken(userId, role);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: { user_id: userId, name, email, role, dept_id },
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;
  try {
    const [rows] = await db.query(
      `SELECT u.user_id, u.name, u.email, u.password_hash, u.role,
              u.dept_id, u.is_active, d.dept_name,
              s.roll_number, s.semester, s.student_id,
              f.employee_id, f.faculty_id
       FROM users u
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       LEFT JOIN students s    ON u.user_id = s.user_id
       LEFT JOIN faculty  f    ON u.user_id = f.user_id
       WHERE u.email = ?`, [email]
    );

    if (!rows.length)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const user = rows[0];
    if (!user.is_active)
      return res.status(403).json({ success: false, message: "Account deactivated" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const token = signToken(user.user_id, user.role);
    delete user.password_hash;

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get("/me", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.user_id, u.name, u.email, u.role, u.phone,
              d.dept_name, d.dept_code,
              s.roll_number, s.semester, s.student_id,
              f.employee_id, f.faculty_id, f.designation
       FROM users u
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       LEFT JOIN students    s ON u.user_id = s.user_id
       LEFT JOIN faculty     f ON u.user_id = f.user_id
       WHERE u.user_id = ?`, [req.user.user_id]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/change-password ───────────────────────────
router.post("/change-password", verifyToken, [
  body("old_password").notEmpty(),
  body("new_password").isLength({ min: 6 }),
], async (req, res) => {
  const { old_password, new_password } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT password_hash FROM users WHERE user_id = ?", [req.user.user_id]);
    const valid = await bcrypt.compare(old_password, rows[0].password_hash);
    if (!valid)
      return res.status(400).json({ success: false, message: "Old password incorrect" });

    const hash = await bcrypt.hash(new_password, 12);
    await db.query("UPDATE users SET password_hash = ? WHERE user_id = ?",
                   [hash, req.user.user_id]);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
