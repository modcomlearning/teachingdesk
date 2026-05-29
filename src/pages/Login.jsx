import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/programs");
    } catch (err) {
      if (err.isNetworkError) {
        setError("No internet connection — please check your network.");
      } else if (err.isServerError) {
        setError("Cannot reach the server — please try again shortly.");
      } else {
        setError(err.response?.data?.error || "Invalid email or password");
      }
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 36, color: "var(--text)", lineHeight: 1.1 }}>
            Teaching<span style={{ color: "var(--accent)" }}>Desk</span>
          </div>
          <br />
          <h2>Modcom Institute of Technology</h2>
          <p style={{ color: "var(--text2)", marginTop: 8, fontSize: 14 }}>
            Instructor learning materials platform
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 22, marginBottom: 24 }}>
            Sign in
          </h2>

          {error && (
            <div style={{
              background: "rgba(248,113,113,.1)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              fontSize: 14,
              marginBottom: 16,
            }}>{error}</div>
          )}

          <form onSubmit={handle} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="input"
                type="email"
                required
                placeholder="you@school.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="input"
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, justifyContent: "center" }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text3)" }}>
          <code style={{ color: "var(--accent2)" }}>   <span style={{ color: "white" }}>
               Copyright &copy; 2026.
      </span>  <b>MODCOM LTD</b> </code>  
        </p>
      
      </div>
    </div>
  );
}
