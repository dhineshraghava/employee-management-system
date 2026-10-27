# Employee Management System — Full-Stack Two-Panel System (Admin & Employee)

A production-grade, full-stack Employee Management System built with **React 19**, **Vite**, **Express**, **MySQL (emp_db)**, and **JWT Authentication**.

---

## 🌟 Key Features

### 👑 1. Admin Panel
- **Employee Directory**: Complete CRUD operations (Register new employee, View directory, Edit profiles, Safe Deletion).
- **Credential Control**: Admin can set and reset employee login passwords anytime.
- **Attendance Oversight**: View today's summary, mark or correct check-in / check-out times, and filter logs.
- **Task Management**: Assign work items with priority, deadlines, and tracking.
- **Executive Analytics**: Real-time KPI summary cards and departmental breakdown.

### 💼 2. Employee Self-Service Portal
- **Secure Authentication**: Dedicated employee sign-in using registered corporate email & password.
- **Attendance Punching**: One-click daily Check-In and Check-Out with real-time status display.
- **Task Tracker**: View assigned deliverables, filter by status, and update task progress (Pending / In Progress / Completed).
- **Personal Profile**: View designation, department, contact info, and attendance history.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, React Router 7, Lucide Icons, Vanilla CSS Design System.
- **Backend**: Node.js, Express, MySQL2 (Connection Pool), JSON Web Tokens (JWT), bcryptjs.
- **Database**: MySQL 8.0+ (`emp_db`) with tables: `admins`, `employees`, `attendance`, `tasks`.

---

## 🚀 How to Run the Application

### 1. Database Setup (MySQL)
Ensure your MySQL service is running locally on port 3306.
The database `emp_db` and all tables will automatically be created and seeded on server start!
Or run [schema.sql](schema.sql) in MySQL Workbench.

### 2. Start the Backend Server (Port 5000)
```powershell
npm run server
```
- API Base URL: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

### 3. Start the Frontend Application (Port 3000)
In another terminal:
```powershell
npm run dev
```
- Open in your browser: **`http://localhost:3000`**

---

## 🔑 Default Login Credentials

| Role | Email ID | Password | Access Area |
|---|---|---|---|
| **Admin** | `admin@ems.com` | `admin123` | Complete Admin Dashboard & Controls |
| **Employee** | `roshan@gmail.com` | `employee123` | Personal Attendance & Task Portal |
| **Employee** | `saran@gmail.com` | `employee123` | Personal Attendance & Task Portal |

---

## 📡 Core API Routes

- `POST /api/auth/admin/login` — Administrator login
- `POST /api/auth/employee/login` — Employee portal login
- `GET  /api/health` — Server and MySQL connection status
- `GET  /api/admin/employees` — Fetch all employees
- `POST /api/admin/employees` — Register new employee
- `PUT  /api/admin/employees/:id` — Update employee
- `DELETE /api/admin/employees/:id` — Delete employee
- `POST /api/admin/employees/:id/reset-password` — Set employee password
- `GET  /api/attendance` — Attendance records and stats
- `POST /api/attendance/check-in` — Employee attendance check-in
- `POST /api/attendance/check-out` — Employee attendance check-out
- `GET  /api/tasks` — Tasks list and assignment
