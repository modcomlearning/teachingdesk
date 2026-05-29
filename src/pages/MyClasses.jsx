import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyClasses } from "../services/api";

const STATUS_META = {
  active:    { color: "var(--success)", bg: "rgba(52,211,153,.12)",  label: "Active"    },
  paused:    { color: "var(--warn)",    bg: "rgba(251,191,36,.12)",  label: "Paused"    },
  completed: { color: "var(--accent)",  bg: "rgba(108,143,255,.12)", label: "Completed" },
};

export default function MyClasses() {
  const navigate  = useNavigate();
  const [classes,  setClasses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("active");

  useEffect(() => {
    getMyClasses().then(r => setClasses(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? classes : classes.filter(c => c.status === filter);
  const counts   = { active: 0, paused: 0, completed: 0, all: classes.length };
  classes.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Classes</h1>
          <p className="page-subtitle">Programs you have been allocated to — mark modules as you complete them</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[["active","Active"],["paused","Paused"],["completed","Completed"],["all","All"]].map(([key, label]) => (
          <button key={key} className={"btn btn-sm " + (filter === key ? "btn-primary" : "btn-ghost")}
            onClick={() => setFilter(key)}>
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 56 }}>🏫</div>
          <p style={{ marginBottom: 8 }}>No classes allocated yet.</p>
          <p style={{ fontSize: 13, color: "var(--text3)" }}>
            Your admin will allocate you to a program. Once allocated, you can track your module progress here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No {filter} classes.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {filtered.map(cls => {
            const sm    = STATUS_META[cls.status] || STATUS_META.active;
            const total = Number(cls.total_modules) || 0;
            const done  = Number(cls.completed_modules) || 0;
            const ongoing = Number(cls.ongoing_modules) || 0;
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={cls.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{cls.name}</h3>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>📚 {cls.program_name}</div>
                    {cls.start_date && (
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                        Started {new Date(cls.start_date).toLocaleDateString()}
                      </div>
                    )}
                    {cls.description && (
                      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{cls.description}</div>
                    )}
                  </div>
                  <span style={{
                    background: sm.bg, color: sm.color,
                    borderRadius: 99, padding: "3px 10px",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>{sm.label}</span>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)", marginBottom: 5 }}>
                    <span>{done} of {total} modules completed</span>
                    <span style={{ fontWeight: 700, color: pct === 100 ? "var(--success)" : "var(--text2)" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: pct === 100 ? "var(--success)" : "var(--accent)",
                      borderRadius: 99, transition: "width .4s ease",
                    }} />
                  </div>
                </div>

                {/* Status hint */}
                {pct === 100 ? (
                  <div style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(52,211,153,.08)", fontSize: 12, color: "var(--success)", marginBottom: 10 }}>
                    🎉 All modules completed!
                  </div>
                ) : ongoing > 0 ? (
                  <div style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(251,191,36,.08)", fontSize: 12, color: "var(--warn)", marginBottom: 10 }}>
                    🔄 {ongoing} module{ongoing > 1 ? "s" : ""} currently ongoing
                  </div>
                ) : null}

                <button className="btn btn-primary btn-sm"
                  style={{ justifyContent: "center", marginTop: "auto" }}
                  onClick={() => navigate(`/classes/${cls.id}`)}>
                  View & Track Progress →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
