import {api} from '@/utils/axios';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useNewBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerbooking,
    onSuccess: () => {
      toast.success('Bill Submitted Successfully');
      queryClient.invalidateQueries({queryKey: ['bills']});
    },
    onError: () => {
      toast.error('Failed To Submit Bill');
    },
  });
};

export const registerbooking = async (data: any) => {
  try {
    const response = await api.post(`/shop/bookings`, data);
    return response.data;
  } catch (error) {
    toast.error('Failed to register booking');
    throw error;
  }
};
