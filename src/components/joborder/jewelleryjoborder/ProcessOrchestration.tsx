import React, {useState} from 'react';
import {Layers, Plus, CheckCircle2, Clock} from 'lucide-react';
import {ProcessStage} from './types';
import StageCard from './StageCard';

interface ProcessOrchestrationProps {
  processStages: ProcessStage[];
  completedStages: ProcessStage[];
  inProgressStages: ProcessStage[];
  onOpenAddStage: () => void;
  onEditStage: (stage: ProcessStage) => void;
  onReturnStage: (stage: ProcessStage) => void;
  canEdit?: boolean;
}

export const ProcessOrchestration: React.FC<ProcessOrchestrationProps> = ({
  processStages,
  completedStages,
  inProgressStages,
  onOpenAddStage,
  onEditStage,
  onReturnStage,
  canEdit = false,
}) => {
  const [activeTab, setActiveTab] = useState<
    'all' | 'in_progress' | 'completed'
  >('all');

  const displayedStages =
    activeTab === 'completed'
      ? completedStages
      : activeTab === 'in_progress'
        ? inProgressStages
        : processStages;

  return (
    <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header and Add Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d3c4af]/10 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-[#785600] dark:bg-amber-950/40 dark:text-amber-400">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="font-['Playfair_Display'] text-base font-bold text-[#1a1c1b] dark:text-white">
              Manufacturing Process Pipeline
            </h3>
            <p className="text-xs text-[#817563]">
              Track artisan workflow, fine metal allocations & return entries
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={onOpenAddStage}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#785600] to-[#986d00] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#785600]/20 transition-all hover:brightness-105"
          >
            <Plus size={15} />
            <span>Add Process Stage</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-[#785600] text-white shadow-sm'
              : 'border border-[#d3c4af]/20 bg-[#f9f9f7] text-[#4f4535] hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <span>All Stages</span>
          <span className="py-0.2 rounded-full bg-black/10 px-1.5 text-[10px] dark:bg-white/10">
            {processStages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('in_progress')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === 'in_progress'
              ? 'bg-[#785600] text-white shadow-sm'
              : 'border border-[#d3c4af]/20 bg-[#f9f9f7] text-[#4f4535] hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <Clock size={12} />
          <span>In Progress</span>
          <span className="py-0.2 rounded-full bg-black/10 px-1.5 text-[10px] dark:bg-white/10">
            {inProgressStages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === 'completed'
              ? 'bg-[#785600] text-white shadow-sm'
              : 'border border-[#d3c4af]/20 bg-[#f9f9f7] text-[#4f4535] hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <CheckCircle2 size={12} />
          <span>Completed</span>
          <span className="py-0.2 rounded-full bg-black/10 px-1.5 text-[10px] dark:bg-white/10">
            {completedStages.length}
          </span>
        </button>
      </div>

      {/* Stages List */}
      <div className="mt-4 space-y-3.5">
        {displayedStages.map((stage) => (
          <StageCard
            key={stage.id}
            stage={stage}
            onEdit={onEditStage}
            onReturn={onReturnStage}
            canEdit={canEdit}
          />
        ))}

        {displayedStages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#d3c4af]/40 bg-[#f9f9f7]/60 p-8 text-center dark:border-slate-800 dark:bg-slate-800/30">
            <p className="text-xs text-[#817563]">
              {activeTab === 'completed'
                ? 'No completed stages yet.'
                : activeTab === 'in_progress'
                  ? 'No stages currently in progress.'
                  : 'No process stages have been assigned to this job yet.'}
            </p>
            {canEdit && activeTab === 'all' && (
              <button
                onClick={onOpenAddStage}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#785600] hover:underline dark:text-amber-400"
              >
                <Plus size={14} />
                <span>Assign First Process Stage</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessOrchestration;
