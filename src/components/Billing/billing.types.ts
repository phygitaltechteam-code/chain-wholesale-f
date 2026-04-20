import {z} from 'zod';
import {BillingFormSchema, MetalItemUISchema} from './BillingSchema';

export type MetalItem = z.infer<typeof MetalItemUISchema>;
export type BillingFormData = z.infer<typeof BillingFormSchema>;

export interface BillingFormDataWithFields extends BillingFormData {
  [key: string]: any;
}

export interface Client {
  id: string;
  fullname: string;
  phoneNumber: string;
  city?: string;
  address?: string;
  GST?: string;
  PAN?: string;
  aadhar?: string;
}

export interface AccountData {
  id: string;
  name: string;
  balance: number;
}

export type TransactionType = 'SELL' | 'BUY';
export type BillingMode = 'CASH_BILL' | 'GST_BILL';
export type PaymentMode = 'CASH_UPI' | 'EXCHANGE' | 'SPLIT';

export interface ReceiptData {
  invoiceNo: string;
  date: string;
  client: {
    name: string;
    phone: string;
    address?: string;
    gst?: string;
  };
  items: Array<{
    metalName: string;
    weight: number;
    rate: number;
    amount: number;
  }>;
  makingFees: number;
  gstPercent: number;
  gstAmount: number;
  exchangeValue: number;
  previousBalance: number;
  subTotal: number;
  totalWithTax: number;
  netPayable: number;
  cashPaid: number;
  balanceDue: number;
  transactionType: TransactionType;
  billingMode: BillingMode;
  paymentMode: PaymentMode;
}
