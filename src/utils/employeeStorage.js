const STORAGE_KEY = 'employee_enrollment_data';
const API_BASE = 'http://localhost:5000/api';

const DEMO_EMPLOYEES = [
  {
    id: 'EMP-DEMO-001',
    fullName: 'Alice Johnson',
    email: 'alice.johnson@demo.com',
    phone: '9876543210',
    gender: 'Female',
    dob: '1990-05-15',
    department: 'Engineering',
    designation: 'Senior Developer',
    joiningDate: '2020-01-10',
    employmentType: 'Full-time',
    salary: '85000',
    address: '123 Tech Park, Bangalore, Karnataka 560001',
    isDemo: true,
    createdAt: new Date('2020-01-10').toISOString(),
  },
  {
    id: 'EMP-DEMO-002',
    fullName: 'Bob Martinez',
    email: 'bob.martinez@demo.com',
    phone: '8765432109',
    gender: 'Male',
    dob: '1988-11-22',
    department: 'Marketing',
    designation: 'Marketing Manager',
    joiningDate: '2019-03-15',
    employmentType: 'Full-time',
    salary: '72000',
    address: '456 Business Ave, Mumbai, Maharashtra 400001',
    isDemo: true,
    createdAt: new Date('2019-03-15').toISOString(),
  },
  {
    id: 'EMP-DEMO-003',
    fullName: 'Carol Smith',
    email: 'carol.smith@demo.com',
    phone: '7654321098',
    gender: 'Female',
    dob: '1995-07-30',
    department: 'Human Resources',
    designation: 'HR Executive',
    joiningDate: '2022-06-01',
    employmentType: 'Full-time',
    salary: '55000',
    address: '789 Corporate Road, Delhi, Delhi 110001',
    isDemo: true,
    createdAt: new Date('2022-06-01').toISOString(),
  },
  {
    id: 'EMP-DEMO-004',
    fullName: 'David Lee',
    email: 'david.lee@demo.com',
    phone: '6543210987',
    gender: 'Male',
    dob: '1992-02-14',
    department: 'Finance',
    designation: 'Financial Analyst',
    joiningDate: '2021-09-01',
    employmentType: 'Contract',
    salary: '62000',
    address: '321 Finance Street, Chennai, Tamil Nadu 600001',
    isDemo: true,
    createdAt: new Date('2021-09-01').toISOString(),
  },
  {
    id: 'EMP-DEMO-005',
    fullName: 'Eva Williams',
    email: 'eva.williams@demo.com',
    phone: '5432109876',
    gender: 'Female',
    dob: '1998-12-05',
    department: 'Design',
    designation: 'UI/UX Designer',
    joiningDate: '2023-02-20',
    employmentType: 'Part-time',
    salary: '45000',
    address: '654 Creative Lane, Pune, Maharashtra 411001',
    isDemo: true,
    createdAt: new Date('2023-02-20').toISOString(),
  },
];

// LocalStorage helpers
export const getLocalEmployees = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data === null) {
      saveLocalEmployees(DEMO_EMPLOYEES);
      return DEMO_EMPLOYEES;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading from localStorage:', err);
    return [];
  }
};

export const saveLocalEmployees = (employees) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
};

// Check Database Connection Status
export const checkDbHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return { connected: true, database: data.database || 'SQLite' };
    }
    return { connected: false, error: 'Database service unavailable' };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};

// GET all employees (Database with LocalStorage fallback & cache)
export const getEmployees = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/employees`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const dbEmployees = await res.json();
      saveLocalEmployees(dbEmployees);
      return { data: dbEmployees, source: 'database' };
    }
  } catch (err) {
    console.warn('[Database] Connecting to server failed, falling back to LocalStorage cache:', err);
  }
  const localData = getLocalEmployees();
  return { data: localData, source: 'local' };
};

// CREATE Employee (Saves to Database & LocalStorage)
export const addEmployee = async (employee) => {
  let savedEmployee = employee;
  try {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee),
    });
    if (res.ok) {
      savedEmployee = await res.json();
    }
  } catch (err) {
    console.warn('[Database] Backend save failed, saved to local cache:', err);
  }

  // Update local storage
  const current = getLocalEmployees();
  const updated = [savedEmployee, ...current.filter((e) => e.id !== savedEmployee.id)];
  saveLocalEmployees(updated);
  return updated;
};

// UPDATE Employee (Updates in Database & LocalStorage)
export const updateEmployee = async (updatedEmployee) => {
  let result = updatedEmployee;
  try {
    const res = await fetch(`${API_BASE}/employees/${updatedEmployee.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEmployee),
    });
    if (res.ok) {
      result = await res.json();
    }
  } catch (err) {
    console.warn('[Database] Backend update failed, updated in local cache:', err);
  }

  const current = getLocalEmployees();
  const updated = current.map((emp) => (emp.id === result.id ? result : emp));
  saveLocalEmployees(updated);
  return updated;
};

// DELETE Employee (Deletes from Database & LocalStorage)
export const deleteEmployee = async (id) => {
  try {
    await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('[Database] Backend delete failed, deleted from local cache:', err);
  }

  const current = getLocalEmployees();
  const updated = current.filter((emp) => emp.id !== id);
  saveLocalEmployees(updated);
  return updated;
};

// CLEAR all employees
export const clearAllEmployees = async () => {
  try {
    await fetch(`${API_BASE}/employees`, { method: 'DELETE' });
  } catch (err) {
    console.warn('[Database] Backend clear failed:', err);
  }
  saveLocalEmployees([]);
  return [];
};

// ID generator
export const generateEmployeeId = (existingEmployees = []) => {
  const employees = existingEmployees.length > 0 ? existingEmployees : getLocalEmployees();
  const year = new Date().getFullYear();
  const existingNums = employees
    .filter((e) => !e.isDemo)
    .map((e) => {
      const match = e.id.match(/EMP-(\d{4})-(\d+)/);
      return match ? parseInt(match[2], 10) : 0;
    });
  const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
  const nextNum = String(maxNum + 1).padStart(4, '0');
  return `EMP-${year}-${nextNum}`;
};

export const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Human Resources',
  'Finance',
  'Design',
  'Operations',
  'Sales',
  'Legal',
  'Customer Support',
  'Research & Development',
];

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract'];
