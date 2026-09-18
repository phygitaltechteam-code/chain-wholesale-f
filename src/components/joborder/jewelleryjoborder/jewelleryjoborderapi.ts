import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {Job} from './types';

// Fetch job details by id
export const useGetJobById = (id: string) => {
  return useQuery({
    queryKey: ['job', id],
    queryFn: async (): Promise<Job | null> => {
      if (!id) return null;
      const response = await api.get(`/admin/karigar/job/${id}`);
      return response.data?.data || response.data || null;
    },
    enabled: !!id,
  });
};

// Edit Job Order
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
    onSuccess: (_, variables) => {
      toast.success('Job details updated successfully');
      queryClient.invalidateQueries({queryKey: ['job', variables.id]});
      queryClient.invalidateQueries({queryKey: ['jobs']});
    },
    onError: (error: any) => {
      console.error('Edit job error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update job');
    },
  });
};

// Submit new stage assigned to karigar
export const useSubmitJobKarigar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      jobId: string;
      karigarId: string;
      processId: string;
      dateIssued: string;
      fineGoldIssued: number;
      purity: number;
      grossWeight: number;
      labourChargeType: string;
      labourCharges: number;
      labourAmount?: number;
      wastage: number;
      status: string;
      jobStageCrystals: {
        crystalId: string;
        qty: number;
      }[];
    }) => {
      const response = await api.post('/admin/karigar/stage', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: ['job', variables.jobId]});
      queryClient.invalidateQueries({queryKey: ['jobs']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to submit process stage');
    },
  });
};

// Update existing stage
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
      purity: number;
      grossWeight: number;
      labourChargeType: string;
      labourCharges: number;
      labourAmount?: number;
      wastage: number;
      status: string;
      jobStageCrystals: {
        crystalId: string;
        qty: number;
      }[];
    }) => {
      const response = await api.patch(`/admin/karigar/stage/${data.stageId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: ['job', variables.jobId]});
      queryClient.invalidateQueries({queryKey: ['jobs']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update stage');
    },
  });
};

// Submit stage return entry (complete / return gold & scrap)
export const useSubmitReturnEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      stageId: string;
      jobId: string;
      returnDate: string;
      goldReceived: number;
      returnWastage: number;
      scrap: number;
      status?: string;
    }) => {
      const response = await api.patch(`/admin/karigar/stage/${data.stageId}/return`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Return entry recorded successfully');
      queryClient.invalidateQueries({queryKey: ['job', variables.jobId]});
      queryClient.invalidateQueries({queryKey: ['jobs']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to record return entry');
    },
  });
};
