import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/axios';
import toast from 'react-hot-toast';

export interface SubmitAlertParams {
    grossWt: number;
    purity: number;
    loss: number;
    adjustment: number;
}

export interface SubmitAlertResponse {
    message?: string;
    data?: any;
}

export const ALERT_ENDPOINTS: Record<string, string> = {
    melting: '/admin/profile/melting',
    tar: '/admin/profile/tar',
    box: '/admin/profile/box',
    soldering: '/admin/profile/soldering',
    joint: '/admin/profile/joint',
    cutting: '/admin/profile/cutting',
    skunda: '/admin/profile/kunda',
};

// Generic process alert submit function
export const submitProcessAlertApi = async ({
    process,
    data,
}: {
    process: string;
    data: SubmitAlertParams[] | SubmitAlertParams;
}) => {
    const endpoint = ALERT_ENDPOINTS[process] || `/admin/profile/${process}`;
    const response = await api.post<SubmitAlertResponse>(endpoint, data);
    return response.data;
};

// Generic process alert single delete function
export const deleteProcessAlertApi = async ({
    process,
    id,
}: {
    process: string;
    id: string;
}) => {
    const base = ALERT_ENDPOINTS[process] || `/admin/profile/${process}`;
    const endpoint = `${base}/${id}`;
    const response = await api.delete<SubmitAlertResponse>(endpoint);
    return response.data;
};

// Specific API functions per process (supports array or single object)
export const submitMeltingAlert = (data: SubmitAlertParams[] | SubmitAlertParams) =>
    api.post<SubmitAlertResponse>('/admin/profile/melting', data).then((res) => res.data);

export const submitTarAlert = (data: SubmitAlertParams[] | SubmitAlertParams) =>
    api.post<SubmitAlertResponse>('/admin/profile/tar', data).then((res) => res.data);

export const submitBoxAlert = (data: SubmitAlertParams[] | SubmitAlertParams) =>
    api.post<SubmitAlertResponse>('/admin/profile/box', data).then((res) => res.data);

export const submitSolderingAlert = (data: SubmitAlertParams[] | SubmitAlertParams) =>
    api.post<SubmitAlertResponse>('/admin/profile/soldering', data).then((res) => res.data);

export const submitJointAlert = (data: SubmitAlertParams[] | SubmitAlertParams) =>
    api.post<SubmitAlertResponse>('/admin/profile/joint', data).then((res) => res.data);

export const submitCuttingAlert = (data: SubmitAlertParams[] | SubmitAlertParams) =>
    api.post<SubmitAlertResponse>('/admin/profile/cutting', data).then((res) => res.data);

export const submitSKundaAlert = (data: SubmitAlertParams[] | SubmitAlertParams) =>
    api.post<SubmitAlertResponse>('/admin/profile/kunda', data).then((res) => res.data);

// Specific delete functions per process
export const deleteMeltingAlert = (id: string) =>
    api.delete<SubmitAlertResponse>(`/admin/profile/melting/${id}`).then((res) => res.data);

export const deleteTarAlert = (id: string) =>
    api.delete<SubmitAlertResponse>(`/admin/profile/tar/${id}`).then((res) => res.data);

export const deleteBoxAlert = (id: string) =>
    api.delete<SubmitAlertResponse>(`/admin/profile/box/${id}`).then((res) => res.data);

export const deleteSolderingAlert = (id: string) =>
    api.delete<SubmitAlertResponse>(`/admin/profile/soldering/${id}`).then((res) => res.data);

export const deleteJointAlert = (id: string) =>
    api.delete<SubmitAlertResponse>(`/admin/profile/joint/${id}`).then((res) => res.data);

export const deleteCuttingAlert = (id: string) =>
    api.delete<SubmitAlertResponse>(`/admin/profile/cutting/${id}`).then((res) => res.data);

export const deleteSKundaAlert = (id: string) =>
    api.delete<SubmitAlertResponse>(`/admin/profile/kunda/${id}`).then((res) => res.data);

// Hook for submitting alert by process
export const useSubmitProcessAlert = () => {
    return useMutation({
        mutationFn: submitProcessAlertApi,
        onSuccess: () => {
            toast.success('Alert settings saved successfully');
        },
        onError: () => {
            toast.error('Failed to save alert settings');
        },
    });
};

// Hook for single delete alert by process
export const useDeleteProcessAlert = () => {
    return useMutation({
        mutationFn: deleteProcessAlertApi,
        onSuccess: () => {
            toast.success('Alert rule deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete alert rule');
        },
    });
};

export const useDeleteAlert = () => {
    return useDeleteProcessAlert();
};

export const useSubmitAlert = () => {
    return useSubmitProcessAlert();
};