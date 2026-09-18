import {Client} from '@/lib/api/client';

export interface CrystalId {
  id: string;
  qty: number;
}

export interface ClientCrystal {
  name: string;
  weight: number;
  size: string;
  color: string;
  shape: string;
  qty: number;
}

export interface JobImage {
  id: string;
  jobId: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobItem {
  id: string;
  itemName: string;
  description: string;
  metal: 'GOLD' | 'SILVER';
  grossWt?: number;
  fineWt?: number;
  purity?: number;
  deliveryDate: Date;
  cashAdvance?: number;
  goldAdvance?: number;
  silverAdvance?: number;
  images: File[];
  imagePreviews: string[];
  crystalIds: CrystalId[];
  clientCrystals?: ClientCrystal[];
}

export interface Stage {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  [key: string]: any;
}

export interface Job {
  id: string;
  jobNo?: string;
  itemName: string;
  description?: string;
  metal: string;
  grossWeight?: number;
  netWeight?: number;
  fineWeight?: number;
  purity?: number;
  deliveryDate: string;
  cashAdvance?: number;
  goldAdvance?: number;
  silverAdvance?: number;
  clientId: string | null;
  shopId?: string;
  status: string;
  calculatedStatus?: string;
  createdAt: string;
  updatedAt?: string;
  images: JobImage[];
  client: Client | null;
  stages: Stage[];
}

export interface CrystalData {
  id: string;
  name: string;
  clarity?: string;
  color?: string;
  lab?: string;
  size?: string;
  shape?: string;
  qty?: number;
  wt?: number;
  carat?: number;
  rate?: number;
  amount?: number;
  supplierId?: string;
  isInHouse?: boolean;
}
