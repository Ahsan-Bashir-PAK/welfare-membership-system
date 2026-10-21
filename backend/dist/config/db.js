"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.withTransaction = withTransaction;
exports.testDbConnection = testDbConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const env_js_1 = require("./env.js");
exports.pool = promise_1.default.createPool({
    host: env_js_1.config.db.host,
    port: env_js_1.config.db.port,
    user: env_js_1.config.db.user,
    password: env_js_1.config.db.password,
    database: env_js_1.config.db.name,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    decimalNumbers: true,
    timezone: 'Z',
});
// Helper for standard parameterized queries
async function query(sql, params) {
    const [rows] = await exports.pool.query(sql, params);
    return rows;
}
// Transaction execution helper
async function withTransaction(callback) {
    const connection = await exports.pool.getConnection();
    await connection.beginTransaction();
    try {
        const result = await callback(connection);
        await connection.commit();
        return result;
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
// Connection test utility
async function testDbConnection() {
    try {
        const connection = await exports.pool.getConnection();
        await connection.ping();
        connection.release();
        return true;
    }
    catch (err) {
        console.error('Database connection failed:', err);
        return false;
    }
}
