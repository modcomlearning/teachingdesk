import axios from "axios";

const BASE = "https://coding.co.ke/teachingdesk2/api";
// const BASE = "http://localhost:5000/api";
const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response && !navigator.onLine) {
      // Truly offline
      const networkErr = new Error("Connection lost — check your internet connection.");
      networkErr.isNetworkError = true;
      return Promise.reject(networkErr);
    }
    if (!err.response) {
      // Server unreachable but browser thinks it's online (Flask not running)
      const serverErr = new Error("Cannot reach the server — make sure Flask is running.");
      serverErr.isServerError = true;
      return Promise.reject(serverErr);
    }
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("perms");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const login    = (email, password) => api.post("/auth/login", { email, password });
export const getMe    = ()                => api.get("/auth/me");
export const register = (data)            => api.post("/auth/register", data);

// ── Programs ──────────────────────────────────────────────────
export const getPrograms   = ()      => api.get("/programs/");
export const getProgram    = (id)    => api.get(`/programs/${id}`);
export const createProgram = (data)  => api.post("/programs/", data);
export const updateProgram = (id, d) => api.put(`/programs/${id}`, d);
export const deleteProgram = (id)    => api.delete(`/programs/${id}`);

// ── Modules ───────────────────────────────────────────────────
export const getModulesByProgram = (pid)   => api.get(`/modules/by-program/${pid}`);
export const getModule           = (id)    => api.get(`/modules/${id}`);
export const createModule        = (data)  => api.post("/modules/", data);
export const updateModule        = (id, d) => api.put(`/modules/${id}`, d);
export const deleteModule        = (id)    => api.delete(`/modules/${id}`);

// ── Materials ─────────────────────────────────────────────────
export const getMaterialsByModule = (mid)     => api.get(`/materials/by-module/${mid}`);
export const uploadMaterial       = (formData) =>
  api.post("/materials/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteMaterial = (id)       => api.delete(`/materials/${id}`);
export const updateMaterial = (id, d)    => api.put(`/materials/${id}`, d);
export const downloadUrl    = (id)       => `${BASE}/materials/${id}/download`;

// ── Extra Resources ───────────────────────────────────────────
export const getExtraResources   = ()         => api.get("/extra/");
export const uploadExtraResource = (formData) =>
  api.post("/extra/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteExtraResource = (id)       => api.delete(`/extra/${id}`);
export const extraDownloadUrl    = (id)       => `${BASE}/extra/${id}/download`;

// ── Submissions ───────────────────────────────────────────────
export const submitMaterial       = (fd)       =>
  api.post("/submissions/", fd, { headers: { "Content-Type": "multipart/form-data" } });
export const getMySubmissions     = ()         => api.get("/submissions/mine");
export const getAllSubmissions     = ()         => api.get("/submissions/");
export const reviewSubmission     = (id, data) => api.put(`/submissions/${id}/review`, data);
export const deleteSubmission     = (id)       => api.delete(`/submissions/${id}`);
export const submissionDownloadUrl = (id)      => `${BASE}/submissions/${id}/download`;

// ── Users ─────────────────────────────────────────────────────
export const getUsers          = ()          => api.get("/users/");
export const createUser        = (data)      => api.post("/users/", data);
export const updateUser        = (id, data)  => api.put(`/users/${id}`, data);
export const changePassword    = (data)      => api.put("/users/change-password", data);
export const deleteUser        = (id)        => api.delete(`/users/${id}`);
export const getUserPermissions= (id)        => api.get(`/users/${id}/permissions`);
export const setUserPermissions= (id, data)  => api.put(`/users/${id}/permissions`, data);
export const getMyPermissions  = ()          => api.get("/users/my-permissions");

export default api;

// ── Classes ───────────────────────────────────────────────────
export const getMyClasses    = ()          => api.get("/classes/mine");
export const getAllClasses    = ()          => api.get("/classes/");
export const getClass        = (id)        => api.get(`/classes/${id}`);
export const createClass     = (data)      => api.post("/classes/", data);
export const updateClass     = (id, data)  => api.put(`/classes/${id}`, data);
export const deleteClass     = (id)        => api.delete(`/classes/${id}`);

// ── Progress ──────────────────────────────────────────────────
export const updateProgress       = (cid, mid, data) => api.put(`/progress/${cid}/module/${mid}`, data);
export const adminOverrideProgress = (cid, data)      => api.put(`/progress/${cid}/admin-override`, data);
export const adminUndoProgress     = (cid, mid)        => api.put(`/progress/${cid}/admin-undo/${mid}`);
export const adminSkipProgress     = (cid, mid)        => api.put(`/progress/${cid}/admin-skip/${mid}`);
export const adminRestoreProgress  = (cid, mid)        => api.put(`/progress/${cid}/admin-restore/${mid}`);

export const getNotifications      = ()                => api.get("/progress/notifications");
export const markAllRead           = ()                => api.put("/progress/notifications/read-all");
export const markOneRead           = (nid)             => api.put(`/progress/notifications/${nid}/read`);
export const getProgressOverview = ()           => api.get("/progress/overview");
