"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
        return next();
    const token = header.split(" ")[1];
    try {
        const payload = (0, jwt_1.verifyAuthToken)(token);
        // attach to request
        req.user = payload;
        next();
    }
    catch (err) {
        // invalid token: just proceed without user (routes can choose to require)
        return next();
    }
};
exports.authMiddleware = authMiddleware;
const requireAuth = (req, res, next) => {
    if (req.user)
        return next();
    return res.status(401).json({ message: "Authentication required" });
};
exports.requireAuth = requireAuth;
