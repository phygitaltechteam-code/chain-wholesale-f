// lib/api/soldering.ts
import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface Soldering {
  id: string;
  itemId: string;
  sizeId: string;
  chainGiven: number;
  chainReceived: number;
  powder: number;
  increase: number;
  scrap: number;
  isCompleted?: boolean;
  purity?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getBackendErrorMessage = (
  error: any,
  fallback: string,
): string => {
  if (!error) return fallback;
  const msg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.data?.message ||
    error?.message;

  if (Array.isArray(msg)) {
    return msg.join(', ');
  }
  if (typeof msg === 'string' && msg.trim()) {
    return msg;
  }
  return fallback;
};

// API Functions
export const getSolderingApi = async () => {
  const response = await api.get('/admin/soldering');
  return response.data;
};

export const getSolderingHistoryApi = async () => {
  const response = await api.get('/admin/soldering/history');
  return response.data;
};

export const submitSolderingApi = async ({
  id,
  data,
}: {
  id: string;
  data: any;
}) => {
  const response = await api.put(`/admin/soldering/${id}`, data);
  return response.data;
};

export const createSolderingApi = async (data: any) => {
  const response = await api.post('/admin/soldering', data);
  return response.data;
};

// React Query Hooks
export const useGetSoldering = () => {
  return useQuery({
    queryKey: ['soldering'],
    queryFn: getSolderingApi,
  });
};

export const useGetSolderingHistory = () => {
  return useQuery({
    queryKey: ['soldering'],
    queryFn: getSolderingHistoryApi,
  });
};

export const useSubmitSoldering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitSolderingApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Soldering submitted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({queryKey: ['soldering']});
    },
    onError: (error: any) => {
      const msg = getBackendErrorMessage(error, 'Failed to submit soldering');
      toast.error(msg);
    },
  });
};

export const useCreateSoldering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSolderingApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Soldering created successfully';
      toast.success(msg);
      queryClient.invalidateQueries({queryKey: ['soldering']});
    },
    onError: (error: any) => {
      const msg = getBackendErrorMessage(
        error,
        'Failed to create soldering entry',
      );
      toast.error(msg);
    },
  });
};
