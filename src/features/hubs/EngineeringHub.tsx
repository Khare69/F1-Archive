import React from 'react';
import { NavLink, Outlet, useLocation, Navigate, Link } from 'react-router-dom';

export interface EngineeringSubNavItem {
  to: string;
  label: string;
  badge?: string;
}

export const ENGINEERING_NAV_ITEMS: EngineeringSubNavItem[] = [
  { to: '/telemetry', label: 'TELEMETRY GHOST REPLAY' },
  { to: '/pitwall', label: 'PIT-WALL STRATEGY' },
];

export const EngineeringSubNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav
      aria-label="Engineering Sub-navigation"
      className="sticky top-14 z-30 flex items-center justify-between border-b border-white/10 bg-[#11151E]/95 px-4 py-2 backdrop-blur-md overflow-x-auto no-scrollbar"
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#8494AB] mr-2 shrink-0">
          RACE ENGINEERING //
        </span>
        {ENGINEERING_NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`relative whitespace-nowrap px-3 py-1 font-mono text-xs tracking-wider transition-colors rounded-sm ${
                isActive
                  ? 'bg-white/5 text-white font-bold border-b-2 border-[#E10600]'
                  : 'text-[#8494AB] hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </NavLink>
          );
        })}
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        <Link
          to="/historian"
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono tracking-wider text-[#8494AB] hover:text-white border border-white/10 hover:border-white/20 rounded transition-colors"
          title="Open SQLite Historian"
        >
          <span className="text-[#E10600]">SQL</span> HISTORIAN ↗
        </Link>
      </div>
    </nav>
  );
};

export const EngineeringHub: React.FC = () => {
  const location = useLocation();

  if (location.pathname === '/engineering' || location.pathname === '/engineering/') {
    return <Navigate replace to="/telemetry" />;
  }

  return (
    <div className="flex flex-col min-h-full w-full bg-[#090B10]">
      <EngineeringSubNav />
      <div className="flex-1 w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default EngineeringHub;
