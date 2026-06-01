import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/authSlice.js';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Receipt, 
  BarChart3, 
  Settings, 
  History, 
  UserCog, 
  LogOut, 
  X, 
  WalletCards 
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['super_admin', 'accountant', 'staff'] },
    { name: 'Invoices', path: '/invoices', icon: <FileText className="h-5 w-5" />, roles: ['super_admin', 'accountant', 'staff'] },
    { name: 'Clients', path: '/clients', icon: <Users className="h-5 w-5" />, roles: ['super_admin', 'accountant', 'staff'] },
    { name: 'Expenses', path: '/expenses', icon: <Receipt className="h-5 w-5" />, roles: ['super_admin', 'accountant', 'staff'] },
    { name: 'Reports', path: '/reports', icon: <BarChart3 className="h-5 w-5" />, roles: ['super_admin', 'accountant'] },
    { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" />, roles: ['super_admin', 'accountant', 'staff'] },
    { name: 'Users', path: '/users', icon: <UserCog className="h-5 w-5" />, roles: ['super_admin'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: <History className="h-5 w-5" />, roles: ['super_admin'] },
  ];

  const filteredItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`fixed bottom-0 top-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/35">
              <WalletCards className="h-5 w-5" />
            </div>
            <span className="font-outfit text-lg font-bold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent dark:from-brand-400 dark:to-indigo-400">
              Manshu Finance
            </span>
          </div>
          <button 
            onClick={toggleSidebar}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={({ isActive }) => `
                flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10 dark:bg-brand-600' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                }
              `}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          {user && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
