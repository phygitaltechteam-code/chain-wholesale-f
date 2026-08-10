import Sidebar from '@/components/Sidebar';
import { useAuthContext } from '@/context/AuthContext';
import { Outlet, useNavigate } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';

const AppLayout = () => {
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuthContext();
  
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({
        to: "/signin",
        replace: true,
      });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Get margin based on sidebar state
  const getContentMargin = () => {
    if (isMobile) return 'ml-0';
    return sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]';
  };

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#B8860B] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f9f9f7] dark:bg-slate-950 overflow-hidden">
      {/* Sidebar - fixed position */}
      <div className={`fixed left-0 top-0 h-full z-50 transition-transform duration-300 ${
        isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'
      }`}>
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
          <div className="sticky top-0 z-40 bg-[#f9f9f7] dark:bg-slate-950 border-b border-[#d3c4af]/10 dark:border-slate-700 p-3 flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-[#785600]/10 dark:hover:bg-[#986d00]/20 text-[#785600] dark:text-[#986d00]"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* <h1 className="ml-2 font-headline text-xl font-black italic text-[#1a1a2e]">
              Matoshree Gold
            </h1> */}
          </div>
        )}

        <main className="min-h-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AppLayout;