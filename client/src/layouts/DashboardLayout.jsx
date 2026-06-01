import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Derive title from active page path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/invoices/create')) return 'Create Invoice';
    if (path.startsWith('/invoices/edit')) return 'Edit Invoice';
    if (path.startsWith('/invoices')) return 'Invoice Ledger';
    if (path.startsWith('/clients')) return 'Client Management';
    if (path.startsWith('/expenses')) return 'Expense Tracker';
    if (path.startsWith('/reports')) return 'Financial Reports';
    if (path.startsWith('/settings')) return 'Company Settings';
    if (path.startsWith('/users')) return 'User Administration';
    if (path.startsWith('/audit-logs')) return 'System Audit Logs';
    return 'Manshu Finance';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content drawer */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
        {/* Top Navbar */}
        <Navbar toggleSidebar={toggleSidebar} title={getPageTitle()} />

        {/* Dynamic page viewport */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
