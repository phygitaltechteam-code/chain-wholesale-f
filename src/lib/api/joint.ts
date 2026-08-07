// lib/api/joint.ts
import { api } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export interface Joint {
  id: string;
  itemId: string;
  sizeId: string;
  chainGiven: number;
  chainReceived: number;
  powder: number;
  powderReceived: number;
  srp: number;
  purity?: string;
  isCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// API Functions
export const getJointApi = async () => {
  try {
    const response = await api.get("/admin/joint");
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch joint entries');
    }
    throw error;
  }
};

export const submitJointApi = async ({ id, data }: { id: string; data: any }) => {
  try {
    const response = await api.put(`/admin/joint/${id}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to submit joint');
    }
    throw error;
  }
};

// React Query Hooks
export const useGetJoint = () => {
  return useQuery({
    queryKey: ['joint'],
    queryFn: getJointApi,
  });
};

export const useSubmitJoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitJointApi,
    onSuccess: () => {
      toast.success('Joint submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['joint'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit joint');
    },
  });
};