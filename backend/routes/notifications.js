// routes/notifications.js
const router = require("express").Router();
const db     = require("../config/db");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.user_id]
    );
    res.json({ success: true, notifications: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/read-all", verifyToken, async (req, res) => {
  try {
    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
      [req.user.user_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
