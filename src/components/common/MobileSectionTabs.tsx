import React from 'react';
import {Link, useLocation} from '@tanstack/react-router';
import {findActiveSection} from '@/components/common/BottomNavbar';

/**
 * Mobile-only tab strip for sections with sub-pages (Karigar, Reports).
 * Renders nothing when the current route doesn't belong to such a section.
 */
const MobileSectionTabs: React.FC = () => {
  const {pathname} = useLocation();
  const active = findActiveSection(pathname);

  if (!active) return null;

  return (
    <div className="sticky top-0 z-30 border-b border-[#d3c4af]/10 bg-[#f9f9f7] px-3 py-2 dark:border-slate-700 dark:bg-slate-950 md:hidden">
      <div
        role="tablist"
        className="no-scrollbar flex gap-2 overflow-x-auto"
        style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
      >
        {active.section.tabs.map((tab) => {
          const isActive = tab.path === active.tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              role="tab"
              aria-selected={isActive}
              className={`flex-1 whitespace-nowrap rounded-lg px-2 py-2 text-center text-xs font-medium sm:px-3 sm:text-sm transition-all ${
                isActive
                  ? 'bg-[#B8860B]/10 font-semibold text-[#986d00] ring-1 ring-[#B8860B]/30 dark:bg-[#B8860B]/20 dark:text-[#cca028]'
                  : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileSectionTabs;
