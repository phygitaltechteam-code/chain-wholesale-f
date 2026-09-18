import React from 'react';
import {X, IndianRupee, CreditCard} from 'lucide-react';
import {JobStage} from './KarigarByid';
import {formatCurrency} from '@/utils/utilities';

interface PaymentModalProps {
  karigarName: string;
  stage: JobStage;
  totalPendingAllStages: number;
  paymentAmount: number;
  selectedAccount: string;
  accounts: any[];
  accountsLoading: boolean;
  isSubmitting: boolean;
  onAmountChange: (amount: number) => void;
  onAccountChange: (account: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  karigarName,
  stage,
  totalPendingAllStages,
  paymentAmount,
  selectedAccount,
  accounts,
  accountsLoading,
  isSubmitting,
  onAmountChange,
  onAccountChange,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#d3c4af]/20 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between border-b border-[#d3c4af]/10 pb-4 dark:border-slate-800">
          <div>
            <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1a1c1b] dark:text-white">
              Disburse Labour Payment
            </h3>
            <p className="text-xs text-[#4f4535] dark:text-slate-400">
              Artisan: <span className="font-semibold text-[#785600] dark:text-amber-400">{karigarName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stage Summary */}
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-[#f4f4f2]/60 p-3.5 text-xs dark:bg-slate-800/50">
          <div>
            <span className="text-[#817563]">Job Reference:</span>
            <p className="font-bold text-[#1a1c1b] dark:text-white">{stage.jobNo}</p>
          </div>
          <div>
            <span className="text-[#817563]">Process Dept:</span>
            <p className="font-bold text-[#1a1c1b] dark:text-white">{stage.processName}</p>
          </div>
          <div>
            <span className="text-[#817563]">Stage Pending:</span>
            <p className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(stage.pendingAmount)}</p>
          </div>
          <div>
            <span className="text-[#817563]">Overall Pending:</span>
            <p className="font-bold text-[#785600] dark:text-amber-400">{formatCurrency(totalPendingAllStages)}</p>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
              Payment Amount (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#785600] dark:text-amber-400" />
              <input
                type="number"
                step="0.01"
                max={stage.pendingAmount}
                value={paymentAmount || ''}
                onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
                placeholder="Enter disbursement amount"
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-[#1a1c1b] outline-none transition-all focus:border-[#785600] focus:ring-1 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-[#817563]">
              <span>Max allowed for this stage: {formatCurrency(stage.pendingAmount)}</span>
              <button
                type="button"
                onClick={() => onAmountChange(stage.pendingAmount)}
                className="font-semibold text-[#785600] hover:underline dark:text-amber-400"
              >
                Pay Full
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
              Debit Account / Payment Mode
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => onAccountChange(e.target.value)}
              className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-4 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] focus:ring-1 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select Account / Payment Mode</option>
              {accounts.map((acc: any) => (
                <option key={acc.id || acc._id} value={acc.id || acc._id}>
                  {acc.name || acc.accountName || acc.title || 'Cash Account'} {acc.balance ? `(₹${acc.balance})` : ''}
                </option>
              ))}
            </select>
            {accountsLoading && (
              <p className="mt-1 text-[11px] text-slate-400">Loading accounts...</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3 border-t border-[#d3c4af]/10 pt-4 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#d3c4af]/30 px-5 py-2.5 text-sm font-medium text-[#4f4535] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || paymentAmount <= 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#785600] to-[#986d00] px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-[#785600]/20 transition-all hover:brightness-105 disabled:opacity-50"
          >
            <CreditCard size={16} />
            {isSubmitting ? 'Recording...' : 'Confirm Disbursement'}
          </button>
        </div>
      </div>
    </div>
  );
};
