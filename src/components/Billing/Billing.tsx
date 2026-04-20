import React, {useState, useEffect} from 'react';
import {FormProvider} from 'react-hook-form';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import {useBillingForm} from './useBillingForm';
import {
  AccountData,
  BillingMode,
  Client,
  PaymentMode,
  TransactionType,
} from './billing.types';
import {useGetClient} from '../Client/api';
import {useGetAccounts} from '../account/accountapi';
import {useSubmitBill} from './billapi';
import {useBillingCalculations} from './useBillingCalculations';
import {BillingControls} from './BillingControls';
import {ClientSearch} from './ClientSearch';
import {MetalExchangeSection} from './MetalExchangeSection';
import {ItemEntrySection} from './ItemEntrySection';
import {PaymentSummary} from './PaymentSummary';
import BillingPrintReceipt from './BillingPrintReceipt';
import {SaveBillButton} from './SaveBillButton';

export default function Billing() {
  const navigate = useNavigate();
  const {
    methods,
    metalItem,
    setMetalItem,
    isEditing,
    validationErrors,
    handleFineWeightChange,
    handleRateChange,
    removeMetalItem,
    resetForm,
  } = useBillingForm();

  const {watch, setValue, register} = methods;

  // State
  const [transactionType, setTransactionType] =
    useState<TransactionType>('SELL');
  const [billingMode, setBillingMode] = useState<BillingMode>('CASH_BILL');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH_UPI');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [showPrintReceipt, setShowPrintReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [accountsList, setAccountsList] = useState<AccountData[]>([]);

  // API hooks
  const {data: clientsData, isLoading: clientsLoading} = useGetClient();
  const {data: accountsData} = useGetAccounts();
  const {mutateAsync: submitBill, isPending: isSubmitting} = useSubmitBill();

  // Watch values
  const fineWeight = watch('fineWeight') || '0';
  const rate = watch('rate') || '0';
  const makingChargeType = watch('makingChargeType') || 'g';
  const makingChargeValue = watch('makingChargeValue') || '0';
  const gstPercent = watch('gstPercent') || '0';
  const discount = watch('discount') || '0';
  const metalAdjustment = watch('metalAdjustment') || '0';
  const exchangeMetalType = watch('exchangeMetalType') || '';
  const exchangeGrossWeight = watch('exchangeGrossWeight') || '0';
  const exchangePurity = watch('exchangePurity') || '0';
  const exchangeRate = watch('exchangeRate') || '0';
  const cashPaid = watch('cashPaid') || '0';
  const previousBalance = watch('previousBalance') || '0';

  // Calculations
  const calculations = useBillingCalculations({
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
    metalItemAmount: metalItem?.amount,
    totalGrossWeight: metalItem?.grossWeight,
    billingMode,
    paymentMode,
  });

  const {
    currentItemsTotal,
    exchangeFineWt,
    exchangeValue,
    makingFees,
    gstAmount,
    discountAmount,
    balanceDue,
    isOverpaid,
    safeNetPayable,
    safeCashPaid,
  } = calculations;

  const clients = clientsData || [];

  const buildExchangeItems = () => {
    if (paymentMode !== 'EXCHANGE' && paymentMode !== 'SPLIT') return [];
    if (!exchangeMetalType) return [];

    return [
      {
        metalType: exchangeMetalType,
        grossWeight:
          parseFloat(parseFloat(exchangeGrossWeight).toFixed(3)) || 0,
        purity: parseFloat(parseFloat(exchangePurity).toFixed(2)) || 0,
        fineWeight: exchangeFineWt,
        rate: parseFloat(parseFloat(exchangeRate).toFixed(2)) || 0,
        amount: exchangeValue,
      },
    ];
  };

  const buildItemsForAPI = () => {
    if (!metalItem) return [];
    return [
      {
        metalName: metalItem.metalType,
        weight: parseFloat(metalItem.fineWeight.toFixed(3)),
        rate: parseFloat(metalItem.rate.toFixed(2)),
        amount: parseFloat(metalItem.amount.toFixed(2)),
      },
    ];
  };

  const buildPayload = () => {
    const paymentModeMap = {
      CASH_UPI: 'CASH_UPI',
      EXCHANGE: 'EXCHANGE',
      SPLIT: 'SPLIT',
    };

    const finalBalanceDue = balanceDue < 0 ? 0 : balanceDue;
    let finalCashPaid = safeCashPaid;

    if (isOverpaid) {
      finalCashPaid = safeNetPayable;
    }

    // Get selected account name
    const selectedAccountObj = accountsList.find(
      (acc) => acc.id === selectedAccount,
    );
    const accountName = selectedAccountObj?.name || '';

    const payload = {
      clientId: selectedClient?.id || '',
      transactionType: transactionType,
      billingMode: billingMode,
      paymentMode: paymentModeMap[paymentMode],
      items: buildItemsForAPI(),
      exchangeItems: buildExchangeItems(),
      makingFees: parseFloat(makingFees.toFixed(2)),
      hsnCode: watch('hsnCode') || '7113',
      gstPercentage: billingMode === 'GST_BILL' ? parseFloat(gstPercent) : 0,
      totalTax: parseFloat(gstAmount.toFixed(2)),
      subTotal: parseFloat((currentItemsTotal + makingFees).toFixed(2)),
      discount: parseFloat(discountAmount.toFixed(2)),
      exchangeValue: parseFloat(exchangeValue.toFixed(2)),
      previousBalance: 0,
      netPayable: parseFloat(safeNetPayable.toFixed(2)),
      cashPaid: parseFloat(finalCashPaid.toFixed(2)),
      balanceDue: parseFloat(finalBalanceDue.toFixed(2)),
      account: accountName, // Send account name instead of ID
    };

    return payload;
  };

  // Load accounts
  useEffect(() => {
    if (accountsData?.data) {
      const transformedAccounts: AccountData[] = accountsData.data.map(
        (item: any, index: number) => ({
          id: item.id || index.toString(),
          name: item.name,
          balance: item.balance,
        }),
      );
      setAccountsList(transformedAccounts);
      if (transformedAccounts.length > 0 && !selectedAccount) {
        setSelectedAccount(transformedAccounts[0].id);
      }
    }
  }, [accountsData]);

  const handleSave = async () => {
    // Validation
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    if (
      (paymentMode === 'EXCHANGE' || paymentMode === 'SPLIT') &&
      !watch('exchangeMetalType')
    ) {
      toast.error('Please fill metal exchange details');
      return;
    }

    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }

    // Build payload and submit
    const result = await submitBill(buildPayload());

    // Prepare receipt data
    const receiptDataObj = {
      invoiceNo:
        result?.data?.id?.slice(0, 8).toUpperCase() || `INV-${Date.now()}`,
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      clientName: selectedClient?.fullname || 'Guest',
      clientPhone: selectedClient?.phone || '',
      items: metalItem ? [metalItem] : [],
      subtotal: calculations.subtotal.toString(),
      taxAmount: calculations.gstAmount.toString(),
      discountAmount: parseFloat(discount).toString(),
      totalAmount: calculations.totalWithTax.toString(),
      paymentMode: paymentMode,
    };

    // Handle receipt and reset
    setReceiptData(receiptDataObj);
    setShowPrintReceipt(true);
    resetForm();
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    toast.success(`Client selected: ${client.fullname}`);
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-[#f9f9f7]">
        <div className="px-4 py-4 md:px-8 md:py-6">
          <button
            className="flex items-center gap-2 text-[#785600] transition-colors hover:text-[#5d4200]"
            onClick={() => navigate({to: '/billing/Billing'})}
          >
            ← Back to Bills
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-hidden px-4 pb-8 md:flex-row md:gap-8 md:p-8 md:pt-0">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto scroll-smooth">
            <BillingControls
              transactionType={transactionType}
              onTransactionTypeChange={setTransactionType}
              billingMode={billingMode}
              onBillingModeChange={setBillingMode}
              paymentMode={paymentMode}
              onPaymentModeChange={setPaymentMode}
            />

            <ClientSearch
              selectedClient={selectedClient}
              onSelectClient={handleSelectClient}
              onClearClient={() => setSelectedClient(null)}
              clients={clients}
              isLoading={clientsLoading}
            />

            {(paymentMode === 'EXCHANGE' || paymentMode === 'SPLIT') && (
              <MetalExchangeSection
                register={register}
                setValue={setValue}
                watch={watch}
                exchangeFineWt={calculations.exchangeFineWt}
                exchangeValue={calculations.exchangeValue}
                formatNumber={calculations.formatNumber}
                formatCurrency={calculations.formatCurrency}
              />
            )}
            <ItemEntrySection
              register={register}
              setValue={setValue}
              watch={watch}
              metalItem={metalItem}
              liveAmount={calculations.liveAmount}
              validationErrors={validationErrors}
              onFineWeightChange={handleFineWeightChange}
              onRateChange={handleRateChange}
              onRemoveItem={removeMetalItem}
              formatCurrency={calculations.formatCurrency}
              paymentMode={paymentMode}
            />
            <PaymentSummary
              register={register}
              calculations={calculations}
              billingMode={billingMode}
              paymentMode={paymentMode}
              accountsList={accountsList}
              selectedAccount={selectedAccount}
              onAccountChange={setSelectedAccount}
            />
          </div>
        </div>

        <SaveBillButton onSave={handleSave} isSubmitting={isSubmitting} />
      </div>

      {showPrintReceipt && receiptData && (
        <BillingPrintReceipt
          isOpen={showPrintReceipt}
          onClose={() => {
            setShowPrintReceipt(false);
            setReceiptData(null);
          }}
          data={receiptData}
        />
      )}
    </FormProvider>
  );
}
