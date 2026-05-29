import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider }    from "./context/AuthContext";
import { ToastProvider }   from "./components/Toast";
import { ProtectedRoute }  from "./components/ProtectedRoute";
import ErrorBoundary       from "./components/ErrorBoundary";
import OfflineBanner       from "./components/OfflineBanner";
import SuppressDevOverlay  from "./components/SuppressDevOverlay";

import Login             from "./pages/Login";
import Programs          from "./pages/Programs";
import Modules           from "./pages/Modules";
import Materials         from "./pages/Materials";
import ExtraResources    from "./pages/ExtraResources";
import InstructorSubmit  from "./pages/InstructorSubmit";
import ChangePassword    from "./pages/ChangePassword";
import MyClasses         from "./pages/MyClasses";
import ClassDetail       from "./pages/ClassDetail";
import AdminAllocate     from "./pages/AdminAllocate";
import AdminPrograms     from "./pages/AdminPrograms";
import AdminModules      from "./pages/AdminModules";
import AdminUpload       from "./pages/AdminUpload";
import AdminSubmissions  from "./pages/AdminSubmissions";
import AdminProgress     from "./pages/AdminProgress";
import AdminUsers        from "./pages/AdminUsers";
import NotFound          from "./pages/NotFound";

const P = ({ children, admin }) => (
  <ProtectedRoute adminOnly={!!admin}>{children}</ProtectedRoute>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <SuppressDevOverlay />
          <OfflineBanner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Instructor */}
              <Route path="/programs"         element={<P><Programs /></P>} />
              <Route path="/programs/:pid"    element={<P><Modules /></P>} />
              <Route path="/modules/:mid"     element={<P><Materials /></P>} />
              <Route path="/extra-resources"  element={<P><ExtraResources /></P>} />
              <Route path="/submit-resource"  element={<P><InstructorSubmit /></P>} />
              <Route path="/change-password"  element={<P><ChangePassword /></P>} />
              <Route path="/my-classes"       element={<P><MyClasses /></P>} />
              <Route path="/classes/:cid"     element={<P><ClassDetail /></P>} />

              {/* Admin */}
              <Route path="/admin/programs"    element={<P admin><AdminPrograms /></P>} />
              <Route path="/admin/modules"     element={<P admin><AdminModules /></P>} />
              <Route path="/admin/upload"      element={<P admin><AdminUpload /></P>} />
              <Route path="/admin/allocate"    element={<P admin><AdminAllocate /></P>} />
              <Route path="/admin/submissions" element={<P admin><AdminSubmissions /></P>} />
              <Route path="/admin/progress"    element={<P admin><AdminProgress /></P>} />
              <Route path="/admin/users"       element={<P admin><AdminUsers /></P>} />

              {/* Catch-all */}
              <Route path="*" element={
                <P><NotFound message="This page doesn't exist." icon="🗺️" back="/programs" /></P>
              } />
              <Route index element={<Navigate to="/programs" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
