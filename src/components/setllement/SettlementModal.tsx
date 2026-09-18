import React, {RefObject} from 'react';
import {
  Wallet,
  X,
  User,
  Phone,
  MapPin,
  Minus,
  Plus,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {SettlementDetail, formatNumber} from './settlementUtils';

interface SettlementModalProps {
  showSettleModal: boolean;
  showConfirmModal: boolean;
  settlementDetail: SettlementDetail;
  setSettlementDetail: React.Dispatch<React.SetStateAction<SettlementDetail>>;
  localAmount: string;
  setLocalAmount: React.Dispatch<React.SetStateAction<string>>;
  inputRef: RefObject<HTMLInputElement | null>;
  scaleFocus: {
    onFocus: () => void;
    onBlur: () => void;
  };
  onCloseSettle: () => void;
  onProceedToConfirm: () => void;
  onCloseConfirm: () => void;
  onConfirmSave: () => void;
  isSubmitting: boolean;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  showSettleModal,
  showConfirmModal,
  settlementDetail,
  setSettlementDetail,
  localAmount,
  setLocalAmount,
  inputRef,
  scaleFocus,
  onCloseSettle,
  onProceedToConfirm,
  onCloseConfirm,
  onConfirmSave,
  isSubmitting,
}) => {
  if (!showSettleModal && !showConfirmModal) return null;

  const remainingBalance =
    settlementDetail.settlementType === 'receive'
      ? settlementDetail.pendingBalance - settlementDetail.settlementAmount
      : settlementDetail.pendingBalance + settlementDetail.settlementAmount;

  return (
    <>
      {/* SETTLEMENT INPUT MODAL */}
      {showSettleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onCloseSettle();
            }
          }}
        >
          <div
            className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl dark:bg-slate-900"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-5 py-3 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[#785600]" />
                <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                  Settlement
                </h2>
              </div>
              <button
                type="button"
                onClick={onCloseSettle}
                className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg p-1.5 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="p-5">
              {/* CLIENT INFORMATION */}
              <div className="mb-4 space-y-2 border-b border-[#d3c4af]/20 pb-4 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#785600]" />
                  <span className="text-sm font-semibold text-[#1a1c1b] dark:text-white">
                    {settlementDetail.clientName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#785600]" />
                  <span className="text-sm text-[#1a1c1b] dark:text-white">
                    {settlementDetail.phoneNumber}
                  </span>
                </div>
                {settlementDetail.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-[#785600]" />
                    <span className="text-sm text-[#1a1c1b] dark:text-white">
                      {settlementDetail.address}
                    </span>
                  </div>
                )}
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400">
                      Due Balance
                    </p>
                    <p className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                      {formatNumber(settlementDetail.pendingBalance)} g
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400">
                      Total Bills
                    </p>
                    <p className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                      {settlementDetail.totalBills}
                    </p>
                  </div>
                </div>
              </div>

              {/* RECEIVE / GIVE */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSettlementDetail((prev) => ({
                      ...prev,
                      settlementType: 'receive',
                    }));
                    setTimeout(() => {
                      inputRef.current?.focus();
                      inputRef.current?.select();
                    }, 50);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    settlementDetail.settlementType === 'receive'
                      ? 'border-[#785600] bg-[#785600] text-white'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <Minus className="h-4 w-4" />
                  Receive
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettlementDetail((prev) => ({
                      ...prev,
                      settlementType: 'give',
                    }));
                    setTimeout(() => {
                      inputRef.current?.focus();
                      inputRef.current?.select();
                    }, 50);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    settlementDetail.settlementType === 'give'
                      ? 'border-[#785600] bg-[#785600] text-white'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Give
                </button>
              </div>

              {/* AMOUNT INPUT */}
              <div className="mb-3">
                <GenericInputField
                  ref={inputRef}
                  name="settlementAmount"
                  type="text"
                  inputMode="decimal"
                  label="Amount (g)"
                  value={localAmount}
                  onFocus={() => {
                    scaleFocus.onFocus();
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^\d*\.?\d{0,3}$/.test(value)) {
                      return;
                    }
                    setLocalAmount(value);
                    if (value === '') {
                      setSettlementDetail((prev) => ({
                        ...prev,
                        settlementAmount: 0,
                      }));
                      return;
                    }
                    const numberValue = Number(value);
                    if (!Number.isNaN(numberValue)) {
                      setSettlementDetail((prev) => ({
                        ...prev,
                        settlementAmount: numberValue,
                      }));
                    }
                  }}
                  onBlur={() => {
                    scaleFocus.onBlur();
                    const amount = Number(localAmount);
                    if (localAmount === '' || Number.isNaN(amount)) {
                      setLocalAmount('');
                      setSettlementDetail((prev) => ({
                        ...prev,
                        settlementAmount: 0,
                      }));
                      return;
                    }
                    const finalAmount = Number(Math.max(amount, 0).toFixed(3));
                    setSettlementDetail((prev) => ({
                      ...prev,
                      settlementAmount: finalAmount,
                    }));
                    setLocalAmount(
                      finalAmount > 0
                        ? parseFloat(finalAmount.toFixed(3)).toString()
                        : '',
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onProceedToConfirm();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      onCloseSettle();
                    }
                  }}
                  placeholder="Enter amount (g)"
                  suffix="G"
                />
              </div>

              {/* REMAINING / NEW BALANCE */}
              {settlementDetail.settlementAmount > 0 && (
                <div className="mb-4 rounded-lg border border-[#d3c4af]/20 bg-[#f9f9f7] px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#4f4535] dark:text-slate-400">
                      New Due Balance:
                    </span>
                    <span className="text-sm font-bold text-[#785600] dark:text-amber-400">
                      {formatNumber(remainingBalance)} g
                    </span>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <button
                type="button"
                onClick={onProceedToConfirm}
                disabled={isSubmitting || settlementDetail.settlementAmount <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#785600] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5d4200] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRight className="h-4 w-4" />
                Proceed to Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onCloseConfirm();
            }
          }}
        >
          <div
            className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl dark:bg-slate-900"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onCloseConfirm}
              className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 absolute right-3 top-3 rounded-lg p-1.5 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              <div className="mb-4 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#785600]/10">
                  <CheckCircle className="h-6 w-6 text-[#785600]" />
                </div>
                <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                  Confirm Settlement
                </h2>
                <p className="text-sm text-[#4f4535] dark:text-slate-400">
                  Please review the details below
                </p>
              </div>

              <div className="mb-5 space-y-2.5 rounded-lg border border-[#d3c4af]/20 bg-[#f9f9f7] p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex justify-between text-sm">
                  <span className="text-[#4f4535] dark:text-slate-400">
                    Client:
                  </span>
                  <span className="font-medium text-[#1a1c1b] dark:text-white">
                    {settlementDetail.clientName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4f4535] dark:text-slate-400">
                    Current Due:
                  </span>
                  <span className="font-medium text-[#1a1c1b] dark:text-white">
                    {formatNumber(settlementDetail.pendingBalance)} g
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#d3c4af]/20 pt-2 text-sm dark:border-slate-700">
                  <span className="font-semibold text-[#4f4535] dark:text-slate-300">
                    New Due Balance:
                  </span>
                  <span className="font-bold text-[#785600] dark:text-amber-400">
                    {formatNumber(remainingBalance)} g
                  </span>
                </div>
              </div>

              <div className="flex">
                <button
                  type="button"
                  onClick={onConfirmSave}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-[#785600] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5d4200] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    'Confirm & Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
