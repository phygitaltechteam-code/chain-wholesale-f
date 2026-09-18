import React from 'react';
import {JobStage} from './KarigarByid';
import {formatCurrency} from '@/utils/utilities';
import {ArrowDownLeft, CheckCircle2} from 'lucide-react';

interface PaymentsTableProps {
  stages: JobStage[];
  formatDate: (date?: string) => string;
  formatTime: (date?: string) => string;
  ledgerData: any[];
  totalPendingFromApi: number;
}

export const PaymentsTable: React.FC<PaymentsTableProps> = ({
  formatDate,
  formatTime,
  ledgerData,
  totalPendingFromApi,
}) => {
  const validLedger = Array.isArray(ledgerData)
    ? ledgerData.filter(
        (l) => l && (l.amount > 0 || l.cash > 0 || l.credit > 0),
      )
    : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d3c4af]/20 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-[#d3c4af]/10 p-5 dark:border-slate-800">
        <div>
          <h3 className="font-['Playfair_Display'] text-base font-bold text-[#1a1c1b] dark:text-white">
            Disbursement Ledger
          </h3>
          <p className="text-xs text-[#4f4535] dark:text-slate-400">
            Chronological log of labour payments & settlements
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535]/70 dark:text-slate-400">
            Total Pending
          </span>
          <p className="font-['Playfair_Display'] text-sm font-bold text-[#785600] dark:text-amber-400">
            {formatCurrency(totalPendingFromApi)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-[#d3c4af]/10 bg-[#f4f4f2]/60 text-xs uppercase tracking-[0.15em] text-[#4f4535] dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
              <th className="px-5 py-4 text-left font-semibold">
                Payment Date
              </th>
              <th className="px-5 py-4 text-left font-semibold">
                Reference / Job
              </th>
              <th className="px-5 py-4 text-left font-semibold">
                Payment Method / Account
              </th>
              <th className="px-5 py-4 text-right font-semibold">
                Disbursed Amount
              </th>
              <th className="px-5 py-4 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d3c4af]/10 dark:divide-slate-800">
            {validLedger.map((entry: any, index: number) => {
              const amount = entry.amount || entry.cash || entry.credit || 0;
              return (
                <tr
                  key={entry.id || index}
                  className="transition-colors hover:bg-[#f4f4f2]/40 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-4">
                    <span className="block text-xs font-medium text-[#1a1c1b] dark:text-white">
                      {formatDate(entry.date || entry.createdAt)}
                    </span>
                    <span className="block text-[10px] text-[#817563]">
                      {formatTime(entry.date || entry.createdAt)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="block text-xs font-semibold text-[#1a1c1b] dark:text-white">
                      {entry.job ||
                        entry.jobNo ||
                        entry.description ||
                        'Labour Payment'}
                    </span>
                    {entry.stage && (
                      <span className="block text-[10px] text-[#817563]">
                        Stage: {entry.stage}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-xs text-[#4f4535] dark:text-slate-300">
                      <ArrowDownLeft size={13} className="text-emerald-600" />
                      {entry.accountName ||
                        entry.mode ||
                        'Cash / Bank Transfer'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(amount)}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      <CheckCircle2 size={12} />
                      Paid
                    </span>
                  </td>
                </tr>
              );
            })}
            {validLedger.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-xs text-[#4f4535] dark:text-slate-400"
                >
                  No payment records found for this artisan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
