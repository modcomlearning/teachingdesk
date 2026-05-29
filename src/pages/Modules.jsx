import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getProgram, getModulesByProgram } from "../services/api";
import NotFound from "./NotFound";

export default function Modules() {
  const { pid }  = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([getProgram(pid), getModulesByProgram(pid)])
      .then(([p, m]) => { setProgram(p.data); setModules(m.data); })
      .catch((err) => { if (err.response?.status === 404) setNotFound(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pid]);

  if (loading)  return <div className="spinner" />;
  if (notFound) return (
    <NotFound
      icon="📚"
      message={`Program #${pid} does not exist. It may have been deleted or you typed the wrong URL.`}
      back="/programs"
    />
  );

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/programs">Programs</Link>
        <span>›</span>
        <span>{program?.name}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{program?.name}</h1>
          <p className="page-subtitle">{program?.description}</p>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>📦</div>
          <p>No modules yet for this program.</p>
        </div>
      ) : (
        <div className="grid-list">
          {modules.map((mod, i) => (
            <div
              key={mod.id}
              className="card"
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
              onClick={() => navigate(`/modules/${mod.id}`)}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: "rgba(108,143,255,.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-head)", fontSize: 16, color: "var(--accent)",
                flexShrink: 0,
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{mod.name}</h3>
                {mod.description && (
                  <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>{mod.description}</p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>
                  {mod.material_count ?? 0} file{mod.material_count !== 1 ? "s" : ""}
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
