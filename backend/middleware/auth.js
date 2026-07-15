// middleware/auth.js — JWT + Role-Based Auth
const jwt   = require("jsonwebtoken");
const db    = require("../config/db");

// ── Verify JWT token ─────────────────────────────────────────
const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token   = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB to ensure they still exist and are active
    const [rows] = await db.query(
      "SELECT user_id, name, email, role, dept_id, is_active FROM users WHERE user_id = ?",
      [decoded.user_id]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: "User not found or inactive" });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// ── Role Guard factory ───────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(" or ")}`,
    });
  }
  next();
};

// ── Audit logger ─────────────────────────────────────────────
const auditLog = (action, tableName) => async (req, res, next) => {
  res.on("finish", async () => {
    if (res.statusCode < 400) {
      try {
        await db.query(
          `INSERT INTO audit_log (user_id, action, table_name, ip_address)
           VALUES (?, ?, ?, ?)`,
          [req.user?.user_id, action, tableName,
           req.ip || req.connection.remoteAddress]
        );
      } catch (_) {}
    }
  });
  next();
};

module.exports = { verifyToken, requireRole, auditLog };
