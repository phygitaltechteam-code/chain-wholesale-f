import {api} from '@/utils/axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useSubmitBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBill,
    onSuccess: () => {
      toast.success('Bill Submitted Successfully');
      queryClient.invalidateQueries({queryKey: ['bills']});
    },
    onError: () => {
      toast.error('Failed To Submit Bill');
    },
  });
};

export const saveBill = async (data: any) => {
  try {
    const response = await api.post(`/shop/billing`, data);
    return response.data;
  } catch (error) {
    toast.error('Failed to submit bill');
    throw error;
  }
};
