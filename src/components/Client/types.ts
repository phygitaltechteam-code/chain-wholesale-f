export interface Client {
  id: string;
  name: string;
  phone: string;
  city: string;
  gstStatus: 'Active' | 'None';
  balance: number;
  goldBalance: number;
  silverBalance: number;
  lastActive: string;
  tier: 'Premium Tier' | 'Standard';
  avatar: string;
}

export interface Transaction {
  id: string;
  date: string;
  billNo: string;
  type: 'Sale' | 'Purchase' | 'Payment';
  metal: string;
  weight: string;
  amount: number;
  balance: number;
}
