import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";


const PORT = process.env.PORT || 5000;

// Connect DB first
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});

