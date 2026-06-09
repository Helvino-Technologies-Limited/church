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

// Tenant pages
import TenantDashboard from './pages/tenant/Dashboard';
import Members from './pages/tenant/Members';
import ComingSoon from './pages/tenant/ComingSoon';

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
          <Route path="analytics" element={<ComingSoon title="Analytics" description="Advanced platform analytics, revenue tracking, and growth metrics." />} />
          <Route path="billing" element={<ComingSoon title="Billing" description="Subscription billing, invoices, and payment management." />} />
          <Route path="audit-logs" element={<ComingSoon title="Audit Logs" description="Platform-wide audit trail for all actions." />} />
          <Route path="support" element={<ComingSoon title="Support" description="Tenant support tickets and assistance." />} />
          <Route path="settings" element={<ComingSoon title="Platform Settings" description="Global platform configuration and settings." />} />
        </Route>

        {/* Tenant */}
        <Route path="/" element={<TenantRoute><TenantLayout /></TenantRoute>}>
          <Route path="dashboard" element={<TenantDashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="parishes" element={<ComingSoon title="Parishes & Branches" description="Manage church branches, parishes, and their members." />} />
          <Route path="ministries" element={<ComingSoon title="Ministries" description="Manage church ministries and their members." />} />
          <Route path="events" element={<ComingSoon title="Events" description="Church events, services, and calendar management." />} />
          <Route path="donations" element={<ComingSoon title="Donations" description="Track tithes, offerings, and all financial contributions." />} />
          <Route path="accounts" element={<ComingSoon title="Chart of Accounts" description="Full double-entry bookkeeping and financial accounts." />} />
          <Route path="employees" element={<ComingSoon title="Employees" description="Staff management, HR, and payroll." />} />
          <Route path="assets" element={<ComingSoon title="Assets" description="Church property, equipment, and asset tracking." />} />
          <Route path="reports" element={<ComingSoon title="Reports" description="Comprehensive church reports and analytics." />} />
          <Route path="settings" element={<ComingSoon title="Settings" description="Church configuration, users, roles, and preferences." />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
