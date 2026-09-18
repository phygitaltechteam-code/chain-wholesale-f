import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';


export const useKarigarBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveKarigarBillApi,
    onSuccess: () => {
      toast.success('Bill added successfully');
      queryClient.invalidateQueries({queryKey: ['karigar-bill']});
      queryClient.invalidateQueries({queryKey: ['bill']});
      queryClient.invalidateQueries({queryKey: ['clients']});
      queryClient.invalidateQueries({queryKey: ['stock-report']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Insufficient stock');
    },
  });
};

const saveKarigarBillApi = async (data: any) => {
  const response = await api.post('/admin/karigar-purchase', data);
  return response.data;
};


export const useGetKarigarBill = () => {
  return useQuery({
    queryKey: ['karigar-bill'],
    queryFn: getKarigarBillAll,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

export const getKarigarBillAll = async () => {
  try {
    const response = await api.get('/admin/karigar-purchase');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch joint entries');
    }
    throw error;
  }
};

export const useGetKarigarBillByid = (id: string) => {
  return useQuery({
    queryKey: ['karigar-bill', id],
    queryFn: async () => {
      const response = await api.get(`/admin/karigar-purchase/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

const deleteKarigarBillApi = async (id: string) => {
  const response = await api.delete(`/admin/karigar-purchase/${id}`);
  return response.data;
};

export const useDeleteKarigarBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKarigarBillApi,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['karigar-bill']});
      queryClient.invalidateQueries({queryKey: ['bill']});
      queryClient.invalidateQueries({queryKey: ['clients']});
      queryClient.invalidateQueries({queryKey: ['stock-report']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Insufficient stock');
    },
  });
};

export const useUpdateKarigarBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateKarigarBillApi,
    onSuccess: () => {
      toast.success('Bill updated successfully');
      queryClient.invalidateQueries({queryKey: ['karigar-bill']});
      queryClient.invalidateQueries({queryKey: ['bill']});
      queryClient.invalidateQueries({queryKey: ['clients']});
      queryClient.invalidateQueries({queryKey: ['stock-report']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Insufficient stock');
    },
  });
};

export const updateKarigarBillApi = async ({id, data}: {id: string; data: any}) => {
  const response = await api.put(`/admin/karigar-purchase/${id}`, data);
  return response.data;
};
