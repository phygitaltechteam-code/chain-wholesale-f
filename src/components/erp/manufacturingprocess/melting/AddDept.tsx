import React from 'react';
import {X} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {ScrapCardData} from './meltingUtils';

interface AddDeptProps {
  showAddScrapModal: boolean;
  setShowAddScrapModal: (show: boolean) => void;
  handleSubmitAddScrap: (e?: React.FormEvent) => void;
  selectedPurity: number | '';
  handleSelectPurity: (purity: number | '') => void;
  scrapCards: ScrapCardData[];
  availableWeight: number;
  scrapWeight: string;
  setScrapWeight: (weight: string) => void;
  isSubmittingScrap: boolean;
  modalScaleProps: any;
}

import {formatNumberDisplay} from './meltingUtils';

const AddDept: React.FC<AddDeptProps> = ({
  showAddScrapModal,
  setShowAddScrapModal,
  handleSubmitAddScrap,
  selectedPurity,
  handleSelectPurity,
  scrapCards,
  availableWeight,
  scrapWeight,
  setScrapWeight,
  isSubmittingScrap,
  modalScaleProps,
}) => {
  if (!showAddScrapModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[#d3c4af]/30 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="border-gray-100 mb-4 flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white">
            Add Melting
          </h3>
          <button
            type="button"
            onClick={() => setShowAddScrapModal(false)}
            className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg p-1 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitAddScrap} className="flex flex-col gap-4">
          {/* 1. Purity Dropdown */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1a1c1b] dark:text-slate-200">
              Purity %
            </label>
            <select
              value={selectedPurity}
              onChange={(e) =>
                handleSelectPurity(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Select Purity</option>
              {scrapCards.map((c) => (
                <option key={c.purity} value={c.purity}>
                  {c.purity}%
                </option>
              ))}
            </select>
          </div>

          {/* 2. Weight as per Purity */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1a1c1b] dark:text-slate-200">
              Weight as per Purity (G)
            </label>
            <input
              type="text"
              readOnly
              value={
                selectedPurity !== ''
                  ? `${formatNumberDisplay(availableWeight)} G`
                  : ''
              }
              placeholder="0.000 G"
              className="font-mono w-full cursor-not-allowed rounded-lg border border-[#d3c4af]/20 bg-amber-50/50 px-2 py-1.5 pr-6 text-sm font-bold text-black outline-none dark:bg-amber-950/20 dark:text-amber-400"
            />
          </div>

          {/* 3. One Scrap Weight Input Field */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1a1c1b] dark:text-slate-200">
              Scrap Weight (G)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={scrapWeight}
                {...modalScaleProps}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d*$/.test(val)) {
                    setScrapWeight(val);
                  }
                }}
                placeholder="Enter scrap weight"
                className="font-mono w-full cursor-not-allowed rounded-lg border border-[#d3c4af]/20 bg-amber-50/50 px-2 py-1.5 pr-6 text-sm font-bold text-black outline-none dark:bg-amber-950/20 dark:text-amber-400"
              />
              <span className="text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold">
                G
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-gray-100 mt-2 flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
            <GenericButton
              type="submit"
              variant="primary"
              disabled={
                !selectedPurity ||
                !scrapWeight ||
                (parseFloat(scrapWeight) || 0) <= 0 ||
                isSubmittingScrap
              }
            >
              {isSubmittingScrap ? 'Submitting...' : 'Submit'}
            </GenericButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDept;
