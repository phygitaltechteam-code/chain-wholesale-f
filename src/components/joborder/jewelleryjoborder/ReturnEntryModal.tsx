import React from 'react';
import {X, RotateCcw} from 'lucide-react';
import {ProcessStage} from './types';

interface ReturnEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: ProcessStage | null;
  returnDate: string;
  setReturnDate: (date: string) => void;
  goldReceived: number;
  setGoldReceived: (val: number) => void;
  returnWastage: number;
  setReturnWastage: (val: number) => void;
  scrap: number;
  setScrap: (val: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const ReturnEntryModal: React.FC<ReturnEntryModalProps> = ({
  isOpen,
  onClose,
  stage,
  returnDate,
  setReturnDate,
  goldReceived,
  setGoldReceived,
  returnWastage,
  setReturnWastage,
  scrap,
  setScrap,
  onSubmit,
  isSubmitting,
}) => {
  if (!isOpen || !stage) return null;

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, allowDecimal = true) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(e.key) || (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))) return;
    if (allowDecimal && e.key === '.' && !(e.target as HTMLInputElement).value.includes('.')) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#d3c4af]/20 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-[#d3c4af]/10 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <RotateCcw size={16} />
            </div>
            <div>
              <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1a1c1b] dark:text-white">
                Record Stage Return
              </h3>
              <p className="text-xs text-[#817563]">
                Process: <strong>{stage.processName}</strong> (Issued: {stage.fineGoldIssued}g)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Return Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Gold Received (g) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.000"
              value={goldReceived === 0 ? '' : goldReceived}
              onKeyDown={(e) => handleNumericKeyDown(e, true)}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setGoldReceived(parseFloat(val) || 0);
              }}
              className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Return Wastage (g)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.000"
                value={returnWastage === 0 ? '' : returnWastage}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setReturnWastage(parseFloat(val) || 0);
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Scrap (g)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.000"
                value={scrap === 0 ? '' : scrap}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setScrap(parseFloat(val) || 0);
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
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-emerald-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Complete Stage'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnEntryModal;
