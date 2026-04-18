import React, {useState, useEffect} from 'react';
import {Search, TrendingUp, X, Trash2, ChevronDown} from 'lucide-react';
import {MdSave} from 'react-icons/md';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import GenericButton from '../Forms/Buttons/GenericButton';
import {FormProvider, useForm} from 'react-hook-form';
import PageHeader from '../Forms/Common/PageHeader';
import {
  BillingFormSchema,
  InvoicePayloadSchema,
  MetalItemUISchema,
} from './BillingSchema';
import {useSubmitBill} from './billapi';
import {useGetClient} from '../Client/api';
import toast from 'react-hot-toast';
import {useNavigate} from '@tanstack/react-router';
import BillingPrintReceipt from './BillingPrintReceipt';

type MetalItem = z.infer<typeof MetalItemUISchema>;
type BillingFormData = z.infer<typeof BillingFormSchema>;
type InvoicePayload = z.infer<typeof InvoicePayloadSchema>;

interface BillingFormDataWithFields extends BillingFormData {
  [key: string]: any;
}

interface Client {
  id: string;
  fullname: string;
  phoneNumber: string;
  city?: string;
  address?: string;
  GST?: string;
  PAN?: string;
  aadhar?: string;
}

// Account options for dropdown
const accountOptions = [
  {value: 'cash', label: 'Cash Account'},
  {value: 'bank', label: 'Bank Account'},
  {value: 'upi', label: 'UPI Account'},
];

export default function Billing() {
  const navigate = useNavigate();
  const methods = useForm<BillingFormDataWithFields>({
    resolver: zodResolver(BillingFormSchema),
    defaultValues: {
      metalType: '',
      fineWeight: '',
      rate: '',
      makingChargeType: 'g',
      makingChargeValue: '',
      hsnCode: '',
      gstPercent: '3',
      discount: '0',
      exchangeMetalType: '',
      exchangeGrossWeight: '',
      exchangePurity: '0',
      exchangeRate: '',
      cashPaid: '',
      previousBalance: '0',
      metalAdjustment: '0',
    },
  });

  const {
    watch,
    setValue,
    register,
    getValues,
    formState: {errors, isValid},
  } = methods;

  const [showPrintReceipt, setShowPrintReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<'SELL' | 'BUY'>(
    'SELL',
  );
  const [billingMode, setBillingMode] = useState<'CASH_BILL' | 'GST_BILL'>(
    'CASH_BILL',
  );
  const [paymentMode, setPaymentMode] = useState<
    'CASH_UPI' | 'EXCHANGE' | 'SPLIT'
  >('CASH_UPI');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [metalItem, setMetalItem] = useState<MetalItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('cash');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    metalName?: string;
    fineWeight?: string;
    rate?: string;
  }>({});

  const savebill = useSubmitBill();
  const {data: clientsData, isLoading: clientsLoading} = useGetClient();

  const clients = clientsData || [];

  const filteredClients = clients.filter(
    (client: Client) =>
      client.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phoneNumber?.includes(searchQuery),
  );

  
  const fineWeight = watch('fineWeight') || '0';
  const rate = watch('rate') || '0';
  const metalType = watch('metalType') || '';
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

  // Auto-add metal item when all fields are filled and keep fields
  useEffect(() => {
    const hasMetalType = metalType && metalType.trim() !== '';
    const hasFineWeight = fineWeight && parseFloat(fineWeight) > 0;
    const hasRate = rate && parseFloat(rate) > 0;

    if (hasMetalType && hasFineWeight && hasRate && !metalItem) {
      const fineWt = parseFloat(parseFloat(fineWeight).toFixed(3));
      const rateVal = parseFloat(parseFloat(rate).toFixed(2));
      const amount = parseFloat((fineWt * rateVal).toFixed(2));

      const newItem: MetalItem = {
        id: Date.now().toString(),
        metalType: metalType,
        grossWeight: fineWt,
        purity: 100,
        fineWeight: fineWt,
        rate: rateVal,
        amount: amount,
      };

      setMetalItem(newItem);
      // Don't clear fields - keep them visible
      toast.success('Item added successfully');
    }
  }, [metalType, fineWeight, rate, metalItem]);

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

  const totalGrossWeight = metalItem?.grossWeight || 0;
  const makingFees = (() => {
    const value = parseFloat(makingChargeValue) || 0;
    if (makingChargeType === 'g') {
      return parseFloat((totalGrossWeight * value).toFixed(2));
    }
    return parseFloat(value.toFixed(2));
  })();

  const itemsSubtotal = metalItem?.amount || 0;
  const subtotal = parseFloat((itemsSubtotal + makingFees).toFixed(2));
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

  // Ensure values are never negative for API
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

  const handleFineWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    setValidationErrors((prev) => ({...prev, fineWeight: undefined}));
    if (/^\d*\.?\d*$/.test(value)) {
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length > 3) {
          value = parseFloat(value).toFixed(3);
        }
      }
      setValue('fineWeight', value);
    }
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    setValidationErrors((prev) => ({...prev, rate: undefined}));
    if (/^\d*\.?\d*$/.test(value)) {
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length > 2) {
          value = parseFloat(value).toFixed(2);
        }
      }
      setValue('rate', value);
    }
  };

  const removeMetalItem = () => {
    setMetalItem(null);
    setValue('metalType', '');
    setValue('fineWeight', '');
    setValue('rate', '');
  };

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
      subTotal: parseFloat((itemsSubtotal + makingFees).toFixed(2)),
      discount: parseFloat(discountAmount.toFixed(2)),
      exchangeValue: parseFloat(exchangeValue.toFixed(2)),
      previousBalance: 0, // Set to 0 as requested
      netPayable: parseFloat(safeNetPayable.toFixed(2)),
      cashPaid: parseFloat(finalCashPaid.toFixed(2)),
      balanceDue: parseFloat(finalBalanceDue.toFixed(2)),
      account: selectedAccount,
    };

    return payload;
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchQuery(client.fullname);
    setShowClientDropdown(false);
    toast.success(`Client selected: ${client.fullname}`);
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      if (!selectedClient) {
        toast.error('Please select a client');
        setIsSubmitting(false);
        return;
      }

      if (!metalItem) {
        toast.error('Please add metal item');
        setIsSubmitting(false);
        return;
      }

      if (
        (paymentMode === 'EXCHANGE' || paymentMode === 'SPLIT') &&
        !exchangeMetalType
      ) {
        toast.error('Please fill metal exchange details');
        setIsSubmitting(false);
        return;
      }

      const payload = buildPayload();

      const result = await savebill.mutateAsync(payload);

      // Prepare receipt data
      const receiptDataObj = {
        invoiceNo:
          result?.data?.id?.slice(0, 8).toUpperCase() || `INV-${Date.now()}`,
        date: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        client: {
          name: selectedClient.fullname,
          phone: selectedClient.phoneNumber,
          address: selectedClient.address,
          gst: selectedClient.GST,
        },
        items: metalItem
          ? [
              {
                metalName: metalItem.metalType,
                weight: metalItem.fineWeight,
                rate: metalItem.rate,
                amount: metalItem.amount,
              },
            ]
          : [],
        makingFees: makingFees,
        gstPercent: parseFloat(gstPercent),
        gstAmount: gstAmount,
        exchangeValue: exchangeValue,
        previousBalance: parseFloat(previousBalance) || 0,
        subTotal: subtotal,
        totalWithTax: totalWithTax,
        netPayable: safeNetPayable,
        cashPaid: safeCashPaid,
        balanceDue: balanceDue,
        transactionType: transactionType,
        billingMode: billingMode,
        paymentMode: paymentMode,
      };

      setReceiptData(receiptDataObj);
      setShowPrintReceipt(true);

      resetForm();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.map((e: any) => e.message).join(', ') ||
        'Failed to save invoice. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMetalItem(null);
    setSelectedClient(null);
    setSearchQuery('');
    setValue('metalType', '');
    setValue('fineWeight', '');
    setValue('rate', '');
    setValue('makingChargeValue', '');
    setValue('discount', '0');
    setValue('metalAdjustment', '0');
    setValue('cashPaid', '');
    setValue('exchangeMetalType', '');
    setValue('exchangeGrossWeight', '');
    setValue('exchangePurity', '');
    setValue('exchangeRate', '');
    setValue('previousBalance', '0');
    setTransactionType('SELL');
    setBillingMode('CASH_BILL');
    setPaymentMode('CASH_UPI');
    setSelectedAccount('cash');
    setValidationErrors({});
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
            {/* Billing Controls */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-4 rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm md:p-6">
                <h3 className="font-['Manrope'] text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                  Transaction Type
                </h3>
                <div className="flex w-full rounded-full bg-[#f4f4f2] p-1">
                  <button
                    type="button"
                    onClick={() => setTransactionType('SELL')}
                    className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-all md:px-6 md:py-2 md:text-sm ${
                      transactionType === 'SELL'
                        ? 'bg-[#785600] text-white shadow-md'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    Sale
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('BUY')}
                    className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-all md:px-6 md:py-2 md:text-sm ${
                      transactionType === 'BUY'
                        ? 'bg-[#785600] text-white shadow-md'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    Purchase
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm md:p-6">
                <h3 className="font-['Manrope'] text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                  Billing Mode
                </h3>
                <div className="flex w-full rounded-full bg-[#f4f4f2] p-1">
                  <button
                    type="button"
                    onClick={() => setBillingMode('CASH_BILL')}
                    className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-all md:px-6 md:py-2 md:text-sm ${
                      billingMode === 'CASH_BILL'
                        ? 'bg-[#785600] text-white shadow-md'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    Cash Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingMode('GST_BILL')}
                    className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-all md:px-6 md:py-2 md:text-sm ${
                      billingMode === 'GST_BILL'
                        ? 'bg-[#785600] text-white shadow-md'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    GST Bill
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm md:p-6">
                <h3 className="font-['Manrope'] text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                  Payment Mode
                </h3>
                <div className="flex w-full flex-col gap-2 rounded-lg bg-[#f4f4f2] p-1 md:flex-row">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH_UPI')}
                    className={`rounded-md px-3 py-2 text-xs font-bold transition-all md:flex-1 md:rounded-full md:px-4 ${
                      paymentMode === 'CASH_UPI'
                        ? 'bg-[#785600] text-white shadow-sm'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    Cash/UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('EXCHANGE')}
                    className={`rounded-md px-3 py-2 text-xs font-bold transition-all md:flex-1 md:rounded-full md:px-4 ${
                      paymentMode === 'EXCHANGE'
                        ? 'bg-[#785600] text-white shadow-sm'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    Exchange
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('SPLIT')}
                    className={`rounded-md px-3 py-2 text-xs font-bold transition-all md:flex-1 md:rounded-full md:px-4 ${
                      paymentMode === 'SPLIT'
                        ? 'bg-[#785600] text-white shadow-sm'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    Split
                  </button>
                </div>
              </div>
            </div>

            {/* Client Search */}
            <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 md:p-6">
              <h3 className="mb-4 font-['Noto_Serif'] text-lg font-bold text-[#785600] md:mb-6 md:text-xl">
                Client Details
              </h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4f4535] md:h-5 md:w-5" />
                {selectedClient ? (
                  <div className="flex items-center justify-between rounded-lg bg-[#f4f4f2] py-3 pl-10 pr-3 md:py-4 md:pl-12 md:pr-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#1a1c1b]">
                        {selectedClient.fullname} - {selectedClient.phoneNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClient(null);
                        setSearchQuery('');
                      }}
                      className="ml-2 rounded-full p-1 transition-colors hover:bg-[#e8e8e6]"
                    >
                      <X size={16} className="text-[#4f4535]" />
                    </button>
                  </div>
                ) : (
                  <input
                    className="w-full rounded-lg border-0 bg-[#f4f4f2] py-3 pl-10 pr-3 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 md:py-4 md:pl-12 md:pr-4"
                    placeholder="Search by name or phone..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                  />
                )}
                {!selectedClient &&
                  showClientDropdown &&
                  filteredClients.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#d3c4af]/30 bg-white shadow-lg">
                      {filteredClients.map((client: Client) => (
                        <div
                          key={client.id}
                          className="cursor-pointer border-b border-[#f4f4f2] p-3 hover:bg-[#f4f4f2]"
                          onClick={() => handleSelectClient(client)}
                        >
                          <p className="text-sm font-bold text-[#1a1c1b]">
                            {client.fullname}
                          </p>
                          <p className="text-xs text-[#4f4535]">
                            {client.phoneNumber}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Metal Exchange Section */}
            {(paymentMode === 'EXCHANGE' || paymentMode === 'SPLIT') && (
              <div className="rounded-xl border border-l-4 border-[#d3c4af]/10 border-l-[#785600] bg-white p-4 md:p-6">
                <h3 className="mb-4 font-['Noto_Serif'] text-lg font-bold text-[#785600] md:mb-6 md:text-xl">
                  Metal Exchange Details
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-6 md:gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535]">
                      Metal Type
                    </label>
                    <input
                      type="text"
                      {...register('exchangeMetalType')}
                      placeholder="Gold Old Ornament"
                      className="w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm focus:ring-2 focus:ring-[#785600]/20 md:px-4 md:py-3"
                    />
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
                      Purity %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('exchangePurity')}
                      placeholder=""
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
                      placeholder="7150.00"
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
            )}

            {/* Item Entry Section - Fields remain visible */}
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
                    placeholder="Gold 22K (91.6)"
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
                    onChange={handleFineWeightChange}
                    placeholder="9.572"
                    className="w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm focus:ring-2 focus:ring-[#785600]/20 md:px-4 md:py-3"
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
                    onChange={handleRateChange}
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
                    value={formatCurrency(
                      (parseFloat(watch('fineWeight') || '0') || 0) *
                        (parseFloat(watch('rate') || '0') || 0),
                    )}
                    className="w-full rounded-lg border-0 bg-[#e8e8e6] px-3 py-2 text-sm font-bold text-[#785600] md:px-4 md:py-3"
                  />
                </div>
              </div>

              {/* Show added item info */}
              {/* {metalItem && (
                <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm">
                  <p className="text-green-700">
                    ✓ Item added: {metalItem.metalType} -{' '}
                    {metalItem.fineWeight.toFixed(3)}g @ ₹
                    {metalItem.rate.toFixed(2)} ={' '}
                    {formatCurrency(metalItem.amount)}
                  </p>
                </div>
              )} */}
            </div>

            {/* Payment Summary */}
            <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 md:p-6">
              <h3 className="mb-4 font-['Noto_Serif'] text-lg font-bold text-[#785600] md:mb-6 md:text-xl">
                Payment Summary
              </h3>

              <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-8">
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="font-medium text-[#4f4535]">
                      Items Total
                    </span>
                    <span className="font-bold">
                      {formatCurrency(itemsSubtotal)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
                    <span className="font-medium text-[#4f4535]">
                      Making Fees
                    </span>
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
                    <span className="font-bold">
                      {formatCurrency(totalWithTax)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
                    <span className="font-medium text-red-600">
                      Less Discount
                    </span>
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
                    <span className="font-medium text-[#4f4535]">
                      Previous Balance
                    </span>
                    <span className="font-bold">{previousBalance}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#d3c4af]/20 pt-3 md:pt-4">
                    <span className="font-['Noto_Serif'] text-sm font-bold md:text-base">
                      Net Payable
                    </span>
                    <span className="font-['Noto_Serif'] text-base font-black text-[#785600] md:text-xl">
                      {formatCurrency(safeNetPayable)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  {/* Account Selection Dropdown */}
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-[#4f4535] md:mb-2 md:text-xs">
                      Select Account
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setShowAccountDropdown(!showAccountDropdown)
                        }
                        className="flex w-full items-center justify-between rounded-lg border-0 bg-[#f4f4f2] px-4 py-3 text-sm text-[#1a1c1b] focus:ring-2 focus:ring-[#785600]/20 md:py-4"
                      >
                        <span>
                          {accountOptions.find(
                            (opt) => opt.value === selectedAccount,
                          )?.label || 'Select Account'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {showAccountDropdown && (
                        <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#d3c4af]/30 bg-white shadow-lg">
                          {accountOptions.map((option) => (
                            <div
                              key={option.value}
                              className="cursor-pointer px-4 py-2 transition-colors hover:bg-[#f4f4f2]"
                              onClick={() => {
                                setSelectedAccount(option.value);
                                setShowAccountDropdown(false);
                              }}
                            >
                              <span className="text-sm text-[#1a1c1b]">
                                {option.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cash Paid */}
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
                          ? formatCurrency(overpaidAmount)
                          : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d3c4af]/20 bg-white px-4 py-3 shadow-lg md:relative md:mt-4 md:px-8 md:py-6">
          <div className="flex justify-center md:justify-end">
            <GenericButton
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className={`metallic-gradient w-full !px-4 !py-3 shadow-lg shadow-[#785600]/30 transition-transform hover:scale-105 md:w-auto md:!px-8 md:!py-4 ${
                isSubmitting ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              <MdSave className="h-4 w-4 md:h-5 md:w-5" />
              {isSubmitting ? 'Saving...' : 'Save Bill'}
            </GenericButton>
          </div>
        </div>
        <div className="h-20 md:h-0"></div>
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
