// components/MetalExchangeSection.tsx
import React from 'react';
import {UseFormRegister} from 'react-hook-form';
import {BillingFormDataWithFields} from './billing.types';

interface MetalExchangeSectionProps {
  register: UseFormRegister<BillingFormDataWithFields>;
  exchangeFineWt: number;
  exchangeValue: number;
  formatNumber: (value: number, decimals?: number) => string;
  formatCurrency: (value: number) => string;
}

const metalTypes = ['Gold', 'Silver'];

export const MetalExchangeSection: React.FC<MetalExchangeSectionProps> = ({
  register,
  exchangeFineWt,
  exchangeValue,
  formatNumber,
  formatCurrency,
}) => {
  return (
    <div className="rounded-xl border border-l-4 border-[#d3c4af]/10 border-l-[#785600] bg-white p-4 md:p-6">
      <h3 className="mb-4 font-['Noto_Serif'] text-lg font-bold text-[#785600] md:mb-6 md:text-xl">
        Metal Exchange Details
      </h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6 md:gap-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535]">
            Metal Type
          </label>
          <select
            {...register('exchangeMetalType')}
            className="w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm focus:ring-2 focus:ring-[#785600]/20 md:px-4 md:py-3"
          >
            <option value="">Select Metal Type</option>
            {metalTypes.map((metal) => (
              <option key={metal} value={metal}>
                {metal}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535]">
            Gross Wt (g)
          </label>
          <input
            type="number"
            step="0.001"
            {...register('exchangeGrossWeight')}
            placeholder="5.250"
            className="w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm focus:ring-2 focus:ring-[#785600]/20 md:px-4 md:py-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535]">
            Purity (%)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('exchangePurity')}
            placeholder="Enter purity %"
            className="w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm focus:ring-2 focus:ring-[#785600]/20 md:px-4 md:py-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535]">
            Fine Wt (g)
          </label>
          <input
            type="text"
            disabled
            value={formatNumber(exchangeFineWt, 3)}
            className="w-full rounded-lg border-0 bg-[#e8e8e6] px-3 py-2 text-sm font-bold text-[#785600] md:px-4 md:py-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535]">
            Rate (₹/g)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('exchangeRate')}
            placeholder="Enter rate"
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
            value={formatCurrency(exchangeValue)}
            className="w-full rounded-lg border-0 bg-[#e8e8e6] px-3 py-2 text-sm font-bold text-[#785600] md:px-4 md:py-3"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#d3c4af]/10 pt-3 md:mt-4 md:pt-4">
        <span className="text-[10px] font-bold italic text-[#4f4535] md:text-xs">
          Metal Exchange Value:
        </span>
        <span className="font-mono text-base font-black text-[#785600] md:text-lg">
          {formatCurrency(exchangeValue)}
        </span>
      </div>
    </div>
  );
};
