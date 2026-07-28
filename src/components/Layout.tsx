import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm ${isActive ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`;

const Layout: React.FC = () => {
  const identity = useAuthStore((s) => s.identity);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/invoices" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white grid place-items-center font-bold">IB</div>
            <div>
              <div className="text-lg font-semibold text-gray-900">Invoice Builder</div>
              {/*<div className="text-xs text-gray-500">by Anton Martyniuk</div>*/}
            </div>
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            <NavLink to="/invoices" className={navClass}>Invoices</NavLink>
            <NavLink to="/customers" className={navClass}>Customers</NavLink>
            <NavLink to="/senders" className={navClass}>Senders</NavLink>
            <NavLink to="/invoices/new" className={navClass}>New Invoice</NavLink>
            {identity?.role === 'Admin' && <NavLink to="/users" className={navClass}>Users</NavLink>}
          </nav>
          <div className="flex items-center gap-3">
            {identity && <span className="text-sm text-gray-600 truncate max-w-[10rem] sm:max-w-[14rem]">{identity.email}</span>}
            <button
              onClick={logout}
              className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><Outlet /></main>
    </div>
  );
};

export default Layout;
