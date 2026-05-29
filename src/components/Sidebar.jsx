import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNotifications, markAllRead, markOneRead } from "../services/api";

const NAV = [
  { to: "/programs",         icon: "📚", label: "Programs"         },
  { to: "/my-classes",       icon: "🏫", label: "My Classes"       },
  { to: "/extra-resources",  icon: "🌟", label: "Extra Resources"  },
  { to: "/submit-resource",  icon: "📤", label: "Share a Resource" },
  { to: "/change-password",  icon: "🔒", label: "Change Password"  },
];

const ADMIN_NAV = [
  { to: "/admin/programs",    icon: "🗂️",  label: "Manage Programs"      },
  { to: "/admin/modules",     icon: "📦",  label: "Manage Modules"       },
  { to: "/admin/upload",      icon: "⬆️",  label: "Upload Material"      },
  { to: "/admin/allocate",    icon: "🏫",  label: "Instructor Allocation"},
  { to: "/admin/progress",    icon: "📊",  label: "Progress Overview"    },
  { to: "/admin/submissions", icon: "📬",  label: "Submissions"          },
  { to: "/admin/users",       icon: "👥",  label: "Manage Users"         },
];

function NotificationPanel({ onClose }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getNotifications()
      .then(r => setItems(r.data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleMarkAll = async () => {
    await markAllRead().catch(() => {});
    setItems(items.map(n => ({ ...n, is_read: 1 })));
  };

  const handleMarkOne = async (n) => {
    if (n.is_read) return;
    await markOneRead(n.id).catch(() => {});
    setItems(items.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
  };

  const unread = items.filter(n => !n.is_read).length;

  return (
    <div style={{
      position: "absolute", bottom: "100%", left: 0, right: 0, zIndex: 500,
      marginBottom: 8,
      width: 340, maxHeight: "70vh",
      background: "var(--bg2)", border: "1px solid var(--border2)",
      borderRadius: "var(--radius)", boxShadow: "var(--shadow)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          Notifications {unread > 0 && <span style={{
            background: "var(--accent)", color: "#fff",
            borderRadius: 99, padding: "1px 7px", fontSize: 11, marginLeft: 6,
          }}>{unread}</span>}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {unread > 0 && (
            <button className="btn btn-ghost btn-sm"
              style={{ fontSize: 11 }} onClick={handleMarkAll}>
              Mark all read
            </button>
          )}
          <button className="btn btn-ghost btn-sm"
            style={{ fontSize: 11 }} onClick={onClose}>✕</button>
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: "center" }}><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
            No notifications yet
          </div>
        ) : items.map(n => (
          <div key={n.id}
            onClick={() => handleMarkOne(n)}
            style={{
              padding: "11px 16px",
              borderBottom: "1px solid var(--border)",
              background: n.is_read ? "transparent" : "rgba(108,143,255,.06)",
              cursor: n.is_read ? "default" : "pointer",
              transition: "background .2s",
            }}>
            <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.45 }}>
              {!n.is_read && (
                <span style={{
                  display: "inline-block", width: 7, height: 7,
                  borderRadius: "50%", background: "var(--accent)",
                  marginRight: 7, verticalAlign: "middle", flexShrink: 0,
                }} />
              )}
              {n.message}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
              {new Date(n.created_at).toLocaleString()}
              {n.instructor_name && <span style={{ marginLeft: 8 }}>· {n.instructor_name}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [unread,       setUnread]       = useState(0);
  const [showNotifs,   setShowNotifs]   = useState(false);
  const bellRef = useRef(null);

  // Poll unread count every 30 s (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    const fetch = () =>
      getNotifications().then(r => setUnread(r.data.unread || 0)).catch(() => {});
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [isAdmin]);

  // Close panel when clicking outside
  useEffect(() => {
    if (!showNotifs) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifs]);

  // Close sidebar on route change (mobile)
  useEffect(() => { onClose(); }, [location.pathname]);

  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          display: "none",
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,.55)",
          zIndex: 99,
        }} className="sidebar-overlay" />
      )}

      <aside className={`sidebar${open ? " sidebar-open" : ""}`}>
        <div className="sidebar-logo">Note<span>Share</span></div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <span className="nav-icon">{icon}</span> {label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div style={{
                margin: "14px 12px 4px", fontSize: 11, fontWeight: 600,
                color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em",
              }}>Admin</div>
              {ADMIN_NAV.map(({ to, icon, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                  <span className="nav-icon">{icon}</span> {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-user">
          {/* Bell — admin only */}
          {isAdmin && (
            <div ref={bellRef} style={{ position: "relative", marginBottom: 10, overflow: "visible" }}>
              <button
                onClick={() => setShowNotifs(v => !v)}
                className="btn btn-ghost btn-sm"
                style={{ width: "100%", justifyContent: "flex-start", gap: 8, position: "relative" }}
                title="Notifications"
              >
                <span style={{ fontSize: 18 }}>🔔</span>
                <span style={{ fontSize: 13 }}>Notifications</span>
                {unread > 0 && (
                  <span style={{
                    marginLeft: "auto",
                    background: "var(--accent)", color: "#fff",
                    borderRadius: 99, padding: "1px 7px",
                    fontSize: 11, fontWeight: 700, lineHeight: 1.4,
                  }}>{unread}</span>
                )}
              </button>
              {showNotifs && (
                <NotificationPanel onClose={() => {
                  setShowNotifs(false);
                  // Refresh count after closing
                  getNotifications().then(r => setUnread(r.data.unread || 0)).catch(() => {});
                }} />
              )}
            </div>
          )}

          <strong>{user?.name}</strong>
          <span style={{ display: "block", marginTop: 3 }}>
            {user?.role === "admin"
              ? <span className="badge badge-admin">Admin</span>
              : <span style={{ fontSize: 12, color: "var(--text3)" }}>Instructor</span>}
          </span>
          <button onClick={() => { logout(); navigate("/login"); }}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 10, width: "100%", justifyContent: "center" }}>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
