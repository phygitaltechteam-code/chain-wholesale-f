import Sidebar from '@/components/Sidebar';
import { useAuthContext } from '@/context/AuthContext';
import { Outlet, useNavigate } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';

const AppLayout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  console.log('AppLayout - isAuthenticated:', isAuthenticated);
  console.log('AppLayout - User:', user);
  console.log('AppLayout - User Role:', user?.role);

  // Check if screen is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/signin', replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    <div className="min-h-screen bg-[#f9f9f7]">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar onCollapseChange={setSidebarCollapsed} />

        {/* Main content */}
        <div
          className={`relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden transition-all duration-300 ${getMarginLeft()}`}
        >
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;