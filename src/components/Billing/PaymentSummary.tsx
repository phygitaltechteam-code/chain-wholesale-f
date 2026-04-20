// components/Billing/components/PaymentSummary.tsx
import React, {useState} from 'react';
import {UseFormRegister} from 'react-hook-form';
import {ChevronDown} from 'lucide-react';
import {
  AccountData,
  BillingFormDataWithFields,
  BillingMode,
  PaymentMode,
} from './billing.types';

interface PaymentSummaryProps {
  register: UseFormRegister<BillingFormDataWithFields>;
  calculations: {
    currentItemsTotal: number;
    makingFees: number;
    gstAmount: number;
    gstPercent: number;
    totalWithTax: number;
    discountAmount: number;
    exchangeValue: number;
    previousBalance: string;
    netPayable: number;
    rawBalanceDue: number;
    overpaidAmount: number;
    balanceDue: number;
    safeNetPayable: number;
    safeCashPaid: number;
    formatCurrency: (value: number) => string;
  };
  billingMode: BillingMode;
  paymentMode: PaymentMode;
  accountsList: AccountData[];
  selectedAccount: string;
  onAccountChange: (accountId: string) => void;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  register,
  calculations,
  billingMode,
  paymentMode,
  accountsList,
  selectedAccount,
  onAccountChange,
}) => {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const {
    currentItemsTotal,
    makingFees,
    gstAmount,
    gstPercent,
    totalWithTax,
    discountAmount,
    exchangeValue,
    previousBalance,
    netPayable,
    rawBalanceDue,
    overpaidAmount,
    balanceDue,
    formatCurrency,
  } = calculations;

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  return (
    <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 md:p-6">
      <h3 className="mb-4 font-['Noto_Serif'] text-lg font-bold text-[#785600] md:mb-6 md:text-xl">
        Payment Summary
      </h3>

      <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-8">
        {/* Left Column - Amount Calculations */}
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="font-medium text-[#4f4535]">Items Total</span>
            <span className="font-bold">
              {formatCurrency(currentItemsTotal)}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
            <span className="font-medium text-[#4f4535]">Making Fees</span>
            <div className="flex flex-wrap items-center gap-1 md:gap-2">
              <select
                {...register('makingChargeType')}
                className="rounded border-0 bg-[#f4f4f2] px-1 py-0.5 text-[10px] md:px-2 md:py-1 md:text-xs"
              >
                <option value="g">Per Gram</option>
                <option value="amount">Amount</option>
              </select>
              <input
                type="number"
                step="0.01"
                {...register('makingChargeValue')}
                placeholder="0"
                className="w-16 rounded border-0 bg-[#f4f4f2] px-1 py-0.5 text-right text-xs md:w-24 md:px-2 md:py-1"
              />
              <span className="text-xs font-bold md:text-sm">
                {formatCurrency(makingFees)}
              </span>
            </div>
          </div>

          {billingMode === 'GST_BILL' && (
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="font-medium text-[#4f4535]">
                GST ({gstPercent}%)
              </span>
              <span className="font-bold text-[#785600]">
                + {formatCurrency(gstAmount)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="font-medium text-[#4f4535]">Subtotal</span>
            <span className="font-bold">{formatCurrency(totalWithTax)}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
            <span className="font-medium text-red-600">Less Discount</span>
            <div className="flex items-center gap-1 md:gap-2">
              <input
                type="number"
                step="0.01"
                {...register('discount')}
                placeholder="0"
                className="w-20 rounded border-0 bg-[#f4f4f2] px-1 py-0.5 text-right text-xs md:w-24 md:px-2 md:py-1"
              />
              <span className="text-xs font-bold text-red-600 md:text-sm">
                - {formatCurrency(discountAmount)}
              </span>
            </div>
          </div>

          {(paymentMode === 'EXCHANGE' || paymentMode === 'SPLIT') &&
            exchangeValue > 0 && (
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="font-medium text-[#5d5c74]">
                  Less Metal Exchange
                </span>
                <span className="font-bold text-[#5d5c74]">
                  - {formatCurrency(exchangeValue)}
                </span>
              </div>
            )}

          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="font-medium text-[#4f4535]">Previous Balance</span>
            <span className="font-bold">
              {formatCurrency(parseFloat(previousBalance) || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-[#d3c4af]/20 pt-3 md:pt-4">
            <span className="font-['Noto_Serif'] text-sm font-bold md:text-base">
              Net Payable
            </span>
            <span
              className={`font-['Noto_Serif'] text-base font-black md:text-xl ${
                netPayable < 0 ? 'text-red-600' : 'text-[#785600]'
              }`}
            >
              {netPayable < 0
                ? `-${formatCurrency(Math.abs(netPayable))}`
                : formatCurrency(netPayable)}
            </span>
          </div>
        </div>

        {/* Right Column - Payment Details */}
        <div className="space-y-3 md:space-y-4">
          {/* Account Selection Dropdown */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-[#4f4535] md:mb-2 md:text-xs">
              Select Account
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex w-full items-center justify-between rounded-lg border-0 bg-[#f4f4f2] px-4 py-3 text-sm text-[#1a1c1b] focus:ring-2 focus:ring-[#785600]/20 md:py-4"
              >
                <span>
                  {accountsList.find((acc) => acc.id === selectedAccount)
                    ?.name || 'Select Account'}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showAccountDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showAccountDropdown && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#d3c4af]/30 bg-white shadow-lg">
                  {accountsList.map((account) => (
                    <div
                      key={account.id}
                      className="cursor-pointer px-4 py-2 transition-colors hover:bg-[#f4f4f2]"
                      onClick={() => {
                        onAccountChange(account.id);
                        setShowAccountDropdown(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#1a1c1b]">
                          {account.name}
                        </span>
                        <span className="text-xs text-[#4f4535]">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {accountsList.length === 0 && (
                    <div className="px-4 py-2 text-sm text-[#4f4535]">
                      No accounts found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cash Paid Input */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-[#4f4535] md:mb-2 md:text-xs">
              Cash Paid (₹)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                {...register('cashPaid')}
                className="w-full rounded-lg border-0 border-[#785600]/30 bg-[#785600]/5 px-3 py-3 text-base font-black text-[#785600] focus:ring-4 focus:ring-[#785600]/10 md:px-4 md:py-4 md:text-xl"
                placeholder="Enter amount"
              />
            </div>
          </div>

          {/* Balance Due / Overpaid Status */}
          <div
            className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${
              rawBalanceDue > 0
                ? 'bg-red-50'
                : rawBalanceDue < 0
                  ? 'bg-green-50'
                  : 'bg-gray-50'
            }`}
          >
            <span className="text-xs font-medium md:text-sm">
              {rawBalanceDue > 0
                ? 'Balance Due'
                : rawBalanceDue < 0
                  ? 'Payable'
                  : 'Settled'}
            </span>
            <span
              className={`text-sm font-bold md:text-lg ${
                rawBalanceDue > 0
                  ? 'text-[#ba1a1a]'
                  : rawBalanceDue < 0
                    ? 'text-green-600'
                    : 'text-[#1a1c1b]'
              }`}
            >
              {rawBalanceDue > 0
                ? formatCurrency(balanceDue)
                : rawBalanceDue < 0
                  ? `-${formatCurrency(overpaidAmount)}`
                  : formatCurrency(0)}
            </span>
          </div>

          {/* Metal Adjustment Field (Optional - if needed) */}
          {/* <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
            <span className="font-medium text-[#4f4535]">Metal Adjustment</span>
            <div className="flex items-center gap-1 md:gap-2">
              <input
                type="number"
                step="0.01"
                {...register('metalAdjustment')}
                placeholder="0"
                className="w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1 text-right text-xs md:w-32 md:px-3 md:py-1.5"
              />
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};
