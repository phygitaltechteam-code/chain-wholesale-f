import { api } from '@/utils/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface MeltingEntry {
  id: string;
  particular?: string;
  grossWt: number;
  purity: number;
  expectedFine?: number;
  fineWt?: number;
  scrapCount?: number;
  createdAt?: string;
  updatedAt?: string;
  isCompleted?: boolean;
}

export const getMeltingApi = async () => {
  try {
    const response = await api.get('/admin/melting');
    return response.data?.data || response.data || [];
  } catch (error) {
    return [];
  }
};

export const getMeltingHistoryApi = async () => {
  try {
    const response = await api.get('/admin/melting/history');
    return response.data?.data || response.data || [];
  } catch (error) {
    return [];
  }
};

export const submitMeltingStockApi = async ({
  id,
  data,
}: {
  id?: string;
  data: any;
}) => {
  try {
    const endpoint = id ? `/admin/melting/stock/${id}` : '/admin/stock';
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    const response = await api.post('/admin/stock', data);
    return response.data;
  }
};

export const useGetMelting = () => {
  return useQuery({
    queryKey: ['melting'],
    queryFn: getMeltingApi,
  });
};

export const useGetMeltingHistory = () => {
  return useQuery({
    queryKey: ['meltingHistory'],
    queryFn: getMeltingHistoryApi,
  });
};

export const useSubmitMeltingStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitMeltingStockApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['melting'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to submit melting stock';
      toast.error(msg);
    },
  });
};
