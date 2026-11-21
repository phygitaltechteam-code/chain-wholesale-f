import React from 'react';
import {formatWeight} from './realTimeGoldUtils';

interface RealTimeSummaryCardsProps {
  grandTotals: {
    grandTotalWeight: number;
    grandTotalFineWeight: number;
    avgPurity: string;
  };
  totalGoldWeight: number;
  totalStock: number;
  customerDue: number;
  karigarDue: number;
}

const SummaryCard: React.FC<{
  label: string;
  value: string;
  className?: string;
}> = ({label, value, className = ''}) => (
  <div
    className={`rounded-xl border border-[#d3c4af]/20 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
  >
    <div className="flex flex-col items-center justify-center">
      <span className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-slate-300">
        {label}
      </span>
      <span className="font-mono truncate text-base font-black text-black dark:text-white sm:text-lg">
        {value}
      </span>
    </div>
  </div>
);

const fmt = (n: number) => `${formatWeight(n)} G`;

export const RealTimeSummaryCards: React.FC<RealTimeSummaryCardsProps> = ({
  grandTotals,
  totalGoldWeight,
  totalStock,
  customerDue,
  karigarDue,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {/* <SummaryCard
        label="Total Gross WT"
        value={`${formatWeight(grandTotals.grandTotalWeight)} G`}
      />
      <SummaryCard
        label="Total Fine WT"
        value={fmt(grandTotals.grandTotalFineWeight)}
      /> */}
      {/* Total Gold WT = Fine WT + Customer Due - Karigar Due */}
      <SummaryCard label="Total Gold WT" value={fmt(totalGoldWeight)} />
      <SummaryCard label="Total Stock" value={fmt(totalStock)} />
      <SummaryCard label="Total Customer Due" value={fmt(customerDue)} />
      <SummaryCard label="Total Karigar Due" value={fmt(karigarDue)} />

    </div>
  );
};
