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
} from 'react-icons/md';
import {useAuthContext} from '@/context/AuthContext';

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

const Sidebar = ({onCollapseChange}: SidebarProps) => {
  const location = useLocation();
  const {pathname} = location;
  const {user, isAuthenticated} = useAuthContext();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Get user role from context
  const role = user?.role;

  // Check if screen is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
      label: 'Accounts',
      path: '/accounts',
      icon: <MdAccountBalanceWallet size={22} />,
      roles: ['SUPERADMIN', 'ADMIN'],
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
      roles: ['SUPERADMIN', 'ADMIN'],
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
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onCollapseChange) {
      onCollapseChange(newState);
    }
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

  // Mobile menu button
  const MobileMenuButton = () => (
    <button
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      className="fixed left-4 top-4 z-50 rounded-lg bg-[#1a1a2e] p-2 text-white shadow-lg md:hidden"
      aria-label="Toggle menu"
    >
      {isMobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
    </button>
  );

  // Mobile overlay
  const MobileOverlay = () => (
    <div
      className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
        isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={() => setIsMobileMenuOpen(false)}
    />
  );

  // Sidebar content
  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div
        className={`mb-6 px-4 pt-4 transition-all duration-300 md:mb-10 md:px-6 md:pt-6 ${!isMobile && isCollapsed ? 'md:px-2' : ''}`}
      >
        {!isMobile && isCollapsed ? (
          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B8860B]/20">
              <span className="font-['Playfair_Display'] text-sm font-bold text-[#B8860B]">
                {role === 'SUPERADMIN' ? 'S' : role === 'ADMIN' ? 'M' : 'B'}
              </span>
            </div>
          </div>
        ) : (
          <>
            <h1 className="whitespace-nowrap font-['Playfair_Display'] text-lg font-bold text-[#B8860B] md:text-xl">
              BullionPro ERP
            </h1>
            <p className="mt-1 whitespace-nowrap font-['DM_Sans'] text-[8px] uppercase tracking-[0.2em] text-slate-400 md:text-[10px]">
              {role === 'ADMIN' ? 'Mall Management' : 'The Digital Goldsmith'}
            </p>
          </>
        )}
      </div>

      {/* Collapse Toggle Button (Desktop only) */}
      {!isMobile && (
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-20 hidden rounded-full bg-[#B8860B] p-1 text-white shadow-md transition-all hover:bg-[#B8860B]/80 md:block"
        >
          <MdChevronLeft
            className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 md:px-3">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            onClick={() => {
              if (isMobile) setIsMobileMenuOpen(false);
            }}
            className={`flex items-center rounded-lg px-2 py-2 font-['DM_Sans'] text-xs font-medium tracking-wide transition-colors md:px-3 md:py-2.5 md:text-sm ${
              isActive(item.path)
                ? 'border-r-4 border-[#B8860B] bg-[#B8860B]/10 text-[#B8860B]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            } ${!isMobile && isCollapsed ? 'justify-center md:px-2' : ''}`}
            title={!isMobile && isCollapsed ? item.label : ''}
          >
            <span
              className={`${!isMobile && isCollapsed ? 'mr-0' : 'mr-2 md:mr-3'}`}
            >
              {item.icon}
            </span>
            {!isMobile && isCollapsed ? null : (
              <span className="whitespace-nowrap">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* User Info Section */}
      <div className="border-t border-white/10 px-3 py-3">
        <div
          className={`flex items-center ${!isMobile && isCollapsed ? 'justify-center' : 'space-x-3'}`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B8860B]/20">
            <span className="text-sm font-semibold text-[#B8860B]">
              {getUserInitials()}
            </span>
          </div>
          {(!isMobile || !isCollapsed) && (
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                {user?.fullname || user?.username || 'User'}
              </p>
              <p className="text-xs text-slate-400">{getRoleDisplay()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-auto border-t border-white/5 px-2 py-3 md:px-3 md:py-4">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center rounded-lg px-2 py-2 font-['DM_Sans'] text-xs font-medium tracking-wide text-slate-400 transition-colors hover:text-white md:px-3 md:py-2.5 md:text-sm ${
            !isMobile && isCollapsed ? 'justify-center' : ''
          }`}
          title={!isMobile && isCollapsed ? 'Logout' : ''}
        >
          <MdLogout
            size={20}
            className={`${!isMobile && isCollapsed ? 'mr-0' : 'mr-2 md:mr-3'}`}
          />
          {!isMobile && isCollapsed ? null : 'Logout'}
        </button>
      </div>
    </>
  );

  // Sidebar width classes
  const getSidebarWidth = () => {
    if (isMobile) {
      return 'w-64';
    }
    return isCollapsed ? 'w-20' : 'w-64';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <MobileMenuButton />
      <MobileOverlay />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full flex-col bg-[#1a1a2e] shadow-xl transition-transform duration-300 ${getSidebarWidth()} ${
          isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
