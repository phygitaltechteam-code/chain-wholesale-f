import React, {useState, useEffect} from 'react';
import {Search, Plus, TrendingUp, X} from 'lucide-react';
import {MdSave} from 'react-icons/md';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import GenericButton from '../Forms/Buttons/GenericButton';
import GenericInputField from '../Forms/Input/GenericInputField';
import {FormProvider, useForm} from 'react-hook-form';
import PageHeader from '../Forms/Common/PageHeader';
import {
  BillingFormSchema,
  InvoicePayloadSchema,
  MetalItemUISchema,
} from './BillingSchema';
import GenericTable, {Column} from '../Forms/Table/GenericTable';
import {useSubmitBill} from './billapi';
import {useGetClient} from '../Client/api';

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

export default function Billing() {
  const methods = useForm<BillingFormDataWithFields>({
    resolver: zodResolver(BillingFormSchema),
    defaultValues: {
      metalType: '',
      fineWeight: '',
      rate: '',
      makingChargeType: 'g',
      makingChargeValue: '',
      hsnCode: '7113',
      gstPercent: '3',
      discount: '0',
      exchangeMetalType: '',
      exchangeGrossWeight: '',
      exchangePurity: '75.00',
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

  const [transactionType, setTransactionType] = useState<'SELL' | 'BUY'>(
    'SELL',
  );
  const [billingMode, setBillingMode] = useState<'CASH_BILL' | 'GST_BILL'>(
    'CASH_BILL',
  );
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'METAL' | 'SPLIT'>(
    'CASH',
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [metalItems, setMetalItems] = useState<MetalItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    metalName?: string;
    fineWeight?: string;
    rate?: string;
  }>({});

  const savebill = useSubmitBill();
  const {data: clientsData, isLoading: clientsLoading} = useGetClient();

  const clients = clientsData?.data || [];

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (client: Client) =>
      client.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phoneNumber?.includes(searchQuery),
  );

  // Watch all form values
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

  // Calculate exchange fine weight and value
  const calculateExchangeFineWeight = (gross: string, pur: string): number => {
    const g = parseFloat(gross) || 0;
    const p = parseFloat(pur) || 0;
    return (g * p) / 100;
  };

  const exchangeFineWt = calculateExchangeFineWeight(
    exchangeGrossWeight,
    exchangePurity,
  );
  const exchangeValue = exchangeFineWt * parseFloat(exchangeRate);

  // Calculate making charges
  const totalGrossWeight = metalItems.reduce(
    (sum, item) => sum + item.grossWeight,
    0,
  );
  const makingFees = (() => {
    const value = parseFloat(makingChargeValue) || 0;
    if (makingChargeType === 'g') {
      return totalGrossWeight * value;
    }
    return value;
  })();

  // Calculate items subtotal
  const itemsSubtotal = metalItems.reduce((sum, item) => sum + item.amount, 0);

  // Calculate subtotal with making fees
  const subtotal = itemsSubtotal + makingFees;

  // Calculate GST
  const gstAmount =
    billingMode === 'GST_BILL' ? (subtotal * parseFloat(gstPercent)) / 100 : 0;

  // Calculate total with tax
  const totalWithTax = subtotal + gstAmount;

  // Calculate discount amount
  const discountAmount = parseFloat(discount) || 0;

  // Calculate after discount
  const afterDiscount = totalWithTax - discountAmount;

  // Calculate metal adjustment
  const metalAdjustmentAmount = parseFloat(metalAdjustment) || 0;

  // Calculate net payable
  const netPayable =
    afterDiscount -
    metalAdjustmentAmount -
    exchangeValue +
    parseFloat(previousBalance);

  // Calculate balance due
  const balanceDue = netPayable - parseFloat(cashPaid);

  // Format functions
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

  const formatWeight = (value: number): string => value.toFixed(3);
  const formatRate = (value: number): string => value.toFixed(2);

  // Handle fine weight input
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

  // Handle rate input
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

  // Add metal item
  const handleAddMetalItem = () => {
    const metalTypeValue = watch('metalType');
    const fineWeightValue = watch('fineWeight');
    const rateValue = watch('rate');

    const newErrors: {metalName?: string; fineWeight?: string; rate?: string} =
      {};

    if (!metalTypeValue) {
      newErrors.metalName = '❌ Metal name is required';
    }
    if (!fineWeightValue || parseFloat(fineWeightValue) === 0) {
      newErrors.fineWeight =
        '❌ Fine weight is required and must be greater than 0';
    } else if (parseFloat(fineWeightValue) < 0) {
      newErrors.fineWeight = '❌ Fine weight cannot be negative';
    }
    if (!rateValue || parseFloat(rateValue) === 0) {
      newErrors.rate = '❌ Rate is required and must be greater than 0';
    } else if (parseFloat(rateValue) < 0) {
      newErrors.rate = '❌ Rate cannot be negative';
    }

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    setValidationErrors({});

    const fineWt = parseFloat(parseFloat(fineWeightValue).toFixed(3));
    const rateVal = parseFloat(parseFloat(rateValue).toFixed(2));
    const amount = parseFloat((fineWt * rateVal).toFixed(2));

    const newItem: MetalItem = {
      id: Date.now().toString(),
      metalType: metalTypeValue,
      grossWeight: fineWt,
      purity: 100,
      fineWeight: fineWt,
      rate: rateVal,
      amount: amount,
    };

    setMetalItems([...metalItems, newItem]);
    setValue('metalType', '');
    setValue('fineWeight', '');
    setValue('rate', '');
  };

  // Remove metal item
  const removeMetalItem = (id: string) => {
    setMetalItems(metalItems.filter((item) => item.id !== id));
  };

  // Build exchange items array
  const buildExchangeItems = () => {
    if (paymentMode !== 'METAL' && paymentMode !== 'SPLIT') return [];
    if (!exchangeMetalType) return [];

    return [
      {
        metalType: exchangeMetalType,
        grossWeight: parseFloat(exchangeGrossWeight) || 0,
        purity: parseFloat(exchangePurity) || 0,
        fineWeight: exchangeFineWt,
        rate: parseFloat(exchangeRate) || 0,
        amount: exchangeValue,
      },
    ];
  };

  // Build items array for API
  const buildItemsForAPI = () => {
    return metalItems.map((item) => ({
      metalName: item.metalType,
      weight: item.fineWeight,
      rate: item.rate,
      amount: item.amount,
    }));
  };

  // Build payload for API matching backend schema
  const buildPayload = () => {
    const transactionTypeMap = {
      SELL: 'SELL',
      BUY: 'BUY',
    };

    const billingModeMap = {
      CASH_BILL: 'CASH_BILL',
      GST_BILL: 'GST_BILL',
    };

    const paymentModeMap = {
      CASH: 'CASH',
      METAL: 'METAL',
      SPLIT: 'SPLIT',
    };

    const payload = {
      clientId: selectedClient?.id || '',
      transactionType: transactionTypeMap[transactionType],
      billingMode: billingModeMap[billingMode],
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
      previousBalance: parseFloat(previousBalance) || 0,
      netPayable: parseFloat(netPayable.toFixed(2)),
      cashPaid: parseFloat(cashPaid) || 0,
      balanceDue: parseFloat(balanceDue.toFixed(2)),
    };

    return payload;
  };

  // Handle client selection
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchQuery(client.fullname);
    setShowClientDropdown(false);
  };

  // Handle form submission
  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      // Validate client
      if (!selectedClient) {
        alert('Please select a client');
        setIsSubmitting(false);
        return;
      }

      // Validate metal items
      if (metalItems.length === 0) {
        alert('Please add at least one metal item');
        setIsSubmitting(false);
        return;
      }

      // Build payload
      const payload = buildPayload();

      console.log('='.repeat(80));
      console.log('📋 INVOICE PAYLOAD (Backend Format)');
      console.log('='.repeat(80));
      console.log(JSON.stringify(payload, null, 2));
      console.log('='.repeat(80));

      // Submit bill
      await savebill.mutateAsync(payload);

      // Reset form after successful submission
      resetForm();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setMetalItems([]);
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
    setValue('exchangePurity', '75.00');
    setValue('exchangeRate', '');
    setValue('previousBalance', '0');
    setTransactionType('SELL');
    setBillingMode('CASH_BILL');
    setPaymentMode('CASH');
    setValidationErrors({});
  };

  // Table columns
  const metalTableColumns: Column<MetalItem>[] = [
    {
      header: 'Metal Name',
      accessor: 'metalType',
      sortable: true,
      align: 'center',
    },
    {
      header: 'Fine Wt (g)',
      accessor: (item) => formatWeight(item.fineWeight),
      sortable: true,
      align: 'center',
    },
    {
      header: 'Rate / Gram',
      accessor: (item) => formatRate(item.rate),
      sortable: true,
      align: 'center',
    },
    {
      header: 'Amount',
      accessor: (item) => formatCurrency(item.amount),
      sortable: true,
      align: 'center',
    },
  ];

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-[#f9f9f7]">
        <div className="px-4 py-4 md:px-8 md:py-6">
          <PageHeader
            title="Billing Dashboard"
            subtitle="Create and manage invoices"
          />
        </div>

        <div className="flex flex-col gap-6 overflow-hidden px-4 pb-8 md:flex-row md:gap-8 md:p-8 md:pt-0">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto scroll-smooth">
            {/* Billing Controls */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Transaction Type */}
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

              {/* Billing Mode */}
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

              {/* Payment Mode */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm md:p-6">
                <h3 className="font-['Manrope'] text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                  Payment Mode
                </h3>
                <div className="flex w-full flex-col gap-2 rounded-lg bg-[#f4f4f2] p-1 md:flex-row">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    className={`rounded-md px-3 py-2 text-xs font-bold transition-all md:flex-1 md:rounded-full md:px-4 ${
                      paymentMode === 'CASH'
                        ? 'bg-[#785600] text-white shadow-sm'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    Cash/UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('METAL')}
                    className={`rounded-md px-3 py-2 text-xs font-bold transition-all md:flex-1 md:rounded-full md:px-4 ${
                      paymentMode === 'METAL'
                        ? 'bg-[#785600] text-white shadow-sm'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    Metal Exchange
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
                    Part/Split
                  </button>
                </div>
              </div>
            </div>

            {/* Client Search with Dropdown */}
            <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 md:p-6">
              <h3 className="mb-4 font-['Noto_Serif'] text-lg font-bold text-[#785600] md:mb-6 md:text-xl">
                Client Details
              </h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4f4535] md:h-5 md:w-5" />
                <input
                  className="w-full rounded-lg border-0 bg-[#f4f4f2] py-3 pl-10 pr-3 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 md:py-4 md:pl-12 md:pr-4"
                  placeholder="Search by name or phone..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowClientDropdown(true);
                    if (e.target.value === '') {
                      setSelectedClient(null);
                    }
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                />
                {showClientDropdown && filteredClients.length > 0 && (
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
              {selectedClient && (
                <div className="mt-3 flex gap-3 md:mt-4 md:gap-4">
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#785600]/10 bg-[#785600]/5 p-2 md:gap-3 md:p-3">
                    <div>
                      <p className="text-xs font-bold text-[#1a1c1b] md:text-sm">
                        {selectedClient.fullname}
                      </p>
                      <p className="text-[10px] text-[#4f4535] md:text-xs">
                        {selectedClient.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Metal Exchange Section */}
            {(paymentMode === 'METAL' || paymentMode === 'SPLIT') && (
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
                      placeholder="Gold Old, Silver"
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
                      placeholder="75.00"
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

            {/* Items Sold Section */}
            <div className="rounded-xl border border-l-4 border-[#d3c4af]/10 border-l-[#785600] bg-white p-4 md:p-6">
              <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
                <h3 className="font-['Noto_Serif'] text-lg font-bold text-[#785600] md:text-xl">
                  Items Sold (Metal Entry)
                </h3>
                <GenericButton
                  type="button"
                  onClick={handleAddMetalItem}
                  className="flex w-full items-center justify-center gap-2 !px-3 !py-2 text-sm md:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </GenericButton>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535]">
                    Metal Name
                  </label>
                  <input
                    type="text"
                    {...register('metalType')}
                    placeholder="e.g., Gold 22K (91.6)"
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
                    className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm focus:ring-2 focus:ring-[#785600]/20 md:px-4 md:py-3 ${
                      validationErrors.fineWeight
                        ? 'border-2 border-red-300 bg-red-50'
                        : ''
                    }`}
                  />
                  {validationErrors.fineWeight ? (
                    <p className="mt-1 text-xs text-red-600">
                      {validationErrors.fineWeight}
                    </p>
                  ) : (
                    <span className="mt-1 text-[10px] text-[#817563]">
                      3 decimal places
                    </span>
                  )}
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
                    className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm focus:ring-2 focus:ring-[#785600]/20 md:px-4 md:py-3 ${
                      validationErrors.rate
                        ? 'border-2 border-red-300 bg-red-50'
                        : ''
                    }`}
                  />
                  {validationErrors.rate ? (
                    <p className="mt-1 text-xs text-red-600">
                      {validationErrors.rate}
                    </p>
                  ) : (
                    <span className="mt-1 text-[10px] text-[#817563]">
                      2 decimal places
                    </span>
                  )}
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

              {metalItems.length > 0 && (
                <div className="mt-6">
                  <GenericTable
                    data={metalItems}
                    columns={metalTableColumns}
                    itemsPerPage={5}
                    searchable={false}
                    title="Added Items"
                    action={true}
                    onDelete={(item) => removeMetalItem(item.id)}
                    paginationOff={metalItems.length <= 5}
                  />
                </div>
              )}
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
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
                      <span className="font-medium text-[#4f4535]">
                        GST ({gstPercent}%)
                      </span>
                      <span className="font-bold">
                        {formatCurrency(gstAmount)}
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

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
                    <span className="font-medium text-[#4f4535]">
                      Less Metal Adjustment
                    </span>
                    <div className="flex items-center gap-1 md:gap-2">
                      <input
                        type="number"
                        step="0.01"
                        {...register('metalAdjustment')}
                        placeholder="0"
                        className="w-20 rounded border-0 bg-[#f4f4f2] px-1 py-0.5 text-right text-xs md:w-24 md:px-2 md:py-1"
                      />
                      <span className="text-xs font-bold text-[#4f4535] md:text-sm">
                        - {formatCurrency(metalAdjustmentAmount)}
                      </span>
                    </div>
                  </div>

                  {(paymentMode === 'METAL' || paymentMode === 'SPLIT') &&
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

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
                    <span className="font-medium text-[#4f4535]">
                      Previous Balance
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('previousBalance')}
                      className="w-24 rounded border-0 bg-[#f4f4f2] px-1 py-0.5 text-right text-xs md:w-28 md:px-2 md:py-1"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-[#d3c4af]/20 pt-3 md:pt-4">
                    <span className="font-['Noto_Serif'] text-sm font-bold md:text-base">
                      Net Payable
                    </span>
                    <span className="font-['Noto_Serif'] text-base font-black text-[#785600] md:text-xl">
                      {formatCurrency(netPayable)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-[#4f4535] md:mb-2 md:text-xs">
                      Cash Paid (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('cashPaid')}
                      className="w-full rounded-lg border-0 border-[#785600]/30 bg-[#785600]/5 px-3 py-3 text-base font-black text-[#785600] focus:ring-4 focus:ring-[#785600]/10 md:px-4 md:py-4 md:text-xl"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div
                    className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${
                      balanceDue > 0
                        ? 'bg-red-50'
                        : balanceDue < 0
                          ? 'bg-green-50'
                          : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-medium md:text-sm">
                      Balance Due
                    </span>
                    <span
                      className={`text-sm font-bold md:text-lg ${
                        balanceDue > 0
                          ? 'text-[#ba1a1a]'
                          : balanceDue < 0
                            ? 'text-green-600'
                            : 'text-[#1a1c1b]'
                      }`}
                    >
                      {balanceDue > 0
                        ? formatCurrency(balanceDue)
                        : balanceDue < 0
                          ? formatCurrency(Math.abs(balanceDue)) + ' (Excess)'
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
              {isSubmitting ? 'Saving...' : 'Save Invoice'}
            </GenericButton>
          </div>
        </div>
        <div className="h-20 md:h-0"></div>
      </div>
    </FormProvider>
  );
}
