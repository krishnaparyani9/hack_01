import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// AUTH
import Login from "./pages/auth/login";

// PATIENT
import PatientDashboard from "./pages/patient/Dashboard";
import GenerateQR from "./pages/patient/GenerateQR";
import Emergency from "./pages/patient/Emergency";
import Records from "./pages/patient/Records";

// DOCTOR
import DoctorDashboard from "./pages/doctor/Dashboard";
import ScanQR from "./pages/doctor/ScanQr";
import DoctorSession from "./pages/doctor/Session";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH */}
        <Route path="/" element={<Login />} />

        {/* PATIENT */}
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/records" element={<Records />} />
        <Route path="/patient/generate-qr" element={<GenerateQR />} />
        <Route path="/patient/emergency" element={<Emergency />} />

        {/* DOCTOR */}
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/scan" element={<ScanQR />} />

        {/* ✅ THIS WAS MISSING */}
        <Route
          path="/doctor/session/:sessionId"
          element={<DoctorSession />}
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
