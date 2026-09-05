import { api } from '@/utils/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface ProfilePayload {
  fullname?: string;
  email?: string;
  phoneNumber?: string;
  secondaryPhoneNumber?: string;
  address?: string;
  city?: string;
  workStartTime?: string | null;
  workEndTime?: string | null;
  currentPassword?: string;
  oldPassword?: string;
  newPassword?: string;
  password?: string;
}

// API call to get user profile data
export const getProfileDataApi = async () => {
  try {
    const response = await api.get('admin/profile');
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch profile data');
    }
    throw error;
  }
};

// Hook for fetching profile data
export const useGetProfileData = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: getProfileDataApi,
  });
};

// API call to update user profile
export const updateProfileApi = async (data: ProfilePayload) => {
  try {
    const response = await api.put('admin/profile', data);
    return response.data;
  } catch (error: any) {
    if (error?.response?.data) {
      const errData = error.response.data;
      if (errData.errors && Array.isArray(errData.errors) && errData.errors.length > 0) {
        const errorDetails = errData.errors
          .map((e: any) => `${e.field || 'Field'}: ${e.message}`)
          .join(', ');
        throw new Error(errorDetails || errData.message || 'Validation failed');
      }
      if (errData.message) {
        throw new Error(errData.message);
      }
    }
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to update profile');
    }
    throw error;
  }
};

// Hook for updating profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfileApi,
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

// API call to activate / submit key
export const activateKeyApi = async (keyData: { key: string }) => {
  try {
    const response = await api.post('/admin/profile/expiry', keyData);
    return response.data;
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to activate key';
    throw new Error(msg);
  }
};

// Hook for activating / submitting license key
export const useActivateKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateKeyApi,
    onSuccess: (data) => {
      toast.success(data?.message || 'License key activated successfully!');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate key');
    },
  });
};


export const useAccessForBackup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accessPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

export const accessPassword = async (data: ProfilePayload) => {
  try {
    const res: any = await api.post('admin/password', data);
    // Axios interceptor returns response.data directly
    if (res?.data !== true) {
      throw new Error(res?.message || 'Password is incorrect');
    }
    return res;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to verify password');
    }
    throw error;
  }
}; 