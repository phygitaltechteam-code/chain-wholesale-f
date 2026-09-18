import React from 'react';
import {ArrowLeft, Sparkles} from 'lucide-react';
import {Job} from './types';

interface JobHeaderProps {
  job: Job | null;
  onBackClick: () => void;
  onEditJob?: () => void;
  canEdit?: boolean;
}

export const JobHeader: React.FC<JobHeaderProps> = ({job, onBackClick}) => {
  const status = job?.calculatedStatus || job?.status || 'PENDING';

  const statusColors: Record<string, string> = {
    PENDING:
      'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    IN_PROGRESS:
      'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    COMPLETED:
      'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  };

  return (
    <div className="border-b border-[#d3c4af]/20 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackClick}
            className="flex items-center gap-1.5 rounded-xl border border-[#d3c4af]/30 bg-[#f9f9f7] px-3 py-1.5 text-xs font-semibold text-[#4f4535] transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="h-5 w-px bg-[#d3c4af]/20 dark:bg-slate-700" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Playfair_Display'] text-xl font-bold text-[#1a1c1b] dark:text-white sm:text-2xl">
                {job?.itemName || 'Manufacturing Job'}
              </h1>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusColors[status] || 'bg-slate-100 text-slate-800'}`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-[#817563]">
              Job Reference:{' '}
              <span className="font-semibold text-[#785600] dark:text-amber-400">
                {job?.jobNo || job?.id?.slice(0, 8)}
              </span>
              {job?.client?.fullName && ` • Client: ${job.client.fullName}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-[#785600] dark:bg-amber-950/40 dark:text-amber-400">
            <Sparkles size={14} />
            <span>
              {job?.metal || 'GOLD'} {job?.purity ? `${job.purity}%` : ''}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default JobHeader;
