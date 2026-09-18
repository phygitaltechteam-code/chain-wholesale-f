import React from 'react';
import {Scale, DollarSign, ArrowDownToLine, Clock} from 'lucide-react';
import {formatNumberWithDecimals} from './billingTypes';

interface BillingSummaryCardsProps {
  totalFinWt: number;
  totalSRP: number;
  totalReceive: number;
  totalPending: number;
}

export const BillingSummaryCards: React.FC<BillingSummaryCardsProps> = ({
  totalFinWt,
  totalSRP,
  totalReceive,
  totalPending,
}) => {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Total Fin Wt */}
      <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Fin Wt
            </span>
            <span className="text-lg font-bold text-black dark:text-white">
              {formatNumberWithDecimals(totalFinWt)} G
            </span>
          </div>
          <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-amber-700/30 dark:bg-amber-900/30">
            <Scale className="h-4 w-4 text-[#785600] dark:text-amber-400" />
          </div>
        </div>
      </div>

      {/* Total SRP */}
      <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total SRP
            </span>
            <span className="text-lg font-bold text-black dark:text-white">
              {formatNumberWithDecimals(totalSRP)} G
            </span>
          </div>
          <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-blue-700/30 dark:bg-blue-900/30">
            <DollarSign className="h-4 w-4 text-[#785600] dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Total Receive */}
      <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Receive
            </span>
            <span className="text-lg font-bold text-black dark:text-white">
              {formatNumberWithDecimals(totalReceive)} G
            </span>
          </div>
          <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-green-700/30 dark:bg-green-900/30">
            <ArrowDownToLine className="h-4 w-4 text-[#785600] dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Total Pending */}
      <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Pending
            </span>
            <span className="text-lg font-bold text-black dark:text-white">
              {formatNumberWithDecimals(Math.abs(totalPending))} G
            </span>
          </div>
          <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-red-700/30 dark:bg-red-900/30">
            <Clock className="h-4 w-4 text-[#785600] dark:text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSummaryCards;
