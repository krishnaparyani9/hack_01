"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patient_controller_1 = require("../controllers/patient.controller");
const router = (0, express_1.Router)();
router.get("/:patientId", patient_controller_1.getPatientController);
router.put("/:patientId", patient_controller_1.upsertPatientController);
exports.default = router;
