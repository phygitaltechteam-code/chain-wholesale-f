import {api} from '@/utils/axios';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface Stock {
  id: string;
  item: string;
  size: string;
  weight: number;
  purity: number;
  dateTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockResponse {
  data: Stock[];
  total?: number;
  message?: string;
}

// API Functions
const getStockApi = async () => {
  try {
    const response = await api.get('/admin/stock');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch stock data');
    }
    throw error;
  }
};

const getStockByIdApi = async (id: string) => {
  try {
    const response = await api.get(`/admin/stock/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to fetch stock with ID: ${id}`);
    }
    throw error;
  }
};

const getStockByItemApi = async (item: string) => {
  try {
    const response = await api.get(`/admin/stock/item/${item}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        error.message || `Failed to fetch stock for item: ${item}`,
      );
    }
    throw error;
  }
};

const createStockApi = async (
  data: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>,
) => {
  try {
    const response = await api.post('/admin/stock', data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to create stock entry');
    }
    throw error;
  }
};

const updateStockApi = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<Stock>;
}) => {
  try {
    const response = await api.put(`/admin/stock/${id}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to update stock with ID: ${id}`);
    }
    throw error;
  }
};

const deleteStockApi = async (id: string) => {
  try {
    await api.delete(`/admin/stock/${id}`);
    return {success: true};
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to delete stock with ID: ${id}`);
    }
    throw error;
  }
};

// Export individual functions
export {
  getStockApi,
  getStockByIdApi,
  getStockByItemApi,
  createStockApi,
  updateStockApi,
  deleteStockApi,
};

// React Query Hooks
export const useGetStock = () => {
  return useQuery({
    queryKey: ['stock'],
    queryFn: getStockApi,
  });
};

export const useStockById = (id: string) => {
  return useQuery({
    queryKey: ['stock', id],
    queryFn: () => getStockByIdApi(id),
    enabled: !!id,
  });
};

export const useStockByItem = (item: string) => {
  return useQuery({
    queryKey: ['stock', 'item', item],
    queryFn: () => getStockByItemApi(item),
    enabled: !!item,
  });
};

export const useCreateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStockApi,

    onSuccess: () => {
      // toast.success('Stock entry created successfully');

      queryClient.invalidateQueries({
        queryKey: ['stock'],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create stock entry');
    },
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStockApi,

    onSuccess: () => {
      toast.success('Stock entry updated successfully');

      queryClient.invalidateQueries({
        queryKey: ['stock'],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update stock entry');
    },
  });
};

export const useDeleteStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStockApi,

    onSuccess: async (_, deletedId) => {
      toast.success('Stock entry deleted successfully');

      // Immediately remove the deleted record from the cache.
      queryClient.setQueryData<Stock[]>(['stock'], (oldStock = []) =>
        oldStock.filter((stock) => stock.id !== deletedId),
      );

      // Refresh the stock query from the database.
      await queryClient.invalidateQueries({
        queryKey: ['stock'],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete stock entry');
    },
  });
};
