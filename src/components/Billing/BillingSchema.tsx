import { z } from 'zod';

// Metal Item Schema (for API submission)
export const MetalItemAPISchema = z.object({
  metalName: z.string().min(1, 'Metal name is required'),
  weight: z.number().positive('Weight must be positive'),
  rate: z.number().positive('Rate must be positive'),
  amount: z.number().positive('Amount must be positive'),
});

// Exchange Item Schema
export const ExchangeItemSchema = z.object({
  metalType: z.string().min(1, 'Metal type is required'),
  grossWeight: z.number().positive('Gross weight must be positive'),
  purity: z.number().min(0).max(100, 'Purity must be between 0 and 100'),
  fineWeight: z.number().positive('Fine weight must be positive'),
  rate: z.number().positive('Rate must be positive'),
  amount: z.number().positive('Amount must be positive'),
});

// Metal Item for UI (with id)
export const MetalItemUISchema = z.object({
  id: z.string(),
  metalType: z.string().min(1, 'Metal type is required'),
  grossWeight: z.number().positive('Gross weight must be positive'),
  purity: z.number().min(0).max(100),
  fineWeight: z.number().positive('Fine weight must be positive'),
  rate: z.number().positive('Rate must be positive'),
  amount: z.number().positive('Amount must be positive'),
});

// Billing Form Schema (UI Form)
export const BillingFormSchema = z.object({
  // Metal Entry
  metalType: z.string().optional(),
  fineWeight: z.string().optional(),
  rate: z.string().optional(),

  // Making Charges
  makingChargeType: z.enum(['g', 'amount']),
  makingChargeValue: z.string().optional(),
  hsnCode: z.string().optional(),
  gstPercent: z.string().optional(),
  discount: z.string().optional(),

  // Metal Exchange
  exchangeMetalType: z.string().optional(),
  exchangeGrossWeight: z.string().optional(),
  exchangePurity: z.string().optional(),
  exchangeRate: z.string().optional(),

  // Payment
  cashPaid: z.string().optional(),
  previousBalance: z.string().optional(),
  metalAdjustment: z.string().optional(),
});

// Invoice Payload Schema (for API - MATCHES BACKEND EXPECTATION)
export const InvoicePayloadSchema = z.object({
  // Client Information
  clientId: z.string().uuid('Invalid client ID'),
  
  // Transaction Details
  transactionType: z.enum(['SELL', 'BUY']),
  billingMode: z.enum(['CASH_BILL', 'GST_BILL']),
  paymentMode: z.enum(['CASH', 'METAL', 'SPLIT']),
  
  // Items
  items: z.array(MetalItemAPISchema),
  exchangeItems: z.array(ExchangeItemSchema),
  
  // Charges & Fees
  makingFees: z.number().min(0, 'Making fees cannot be negative'),
  hsnCode: z.string().optional(),
  gstPercentage: z.number().min(0).max(100),
  
  // Financial Calculations
  totalTax: z.number().min(0),
  subTotal: z.number().min(0),
  discount: z.number().min(0),
  exchangeValue: z.number().min(0),
  previousBalance: z.number(),
  netPayable: z.number().min(0),
  cashPaid: z.number().min(0),
  balanceDue: z.number(),
});

// Type exports
export type MetalItemAPI = z.infer<typeof MetalItemAPISchema>;
export type ExchangeItem = z.infer<typeof ExchangeItemSchema>;
export type MetalItemUI = z.infer<typeof MetalItemUISchema>;
export type BillingFormData = z.infer<typeof BillingFormSchema>;
export type InvoicePayload = z.infer<typeof InvoicePayloadSchema>;