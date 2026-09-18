import React from 'react';
import {X, Plus, User, Gem} from 'lucide-react';
import {Process, Karigar, ProcessStage, StageCrystalItem} from './types';

interface AddStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  editingStage: ProcessStage | null;
  processes: Process[];
  karigars: Karigar[];
  selectedProcessId: string;
  setSelectedProcessId: (id: string) => void;
  selectedKarigarIds: string[];
  onKarigarToggle: (id: string) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  fineGoldIssued: number;
  setFineGoldIssued: (val: number) => void;
  purity: number;
  setPurity: (val: number) => void;
  grossWeight: number;
  setGrossWeight: (val: number) => void;
  labourType: 'percentage' | 'fixed';
  setLabourType: (type: 'percentage' | 'fixed') => void;
  labourCharges: number;
  setLabourCharges: (val: number) => void;
  wastage: number;
  setWastage: (val: number) => void;
  stageCrystals: StageCrystalItem[];
  setStageCrystals: (crystals: StageCrystalItem[]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const AddStageModal: React.FC<AddStageModalProps> = ({
  isOpen,
  onClose,
  isEditMode,
  processes,
  karigars,
  selectedProcessId,
  setSelectedProcessId,
  selectedKarigarIds,
  onKarigarToggle,
  issueDate,
  setIssueDate,
  fineGoldIssued,
  setFineGoldIssued,
  purity,
  setPurity,
  grossWeight,
  setGrossWeight,
  labourType,
  setLabourType,
  labourCharges,
  setLabourCharges,
  wastage,
  setWastage,
  onSubmit,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  const handleNumericKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    allowDecimal = true,
  ) => {
    const allowed = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];
    if (
      allowed.includes(e.key) ||
      (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
    )
      return;
    if (
      allowDecimal &&
      e.key === '.' &&
      !(e.target as HTMLInputElement).value.includes('.')
    )
      return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#d3c4af]/20 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-[#d3c4af]/10 pb-4 dark:border-slate-800">
          <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1a1c1b] dark:text-white">
            {isEditMode ? 'Edit Process Stage' : 'Assign Process to Karigar'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Process Selection */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Manufacturing Process <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProcessId}
              onChange={(e) => setSelectedProcessId(e.target.value)}
              className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select process</option>
              {processes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Karigar Multi-select */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Assigned Karigar(s) <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 rounded-xl border border-[#d3c4af]/30 bg-[#f9f9f7] p-3 dark:border-slate-800 dark:bg-slate-800/50">
              {karigars.map((k) => {
                const isSelected = selectedKarigarIds.includes(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => onKarigarToggle(k.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#785600] text-white shadow-sm'
                        : 'border border-[#d3c4af]/30 bg-white text-[#4f4535] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <User size={12} />
                    <span>{k.name}</span>
                  </button>
                );
              })}
              {karigars.length === 0 && (
                <p className="text-xs text-slate-400">No karigars found.</p>
              )}
            </div>
          </div>

          {/* Issue Date & Gold Issued */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Issue Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Fine Gold Issued (g) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.000"
                value={fineGoldIssued === 0 ? '' : fineGoldIssued}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setFineGoldIssued(parseFloat(val) || 0);
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Purity, Gross Wt, Wastage */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Purity (%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="91.6"
                value={purity === 0 ? '' : purity}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setPurity(parseFloat(val) || 0);
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Gross Wt (g)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.000"
                value={grossWeight === 0 ? '' : grossWeight}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setGrossWeight(parseFloat(val) || 0);
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Allowed Wastage (g)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.000"
                value={wastage === 0 ? '' : wastage}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setWastage(parseFloat(val) || 0);
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Labour Type & Labour Charges */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Labour Type
              </label>
              <select
                value={labourType}
                onChange={(e) => setLabourType(e.target.value as any)}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                {labourType === 'percentage'
                  ? 'Labour Rate (%)'
                  : 'Labour Amount (₹)'}
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={labourCharges === 0 ? '' : labourCharges}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setLabourCharges(parseFloat(val) || 0);
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-3 border-t border-[#d3c4af]/10 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#d3c4af]/30 px-5 py-2.5 text-sm font-medium text-[#4f4535] hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-[#785600] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#785600]/20 transition-all hover:bg-[#986d00] disabled:opacity-50"
          >
            {isSubmitting
              ? 'Submitting...'
              : isEditMode
                ? 'Update Stage'
                : 'Assign Process'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStageModal;
