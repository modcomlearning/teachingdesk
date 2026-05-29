import { useState } from "react";
import { changePassword } from "../services/api";
import { useToast } from "../components/Toast";

export default function ChangePassword() {
  const toast = useToast();
  const [form, setForm]   = useState({ current_password: "", new_password: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const valid = form.current_password && form.new_password.length >= 6 && form.new_password === form.confirm;

  const handle = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await changePassword({ current_password: form.current_password, new_password: form.new_password });
      toast("Password changed successfully!");
      setForm({ current_password: "", new_password: "", confirm: "" });
    } catch (e) {
      toast(e.response?.data?.error || "Failed to change password", "error");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 460 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Change Password</h1>
          <p className="page-subtitle">Update your account password</p>
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Current password</label>
          <input
            className="input" type="password"
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            placeholder="Your current password"
          />
        </div>
        <div className="form-group">
          <label className="form-label">New password</label>
          <input
            className="input" type="password"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            placeholder="At least 6 characters"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm new password</label>
          <input
            className="input" type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            placeholder="Repeat new password"
          />
          {form.confirm && form.new_password !== form.confirm && (
            <span style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>Passwords do not match</span>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={handle}
          disabled={!valid || saving}
          style={{ justifyContent: "center", marginTop: 4 }}
        >
          {saving ? "Saving…" : "🔒 Update password"}
        </button>
      </div>

      <div className="card" style={{ marginTop: 16, background: "rgba(108,143,255,.06)", borderColor: "rgba(108,143,255,.2)" }}>
        <p style={{ fontSize: 13, color: "var(--text2)" }}>
          After changing your password you will stay logged in. Use your new password next time you sign in.
        </p>
      </div>
    </div>
  );
}
