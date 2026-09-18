import React from 'react';
import {CheckCircle2, Clock, Edit2, RotateCcw, User, Gem, Sparkles} from 'lucide-react';
import {ProcessStage} from './types';
import {formatCurrency} from '@/utils/utilities';

interface StageCardProps {
  stage: ProcessStage;
  onEdit?: (stage: ProcessStage) => void;
  onReturn?: (stage: ProcessStage) => void;
  canEdit?: boolean;
}

export const StageCard: React.FC<StageCardProps> = ({
  stage,
  onEdit,
  onReturn,
  canEdit = false,
}) => {
  const isCompleted = stage.status === 'COMPLETED';

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return !isNaN(d.getTime())
      ? d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—';
  };

  const karigarNames = stage.karigarDetails?.length
    ? stage.karigarDetails.map((k) => k.name).join(', ')
    : 'Unassigned';

  return (
    <div
      className={`relative rounded-2xl border p-4 shadow-sm transition-all sm:p-5 ${
        isCompleted
          ? 'border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-900/50 dark:bg-emerald-950/10'
          : 'border-[#d3c4af]/30 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d3c4af]/15 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-[#785600] dark:bg-amber-950/60 dark:text-amber-400'
            }`}
          >
            {isCompleted ? <CheckCircle2 size={20} /> : <Clock size={20} />}
          </div>
          <div>
            <h4 className="font-['Playfair_Display'] text-sm font-bold text-[#1a1c1b] dark:text-white sm:text-base">
              {stage.processName || 'Manufacturing Stage'}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-[#817563]">
              <User size={12} />
              <span className="font-medium text-[#4f4535] dark:text-slate-300">
                Karigar: <strong className="text-[#1a1c1b] dark:text-white">{karigarNames}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            {isCompleted ? 'Completed' : 'In Progress'}
          </span>

          {canEdit && !isCompleted && onReturn && (
            <button
              onClick={() => onReturn(stage)}
              className="flex items-center gap-1 rounded-xl bg-[#785600] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#986d00]"
            >
              <RotateCcw size={12} />
              <span>Return / Complete</span>
            </button>
          )}

          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(stage)}
              className="rounded-lg border border-[#d3c4af]/30 p-1.5 text-[#817563] transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              title="Edit Stage Details"
            >
              <Edit2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-[10px] font-bold uppercase text-[#817563]">Issued Gold</p>
          <p className="mt-0.5 font-bold text-xs text-[#785600] dark:text-amber-400">
            {stage.fineGoldIssued.toFixed(3)} g
          </p>
        </div>

        <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-[10px] font-bold uppercase text-[#817563]">Purity / Gross</p>
          <p className="mt-0.5 font-semibold text-xs text-[#1a1c1b] dark:text-white">
            {stage.purity}% • {stage.grossWeight}g
          </p>
        </div>

        <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-[10px] font-bold uppercase text-[#817563]">Issue Date</p>
          <p className="mt-0.5 font-semibold text-xs text-[#1a1c1b] dark:text-white">
            {formatDate(stage.dateIssued)}
          </p>
        </div>

        <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-[10px] font-bold uppercase text-[#817563]">Labour Charge</p>
          <p className="mt-0.5 font-semibold text-xs text-[#1a1c1b] dark:text-white">
            {stage.labourType === 'percentage'
              ? `${stage.labourCharges}% (${formatCurrency(stage.labourAmount || 0)})`
              : formatCurrency(stage.labourCharges)}
          </p>
        </div>

        <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-[10px] font-bold uppercase text-[#817563]">Wastage</p>
          <p className="mt-0.5 font-semibold text-xs text-[#1a1c1b] dark:text-white">
            {stage.wastage} g
          </p>
        </div>

        <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-[10px] font-bold uppercase text-[#817563]">Return Date</p>
          <p className="mt-0.5 font-semibold text-xs text-[#1a1c1b] dark:text-white">
            {formatDate(stage.returnDate)}
          </p>
        </div>
      </div>

      {/* Return Summary (If completed) */}
      {isCompleted && (
        <div className="mt-3 flex flex-wrap items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <span className="font-bold text-emerald-800 dark:text-emerald-300">Return Ledger:</span>
          <span>Received: <strong>{stage.goldReceived || 0}g</strong></span>
          <span>Scrap: <strong>{stage.scrap || 0}g</strong></span>
          <span>Return Wastage: <strong>{stage.returnWastage || 0}g</strong></span>
        </div>
      )}

      {/* Crystals attached to stage */}
      {stage.jobStageCrystals && stage.jobStageCrystals.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#d3c4af]/10 pt-2.5 text-xs text-[#4f4535] dark:border-slate-800 dark:text-slate-300">
          <span className="flex items-center gap-1 font-bold text-[#785600] dark:text-amber-400">
            <Gem size={12} />
            Allocated Stones:
          </span>
          {stage.jobStageCrystals.map((c: any, i: number) => (
            <span
              key={i}
              className="rounded-lg border border-[#d3c4af]/20 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-[#1a1c1b] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {c.crystal?.name || c.name || 'Stone'} ({c.qty} pcs)
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default StageCard;
