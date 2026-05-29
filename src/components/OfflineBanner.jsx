import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [visible, setVisible] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => { setOffline(true);  setVisible(true); };
    const goOnline  = () => {
      setOffline(false);
      // keep banner briefly to show "Back online"
      setTimeout(() => setVisible(false), 3000);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 9999,
      background: offline ? "#dc2626" : "var(--success)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: "10px 20px",
      fontSize: 14,
      fontWeight: 600,
      boxShadow: "0 2px 12px rgba(0,0,0,.4)",
      animation: "slideDown .3s ease",
    }}>
      <span style={{ fontSize: 18 }}>{offline ? "📡" : "✅"}</span>
      {offline
        ? "Connection lost — check your internet connection."
        : "Back online!"}
    </div>
  );
}
