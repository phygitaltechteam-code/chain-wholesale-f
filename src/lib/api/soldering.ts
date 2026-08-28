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

// API Functions
export const getSolderingApi = async () => {
  try {
    const response = await api.get('/admin/soldering');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch soldering entries');
    }
    throw error;
  }
};
export const getSolderingHistoryApi = async () => {
  try {
    const response = await api.get('/admin/soldering/history');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch soldering entries');
    }
    throw error;
  }
};

export const submitSolderingApi = async ({
  id,
  data,
}: {
  id: string;
  data: any;
}) => {
  try {
    const response = await api.put(`/admin/soldering/${id}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to submit soldering');
    }
    throw error;
  }
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
    onSuccess: () => {
      toast.success('Soldering submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['soldering'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit soldering');
    },
  });
};

export const createSolderingApi = async (data: any) => {
  try {
    const response = await api.post('/admin/soldering', data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to create soldering entry');
    }
    throw error;
  }
};

export const useCreateSoldering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSolderingApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldering'] });
    },
  });
};

