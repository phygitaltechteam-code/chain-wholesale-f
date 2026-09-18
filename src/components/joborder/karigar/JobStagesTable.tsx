import React from 'react';
import {Eye, CreditCard, Clock, CheckCircle2, AlertCircle} from 'lucide-react';
import {JobStage} from './KarigarByid';
import {formatCurrency} from '@/utils/utilities';

interface JobStagesTableProps {
  stages: JobStage[];
  onViewJob: (jobId: string) => void;
  onMakePayment: (stage: JobStage) => void;
  formatDate: (date?: string) => string;
  formatTime: (date?: string) => string;
}

export const JobStagesTable: React.FC<JobStagesTableProps> = ({
  stages,
  onViewJob,
  onMakePayment,
  formatDate,
  formatTime,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'in-progress':
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
            <Clock size={12} />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <AlertCircle size={12} />
            {status || 'Pending'}
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d3c4af]/20 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="border-b border-[#d3c4af]/10 bg-[#f4f4f2]/60 text-xs uppercase tracking-[0.15em] text-[#4f4535] dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
              <th className="px-4 py-3.5 text-left font-semibold">Job Details</th>
              <th className="px-4 py-3.5 text-left font-semibold">Process & Metal</th>
              <th className="px-4 py-3.5 text-left font-semibold">Date Issued</th>
              <th className="px-4 py-3.5 text-right font-semibold">Issued Wt</th>
              <th className="px-4 py-3.5 text-right font-semibold">Received Wt</th>
              <th className="px-4 py-3.5 text-right font-semibold">Wastage</th>
              <th className="px-4 py-3.5 text-right font-semibold">Labour Amount</th>
              <th className="px-4 py-3.5 text-right font-semibold">Paid</th>
              <th className="px-4 py-3.5 text-right font-semibold">Pending</th>
              <th className="px-4 py-3.5 text-center font-semibold">Status</th>
              <th className="px-4 py-3.5 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d3c4af]/10 dark:divide-slate-800">
            {stages.map((stage) => (
              <tr
                key={stage.id}
                className="group transition-colors hover:bg-[#f4f4f2]/40 dark:hover:bg-slate-800/40"
              >
                {/* Job Details */}
                <td className="px-4 py-3.5">
                  <span className="block text-xs font-bold text-[#1a1c1b] dark:text-white">
                    {stage.jobNo}
                  </span>
                  <span className="block text-xs text-[#817563]">
                    {stage.itemName}
                  </span>
                </td>

                {/* Process & Metal */}
                <td className="px-4 py-3.5">
                  <span className="block text-xs font-medium text-[#1a1c1b] dark:text-white">
                    {stage.processName}
                  </span>
                  <span className="inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#785600] dark:bg-amber-950/40 dark:text-amber-400">
                    {stage.metal}
                  </span>
                </td>

                {/* Date Issued */}
                <td className="px-4 py-3.5">
                  <span className="block text-xs text-[#4f4535] dark:text-slate-300">
                    {formatDate(stage.issueDate)}
                  </span>
                  <span className="block text-[10px] text-[#817563]">
                    {formatTime(stage.issueDate)}
                  </span>
                </td>

                {/* Issued Wt */}
                <td className="px-4 py-3.5 text-right text-xs font-medium text-[#785600] dark:text-amber-400">
                  {stage.giveM.toFixed(3)}g
                </td>

                {/* Received Wt */}
                <td className="px-4 py-3.5 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {stage.takenWt.toFixed(3)}g
                </td>

                {/* Wastage */}
                <td className="px-4 py-3.5 text-right text-xs text-red-600 dark:text-red-400">
                  {stage.wastage.toFixed(3)}g
                </td>

                {/* Labour */}
                <td className="px-4 py-3.5 text-right text-xs font-semibold text-[#1a1c1b] dark:text-white">
                  {formatCurrency(stage.payment)}
                </td>

                {/* Paid */}
                <td className="px-4 py-3.5 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(stage.paidAmount)}
                </td>

                {/* Pending */}
                <td className="px-4 py-3.5 text-right text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {formatCurrency(stage.pendingAmount)}
                </td>

                {/* Status */}
                <td className="px-4 py-3.5 text-center">
                  {getStatusBadge(stage.status)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onViewJob(stage.jobId)}
                      className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#1a1c1b] dark:hover:bg-slate-800 dark:hover:text-white"
                      title="View Job"
                    >
                      <Eye size={15} />
                    </button>
                    {stage.pendingAmount > 0 && (
                      <button
                        onClick={() => onMakePayment(stage)}
                        className="rounded-lg bg-[#785600]/10 p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/20 dark:bg-amber-400/10 dark:text-amber-400"
                        title="Make Labour Payment"
                      >
                        <CreditCard size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {stages.length === 0 && (
              <tr>
                <td colSpan={11} className="py-12 text-center text-xs text-[#4f4535] dark:text-slate-400">
                  No job stages found matching the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
