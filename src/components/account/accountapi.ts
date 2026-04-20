// accountapi.ts
import {api} from '@/utils/axios';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useSaveAccontInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAccountInfo,
    onSuccess: () => {
      toast.success('Account Saved Successfully');
      queryClient.invalidateQueries({queryKey: ['accounts']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed To Save Account');
    },
  });
};

export const useGetAccounts = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });
};

export const saveAccountInfo = async (data: any) => {
  try {
    const response = await api.post(`/shop/account`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAccounts = async () => {
  try {
    const response = await api.get(`/shop/account`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
