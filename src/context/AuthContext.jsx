import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as apiLogin, getMyPermissions } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });
  const [perms, setPerms] = useState(() => {
    try { return JSON.parse(localStorage.getItem("perms")); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Load/refresh permissions
  const loadPerms = useCallback(async () => {
    try {
      const res = await getMyPermissions();
      setPerms(res.data);
      localStorage.setItem("perms", JSON.stringify(res.data));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (user) loadPerms();
  }, [user, loadPerms]);

  const login = async (email, password) => {
    setLoading(true); setError(null);
    try {
      const res = await apiLogin(email, password);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user",  JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } catch (e) {
      setError(e.response?.data?.error || "Login failed");
      throw e;
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("perms");
    setUser(null);
    setPerms(null);
  };

  const isAdmin = user?.role === "admin";

  // Can this user see a program?
  const canViewProgram = (programId) => {
    if (isAdmin) return true;
    if (!perms || perms.access_scope === "all") return true;
    return perms.permissions?.some(p => p.program_id === programId);
  };

  // What is the access level for a program?
  const programAccessLevel = (programId) => {
    if (isAdmin) return "uploader";
    if (!perms || perms.access_scope === "all") return "uploader";
    const p = perms.permissions?.find(p => p.program_id === programId);
    return p?.access_level || null;
  };

  // Can upload to a specific program?
  const canUploadToProgram = (programId) => {
    const lvl = programAccessLevel(programId);
    return lvl === "uploader";
  };

  // Can submit resources (contributor or above)?
  const canContribute = (programId) => {
    const lvl = programAccessLevel(programId);
    return ["contributor", "uploader"].includes(lvl);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, error, perms,
      login, logout,
      isAdmin,
      canViewProgram, programAccessLevel,
      canUploadToProgram, canContribute,
      refreshPerms: loadPerms,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
