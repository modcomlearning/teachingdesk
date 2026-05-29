import { useState, useEffect } from "react";
import {
  getAllSubmissions, reviewSubmission, deleteSubmission, submissionDownloadUrl,
  getPrograms, getModulesByProgram,
} from "../services/api";
import { useToast } from "../components/Toast";

const STATUS_META = {
  pending:  { icon: "⏳", color: "var(--warn)",    label: "Pending"  },
  approved: { icon: "✅", color: "var(--success)", label: "Approved" },
  rejected: { icon: "❌", color: "var(--danger)",  label: "Rejected" },
};

const FOLDERS = [
  { value: "lesson_plans", label: "📋 Daily Lesson Plans"   },
  { value: "notes",        label: "📂 Notes & Resources"    },
  { value: "additional",   label: "📎 Additional Materials" },
];

function fmt(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

// ── Review modal with full approve / reject workflow ──────────
function ReviewModal({ sub, onClose, onDone }) {
  const toast = useToast();

  const [decision,      setDecision]      = useState("approved");
  const [note,          setNote]          = useState("");
  const [programs,      setPrograms]      = useState([]);
  const [modules,       setModules]       = useState([]);
  const [selProgram,    setSelProgram]    = useState("");
  const [selModule,     setSelModule]     = useState("");
  const [folder,        setFolder]        = useState(sub.suggested_folder || "additional");
  const [titleOverride, setTitleOverride] = useState(sub.title || "");
  const [saving,        setSaving]        = useState(false);
  const [loadingModules,setLoadingModules]= useState(false);

  // Load programs on mount
  useEffect(() => {
    getPrograms().then((r) => {
      setPrograms(r.data);
      // pre-select the program the instructor suggested
      if (sub.suggested_module_id && r.data.length) {
        // find program via suggested module — we'll rely on selProgram useEffect to load modules
        // For now default to first program; modules useEffect will handle pre-selection
        if (r.data.length) setSelProgram(String(r.data[0].id));
      } else if (r.data.length) {
        setSelProgram(String(r.data[0].id));
      }
    });
  }, []);

  // Load modules when program changes
  useEffect(() => {
    if (!selProgram) return;
    setLoadingModules(true);
    getModulesByProgram(selProgram)
      .then((r) => {
        setModules(r.data);
        if (r.data.length) setSelModule(String(r.data[0].id));
        else setSelModule("");
      })
      .finally(() => setLoadingModules(false));
  }, [selProgram]);

  const handle = async () => {
    if (decision === "approved" && !selModule) {
      toast("Please select a target module", "error"); return;
    }
    setSaving(true);
    try {
      await reviewSubmission(sub.id, {
        status:     decision,
        admin_note: note,
        ...(decision === "approved" && {
          module_id: Number(selModule),
          folder:    folder,
          title:     titleOverride || sub.title,
        }),
      });
      toast(decision === "approved"
        ? "✅ Approved and added to module!"
        : "❌ Submission rejected");
      onDone();
    } catch (e) {
      toast(e.response?.data?.error || "Failed", "error");
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Wide 2-col modal, scrollable body */}
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border2)",
        borderRadius: "var(--radius)", width: "100%", maxWidth: 720,
        boxShadow: "var(--shadow)", display: "flex", flexDirection: "column",
        maxHeight: "90vh",
      }} onClick={e => e.stopPropagation()}>

        {/* Fixed header */}
        <div style={{ padding: "22px 28px 16px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 20, marginBottom: 10 }}>Review Submission</h3>

          {/* Submission info */}
          <div style={{
            background: "var(--bg3)", borderRadius: "var(--radius-sm)",
            padding: "10px 14px", fontSize: 13,
          }}>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>{sub.title}</div>
            <div style={{ color: "var(--text3)", marginTop: 3 }}>
              📎 {sub.original_name} · {fmt(sub.file_size)} · by <strong style={{ color: "var(--text2)" }}>{sub.submitter_name}</strong>
            </div>
            {sub.description && (
              <div style={{ color: "var(--text2)", marginTop: 6, fontStyle: "italic" }}>"{sub.description}"</div>
            )}
            {(sub.suggested_module_name || sub.suggested_folder) && (
              <div style={{
                marginTop: 8, padding: "6px 10px", borderRadius: 6,
                background: "rgba(108,143,255,.1)", fontSize: 12, color: "var(--accent)",
              }}>
                💡 Instructor suggested: <strong>{sub.suggested_program_name || ""}{sub.suggested_module_name ? ` → ${sub.suggested_module_name}` : ""}</strong>
                {sub.suggested_folder && <span> · {FOLDERS.find(f => f.value === sub.suggested_folder)?.label || sub.suggested_folder}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "20px 28px", overflowY: "auto", flex: 1 }}>

          {/* Decision buttons */}
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label">Decision *</label>
            <div style={{ display: "flex", gap: 10 }}>
              {["approved", "rejected"].map(d => (
                <button key={d} onClick={() => setDecision(d)}
                  className={"btn btn-sm " + (decision === d ? "btn-primary" : "btn-ghost")}
                  style={{ flex: 1, justifyContent: "center" }}>
                  {d === "approved" ? "✅ Approve & publish" : "❌ Reject"}
                </button>
              ))}
            </div>
          </div>

          {decision === "approved" && (
            <>
              <div style={{
                background: "rgba(52,211,153,.06)", border: "1px solid rgba(52,211,153,.2)",
                borderRadius: "var(--radius-sm)", padding: "9px 13px",
                fontSize: 12, color: "var(--text2)", marginBottom: 18,
              }}>
                📌 File will be <strong>copied into the chosen module</strong> and visible to all instructors immediately.
              </div>

              {/* ── 2-column layout for approve fields ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                {/* LEFT col: title + folder */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Material title</label>
                    <input className="input" value={titleOverride}
                      onChange={e => setTitleOverride(e.target.value)}
                      placeholder="Leave blank to keep original" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Place in folder *</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {FOLDERS.map(f => (
                        <button key={f.value} onClick={() => setFolder(f.value)} style={{
                          display: "flex", alignItems: "center", gap: 9,
                          padding: "9px 12px", borderRadius: "var(--radius-sm)", textAlign: "left",
                          border: `2px solid ${folder === f.value ? "var(--accent)" : "var(--border2)"}`,
                          background: folder === f.value ? "rgba(108,143,255,.1)" : "var(--bg3)",
                          cursor: "pointer", transition: "all .15s",
                        }}>
                          <span style={{ fontSize: 18 }}>{f.label.split(" ")[0]}</span>
                          <span style={{ fontSize: 12, fontWeight: 600,
                            color: folder === f.value ? "var(--accent)" : "var(--text2)" }}>
                            {f.label.slice(3)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT col: program + module */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Program *</label>
                    <select className="input" value={selProgram}
                      onChange={e => setSelProgram(e.target.value)}>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Module *</label>
                    <select className="input" value={selModule}
                      onChange={e => setSelModule(e.target.value)}
                      disabled={loadingModules || modules.length === 0}>
                      {loadingModules && <option>Loading…</option>}
                      {!loadingModules && modules.length === 0 && <option value="">No modules</option>}
                      {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Note to instructor */}
          <div className="form-group" style={{ marginTop: 18 }}>
            <label className="form-label">
              Note to instructor {decision === "approved" ? "(optional)" : "(explain why)"}
            </label>
            <textarea className="input" value={note} onChange={e => setNote(e.target.value)}
              placeholder={decision === "approved"
                ? "e.g. Great find! Added to the HTML module under Notes."
                : "e.g. This topic is already covered in module 2."} />
          </div>
        </div>

        {/* Fixed footer */}
        <div style={{
          padding: "16px 28px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 10, justifyContent: "flex-end",
        }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handle}
            disabled={saving || (decision === "approved" && !selModule)}>
            {saving ? "Saving…" : decision === "approved" ? "✅ Approve & publish" : "❌ Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("pending");
  const [reviewing, setReviewing]     = useState(null);
  const toast = useToast();

  const load = () =>
    getAllSubmissions().then((r) => setSubmissions(r.data)).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this submission and its file permanently?")) return;
    try {
      await deleteSubmission(id);
      toast("Deleted");
      setSubmissions((s) => s.filter((x) => x.id !== id));
    } catch { toast("Failed", "error"); }
  };

  const filtered = submissions.filter((s) => filter === "all" || s.status === filter);
  const counts   = {
    pending:  submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
    all:      submissions.length,
  };

  return (
    <div>
      {reviewing && (
        <ReviewModal
          sub={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => { setReviewing(null); load(); }}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Instructor Submissions</h1>
          <p className="page-subtitle">
            Review resources shared by instructors. Approve to publish directly into a module.
          </p>
        </div>
        {counts.pending > 0 && (
          <span style={{
            background: "rgba(251,191,36,.15)", color: "var(--warn)",
            borderRadius: 99, padding: "6px 14px", fontSize: 13, fontWeight: 700,
          }}>
            ⏳ {counts.pending} awaiting review
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { key: "pending",  label: "Pending"  },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
          { key: "all",      label: "All"      },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={"btn btn-sm " + (filter === key ? "btn-primary" : "btn-ghost")}
            onClick={() => setFilter(key)}
          >
            {STATUS_META[key]?.icon || "📋"} {label} ({counts[key] ?? submissions.length})
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>📬</div>
          <p>No {filter === "all" ? "" : filter} submissions.</p>
        </div>
      ) : (
        <div className="grid-list">
          {filtered.map((sub) => {
            const sm    = STATUS_META[sub.status] || STATUS_META.pending;
            const token = localStorage.getItem("token");
            return (
              <div key={sub.id} style={{
                background: "var(--bg2)",
                border: `1px solid var(--border)`,
                borderLeft: `4px solid ${sm.color}`,
                borderRadius: "var(--radius)",
                padding: "16px 18px",
                display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <div style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>{sm.icon}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{sub.title}</h4>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>
                    📎 {sub.original_name} · {fmt(sub.file_size)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                    👤 <strong style={{ color: "var(--text2)" }}>{sub.submitter_name}</strong> ({sub.submitter_email})
                  </div>
                  {sub.description && (
                    <div style={{
                      fontSize: 13, color: "var(--text2)", marginTop: 8,
                      background: "var(--bg3)", borderRadius: "var(--radius-sm)",
                      padding: "8px 12px", fontStyle: "italic",
                    }}>
                      "{sub.description}"
                    </div>
                  )}
                  {sub.admin_note && (
                    <div style={{ fontSize: 12, color: sm.color, marginTop: 8, fontWeight: 500 }}>
                      💬 Admin note: {sub.admin_note}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>
                    Submitted {new Date(sub.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <a
                    href={`${submissionDownloadUrl(sub.id)}?token=${token}`}
                    target="_blank" rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                  >⬇ Download</a>

                  {sub.status === "pending" && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setReviewing(sub)}
                    >
                      Review →
                    </button>
                  )}

                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(sub.id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
