import React from 'react';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';

interface HistoryDeptProps {
  historyData: any[];
  historyTotals: {
    totalGross: number;
    totalExpected: number;
    totalFine: number;
    totalLoss: number;
  };
  historyLoading: boolean;
  alertRules?: AlertRule[];
}

import {
  formatDate,
  formatNumberDisplay,
  calculateExpectedFine,
  AlertRule,
  checkMeltingLossAlert,
} from './meltingUtils';

const HistoryDept: React.FC<HistoryDeptProps> = ({
  historyData,
  historyTotals,
  historyLoading,
  alertRules,
}) => {
  // History columns
  const historyColumns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (item) => {
        const {date, time} = formatDate(
          item.createdAt || item.dateTime || item.created_at,
        );
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {date}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {time}
            </span>
          </div>
        );
      },
    },
    {
      key: 'particular',
      header: 'Particular',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.particular || 'Scrap Melting'}
        </span>
      ),
    },
    {
      key: 'grossWt',
      header: 'Gross Wt (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.grossWeight ?? item.grossWt ?? item.weight)}{' '}
          G
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.purity)}%
        </span>
      ),
    },
    {
      key: 'expectedFine',
      header: 'Expected Fine (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.expected ?? item.expectedFine)} G
        </span>
      ),
    },
    {
      key: 'fineWeight',
      header: 'Fine Wt (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.fineWeight)} G
        </span>
      ),
    },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => {
        const gross = item.grossWeight ?? item.grossWt ?? item.weight ?? 0;
        const expected =
          item.expected ??
          item.expectedFine ??
          calculateExpectedFine(gross, item.purity);
        const fine = item.fineWeight || 0;
        const loss =
          item.loss !== undefined && item.loss !== null
            ? item.loss
            : Math.max(0, Math.round((expected - fine) * 1000) / 1000);

        const alertCheck = checkMeltingLossAlert(
          gross,
          item.purity,
          fine,
          expected,
          alertRules,
        );

        let colorClass = 'text-gray-500 dark:text-slate-400';
        if (alertCheck) {
          if (alertCheck.colorState === 'green') {
            colorClass = 'font-semibold text-green-600 dark:text-green-400';
          } else if (alertCheck.colorState === 'yellow') {
            colorClass = 'font-semibold text-amber-500 dark:text-amber-400';
          } else if (alertCheck.colorState === 'red') {
            colorClass = 'font-bold text-red-600 dark:text-red-500';
          }
        }

        const diff =
          alertCheck && alertCheck.isExceeded
            ? Math.round(
                (alertCheck.actualLoss - alertCheck.maxAllowedLoss) * 1000,
              ) / 1000
            : 0;

        return (
          <div className="flex flex-col items-center justify-center">
            <span className={`font-mono text-sm ${colorClass}`}>
              {formatNumberDisplay(loss)} G
            </span>
            {diff > 0 && (
              <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                (Diff: +{formatNumberDisplay(diff)} G)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'timeTaken',
      header: 'Gold Aging',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item?.timeTaken || '-'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Proceed Date & Time',
      render: (item) => {
        const {date, time} = formatDate(
          item.updatedAt ||
            item.updated_at ||
            item.proceedDateTime ||
            item.proceedDate ||
            item.createdAt,
        );
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {date}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {time}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {/* History Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Gross Wt
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-400">
              {formatNumberDisplay(historyTotals.totalGross)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Expected Wt
            </span>
            <span className="text-lg font-bold text-black dark:text-blue-400">
              {formatNumberDisplay(historyTotals.totalExpected)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Fine Wt
            </span>
            <span className="text-lg font-bold text-black dark:text-green-400">
              {formatNumberDisplay(historyTotals.totalFine)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Loss
            </span>
            <span className="text-lg font-bold text-black dark:text-red-400">
              {formatNumberDisplay(historyTotals.totalLoss)} G
            </span>
          </div>
        </div>
      </div>

      <GenericTable
        data={historyData}
        columns={historyColumns}
        emptyMessage="No melting history found."
        isLoading={historyLoading}
        showSrNo={true}
        srNoLabel="Sr No."
      />
    </div>
  );
};

export default HistoryDept;
