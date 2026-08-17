import Sidebar from '@/components/Sidebar';
import {useAuthContext} from '@/context/AuthContext';
import {Outlet, useNavigate} from '@tanstack/react-router';
import React, {useEffect, useState} from 'react';
import {Menu} from 'lucide-react';

const AppLayout: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {isAuthenticated, isLoading, user} = useAuthContext();
  const [isReady, setIsReady] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true');
    }
  }, []);

  // Wait for auth to be ready
  useEffect(() => {
    if (!isLoading) {
      setIsReady(true);
    }
  }, [isLoading]);

  // Redirect based on user role
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const currentPath = window.location.pathname;

      // SUPERADMIN should go to addadmin if they're on billing
      if (user.role === 'SUPERADMIN' && currentPath === '/billing') {
        navigate({to: '/addadmin', replace: true});
      }

      // ADMIN should go to billing if they're on addadmin
      if (user.role === 'ADMIN' && currentPath === '/addadmin') {
        navigate({to: '/billing', replace: true});
      }
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({
        to: '/signin',
        replace: true,
      });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Get margin based on sidebar state
  const getContentMargin = () => {
    if (isMobile) return 'ml-0';
    return sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]';
  };

  // Show loading if still checking authentication
  if (isLoading || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#B8860B] border-t-transparent"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f9f9f7] dark:bg-slate-950">
      {/* Sidebar - fixed position */}
      <div
        className={`fixed left-0 top-0 z-50 h-full transition-transform duration-300 ${
          isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <Sidebar
          onCollapseChange={setSidebarCollapsed}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      {/* Main content */}
      <div
        className={`h-full overflow-y-auto transition-all duration-300 ${!isMobile ? getContentMargin() : 'ml-0'}`}
      >
        {/* Mobile Header with Hamburger Menu */}
        {isMobile && (
          <div className="sticky top-0 z-40 flex items-center border-b border-[#d3c4af]/10 bg-[#f9f9f7] p-3 dark:border-slate-700 dark:bg-slate-950">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-[#785600] hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}

        <main className="min-h-full">{children ?? <Outlet />}</main>
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AppLayout;
