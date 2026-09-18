import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Get all processes
export const useGetProcesses = () => {
  return useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      const response = await api.get('/admin/karigar/process');
      return response.data?.data || response.data || [];
    },
  });
};

// Add process
export const useAddProcess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {name: string}) => {
      const response = await api.post('/admin/karigar/process', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['processes']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add process');
    },
  });
};

// Update process
export const useUpdateProcess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, name}: {id: string; name: string}) => {
      const response = await api.patch(`/admin/karigar/process/${id}`, {name});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['processes']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update process');
    },
  });
};

// Delete process
export const useDeleteProcess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/karigar/process/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['processes']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete process');
    },
  });
};
