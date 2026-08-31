import React from 'react';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import { formatNumberDisplay, hasMeltingStatus } from './cuttingUtils';

interface HistoryCuttingProps {
    historyData: any[];
    historyTotals: {
        totalGiven: number;
        totalReceived: number;
        totalScrap: number;
        totalLoss: number;
    };
    historyLoading: boolean;
    dateRange: Date[];
    historyColumns: Column<any>[];
}

const HistoryCutting: React.FC<HistoryCuttingProps> = ({
    historyData,
    historyTotals,
    historyLoading,
    dateRange = [],
    historyColumns,
}) => {
    return (
        <div>
            {/* History Summary Cards - Updated with Loss */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Chain Given
                        </span>
                        <span className="text-lg font-bold text-black dark:text-amber-400">
                            {formatNumberDisplay(historyTotals.totalGiven)} G
                        </span>
                    </div>
                </div>
                <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Chain Received
                        </span>
                        <span className="text-lg font-bold text-black dark:text-blue-400">
                            {formatNumberDisplay(historyTotals.totalReceived)} G
                        </span>
                    </div>
                </div>
                <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Scrap
                        </span>
                        <span className="text-lg font-bold text-black dark:text-green-400">
                            {formatNumberDisplay(historyTotals.totalScrap)} G
                        </span>
                    </div>
                </div>
                <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
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

            {/* History Table */}
            <GenericTable
                data={historyData}
                columns={historyColumns}
                emptyMessage={
                    dateRange.length === 2 && dateRange[0] && dateRange[1]
                        ? `No history records found for the selected date range (${new Date(
                            dateRange[0],
                        ).toLocaleDateString('en-IN')} to ${new Date(
                            dateRange[1],
                        ).toLocaleDateString('en-IN')})`
                        : 'No history records found.'
                }
                isLoading={historyLoading}
                showSrNo={true}
                srNoLabel="Sr No."
                className="shadow-sm"
                rowClassName={(item: any) =>
                    hasMeltingStatus(item)
                        ? 'opacity-60 bg-gray-50/70 text-gray-500 hover:bg-gray-100/70 dark:bg-slate-900/40 dark:text-slate-400'
                        : ''
                }
            />
        </div>
    );
};

export default HistoryCutting;
