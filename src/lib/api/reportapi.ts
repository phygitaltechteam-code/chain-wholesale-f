import {api} from '@/utils/axios';
import {useQuery} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useGetClientReport = (id: string) => {
  return useQuery({
    queryKey: ['client report', id],
    queryFn: () => getclientreport(id),
    enabled: !!id,
  });
};

export const getclientreport = async (id: string) => {
  try {
    const response = await api.get(`admin/client/pay/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch settlements');
    }
    throw error;
  }
};

export const useGetStockReport = (id: string) => {
  return useQuery({
    queryKey: ['stock report', id],
    queryFn: () => getstockreport(id),
    enabled: !!id,
  });
};

const getstockreport = async (id: string) => {
  try {
    const response = await api.get(`admin/stock/history/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch settlements');
    }
    throw error;
  }
};

export const useGetManufacturingData = () => {
  return useQuery({
    queryKey: ['manufacturing report'],
    queryFn: () => getManufacturingData(),
  });
};

const getManufacturingData = async () => {
  try {
    const response = await api.get(`admin/manufacture`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch settlements');
    }
    throw error;
  }
};
