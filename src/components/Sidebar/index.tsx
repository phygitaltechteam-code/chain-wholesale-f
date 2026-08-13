// components/Sidebar.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  MdInventory2,
  MdPrecisionManufacturing,
  MdAssessment,
  MdLogout,
  MdMenu,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
  MdExpandMore,
  MdGroups,
  MdAccountBalance,
  MdReceipt,
  MdBackup,
  MdAdd,
  MdPersonAdd,
  MdDesignServices,
  MdAccountCircle,
  MdPictureAsPdf,
} from 'react-icons/md';
import { useAuthContext } from '@/context/AuthContext';

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
  isMobile?: boolean;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

interface MenuItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  roles: string[];
  subroutes?: SubMenuItem[];
}

interface SubMenuItem {
  label: string;
  path: string;
  roles: string[];
  icon?: React.ReactNode;
}

const Sidebar = ({
  onCollapseChange,
  isMobile: propIsMobile,
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) => {
  const location = useLocation();
  const { pathname } = location;
  const { user, isAuthenticated } = useAuthContext();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const role = user?.role;
  const isMobileDevice = propIsMobile !== undefined ? propIsMobile : isMobile;

  // ============================================================
  // ALL MENU ITEMS
  // ============================================================
  const allMenuItems: MenuItem[] = [
    {
      label: 'Billing',
      path: '/billing',
      icon: <MdReceipt size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Settlement',
      path: '/setlment/settlement',
      icon: <MdAccountBalance size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Manufacturing',
      path: '/manufacturingprocess/process',
      icon: <MdPrecisionManufacturing size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Stocks',
      path: '/Stocks/stockpage',
      icon: <MdInventory2 size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Client',
      path: '/client/client',
      icon: <MdGroups size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Manufacturing Report',
      path: '/reports/manufacturingreport',
      icon: <MdAssessment size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Backup & Restore',
      path: '/backup&restore',
      icon: <MdBackup size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Add Admin',
      path: '/addadmin',
      icon: <MdPersonAdd size={22} />,
      roles: ['SUPERADMIN'],
    },
    // {
    //   label: 'PDF Header Design',
    //   path: '/pdfdesign',
    //   icon: <MdPictureAsPdf  size={22} />,
    //   roles: ['ADMIN'],
    // },
    {
      label: 'Admin Profile',
      path: '/adminprofile',
      icon: <MdAccountCircle size={22} />,
      roles: ['ADMIN'],
    },
  ];

  // Filter menu items based on user role - use useMemo for performance
  const menuItems = useMemo(() => {
    if (!role) return [];

    const roleFiltered = allMenuItems.filter((item) => {
      const hasRole = item.roles.includes(role);

      return hasRole;
    });
    // Additional UI restriction
    let finalFiltered = roleFiltered;
    if (role === 'SUPERADMIN') {
      finalFiltered = roleFiltered.filter(item => ['Add Admin', 'PDF Header Design', 'Admin Profile'].includes(item.label));
    } else if (role === 'ADMIN') {
      finalFiltered = roleFiltered.filter(item => item.label !== 'Add Admin');
    }

    return finalFiltered;
  }, [role]);

  // Auto-expand menu if subroute is active
  useEffect(() => {
    if (!menuItems.length) return;

    menuItems.forEach((item) => {
      if (item.subroutes) {
        const isSubrouteActive = item.subroutes.some(
          (subroute) => subroute.path && pathname.startsWith(subroute.path)
        );
        if (isSubrouteActive && !isCollapsed && !isMobileDevice) {
          setExpandedMenus((prev) => new Set(prev).add(item.label));
        }
      }
    });
  }, [menuItems, pathname, isCollapsed, isMobileDevice]);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);

      if (width >= 640 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        if (setSidebarOpen) setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (isMobileDevice) {
      setIsMobileMenuOpen(false);
      if (setSidebarOpen) setSidebarOpen(false);
    }
  }, [pathname, isMobileDevice]);

  useEffect(() => {
    if (sidebarOpen !== undefined) {
      setIsMobileMenuOpen(sidebarOpen);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const toggleSubmenu = (label: string) => {
    if (isCollapsed) return;
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const isActive = (itemPath: string) => {
    if (itemPath === '/') {
      return pathname === itemPath;
    }
    if (itemPath !== '/') {
      return pathname.startsWith(itemPath);
    }
    return pathname === itemPath;
  };

  const isSubrouteActive = (subroutePath: string) => {
    return pathname === subroutePath || pathname.startsWith(subroutePath + '/');
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/signin';
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    if (setSidebarOpen) setSidebarOpen(newState);
  };

  const getUserInitials = () => {
    const name = user?.fullname || user?.username || 'User';
    return name
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = () => {
    if (role === 'SUPERADMIN') return 'Super Admin';
    if (role === 'ADMIN') return 'Admin';
    return 'User';
  };

  const getLogoLetter = () => {
    if (role === 'SUPERADMIN') return 'S';
    if (role === 'ADMIN') return 'M';
    return 'G';
  };

  const getPortalName = () => {
    return 'Sona Gold';
  };

  // Debug logging
  console.log('🔄 Sidebar render:', {
    role,
    isAuthenticated,
    menuItemsCount: menuItems.length,
    menuItems: menuItems.map(i => i.label),
    isCollapsed,
    isMobileDevice
  });

  const MobileMenuButton = () => (
    <button
      onClick={toggleMobileMenu}
      className="fixed left-4 top-4 z-50 flex items-center justify-center rounded-lg bg-[#1a1a2e] p-2.5 text-white shadow-lg transition-all hover:bg-[#2a2a3e] active:scale-95 md:hidden"
      aria-label="Toggle menu"
    >
      {isMobileMenuOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
    </button>
  );

  const MobileOverlay = () => (
    <div
      className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-300 md:hidden ${isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      onClick={toggleMobileMenu}
    />
  );

  // Render menu item with subroutes support
  const renderMenuItem = (item: MenuItem) => {
    const hasSubroutes = item.subroutes && item.subroutes.length > 0;
    const isExpanded = expandedMenus.has(item.label);
    const isItemActive = item.path ? isActive(item.path) : false;
    const isAnySubrouteActive =
      hasSubroutes &&
      item.subroutes?.some((subroute) => isSubrouteActive(subroute.path));

    const isActuallyCollapsed = isCollapsed && !isMobileDevice;

    if (hasSubroutes) {
      return (
        <div key={item.label} className="mb-1">
          <button
            onClick={() => {
              if (!isActuallyCollapsed) {
                toggleSubmenu(item.label);
              }
            }}
            className={`group flex w-full items-center justify-between rounded-lg transition-all duration-200 ${isItemActive || isAnySubrouteActive
              ? 'bg-[#B8860B]/10 text-[#B8860B]'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
              } ${isActuallyCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}`}
            title={isActuallyCollapsed ? item.label : ''}
          >
            <div className={`flex items-center ${isActuallyCollapsed ? 'w-full justify-center' : ''}`}>
              <span className={`shrink-0 ${isActuallyCollapsed ? '' : 'mr-3'}`}>
                {item.icon}
              </span>
              {!isActuallyCollapsed && (
                <span className="whitespace-nowrap text-sm font-medium">
                  {item.label}
                </span>
              )}
            </div>
            {!isActuallyCollapsed && (
              <MdExpandMore
                className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                  }`}
                size={18}
              />
            )}
          </button>

          {!isActuallyCollapsed && isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-2">
              {item.subroutes
                .filter((subroute) => !role || subroute.roles.includes(role))
                .map((subroute) => {
                  const isSubActive = isSubrouteActive(subroute.path);
                  return (
                    <Link
                      key={subroute.label}
                      to={subroute.path}
                      onClick={() => {
                        if (isMobileDevice) toggleMobileMenu();
                      }}
                      className={`flex items-center gap-2 rounded-lg py-2 pl-4 pr-3 text-sm transition-all duration-200 ${isSubActive
                        ? 'bg-[#B8860B]/10 text-[#B8860B]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <span className="shrink-0">{subroute.icon}</span>
                      <span>{subroute.label}</span>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      );
    }

    // For items without subroutes
    return (
      <div key={item.label}>
        <Link
          to={item.path!}
          onClick={() => {
            if (isMobileDevice) toggleMobileMenu();
          }}
          className={`group flex items-center rounded-lg transition-all duration-200 ${isActive(item.path!)
            ? 'bg-[#B8860B]/10 text-[#B8860B]'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
            } ${isActuallyCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}`}
          title={isActuallyCollapsed ? item.label : ''}
        >
          <span className={`shrink-0 ${isActuallyCollapsed ? '' : 'mr-3'}`}>
            {item.icon}
          </span>
          {!isActuallyCollapsed && (
            <span className="whitespace-nowrap text-sm font-medium">
              {item.label}
            </span>
          )}
          {isActive(item.path!) && (
            <span className="absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-r-full bg-[#B8860B]"></span>
          )}
          {isCollapsed && !isMobileDevice && (
            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#1a1a2e] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
              {item.label}
            </div>
          )}
        </Link>
      </div>
    );
  };

  const SidebarContent = () => (
    <>
      <div
        className={`mb-6 mt-6 transition-all duration-300 ${isMobileDevice ? 'px-4' : isCollapsed ? 'px-2' : 'px-4'
          }`}
      >
        {isCollapsed && !isMobileDevice ? (
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/20">
              <span className="font-['Playfair_Display'] text-lg font-bold text-[#B8860B]">
                {getLogoLetter()}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center md:text-left">
            <h1 className="font-['Playfair_Display'] text-xl font-bold text-[#B8860B] md:text-2xl">
              {getPortalName()}
            </h1>
            <p className="mt-1 font-['DM_Sans'] text-[8px] uppercase tracking-[0.2em] text-slate-400 md:text-[10px]">
              Gold Chain Manufacturing ERP
            </p>
          </div>
        )}
      </div>

      {!isMobileDevice && !isTablet && (
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-20 z-10 rounded-full bg-[#B8860B] p-1 text-white shadow-md transition-all hover:bg-[#B8860B]/80"
        >
          {isCollapsed ? (
            <MdChevronRight className="h-4 w-4" />
          ) : (
            <MdChevronLeft className="h-4 w-4" />
          )}
        </button>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {menuItems.length > 0 ? (
          menuItems.map((item) => renderMenuItem(item))
        ) : (
          <div className="text-center text-slate-500 text-sm py-4">
            No menu items available
          </div>
        )}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <div
          className={`flex items-center ${isCollapsed && !isMobileDevice ? 'justify-center' : 'gap-3'
            }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B8860B]/20 md:h-10 md:w-10">
            <span className="text-sm font-semibold text-[#B8860B] md:text-base">
              {getUserInitials()}
            </span>
          </div>
          {(!isCollapsed || isMobileDevice) && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.fullname || user?.username || 'User'}
              </p>
              <p className="text-xs text-slate-400">{getRoleDisplay()}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/5 px-2 py-4">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center rounded-lg transition-all duration-200 ${isCollapsed && !isMobileDevice
            ? 'justify-center px-2 py-3'
            : 'px-3 py-2.5 md:px-4 md:py-3'
            } text-slate-400 hover:bg-white/5 hover:text-white`}
          title={isCollapsed && !isMobileDevice ? 'Logout' : ''}
        >
          <MdLogout
            size={20}
            className={`shrink-0 ${isCollapsed && !isMobileDevice ? '' : 'mr-3'}`}
          />
          {(!isCollapsed || isMobileDevice) && (
            <span className="text-xs font-medium tracking-wide md:text-sm">
              Logout
            </span>
          )}
        </button>
      </div>
    </>
  );

  const getSidebarWidth = () => {
    if (isMobileDevice) return 'w-72';
    if (isTablet) return 'w-64';
    return isCollapsed ? 'w-20' : 'w-64';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {isMobileDevice && <MobileMenuButton />}
      <MobileOverlay />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full flex-col bg-[#1a1a2e] shadow-2xl transition-all duration-300 ease-in-out ${getSidebarWidth()} ${isMobileDevice && !isMobileMenuOpen
          ? '-translate-x-full'
          : 'translate-x-0'
          }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;