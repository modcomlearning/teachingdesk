import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getClass, updateProgress } from "../services/api";
import { useToast } from "../components/Toast";

const STATUS_META = {
  not_started: { icon: "⬜", label: "Not started", color: "var(--text3)", bg: "var(--bg3)"              },
  ongoing:     { icon: "🔄", label: "Ongoing",     color: "var(--warn)",  bg: "rgba(251,191,36,.08)"    },
  completed:   { icon: "✅", label: "Completed",   color: "var(--success)",bg:"rgba(52,211,153,.06)"    },
  skipped:     { icon: "⏭", label: "Skipped",      color: "var(--accent2)",bg:"rgba(167,139,250,.06)"  },
};

function NotesModal({ module, classId, onClose, onSaved }) {
  const toast = useToast();
  const [notes,  setNotes]  = useState(module.notes || "");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    try {
      await updateProgress(classId, module.module_id, { status: module.status, notes });
      toast("Notes saved");
      onSaved(module.module_id, notes);
      onClose();
    } catch { toast("Failed to save notes", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 14 }}>📝 Notes — {module.module_name}</h3>
        <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)}
          style={{ minHeight: 120 }}
          placeholder="e.g. Skipped CSS Grid, will revisit. Class struggled with flexbox." />
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handle} disabled={saving}>
            {saving ? "Saving…" : "Save notes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClassDetail() {
  const { cid }  = useParams();
  const toast    = useToast();
  const [cls,      setCls]      = useState(null);
  const [modules,  setModules]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notesFor, setNotesFor] = useState(null);
  const [updating, setUpdating] = useState(null);

  const load = () =>
    getClass(cid)
      .then(r => { setCls(r.data.class); setModules(r.data.modules); })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [cid]);

  const [confirmMod, setConfirmMod] = useState(null); // module pending confirmation

  const handleMark = async (mod) => {
    setUpdating(mod.module_id);
    setConfirmMod(null);
    try {
      await updateProgress(Number(cid), mod.module_id, { status: "completed" });
      toast("✅ Module completed — next module is now ongoing!");
      load();
    } catch (e) {
      toast(e.response?.data?.error || "Failed to update", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleNotesSaved = (moduleId, notes) => {
    setModules(prev => prev.map(m => m.module_id === moduleId ? { ...m, notes } : m));
  };

  if (loading)  return <div className="spinner" />;
  if (!cls)     return <div className="empty-state"><p>Class not found.</p></div>;

  const completed = modules.filter(m => m.status === "completed").length;
  const total     = modules.length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      {notesFor && (
        <NotesModal module={notesFor} classId={Number(cid)}
          onClose={() => setNotesFor(null)}
          onSaved={(id, notes) => { handleNotesSaved(id, notes); setNotesFor(null); }} />
      )}

      {/* Confirm complete dialog */}
      {confirmMod && (
        <div className="modal-overlay" onClick={() => setConfirmMod(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>✅ Mark Module Complete?</h3>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>
              <strong>{confirmMod.module_name}</strong>
            </p>
            <div style={{
              padding: "10px 14px", borderRadius: "var(--radius-sm)", marginBottom: 18,
              background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.3)",
              fontSize: 13, color: "var(--warn)",
            }}>
              ⚠ This cannot be undone by you. Contact your admin if you mark a module complete by mistake.
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmMod(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleMark(confirmMod)}
                disabled={updating === confirmMod.module_id}>
                {updating === confirmMod.module_id ? "Saving…" : "Yes, Mark Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="breadcrumb">
        <Link to="/my-classes">My Classes</Link>
        <span>›</span>
        <span>{cls.name}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{cls.name}</h1>
          <p className="page-subtitle">
            📚 {cls.program_name}
            {cls.description ? ` · ${cls.description}` : ""}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-head)",
            color: pct === 100 ? "var(--success)" : "var(--accent)" }}>
            {pct}%
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>{completed}/{total} modules</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ height: 8, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: pct === 100 ? "var(--success)" : "var(--accent)",
            borderRadius: 99, transition: "width .5s ease",
          }} />
        </div>
        {pct === 100 && (
          <div style={{
            marginTop: 12, padding: "10px 16px", borderRadius: "var(--radius-sm)",
            background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.25)",
            fontSize: 13, color: "var(--success)", textAlign: "center", fontWeight: 600,
          }}>🎉 All modules completed — great work!</div>
        )}
      </div>

      {/* Module list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {modules.map((mod, idx) => {
          const sm         = STATUS_META[mod.status] || STATUS_META.not_started;
          const isUpdating = updating === mod.module_id;

          return (
            <div key={mod.module_id} style={{
              border: `1px solid ${mod.status === "ongoing" ? "rgba(251,191,36,.5)" : "var(--border)"}`,
              borderLeft: `4px solid ${sm.color}`,
              borderRadius: "var(--radius)",
              padding: "16px 18px",
              background: sm.bg,
              transition: "all .2s",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                {/* Step circle */}
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: mod.status === "completed" ? "var(--success)"
                             : mod.status === "ongoing"   ? "var(--warn)" : "var(--surface)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: mod.status === "completed" ? 16 : 12,
                  fontWeight: 700,
                  color: mod.status === "not_started" ? "var(--text3)" : "#fff",
                }}>
                  {mod.status === "completed" ? "✓" : idx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{mod.module_name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                      background: sm.color + "22", color: sm.color, textTransform: "uppercase",
                    }}>{sm.label}</span>
                  </div>

                  {mod.description && (
                    <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{mod.description}</p>
                  )}
                  {mod.completed_at && (
                    <p style={{ fontSize: 11, color: "var(--success)", marginTop: 3 }}>
                      ✓ Completed {new Date(mod.completed_at).toLocaleDateString()}
                    </p>
                  )}
                  {mod.notes && (
                    <div style={{
                      marginTop: 8, padding: "6px 10px", borderRadius: 6,
                      background: "rgba(255,255,255,.04)",
                      fontSize: 12, color: "var(--text2)", fontStyle: "italic",
                    }}>📝 {mod.notes}</div>
                  )}
                </div>

                {/* Action buttons — instructor only marks the ONGOING module complete */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setNotesFor(mod)}>
                    {mod.notes ? "✏ Notes" : "+ Notes"}
                  </button>

                  {mod.status === "ongoing" && (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={isUpdating}
                      onClick={() => setConfirmMod(mod)}
                      style={{ fontWeight: 700 }}
                    >
                      {isUpdating ? "Saving…" : "✅ Mark Complete"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
