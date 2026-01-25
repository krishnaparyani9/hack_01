import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sessionRoutes from "./routes/session.routes";

dotenv.config();

const app = express();

/* ---------- MIDDLEWARES ---------- */
app.use(cors());
app.use(express.json());
app.use("/api/session", sessionRoutes);


/* ---------- HEALTH CHECK ---------- */
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is running",
  });
});

/* ---------- EXPORT APP ---------- */
export default app;
