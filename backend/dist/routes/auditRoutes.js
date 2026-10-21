"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditController_js_1 = require("../controllers/auditController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)('Super Admin'), auditController_js_1.getAuditLogs);
exports.default = router;
