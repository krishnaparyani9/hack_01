import axios from "axios";

export const saveAuth = (token: string, user: any) => {
  localStorage.setItem("authToken", token);
  localStorage.setItem("userId", user.id);
  localStorage.setItem("userName", user.name);
  localStorage.setItem("userEmail", user.email);
  const normalizedRole = (user.role || "").toString().toLowerCase();
  localStorage.setItem("userRole", normalizedRole);
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  // If the authenticated user is a patient, ensure their persistent patientId is set to their user id
  // so documents uploaded under their account remain available across sign-outs.
  if (normalizedRole === "patient") {
    try {
      localStorage.setItem("patientId", user.id);
      if (user.name) localStorage.setItem("patientName", user.name);
      if (user.email) localStorage.setItem("patientEmail", user.email);
    } catch (e) {
      // ignore storage errors
    }
  }
};

export const clearAuth = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  delete axios.defaults.headers.common["Authorization"];
};

export const getAuth = () => {
  const token = localStorage.getItem("authToken");
  const id = localStorage.getItem("userId");
  const name = localStorage.getItem("userName");
  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole");
  return { token, id, name, email, role };
};