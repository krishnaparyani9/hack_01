import { useState, useEffect } from "react";

const GlobalToast = () => {
  const [toast, setToast] = useState<{ message: string; type?: string } | null>(null);

  useEffect(() => {
    const onToast = (e: any) => {
      const payload = (e && e.detail) || { message: String(e) };
      setToast(payload);
      window.setTimeout(() => setToast(null), 3400);
    };

    window.addEventListener("toast", onToast as any);
    return () => window.removeEventListener("toast", onToast as any);
  }, []);

  if (!toast) return null;
  return <div className={`toast ${toast.type || ""} ${toast ? "show" : ""}`}>{toast.message}</div>;
};

export default GlobalToast;
