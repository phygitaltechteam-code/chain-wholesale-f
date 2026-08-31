import { api } from '@/utils/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface AdminPayload {
  id?: string;
  fullname: string;
  shopName?: string;
  email?: string;
  username: string;
  password?: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  address: string;
  pincode?: string;
  city?: string;
  district?: string;
  state?: string;
  price?: number | string;
  renewalCharges?: number | string;
  accessType: 'ONLINE' | 'OFFLINE' | 'TRAIL' | 'TRIAL' | string;
  expiryDate?: string;
  key?: string;
  role?: string;
  extendKey?: string | null;
  extendDays?: number | string | null;
}

// API call to fetch all admins
export const getAdminsApi = async () => {
  try {
    const response = await api.get('/superAdmin/admin');
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch admins');
    }
    throw error;
  }
};

// Hook to fetch admins
export const useGetAdmins = () => {
  return useQuery({
    queryKey: ['admins'],
    queryFn: getAdminsApi,
  });
};

// API call to fetch single admin by ID
export const getAdminByIdApi = async (id: string) => {
  if (!id) return null;
  try {
    const response = await api.get(`/superAdmin/admin/${id}`);
    return response.data?.data || response.data;
  } catch (error: any) {
    try {
      const fallback = await api.get(`/users/${id}`);
      return fallback.data?.data || fallback.data;
    } catch {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to fetch admin details');
      }
      throw error;
    }
  }
};

// Hook to fetch single admin by ID
export const useGetAdminById = (id?: string) => {
  return useQuery({
    queryKey: ['admin', id],
    queryFn: () => getAdminByIdApi(id!),
    enabled: !!id,
  });
};

// API call to create a new admin
export const createAdminApi = async (data: AdminPayload) => {
  try {
    const response = await api.post('/users/self-register', data);
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to create admin');
    }
    throw error;
  }
};

// Hook for creating an admin
export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminApi,
    onSuccess: () => {
      toast.success('Admin created successfully');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create admin');
    },
  });
};

// API call to update an admin
export const updateAdminApi = async ({
  id,
  userId,
  data,
}: {
  id: string;
  userId?: string;
  data: AdminPayload;
}) => {
  try {
    const response = await api.put(`/superAdmin/admin/${id}`, data);
    return response.data;
  } catch (error: any) {
    if (userId && userId !== id) {
      try {
        const fallback1 = await api.put(`/superAdmin/admin/${userId}`, data);
        return fallback1.data;
      } catch {
        try {
          const fallback2 = await api.put(`/users/${userId}`, data);
          return fallback2.data;
        } catch {
          // ignore fallback failures and throw original
        }
      }
    }
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to update admin');
    }
    throw error;
  }
};

// Hook for updating an admin
export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminApi,
    onSuccess: () => {
      toast.success('Admin updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update admin');
    },
  });
};

// API call to delete an admin
export const deleteAdminApi = async (
  param: string | { id: string; userId?: string },
) => {
  const id = typeof param === 'string' ? param : param.id;
  const userId = typeof param === 'object' ? param.userId : undefined;

  try {
    const response = await api.delete(`/superAdmin/admin/${id}`);
    return response.data;
  } catch (error: any) {
    // If FK constraint or error occurs and userId is available, try fallback endpoints with userId
    if (userId && userId !== id) {
      try {
        const fallback1 = await api.delete(`/superAdmin/admin/${userId}`);
        return fallback1.data;
      } catch {
        try {
          const fallback2 = await api.delete(`/users/${id}`);
          return fallback2.data;
        } catch {
          // ignore fallback failures and throw original
        }
      }
    }
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to delete admin');
    }
    throw error;
  }
};

// Hook for deleting an admin
export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminApi,
    onSuccess: () => {
      toast.success('Admin deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete admin');
    },
  });
};
