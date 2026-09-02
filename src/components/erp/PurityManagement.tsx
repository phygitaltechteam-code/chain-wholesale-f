import React, { useState, useMemo } from 'react';
import {
  Calculator,
  RefreshCw,
  Copy,
  Info,
  Sparkles,
} from 'lucide-react';
import PageHeader from '@/components/Forms/Common/PageHeader';
import toast from 'react-hot-toast';

export const PurityManagement: React.FC = () => {
  // Input states
  const [goldWeight, setGoldWeight] = useState<string>('');
  const [currentPurity, setCurrentPurity] = useState<string>('');
  const [targetPurity, setTargetPurity] = useState<string>('');

  // Parse numerical values
  const weight = useMemo(() => Math.max(0, parseFloat(goldWeight) || 0), [goldWeight]);
  const purityCurrent = useMemo(
    () => Math.min(100, Math.max(0, parseFloat(currentPurity) || 0)),
    [currentPurity],
  );
  const purityTarget = useMemo(
    () => Math.min(99.99, Math.max(0, parseFloat(targetPurity) || 0)),
    [targetPurity],
  );

  const hasInput = goldWeight !== '' && currentPurity !== '' && targetPurity !== '';

  // Validation
  const isValid = useMemo(() => {
    if (!hasInput) return true;
    return (
      weight > 0 &&
      purityCurrent >= 0 &&
      purityCurrent < 100 &&
      purityTarget > purityCurrent &&
      purityTarget < 100
    );
  }, [weight, purityCurrent, purityTarget, hasInput]);

  // Calculation: A = W * (T - P) / (100 - T)
  const pureGoldToAdd = useMemo(() => {
    if (!hasInput || !isValid || purityTarget >= 100) return 0;
    const numerator = weight * (purityTarget - purityCurrent);
    const denominator = 100 - purityTarget;
    const result = numerator / denominator;
    return Math.max(0, result);
  }, [weight, purityCurrent, purityTarget, isValid, hasInput]);

  const handleCopySummary = () => {
    const formattedResult = pureGoldToAdd > 0 ? parseFloat(pureGoldToAdd.toFixed(3)).toString() : '0';
    const summaryText = `Current Weight: ${weight}g | Current Purity: ${purityCurrent}% | Target Purity: ${purityTarget}% => Pure Gold to Add: ${formattedResult}g`;
    navigator.clipboard.writeText(summaryText);
    toast.success('Summary copied to clipboard!');
  };

  const handleReset = () => {
    setGoldWeight('');
    setCurrentPurity('');
    setTargetPurity('');
    toast.success('Form cleared');
  };

  return (
    <div className="min-h-screen space-y-6 bg-[#f9f9f7] p-4 text-[#1a1c1b] dark:bg-slate-950 dark:text-slate-100 sm:p-6 md:p-8">
      {/* Page Header */}
      <PageHeader
        title="Purity Management"
        subtitle="Quick gold purity upgrade calculator."
      />

      {/* Main Form Card */}
      <div className="max-w-2xl">
        <div className="rounded-2xl border border-[#d3c4af]/30 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between border-b border-[#d3c4af]/20 pb-3 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-base font-bold text-[#785600] dark:text-amber-400">
              <Calculator className="h-5 w-5" />
              Purity Calculator
            </h3>
            <div className="flex items-center gap-2">
              {/* <button
                type="button"
                onClick={handleCopySummary}
                className="flex items-center gap-1 rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#5d4200] dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                <Copy className="h-3.5 w-3.5" /> 
                <span>Copy</span>
              </button> */}
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" /> 
                <span>Reset</span>
              </button>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* Current Gold Weight */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Current Gold Weight (g) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={goldWeight}
                  onChange={(e) => setGoldWeight(e.target.value)}
                  placeholder="Enter weight in grams"
                  className="w-full rounded-lg border border-[#d3c4af]/40 bg-white px-4 py-2.5 pr-12 text-sm font-medium text-[#1a1c1b] outline-none transition-all focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-amber-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Grams
                </span>
              </div>
            </div>

            {/* Current Purity */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Current Purity (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="99.99"
                  value={currentPurity}
                  onChange={(e) => setCurrentPurity(e.target.value)}
                  placeholder="Enter current purity percentage"
                  className="w-full rounded-lg border border-[#d3c4af]/40 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-[#1a1c1b] outline-none transition-all focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-amber-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  %
                </span>
              </div>
            </div>

            {/* Target Purity */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Target Purity (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="99.99"
                  value={targetPurity}
                  onChange={(e) => setTargetPurity(e.target.value)}
                  placeholder="Enter target purity percentage"
                  className="w-full rounded-lg border border-[#d3c4af]/40 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-[#1a1c1b] outline-none transition-all focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-amber-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  %
                </span>
              </div>
            </div>

            {/* Pure Gold (100% Fine) to Add - Disabled Input */}
            <div className="pt-1">
              <label className="mb-1.5 block text-sm font-bold text-[#785600] dark:text-amber-400">
                Pure Gold to Add (g)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={pureGoldToAdd > 0 ? parseFloat(pureGoldToAdd.toFixed(3)).toString() : ''}
                  placeholder="Result will appear here"
                  className="w-full cursor-not-allowed rounded-lg border-2 border-amber-500/40 bg-amber-50/60 px-4 py-2.5 pr-12 text-base font-bold text-[#785600] outline-none dark:border-amber-500/30 dark:bg-slate-950 dark:text-amber-400"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Grams
                </span>
                {pureGoldToAdd > 0 && (
                  <div className="absolute -right-1 -top-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            {/* Validation Error */}
            {!isValid && hasInput && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 bg-amber-50 p-3 dark:border-amber-800/30 dark:bg-amber-950/40">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Target purity must be greater than current purity and less than 100%.
                </p>
              </div>
            )}

            {/* Quick Result Summary */}
            {isValid && hasInput && pureGoldToAdd > 0 && (
              <div className="rounded-lg border border-emerald-200/50 bg-emerald-50/50 p-3 dark:border-emerald-800/30 dark:bg-emerald-950/20">
                <p className="text-center text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <span className="font-bold">Result:</span> Add{' '}
                  <span className="font-mono text-base font-extrabold text-emerald-800 dark:text-emerald-400">
                    {parseFloat(pureGoldToAdd.toFixed(3)).toString()}g
                  </span>{' '}
                  of pure gold to reach{' '}
                  <span className="font-bold">{purityTarget}%</span> purity
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurityManagement;