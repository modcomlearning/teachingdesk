import { useState, useEffect, useRef } from "react";
import {
  submitMaterial, getMySubmissions, deleteSubmission,
  getPrograms, getModulesByProgram,
} from "../services/api";
import { useToast } from "../components/Toast";

const STATUS_META = {
  pending:  { icon: "⏳", color: "var(--warn)",    label: "Pending review" },
  approved: { icon: "✅", color: "var(--success)", label: "Approved"       },
  rejected: { icon: "❌", color: "var(--danger)",  label: "Rejected"       },
};

const FOLDERS = [
  { value: "lesson_plans", label: "📋 Daily Lesson Plans"   },
  { value: "notes",        label: "📂 Notes & Resources"    },
  { value: "additional",   label: "📎 Additional Materials" },
];

function fmt(b) {
  if (!b) return "";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / 1024 / 1024).toFixed(1) + " MB";
}

export default function InstructorSubmit() {
  const toast   = useToast();
  const fileRef = useRef(null);

  const [programs,    setPrograms]    = useState([]);
  const [modules,     setModules]     = useState([]);
  const [selProgram,  setSelProgram]  = useState("");
  const [selModule,   setSelModule]   = useState("");
  const [folder,      setFolder]      = useState("notes");
  const [form,        setForm]        = useState({ title: "", description: "" });
  const [file,        setFile]        = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [loadingMods, setLoadingMods] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  // Load ALL programs — no restriction
  useEffect(() => {
    getPrograms().then(r => {
      setPrograms(r.data);
      if (r.data.length) setSelProgram(String(r.data[0].id));
    });
    loadSubs();
  }, []);

  // Load modules when program changes
  useEffect(() => {
    if (!selProgram) return;
    setLoadingMods(true);
    getModulesByProgram(selProgram)
      .then(r => {
        setModules(r.data);
        setSelModule(r.data.length ? String(r.data[0].id) : "");
      })
      .finally(() => setLoadingMods(false));
  }, [selProgram]);

  const loadSubs = () =>
    getMySubmissions().then(r => setSubmissions(r.data)).finally(() => setLoadingSubs(false));

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (!form.title) setForm(p => ({ ...p, title: f.name.replace(/\.[^.]+$/, "") }));
  };

  const handleDrop = e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!form.title) setForm(p => ({ ...p, title: f.name.replace(/\.[^.]+$/, "") })); }
  };

  const handleSubmit = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file",        file);
    fd.append("title",       form.title || file.name);
    fd.append("description", form.description);
    fd.append("folder",      folder);
    if (selModule) fd.append("module_id", selModule);
    setUploading(true);
    try {
      await submitMaterial(fd);
      toast("Submitted! Admin will review and publish it.");
      setFile(null);
      setForm({ title: "", description: "" });
      if (fileRef.current) fileRef.current.value = "";
      loadSubs();
    } catch (e) {
      toast(e.response?.data?.error || "Submission failed", "error");
    } finally { setUploading(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm("Withdraw this submission?")) return;
    try { await deleteSubmission(id); toast("Withdrawn"); loadSubs(); }
    catch { toast("Failed", "error"); }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Share a Resource</h1>
          <p className="page-subtitle">
            Upload a file and suggest where it should go — admin will review and publish it.
          </p>
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>

        {/* Program + Module — 2 columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Program</label>
            <select className="input" value={selProgram} onChange={e => setSelProgram(e.target.value)}>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Module</label>
            <select className="input" value={selModule} onChange={e => setSelModule(e.target.value)}
              disabled={loadingMods || modules.length === 0}>
              {loadingMods && <option>Loading…</option>}
              {!loadingMods && modules.length === 0 && <option value="">No modules</option>}
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        {/* Folder suggestion */}
        <div className="form-group">
          <label className="form-label">Suggested folder</label>
          <div style={{ display: "flex", gap: 8 }}>
            {FOLDERS.map(f => (
              <button key={f.value} onClick={() => setFolder(f.value)} style={{
                flex: 1, padding: "9px 6px", borderRadius: "var(--radius-sm)",
                textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 600,
                border: `2px solid ${folder === f.value ? "var(--accent)" : "var(--border2)"}`,
                background: folder === f.value ? "rgba(108,143,255,.1)" : "var(--bg3)",
                color: folder === f.value ? "var(--accent)" : "var(--text2)",
                transition: "all .15s",
              }}>
                <div style={{ fontSize: 18, marginBottom: 3 }}>{f.label.split(" ")[0]}</div>
                {f.label.slice(3)}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
            💡 Admin makes the final decision on placement.
          </p>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="input" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="What is this resource?" />
        </div>

        {/* Note to admin */}
        <div className="form-group">
          <label className="form-label">Note to admin (optional)</label>
          <textarea className="input" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Why is this useful? Any context for the admin?" />
        </div>

        {/* Drop zone */}
        <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${file ? "var(--success)" : "var(--border2)"}`,
            borderRadius: "var(--radius)", padding: "28px 16px",
            textAlign: "center", cursor: "pointer",
            background: file ? "rgba(52,211,153,.05)" : "var(--bg3)", transition: "all .2s",
          }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>{file ? "✅" : "📤"}</div>
          {file
            ? <p style={{ color: "var(--success)", fontWeight: 500 }}>{file.name} · {fmt(file.size)}</p>
            : <>
                <p style={{ fontWeight: 500, marginBottom: 3 }}>Drag & drop or click to select</p>
                <p style={{ fontSize: 12, color: "var(--text3)" }}>PDF, DOCX, PPTX, ZIP, and more — max 50 MB</p>
              </>
          }
          <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleFile} />
        </div>

        <button className="btn btn-primary" onClick={handleSubmit}
          disabled={!file || uploading} style={{ justifyContent: "center" }}>
          {uploading ? "Submitting…" : "📤 Submit for admin review"}
        </button>
      </div>

      {/* Submission history */}
      <h2 style={{ fontFamily: "var(--font-head)", fontSize: 20, marginBottom: 16 }}>My Submissions</h2>
      {loadingSubs ? <div className="spinner" /> :
       submissions.length === 0 ? (
        <div className="empty-state"><p>No submissions yet.</p></div>
      ) : (
        <div className="grid-list">
          {submissions.map(sub => {
            const sm = STATUS_META[sub.status] || STATUS_META.pending;
            return (
              <div key={sub.id} className="card" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ fontSize: 26, flexShrink: 0 }}>{sm.icon}</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600 }}>{sub.title}</h4>
                  <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                    {sub.original_name} · {fmt(sub.file_size)}
                  </p>
                  {sub.description && (
                    <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>{sub.description}</p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: sm.color }}>{sm.label}</span>
                    {sub.admin_note && (
                      <span style={{ fontSize: 12, color: "var(--text2)" }}>— {sub.admin_note}</span>
                    )}
                  </div>
                </div>
                {sub.status === "pending" && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(sub.id)}>Withdraw</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
