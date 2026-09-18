import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {toast} from 'react-hot-toast';
import {Job} from './types';

export const useSaveJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post(`/admin/karigar/job`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Job created successfully');
      queryClient.invalidateQueries({queryKey: ['jobs']});
    },
    onError: (error: any) => {
      console.error('Save job error:', error);
      toast.error(error?.response?.data?.message || 'Failed to save job');
    },
  });
};

export const useEditJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, data}: {id: string; data: FormData}) => {
      const response = await api.patch(`/admin/karigar/job/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Job updated successfully');
      queryClient.invalidateQueries({queryKey: ['jobs']});
    },
    onError: (error: any) => {
      console.error('Edit job error:', error);
      toast.error(error?.response?.data?.message || 'Failed to edit job');
    },
  });
};

export const useGetJobs = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async (): Promise<Job[]> => {
      try {
        const response = await api.get(`/admin/karigar/job`);
        return response.data?.data || response.data || [];
      } catch (error) {
        console.error('Get jobs API error:', error);
        return [];
      }
    },
  });
};

export const useGetJobById = (id: string) => {
  return useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const response = await api.get(`/admin/karigar/job/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
  });
};

export const useGetCrystal = () => {
  return useQuery({
    queryKey: ['crystals'],
    queryFn: async () => {
      try {
        const response = await api.get(`/admin/crystal`);
        return response.data?.data || response.data || [];
      } catch (error) {
        console.error('Get crystals API error:', error);
        return [];
      }
    },
  });
};

export const useSubmitCrystal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (crystalData: any) => {
      const response = await api.post('/admin/crystal', crystalData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['crystals']});
      toast.success('Crystal added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to save crystal');
    },
  });
};

export const useUpdateCrystal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, ...data}: any) => {
      const response = await api.patch(`/admin/crystal/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['crystals']});
      toast.success('Crystal updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update crystal');
    },
  });
};

export const useUpdateJobStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      stageId: string;
      jobId: string;
      karigarId: string;
      processId: string;
      dateIssued: string;
      fineGoldIssued: number;
      labourChargeType: string;
      labourCharges: number;
      wastage: number;
      status: string;
      jobStageCrystals: {
        crystalId: string;
        qty: number;
      }[];
    }) => {
      const response = await api.patch(
        `/admin/karigar/stage/${data.stageId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['jobs']});
      queryClient.invalidateQueries({queryKey: ['job']});
    },
  });
};
