import React from 'react';
import { GenericTable } from '@/components/Forms/Table/GenericTable';
import { getHistorySKundaColumns, hasMeltingStatus, formatNumberDisplay } from './sKundaUtils';

interface HistorySKundaProps {
  filteredData: any[];
  historyTotals: {
    totalGiven: number;
    totalKundaGiven: number;
    totalReceived: number;
    totalScrap: number;
    totalLoss: number;
  };
  historyLoading: boolean;
}

const HistorySKunda: React.FC<HistorySKundaProps> = ({
  filteredData,
  historyTotals,
  historyLoading,
}) => {
  const historyColumns = getHistorySKundaColumns();

  return (
    <div>
      {/* Summary Cards - History Totals */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* Chain Given */}
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Chain Given
              </span>
              <span className="text-lg font-bold text-black dark:text-amber-400">
                {formatNumberDisplay(historyTotals.totalGiven)} G
              </span>
            </div>
          </div>
        </div>

        {/* S/Kunda Given */}
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                S/Kunda Given
              </span>
              <span className="text-lg font-bold text-black dark:text-amber-500">
                {formatNumberDisplay(historyTotals.totalKundaGiven)} G
              </span>
            </div>
          </div>
        </div>

        {/* Chain Received */}
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Chain Received
              </span>
              <span className="text-lg font-bold text-black dark:text-blue-400">
                {formatNumberDisplay(historyTotals.totalReceived)} G
              </span>
            </div>
          </div>
        </div>

        {/* Scrap */}
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Scrap
              </span>
              <span className="text-lg font-bold text-black dark:text-green-400">
                {formatNumberDisplay(historyTotals.totalScrap)} G
              </span>
            </div>
          </div>
        </div>

        {/* Loss */}
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Loss
              </span>
              <span className="text-lg font-bold text-black dark:text-red-400">
                {formatNumberDisplay(historyTotals.totalLoss)} G
              </span>
            </div>
          </div>
        </div>
      </div>

      <GenericTable
        data={filteredData}
        columns={historyColumns}
        emptyMessage="No history records found for the selected date range."
        isLoading={historyLoading}
        showSrNo={true}
        srNoLabel="Sr No."
        className="shadow-sm"
        rowClassName={(item) =>
          hasMeltingStatus(item)
            ? 'opacity-60 bg-gray-50/70 text-gray-500 hover:bg-gray-100/70 dark:bg-slate-900/40 dark:text-slate-400'
            : ''
        }
      />
    </div>
  );
};

export default HistorySKunda;
