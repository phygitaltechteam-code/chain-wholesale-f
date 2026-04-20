import React, {useState, useEffect} from 'react';
import {Link, useLocation} from '@tanstack/react-router';
import {
  MdDashboard,
  MdTrendingUp,
  MdGroup,
  MdReceiptLong,
  MdLocalShipping,
  MdInventory2,
  MdAccountBalanceWallet,
  MdPrecisionManufacturing,
  MdEngineering,
  MdAssessment,
  MdSettings,
  MdLogout,
  MdMenu,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
} from 'react-icons/md';
import {useAuthContext} from '@/context/AuthContext';

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
  isMobile?: boolean;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

const Sidebar = ({
  onCollapseChange,
  isMobile: propIsMobile,
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) => {
  const location = useLocation();
  const {pathname} = location;
  const {user, isAuthenticated} = useAuthContext();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Get user role from context
  const role = user?.role;

  // Use prop isMobile or calculate
  const isMobileDevice = propIsMobile !== undefined ? propIsMobile : isMobile;

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);

      // Auto-close mobile menu on larger screens
      if (width >= 640 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        if (setSidebarOpen) setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobileDevice) {
      setIsMobileMenuOpen(false);
      if (setSidebarOpen) setSidebarOpen(false);
    }
  }, [pathname, isMobileDevice]);

  // Sync with parent sidebarOpen state
  useEffect(() => {
    if (sidebarOpen !== undefined) {
      setIsMobileMenuOpen(sidebarOpen);
    }
  }, [sidebarOpen]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Save collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  // All menu items with role-based visibility
  const allMenuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <MdDashboard size={22} />,
      roles: ['SUPERADMIN', 'ADMIN', 'SHOP'],
    },
    {
      label: 'Rate Management',
      path: '/rate/ratemanagement',
      icon: <MdTrendingUp size={22} />,
      roles: ['SUPERADMIN', 'ADMIN', 'SHOP'],
    },
    {
      label: 'Clients',
      path: '/client/clientdirectory',
      icon: <MdGroup size={22} />,
      roles: ['SUPERADMIN', 'ADMIN', 'SHOP'],
    },
    {
      label: 'Billing',
      path: '/billing/Billing',
      icon: <MdReceiptLong size={22} />,
      roles: ['SUPERADMIN', 'ADMIN', 'SHOP'],
    },
    {
      label: 'Bookings & Delivery',
      path: '/bookdelivery/bookings-delivery',
      icon: <MdLocalShipping size={22} />,
      roles: ['SUPERADMIN', 'ADMIN', 'SHOP'],
    },
    {
      label: 'Inventory',
      path: '/inventory/Inventory',
      icon: <MdInventory2 size={22} />,
      roles: ['SUPERADMIN', 'ADMIN', 'SHOP'],
    },
    {
      label: 'Jewellery Job Work',
      path: '/JewlleryWork/jewelleryworkdata',
      icon: <MdPrecisionManufacturing size={22} />,
      roles: ['SUPERADMIN', 'ADMIN'],
    },
    {
      label: 'Karigars',
      path: '/kariger/karigers',
      icon: <MdEngineering size={22} />,
      roles: ['SUPERADMIN', 'ADMIN', 'SHOP'],
    },
    {
      label: 'Reports',
      path: '/report',
      icon: <MdAssessment size={22} />,
      roles: ['SUPERADMIN', 'ADMIN', 'SHOP'],
    },
    {
      label: 'Settings',
      path: '/setting',
      icon: <MdSettings size={22} />,
      roles: ['SUPERADMIN', 'ADMIN', 'SHOP'],
    },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter((item) => {
    if (!role) return false;
    return item.roles.includes(role);
  });

  const isActive = (itemPath: string) => {
    if (itemPath === '/dashboard') {
      return pathname === itemPath;
    }
    if (itemPath !== '/') {
      return pathname.startsWith(itemPath);
    }
    return pathname === itemPath;
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

  // Get user initials
  const getUserInitials = () => {
    const name = user?.fullname || user?.username || 'User';
    return name
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role display name
  const getRoleDisplay = () => {
    if (role === 'SUPERADMIN') return 'Super Admin';
    if (role === 'ADMIN') return 'Mall Admin';
    if (role === 'SHOP') return 'Shop Owner';
    return 'User';
  };

  // Get logo letter
  const getLogoLetter = () => {
    if (role === 'SUPERADMIN') return 'S';
    if (role === 'ADMIN') return 'M';
    return 'B';
  };

  // Get portal name
  const getPortalName = () => {
    if (role === 'SUPERADMIN') return 'Super Admin';
    if (role === 'ADMIN') return 'Mall Admin';
    return 'BullionPro ERP';
  };

  // Mobile menu button
  const MobileMenuButton = () => (
    <button
      onClick={toggleMobileMenu}
      className="fixed left-4 top-4 z-50 flex items-center justify-center rounded-lg bg-[#1a1a2e] p-2.5 text-white shadow-lg transition-all hover:bg-[#2a2a3e] active:scale-95 md:hidden"
      aria-label="Toggle menu"
    >
      {isMobileMenuOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
    </button>
  );

  // Mobile overlay
  const MobileOverlay = () => (
    <div
      className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-300 md:hidden ${
        isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
      onClick={toggleMobileMenu}
    />
  );

  // Sidebar content
  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div
        className={`mb-6 mt-6 transition-all duration-300 ${
          isMobileDevice ? 'px-4' : isCollapsed ? 'px-2' : 'px-4'
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
              {role === 'ADMIN' ? 'Mall Management' : 'The Digital Goldsmith'}
            </p>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
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

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            onClick={() => {
              if (isMobileDevice) toggleMobileMenu();
            }}
            className={`group relative flex items-center rounded-lg transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-[#B8860B]/10 text-[#B8860B]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            } ${
              isCollapsed && !isMobileDevice
                ? 'justify-center px-2 py-3'
                : 'px-3 py-2.5 md:px-4 md:py-3'
            }`}
            title={isCollapsed && !isMobileDevice ? item.label : ''}
          >
            <span
              className={`shrink-0 ${isCollapsed && !isMobileDevice ? '' : 'mr-3'}`}
            >
              {item.icon}
            </span>
            {(!isCollapsed || isMobileDevice) && (
              <span className="whitespace-nowrap text-xs font-medium tracking-wide md:text-sm">
                {item.label}
              </span>
            )}
            {/* Active indicator */}
            {isActive(item.path) && (
              <span className="absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-r-full bg-[#B8860B]"></span>
            )}
            {/* Tooltip for collapsed state */}
            {isCollapsed && !isMobileDevice && (
              <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#1a1a2e] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
                {item.label}
              </div>
            )}
          </Link>
        ))}
      </nav>

      {/* User Info Section */}
      <div className="border-t border-white/10 px-3 py-4">
        <div
          className={`flex items-center ${isCollapsed && !isMobileDevice ? 'justify-center' : 'gap-3'}`}
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

      {/* Logout Button */}
      <div className="border-t border-white/5 px-2 py-4">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center rounded-lg transition-all duration-200 ${
            isCollapsed && !isMobileDevice
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

  // Sidebar width classes
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
      {/* Mobile menu button */}
      {isMobileDevice && <MobileMenuButton />}
      <MobileOverlay />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full flex-col bg-[#1a1a2e] shadow-2xl transition-all duration-300 ease-in-out ${getSidebarWidth()} ${
          isMobileDevice && !isMobileMenuOpen
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
