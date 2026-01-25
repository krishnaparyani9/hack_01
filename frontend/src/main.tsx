import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css"; // ✅ CORRECT PATH

ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />
);
