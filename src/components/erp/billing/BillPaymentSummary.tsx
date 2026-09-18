import React from 'react';
import {formatNumberThreeDecimals} from './billFormTypes';

interface BillPaymentSummaryProps {
  totalFine: number | string;
  customerWeight: number | string;
  dueBalance: number;
  totalBill?: number | null;
  remainingBalance: number;
  isReadOnly?: boolean;
  onCustomerWeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTotalFineChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BillPaymentSummary: React.FC<BillPaymentSummaryProps> = ({
  totalFine,
  customerWeight,
  dueBalance,
  totalBill,
  remainingBalance,
  isReadOnly = false,
  onCustomerWeightChange,
  onTotalFineChange,
}) => {
  return (
    <div className="mt-4 flex justify-end">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Total Fine Wt */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
          <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
            Total Fine Wt
          </span>
          <div className="relative flex items-center">
            <input
              type="number"
              step="0.001"
              min="0"
              disabled
              value={totalFine || ''}
              onChange={onTotalFineChange}
              placeholder="0.000"
              className="font-mono w-28 rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1 pr-7 text-right text-sm font-semibold text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="pointer-events-none absolute right-2.5 text-xs text-[#817563] dark:text-slate-400">
              G
            </span>
          </div>
        </div>

        {/* Advance */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
          <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
            Advance
          </span>
          <div className="relative flex items-center">
            <input
              type="number"
              step="0.001"
              min="0"
              disabled={isReadOnly}
              value={customerWeight || ''}
              onChange={onCustomerWeightChange}
              placeholder="0.000"
              className="font-mono w-28 rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1 pr-7 text-right text-sm font-semibold text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400 dark:disabled:bg-slate-900"
            />
            <span className="pointer-events-none absolute right-2.5 text-xs text-[#817563] dark:text-slate-400">
              G
            </span>
          </div>
        </div>

        {/* Due Balance */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
          <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
            Due Balance
          </span>
          <span className="font-mono text-sm font-semibold text-black dark:text-white">
            {formatNumberThreeDecimals(dueBalance)} G
          </span>
        </div>

        {/* Remaining Balance / Pending */}
        <div className="flex items-center justify-between bg-[#f4f0e5] px-4 py-3 dark:bg-slate-800">
          <span className="text-sm font-bold text-[#1a1c1b] dark:text-white">
            Remaining Balance
          </span>
          <span className="font-mono text-base font-bold text-black dark:text-white">
            {formatNumberThreeDecimals(
              totalBill !== undefined && totalBill !== null
                ? totalBill
                : remainingBalance,
            )}{' '}
            G
          </span>
        </div>
      </div>
    </div>
  );
};

export default BillPaymentSummary;
