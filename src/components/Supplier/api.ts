import {api} from '@/utils/axios';
import {Supplier, SupplierFormData} from './types';
import {toast} from 'react-hot-toast';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

export * from './types';

const addNewsupplier = async (data: SupplierFormData) => {
  try {
    const response = await api.post(`/admin/supplier`, data);
    return response.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Failed to add supplier');
    throw error;
  }
};

const getsuppliers = async (): Promise<Supplier[]> => {
  try {
    const response = await api.get(`/admin/supplier`);
    return response.data?.data || response.data || [];
  } catch {
    return [];
  }
};

const getsupplierById = async (id: string) => {
  try {
    const response = await api.get(`/admin/supplier/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    toast.error('Failed to fetch supplier details');
    throw error;
  }
};

const updatesupplier = async ({
  id,
  data,
}: {
  id: string;
  data: SupplierFormData;
}) => {
  try {
    const response = await api.patch(`/admin/supplier/${id}`, data);
    return response.data;
  } catch {
    try {
      const response = await api.put(`/admin/supplier/${id}`, data);
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update supplier');
      throw error;
    }
  }
};

const deletesupplier = async (id: string) => {
  try {
    const response = await api.delete(`/admin/supplier/${id}`);
    return response.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Failed to delete supplier');
    throw error;
  }
};

export const useGetsupplierById = (id: string) => {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: () => getsupplierById(id),
    enabled: !!id,
  });
};

export const useUpdatesupplier = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierFormData) => updatesupplier({id, data}),
    onSuccess: () => {
      toast.success('Supplier updated successfully');
      queryClient.invalidateQueries({queryKey: ['supplier', id]});
      queryClient.invalidateQueries({queryKey: ['suppliers']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update supplier');
    },
  });
};

export const useAddsupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addNewsupplier,
    onSuccess: () => {
      toast.success('Supplier Added Successfully');
      queryClient.invalidateQueries({queryKey: ['suppliers']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed To Save supplier');
    },
  });
};

export const useGetsupplier = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: getsuppliers,
  });
};

export const useDeletesupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletesupplier(id),
    onSuccess: () => {
      toast.success('Supplier deleted successfully');
      queryClient.invalidateQueries({queryKey: ['suppliers']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete supplier');
    },
  });
};

export const useSubmitSupplierSettlement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settlementData: {
      supplierId: string;
      amount: number;
      accountId: string;
    }) => {
      const response = await api.patch(
        `/admin/supplier/settle/${settlementData.supplierId}`,
        {
          amount: settlementData.amount,
          accountId: settlementData.accountId,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['supplier']});
      queryClient.invalidateQueries({queryKey: ['suppliers']});
      queryClient.invalidateQueries({queryKey: ['accounts']});
    },
  });
};

export const useSubmitTradeSettlement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settlementData: {
      supplierId: string;
      amount: number;
      accountId: string;
    }) => {
      const response = await api.patch(
        `/admin/supplier/settle/${settlementData.supplierId}`,
        {
          amount: settlementData.amount,
          accountId: settlementData.accountId,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['supplier']});
      queryClient.invalidateQueries({queryKey: ['suppliers']});
      queryClient.invalidateQueries({queryKey: ['accounts']});
    },
  });
};
