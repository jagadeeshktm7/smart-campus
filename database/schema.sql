-- ============================================================
--  Smart Faculty Locator & Digital No-Dues System
--  Database Schema — MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_campus;
USE smart_campus;

-- ── DEPARTMENTS ──────────────────────────────────────────────
CREATE TABLE departments (
  dept_id       INT AUTO_INCREMENT PRIMARY KEY,
  dept_code     VARCHAR(10)  NOT NULL UNIQUE,
  dept_name     VARCHAR(100) NOT NULL,
  hod_name      VARCHAR(100),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── ROOMS ────────────────────────────────────────────────────
CREATE TABLE rooms (
  room_id       INT AUTO_INCREMENT PRIMARY KEY,
  room_number   VARCHAR(20)  NOT NULL,
  floor         INT          NOT NULL,
  building      VARCHAR(50)  DEFAULT 'Main Block',
  dept_id       INT,
  qr_code_hash  VARCHAR(255) UNIQUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(15),
  role          ENUM('student','faculty','hod','admin') NOT NULL,
  dept_id       INT,
  firebase_uid  VARCHAR(128) UNIQUE,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

-- ── STUDENT PROFILES ─────────────────────────────────────────
CREATE TABLE students (
  student_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL UNIQUE,
  roll_number   VARCHAR(20) NOT NULL UNIQUE,
  semester      INT NOT NULL,
  batch_year    INT NOT NULL,
  section       VARCHAR(5),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── FACULTY PROFILES ─────────────────────────────────────────
CREATE TABLE faculty (
  faculty_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL UNIQUE,
  employee_id   VARCHAR(20) NOT NULL UNIQUE,
  designation   VARCHAR(100),
  specialization VARCHAR(150),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── FACULTY STATUS (Real-time via Firebase, backup in MySQL) ──
CREATE TABLE faculty_status (
  status_id     INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id    INT NOT NULL,
  status        ENUM('available','busy','in_class','in_meeting','absent') DEFAULT 'available',
  room_id       INT,
  available_until DATETIME,
  notes         VARCHAR(255),
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
  FOREIGN KEY (room_id)    REFERENCES rooms(room_id)
);

-- ── SUBJECTS ─────────────────────────────────────────────────
CREATE TABLE subjects (
  subject_id    INT AUTO_INCREMENT PRIMARY KEY,
  subject_code  VARCHAR(20) NOT NULL UNIQUE,
  subject_name  VARCHAR(150) NOT NULL,
  dept_id       INT,
  semester      INT,
  credits       INT DEFAULT 3,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

-- ── TIMETABLE ────────────────────────────────────────────────
CREATE TABLE timetable (
  tt_id         INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id    INT NOT NULL,
  subject_id    INT NOT NULL,
  room_id       INT NOT NULL,
  day_of_week   ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  semester      INT NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  FOREIGN KEY (faculty_id)  REFERENCES faculty(faculty_id),
  FOREIGN KEY (subject_id)  REFERENCES subjects(subject_id),
  FOREIGN KEY (room_id)     REFERENCES rooms(room_id)
);

-- ── QR CHECK-IN LOG ──────────────────────────────────────────
CREATE TABLE qr_checkins (
  checkin_id    INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id    INT NOT NULL,
  room_id       INT NOT NULL,
  checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checked_out_at TIMESTAMP,
  device_id     VARCHAR(128),
  FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
  FOREIGN KEY (room_id)    REFERENCES rooms(room_id)
);

-- ── NO-DUES REQUIREMENTS ─────────────────────────────────────
CREATE TABLE nodues_requirements (
  req_id        INT AUTO_INCREMENT PRIMARY KEY,
  subject_id    INT NOT NULL,
  faculty_id    INT NOT NULL,
  student_id    INT NOT NULL,
  semester      INT NOT NULL,
  assign1_submitted  BOOLEAN DEFAULT FALSE,
  assign2_submitted  BOOLEAN DEFAULT FALSE,
  assign3_submitted  BOOLEAN DEFAULT FALSE,
  mcq1_cleared       BOOLEAN DEFAULT FALSE,
  mcq2_cleared       BOOLEAN DEFAULT FALSE,
  mcq3_cleared       BOOLEAN DEFAULT FALSE,
  seminar_done       BOOLEAN DEFAULT FALSE,
  overall_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  faculty_remarks VARCHAR(255),
  approval_pin_verified BOOLEAN DEFAULT FALSE,
  approved_at    TIMESTAMP,
  signature_data TEXT,
  qr_verify_hash VARCHAR(255) UNIQUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id)  REFERENCES subjects(subject_id),
  FOREIGN KEY (faculty_id)  REFERENCES faculty(faculty_id),
  FOREIGN KEY (student_id)  REFERENCES students(student_id)
);

-- ── NODUES REQUESTS ──────────────────────────────────────────
CREATE TABLE nodues_requests (
  request_id    INT AUTO_INCREMENT PRIMARY KEY,
  student_id    INT NOT NULL,
  req_id        INT NOT NULL,
  message       VARCHAR(500),
  status        ENUM('pending','approved','rejected') DEFAULT 'pending',
  requested_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at  TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (req_id)     REFERENCES nodues_requirements(req_id)
);

-- ── NOTIFICATIONS ────────────────────────────────────────────
CREATE TABLE notifications (
  notif_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  title         VARCHAR(150) NOT NULL,
  body          TEXT,
  type          ENUM('approval','rejection','reminder','system') DEFAULT 'system',
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── AUDIT LOG ────────────────────────────────────────────────
CREATE TABLE audit_log (
  log_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT,
  action        VARCHAR(100) NOT NULL,
  table_name    VARCHAR(50),
  record_id     INT,
  details       JSON,
  ip_address    VARCHAR(45),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── SEED DATA ────────────────────────────────────────────────
INSERT INTO departments (dept_code, dept_name, hod_name) VALUES
  ('CSE',  'Computer Science & Engineering', 'Dr. V. Krishnan'),
  ('ECE',  'Electronics & Communication',    'Dr. M. Sundar'),
  ('MECH', 'Mechanical Engineering',         'Dr. R. Pillai'),
  ('MATHS','Mathematics',                    'Prof. L. Sharma'),
  ('PHY',  'Physics',                        'Dr. A. Menon');

INSERT INTO rooms (room_number, floor, building, dept_id, qr_code_hash) VALUES
  ('101', 1, 'Main Block', 1, 'QR_CSE_101'),
  ('201', 2, 'Main Block', 1, 'QR_CSE_201'),
  ('208', 2, 'Main Block', 1, 'QR_CSE_208'),
  ('301', 3, 'Main Block', 1, 'QR_CSE_301'),
  ('Lab1', 1, 'Lab Block',  1, 'QR_LAB_01'),
  ('102', 1, 'Main Block', 2, 'QR_ECE_102'),
  ('Staff Room', 2, 'Main Block', 1, 'QR_STAFF_01');
