import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Both states render solid white text (6:1+ contrast against the #1066A4 header fill either
// way — req 5 requires >=4.5:1 for every piece of text in the header, active or not). The active
// state is distinguished by weight and a bottom border instead of colour, so it never depends on
// a contrast-risky tint to read as "current section". The border is present-but-transparent on
// the inactive state so switching sections doesn't shift layout.
const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm text-white border-b-2 pb-0.5 ${isActive ? 'font-semibold border-white' : 'font-normal border-transparent hover:border-white/40'}`;

const Layout: React.FC = () => {
  const identity = useAuthStore((s) => s.identity);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-deep border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/invoices" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-white grid place-items-center p-1 shadow-sm">
              <img src="/logo.svg" alt="" className="h-full w-full" />
            </div>
            {/* leading-tight on each line, not the wrapper: Tailwind's text-lg/text-xs utilities
                each set their own line-height, which overrides an inherited one from a parent
                className — the parent alone had no effect. */}
            <div>
              <div className="text-lg font-semibold leading-tight text-white">Meer von Rechnungen</div>
              <div className="text-xs leading-tight text-brand-tint">by Yury Krasavin</div>
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
            {identity && <span className="text-sm text-white truncate max-w-[10rem] sm:max-w-[14rem]">{identity.email}</span>}
            <button
              onClick={() => logout()}
              className="px-3 py-2 text-sm rounded-md border border-white/40 text-white hover:bg-white/10"
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
