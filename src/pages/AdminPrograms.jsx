import { useState, useEffect } from "react";
import { getPrograms, createProgram, updateProgram, deleteProgram } from "../services/api";
import { useToast } from "../components/Toast";

function ProgramModal({ prog, onClose, onSave }) {
  const [form, setForm] = useState({ name: prog?.name || "", description: prog?.description || "" });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handle = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (prog) { await updateProgram(prog.id, form); toast("Program updated"); }
      else       { await createProgram(form);          toast("Program created"); }
      onSave();
    } catch (e) {
      toast(e.response?.data?.error || "Error", "error");
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{prog ? "Edit program" : "New program"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Program name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cybersecurity" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short overview…" />
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

export default function AdminPrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | "new" | program object
  const toast = useToast();

  const load = () => getPrograms().then((r) => setPrograms(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleDelete = async (prog) => {
    if (!window.confirm(`Delete "${prog.name}" and all its modules?`)) return;
    try {
      await deleteProgram(prog.id);
      toast("Program deleted");
      load();
    } catch { toast("Delete failed", "error"); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      {modal !== null && (
        <ProgramModal
          prog={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Programs</h1>
          <p className="page-subtitle">{programs.length} programs</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal("new")}>+ New program</button>
      </div>

      <div className="grid-list">
        {programs.map((prog) => (
          <div key={prog.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>{prog.name}</h3>
              <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>
                {prog.description || "No description"} · {prog.module_count ?? 0} modules
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(prog)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(prog)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
