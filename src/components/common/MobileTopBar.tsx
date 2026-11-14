import React, {useState} from 'react';
import {useLocation} from '@tanstack/react-router';
import {MdMenu} from 'react-icons/md';
import {LogOut} from 'lucide-react';

interface MobileTopBarProps {
  onMenu: () => void;
}

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');
  sessionStorage.clear();
  window.location.href = '/signin';
};

/**
 * Mobile-only top bar with a menu button that opens the sidebar.
 * Used for roles that have no bottom navigation (Super Admin).
 * Shows a Logout button at the top right on the Add Admin page.
 */
const MobileTopBar: React.FC<MobileTopBarProps> = ({onMenu}) => {
  const {pathname} = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const showLogout = pathname.toLowerCase().startsWith('/addadmin');

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#d3c4af]/20 bg-[#f9f9f7]/95 px-3 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-950/95 md:hidden">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#785600] transition-colors hover:bg-[#B8860B]/10 active:scale-95 dark:text-amber-400 dark:hover:bg-slate-800"
        >
          <MdMenu size={24} />
        </button>

        {showLogout && (
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 active:scale-95 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs overflow-hidden rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white">
                Confirm Logout
              </h3>
              <p className="mt-1 text-xs text-[#4f4535] dark:text-slate-400">
                Are you sure you want to log out of your account?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[#d3c4af]/20 bg-[#f9f9f7] p-3 dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="hover:bg-gray-50 rounded-lg border border-[#d3c4af]/40 bg-white px-3 py-2 text-xs font-semibold text-[#4f4535] transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileTopBar;
