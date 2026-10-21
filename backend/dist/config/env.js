"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from backend root
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    db: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '3306', 10),
        name: process.env.DATABASE_NAME || 'membership_system_db',
        user: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASSWORD || '',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'super-secure-institutional-management-secret-key-2026-xyz',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    cookieName: process.env.COOKIE_NAME || 'auth_token',
};
