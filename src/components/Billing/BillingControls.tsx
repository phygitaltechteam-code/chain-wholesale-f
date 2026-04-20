import React from 'react';
import {TransactionType, BillingMode, PaymentMode} from './billing.types';

interface BillingControlsProps {
  transactionType: TransactionType;
  onTransactionTypeChange: (type: TransactionType) => void;
  billingMode: BillingMode;
  onBillingModeChange: (mode: BillingMode) => void;
  paymentMode: PaymentMode;
  onPaymentModeChange: (mode: PaymentMode) => void;
}

export const BillingControls: React.FC<BillingControlsProps> = ({
  transactionType,
  onTransactionTypeChange,
  billingMode,
  onBillingModeChange,
  paymentMode,
  onPaymentModeChange,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Transaction Type */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm md:p-6">
        <h3 className="font-['Manrope'] text-xs font-bold uppercase tracking-widest text-[#4f4535]">
          Transaction Type
        </h3>
        <div className="flex w-full rounded-full bg-[#f4f4f2] p-1">
          <button
            type="button"
            onClick={() => onTransactionTypeChange('SELL')}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-all md:px-6 md:py-2 md:text-sm ${
              transactionType === 'SELL'
                ? 'bg-[#785600] text-white shadow-md'
                : 'text-[#4f4535] hover:bg-[#e8e8e6]'
            }`}
          >
            Sale
          </button>
          <button
            type="button"
            onClick={() => onTransactionTypeChange('BUY')}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-all md:px-6 md:py-2 md:text-sm ${
              transactionType === 'BUY'
                ? 'bg-[#785600] text-white shadow-md'
                : 'text-[#4f4535] hover:bg-[#e8e8e6]'
            }`}
          >
            Purchase
          </button>
        </div>
      </div>

      {/* Billing Mode */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm md:p-6">
        <h3 className="font-['Manrope'] text-xs font-bold uppercase tracking-widest text-[#4f4535]">
          Billing Mode
        </h3>
        <div className="flex w-full rounded-full bg-[#f4f4f2] p-1">
          <button
            type="button"
            onClick={() => onBillingModeChange('CASH_BILL')}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-all md:px-6 md:py-2 md:text-sm ${
              billingMode === 'CASH_BILL'
                ? 'bg-[#785600] text-white shadow-md'
                : 'text-[#4f4535] hover:bg-[#e8e8e6]'
            }`}
          >
            Cash Bill
          </button>
          <button
            type="button"
            onClick={() => onBillingModeChange('GST_BILL')}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-all md:px-6 md:py-2 md:text-sm ${
              billingMode === 'GST_BILL'
                ? 'bg-[#785600] text-white shadow-md'
                : 'text-[#4f4535] hover:bg-[#e8e8e6]'
            }`}
          >
            GST Bill
          </button>
        </div>
      </div>

      {/* Payment Mode */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm md:p-6">
        <h3 className="font-['Manrope'] text-xs font-bold uppercase tracking-widest text-[#4f4535]">
          Payment Mode
        </h3>
        <div className="flex w-full flex-col gap-2 rounded-lg bg-[#f4f4f2] p-1 md:flex-row">
          {(['CASH_UPI', 'EXCHANGE', 'SPLIT'] as PaymentMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onPaymentModeChange(mode)}
              className={`rounded-md px-3 py-2 text-xs font-bold transition-all md:flex-1 md:rounded-full md:px-4 ${
                paymentMode === mode
                  ? 'bg-[#785600] text-white shadow-sm'
                  : 'text-[#4f4535] hover:bg-[#e8e8e6]'
              }`}
            >
              {mode === 'CASH_UPI' ? 'Cash/UPI' : mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
