export interface Client {
  id: string;
  fullName?: string;
  fullname?: string;
  phoneNumber?: string;
  phone?: string;
  address?: string;
}

export interface Process {
  id: string;
  name: string;
}

export interface Karigar {
  id: string;
  name: string;
  phoneNumber?: string;
  type?: 'IN_HOUSE' | 'OUT_SOURCE';
  salary?: number;
}

export interface StageCrystalItem {
  id: string;
  crystalId: string;
  name: string;
  clarity?: string;
  color?: string;
  shape?: string;
  size?: string;
  wt?: number;
  ct?: number;
  rate?: number;
  qty: number;
}

export interface ReturnEntry {
  id?: string;
  returnDate: string;
  goldReceived: number;
  returnWastage: number;
  scrap: number;
}

export interface KarigarDetail {
  id: string;
  name: string;
  stageId?: string;
  fineGoldIssued?: number;
  status?: string;
}

export interface ProcessStage {
  id: string;
  stageId?: string;
  jobId: string;
  processId: string;
  processName?: string;
  process?: Process;
  karigarIds: string[];
  karigarDetails: KarigarDetail[];
  dateIssued: string;
  fineGoldIssued: number;
  purity: number;
  grossWeight: number;
  labourType?: 'percentage' | 'fixed' | 'PERCENTAGE' | 'FIXED';
  labourChargeType?: string;
  labourCharges: number;
  labourAmount?: number;
  wastage: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  jobStageCrystals?: any[];
  returnDate?: string | null;
  goldReceived?: number;
  returnWastage?: number;
  scrap?: number;
  createdAt?: string;
}

export interface JobImage {
  id?: string;
  image: string;
}

export interface JobCrystal {
  id: string;
  crystalId: string;
  qty: number;
  crystal?: any;
}

export interface Job {
  id: string;
  jobNo?: string;
  clientId?: string;
  client?: Client;
  itemName: string;
  description?: string;
  metal: 'GOLD' | 'SILVER';
  grossWeight?: number;
  grossWt?: number;
  netWeight?: number;
  fineWeight?: number;
  fineWt?: number;
  purity?: number;
  deliveryDate?: string;
  cashAdvance?: number;
  goldAdvance?: number;
  silverAdvance?: number;
  makingChargesType?: string;
  makingChargesSubType?: string;
  makingChargesValue?: number;
  makingChargesAmount?: number;
  status?: string;
  calculatedStatus?: string;
  createdAt?: string;
  images?: JobImage[];
  jobCrystals?: JobCrystal[];
  stages?: ProcessStage[];
}
