# EmpEnroll — Employee Enrollment Management System with SQLite Database

A complete, full-stack Employee Enrollment Management System built with React, Vite, Express, and a persistent SQLite database.

## 🌟 Features

- **Full CRUD Operations**:
  - **Create**: Add new employee with auto-generated ID and validation.
  - **Read**: Responsive employee table with real-time search, filters (department, type), and profile view modal.
  - **Update**: Edit existing employee records with validation.
  - **Delete**: Safe delete dialog with confirmation.
- **Persistent Database**:
  - Direct connection to a SQLite database (`employees.sqlite`) powered by Node.js native SQLite engine.
  - Real-time connection badge on the top navbar (`🟢 SQLite DB Connected`).
  - Seamless LocalStorage fallback and cache if the server is offline.
- **Modern Dashboard UI**:
  - Responsive Sidebar & Topbar with greeting and indicators.
  - Summary cards: Total Employees, Departments, Full-Time, Contract.
  - Clean navy blue & modern gradient theme with CSS micro-animations.

---

## 🛠️ Project Structure

```
employee/
├── employees.sqlite              # Persistent SQLite database file
├── server/
│   ├── db.js                     # SQLite database schema, seeder & queries
│   └── index.js                  # Express REST API (CRUD endpoints)
├── src/
│   ├── components/
│   │   ├── Navbar.jsx            # Top navigation & database status badge
│   │   ├── Sidebar.jsx           # Responsive sidebar navigation
│   │   ├── DashboardCards.jsx    # Metric summary cards
│   │   ├── EmployeeForm.jsx      # Registration & Edit form with validation
│   │   ├── EmployeeTable.jsx     # Filterable, searchable employee table
│   │   ├── EmployeeDetails.jsx   # Profile modal
│   │   ├── ConfirmDelete.jsx     # Delete confirmation modal
│   │   ├── Toast.jsx             # Action notifications
│   │   └── Settings.jsx          # Database management & export
│   ├── utils/
│   │   └── employeeStorage.js    # API service connecting Frontend to SQLite DB
│   ├── App.jsx                   # Main React app state & router
│   ├── main.jsx                  # Application entry point
│   └── index.css                 # Global styling & design tokens
├── package.json
└── vite.config.js
```

---

## 🚀 How to Run

### 1. Start the Database Backend Server
```bash
npm run server
```
- Running at: `http://localhost:5000`
- API Endpoint: `http://localhost:5000/api/employees`
- Database: `employees.sqlite`

### 2. Start the Frontend Application
In another terminal:
```bash
npm run dev
```
- Open in browser: `http://localhost:5173`

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Check database status |
| `GET` | `/api/employees` | Get all employee records |
| `GET` | `/api/employees/:id` | Get single employee details |
| `POST` | `/api/employees` | Insert a new employee record |
| `PUT` | `/api/employees/:id` | Update an existing employee |
| `DELETE` | `/api/employees/:id` | Remove an employee record |
| `DELETE` | `/api/employees` | Clear all records |
