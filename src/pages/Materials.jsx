import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getModule, getMaterialsByModule, deleteMaterial, downloadUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { useOpenedFiles } from "../hooks/useOpenedFiles";
import NotFound from "./NotFound";

const NEW_DAYS = 7;

function isRecent(dateStr) {
  if (!dateStr) return false;
  return (Date.now() - new Date(dateStr).getTime()) / 86400000 <= NEW_DAYS;
}

function fmt(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

const EXT_ICON = {
  pdf:"📄", zip:"🗜️", docx:"📝", pptx:"📊", ppt:"📊",
  xlsx:"📊", mp4:"🎬", png:"🖼️", jpg:"🖼️", txt:"📃",
};
function fileIcon(name) {
  const ext = (name || "").split(".").pop().toLowerCase();
  return EXT_ICON[ext] || "📁";
}

/* ── single file row ─────────────────────────────── */
function FileRow({ mat, isAdmin, onDelete, deleting, isNew, onOpen }) {
  const token = localStorage.getItem("token");

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 16px", borderRadius: 8,
      background: isNew ? "rgba(108,143,255,.05)" : "transparent",
      borderLeft: `3px solid ${isNew ? "var(--accent)" : "transparent"}`,
      transition: "background .2s",
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{fileIcon(mat.original_name)}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{mat.title}</span>
          {isNew && (
            <span style={{
              background: "var(--accent)", color: "#fff",
              fontSize: 9, fontWeight: 800, padding: "2px 7px",
              borderRadius: 99, letterSpacing: ".06em", textTransform: "uppercase",
              animation: "newPulse 2s ease infinite",
            }}>NEW</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
          {mat.original_name}
          {mat.file_size ? <span> · {fmt(mat.file_size)}</span> : null}
          {mat.uploader_name ? <span> · by {mat.uploader_name}</span> : null}
          <span> · {new Date(mat.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <a
          href={`${downloadUrl(mat.id)}?token=${token}`}
          target="_blank" rel="noreferrer"
          className="btn btn-ghost btn-sm"
          onClick={() => onOpen(mat.id)}   /* mark as opened on click */
        >
          {mat.file_type === "pdf" ? "👁 View" : "⬇ Download"}
        </a>
        {isAdmin && (
          <button className="btn btn-danger btn-sm"
            disabled={deleting === mat.id}
            onClick={() => onDelete(mat.id, mat.title)}>
            {deleting === mat.id ? "…" : "✕"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── collapsible folder ──────────────────────────── */
function Folder({ title, subtitle, icon, accentColor, items, isAdmin,
                  onDelete, deleting, defaultOpen, newIds, onOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const newCount = items.filter(m => newIds.has(m.id)).length;

  return (
    <div style={{
      border: "1px solid var(--border)", borderRadius: "var(--radius)",
      overflow: "hidden", marginBottom: 16,
      boxShadow: newCount > 0 ? `0 0 0 1px ${accentColor}33` : "none",
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        padding: "16px 20px",
        background: open ? "var(--bg2)" : "var(--bg3)",
        border: "none",
        borderBottom: open ? "1px solid var(--border)" : "none",
        cursor: "pointer", transition: "background .2s",
      }}>
        <div style={{ width: 4, height: 44, borderRadius: 2, background: accentColor, flexShrink: 0 }} />
        <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{title}</span>
            {newCount > 0 && (
              <span style={{
                background: accentColor, color: "#fff",
                fontSize: 10, fontWeight: 800, padding: "2px 9px",
                borderRadius: 99, animation: "newPulse 2s ease infinite",
              }}>✨ {newCount} NEW</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{subtitle}</div>
        </div>
        <span style={{
          background: accentColor + "22", color: accentColor,
          borderRadius: 99, padding: "4px 13px", fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {items.length} {items.length === 1 ? "file" : "files"}
        </span>
        <span style={{
          color: "var(--text3)", fontSize: 11, flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0)",
          transition: "transform .25s",
        }}>▼</span>
      </button>

      {open && (
        <div style={{ background: "var(--bg)", padding: "8px 10px 12px" }}>
          {items.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
              <span style={{ fontSize: 32, display: "block", marginBottom: 8, opacity: .4 }}>{icon}</span>
              No files in this folder yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {items.map(mat => (
                <FileRow key={mat.id} mat={mat}
                  isAdmin={isAdmin} onDelete={onDelete} deleting={deleting}
                  isNew={newIds.has(mat.id)}
                  onOpen={onOpen}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── main page ───────────────────────────────────── */
export default function Materials() {
  const { mid }     = useParams();
  const { isAdmin, user } = useAuth();
  const toast       = useToast();
  const navigate    = useNavigate();
  const { markOpened, isOpened } = useOpenedFiles(user?.id);

  const [mod,       setMod]       = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [deleting,  setDeleting]  = useState(null);

  const load = () =>
    Promise.all([getModule(mid), getMaterialsByModule(mid)])
      .then(([m, mat]) => { setMod(m.data); setMaterials(mat.data); })
      .catch(err => { if (err.response?.status === 404) setNotFound(true); })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [mid]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setDeleting(id);
    try {
      await deleteMaterial(id);
      toast("File deleted");
      setMaterials(m => m.filter(x => x.id !== id));
    } catch { toast("Delete failed", "error"); }
    finally { setDeleting(null); }
  };

  // markOpened updates React state inside the hook → badge disappears immediately
  const handleOpen = useCallback((matId) => {
    markOpened(matId);
  }, [markOpened]);

  if (loading)  return <div className="spinner" />;
  if (notFound) return <NotFound icon="📦" message={`Module #${mid} does not exist.`} back="/programs" />;

  // A file is "new" only if it's recent AND not yet opened by this user
  const newIds = new Set(
    materials
      .filter(m => isRecent(m.created_at) && !isOpened(m.id))
      .map(m => m.id)
  );

  const lessonPlans = materials.filter(m => m.folder === "lesson_plans");
  const notes       = materials.filter(m => m.folder === "notes" || !m.folder);
  const additional  = materials.filter(m => m.folder === "additional");
  const totalNew    = newIds.size;

  return (
    <div>
      <style>{`@keyframes newPulse{0%,100%{opacity:1}50%{opacity:.6}}`}</style>

      <div className="breadcrumb">
        <Link to="/programs">Programs</Link>
        <span>›</span>
        <Link to={`/programs/${mod?.program_id}`}>Program</Link>
        <span>›</span>
        <span>{mod?.name}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{mod?.name}</h1>
          <p className="page-subtitle">{mod?.description || "Browse materials organised by folder."}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {totalNew > 0 && (
            <span style={{
              background: "rgba(108,143,255,.15)", color: "var(--accent)",
              borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 700,
              animation: "newPulse 2s ease infinite",
            }}>✨ {totalNew} new upload{totalNew > 1 ? "s" : ""}</span>
          )}
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => navigate("/admin/upload")}>
              + Upload file
            </button>
          )}
        </div>
      </div>

      <Folder title="Daily Lesson Plans"
        subtitle="Session guides, teaching outlines and structured lesson materials"
        icon="📋" accentColor="var(--success)"
        items={lessonPlans} isAdmin={isAdmin}
        onDelete={handleDelete} deleting={deleting}
        defaultOpen={true} newIds={newIds} onOpen={handleOpen}
      />
      <Folder title="Notes & Resources"
        subtitle="PDF notes, ZIP bundles, slides and reference documents"
        icon="📂" accentColor="var(--accent)"
        items={notes} isAdmin={isAdmin}
        onDelete={handleDelete} deleting={deleting}
        defaultOpen={true} newIds={newIds} onOpen={handleOpen}
      />
      <Folder title="Additional Materials"
        subtitle="Supplementary content, extra reading and approved community submissions"
        icon="📎" accentColor="var(--accent2)"
        items={additional} isAdmin={isAdmin}
        onDelete={handleDelete} deleting={deleting}
        defaultOpen={false} newIds={newIds} onOpen={handleOpen}
      />
    </div>
  );
}
