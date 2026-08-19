import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useIsNarrow } from '../hooks/useIsNarrow';

// Both states render solid white text (6:1+ contrast against the #1066A4 header fill either
// way — req 5 requires >=4.5:1 for every piece of text in the header, active or not). The active
// state is distinguished by weight and a bottom border instead of colour, so it never depends on
// a contrast-risky tint to read as "current section". The border is present-but-transparent on
// the inactive state so switching sections doesn't shift layout.
const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm text-white border-b-2 pb-0.5 ${isActive ? 'font-semibold border-white' : 'font-normal border-transparent hover:border-white/40'}`;

// Same current-section marker as navClass, restyled for a stacked panel item instead of an inline
// underline: a left border plus a tinted fill reads as "current" without relying on colour alone
// (weight carries it too, matching the wide nav's approach).
const panelNavClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-3 text-base border-l-4 ${
    isActive
      ? 'font-semibold border-brand-deep bg-brand-tint text-brand-deep-dark'
      : 'font-normal border-transparent text-gray-800 hover:bg-gray-50'
  }`;

// Single source of truth for what the wide inline nav and the narrow panel both offer — every
// destination is defined once here so the two layouts can never drift apart (req 1). `adminOnly`
// mirrors the gate the wide nav has always applied to Users.
const NAV_ITEMS: { to: string; label: string; adminOnly?: boolean }[] = [
  { to: '/invoices', label: 'Invoices' },
  { to: '/customers', label: 'Customers' },
  { to: '/senders', label: 'Senders' },
  { to: '/invoices/new', label: 'New Invoice' },
  { to: '/users', label: 'Users', adminOnly: true },
];

const Layout: React.FC = () => {
  const identity = useAuthStore((s) => s.identity);
  const logout = useAuthStore((s) => s.logout);
  const isNarrow = useIsNarrow();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || identity?.role === 'Admin');

  // The panel only exists at narrow widths; if a resize crosses the breakpoint while it's open,
  // drop the open state so it can't linger as a leftover mount at wide widths.
  useEffect(() => {
    if (!isNarrow) setMenuOpen(false);
  }, [isNarrow]);

  // Navigating (via the panel's own links) should close the panel — req 4.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // The toggle button is outside panelRef's DOM subtree (it's a header-level sibling), so
      // without this check pressing it would close the panel on mousedown and the same gesture's
      // click would immediately reopen it — the button would then look inert to a user.
      if (menuButtonRef.current?.contains(target)) return;
      if (panelRef.current && !panelRef.current.contains(target)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-deep border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/invoices" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-white grid place-items-center p-1 shadow-sm shrink-0">
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

          {!isNarrow && (
            <>
              <nav aria-label="Primary" className="flex items-center gap-6">
                {visibleNavItems.map((item) => (
                  <NavLink key={item.to} to={item.to} className={navClass}>{item.label}</NavLink>
                ))}
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
            </>
          )}

          {isNarrow && (
            <button
              ref={menuButtonRef}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="p-2 -mr-2 rounded-md text-white hover:bg-white/10"
            >
              {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          )}
        </div>

        {isNarrow && menuOpen && (
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Menu"
            className="border-t border-white/10 bg-white shadow-lg"
          >
            <nav aria-label="Primary" className="py-2">
              {visibleNavItems.map((item) => (
                // onClick closes the panel directly, not just via the [location.pathname] effect
                // below: choosing the destination you're already on leaves the pathname unchanged,
                // so that effect never re-runs and the panel would otherwise stay open (req 4).
                <NavLink key={item.to} to={item.to} className={panelNavClass} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
              {identity && <span className="text-sm text-gray-700 truncate">{identity.email}</span>}
              <button
                onClick={() => logout()}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 shrink-0"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><Outlet /></main>
    </div>
  );
};

export default Layout;
