import { toast } from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Rate {
  id: string;
  metal: 'Gold' | 'Silver';
  purity: string;
  buyingRate: number;
  sellingRate: number;
  updatedAt: string;
  updatedBy: string;
  change: number;
  changePercent: number;
}

export interface RateHistory {
  id: string;
  date: string;
  time: string;
  metal: string;
  purity: string;
  buyingRate: number;
  sellingRate: number;
  change: number;
  updatedBy: string;
}

export interface UpdateRatePayload {
  id: string;
  data: Partial<Rate>;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
// TODO: Remove mock data once backend API is ready and uncomment the real API calls below.

const MOCK_RATES: Rate[] = [
  {
    id: '1',
    metal: 'Gold',
    purity: '24K (999)',
    buyingRate: 71800,
    sellingRate: 72450,
    updatedAt: '2024-03-27 10:30:00',
    updatedBy: 'Rajesh Kumar',
    change: 120,
    changePercent: 0.35,
  },
  {
    id: '2',
    metal: 'Gold',
    purity: '22K (916)',
    buyingRate: 65800,
    sellingRate: 66450,
    updatedAt: '2024-03-27 10:30:00',
    updatedBy: 'Rajesh Kumar',
    change: 95,
    changePercent: 0.27,
  },
  {
    id: '3',
    metal: 'Gold',
    purity: '18K (750)',
    buyingRate: 53800,
    sellingRate: 54375,
    updatedAt: '2024-03-27 10:30:00',
    updatedBy: 'Rajesh Kumar',
    change: 75,
    changePercent: 0.22,
  },
  {
    id: '4',
    metal: 'Silver',
    purity: '999',
    buyingRate: 865,
    sellingRate: 882,
    updatedAt: '2024-03-27 10:15:00',
    updatedBy: 'System Auto-Update',
    change: -15,
    changePercent: -0.17,
  },
  {
    id: '5',
    metal: 'Silver',
    purity: '925',
    buyingRate: 800,
    sellingRate: 815,
    updatedAt: '2024-03-27 10:15:00',
    updatedBy: 'System Auto-Update',
    change: -12,
    changePercent: -0.15,
  },
];

export const MOCK_RATE_HISTORY: RateHistory[] = [
  {
    id: '1',
    date: 'Oct 12, 2023',
    time: '10:30 AM',
    metal: 'Gold',
    purity: '24K (999)',
    buyingRate: 71800,
    sellingRate: 72450,
    change: 120,
    updatedBy: 'Rajesh Kumar',
  },
  {
    id: '2',
    date: 'Oct 12, 2023',
    time: '10:15 AM',
    metal: 'Silver',
    purity: '999',
    buyingRate: 865,
    sellingRate: 882,
    change: -15,
    updatedBy: 'System Auto-Update',
  },
  {
    id: '3',
    date: 'Oct 11, 2023',
    time: '04:00 PM',
    metal: 'Gold',
    purity: '24K (999)',
    buyingRate: 71650,
    sellingRate: 72300,
    change: -150,
    updatedBy: 'Admin',
  },
  {
    id: '4',
    date: 'Oct 11, 2023',
    time: '10:30 AM',
    metal: 'Gold',
    purity: '24K (999)',
    buyingRate: 71800,
    sellingRate: 72450,
    change: 100,
    updatedBy: 'Rajesh Kumar',
  },
  {
    id: '5',
    date: 'Oct 10, 2023',
    time: '10:30 AM',
    metal: 'Gold',
    purity: '24K (999)',
    buyingRate: 71700,
    sellingRate: 72350,
    change: -200,
    updatedBy: 'Admin',
  },
];

// ─── API functions ────────────────────────────────────────────────────────────
// When backend is ready:
//   1. Import: import { api } from '@/utils/axios';
//   2. Replace fetchRates with:   const res = await api.get('/rates'); return res.data;
//   3. Replace putRate with:      const res = await api.put(`/rates/${id}`, data); return res.data;

const fetchRates = async (): Promise<Rate[]> => {
  // --- MOCK ---
  await new Promise((r) => setTimeout(r, 400)); // simulate network delay
  return MOCK_RATES;
  // --- REAL (uncomment when backend is ready) ---
  // const res = await api.get('/rates');
  // return res.data;
};

const putRate = async ({ id, data }: UpdateRatePayload): Promise<Rate> => {
  // --- MOCK ---
  await new Promise((r) => setTimeout(r, 500)); // simulate network delay
  const updated = MOCK_RATES.find((r) => r.id === id);
  if (!updated) throw new Error('Rate not found');
  return { ...updated, ...data };
  // --- REAL (uncomment when backend is ready) ---
  // const res = await api.put(`/rates/${id}`, data);
  // return res.data;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useRates = () => {
  return useQuery<Rate[]>({
    queryKey: ['rates'],
    queryFn: fetchRates,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useUpdateRate = () => {
  const queryClient = useQueryClient();

  return useMutation<Rate, Error, UpdateRatePayload>({
    mutationFn: putRate,
    onSuccess: () => {
      toast.success('Rate updated successfully');
      queryClient.invalidateQueries({ queryKey: ['rates'] });
    },
    onError: (error) => {
      toast.error(`Failed to update rate: ${error.message}`);
    },
  });
};