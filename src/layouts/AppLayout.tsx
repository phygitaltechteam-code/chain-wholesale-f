import { useAuthContext } from '@/context/AuthContext';
import Footer from '@/features/Footer';
import {
  Outlet,
  useNavigate
} from '@tanstack/react-router';
import { useEffect } from 'react';

const AppLayout = () => {
  const {isAuthenticated} = useAuthContext();
  const navigate = useNavigate();

    // useEffect(() => {
    //   !isAuthenticated && navigate({to: '/signin'});
    // }, [isAuthenticated]);

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        {/* Main content */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <main>
            <div className="mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    
    </div>
  );
};

export default AppLayout;
