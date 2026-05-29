import { useState, useEffect, useRef, useCallback } from "react";
import { getPrograms, getModulesByProgram, uploadMaterial } from "../services/api";
import { useToast } from "../components/Toast";

const FOLDERS = [
  { value: "lesson_plans", label: "📋 Daily Lesson Plans",   desc: "Teaching guides & session outlines" },
  { value: "notes",        label: "📂 Notes & Resources",    desc: "PDFs, ZIPs, slides, reference docs" },
  { value: "additional",   label: "📎 Additional Materials", desc: "Supplementary or extra content"     },
];

const ALLOWED = ["pdf","zip","docx","pptx","ppt","xlsx","txt","mp4","png","jpg","jpeg","gif"];

function fmt(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function getExt(name) { return name.split(".").pop().toLowerCase(); }

// status: idle | uploading | done | error
const FILE_STATUS = { idle: "⏳", uploading: "⬆️", done: "✅", error: "❌" };

export default function AdminUpload() {
  const toast   = useToast();
  const fileRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const [programs,  setPrograms]  = useState([]);
  const [modules,   setModules]   = useState([]);
  const [programId, setProgramId] = useState("");
  const [moduleId,  setModuleId]  = useState("");
  const [folder,    setFolder]    = useState("notes");

  // Queue: array of { id, file, status, error }
  const [queue,     setQueue]     = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getPrograms().then(r => {
      setPrograms(r.data);
      if (r.data.length) setProgramId(String(r.data[0].id));
    });
  }, []);

  useEffect(() => {
    if (!programId) return;
    getModulesByProgram(programId).then(r => {
      setModules(r.data);
      setModuleId(r.data[0] ? String(r.data[0].id) : "");
    });
  }, [programId]);

  // ── add files to queue ──────────────────────────────────────
  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList);
    const valid    = incoming.filter(f => ALLOWED.includes(getExt(f.name)));
    const invalid  = incoming.filter(f => !ALLOWED.includes(getExt(f.name)));

    if (invalid.length) {
      toast(`${invalid.length} file(s) skipped — type not allowed`, "error");
    }
    if (!valid.length) return;

    // auto-detect folder ONLY when queue is empty and user hasn't manually picked
    // We use a ref to track whether the user manually changed the folder
    setFolder(prev => {
      // if queue is currently empty treat it as a fresh selection — suggest a folder
      // but still respect if the user explicitly changed it from the default "notes"
      return prev; // NEVER override — user's manual choice always wins
    });

    setQueue(q => [
      ...q,
      ...valid.map(f => ({ id: Math.random().toString(36).slice(2), file: f, status: "idle", error: null })),
    ]);
  }, [toast]);

  const handleFileInput = e => { addFiles(e.target.files); e.target.value = ""; };

  const handleDrop = e => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFromQueue = id => setQueue(q => q.filter(x => x.id !== id));

  const clearDone = () => setQueue(q => q.filter(x => x.status !== "done"));

  // ── upload all idle files ───────────────────────────────────
  const handleUploadAll = async () => {
    if (!moduleId || !queue.length) return;
    const idle = queue.filter(x => x.status === "idle");
    if (!idle.length) return;

    setUploading(true);

    // Upload in small batches of 3 to avoid overwhelming the server
    const BATCH = 3;
    for (let i = 0; i < idle.length; i += BATCH) {
      const batch = idle.slice(i, i + BATCH);

      // Mark batch as uploading
      setQueue(q => q.map(x =>
        batch.find(b => b.id === x.id) ? { ...x, status: "uploading" } : x
      ));

      const fd = new FormData();
      batch.forEach(item => fd.append("files", item.file));
      fd.append("module_id", moduleId);
      fd.append("folder",    folder);

      try {
        const res = await uploadMaterial(fd);
        const uploaded = res.data.uploaded.map(u => u.file);
        const errored  = res.data.errors  || [];

        setQueue(q => q.map(x => {
          const inBatch = batch.find(b => b.id === x.id);
          if (!inBatch) return x;
          const failed = errored.find(e => e.file === inBatch.file.name);
          return failed
            ? { ...x, status: "error", error: failed.error }
            : { ...x, status: "done" };
        }));
      } catch (e) {
        // Mark entire batch as error
        setQueue(q => q.map(x =>
          batch.find(b => b.id === x.id)
            ? { ...x, status: "error", error: e.response?.data?.error || "Upload failed" }
            : x
        ));
      }
    }

    setUploading(false);
    const doneCount = queue.filter(x => x.status === "idle").length;
    toast(`Upload complete!`);
  };

  const idleCount    = queue.filter(x => x.status === "idle").length;
  const doneCount    = queue.filter(x => x.status === "done").length;
  const errorCount   = queue.filter(x => x.status === "error").length;
  const activeCount  = queue.filter(x => x.status === "uploading").length;

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Materials</h1>
          <p className="page-subtitle">Select many files at once — they all upload together</p>
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Program + Module row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Program *</label>
            <select className="input" value={programId} onChange={e => setProgramId(e.target.value)}>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Module *</label>
            <select className="input" value={moduleId} onChange={e => setModuleId(e.target.value)}>
              {modules.length === 0 && <option value="">No modules yet</option>}
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        {/* Folder picker */}
        <div className="form-group">
          <label className="form-label">Upload into folder *</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {FOLDERS.map(f => (
              <button key={f.value} onClick={() => setFolder(f.value)} style={{
                padding: "12px 10px", borderRadius: "var(--radius-sm)", textAlign: "center",
                border: `2px solid ${folder === f.value ? "var(--accent)" : "var(--border2)"}`,
                background: folder === f.value ? "rgba(108,143,255,.1)" : "var(--bg3)",
                cursor: "pointer", transition: "all .15s",
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{f.label.split(" ")[0]}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: folder === f.value ? "var(--accent)" : "var(--text2)" }}>
                  {f.label.slice(3)}
                </div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? "var(--accent)" : queue.length ? "var(--success)" : "var(--border2)"}`,
            borderRadius: "var(--radius)", padding: "36px 20px",
            textAlign: "center", cursor: "pointer",
            background: isDragging ? "rgba(108,143,255,.08)" : queue.length ? "rgba(52,211,153,.04)" : "var(--bg3)",
            transition: "all .2s",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 10 }}>
            {isDragging ? "🎯" : queue.length ? "📦" : "📂"}
          </div>
          {isDragging ? (
            <p style={{ fontWeight: 600, color: "var(--accent)" }}>Drop files here!</p>
          ) : queue.length ? (
            <>
              <p style={{ fontWeight: 600, color: "var(--success)" }}>
                {queue.length} file{queue.length > 1 ? "s" : ""} queued
              </p>
              <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>
                Drop more files to add them, or click to browse
              </p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>
                Drop multiple files here or click to browse
              </p>
              <p style={{ fontSize: 13, color: "var(--text3)" }}>
                PDF, ZIP, DOCX, PPTX, XLSX, MP4, images — max 50 MB each
              </p>
              <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 6, fontWeight: 500 }}>
                ✨ You can select many files at once with Ctrl+Click / Cmd+Click
              </p>
            </>
          )}
          <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={handleFileInput} />
        </div>

        {/* File queue list */}
        {queue.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Queue header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>
                Queue — {idleCount} pending
                {activeCount > 0 && ` · ${activeCount} uploading`}
                {doneCount > 0 && ` · ${doneCount} done`}
                {errorCount > 0 && ` · ${errorCount} failed`}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {doneCount > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={clearDone}>
                    Clear done
                  </button>
                )}
                <button className="btn btn-ghost btn-sm"
                  onClick={() => setQueue([])} disabled={uploading}>
                  Clear all
                </button>
              </div>
            </div>

            {/* Individual file rows */}
            <div style={{
              border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
              overflow: "hidden", maxHeight: 320, overflowY: "auto",
            }}>
              {queue.map((item, idx) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px",
                  background: idx % 2 === 0 ? "var(--bg2)" : "var(--bg3)",
                  borderBottom: idx < queue.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  {/* Status icon */}
                  <span style={{ fontSize: 18, flexShrink: 0 }}>
                    {item.status === "uploading"
                      ? <span style={{ display: "inline-block", animation: "spin .7s linear infinite" }}>⬆️</span>
                      : FILE_STATUS[item.status]}
                  </span>

                  {/* File info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 500,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      color: item.status === "done"  ? "var(--success)"
                           : item.status === "error" ? "var(--danger)"
                           : "var(--text)",
                    }}>
                      {item.file.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                      {fmt(item.file.size)}
                      {item.error && <span style={{ color: "var(--danger)", marginLeft: 8 }}>· {item.error}</span>}
                      {item.status === "done" && <span style={{ color: "var(--success)", marginLeft: 8 }}>· Uploaded</span>}
                    </div>
                  </div>

                  {/* Progress bar for uploading */}
                  {item.status === "uploading" && (
                    <div style={{ width: 80, height: 4, background: "var(--border)", borderRadius: 2, flexShrink: 0 }}>
                      <div style={{ height: "100%", width: "70%", background: "var(--accent)", borderRadius: 2,
                        animation: "shimmer 1s ease infinite" }} />
                    </div>
                  )}

                  {/* Remove button (only when idle or error) */}
                  {(item.status === "idle" || item.status === "error") && (
                    <button onClick={() => removeFromQueue(item.id)}
                      style={{
                        background: "none", border: "none", color: "var(--text3)",
                        cursor: "pointer", fontSize: 16, padding: "2px 6px", flexShrink: 0,
                      }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Folder confirmation banner */}
        {idleCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px",
            background: folder === "lesson_plans" ? "rgba(52,211,153,.08)"
                      : folder === "additional"   ? "rgba(167,139,250,.08)"
                      :                             "rgba(108,143,255,.08)",
            border: `1px solid ${
              folder === "lesson_plans" ? "rgba(52,211,153,.35)"
            : folder === "additional"   ? "rgba(167,139,250,.35)"
            :                             "rgba(108,143,255,.35)"}`,
            borderRadius: "var(--radius-sm)",
          }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>
              {FOLDERS.find(f => f.value === folder)?.label.split(" ")[0]}
            </span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, color: "var(--text2)" }}>Files will be saved to: </span>
              <strong style={{ fontSize: 13, color: "var(--text)" }}>
                {FOLDERS.find(f => f.value === folder)?.label.slice(3)}
              </strong>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                Wrong folder? Change your selection above before uploading.
              </div>
            </div>
          </div>
        )}

        {/* Upload button */}
        <button
          className="btn btn-primary"
          onClick={handleUploadAll}
          disabled={!idleCount || !moduleId || uploading}
          style={{ justifyContent: "center", fontSize: 15, padding: "13px" }}
        >
          {uploading
            ? `⬆ Uploading ${activeCount} file${activeCount !== 1 ? "s" : ""}…`
            : idleCount
              ? `⬆ Upload ${idleCount} → ${FOLDERS.find(f => f.value === folder)?.label.slice(3)}`
              : doneCount === queue.length && queue.length > 0
                ? "✅ All files uploaded!"
                : "⬆ Upload files"}
        </button>

        {/* Summary after done */}
        {!uploading && doneCount > 0 && (
          <div style={{
            background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.25)",
            borderRadius: "var(--radius-sm)", padding: "12px 16px",
            fontSize: 13, color: "var(--success)",
          }}>
            ✅ {doneCount} file{doneCount !== 1 ? "s" : ""} uploaded successfully to <strong>{FOLDERS.find(f => f.value === folder)?.label}</strong>.
            {errorCount > 0 && <span style={{ color: "var(--danger)", marginLeft: 8 }}>
              ⚠ {errorCount} failed — check file types.
            </span>}
          </div>
        )}
      </div>

      {/* Style for spin */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
