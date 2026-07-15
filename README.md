# 🎓 Smart Faculty Locator & Digital No-Dues System

> A full-stack web and mobile application that helps students locate faculty members in real-time and complete the no-dues clearance process digitally — eliminating paper-based approvals and manual faculty searching.

---

## 📸 Screenshots

| Login | Student Dashboard | Faculty Dashboard | Admin Panel |
|---|---|---|---|
| Login with role-based access | Search faculty + No-Dues tracker | Status updates + Approvals | Add users + manage everything |

---

## 🚀 Live Demo

| Service | URL |
|---|---|
| Frontend | https://smart-campus.netlify.app |
| Backend API | https://smart-campus-backend.onrender.com |
| API Health | https://smart-campus-backend.onrender.com/api/health |

---

## 👤 Test Login Credentials

| Role | Email | Password |
|---|---|---|
| 🛡️ Admin | admin@college.edu | admin123 |
| 👨‍🏫 Faculty | kumar@college.edu | faculty123 |
| 🎓 Student | arjun@college.edu | student123 |

---

## ✨ Features

### Student
- 🔍 Search faculty by name or department
- 📍 See real-time location (floor + room number)
- 🟢 See live status (Available / Busy / In Class / In Meeting)
- 📋 Track no-dues subject-wise (Assignments, MCQs, Seminar)
- 📲 Request approval from faculty via app
- 🖨️ Print-ready no-dues certificate (tamper-proof, server-verified)

### Faculty
- ✅ Update live status (Available / Busy / In Class / In Meeting / Absent)
- 📍 QR Code room check-in for location confirmation
- 📚 View today's timetable automatically
- 📋 Approve/reject no-dues with PIN (digitally signed)
- 🎓 Add and manage students directly
- ✔️ Mark assignments, MCQs, seminars per student

### Admin
- 📊 Dashboard with stats and charts
- ➕ Add Students, Faculty, HOD, Admin users
- 👥 View all users — search, filter, activate/deactivate
- 🏫 Add and manage rooms (auto QR code generated)
- 📚 Add subjects with code, name, department, semester
- 🗓️ Add timetable entries linking faculty → subject → room → time

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Mobile App | Flutter (Android + iOS) |
| Web Frontend | React.js |
| Backend API | Node.js + Express |
| Database | MySQL (structured data) |
| Real-time | Firebase Realtime Database |
| Authentication | JWT Tokens |
| Notifications | Firebase Cloud Messaging |
| Hosting (Frontend) | Netlify |
| Hosting (Backend) | Render.com |
| Hosting (Database) | Railway.app |

---

## 📁 Project Structure

```
smart-campus/
├── backend/                  ← Node.js REST API
│   ├── server.js             ← Main entry point
│   ├── .env.example          ← Environment variables template
│   ├── config/
│   │   ├── db.js             ← MySQL connection
│   │   └── firebase.js       ← Firebase Admin SDK
│   ├── middleware/
│   │   └── auth.js           ← JWT + role guard
│   └── routes/
│       ├── auth.js           ← Login, register
│       ├── faculty.js        ← Search, status, QR check-in
│       ├── nodues.js         ← Full approval workflow
│       ├── timetable.js      ← Timetable CRUD
│       ├── student.js        ← Student profile
│       ├── admin.js          ← Users, rooms, subjects, stats
│       └── notifications.js  ← Push notifications
│
├── frontend/                 ← React Web App
│   └── src/
│       ├── App.js            ← Router + role-based navigation
│       ├── context/
│       │   └── AuthContext.js ← Global auth state
│       └── pages/
│           ├── Login.js
│           ├── StudentDashboard.js
│           ├── FacultySearch.js
│           ├── NoDuesPage.js
│           ├── FacultyDashboard.js
│           └── AdminDashboard.js
│
├── flutter_app/              ← Flutter Mobile App
│   └── lib/
│       ├── main.dart
│       ├── models/models.dart
│       ├── services/
│       │   ├── auth_service.dart
│       │   └── api_service.dart
│       └── screens/
│           ├── auth/login_screen.dart
│           ├── student/
│           └── faculty/
│
└── database/
    └── schema.sql            ← MySQL database schema
```

---

## ⚙️ Local Setup (Run on Your Laptop)

### Requirements
- Node.js v18+
- MySQL 8.0
- Git

### Step 1 — Clone the project
```bash
git clone https://github.com/YOURUSERNAME/smart-campus.git
cd smart-campus
```

### Step 2 — Set up MySQL database
```bash
# Open MySQL Workbench
# File → Open SQL Script → select database/schema.sql
# Press Ctrl+Shift+Enter to run
```

### Step 3 — Set up Backend
```bash
cd backend
cp .env.example .env
# Edit .env — add your MySQL password and JWT secret
npm install
npm run dev
```
Backend runs at: `http://localhost:5000`
Test: `http://localhost:5000/api/health`

### Step 4 — Set up Frontend
```bash
cd frontend
# Create .env file with Firebase config (or use fake values for local)
npm install
npm start
```
Frontend runs at: `http://localhost:3000`

### Step 5 — Create test users
```bash
# Create Admin
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@college.edu","password":"admin123","role":"admin","dept_id":1}'

# Create Faculty
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr R Kumar","email":"kumar@college.edu","password":"faculty123","role":"faculty","dept_id":1,"employee_id":"EMP001","designation":"Professor"}'

# Create Student
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Arjun Nair","email":"arjun@college.edu","password":"student123","role":"student","dept_id":1,"roll_number":"21CS045","semester":6,"batch_year":2021}'
```

---

## 🌐 Deployment (Free Hosting)

### Database → Railway.app
1. Go to railway.app → New Project → Provision MySQL
2. Copy connection details (host, user, password, database)
3. Run schema.sql in Railway's query console

### Backend → Render.com
1. Push backend to GitHub
2. Go to render.com → New Web Service → connect repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables from your .env file

### Frontend → Netlify
1. Push frontend to GitHub
2. Go to netlify.com → New Site → connect repo
3. Build command: `npm run build`
4. Publish directory: `build`
5. Add environment variables (Firebase config + API URL)

### Update After Deployment
```bash
# Make your changes on laptop, then:
git add .
git commit -m "describe your change"
git push
# Netlify and Render automatically redeploy ✅
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login + get token |
| GET | /api/auth/me | Get current user |

### Faculty
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/faculty/search?q=name | Search faculty |
| PUT | /api/faculty/status | Update own status |
| POST | /api/faculty/qr-checkin | QR room check-in |
| GET | /api/faculty/today-schedule | Today's timetable |

### No-Dues
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/nodues/student | Student's all dues |
| POST | /api/nodues/request/:id | Request approval |
| GET | /api/nodues/faculty/pending | Faculty pending list |
| POST | /api/nodues/approve/:id | Approve with PIN |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/admin/stats | Dashboard stats |
| GET | /api/admin/users | All users |
| POST | /api/admin/rooms | Add room |
| POST | /api/admin/subjects | Add subject |

---

## 🔐 Security

- JWT tokens expire in 7 days
- Passwords stored as bcrypt hashes
- Faculty PIN (password) required for every no-dues approval
- Every approval stored with timestamp + faculty ID + IP address
- QR verify hash — unique per approval, verifiable by office
- Students cannot edit data — everything is server-verified
- Role-based access — student/faculty/hod/admin see different screens

---

## 🗄️ Database Schema

13 tables:
`users` `students` `faculty` `departments` `rooms` `subjects`
`timetable` `faculty_status` `qr_checkins` `nodues_requirements`
`nodues_requests` `notifications` `audit_log`

---

## 📱 Mobile App (Flutter)

```bash
cd flutter_app
flutter pub get

# For Android emulator:
# Edit lib/services/api_service.dart
# Set baseUrl = 'http://10.0.2.2:5000/api'

flutter run
```

---

## 🐛 Common Issues

| Problem | Fix |
|---|---|
| White screen on frontend | Press F12 → Console → check red error |
| MySQL connection failed | Check DB_PASSWORD in backend .env |
| Cannot find module | Run npm install again |
| Port 5000 already in use | Restart PC and try again |
| git push asks password | Use Personal Access Token not your password |
| Render free tier slow | First request takes 30 sec to wake up |

---

## 👨‍💻 Developer

**Jagadeeshwaran M**
B.Tech Computer Science & Engineering
Takshashila University, Tindivanam, Tamil Nadu
Graduating 2027

---

## 📄 License

This project is for educational purposes — Final Year Project.

---

## ⭐ Show Support

If this project helped you, please give it a ⭐ on GitHub!

