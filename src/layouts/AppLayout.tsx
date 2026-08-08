import Sidebar from '@/components/Sidebar';
import { useAuthContext } from '@/context/AuthContext';
import { Outlet, useNavigate } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';

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

  // Get margin left based on sidebar state
  const getMarginLeft = () => {
    if (isMobile) {
      return 'ml-0'; // No margin on mobile
    }
    return sidebarCollapsed ? 'ml-20' : 'ml-64';
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
      <div className="flex h-full">
        {/* Sidebar */}
        <Sidebar
          onCollapseChange={setSidebarCollapsed}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main content - no scrolling */}
        <div
          className={`relative flex flex-1 flex-col transition-all duration-300 ${getMarginLeft()}`}
        >
          <main className="flex-1 overflow-visible">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;