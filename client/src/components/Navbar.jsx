import React from 'react';
import { Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';
import { useSelector } from 'react-redux';

const Navbar = ({ toggleSidebar, title }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-outfit text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-2xl">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationDropdown />
        
        <div className="hidden h-8 w-[1px] bg-slate-200 dark:bg-slate-800 sm:block" />
        
        {user && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Welcome, {user.name.split(' ')[0]}
            </span>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 uppercase tracking-wider">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
