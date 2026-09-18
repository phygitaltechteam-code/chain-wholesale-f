import {api} from '@/utils/axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useSubmitPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      stageId: string;
      cash: number;
      accountId: string;
      karigarId: string;
    }) => {
      const response = await api.post('/admin/karigar/payment', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['karigar']});
      queryClient.invalidateQueries({queryKey: ['karigars']});
      toast.success('Payment submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to submit payment');
    },
  });
};
