import { Router } from "express";
import {
  uploadDocumentController,
  getDocumentsController,
} from "../controllers/document.controller";
import { upload } from "../middleware/upload";

const router = Router();

router.post(
  "/upload/:sessionId",
  upload.single("file"), // 🔴 MUST BE "file"
  uploadDocumentController
);

router.get("/:sessionId", getDocumentsController);

export default router;
