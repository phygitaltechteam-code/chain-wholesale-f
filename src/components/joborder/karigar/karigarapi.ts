import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface KarigarData {
  id: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
  type: 'IN_HOUSE' | 'OUT_SOURCE';
  password?: string;
  salary?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Get all karigars
export const useGetKarigars = () => {
  return useQuery({
    queryKey: ['karigars'],
    queryFn: async () => {
      const response = await api.get('/admin/karigar');
      return response.data?.data || response.data || [];
    },
  });
};

// Add karigar
export const useAddKarigar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      fullName: string;
      phoneNumber: string;
      address?: string;
      type: 'IN_HOUSE' | 'OUT_SOURCE';
      password?: string;
      salary?: number;
      openingBalance?: number;
    }) => {
      const response = await api.post('/admin/karigar', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['karigars']});
      toast.success('Karigar added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add karigar');
    },
  });
};

// Update karigar
export const useUpdateKarigar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fullName,
      phoneNumber,
      address,
      type,
      password,
      salary,
    }: {
      id: string;
      fullName: string;
      phoneNumber: string;
      address?: string;
      type: 'IN_HOUSE' | 'OUT_SOURCE';
      password?: string;
      salary?: number;
    }) => {
      const response = await api.patch(`/admin/karigar/${id}`, {
        fullName,
        phoneNumber,
        address,
        type,
        password,
        salary,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['karigars']});
      toast.success('Karigar updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update karigar');
    },
  });
};

// Delete karigar
export const useDeleteKarigar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/karigar/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['karigars']});
      toast.success('Karigar deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete karigar');
    },
  });
};

export const useSubmitJobKarigar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      jobId: string;
      karigarId: string;
      processId: string;
      issueDate: string;
      goldIssued: number;
      status: 'in-progress' | 'completed' | 'cancelled';
      jobStageCrystals: {
        crystalId: string;
        qty: number;
      }[];
    }) => {
      const response = await api.post('/admin/karigar/stage', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['jobs']});
      toast.success('Job karigar submitted successfully');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to submit job karigar',
      );
    },
  });
};

export const useGetkarigarStage = () => {
  return useQuery({
    queryKey: ['karigarStage'],
    queryFn: async () => {
      const response = await api.get('/admin/karigar/stage');
      return response.data?.data || response.data || [];
    },
  });
};

export const useGetKarigerById = (id: string) => {
  return useQuery({
    queryKey: ['karigar', id],
    queryFn: async () => {
      const response = await api.get(`/admin/karigar/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
  });
};
