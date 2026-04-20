import {api} from '@/utils/axios';
import {ClientFormData} from './types';
import {toast} from 'react-hot-toast';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

const addNewClient = async (data: ClientFormData) => {
  try {
    const response = await api.post(`shop/client`, data);
    return response.data;
  } catch (error) {
    toast.error('Failed to add client');
    throw error;
  }
};

const getClients = async () => {
  try {
    const response = await api.get(`shop/client`);

    return response.data;
  } catch (error) {
    toast.error('Failed to fetch clients');
    throw error;
  }
};

const useAddClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addNewClient,
    onSuccess: () => {
      toast.success('client Added Successfully');
      queryClient.invalidateQueries({queryKey: ['clients']});
    },
    onError: () => {
      toast.error('Failed To Save client');
    },
  });
};

const useGetClient = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });
};

export {useAddClient, useGetClient};
