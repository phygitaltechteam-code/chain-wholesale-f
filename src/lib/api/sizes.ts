/* eslint-disable */
import { api } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { z } from "zod";

// Zod Schema for validation
export const SizeSchema = z.object({
  size: z.string().min(1, "Size is required"),
});

export type SizeFormData = z.infer<typeof SizeSchema>;

export interface Size {
  id: string;
  size: string;
  srNo?: number;
  createdAt?: string;
  updatedAt?: string;
}

// API Functions
const createSizeApi = async (data: SizeFormData) => {
  try {
    const response = await api.post("/admin/size", data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to add size');
    }
    throw error;
  }
};

const getSizesApi = async () => {
  try {
    const response = await api.get("/admin/size");
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch sizes');
    }
    throw error;
  }
};



const updateSizeApi = async ({ id, data }: { id: string; data: SizeFormData }) => {
  try {
    const response = await api.put(`/admin/size/${id}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to update size with ID: ${id}`);
    }
    throw error;
  }
};

const deleteSizeApi = async (id: string) => {
  try {
    await api.delete(`/admin/size/${id}`);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to delete size with ID: ${id}`);
    }
    throw error;
  }
};

// Export individual functions
export {
  createSizeApi,
  getSizesApi,
  updateSizeApi,
  deleteSizeApi,
};

// React Query Hooks
export const useGetSizes = () => {
  return useQuery({
    queryKey: ['sizes'],
    queryFn: getSizesApi,
  });
};



export const useCreateSize = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSizeApi,
    onSuccess: () => {
      toast.success('Size added successfully');
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add size');
    },
  });
};

export const useUpdateSize = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSizeApi,
    onSuccess: () => {
      toast.success('Size updated successfully');
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update size');
    },
  });
};

export const useDeleteSize = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSizeApi,
    onSuccess: () => {
      toast.success('Size deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete size');
    },
  });
};