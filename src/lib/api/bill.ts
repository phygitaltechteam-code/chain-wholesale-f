import { api } from "@/utils/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useGetQuantity = () => {
  return useMutation({
    mutationFn: getQuantityApi,
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to fetch quantity');
    },
  });
};

export const useBill = () => {
  return useMutation({
    mutationFn: saveBillApi,
    onSuccess: () => {
      toast.success('Bill added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add bill');
    },
  });
};

const saveBillApi = async (data: any) => {
  const response = await api.post('/admin/billing/create', data);
  return response.data;
};

const getQuantityApi = async (payload: { itemId: string; sizeId: string; purity: number }) => {
  const response = await api.put('/admin/billing/check', payload);
  return response.data;
};