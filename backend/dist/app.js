"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const session_routes_1 = __importDefault(require("./routes/session.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const patient_routes_1 = __importDefault(require("./routes/patient.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
/* ---------- MIDDLEWARES ---------- */
app.use((0, cors_1.default)());
app.use(express_1.default.json());
/* ---------- ROUTES ---------- */
app.use("/api/session", session_routes_1.default);
app.use("/api/auth", require("./routes/auth.routes").default);
app.use("/api/documents", document_routes_1.default);
app.use("/api/patients", patient_routes_1.default);
/* ---------- HEALTH CHECK ---------- */
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Backend is running",
    });
});
/* ---------- EXPORT APP ---------- */
exports.default = app;
