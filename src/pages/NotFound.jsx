import { useNavigate } from "react-router-dom";

export default function NotFound({ message, icon, back }) {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "60vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32,
    }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>{icon || "🔍"}</div>
      <h1 style={{ fontFamily: "var(--font-head)", fontSize: 36, marginBottom: 8 }}>
        Oops! Not Found
      </h1>
      <p style={{ color: "var(--text2)", fontSize: 16, marginBottom: 8 }}>
        {message || "The page you're looking for doesn't exist."}
      </p>
      <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 28 }}>
        Check the URL or go back home.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Go back</button>
        <button className="btn btn-primary" onClick={() => navigate(back || "/programs")}>
          🏠 Back to Programs
        </button>
      </div>
    </div>
  );
}
