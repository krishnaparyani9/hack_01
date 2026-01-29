"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const session_controller_1 = require("../controllers/session.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * Patient creates QR
 */
router.post("/create", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)("patient"), session_controller_1.createSessionController);
/**
 * Doctor validates QR
 */
router.post("/validate", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)("doctor"), session_controller_1.validateSessionController);
/**
 * Get session info (doctor / patient)
 */
router.get("/:sessionId", auth_middleware_1.authMiddleware, session_controller_1.getSessionController);
exports.default = router;
