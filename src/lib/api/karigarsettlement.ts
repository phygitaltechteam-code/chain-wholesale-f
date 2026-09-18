import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface KarigarSettlementData {
  clientId: string;
  amount: number;
  type: 'receive' | 'give';
  notes?: string;
  date?: string;
  pendingBalance?: number;
  totalGiven?: number;
  totalReceived?: number;
}

// GET all settlements - without /all
export const getKarigarSettlements = async () => {
  try {
    const response = await api.get('/admin/karigar/settlement');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch settlements');
    }
    throw error;
  }
};

// POST - Submit settlement
export const submitKarigarSettlement = async (data: KarigarSettlementData) => {
  try {
    const response = await api.post(`/admin/karigar/pay/${data.clientId}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to submit settlement');
    }
    throw error;
  }
};

// React Query hooks
export const useGetKarigarSettlements = () => {
  return useQuery({
    queryKey: ['karigar-settlements'],
    queryFn: getKarigarSettlements,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

export const useSubmitKarigarSettlement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitKarigarSettlement,
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Settlement submitted successfully');
      queryClient.invalidateQueries({queryKey: ['karigar-settlements']});
      queryClient.invalidateQueries({queryKey: ['karigars']});
      queryClient.invalidateQueries({queryKey: ['karigar report']});
      queryClient.invalidateQueries({queryKey: ['day report']});
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to submit settlement',
      );
    },
  });
};
