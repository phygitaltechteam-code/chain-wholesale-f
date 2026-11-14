import React, {useEffect, useMemo} from 'react';
import {Link, useLocation} from '@tanstack/react-router';
import {
  MdAutoGraph,
  MdReceipt,
  MdInventory2,
  MdPrecisionManufacturing,
  MdAssessment,
  MdAccountCircle,
} from 'react-icons/md';
import {useAuthContext} from '@/context/AuthContext';

interface BottomNavbarProps {
  onOpenSidebar?: () => void;
  sidebarOpen?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
}

export interface SectionTab {
  label: string;
  path: string;
  isActive: (lowerPath: string) => boolean;
}

export interface Section {
  id: 'karigar' | 'reports' | 'sales';
  storageKey: string;
  /** Tab opened when nothing is remembered (defaults to the first tab). */
  defaultPath?: string;
  tabs: SectionTab[];
}

// Sub-tabs shown on mobile for the Karigar and Reports bottom items.
// Paths reuse the existing routes from the sidebar.
export const SECTION_TABS: Section[] = [
  {
    id: 'karigar',
    storageKey: 'mobile-tab-karigar',
    defaultPath: '/karigarbilling',
    tabs: [
      {
        label: 'Add Bill',
        path: '/karigarbillingadd',
        isActive: (p) => p.startsWith('/karigarbillingadd'),
      },
      {
        label: 'Purchase List',
        path: '/karigarbilling',
        isActive: (p) =>
          p === '/karigarbilling' ||
          p.startsWith('/karigarbilling/') ||
          p.startsWith('/karigarbilliupdate'),
      },
      {
        label: 'Settlement',
        path: '/karigarsetlment',
        isActive: (p) => p.startsWith('/karigarsetlment'),
      },
    ],
  },
  {
    id: 'sales',
    storageKey: 'mobile-tab-sales',
    defaultPath: '/billing',
    tabs: [
      {
        label: 'Add Bill',
        path: '/receipt/addreciept',
        isActive: (p) => p.startsWith('/receipt/addreciept'),
      },
      {
        label: 'Client List',
        path: '/billing',
        isActive: (p) => p.startsWith('/billing') || p.startsWith('/billiupdate'),
      },
      {
        label: 'Settlement',
        path: '/setlment/settlement',
        isActive: (p) => p.startsWith('/setlment/settlement'),
      },
    ],
  },
  {
    id: 'reports',
    storageKey: 'mobile-tab-reports',
    tabs: [
      {
        label: 'Daily Report',
        path: '/reports/todayreport',
        isActive: (p) => p.startsWith('/reports/todayreport'),
      },
      {
        label: 'Karigar Inward',
        path: '/reports/inwardreport',
        isActive: (p) => p.startsWith('/reports/inwardreport'),
      },
      {
        label: 'Business 360',
        path: '/reports/stockledgerreport',
        isActive: (p) => p.startsWith('/reports/stockledgerreport'),
      },
    ],
  },
];

export const findActiveSection = (pathname: string) => {
  const p = pathname.toLowerCase();
  for (const section of SECTION_TABS) {
    const tab = section.tabs.find((t) => t.isActive(p));
    if (tab) return {section, tab};
  }
  return null;
};

const getSection = (id: Section['id']) =>
  SECTION_TABS.find((s) => s.id === id)!;

// Last visited tab of a section, so returning to it restores the same tab.
const getStoredTabPath = (section: Section) => {
  try {
    const saved = sessionStorage.getItem(section.storageKey);
    if (saved && section.tabs.some((t) => t.path === saved)) return saved;
  } catch {
    // ignore
  }
  return section.defaultPath ?? section.tabs[0].path;
};

const BottomNavbar: React.FC<BottomNavbarProps> = ({
  onOpenSidebar,
  sidebarOpen = false,
}) => {
  const location = useLocation();
  const pathname = location.pathname;
  const lowerPath = pathname.toLowerCase();
  const {user} = useAuthContext();

  const role = useMemo(() => {
    if (user?.role) return user.role.toUpperCase();
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return (parsed?.role || '').toUpperCase();
      }
    } catch {
      // ignore
    }
    return null;
  }, [user]);

  // Remember the active Karigar / Reports tab
  const activeSection = findActiveSection(pathname);
  useEffect(() => {
    if (!activeSection) return;
    try {
      sessionStorage.setItem(
        activeSection.section.storageKey,
        activeSection.tab.path,
      );
    } catch {
      // ignore
    }
  }, [activeSection?.section.storageKey, activeSection?.tab.path]);

  const karigarSection = getSection('karigar');
  const reportsSection = getSection('reports');
  const salesSection = getSection('sales');

  // Primary bottom navigation items for ADMIN
  const adminMainItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      path: '/reports/realtimegoldreport',
      icon: <MdAutoGraph size={22} />,
      isActive: (path) =>
        path === '/dashboard' || path.startsWith('/reports/realtimegoldreport'),
    },
    {
      id: 'karigar',
      label: 'Karigar',
      path: getStoredTabPath(karigarSection),
      icon: <MdPrecisionManufacturing size={22} />,
      isActive: (path) => karigarSection.tabs.some((t) => t.isActive(path)),
    },
    {
      id: 'stocks',
      label: 'Stocks',
      path: '/Stocks/stockpage',
      icon: <MdInventory2 size={22} />,
      isActive: (path) => path.startsWith('/stocks') || path.startsWith('/stock'),
    },
    {
      id: 'sales',
      label: 'Sales',
      path: getStoredTabPath(salesSection),
      icon: <MdReceipt size={22} />,
      isActive: (path) => salesSection.tabs.some((t) => t.isActive(path)),
    },
    {
      id: 'reports',
      label: 'Reports',
      path: getStoredTabPath(reportsSection),
      icon: <MdAssessment size={22} />,
      isActive: (path) => reportsSection.tabs.some((t) => t.isActive(path)),
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/adminprofile',
      icon: <MdAccountCircle size={22} />,
      isActive: (path) => path.startsWith('/adminprofile'),
    },
  ];

  // Super Admin has no bottom bar on mobile (uses MobileTopBar + sidebar).
  if (role === 'SUPERADMIN') return null;

  const mainNavItems = adminMainItems;

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d3c4af]/30 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex h-16 items-center justify-around px-1">
        {/* Main Module Tabs */}
        {mainNavItems.map((item) => {
          const active = !sidebarOpen && item.isActive(lowerPath);
          return (
            <Link
              key={item.id}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 ${
                active
                  ? 'text-[#986d00] dark:text-[#B8860B]'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {/* Active Indicator Pip */}
              {active && (
                <span className="absolute top-0 h-1 w-7 rounded-full bg-[#B8860B] shadow-[0_0_6px_rgba(184,134,11,0.5)]" />
              )}

              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-transform ${
                  active ? 'scale-110' : ''
                }`}
              >
                {item.icon}
              </div>

              <span
                className={`mt-0.5 max-w-[56px] truncate text-[11px] font-medium leading-tight ${
                  active
                    ? 'font-bold text-[#986d00] dark:text-[#B8860B]'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar;
