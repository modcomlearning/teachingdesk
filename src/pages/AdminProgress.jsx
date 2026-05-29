import { useState, useEffect } from "react";
import { getProgressOverview, adminUndoProgress, adminSkipProgress, adminRestoreProgress } from "../services/api";
import { useToast } from "../components/Toast";

const STATUS_META = {
  completed:   { icon: "✅", color: "var(--success)",  bg: "rgba(52,211,153,.1)"  },
  ongoing:     { icon: "🔄", color: "var(--warn)",     bg: "rgba(251,191,36,.1)"  },
  skipped:     { icon: "⏭", color: "var(--accent2)",  bg: "rgba(167,139,250,.1)" },
  not_started: { icon: "⬜", color: "var(--text3)",    bg: "transparent"          },
};

const CLASS_STATUS = {
  active:    { color: "var(--success)", label: "Active"    },
  paused:    { color: "var(--warn)",    label: "Paused"    },
  completed: { color: "var(--accent)",  label: "Completed" },
};

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--text3)", marginBottom:4 }}>
        <span>{completed}/{total} modules</span>
        <span style={{ fontWeight:700, color: pct===100 ? "var(--success)" : "var(--text2)" }}>{pct}%</span>
      </div>
      <div style={{ height:6, background:"var(--border)", borderRadius:99, overflow:"hidden" }}>
        <div style={{
          height:"100%", width:`${pct}%`,
          background: pct===100 ? "var(--success)" : pct>50 ? "var(--accent)" : "var(--warn)",
          borderRadius:99, transition:"width .4s",
        }} />
      </div>
    </div>
  );
}

function ClassCard({ cls, onActionDone }) {
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [acting,   setActing]   = useState(null); // module_id currently being acted on
  const total     = Number(cls.total) || 0;
  const completed = Number(cls.completed) || 0;
  const ongoing   = Number(cls.ongoing) || 0;
  const skipped   = Number(cls.skipped) || 0;
  const cs        = CLASS_STATUS[cls.class_status] || CLASS_STATUS.active;
  const modules   = cls.modules || [];

  const act = async (label, fn, mod) => {
    setActing(mod.module_id);
    try {
      await fn();
      toast(label);
      onActionDone();
    } catch (e) {
      toast(e.response?.data?.error || "Action failed", "error");
    } finally {
      setActing(null);
    }
  };

  return (
    <div style={{
      border: "1px solid var(--border)", borderRadius: "var(--radius)",
      overflow: "hidden", marginBottom: 10,
    }}>
      {/* Class header row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        padding: "14px 18px", background: "var(--bg2)",
        cursor: "pointer",
      }} onClick={() => setExpanded(o => !o)}>

        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{cls.class_name}</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>
            📚 {cls.program_name}
            {cls.start_date && <span style={{ marginLeft: 8 }}>
              · Started {new Date(cls.start_date).toLocaleDateString()}
            </span>}
          </div>
          {cls.current_module && (
            <div style={{ fontSize: 12, color: "var(--warn)", marginTop: 3 }}>
              🔄 Currently: <strong>{cls.current_module}</strong>
            </div>
          )}
        </div>

        <div style={{ flex: "1 1 160px", minWidth: 140 }}>
          <ProgressBar completed={completed} total={total} />
        </div>

        <div style={{ display: "flex", gap: 12, fontSize: 12, flexShrink: 0 }}>
          <span style={{ color: "var(--success)", fontWeight: 600 }}>✅ {completed} done</span>
          <span style={{ color: "var(--warn)", fontWeight: 600 }}>🔄 {ongoing} ongoing</span>
          {skipped > 0 && <span style={{ color: "var(--accent2)", fontWeight: 600 }}>⏭ {skipped} skipped</span>}
          <span style={{ color: "var(--text3)" }}>⬜ {Number(cls.not_started)||0} left</span>
        </div>

        <span style={{
          background: cs.color + "22", color: cs.color,
          borderRadius: 99, padding: "3px 10px",
          fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>{cs.label}</span>

        <span style={{
          color: "var(--text3)", fontSize: 11, flexShrink: 0,
          transform: expanded ? "rotate(180deg)" : "rotate(0)",
          transition: "transform .2s",
        }}>▼</span>
      </div>

      {/* Expanded module detail */}
      {expanded && (
        <div style={{ background: "var(--bg)", padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
            Module Progress
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {modules.map((mod, idx) => {
              const sm       = STATUS_META[mod.status] || STATUS_META.not_started;
              const isActing = acting === mod.module_id;

              return (
                <div key={mod.module_id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "9px 12px", borderRadius: "var(--radius-sm)",
                  background: sm.bg,
                  border: `1px solid ${mod.status !== "not_started" ? sm.color + "33" : "var(--border)"}`,
                }}>
                  {/* Step circle */}
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: mod.status === "completed" ? "var(--success)"
                               : mod.status === "ongoing"   ? "var(--warn)"
                               : mod.status === "skipped"   ? "var(--accent2)"
                               : "var(--surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: mod.status === "completed" ? 12 : 10, fontWeight: 700,
                    color: mod.status === "not_started" ? "var(--text3)" : "#fff",
                  }}>
                    {mod.status === "completed" ? "✓" : mod.status === "skipped" ? "⏭" : idx + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                      {mod.module_name}
                    </span>
                    {mod.notes && (
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2, fontStyle: "italic" }}>
                        📝 {mod.notes}
                      </div>
                    )}
                  </div>

                  {/* Status badge + admin actions */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, gap: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                      background: sm.color + "22", color: sm.color, textTransform: "uppercase",
                    }}>{mod.status.replace("_", " ")}</span>

                    {mod.completed_at && (
                      <span style={{ fontSize: 10, color: "var(--success)" }}>
                        {new Date(mod.completed_at).toLocaleDateString()}
                      </span>
                    )}

                    {/* Undo — revert completed → ongoing, next goes back to not_started */}
                    {mod.status === "completed" && (
                      <button className="btn btn-ghost btn-sm" disabled={isActing}
                        onClick={() => act("↩ Module reverted to ongoing",
                          () => adminUndoProgress(cls.class_id, mod.module_id), mod)}
                        style={{ fontSize: 10, color: "var(--text3)", padding: "2px 8px" }}
                        title="Revert this completed module back to ongoing">
                        {isActing ? "…" : "↩ Undo"}
                      </button>
                    )}

                    {/* Skip — skips this module, next not_started becomes ongoing */}
                    {(mod.status === "not_started" || mod.status === "ongoing") && (
                      <button className="btn btn-ghost btn-sm" disabled={isActing}
                        onClick={() => act("⏭ Module skipped",
                          () => adminSkipProgress(cls.class_id, mod.module_id), mod)}
                        style={{ fontSize: 10, color: "var(--accent2)", padding: "2px 8px" }}
                        title="Skip this module — next module becomes ongoing">
                        {isActing ? "…" : "⏭ Skip"}
                      </button>
                    )}

                    {/* Restore — skipped → ongoing, current ongoing → not_started */}
                    {mod.status === "skipped" && (
                      <button className="btn btn-ghost btn-sm" disabled={isActing}
                        onClick={() => act("↩ Module restored to ongoing",
                          () => adminRestoreProgress(cls.class_id, mod.module_id), mod)}
                        style={{ fontSize: 10, color: "var(--warn)", padding: "2px 8px" }}
                        title="Restore — make this module ongoing so instructor can complete it">
                        {isActing ? "…" : "↩ Restore"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProgress() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filterP, setFilterP] = useState("all");
  const [filterS, setFilterS] = useState("all");

  const load = () => {
    setLoading(true);
    getProgressOverview().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const programs = [...new Set(data.map(d => d.program_name))].sort();

  const filtered = data.filter(d => {
    const s = search.toLowerCase();
    const mS = !s || d.class_name?.toLowerCase().includes(s)
                  || d.instructor_name?.toLowerCase().includes(s)
                  || d.program_name?.toLowerCase().includes(s);
    const mP = filterP === "all" || d.program_name === filterP;
    const mSt= filterS === "all" || d.class_status === filterS;
    return mS && mP && mSt;
  });

  const byInstructor = {};
  filtered.forEach(d => {
    const key = d.instructor_name;
    if (!byInstructor[key]) byInstructor[key] = [];
    byInstructor[key].push(d);
  });

  const totalClasses  = data.length;
  const activeClasses = data.filter(d => d.class_status === "active").length;
  const totalDone     = data.reduce((s, d) => s + (Number(d.completed) || 0), 0);
  const totalMods     = data.reduce((s, d) => s + (Number(d.total) || 0), 0);
  const overallPct    = totalMods > 0 ? Math.round((totalDone / totalMods) * 100) : 0;

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Progress Overview</h1>
          <p className="page-subtitle">All instructor classes — expand any class to manage module progress</p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px,1fr))", gap:12, marginBottom:24 }}>
        {[
          { label:"Total Classes",    value: totalClasses,    icon:"🏫", color:"var(--accent)"  },
          { label:"Active Classes",   value: activeClasses,   icon:"🟢", color:"var(--success)" },
          { label:"Modules Completed",value: totalDone,       icon:"✅", color:"var(--success)" },
          { label:"Overall Progress", value: overallPct + "%",icon:"📊", color:"var(--warn)"    },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign:"center", padding:16 }}>
            <div style={{ fontSize:28, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:24, fontWeight:800, color:s.color, fontFamily:"var(--font-head)" }}>{s.value}</div>
            <div style={{ fontSize:11, color:"var(--text3)", marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        <input className="input" style={{ width:220 }} placeholder="Search instructor / class / program…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" style={{ width:180 }} value={filterP} onChange={e => setFilterP(e.target.value)}>
          <option value="all">All Programs</option>
          {programs.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input" style={{ width:140 }} value={filterS} onChange={e => setFilterS(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {Object.keys(byInstructor).length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize:48 }}>📊</div>
          <p>No classes found.</p>
        </div>
      ) : (
        Object.entries(byInstructor).map(([name, classes]) => (
          <div key={name} style={{ marginBottom:32 }}>
            <div style={{
              display:"flex", alignItems:"center", gap:10,
              marginBottom:12, paddingBottom:8,
              borderBottom:"1px solid var(--border)",
            }}>
              <div style={{
                width:36, height:36, borderRadius:"50%",
                background:"rgba(108,143,255,.15)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18, flexShrink:0,
              }}>👤</div>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{name}</div>
                <div style={{ fontSize:12, color:"var(--text3)" }}>
                  {classes.length} class{classes.length > 1 ? "es" : ""}
                  {" · "}
                  {classes.reduce((s,c) => s + (Number(c.completed)||0), 0)} modules completed
                </div>
              </div>
            </div>
            {classes.map(cls => <ClassCard key={cls.class_id} cls={cls} onActionDone={load} />)}
          </div>
        ))
      )}
    </div>
  );
}
