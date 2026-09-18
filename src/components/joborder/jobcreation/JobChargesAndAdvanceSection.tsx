import React, {useState, useEffect} from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';

interface JobChargesAndAdvanceSectionProps {
  metal?: string;
  grossWt?: number;
  metalMakingCharges: {
    enteredValue: number;
    calculatedValue: number;
  };
  onMetalMakingChargesChange: (charges: {
    enteredValue: number;
    calculatedValue: number;
  }) => void;
  cashMakingCharges: {
    subtype: string;
    enteredValue: number;
    calculatedValue: number;
  };
  onCashMakingChargesChange: (charges: {
    subtype: string;
    enteredValue: number;
    calculatedValue: number;
  }) => void;
  cashAdvance: number;
  onCashAdvanceChange: (val: number) => void;
  goldAdvance: number;
  onGoldAdvanceChange: (val: number) => void;
}

export const JobChargesAndAdvanceSection: React.FC<
  JobChargesAndAdvanceSectionProps
> = ({
  metal = 'Gold',
  grossWt = 0,
  metalMakingCharges,
  onMetalMakingChargesChange,
  cashMakingCharges,
  onCashMakingChargesChange,
  cashAdvance,
  onCashAdvanceChange,
  goldAdvance,
  onGoldAdvanceChange,
}) => {
  const [isMakingChargesCollapsed, setIsMakingChargesCollapsed] =
    useState(false);
  const [isAdvanceCollapsed, setIsAdvanceCollapsed] = useState(false);

  // Auto calculate cash making charges amount if per_gm or amount changes
  useEffect(() => {
    if (cashMakingCharges.subtype === 'PER_GM') {
      const calc = Number(
        ((cashMakingCharges.enteredValue || 0) * (grossWt || 0)).toFixed(2),
      );
      if (calc !== cashMakingCharges.calculatedValue) {
        onCashMakingChargesChange({
          ...cashMakingCharges,
          calculatedValue: calc,
        });
      }
    } else if (cashMakingCharges.subtype === 'AMOUNT') {
      const calc = cashMakingCharges.enteredValue || 0;
      if (calc !== cashMakingCharges.calculatedValue) {
        onCashMakingChargesChange({
          ...cashMakingCharges,
          calculatedValue: calc,
        });
      }
    }
  }, [cashMakingCharges.subtype, cashMakingCharges.enteredValue, grossWt]);

  const handleNumericKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    allowDecimal = true,
  ) => {
    const allowedKeys = [
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
      allowedKeys.includes(e.key) ||
      (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
    ) {
      return;
    }
    if (allowDecimal && e.key === '.') {
      if ((e.target as HTMLInputElement).value.includes('.')) {
        e.preventDefault();
      }
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const displayMetal = metal.toUpperCase() === 'SILVER' ? 'Silver' : 'Gold';

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Making Charges Card (Spans 2 cols) */}
      <div className="rounded-xl border border-l-4 border-[#e5ded3] border-l-[#785600] bg-white p-4 shadow-sm dark:border-slate-800 dark:border-l-[#c59a3f] dark:bg-slate-900 lg:col-span-2">
        <div
          onClick={() => setIsMakingChargesCollapsed(!isMakingChargesCollapsed)}
          className="flex cursor-pointer items-center justify-between pb-2"
        >
          <h3 className="font-['Playfair_Display'] text-base font-bold text-[#785600] dark:text-amber-400">
            Making Charges
          </h3>
          <button
            type="button"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            {isMakingChargesCollapsed ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronUp size={18} />
            )}
          </button>
        </div>

        {!isMakingChargesCollapsed && (
          <div className="mt-2 space-y-4 pt-2">
            {/* Row 1: METAL & MAKING CHARGES (GM) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                  METAL
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={displayMetal}
                  className="w-full rounded-lg border border-[#e5ded3] bg-[#f5f3ef]/70 px-3 py-2 text-sm font-medium text-[#4f4535] outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                  MAKING CHARGES (GM)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter gm"
                  value={
                    metalMakingCharges.enteredValue === 0
                      ? ''
                      : metalMakingCharges.enteredValue
                  }
                  onKeyDown={(e) => handleNumericKeyDown(e, true)}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    const num = parseFloat(val) || 0;
                    onMetalMakingChargesChange({
                      enteredValue: num,
                      calculatedValue: num,
                    });
                  }}
                  className="w-full rounded-lg border border-[#e5ded3] bg-white px-3 py-2 text-sm text-[#1a1c1b] outline-none transition-all placeholder:text-[#817563]/60 focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Row 2: TYPE, SUBTYPE, AMOUNT, AMOUNT (₹) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                  TYPE
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value="Cash"
                  className="w-full rounded-lg border border-[#e5ded3] bg-[#f5f3ef]/70 px-3 py-2 text-sm font-medium text-[#4f4535] outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                  SUBTYPE
                </label>
                <select
                  value={cashMakingCharges.subtype}
                  onChange={(e) => {
                    const st = e.target.value;
                    const calculated =
                      st === 'PER_GM'
                        ? Number(
                            (
                              (cashMakingCharges.enteredValue || 0) * grossWt
                            ).toFixed(2),
                          )
                        : cashMakingCharges.enteredValue || 0;
                    onCashMakingChargesChange({
                      ...cashMakingCharges,
                      subtype: st,
                      calculatedValue: calculated,
                    });
                  }}
                  className="w-full rounded-lg border border-[#e5ded3] bg-white px-3 py-2 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Select option</option>
                  <option value="AMOUNT">Amount</option>
                  <option value="PER_GM">Per/gm</option>
                </select>
              </div>

              {/* Dynamic Amount / Per-GM Input */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                  {cashMakingCharges.subtype === 'PER_GM' ? 'PER/GM' : 'AMOUNT'}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={
                    cashMakingCharges.subtype === 'PER_GM'
                      ? 'Enter per/gm'
                      : cashMakingCharges.subtype === 'AMOUNT'
                        ? 'Enter amount'
                        : 'Enter value'
                  }
                  disabled={!cashMakingCharges.subtype}
                  value={
                    cashMakingCharges.enteredValue === 0
                      ? ''
                      : cashMakingCharges.enteredValue
                  }
                  onKeyDown={(e) => handleNumericKeyDown(e, true)}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    const num = parseFloat(val) || 0;
                    const calculated =
                      cashMakingCharges.subtype === 'PER_GM'
                        ? Number((num * grossWt).toFixed(2))
                        : num;
                    onCashMakingChargesChange({
                      ...cashMakingCharges,
                      enteredValue: num,
                      calculatedValue: calculated,
                    });
                  }}
                  className="w-full rounded-lg border border-[#e5ded3] bg-white px-3 py-2 text-sm text-[#1a1c1b] outline-none transition-all placeholder:text-[#817563]/60 focus:border-[#785600] disabled:bg-[#f5f3ef]/40 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-800/40"
                />
              </div>

              {/* Calculated Total Amount */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                  AMOUNT (₹)
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={
                    cashMakingCharges.calculatedValue > 0
                      ? `₹${cashMakingCharges.calculatedValue.toFixed(2)}`
                      : ''
                  }
                  placeholder="₹0.00"
                  className="w-full rounded-lg border border-[#e5ded3] bg-[#f5f3ef]/70 px-3 py-2 text-sm font-semibold text-[#785600] outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-amber-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advance Card (Spans 1 col) */}
      <div className="rounded-xl border border-l-4 border-[#e5ded3] border-l-[#785600] bg-white p-4 shadow-sm dark:border-slate-800 dark:border-l-[#c59a3f] dark:bg-slate-900 lg:col-span-1">
        <div
          onClick={() => setIsAdvanceCollapsed(!isAdvanceCollapsed)}
          className="flex cursor-pointer items-center justify-between pb-2"
        >
          <h3 className="font-['Playfair_Display'] text-base font-bold text-[#785600] dark:text-amber-400">
            Advance
          </h3>
          <button
            type="button"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            {isAdvanceCollapsed ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronUp size={18} />
            )}
          </button>
        </div>

        {!isAdvanceCollapsed && (
          <div className="mt-2 space-y-4 pt-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                CASH ADVANCE (₹)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={cashAdvance === 0 ? '' : cashAdvance}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  onCashAdvanceChange(parseFloat(val) || 0);
                }}
                className="w-full rounded-lg border border-[#e5ded3] bg-white px-3 py-2 text-sm text-[#1a1c1b] outline-none transition-all placeholder:text-[#817563]/60 focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                GOLD ADVANCE (G)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00 g"
                value={goldAdvance === 0 ? '' : goldAdvance}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  onGoldAdvanceChange(parseFloat(val) || 0);
                }}
                className="w-full rounded-lg border border-[#e5ded3] bg-white px-3 py-2 text-sm text-[#1a1c1b] outline-none transition-all placeholder:text-[#817563]/60 focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobChargesAndAdvanceSection;
