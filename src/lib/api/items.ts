/* eslint-disable */
import { api } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { z } from "zod";

// Zod Schema for validation
export const ItemSchema = z.object({
  name: z.string().min(3, "Item name must be at least 3 characters long"),
});

export type ItemFormData = z.infer<typeof ItemSchema>;

export interface Item {
  id: string;
  name: string;
  srNo?: number;
  createdAt?: string;
  updatedAt?: string;
}

// API Functions - Following your project structure
const createItemApi = async (data: ItemFormData) => {
  try {
    const response = await api.post("/admin/item", data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to add item');
    }
    throw error;
  }
};

const getItemsApi = async () => {
  try {
    const response = await api.get("/admin/item");
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch items');
    }
    throw error;
  }
};

const getItemByIdApi = async (id: string) => {
  try {
    const response = await api.get(`/admin/item/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to fetch item with ID: ${id}`);
    }
    throw error;
  }
};

const updateItemApi = async ({ id, data }: { id: string; data: ItemFormData }) => {
  try {
    const response = await api.put(`/admin/item/${id}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to update item with ID: ${id}`);
    }
    throw error;
  }
};

const deleteItemApi = async (id: string) => {
  try {
    await api.delete(`/admin/item/${id}`);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to delete item with ID: ${id}`);
    }
    throw error;
  }
};

// Export individual functions
export {
  createItemApi,
  getItemsApi,
  getItemByIdApi,
  updateItemApi,
  deleteItemApi,
};

// React Query Hooks - Following your project structure
export const useGetItems = () => {
  return useQuery({
    queryKey: ['items'],
    queryFn: getItemsApi,
  });
};

export const useItemById = (id: string) => {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => getItemByIdApi(id),
    enabled: !!id,
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItemApi,
    onSuccess: () => {
      toast.success('Item added successfully');
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add item');
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateItemApi,
    onSuccess: () => {
      toast.success('Item updated successfully');
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update item');
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteItemApi,
    onSuccess: () => {
      toast.success('Item deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete item');
    },
  });
};