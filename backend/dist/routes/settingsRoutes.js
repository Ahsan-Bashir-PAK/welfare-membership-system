"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_js_1 = require("../controllers/settingsController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/', auth_js_1.authenticateToken, settingsController_js_1.getSettings);
router.patch('/:key', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)('Super Admin'), settingsController_js_1.updateSetting);
exports.default = router;
