import { useState, useEffect } from "react";
import { getPrograms, getModulesByProgram, createModule, updateModule, deleteModule } from "../services/api";
import { useToast } from "../components/Toast";

function ModuleModal({ mod, programs, onClose, onSave }) {
  const [form, setForm] = useState({
    program_id:  mod?.program_id || (programs[0]?.id ?? ""),
    name:        mod?.name || "",
    description: mod?.description || "",
    order_index: mod?.order_index ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handle = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (mod) { await updateModule(mod.id, form); toast("Module updated"); }
      else      { await createModule(form);         toast("Module created"); }
      onSave();
    } catch (e) { toast(e.response?.data?.error || "Error", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{mod ? "Edit module" : "New module"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!mod && (
            <div className="form-group">
              <label className="form-label">Program *</label>
              <select className="input" value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })}>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Module name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. HTML Fundamentals" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Order</label>
            <input className="input" type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: +e.target.value })} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handle} disabled={saving || !form.name.trim()}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminModules() {
  const [programs, setPrograms]   = useState([]);
  const [selPid, setSelPid]       = useState(null);
  const [modules, setModules]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const toast = useToast();

  useEffect(() => {
    getPrograms().then((r) => {
      setPrograms(r.data);
      if (r.data.length) setSelPid(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selPid) return;
    setLoading(true);
    getModulesByProgram(selPid).then((r) => setModules(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [selPid]);

  const handleDelete = async (mod) => {
    if (!window.confirm(`Delete "${mod.name}"?`)) return;
    try {
      await deleteModule(mod.id);
      toast("Module deleted");
      setModules((m) => m.filter((x) => x.id !== mod.id));
    } catch { toast("Delete failed", "error"); }
  };

  return (
    <div>
      {modal !== null && (
        <ModuleModal
          mod={modal === "new" ? null : modal}
          programs={programs}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); if (selPid) getModulesByProgram(selPid).then((r) => setModules(r.data)); }}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Modules</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModal("new")}>+ New module</button>
      </div>

      {/* Program selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {programs.map((p) => (
          <button
            key={p.id}
            className={"btn btn-sm " + (selPid === p.id ? "btn-primary" : "btn-ghost")}
            onClick={() => setSelPid(p.id)}
          >{p.name}</button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="grid-list">
          {modules.length === 0 && <div className="empty-state"><p>No modules for this program yet.</p></div>}
          {modules.map((mod) => (
            <div key={mod.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(108,143,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
                {mod.order_index || "—"}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{mod.name}</h3>
                <p style={{ fontSize: 13, color: "var(--text2)" }}>{mod.description || "—"} · {mod.material_count ?? 0} files</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(mod)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(mod)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
