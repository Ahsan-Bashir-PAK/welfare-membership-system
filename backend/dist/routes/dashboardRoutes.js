"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_js_1 = require("../controllers/dashboardController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/summary', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)('Super Admin', 'Focal Person'), dashboardController_js_1.getDashboardSummary);
router.get('/charts', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)('Super Admin', 'Focal Person'), dashboardController_js_1.getDashboardCharts);
exports.default = router;
