import { useState, useEffect, useRef } from "react";
import {
  getExtraResources, uploadExtraResource, deleteExtraResource, extraDownloadUrl,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const NEW_DAYS = 5;
function isNew(d) { return d && (Date.now() - new Date(d).getTime()) / 86400000 <= NEW_DAYS; }
function fmt(b) {
  if (!b) return "";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / 1024 / 1024).toFixed(1) + " MB";
}

const TYPE_META = {
  pdf:    { icon: "📄", label: "PDF",         color: "var(--accent)"  },
  slides: { icon: "📊", label: "Slides",      color: "var(--warn)"    },
  zip:    { icon: "🗜️", label: "ZIP",         color: "var(--success)" },
  video:  { icon: "🎬", label: "Video",       color: "#f472b6"        },
  other:  { icon: "📁", label: "File",        color: "var(--text3)"   },
};

/* ── file card ─────────────────────────────────── */
function ResourceCard({ res, isAdmin, onDelete }) {
  const token = localStorage.getItem("token");
  const meta  = TYPE_META[res.file_type] || TYPE_META.other;
  const fresh = isNew(res.created_at);

  return (
    <div className="card" style={{
      display: "flex", flexDirection: "column", gap: 10,
      borderLeft: `4px solid ${meta.color}`,
      position: "relative",
      transition: "border-color .2s, box-shadow .2s",
    }}>
      {fresh && (
        <span style={{
          position: "absolute", top: 12, right: 12,
          background: "var(--accent)", color: "#fff",
          fontSize: 9, fontWeight: 800, padding: "2px 8px",
          borderRadius: 99, letterSpacing: ".06em",
          animation: "newPulse 2s ease infinite",
        }}>✨ NEW</span>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 32, flexShrink: 0 }}>{meta.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{res.title}</div>
          {res.description && (
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{res.description}</div>
          )}
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>
            <span className={`badge`} style={{ background: meta.color + "22", color: meta.color }}>
              {meta.label}
            </span>
            {res.file_size ? <span style={{ marginLeft: 8 }}>{fmt(res.file_size)}</span> : null}
            {res.uploader_name ? <span style={{ marginLeft: 8 }}>· {res.uploader_name}</span> : null}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
            {new Date(res.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
        <a href={`${extraDownloadUrl(res.id)}?token=${token}`}
           target="_blank" rel="noreferrer"
           className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }}>
          {res.file_type === "pdf" || res.file_type === "slides" ? "👁 Open" : "⬇ Download"}
        </a>
        {isAdmin && (
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(res.id, res.title)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/* ── upload panel (admin only) ─────────────────── */
function UploadPanel({ onUploaded }) {
  const toast   = useToast();
  const fileRef = useRef(null);
  const [file, setFile]         = useState(null);
  const [form, setForm]         = useState({ title: "", description: "" });
  const [uploading, setUploading] = useState(false);

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (!form.title) setForm(p => ({ ...p, title: f.name.replace(/\.[^.]+$/, "") }));
  };

  const handleDrop = e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile({ target: { files: [f] } });
  };

  const handleUpload = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file",        file);
    fd.append("title",       form.title || file.name);
    fd.append("description", form.description);
    setUploading(true);
    try {
      await uploadExtraResource(fd);
      toast("Resource uploaded!");
      setFile(null);
      setForm({ title: "", description: "" });
      if (fileRef.current) fileRef.current.value = "";
      onUploaded();
    } catch (e) {
      toast(e.response?.data?.error || "Upload failed", "error");
    } finally { setUploading(false); }
  };

  return (
    <div className="card" style={{ marginBottom: 28, borderColor: "rgba(108,143,255,.3)" }}>
      <h3 style={{ fontFamily: "var(--font-head)", fontSize: 17, marginBottom: 16 }}>
        ⬆ Upload New Resource
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="input" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Introduction to Cybersecurity Slides" />
        </div>
        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <textarea className="input" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="What is this resource about?" />
        </div>
        <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${file ? "var(--success)" : "var(--border2)"}`,
            borderRadius: "var(--radius)", padding: "28px 16px",
            textAlign: "center", cursor: "pointer",
            background: file ? "rgba(52,211,153,.05)" : "var(--bg3)",
          }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>{file ? "✅" : "📊"}</div>
          {file
            ? <p style={{ color: "var(--success)", fontWeight: 500 }}>{file.name} · {fmt(file.size)}</p>
            : <>
                <p style={{ fontWeight: 500, marginBottom: 3 }}>Drop presentation, PDF, or any file</p>
                <p style={{ fontSize: 12, color: "var(--text3)" }}>PPTX, PDF, ZIP, MP4, images — max 50 MB</p>
              </>
          }
          <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleFile} />
        </div>
        <button className="btn btn-primary" onClick={handleUpload}
          disabled={!file || uploading} style={{ justifyContent: "center" }}>
          {uploading ? "Uploading…" : "Upload resource"}
        </button>
      </div>
    </div>
  );
}

/* ── main page ─────────────────────────────────── */
export default function ExtraResources() {
  const { isAdmin } = useAuth();
  const toast       = useToast();
  const [resources, setResources] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [search,    setSearch]    = useState("");

  const load = () =>
    getExtraResources().then(r => setResources(r.data)).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await deleteExtraResource(id);
      toast("Deleted");
      setResources(r => r.filter(x => x.id !== id));
    } catch { toast("Delete failed", "error"); }
  };

  const types   = ["all", "slides", "pdf", "zip", "video", "other"];
  const newCount = resources.filter(r => isNew(r.created_at)).length;

  const filtered = resources
    .filter(r => filter === "all" || r.file_type === filter)
    .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase())
               || (r.description || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <style>{`@keyframes newPulse{0%,100%{opacity:1}50%{opacity:.6}}`}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">🌟 Extra Resources</h1>
          <p className="page-subtitle">
            Presentation slides, cross-program materials and shared resources
            not tied to a specific module
          </p>
        </div>
        {newCount > 0 && (
          <span style={{
            background: "rgba(108,143,255,.15)", color: "var(--accent)",
            borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 700,
            animation: "newPulse 2s ease infinite",
          }}>✨ {newCount} new</span>
        )}
      </div>

      {/* Admin upload panel */}
      {isAdmin && <UploadPanel onUploaded={load} />}

      {/* Filters + search */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        {types.map(t => (
          <button key={t} className={"btn btn-sm " + (filter === t ? "btn-primary" : "btn-ghost")}
            onClick={() => setFilter(t)}>
            {TYPE_META[t]?.icon || "📋"} {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <input className="input" style={{ marginLeft: "auto", width: 200 }}
          placeholder="Search…" value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 56 }}>🌟</div>
          <p>{search || filter !== "all" ? "No matching resources." : "No extra resources uploaded yet."}</p>
          {isAdmin && !search && filter === "all" && (
            <p style={{ marginTop: 8, fontSize: 13 }}>Use the upload panel above to add presentation slides or shared materials.</p>
          )}
        </div>
      ) : (
        <div className="grid-cards">
          {filtered.map(res => (
            <ResourceCard key={res.id} res={res} isAdmin={isAdmin} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
