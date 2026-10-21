"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const env_js_1 = require("./config/env.js");
const db_js_1 = require("./config/db.js");
const index_js_1 = __importDefault(require("./routes/index.js"));
const errorHandler_js_1 = require("./middleware/errorHandler.js");
exports.app = (0, express_1.default)();
// Security middleware
exports.app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Allows flexible API proxying
}));
// CORS configuration
exports.app.use((0, cors_1.default)({
    origin: [env_js_1.config.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
// Parsing middleware
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
exports.app.use((0, cookie_parser_1.default)());
// Health Check
exports.app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Membership, Payments, Welfare & Transfer Management System',
    });
});
// Main API Router
exports.app.use('/api', index_js_1.default);
// Centralized error handler
exports.app.use(errorHandler_js_1.errorHandler);
// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    const PORT = env_js_1.config.port;
    exports.app.listen(PORT, async () => {
        console.log(`=======================================================`);
        console.log(` Institutional Management Backend Service Running`);
        console.log(` Port: ${PORT} | Mode: ${env_js_1.config.nodeEnv}`);
        console.log(` Database: ${env_js_1.config.db.name}@${env_js_1.config.db.host}:${env_js_1.config.db.port}`);
        console.log(`=======================================================`);
        const isConnected = await (0, db_js_1.testDbConnection)();
        if (isConnected) {
            console.log(' [DB] Connected to MySQL successfully.');
        }
        else {
            console.error(' [DB] WARNING: Could not establish MySQL connection.');
        }
    });
}
