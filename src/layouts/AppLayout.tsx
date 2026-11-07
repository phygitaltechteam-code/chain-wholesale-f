import Sidebar from '@/components/Sidebar';
import {useAuthContext} from '@/context/AuthContext';
import {Outlet, useNavigate} from '@tanstack/react-router';
import React, {useEffect, useState} from 'react';
import WorkflowGuide from '@/components/common/WorkflowGuide';
import {WeightScaleProvider} from '@/context/WeightScaleContext';
import AdminExpiryModal from '@/components/common/AdminExpiryModal';
import BottomNavbar from '@/components/common/BottomNavbar';
import MobileSectionTabs from '@/components/common/MobileSectionTabs';

const AppLayoutContent: React.FC<{children?: React.ReactNode}> = ({
  children,
}) => {
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

  // Sync sidebar state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true');
      }
    } catch {
      // ignore
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

      // ADMIN should go to billing if they're on addadmin or epinrequest
      if (
        user.role === 'ADMIN' &&
        (currentPath === '/addadmin' || currentPath === '/epinrequest')
      ) {
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
    return sidebarCollapsed ? 'ml-20' : 'ml-64';
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
      {/* Sidebar - fixed position with high z-index on mobile */}
      <div
        className={`fixed left-0 top-0 z-[70] h-full transition-transform duration-300 md:z-50 ${
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
        className={`h-full overflow-y-auto overflow-x-hidden transition-all duration-300 ${!isMobile ? getContentMargin() : 'ml-0'}`}
      >
        {/* Mobile sub-tabs for Karigar / Reports */}
        {isMobile && <MobileSectionTabs />}

        <main className="min-h-full pb-20 md:pb-0">
          {/* {user?.role?.toUpperCase() !== 'SUPERADMIN' && <WorkflowGuide />} */}
          <AdminExpiryModal />
          {children ?? <Outlet />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavbar
        onOpenSidebar={() => setSidebarOpen(true)}
        sidebarOpen={sidebarOpen}
      />

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

const AppLayout: React.FC<{children?: React.ReactNode}> = ({children}) => {
  return (
    <WeightScaleProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </WeightScaleProvider>
  );
};

export default AppLayout;
