import {useAuthContext} from '@/context/AuthContext';

export const usePermission = (_permissionKey?: string) => {
  const {user} = useAuthContext();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  return {
    canView: true,
    canEdit: isAdmin ?? true,
    canDelete: isAdmin ?? true,
  };
};
