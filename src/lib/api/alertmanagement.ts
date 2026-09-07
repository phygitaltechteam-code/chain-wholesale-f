import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/axios';
import toast from 'react-hot-toast';

export interface SubmitAlertParams {
    grossWt: number;
    purity: number;
    loss: number;
    adjustment: number;
    processId: string;
}

export interface SubmitAlertResponse {
    message: string;
}

const submitAlert = async (data: SubmitAlertParams) => {
    const response = await api.post<SubmitAlertResponse>('/admin/alert', data);
    return response.data;
};

export const useSubmitAlert = () => {
    return useMutation({
        mutationFn: submitAlert,
        onSuccess: () => {
            toast.success('Alert settings saved successfully');
        },
        onError: (error) => {
            toast.error('Failed to save alert settings');
        },
    });
};