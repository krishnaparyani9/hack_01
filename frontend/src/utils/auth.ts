import axios from "axios";

export const saveAuth = (token: string, user: any) => {
  localStorage.setItem("authToken", token);
  localStorage.setItem("userId", user.id);
  localStorage.setItem("userName", user.name);
  localStorage.setItem("userEmail", user.email);
  localStorage.setItem("userRole", user.role);
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
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