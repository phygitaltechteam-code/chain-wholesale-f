import { api } from '@/utils/axios';
import { useQuery } from '@tanstack/react-query';

export interface NewStockItem {
    id?: string;
    name: string;
    grossweight?: number;
    grossWeight?: number;
    purity: number | null;
    fineweight?: number;
    fineWeight?: number;
    remark?: string;
    isManual?: boolean;
    item?: string;
    size?: string;
    createdAt?: string;
}

export interface ProcessDataItem {
    id: string;
    name: string;
    grossweight: number;
    purity: number;
    fineweight: number;
    isCompleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    size?: string;
    scrap?: number;
    loss?: number;
}

export interface ClientDueDataItem {
    id: string;
    clientName?: string;
    name: string;
    due: number;
    grossweight?: number;
    purity?: number;
    fineweight?: number;
    phoneNumber?: string;
    address?: string;
    pendingReceiptsCount?: number;
    updatedAt?: string;
}

export interface DayReportData {
    date?: string;
    summary?: {
        totalProcessWeight: number;
        totalProcessFineWeight: number;
        totalSettlementWeight: number;
        totalSettlementFineWeight: number;
        totalClientDueWeight: number;
        totalClientDueFineWeight: number;
        totalNewStockWeight: number;
        totalNewStockFineWeight: number;
        totalBillsWeight: number;
        totalBillsCustomerWeight: number;
        totalBillsRemainingWeight: number;
        counts: {
            process: number;
            settlement: number;
            clientDue: number;
            newStock: number;
            bills: number;
        };
        byProcess: {
            tar?: { totalWeight: number; totalFineWeight: number; count: number };
            box?: { totalWeight: number; totalFineWeight: number; count: number };
            soldering?: { totalWeight: number; totalFineWeight: number; count: number };
            joint?: { totalWeight: number; totalFineWeight: number; count: number };
            cutting?: { totalWeight: number; totalFineWeight: number; count: number };
            kunda?: { totalWeight: number; totalFineWeight: number; count: number };
            melting?: { totalWeight: number; totalFineWeight: number; count: number };
        };
    };
    process?: {
        tar?: ProcessDataItem[];
        box?: ProcessDataItem[];
        soldering?: ProcessDataItem[];
        joint?: ProcessDataItem[];
        cutting?: ProcessDataItem[];
        kunda?: ProcessDataItem[];
        melting?: ProcessDataItem[];
        all?: ProcessDataItem[];
    };
    settlement?: any[];
    clientDue?: ClientDueDataItem[];
    newStock?: NewStockItem[];
    bills?: any[];
}

export interface DayReportResponse {
    statusCode?: number;
    status?: boolean;
    data?: DayReportData;
    message?: string;
}

export const getDayReportApi = async () => {
    try {
        const response = await api.get('/admin/stock/today');
        return response.data;
    } catch (error) {
        console.error('Error in getDayReportApi:', error);
        return null;
    }
};

export const useGetDayReport = () => {
    return useQuery({
        queryKey: ['dayReport'],
        queryFn: () => getDayReportApi(),
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
    });
};