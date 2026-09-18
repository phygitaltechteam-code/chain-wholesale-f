import React from 'react';
import {
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  IndianRupee,
  CheckCircle2,
  Clock,
  Flame,
  CalendarCheck,
} from 'lucide-react';

interface StatsCardData {
  noOfWorks: number;
  noGoldHandle: number;
  givenGold: number;
  takenGold: number;
  goldInPossession: number;
  totalPayment: number;
  totalPaid: number;
  totalPending: number;
  totalWastage: number;
  pastPaidDate: string;
}

interface StatsCardsProps {
  data: StatsCardData;
  formatCurrency: (amount?: number | null) => string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  data,
  formatCurrency,
}) => {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
      {/* Total Works */}
      <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            Assigned Jobs
          </p>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Briefcase size={14} />
          </div>
        </div>
        <p className="mt-2 font-['Playfair_Display'] text-xl font-bold text-[#1a1c1b] dark:text-white">
          {data.noOfWorks}
        </p>
      </div>

      {/* Gold Issued */}
      <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            Gold Issued
          </p>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
            <ArrowUpRight size={14} />
          </div>
        </div>
        <p className="mt-2 font-['Playfair_Display'] text-xl font-bold text-[#785600] dark:text-amber-400">
          {data.givenGold.toFixed(3)}g
        </p>
      </div>

      {/* Gold Received */}
      <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            Gold Received
          </p>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <ArrowDownLeft size={14} />
          </div>
        </div>
        <p className="mt-2 font-['Playfair_Display'] text-xl font-bold text-emerald-600 dark:text-emerald-400">
          {data.takenGold.toFixed(3)}g
        </p>
      </div>

      {/* Gold in Possession */}
      <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            In Possession
          </p>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
            <Scale size={14} />
          </div>
        </div>
        <p className="mt-2 font-['Playfair_Display'] text-xl font-bold text-purple-600 dark:text-purple-400">
          {data.goldInPossession.toFixed(3)}g
        </p>
      </div>

      {/* Total Wastage */}
      <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            Total Wastage
          </p>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
            <Flame size={14} />
          </div>
        </div>
        <p className="mt-2 font-['Playfair_Display'] text-xl font-bold text-red-600 dark:text-red-400">
          {data.totalWastage.toFixed(3)}g
        </p>
      </div>

      {/* Total Labour Charges */}
      <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            Total Labour
          </p>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#785600]/10 text-[#785600] dark:bg-amber-400/10 dark:text-amber-400">
            <IndianRupee size={14} />
          </div>
        </div>
        <p className="mt-2 font-['Playfair_Display'] text-xl font-bold text-[#1a1c1b] dark:text-white">
          {formatCurrency(data.totalPayment)}
        </p>
      </div>

      {/* Paid Amount */}
      <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            Total Paid
          </p>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 size={14} />
          </div>
        </div>
        <p className="mt-2 font-['Playfair_Display'] text-xl font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(data.totalPaid)}
        </p>
      </div>

      {/* Pending Amount */}
      <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            Pending Labour
          </p>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
            <Clock size={14} />
          </div>
        </div>
        <p className="mt-2 font-['Playfair_Display'] text-xl font-bold text-[#785600] dark:text-amber-400">
          {formatCurrency(data.totalPending)}
        </p>
      </div>

      {/* Last Paid Date */}
      <div className="col-span-2 rounded-2xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:col-span-1 md:col-span-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            Last Disbursed Date
          </p>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <CalendarCheck size={14} />
          </div>
        </div>
        <p className="mt-2 text-xs font-semibold text-[#1a1c1b] dark:text-white">
          {data.pastPaidDate}
        </p>
      </div>
    </div>
  );
};
