import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';

export interface ArchiveSubNavItem {
  to: string;
  label: string;
}

export const ARCHIVE_NAV_ITEMS: ArchiveSubNavItem[] = [
  { to: '/standings', label: 'STANDINGS' },
  { to: '/seasons', label: 'SEASONS' },
  { to: '/drivers', label: 'DRIVERS' },
  { to: '/drivers/compare', label: 'COMPARE' },
  { to: '/teams', label: 'CONSTRUCTORS' },
  { to: '/circuits', label: 'CIRCUITS' },
];

export const ArchiveSubNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav
      aria-label="Archive Sub-navigation"
      className="sticky top-14 z-30 flex items-center gap-1.5 border-b border-white/10 bg-surface/90 px-4 py-2 backdrop-blur-md overflow-x-auto no-scrollbar"
    >
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mr-2 shrink-0">
        ARCHIVE //
      </span>
      {ARCHIVE_NAV_ITEMS.map((item) => {
        const isActive =
          item.to === '/drivers'
            ? location.pathname.startsWith('/drivers') && !location.pathname.startsWith('/drivers/compare')
            : location.pathname.startsWith(item.to);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`whitespace-nowrap px-3 py-1 font-mono text-xs tracking-wider transition-colors rounded-sm ${
              isActive
                ? 'bg-crimson/20 text-white font-bold border-b-2 border-crimson'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
};

export const ArchiveHub: React.FC = () => {
  const location = useLocation();

  if (location.pathname === '/archive' || location.pathname === '/archive/') {
    return <Navigate replace to="/seasons" />;
  }

  return (
    <div className="flex flex-col min-h-full w-full">
      <ArchiveSubNav />
      <div className="flex-1 w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default ArchiveHub;
