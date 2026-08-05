/* eslint-disable */
import { api } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export interface Tar {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  fine: number;
  tar: number;
  scrap: number;
  lossWeight: number;
  purity: string;
  isSaved?: boolean;
  itemId?: string;
  sizeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Functions
const getTarApi = async () => {
  try {
    const response = await api.get("/admin/tar");
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch tar entries');
    }
    throw error;
  }
};

const createTarApi = async (data: {
  itemId: string;
  sizeId: string;
  fine: number;
  item: string;
  size: string;
  tar: number;
  scrap: number;
  lossWeight: number;
  purity: string;
  isSaved: boolean;
}) => {
  try {
    const response = await api.post("/admin/tar", data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to create tar entry');
    }
    throw error;
  }
};

const saveTarApi = async ({ id, data }: { id: string; data: Partial<Tar> }) => {
  try {
    // Ensure number fields are actually numbers
    const payload = {
      ...data,
      id: id,
      fine: data.fine !== undefined ? Number(data.fine) : undefined,
      tar: data.tar !== undefined ? Number(data.tar) : undefined,
      scrap: data.scrap !== undefined ? Number(data.scrap) : undefined,
      lossWeight: data.lossWeight !== undefined ? Number(data.lossWeight) : undefined,
    };
    
    console.log('Saving payload:', payload);
    const response = await api.post(`/admin/tar`, payload);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to save tar with ID: ${id}`);
    }
    throw error;
  }
};
const getTarByIdApi = async (id: string) => {
  try {
    const response = await api.get(`/admin/tar/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to fetch tar with ID: ${id}`);
    }
    throw error;
  }
};

// Export individual functions
export {
  getTarApi,
  getTarByIdApi,
  createTarApi,
  saveTarApi,
};

// React Query Hooks
export const useTar = () => {
  return useQuery({
    queryKey: ['tar'],
    queryFn: getTarApi,
  });
};

export const useTarById = (id: string) => {
  return useQuery({
    queryKey: ['tar', id],
    queryFn: () => getTarByIdApi(id),
    enabled: !!id,
  });
};

export const useCreateTar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTarApi,
    onSuccess: () => {
      toast.success('Tar entry created successfully');
      queryClient.invalidateQueries({ queryKey: ['tar'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tar entry');
    },
  });
};

export const useSaveTar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveTarApi,
    onSuccess: () => {
      toast.success('Tar entry saved successfully');
      queryClient.invalidateQueries({ queryKey: ['tar'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save tar entry');
    },
  });
};