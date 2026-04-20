// components/ItemEntrySection.tsx
import React, {useEffect} from 'react';
import {UseFormRegister, UseFormSetValue, UseFormWatch} from 'react-hook-form';
import {Trash2} from 'lucide-react';
import {BillingFormDataWithFields, MetalItem} from './billing.types';

interface ItemEntrySectionProps {
  register: UseFormRegister<BillingFormDataWithFields>;
  setValue: UseFormSetValue<BillingFormDataWithFields>;
  watch: UseFormWatch<BillingFormDataWithFields>;
  metalItem: MetalItem | null;
  liveAmount: number;
  validationErrors: {
    metalName?: string;
    fineWeight?: string;
    rate?: string;
  };
  onFineWeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveItem: () => void;
  formatCurrency: (value: number) => string;
  paymentMode: string;
}

export const ItemEntrySection: React.FC<ItemEntrySectionProps> = ({
  register,
  setValue,
  watch,
  metalItem,
  liveAmount,
  validationErrors,
  onFineWeightChange,
  onRateChange,
  onRemoveItem,
  formatCurrency,
  paymentMode,
}) => {
  const exchangeFineWt = watch('exchangeFineWeight') || '0';
  const exchangeRate = watch('exchangeRate') || '0';

  // Auto-fill ONLY Fine Weight from exchange (Rate will NOT be auto-filled)
  useEffect(() => {
    if (paymentMode === 'EXCHANGE' || paymentMode === 'SPLIT') {
      // Set fine weight from exchange calculation
      if (parseFloat(exchangeFineWt) > 0) {
        setValue('fineWeight', exchangeFineWt);
      }

      // DO NOT auto-fill rate - keep it editable
      // Rate will be set by user manually
    }
  }, [exchangeFineWt, paymentMode, setValue]);

  return (
    <div className="rounded-xl border border-l-4 border-[#d3c4af]/10 border-l-[#785600] bg-white p-4 md:p-6">
      <h3 className="mb-4 font-['Noto_Serif'] text-lg font-bold text-[#785600] md:mb-6 md:text-xl">
        Item Sold (Metal Entry)
      </h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535]">
            Metal Name
          </label>
          <input
            type="text"
            {...register('metalType')}
            placeholder="Enter metal name (e.g., Gold 22K)"
            className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm focus:ring-2 focus:ring-[#785600]/20 md:px-4 md:py-3 ${
              validationErrors.metalName
                ? 'border-2 border-red-300 bg-red-50'
                : ''
            }`}
          />
          {validationErrors.metalName && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.metalName}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535]">
            Fine Wt (g)
          </label>
          <input
            type="text"
            inputMode="decimal"
            {...register('fineWeight')}
            onChange={onFineWeightChange}
            readOnly={paymentMode === 'EXCHANGE' || paymentMode === 'SPLIT'}
            placeholder="9.572"
            className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm focus:ring-2 focus:ring-[#785600]/20 md:px-4 md:py-3 ${
              paymentMode === 'EXCHANGE' || paymentMode === 'SPLIT'
                ? 'bg-gray-100'
                : ''
            }`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535]">
            Rate / Gram
          </label>
          <input
            type="text"
            inputMode="decimal"
            {...register('rate')}
            onChange={onRateChange}
            placeholder="7245.00"
            className="w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm focus:ring-2 focus:ring-[#785600]/20 md:px-4 md:py-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535]">
            Amount
          </label>
          <input
            type="text"
            disabled
            value={formatCurrency(liveAmount)}
            className="w-full rounded-lg border-0 bg-[#e8e8e6] px-3 py-2 text-sm font-bold text-[#785600] md:px-4 md:py-3"
          />
        </div>
      </div>

      {/* {metalItem && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="text-green-700">
              ✓ Item added: {metalItem.metalType} - {metalItem.fineWeight.toFixed(3)}g @ ₹
              {metalItem.rate.toFixed(2)} = {formatCurrency(metalItem.amount)}
            </p>
            <button
              onClick={onRemoveItem}
              className="rounded-lg p-1 text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )} */}
    </div>
  );
};
