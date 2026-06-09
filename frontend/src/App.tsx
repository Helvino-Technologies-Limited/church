import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { restoreUser } from './store/slices/authSlice';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Layouts
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import TenantLayout from './components/layout/TenantLayout';

// SuperAdmin pages
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import Tenants from './pages/superadmin/Tenants';
import TenantDetail from './pages/superadmin/TenantDetail';
import Analytics from './pages/superadmin/Analytics';
import Billing from './pages/superadmin/Billing';
import AuditLogs from './pages/superadmin/AuditLogs';
import Support from './pages/superadmin/Support';

// Tenant pages
import TenantDashboard from './pages/tenant/Dashboard';
import Members from './pages/tenant/Members';
import Parishes from './pages/tenant/Parishes';
import Ministries from './pages/tenant/Ministries';
import Events from './pages/tenant/Events';
import Donations from './pages/tenant/Donations';
import Finance from './pages/tenant/Finance';
import Employees from './pages/tenant/Employees';
import Assets from './pages/tenant/Assets';
import Attendance from './pages/tenant/Attendance';
import Payroll from './pages/tenant/Payroll';
import Reports from './pages/tenant/Reports';
import Settings from './pages/tenant/Settings';

function PrivateRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function TenantRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'SUPERADMIN') return <Navigate to="/superadmin/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    dispatch(restoreUser());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={isAuthenticated ? (user?.role === 'SUPERADMIN' ? <Navigate to="/superadmin/dashboard" /> : <Navigate to="/dashboard" />) : <Login />} />
        <Route path="/register" element={<Register />} />

        {/* SuperAdmin */}
        <Route path="/superadmin" element={<PrivateRoute role="SUPERADMIN"><SuperAdminLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="tenants/:id" element={<TenantDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="billing" element={<Billing />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="support" element={<Support />} />
        </Route>

        {/* Tenant */}
        <Route path="/" element={<TenantRoute><TenantLayout /></TenantRoute>}>
          <Route path="dashboard" element={<TenantDashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="parishes" element={<Parishes />} />
          <Route path="ministries" element={<Ministries />} />
          <Route path="events" element={<Events />} />
          <Route path="donations" element={<Donations />} />
          <Route path="accounts" element={<Finance />} />
          <Route path="employees" element={<Employees />} />
          <Route path="assets" element={<Assets />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
