import React from 'react';
import {Layers, X, Save} from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {formatNumberDisplay} from './boxUtils';

interface AddBoxModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  modalCards: any[];
  handleRemoveCard: (index: number) => void;
  handlePuritySelect: (index: number, value: string) => void;
  tarCards: any[];
  getAvailableTarQty: (purity: string) => number;
  sizes: any[];
  handleCardChange: (index: number, field: string, value: string) => void;
  getModalScaleProps: (index: number, field: string) => any;
  handleSaveCard: (index: number) => void;
}

const AddBoxModal: React.FC<AddBoxModalProps> = ({
  isModalOpen,
  setIsModalOpen,
  modalCards = [],
  handleRemoveCard,
  handlePuritySelect,
  tarCards = [],
  getAvailableTarQty,
  sizes = [],
  handleCardChange,
  getModalScaleProps,
  handleSaveCard,
}) => {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div
        className={`w-full ${
          modalCards.length > 1 ? 'max-w-4xl' : 'max-w-lg'
        } flex max-h-[90vh] flex-col rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl transition-all dark:border-slate-700 dark:bg-slate-900`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                Add Box Process
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Cards Container */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className={`grid gap-4 ${
              modalCards.length > 1
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {modalCards.map((card, idx) => {
              const isCardSaving = card.isSaving || false;
              return (
                <div
                  key={card.id || idx}
                  className="relative flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80"
                >
                  {/* Card Top / Header */}
                  {modalCards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCard(idx)}
                      disabled={isCardSaving}
                      className="rounded-md p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                      title="Remove this card"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Card Inputs */}
                  <div className="space-y-3">
                    {/* Purity Dropdown & Available Tar Wt */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                          Purity (%) <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={card.purity}
                          onChange={(e) =>
                            handlePuritySelect(idx, e.target.value)
                          }
                          className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        >
                          <option value="">Select Purity</option>
                          {tarCards.map((opt) => (
                            <option key={opt.purity} value={opt.purity}>
                              Tar {opt.purity}%
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                          Available Tar Wt (G)
                        </label>
                        <GenericInputField
                          type="text"
                          readOnly
                          decimalScale={3}
                          value={
                            card.purity
                              ? formatNumberDisplay(
                                  getAvailableTarQty(card.purity),
                                )
                              : '0'
                          }
                          suffix="G"
                          compact
                          className="font-mono cursor-not-allowed font-bold text-[#785600] dark:text-amber-400"
                        />
                      </div>
                    </div>

                    {/* Tar Wt & Chain Weight */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Size */}
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                          Size <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={card.sizeId}
                          onChange={(e) =>
                            handleCardChange(idx, 'sizeId', e.target.value)
                          }
                          className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        >
                          <option value="">Select Size</option>
                          {sizes.map((size) => (
                            <option key={size.id} value={size.id}>
                              {size.size || JSON.stringify(size)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                          Tar Weight (G) <span className="text-red-500">*</span>
                        </label>
                        <GenericInputField
                          type="text"
                          inputMode="decimal"
                          decimalScale={3}
                          value={card.tarWeight}
                          {...getModalScaleProps(idx, 'tarWeight')}
                          onChange={(e) =>
                            handleCardChange(idx, 'tarWeight', e.target.value)
                          }
                          placeholder="0.000"
                          suffix="G"
                          compact
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="mt-4 border-t border-[#d3c4af]/20 pt-3 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => handleSaveCard(idx)}
                      disabled={isCardSaving}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] py-2 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.01] hover:shadow active:scale-[0.99] disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{isCardSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBoxModal;
