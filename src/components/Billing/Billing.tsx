import React, {useState} from 'react';
import {Search, Plus, TrendingUp, TrendingDown} from 'lucide-react';
import {MdPrint} from 'react-icons/md';
import GenericButton from '../Forms/Buttons/GenericButton';
import GenericInputField from '../Forms/Input/GenericInputField';
import {FormProvider, useForm} from 'react-hook-form';
import PageHeader from '../Forms/Common/PageHeader';

interface MetalItem {
  id: string;
  metalType: string;
  grossWeight: number;
  purity: number;
  fineWeight: number;
  rate: number;
  amount: number;
}

interface BillingFormData {
  metalType: string;
  grossWeight: number;
  purity: number;
  rate: number;
  makingFees: number;
  hsnCode: string;
  gstPercent: number;
  exchangeMetalType: string;
  exchangeWeight: number;
  exchangePurity: number;
  exchangeRate: number;
  cashPaid: number;
  previousBalance: number;
}

export default function Billing() {
  const methods = useForm<BillingFormData>({
    defaultValues: {
      metalType: 'Gold 22K (91.6)',
      grossWeight: 10.45,
      purity: 91.6,
      rate: 7245,
      makingFees: 1500,
      hsnCode: '7113',
      gstPercent: 3,
      exchangeMetalType: 'Gold Old Ornament',
      exchangeWeight: 5.25,
      exchangePurity: 75.0,
      exchangeRate: 7150,
      cashPaid: 57000,
      previousBalance: 12450,
    },
  });

  const {watch, setValue, register} = methods;

  const [transactionType, setTransactionType] = useState<'Sale' | 'Purchase'>(
    'Sale',
  );
  const [billingMode, setBillingMode] = useState<'Cash' | 'GST'>('GST');
  const [selectedClient, setSelectedClient] = useState({
    name: 'Amit Sharma',
    initials: 'AS',
    phone: '+91 98765 43210',
  });
  const [metalItems, setMetalItems] = useState<MetalItem[]>([
    {
      id: '1',
      metalType: 'Gold 22K (91.6)',
      grossWeight: 10.45,
      purity: 91.6,
      fineWeight: 9.572,
      rate: 7245,
      amount: 69348,
    },
  ]);

  // Watch form values
  const makingFees = watch('makingFees') || 1500;
  const hsnCode = watch('hsnCode') || '7113';
  const gstPercent = watch('gstPercent') || 3;
  const exchangeWeight = watch('exchangeWeight') || 5.25;
  const exchangePurity = watch('exchangePurity') || 75.0;
  const exchangeRate = watch('exchangeRate') || 7150;
  const cashPaid = watch('cashPaid') || 57000;
  const previousBalance = watch('previousBalance') || 12450;

  // Calculate totals
  const subtotal =
    metalItems.reduce((sum, item) => sum + item.amount, 0) + makingFees;
  const totalTax = (subtotal * gstPercent) / 100;
  const totalWithTax = subtotal + totalTax;
  const exchangeValue = (exchangeWeight * exchangePurity * exchangeRate) / 100;
  const netPayable = totalWithTax - exchangeValue + previousBalance;
  const balanceDue = netPayable - cashPaid;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handlePrint = () => {
    console.log('Printing invoice...');
  };

  const handleSaveDraft = () => {
    console.log('Saving draft...');
  };

  const handleSaveAndNew = () => {
    console.log('Save and create new...');
  };

  const calculateFineWeight = (grossWeight: number, purity: number) => {
    return (grossWeight * purity) / 100;
  };

  const calculateAmount = (fineWeight: number, rate: number) => {
    return fineWeight * rate;
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-[#f9f9f7]">
        {/* Header Section */}

        <div className="px-8 py-6">
          <div>
            <PageHeader
              title="Billing Dashboard"
              subtitle="Create and manage invoices"
            />
          </div>
        </div>

        {/* Billing Interface Content */}
        <div className="flex h-screen gap-8 overflow-hidden p-8">
          {/* Left Side: Inputs */}
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto scroll-smooth pr-4">
            {/* Billing Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-4 rounded-xl border border-[#d3c4af]/10 bg-white p-6 shadow-sm">
                <h3 className="font-['Manrope'] text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                  Transaction Type
                </h3>
                <div className="flex w-fit rounded-full bg-[#f4f4f2] p-1">
                  <button
                    onClick={() => setTransactionType('Sale')}
                    className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
                      transactionType === 'Sale'
                        ? 'bg-[#785600] text-white shadow-md'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    Sale
                  </button>
                  <button
                    onClick={() => setTransactionType('Purchase')}
                    className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
                      transactionType === 'Purchase'
                        ? 'bg-[#785600] text-white shadow-md'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    Purchase
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-[#d3c4af]/10 bg-white p-6 shadow-sm">
                <h3 className="font-['Manrope'] text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                  Billing Mode
                </h3>
                <div className="flex w-fit rounded-full bg-[#f4f4f2] p-1">
                  <button
                    onClick={() => setBillingMode('Cash')}
                    className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
                      billingMode === 'Cash'
                        ? 'bg-[#785600] text-white shadow-md'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    Cash Bill
                  </button>
                  <button
                    onClick={() => setBillingMode('GST')}
                    className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
                      billingMode === 'GST'
                        ? 'bg-[#785600] text-white shadow-md'
                        : 'text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    GST Bill
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 1: Client Search */}
            <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-['Noto_Serif'] text-xl font-bold text-[#785600]">
                  Client Details
                </h3>
                <GenericButton className="!px-4 !py-2 text-sm">
                  <Plus className="h-4 w-4" />
                  <span>New Client</span>
                </GenericButton>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4f4535]" />
                <input
                  className="w-full rounded-lg border-0 bg-[#f4f4f2] py-4 pl-12 pr-4 text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20"
                  placeholder="Search by name, phone or UID..."
                  type="text"
                />
              </div>
              <div className="mt-4 flex gap-4">
                <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#785600]/10 bg-[#785600]/5 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#785600]/20 font-bold text-[#785600]">
                    {selectedClient.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1a1c1b]">
                      {selectedClient.name}
                    </p>
                    <p className="text-xs text-[#4f4535]">
                      {selectedClient.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Metal Entry */}
            <div className="rounded-xl border border-l-4 border-[#d3c4af]/10 border-l-[#785600] bg-white p-6">
              <div className="mb-6 flex items-center gap-2">
                <h3 className="font-['Noto_Serif'] text-xl font-bold text-[#785600]">
                  Items Sold (Metal Entry)
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1">
                  <GenericInputField
                    name="metalType"
                    label="Metal Type"
                    as="select"
                    className="w-full rounded-lg border-0 bg-[#f4f4f2] px-4 py-3"
                  >
                    <option>Gold 22K (91.6)</option>
                    <option>Gold 24K (99.9)</option>
                    <option>Gold 18K (75.0)</option>
                    <option>Silver (99.9)</option>
                  </GenericInputField>
                </div>
                <div>
                  <GenericInputField
                    name="grossWeight"
                    label="Gross Wt (g)"
                    type="number"
                    step="0.001"
                    placeholder="10.450"
                  />
                </div>
                <div>
                  <GenericInputField
                    name="purity"
                    label="Purity %"
                    type="number"
                    step="0.01"
                    placeholder="91.60"
                  />
                </div>
                <div>
                  <GenericInputField
                    name="fineWeight"
                    label="Fine Wt (g)"
                    type="text"
                    disabled
                    value="9.572"
                  />
                </div>
                <div>
                  <GenericInputField
                    name="rate"
                    label="Rate / gram"
                    type="number"
                    placeholder="7245"
                  />
                </div>
                <div>
                  <GenericInputField
                    name="amount"
                    label="Amount"
                    type="text"
                    disabled
                    value="₹ 69,348"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Charges */}
            <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-6">
              <h3 className="mb-6 font-['Noto_Serif'] text-xl font-bold text-[#785600]">
                Additional Charges &amp; GST
              </h3>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <GenericInputField
                    name="makingFees"
                    label="Making Fees (₹)"
                    type="number"
                  />
                </div>
                <div>
                  <GenericInputField
                    name="hsnCode"
                    label="HSN Code"
                    type="text"
                  />
                </div>
                <div>
                  <GenericInputField
                    name="gstPercent"
                    label="GST %"
                    type="number"
                  />
                </div>
                <div>
                  <GenericInputField
                    name="totalTax"
                    label="Total Tax"
                    type="text"
                    disabled
                    value={formatCurrency(totalTax)}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Payment/Exchange */}
            <div className="mb-20 rounded-xl border border-l-4 border-[#d3c4af]/10 border-l-[#5d5c74] bg-white p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-['Noto_Serif'] text-xl font-bold text-[#5d5c74]">
                    Payment &amp; Exchange
                  </h3>
                </div>
                <div className="flex rounded-lg bg-[#f4f4f2] p-1">
                  <button className="rounded-md px-4 py-1.5 text-xs font-bold text-[#4f4535] transition-all hover:bg-[#e8e8e6]">
                    Cash/UPI
                  </button>
                  <button className="rounded-md px-4 py-1.5 text-xs font-bold text-[#4f4535] transition-all hover:bg-[#e8e8e6]">
                    Metal Exchange
                  </button>
                  <button className="rounded-md bg-[#5d5c74] px-4 py-1.5 text-xs font-bold text-white shadow-sm">
                    Part/Split
                  </button>
                </div>
              </div>

              {/* Metal Exchange Fields */}
              <div className="mb-6 rounded-xl border border-[#d3c4af]/10 bg-[#f4f4f2]/50 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                    Metal Exchange Details
                  </h4>
                  <span className="rounded bg-[#5d5c74]/5 px-2 py-1 text-[10px] font-medium text-[#5d5c74]">
                    Sale Rate: ₹7,300 |{' '}
                    <span className="font-bold">Exchange Rate: ₹7,150</span>
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <GenericInputField
                      name="exchangeMetalType"
                      label="Metal Type"
                      as="select"
                    >
                      <option>Gold Old Ornament</option>
                      <option>Silver Old Ornament</option>
                    </GenericInputField>
                  </div>
                  <div>
                    <GenericInputField
                      name="exchangeWeight"
                      label="Weight (g)"
                      type="number"
                      step="0.001"
                    />
                  </div>
                  <div>
                    <GenericInputField
                      name="exchangePurity"
                      label="Purity %"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <GenericInputField
                      name="exchangeRate"
                      label="Buying Rate (₹)"
                      type="number"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#d3c4af]/10 pt-4">
                  <span className="text-xs font-bold italic text-[#4f4535]">
                    Calculated Exchange Value:
                  </span>
                  <span className="font-mono text-lg font-black text-[#5d5c74]">
                    {formatCurrency(exchangeValue)}
                  </span>
                </div>
              </div>

              {/* Split Cash Field */}
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[#4f4535]">
                      Subtotal (Items + Tax)
                    </span>
                    <span className="font-bold text-[#1a1c1b]">
                      {formatCurrency(totalWithTax)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium italic text-[#4f4535]">
                      Less: Metal Adjusted Value
                    </span>
                    <span className="font-bold text-[#5d5c74]">
                      - {formatCurrency(exchangeValue)}
                    </span>
                  </div>
                  <div>
                    <GenericInputField
                      name="previousBalance"
                      label="Add: Previous Balance"
                      type="number"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-[#d3c4af]/20 pt-4">
                    <span className="font-['Noto_Serif'] text-base font-bold text-[#1a1c1b]">
                      Net Payable
                    </span>
                    <span className="font-['Noto_Serif'] text-xl font-black text-[#785600]">
                      {formatCurrency(netPayable)}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <GenericInputField
                      name="cashPaid"
                      label="Remaining Cash Paid (₹)"
                      type="number"
                      className="!text-xl !font-black !text-[#785600]"
                    />
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-medium text-[#4f4535]">
                      Balance Due
                    </span>
                    <span className="text-lg font-bold text-[#ba1a1a]">
                      {formatCurrency(balanceDue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Live Bill Preview */}
          <div className="flex w-[450px] flex-col gap-6">
            <div className="flex flex-1 flex-col overflow-hidden rounded-sm border border-[#d3c4af]/30 bg-white shadow-2xl">
              {/* Invoice Header */}
              <div className="flex flex-col items-center bg-[#1a1a2e] p-8 text-center text-white">
                <h2 className="font-['Noto_Serif'] text-2xl font-bold tracking-tight text-[#B8860B]">
                  VIKAS JEWELLERS
                </h2>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] opacity-70">
                  Exquisite Craftsmanship Since 1988
                </p>
                <div className="mt-4 max-w-[200px] text-[9px] leading-relaxed opacity-60">
                  Goldsmith Street, Jewel Bazaar, Zaveri Mandi, Mumbai - 400002.
                  GSTIN: 27AABCV1234F1Z1
                </div>
              </div>

              <div className="flex flex-1 flex-col overflow-y-auto p-8">
                <div className="mb-8 flex items-start justify-between border-b border-[#d3c4af]/20 pb-4">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold uppercase text-[#4f4535]">
                      Billed To
                    </h4>
                    <p className="text-sm font-bold text-[#1a1c1b]">
                      {selectedClient.name}
                    </p>
                    <p className="text-[11px] text-[#4f4535]">
                      {selectedClient.phone}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <h4 className="text-[10px] font-bold uppercase text-[#4f4535]">
                      Invoice Details
                    </h4>
                    <p className="text-[11px]">
                      <span className="font-bold">No:</span> #VJ-2024-0452
                    </p>
                    <p className="text-[11px]">
                      <span className="font-bold">Date:</span>{' '}
                      {new Date().toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#d3c4af]/20 text-[10px] uppercase text-[#4f4535]">
                      <th className="pb-3 font-bold">Description</th>
                      <th className="pb-3 text-right font-bold">Weight</th>
                      <th className="pb-3 text-right font-bold">Rate</th>
                      <th className="pb-3 text-right font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] leading-[3]">
                    <tr className="border-b border-[#d3c4af]/10">
                      <td className="pt-2">Gold Ornament (22K)</td>
                      <td className="pt-2 text-right">10.450g</td>
                      <td className="pt-2 text-right">₹7,245.00</td>
                      <td className="pt-2 text-right font-bold">₹69,348.00</td>
                    </tr>
                    <tr>
                      <td className="text-right text-[#4f4535]" colSpan={3}>
                        Making Charges
                      </td>
                      <td className="text-right">₹1,500.00</td>
                    </tr>
                    <tr>
                      <td className="text-right text-[#4f4535]" colSpan={3}>
                        GST ({gstPercent}%)
                      </td>
                      <td className="text-right">{formatCurrency(totalTax)}</td>
                    </tr>
                    <tr className="font-bold text-[#5d5c74]">
                      <td className="text-right" colSpan={3}>
                        Less: Metal Exchange
                      </td>
                      <td className="text-right">
                        - {formatCurrency(exchangeValue)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-8 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="italic text-[#4f4535]">Bill Balance</span>
                    <span className="font-bold text-[#1a1c1b]">
                      {formatCurrency(totalWithTax - exchangeValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="italic text-[#4f4535]">
                      Add: Old Balance
                    </span>
                    <span className="font-bold text-[#ba1a1a]">
                      {formatCurrency(previousBalance)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t-2 border-[#1a1a2e] pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1a1c1b]">
                      Net Payable
                    </span>
                    <span className="font-['Noto_Serif'] text-lg font-black text-[#785600]">
                      {formatCurrency(netPayable)}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-10 text-center">
                  <div className="mb-4 flex justify-center">
                    <img
                      className="h-10 opacity-60"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9-H3YQlxMmnFVr7rIwxWi7Oo_h4j9sekyXE2VeHAs41WJifOpDmgdQuny_jnCDXA8Q8TRyYYAMNHImgbOWxBtrzofW3xoMxGd3uZjAIcgvH5PvyGp58Af8shL8A903voPfr5IPAfWZG0_0xzjis-vLlO8Xg1nCv6F9lgGrlk2DcCIBzvzKRX22JCdVytXa4D5jG0zXw-Sjj04bvtFqOG4G6LcMP2YPvDqgrwFYE2R_p509BKJVsTlwAGLBC18bWhICHdG27W9iei5"
                      alt="Signature"
                    />
                  </div>
                  <p className="inline-block border-t border-[#d3c4af]/30 pt-2 text-[10px] font-bold uppercase tracking-widest">
                    Authorized Signatory
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="grid grid-cols-1 gap-3">
              <GenericButton onClick={handlePrint} className="w-full">
                <MdPrint className="h-5 w-5" />
                Save &amp; Print Invoice
              </GenericButton>
              <div className="grid grid-cols-2 gap-3">
                <GenericButton
                  onClick={handleSaveDraft}
                  className="!bg-[#e2e3e1] !text-[#45455b] hover:!bg-[#e8e8e6]"
                >
                  Save Draft
                </GenericButton>
                <GenericButton
                  onClick={handleSaveAndNew}
                  className="!bg-[#e2e3e1] !text-[#45455b] hover:!bg-[#e8e8e6]"
                >
                  Save &amp; New
                </GenericButton>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Live Bullion Ticker */}
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-12 rounded-full border border-[#B8860B]/20 bg-[#1a1a2e]/90 px-10 py-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B8860B]">
              Live Market
            </span>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                Gold 24K
              </span>
              <span className="font-['Noto_Serif'] text-lg font-bold text-[#B8860B]">
                ₹7,245.00
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                Silver 999
              </span>
              <span className="font-['Noto_Serif'] text-lg font-bold text-white">
                ₹882.00
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                Gold 22K
              </span>
              <span className="font-['Noto_Serif'] text-lg font-bold text-[#B8860B]">
                ₹6,636.00
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs font-bold text-green-400">+1.24%</span>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
