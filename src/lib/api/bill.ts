import { api } from "@/utils/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useGetQuantity = () => {
  return useMutation({
    mutationFn: getQuantityApi,
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to fetch quantity');
    },
  });
};

export const useBill = () => {
  return useMutation({
    mutationFn: saveBillApi,
    onSuccess: () => {
      toast.success('Bill added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Insufficient stock');
    },
  });
};

const saveBillApi = async (data: any) => {
  const response = await api.post('/admin/billing', data);
  return response.data;
};

const getQuantityApi = async (payload: { itemId: string; sizeId: string; purity: number; customerId:string }) => {
  const response = await api.put('/admin/billing/check', payload);
  return response.data;
};

export const useGetBill = () => {
  return useQuery({
    queryKey: ['bill'],
    queryFn: getbillAll,
  });
};

export const getbillAll = async () => {
  try {
    const response = await api.get("/admin/billing");
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch joint entries');
    }
    throw error;
  }
};
export const useGetBillByid = (id: string) => {
  return useQuery({
    queryKey: ['bill', id],
    queryFn: async () => {
      const response = await api.get(`/admin/billing/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

const deleteBillApi = async (id: string) => {
  const response = await api.delete(`/admin/billing/${id}`);
  return response.data;
};
export const useDeleteBill= () => {
  return useMutation({
    mutationFn: deleteBillApi,
    onSuccess: () => {
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Insufficient stock');
    },
  });
};


export const useBillUpdate = () => {
  return useMutation({
    mutationFn: updateBillApi,
    onSuccess: () => {
      // toast.success('Bill added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Insufficient stock');
    },
  });
};


export const updateBillApi = async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/admin/billing/${id}`, data);
  return response.data;
};