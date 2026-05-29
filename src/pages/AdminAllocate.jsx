import { useState, useEffect } from "react";
import { getUsers, getPrograms, getAllClasses, createClass, updateClass, deleteClass } from "../services/api";
import { useToast } from "../components/Toast";

const STATUS_META = {
  active:    { color: "var(--success)", bg: "rgba(52,211,153,.12)",  label: "Active"    },
  paused:    { color: "var(--warn)",    bg: "rgba(251,191,36,.12)",  label: "Paused"    },
  completed: { color: "var(--accent)",  bg: "rgba(108,143,255,.12)", label: "Completed" },
};

function AllocateModal({ onClose, onDone }) {
  const toast = useToast();
  const [instructors, setInstructors] = useState([]);
  const [programs,    setPrograms]    = useState([]);
  const [form, setForm] = useState({
    instructor_id: "", program_id: "", name: "", description: "", start_date: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getUsers(), getPrograms()])
      .then(([u, p]) => {
        const instr = u.data.filter(x => x.role === "instructor");
        setInstructors(instr);
        setPrograms(p.data);
        if (instr.length) setForm(f => ({ ...f, instructor_id: instr[0].id }));
        if (p.data.length) setForm(f => ({ ...f, program_id: p.data[0].id }));
      }).catch(() => {});
  }, []);

  // Auto-suggest class name when instructor + program selected
  useEffect(() => {
    if (!form.instructor_id || !form.program_id) return;
    const instr = instructors.find(i => String(i.id) === String(form.instructor_id));
    const prog  = programs.find(p => String(p.id) === String(form.program_id));
    if (instr && prog && !form.name) {
      const year = new Date().getFullYear();
      setForm(f => ({ ...f, name: `${prog.name} — ${instr.name} ${year}` }));
    }
  }, [form.instructor_id, form.program_id]);

  const handle = async () => {
    if (!form.instructor_id || !form.program_id || !form.name.trim()) return;
    setSaving(true);
    try {
      await createClass({
        ...form,
        instructor_id: Number(form.instructor_id),
        program_id:    Number(form.program_id),
      });
      toast("Instructor allocated successfully!");
      onDone();
    } catch (e) { toast(e.response?.data?.error || "Failed", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border2)",
        borderRadius: "var(--radius)", width: "100%", maxWidth: 560,
        boxShadow: "var(--shadow)", display: "flex", flexDirection: "column",
        maxHeight: "90vh",
      }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: "22px 28px 16px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 20 }}>Allocate Instructor to Program</h3>
          <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
            This creates a class the instructor can track module progress on.
          </p>
        </div>

        <div style={{ padding: "20px 28px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Instructor *</label>
              <select className="input" value={form.instructor_id}
                onChange={e => setForm({ ...form, instructor_id: e.target.value, name: "" })}>
                {instructors.length === 0 && <option value="">No instructors found</option>}
                {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Program *</label>
              <select className="input" value={form.program_id}
                onChange={e => setForm({ ...form, program_id: e.target.value, name: "" })}>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Class name * <span style={{ color: "var(--text3)", fontWeight: 400 }}>(identifies this specific group)</span></label>
              <input className="input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. MSD Morning Class 2024" />
            </div>
            <div className="form-group">
              <label className="form-label">Start date</label>
              <input className="input" type="date" value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input className="input" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Evening class, 30 students" />
            </div>
          </div>

          <div style={{
            background: "rgba(108,143,255,.08)", border: "1px solid rgba(108,143,255,.2)",
            borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 12, color: "var(--text2)",
          }}>
            💡 The first module will be set to <strong>Ongoing</strong> automatically. The instructor marks modules complete as they cover them — the next module becomes ongoing automatically.
          </div>
        </div>

        <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handle}
            disabled={saving || !form.name.trim() || !form.instructor_id || !form.program_id}>
            {saving ? "Allocating…" : "Allocate"}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function AdminAllocate() {
  const toast = useToast();
  const [classes,    setClasses]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search,     setSearch]     = useState("");
  const [filterP,    setFilterP]    = useState("all");
  const [filterS,    setFilterS]    = useState("all");

  const load = () => getAllClasses().then(r => setClasses(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleDelete = async (cls) => {
    if (!window.confirm(`Remove "${cls.name}" and all its progress? This cannot be undone.`)) return;
    try { await deleteClass(cls.id); toast("Removed"); load(); }
    catch { toast("Failed", "error"); }
  };

  const handleStatus = async (cls, status) => {
    try { await updateClass(cls.id, { status }); toast("Updated"); load(); }
    catch { toast("Failed", "error"); }
  };

  const programs = [...new Set(classes.map(c => c.program_name))].sort();

  const filtered = classes.filter(c => {
    const s = search.toLowerCase();
    const matchS = !s || c.class_name?.toLowerCase().includes(s) || c.name?.toLowerCase().includes(s)
                     || c.instructor_name?.toLowerCase().includes(s) || c.program_name?.toLowerCase().includes(s);
    const matchP = filterP === "all" || c.program_name === filterP;
    const matchSt = filterS === "all" || c.status === filterS;
    return matchS && matchP && matchSt;
  });

  const counts = { active: 0, paused: 0, completed: 0, all: classes.length };
  classes.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  if (loading) return <div className="spinner" />;

  return (
    <div>
      {showCreate && <AllocateModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); load(); }} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Instructor Allocations</h1>
          <p className="page-subtitle">Assign instructors to programs and track their module progress</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Allocate Instructor</button>
      </div>

      {/* Summary pills */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {[["all","All",classes.length],["active","Active",counts.active],["paused","Paused",counts.paused],["completed","Completed",counts.completed]].map(([key,label,count]) => (
          <button key={key} className={"btn btn-sm " + (filterS === key ? "btn-primary" : "btn-ghost")}
            onClick={() => setFilterS(key)}>
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Search + program filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input className="input" style={{ width: 220 }} placeholder="Search instructor / class…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" style={{ width: 180 }} value={filterP} onChange={e => setFilterP(e.target.value)}>
          <option value="all">All Programs</option>
          {programs.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 56 }}>🏫</div>
          <p>No allocations yet.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
            Allocate first instructor
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(cls => {
            const sm  = STATUS_META[cls.status] || STATUS_META.active;
            const total = Number(cls.total_modules) || 0;
            const done  = Number(cls.completed_modules) || 0;
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={cls.id} style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
              }}>
                {/* Info */}
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{cls.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                    👤 {cls.instructor_name}
                    <span style={{ color: "var(--text3)", marginLeft: 8 }}>· 📚 {cls.program_name}</span>
                  </div>
                  {cls.description && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{cls.description}</div>}
                  {cls.start_date && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                    Started {new Date(cls.start_date).toLocaleDateString()}
                  </div>}
                </div>

                {/* Progress bar */}
                <div style={{ flex: "1 1 160px", minWidth: 120 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>
                    <span>{done}/{total} modules</span>
                    <span style={{ fontWeight: 700, color: pct === 100 ? "var(--success)" : "var(--text2)" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: pct === 100 ? "var(--success)" : "var(--accent)",
                      borderRadius: 99, transition: "width .4s",
                    }} />
                  </div>
                </div>

                {/* Status badge */}
                <span style={{
                  background: sm.bg, color: sm.color,
                  borderRadius: 99, padding: "3px 12px",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{sm.label}</span>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                  {cls.status === "active" && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleStatus(cls, "paused")}>⏸</button>
                  )}
                  {cls.status === "paused" && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleStatus(cls, "active")}>▶</button>
                  )}
                  {cls.status !== "completed" && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleStatus(cls, "completed")}>✅ Done</button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cls)}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
