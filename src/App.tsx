import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { useAuthStore } from "./store/useAuthStore";
import { MainLayout, PrivateRoute } from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/admin/Users";
import MasterData from "./pages/admin/MasterData";
import CirList from "./pages/cir/CirList";
import CirDetail from "./pages/cir/CirDetail";
import CirFormWizard from "./pages/cir/CirFormWizard";
import AuditLogs from "./pages/admin/AuditLogs";
import Settings from "./pages/admin/Settings";
import FormBuilder from "./pages/admin/FormBuilder";
import SectionAccessManager from "./pages/admin/SectionAccessManager";

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes inside MainLayout */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/cir" element={<CirList />} />
            <Route path="/cir/new" element={<CirFormWizard />} />
            <Route path="/cir/:id/edit" element={<CirFormWizard />} />
            <Route path="/cir/:id" element={<CirDetail />} />
            
            {/* Admin Routes */}
            <Route element={<PrivateRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]} />}>
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/master" element={<MasterData />} />
              <Route path="/admin/audit-logs" element={<AuditLogs />} />
              <Route path="/admin/form-builder" element={<FormBuilder />} />
              <Route path="/admin/section-access" element={<SectionAccessManager />} />
            </Route>
            
            <Route element={<PrivateRoute allowedRoles={["SUPER_ADMIN"]} />}>
              <Route path="/admin/settings" element={<Settings />} />
            </Route>

            {/* Default redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
