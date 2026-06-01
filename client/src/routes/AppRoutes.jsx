import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';

// Pages
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Invoices from '../pages/Invoices.jsx';
import InvoiceDetail from '../pages/InvoiceDetail.jsx';
import CreateInvoice from '../pages/CreateInvoice.jsx';
import Clients from '../pages/Clients.jsx';
import ClientDetail from '../pages/ClientDetail.jsx';
import Expenses from '../pages/Expenses.jsx';
import Reports from '../pages/Reports.jsx';
import Settings from '../pages/Settings.jsx';
import Users from '../pages/Users.jsx';
import AuditLogs from '../pages/AuditLogs.jsx';
import ClientPortal from '../pages/ClientPortal.jsx';

// Simple Unauthorized placeholder
const Unauthorized = () => (
  <div className="flex h-[60vh] flex-col items-center justify-center text-center space-y-4">
    <h2 className="text-xl font-bold text-rose-500">Access Unauthorized</h2>
    <p className="text-xs text-slate-500 max-w-sm">
      Your user account role does not have the required security clearances to view this page.
    </p>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Public Client Shareable Portal Link */}
      <Route path="/portal/invoice/:token" element={<ClientPortal />} />

      {/* Protected Dashboard Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        
        {/* Invoices */}
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="invoices/create" element={<CreateInvoice />} />
        <Route path="invoices/edit/:id" element={<CreateInvoice />} />

        {/* Clients */}
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetail />} />

        {/* Expenses */}
        <Route path="expenses" element={<Expenses />} />

        {/* Reports (Super Admin + Accountant) */}
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'accountant']}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route path="settings" element={<Settings />} />

        {/* User Administration (Super Admin only) */}
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* Audit Logs (Super Admin only) */}
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        {/* Unauthorized Route */}
        <Route path="unauthorized" element={<Unauthorized />} />
      </Route>

      {/* Redirect fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
