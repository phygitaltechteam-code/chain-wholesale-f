import {useState, useEffect} from 'react';
import {BillingMode, PaymentMode} from './billing.types';

interface UseBillingCalculationsProps {
  fineWeight: string;
  rate: string;
  makingChargeType: string;
  makingChargeValue: string;
  gstPercent: string;
  discount: string;
  metalAdjustment: string;
  exchangeGrossWeight: string;
  exchangePurity: string;
  exchangeRate: string;
  cashPaid: string;
  previousBalance: string;
  metalItemAmount?: number;
  totalGrossWeight?: number;
  billingMode: BillingMode;
  paymentMode: PaymentMode;
}

export const useBillingCalculations = (props: UseBillingCalculationsProps) => {
  const {
    fineWeight,
    rate,
    makingChargeType,
    makingChargeValue,
    gstPercent,
    discount,
    metalAdjustment,
    exchangeGrossWeight,
    exchangePurity,
    exchangeRate,
    cashPaid,
    previousBalance,
    metalItemAmount = 0,
    totalGrossWeight = 0,
    billingMode,
    paymentMode,
  } = props;

  const liveFineWeight = parseFloat(fineWeight) || 0;
  const liveRate = parseFloat(rate) || 0;
  const liveAmount = liveFineWeight * liveRate;
  const currentItemsTotal = metalItemAmount || liveAmount;

  const calculateExchangeFineWeight = (gross: string, pur: string): number => {
    const g = parseFloat(gross) || 0;
    const p = parseFloat(pur) || 0;
    return parseFloat(((g * p) / 100).toFixed(3));
  };

  const exchangeFineWt = calculateExchangeFineWeight(
    exchangeGrossWeight,
    exchangePurity,
  );
  const exchangeValue = parseFloat(
    (exchangeFineWt * parseFloat(exchangeRate)).toFixed(2),
  );

  const makingFees = (() => {
    const value = parseFloat(makingChargeValue) || 0;
    if (makingChargeType === 'g') {
      return parseFloat((totalGrossWeight * value).toFixed(2));
    }
    return parseFloat(value.toFixed(2));
  })();

  const subtotal = parseFloat((currentItemsTotal + makingFees).toFixed(2));
  const gstAmount =
    billingMode === 'GST_BILL'
      ? parseFloat(((subtotal * parseFloat(gstPercent)) / 100).toFixed(2))
      : 0;
  const totalWithTax = parseFloat((subtotal + gstAmount).toFixed(2));
  const discountAmount = parseFloat(parseFloat(discount).toFixed(2)) || 0;
  const afterDiscount = parseFloat((totalWithTax - discountAmount).toFixed(2));
  const metalAdjustmentAmount =
    parseFloat(parseFloat(metalAdjustment).toFixed(2)) || 0;

  const netPayable = parseFloat(
    (
      afterDiscount -
      metalAdjustmentAmount -
      exchangeValue +
      parseFloat(previousBalance)
    ).toFixed(2),
  );

  const rawBalanceDue = parseFloat(
    (netPayable - parseFloat(cashPaid)).toFixed(2),
  );
  const isOverpaid = rawBalanceDue < 0;
  const overpaidAmount = isOverpaid ? Math.abs(rawBalanceDue) : 0;
  const balanceDue = isOverpaid ? 0 : rawBalanceDue;

  const safeNetPayable = netPayable < 0 ? 0 : netPayable;
  const safeCashPaid = parseFloat(cashPaid) < 0 ? 0 : parseFloat(cashPaid) || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 3) => {
    return value.toFixed(decimals);
  };

  return {
    liveAmount,
    currentItemsTotal,
    exchangeFineWt: calculateExchangeFineWeight(
      exchangeGrossWeight,
      exchangePurity,
    ),
    exchangeValue,
    makingFees,
    subtotal,
    gstAmount,
    totalWithTax,
    discountAmount,
    afterDiscount,
    metalAdjustmentAmount,
    netPayable,
    rawBalanceDue,
    isOverpaid,
    overpaidAmount,
    balanceDue,
    safeNetPayable,
    safeCashPaid,
    formatCurrency,
    formatNumber,
    gstPercent: parseFloat(gstPercent) || 0,
    previousBalance,
  };
};
