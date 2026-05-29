import { useState, useEffect } from "react";
import { getUsers, deleteUser, createUser, updateUser } from "../services/api";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

/* ── shared modal ───────────────────────────────────────────────── */
function UserModal({ title, form, setForm, showPassword, saving, onClose, onSave, saveLabel }) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordMismatch = showPassword && form.password && confirmPassword && form.password !== confirmPassword;
  const canSave = form.name && form.email &&
    (!showPassword || (form.password && form.password === confirmPassword));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border2)",
        borderRadius: "var(--radius)", width: "100%", maxWidth: 560,
        boxShadow: "var(--shadow)", display: "flex", flexDirection: "column",
        maxHeight: "90vh",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "22px 28px 16px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 20 }}>{title}</h3>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "20px 28px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* 2-column grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Full name *</label>
              <input className="input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Smith" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="input" type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="jane@school.edu" />
            </div>
            {showPassword && (
              <>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="input" type="password" value={form.password || ""}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 6 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm password *</label>
                  <input className="input" type="password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    style={{ borderColor: passwordMismatch ? "var(--danger)" : undefined }} />
                  {passwordMismatch && (
                    <span style={{ fontSize: 11, color: "var(--danger)", marginTop: 4 }}>Passwords do not match</span>
                  )}
                </div>
              </>
            )}
            <div className="form-group" style={{ gridColumn: showPassword ? "1 / -1" : "auto" }}>
              <label className="form-label">Role</label>
              <select className="input" value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Role hint */}
          <div style={{
            background: form.role === "admin" ? "rgba(167,139,250,.08)" : "rgba(108,143,255,.06)",
            border: `1px solid ${form.role === "admin" ? "rgba(167,139,250,.2)" : "rgba(108,143,255,.15)"}`,
            borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 12, color: "var(--text2)",
          }}>
            {form.role === "admin"
              ? "👑 Admin — full access to upload, manage programs, review submissions and manage users."
              : "👤 Instructor — can view all programs and submit resources for admin review."}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving || !canSave}>
            {saving ? "Saving…" : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── create modal ───────────────────────────────────────────────── */
function CreateModal({ onClose, onDone }) {
  const toast = useToast();
  const [form,   setForm]   = useState({ name: "", email: "", password: "", role: "instructor" });
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    try {
      await createUser({ ...form, access_scope: "all", permissions: [] });
      toast("Account created!");
      onDone();
    } catch (e) { toast(e.response?.data?.error || "Failed", "error"); }
    finally { setSaving(false); }
  };

  return (
    <UserModal title="Create new account"
      form={form} setForm={setForm} showPassword={true}
      saving={saving} onClose={onClose} onSave={handle} saveLabel="Create account" />
  );
}

/* ── edit modal ─────────────────────────────────────────────────── */
function EditModal({ user, onClose, onDone }) {
  const toast = useToast();
  const [form,   setForm]   = useState({ name: user.name, email: user.email, role: user.role });
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    try {
      await updateUser(user.id, { ...form, access_scope: "all", permissions: [] });
      toast("User updated!");
      onDone();
    } catch (e) { toast(e.response?.data?.error || "Failed", "error"); }
    finally { setSaving(false); }
  };

  return (
    <UserModal title={`Edit — ${user.name}`}
      form={form} setForm={setForm} showPassword={false}
      saving={saving} onClose={onClose} onSave={handle} saveLabel="Save changes" />
  );
}

/* ── user row ───────────────────────────────────────────────────── */
function UserRow({ u, me, onDelete, onEdit }) {
  const isMe = u.id === me?.id;
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: u.role === "admin" ? "rgba(167,139,250,.2)" : "rgba(108,143,255,.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>
        {u.role === "admin" ? "👑" : "👤"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          {u.name} {isMe && <span style={{ fontSize: 11, color: "var(--accent)", marginLeft: 4 }}>(you)</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 1 }}>{u.email}</div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
          Joined {new Date(u.created_at).toLocaleDateString()}
        </div>
      </div>
      <span className={`badge ${u.role === "admin" ? "badge-admin" : "badge-other"}`}>{u.role}</span>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(u)}>✏ Edit</button>
        {!isMe && <button className="btn btn-danger btn-sm" onClick={() => onDelete(u)}>Delete</button>}
      </div>
    </div>
  );
}

/* ── main page ──────────────────────────────────────────────────── */
export default function AdminUsers() {
  const { user: me } = useAuth();
  const toast        = useToast();
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [search,     setSearch]     = useState("");

  const load = () => getUsers().then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleDelete = async u => {
    if (!window.confirm(`Delete "${u.name}"? This cannot be undone.`)) return;
    try { await deleteUser(u.id); toast("User deleted"); setUsers(a => a.filter(x => x.id !== u.id)); }
    catch (e) { toast(e.response?.data?.error || "Failed", "error"); }
  };

  const filtered    = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const admins      = filtered.filter(u => u.role === "admin");
  const instructors = filtered.filter(u => u.role === "instructor");

  if (loading) return <div className="spinner" />;

  return (
    <div>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); load(); }} />}
      {editing    && <EditModal   user={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); load(); }} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">{users.length} accounts · {instructors.length} instructors · {admins.length} admins</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input" style={{ width: 200 }} placeholder="Search…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New user</button>
        </div>
      </div>

      {admins.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
            Admins ({admins.length})
          </h2>
          <div className="grid-list">
            {admins.map(u => <UserRow key={u.id} u={u} me={me} onDelete={handleDelete} onEdit={setEditing} />)}
          </div>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
          Instructors ({instructors.length})
        </h2>
        {instructors.length === 0
          ? <div className="empty-state"><p>No instructors yet.</p></div>
          : <div className="grid-list">
              {instructors.map(u => <UserRow key={u.id} u={u} me={me} onDelete={handleDelete} onEdit={setEditing} />)}
            </div>
        }
      </div>
    </div>
  );
}
