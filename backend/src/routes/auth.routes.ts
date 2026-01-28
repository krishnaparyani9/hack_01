import { Router } from "express";
import { signupController, loginController } from "../controllers/auth.controller";

const router = Router();

router.post("/signup", signupController);
router.post("/login", loginController);
router.get("/me", require("../middleware/auth.middleware").authMiddleware, require("../controllers/auth.controller").meController);

export default router;
