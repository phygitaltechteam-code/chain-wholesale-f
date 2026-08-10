// lib/api/cutting.ts
import { api } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export interface Cutting {
  id: string;
  itemId: string;
  sizeId: string;
  chainGiven: number;
  chainReceived: number;
  scrap: number;
  purity?: string;
  isCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// API Functions
export const getCuttingApi = async () => {
  try {
    const response = await api.get("/admin/cutting");
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch cutting entries');
    }
    throw error;
  }
};
export const getCuttingHistoryApi = async () => {
  try {
    const response = await api.get("/admin/cutting/history");
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch cutting history ');
    }
    throw error;
  }
};

export const submitCuttingApi = async ({ id, data }: { id: string; data: any }) => {
  try {
    const response = await api.put(`/admin/cutting/${id}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to submit cutting');
    }
    throw error;
  }
};

export const submitMoveCuttingApi = async ({ id, data }: { id: string; data: any }) => {
  try {
    const response = await api.put(`/admin/soldering/cutting/${id}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to submit cutting');
    }
    throw error;
  }
};

export const getKundaApi = async () => {
  try {
    const response = await api.get("/admin/kunda");
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch S Kunda entries');
    }
    throw error;
  }
};

export const getKundaHistoryApi = async () => {
  try {
    const response = await api.get("/admin/kunda/history");
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch S Kunda history');
    }
    throw error;
  }
};

export const submitKundaApi = async ({ id, data }: { id: string; data: any }) => {
  try {
    const response = await api.put(`/admin/kunda/${id}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to submit S Kunda');
    }
    throw error;
  }
};

export const submitMoveKundaApi = async ({ id, data }: { id: string; data: any }) => {
  try {
    const response = await api.put(`/admin/cutting/kunda/${id}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to move to S Kunda');
    }
    throw error;
  }
};

// React Query Hooks
export const useGetCutting = () => {
  return useQuery({
    queryKey: ['cutting'],
    queryFn: getCuttingApi,
  });
};

export const useGetCuttingHistory = () => {
  return useQuery({
    queryKey: ['cutting-history'],
    queryFn: getCuttingHistoryApi,
  });
};

export const useSubmitCutting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitCuttingApi,
    onSuccess: () => {
      toast.success('Cutting submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['cutting'] });
      queryClient.invalidateQueries({ queryKey: ['cutting-history'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit cutting');
    },
  });
};

export const useSubmitMoveCutting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitMoveCuttingApi,
    onSuccess: () => {
      toast.success('Cutting submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['cutting'] });
      queryClient.invalidateQueries({ queryKey: ['cutting-history'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit cutting');
    },
  });
};

export const useGetKunda = () => {
  return useQuery({
    queryKey: ['kunda'],
    queryFn: getKundaApi,
  });
};

export const useGetKundaHistory = () => {
  return useQuery({
    queryKey: ['kunda-history'],
    queryFn: getKundaHistoryApi,
  });
};

export const useSubmitKunda = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitKundaApi,
    onSuccess: () => {
      toast.success('S Kunda process stopped successfully');
      queryClient.invalidateQueries({ queryKey: ['kunda'] });
      queryClient.invalidateQueries({ queryKey: ['kunda-history'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to stop S Kunda process');
    },
  });
};

export const useSubmitMoveKunda = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitMoveKundaApi,
    onSuccess: () => {
      toast.success('Moved to S Kunda successfully');
      queryClient.invalidateQueries({ queryKey: ['cutting'] });
      queryClient.invalidateQueries({ queryKey: ['kunda'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to move to S Kunda');
    },
  });
};
