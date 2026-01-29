"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post("/signup", auth_controller_1.signupController);
router.post("/login", auth_controller_1.loginController);
router.get("/me", require("../middleware/auth.middleware").authMiddleware, require("../controllers/auth.controller").meController);
exports.default = router;
