import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPrograms } from "../services/api";

const ICONS = ["📚", "🔐", "📊", "🤖", "🧬", "🌐", "⚡", "🎯"];

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getPrograms()
      .then((r) => setPrograms(r.data))
      .catch(() => {})   // OfflineBanner handles the UI — just suppress the rejection
      .finally(() => setLoading(false));
  }, []);

  const filtered = programs.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Programs</h1>
          <p className="page-subtitle">{programs.length} programs available — click one to explore its modules</p>
        </div>
        <input
          className="input"
          style={{ width: 220, marginLeft: "auto" }}
          placeholder="Search programs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>📭</div>
          <p>No programs found.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {filtered.map((prog, i) => (
            <div
              key={prog.id}
              className="card"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/programs/${prog.id}`)}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{ICONS[i % ICONS.length]}</div>
              <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{prog.name}</h3>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, minHeight: 38 }}>
                {prog.description || "No description provided."}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>
                  {prog.module_count ?? 0} module{prog.module_count !== 1 ? "s" : ""}
                </span>
                <span style={{ color: "var(--accent)", fontSize: 13 }}>Open →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
