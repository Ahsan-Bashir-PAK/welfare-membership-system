"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const env_js_1 = require("../config/env.js");
function errorHandler(err, req, res, next) {
    console.error('Unhandled error caught in middleware:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'An unexpected internal server error occurred';
    res.status(status).json({
        success: false,
        message,
        ...(env_js_1.config.isProduction ? {} : { stack: err.stack }),
    });
}
