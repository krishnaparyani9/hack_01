import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import "./styles/global.css"; // ✅ CORRECT PATH

// set auth header from localStorage if present
const token = localStorage.getItem("authToken");
if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />
);
