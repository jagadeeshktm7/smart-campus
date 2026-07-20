// config/db.js — MySQL Connection Pool
const mysql = require("mysql2/promise");

// Log what values we are reading
console.log("DB Config:", {
  host:     process.env.DB_HOST     || "NOT SET",
  user:     process.env.DB_USER     || "NOT SET",
  database: process.env.DB_NAME     || "NOT SET",
  port:     process.env.DB_PORT     || "NOT SET",
});

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "",
  database:           process.env.DB_NAME     || "smart_campus",
  port:       parseInt(process.env.DB_PORT)   || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.getConnection()
  .then(conn => {
    console.log("✅ MySQL connected successfully");
    conn.release();
  })
  .catch(err => {
    console.error("❌ MySQL connection failed:", err.message);
  });

module.exports = pool;