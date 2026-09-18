import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useGetBox = () => {
  return useQuery({
    queryKey: ['box'],
    queryFn: getBoxApi,
  });
};

export const useGetBoxweight = () => {
  return useQuery({
    queryKey: ['boxweight'],
    queryFn: getBoxweightApi,
  });
};

const getBoxweightApi = async () => {
  try {
    const response = await api.get('/admin/box/stock');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch boxweight entries');
    }
    throw error;
  }
};

export const useGetTarweight = () => {
  return useQuery({
    queryKey: ['tarweight'],
    queryFn: getTarweightApi,
  });
};

const getTarweightApi = async () => {
  try {
    const response = await api.get('/admin/tar/stock');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch tarweight entries');
    }
    throw error;
  }
};

export const useGetBoxHistory = () => {
  return useQuery({
    queryKey: ['box'],
    queryFn: getBoxHistory,
  });
};

export const getBoxHistory = async () => {
  try {
    const response = await api.get('/admin/box/history');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch box history');
    }
    throw error;
  }
};

export const getBoxApi = async () => {
  try {
    const response = await api.get('/admin/box');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch box entries');
    }
    throw error;
  }
};

export const useSubmitBox = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitBoxApi,
    onSuccess: () => {
      toast.success('Box submitted successfully');
      queryClient.invalidateQueries({queryKey: ['box']});
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit box');
    },
  });
};

export const createBoxApi = async (data: any) => {
  try {
    const response = await api.post('/admin/box', data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to create box entry');
    }
    throw error;
  }
};

export const useCreateBox = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBoxApi,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['box']});
    },
  });
};

export const submitBoxApi = async ({id, data}: {id: string; data: any}) => {
  try {
    const response = await api.put(`/admin/box/${id}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to submit box');
    }
    throw error;
  }
};
