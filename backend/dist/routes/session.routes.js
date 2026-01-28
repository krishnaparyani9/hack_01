"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const session_controller_1 = require("../controllers/session.controller");
const router = (0, express_1.Router)();
/**
 * Patient creates QR
 */
router.post("/create", session_controller_1.createSessionController);
/**
 * Doctor validates QR
 */
router.post("/validate", session_controller_1.validateSessionController);
/**
 * Get session info (accessType / patientId)
 */
router.get("/:sessionId", session_controller_1.getSessionController);
exports.default = router;
