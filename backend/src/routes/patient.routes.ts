import { Router } from "express";
import { getPatientController, upsertPatientController } from "../controllers/patient.controller";

const router = Router();

router.get("/:patientId", getPatientController);
router.put("/:patientId", upsertPatientController);

export default router;
