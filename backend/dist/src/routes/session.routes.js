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
// Create a session using a stored patientId (no auth required). Used by patient
// UI flows when the app has a persistent `patientId` but no active auth token.
router.post("/create-anon", session_controller_1.createSessionAnonController);
/**
 * Doctor validates QR
 */
router.post("/validate", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)("doctor"), session_controller_1.validateSessionController);
/**
 * Get session info (doctor / patient)
 */
router.get("/:sessionId", auth_middleware_1.authMiddleware, session_controller_1.getSessionController);
/**
 * End session (patient/doctor)
 */
router.delete("/:sessionId", auth_middleware_1.authMiddleware, session_controller_1.endSessionController);
exports.default = router;
