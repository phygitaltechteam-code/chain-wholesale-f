import {api} from '@/utils/axios';
import {useQuery} from '@tanstack/react-query';

export const useGetAccounts = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/account');
        return response.data?.data || response.data || [];
      } catch {
        return [];
      }
    },
  });
};
