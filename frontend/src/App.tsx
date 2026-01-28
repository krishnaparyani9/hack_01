import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// AUTH
import Login from "./pages/auth/login";
import Signup from "./pages/auth/signup";

// PATIENT
import PatientDashboard from "./pages/patient/Dashboard";
import GenerateQR from "./pages/patient/GenerateQR";
import Emergency from "./pages/patient/Emergency";
import Records from "./pages/patient/Records";
import PatientDocuments from "./pages/patient/Documents";

// DOCTOR
import DoctorDashboard from "./pages/doctor/Dashboard";
import ScanQR from "./pages/doctor/ScanQr";
import DoctorSession from "./pages/doctor/Session";
import UploadDocument from "./pages/doctor/UploadDocument";
import DoctorLayout from "./components/DoctorLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH */}
        <Route path="/" element={<Login />} />

        {/* PATIENT */}
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/patient/records" element={<Records />} />
        <Route path="/patient/generate-qr" element={<GenerateQR />} />
        <Route path="/patient/emergency" element={<Emergency />} />
        <Route path="/patient/documents" element={<PatientDocuments />} />


        {/* DOCTOR */}
        <Route path="/doctor/dashboard" element={<DoctorLayout><DoctorDashboard /></DoctorLayout>} />
        <Route path="/doctor/scan" element={<DoctorLayout><ScanQR /></DoctorLayout>} />

        {/* ✅ THIS WAS MISSING */}
        <Route
          path="/doctor/session/:sessionId"
          element={<DoctorLayout><DoctorSession /></DoctorLayout>}
        />

        {/* Doctor upload page (clean full-page form) */}
        <Route
          path="/doctor/session/:sessionId/upload"
          element={<DoctorLayout><UploadDocument /></DoctorLayout>}
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
