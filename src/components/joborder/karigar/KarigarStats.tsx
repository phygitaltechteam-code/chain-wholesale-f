import React from 'react';
import {ExtendedKarigarData} from './Kariger';

interface KarigarStatsProps {
  karigars: ExtendedKarigarData[];
}

export const KarigarStats: React.FC<KarigarStatsProps> = ({karigars}) => {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:mb-8 lg:grid-cols-3">
      <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
          Total Karigars
        </p>
        <p className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1c1b] dark:text-white">
          {karigars.length}
        </p>
      </div>

      <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
          Inhouse Artisans
        </p>
        <p className="font-['Playfair_Display'] text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {karigars.filter((k) => k.type === 'IN_HOUSE').length}
        </p>
      </div>

      <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
          Outsource Artisans
        </p>
        <p className="font-['Playfair_Display'] text-2xl font-bold text-amber-600 dark:text-amber-400">
          {karigars.filter((k) => k.type === 'OUT_SOURCE').length}
        </p>
      </div>
    </div>
  );
};

export default KarigarStats;
