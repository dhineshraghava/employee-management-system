# StaffPulse EMS — AI-Powered Workforce OS & Barcode Attendance

A full-stack, enterprise-grade Workforce Management Platform built with **React 19**, **Vite**, **Express**, **MySQL (`emp_db` / `react_db`)**, **Code 128 Barcodes**, **ZXing Browser Webcam Scanning**, and **AI Workforce Intelligence**.

---

## 🌟 Key Capabilities

### 🛡️ 1. Unified Authentication Panel (`/login`)
- Single sleek, futuristic AI-inspired authentication card for both **Administrators** and **Employees**.
- **Tabs**: `Sign In` and `Create Account` within the same interface.
- **Server Role Resolution**: Server validates credentials and auto-routes:
  - Admin &rarr; `/admin/dashboard`
  - Employee &rarr; `/employee/dashboard`
- **Protected Administrator Registration**: Public users cannot self-assign Admin privileges; requires an Administrative Setup Security Key (`EMS_ADMIN_2026`).
- Password visibility toggle, password strength meter, remember-me persistence, and interactive forgot-password workflow.

### 📷 2. Code 128 Barcode & Webcam Attendance Scanner (`/admin/barcode-attendance`)
- **Webcam & Mobile Camera Support**: Real-time scanning using `@zxing/browser`.
- **Targeting Reticle**: Futuristic animated laser scan beam and corner alignment guides.
- **Attendance State Machine**:
  - **1st Scan of Day**: Records **Check-In** (`status: 'Present'`).
  - **2nd Scan of Day**: Records **Check-Out** and computes exact elapsed work duration and decimal working hours.
  - **Subsequent Scans**: Rejects duplicate attendance with clear conflict feedback.
- **Audio Tone Feedback**: Synthesized Web Audio API sound confirmation on scan.
- **Manual Barcode Fallback**: Manual UID input field (`EMP-<id>`).
- **Live Scans Feed**: Real-time attendance log pulled directly from MySQL.

### 🪪 3. Printable Employee Barcode ID Cards (`/admin/barcode-cards`)
- Automatic generation of unique Code 128 barcodes in format: `EMP-<employee_id>` (e.g., `EMP-1`, `EMP-15`).
- Official employee badge layout with company branding, employee photo avatar, department, designation, and high-density Code 128 barcode.
- **Printable**: `@media print` optimized layout for physical printers or PDF export.
- **Downloadable**: One-click download as high-resolution PNG image.
- Available for both Admin directory (`/admin/barcode-cards`) and Employee self-service profile (`/employee/profile`).

### 👥 4. Employee Management (Complete CRUD)
- Register, edit, search, filter, and deactivate employees.
- Each employee record is linked to MySQL `employees` with auto-assigned Code 128 barcode.
- Quick credential reset for any employee account.

### 📅 5. Attendance & Leave Tracking
- Real-time today summary, daily logs, check-in, check-out, and duration tracking.
- Scoped employee leave application workflow and admin review/approval system.

### 📋 6. Task Management & Work Tracking
- Admin assignment with priority, due date, and descriptions.
- Employee status update pipeline (`Pending` &rarr; `In Progress` &rarr; `Completed`).

### 🧠 7. AI Workforce Intelligence Engine
- Real-time automated insights analyzing team attendance rate, pending workloads, leave impacts, and productivity distribution based on actual MySQL records.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, React Router 7, `@zxing/browser`, `jsbarcode`, Lucide React, Vanilla CSS Design System.
- **Backend**: Node.js, Express, MySQL2 (`mysql2/promise`), JWT (`jsonwebtoken`), bcryptjs.
- **Database**: MySQL 8.0+ (`emp_db`) with auto-migration schema extension for `barcode` and `barcode_scanned`.

---

## 🚀 How to Run the Application

### 1. Database Setup (MySQL)
Ensure your MySQL service is running on `localhost:3306` with user `root`.
The database and tables will be created and migrated automatically when the server boots!

### 2. Start the Backend Server (Port 5000)
In your terminal / Command Prompt:
```cmd
node backend/server.js
```
- API Base URL: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

### 3. Start the Frontend Application (Port 3000)
In another terminal / Command Prompt:
```cmd
npm.cmd run dev
```
- Open in your browser: **`http://localhost:3000`**

---

## 🔑 Demo Login Credentials

| Role | Email / ID | Password | Access Area |
|---|---|---|---|
| **Admin** | `admin@ems.com` | `admin123` | Complete Admin Portal, Barcode Badges, Scanner, CRUD |
| **Employee** | `roshan@gmail.com` | `employee123` | Employee Portal, My Profile & ID Card, Tasks, Leaves |
| **New Employee** | `EMP-1` or Email | (Registered) | Auto-redirects to Employee Dashboard |
