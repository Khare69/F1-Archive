import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';

export interface EngineeringSubNavItem {
  to: string;
  label: string;
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
      className="sticky top-14 z-30 flex items-center gap-1.5 border-b border-white/10 bg-surface/90 px-4 py-2 backdrop-blur-md overflow-x-auto no-scrollbar"
    >
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mr-2 shrink-0">
        ENGINEERING //
      </span>
      {ENGINEERING_NAV_ITEMS.map((item) => {
        const isActive = location.pathname.startsWith(item.to);
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

export const EngineeringHub: React.FC = () => {
  const location = useLocation();

  if (location.pathname === '/engineering' || location.pathname === '/engineering/') {
    return <Navigate replace to="/telemetry" />;
  }

  return (
    <div className="flex flex-col min-h-full w-full">
      <EngineeringSubNav />
      <div className="flex-1 w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default EngineeringHub;
