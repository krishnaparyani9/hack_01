import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// AUTH
import Login from "./pages/auth/login";
import Signup from "./pages/auth/signup";

// UI
import GlobalToast from "./components/GlobalToast";

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
      <GlobalToast />
      <Routes>
        {/* AUTH */}
        <Route path="/" element={<Login />} />

        {/* PATIENT */}
        <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/patient/records" element={<ProtectedRoute allowedRoles={["patient"]}><Records /></ProtectedRoute>} />
        <Route path="/patient/generate-qr" element={<ProtectedRoute allowedRoles={["patient"]}><GenerateQR /></ProtectedRoute>} />
        <Route path="/patient/emergency" element={<ProtectedRoute allowedRoles={["patient"]}><Emergency /></ProtectedRoute>} />
        <Route path="/patient/documents" element={<ProtectedRoute allowedRoles={["patient"]}><PatientDocuments /></ProtectedRoute>} />


        {/* DOCTOR */}
        <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorLayout><DoctorDashboard /></DoctorLayout></ProtectedRoute>} />
        <Route path="/doctor/scan" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorLayout><ScanQR /></DoctorLayout></ProtectedRoute>} />

        {/* ✅ THIS WAS MISSING */}
        <Route
          path="/doctor/session/:sessionId"
          element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorLayout><DoctorSession /></DoctorLayout></ProtectedRoute>}
        />

        {/* Doctor upload page (clean full-page form) */}
        <Route
          path="/doctor/session/:sessionId/upload"
          element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorLayout><UploadDocument /></DoctorLayout></ProtectedRoute>}
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
