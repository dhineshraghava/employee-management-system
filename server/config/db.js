const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

console.log("DB user:", process.env.DB_USER);
console.log("Password loaded:", Boolean(process.env.DB_PASSWORD));
console.log("Database:", process.env.DB_NAME);

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool;