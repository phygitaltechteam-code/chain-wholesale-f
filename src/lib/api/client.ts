import { api } from '@/utils/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface Client {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  openingBalance: number;
  adminId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Functions
export const getClientsApi = async () => {
  try {
    const response = await api.get('/admin/client');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch clients');
    }
    throw error;
  }
};

export const createClientApi = async (
  data: Omit<Client, 'id' | 'adminId' | 'createdAt' | 'updatedAt'>,
) => {
  try {
    const response = await api.post('/admin/client', data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to create client');
    }
    throw error;
  }
};

export const updateClientApi = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<Client>;
}) => {
  try {
    const response = await api.put(`/admin/client/${id}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        error.message || `Failed to update client with ID: ${id}`,
      );
    }
    throw error;
  }
};

export const deleteClientApi = async (id: string) => {
  try {
    const response = await api.delete(`/admin/client/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        error.message || `Failed to delete client with ID: ${id}`,
      );
    }
    throw error;
  }
};

// React Query Hooks
export const useGetClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: getClientsApi,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClientApi,
    onSuccess: () => {
      toast.success('Client created successfully');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create client');
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClientApi,
    onSuccess: () => {
      toast.success('Client updated successfully');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update client');
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClientApi,

    onSuccess: async (_, deletedClientId) => {
      toast.success('Client deleted successfully');

      // Remove deleted client immediately from React Query cache
      queryClient.setQueryData<Client[]>(['clients'], (oldClients = []) =>
        oldClients.filter((client) => client.id !== deletedClientId),
      );

      // Make sure latest data comes from database
      await queryClient.invalidateQueries({
        queryKey: ['clients'],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete client');
    },
  });
};
