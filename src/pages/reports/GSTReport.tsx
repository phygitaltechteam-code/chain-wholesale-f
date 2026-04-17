import React, {useState} from 'react';
import {
  Search,
  Filter,
  Printer,
  Download,
  TrendingUp,
  Landmark,
  ShieldCheck,
  User,
  Clock,
  FileText,
  ChevronRight,
} from 'lucide-react';

import {motion} from 'framer-motion';

const GSTReport = () => {
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');

  const ledgerData = [
    {
      invoice: 'INV-2023-0842',
      date: '14 Oct 2023',
      gstin: '27AAACH0000A1Z5',
      client: 'Mehta & Sons Jewellers',
      hsn: '7113',
      taxable: '₹84,500.00',
      cgst: '₹1,267.50',
      sgst: '₹1,267.50',
      totalGst: '₹2,535.00',
      type: 'sale',
    },
    {
      invoice: 'INV-2023-0843',
      date: '15 Oct 2023',
      gstin: '27BBBCY1234F1Z2',
      client: 'Zaveri Ornaments Ltd.',
      hsn: '7113',
      taxable: '₹1,42,000.00',
      cgst: '₹2,130.00',
      sgst: '₹2,130.00',
      totalGst: '₹4,260.00',
      type: 'sale',
    },
    {
      invoice: 'INV-2023-0844',
      date: '15 Oct 2023',
      gstin: 'URD (Unregistered)',
      client: 'Individual Walk-in',
      hsn: '7113',
      taxable: '₹45,200.00',
      cgst: '₹678.00',
      sgst: '₹678.00',
      totalGst: '₹1,356.00',
      type: 'sale',
    },
    {
      invoice: 'PUR-2023-0112',
      date: '16 Oct 2023',
      gstin: '24CCCDX4567G1Z8',
      client: 'Bullion Supply Corp',
      hsn: '7108',
      taxable: '-(₹5,20,000.00)',
      cgst: '-(₹7,800.00)',
      sgst: '-(₹7,800.00)',
      totalGst: '-(₹15,600.00)',
      isError: true,
      type: 'purchase',
    },
    {
      invoice: 'INV-2023-0845',
      date: '17 Oct 2023',
      gstin: '27DDDEW9876H1Z0',
      client: 'Royal Craft Exports',
      hsn: '7113',
      taxable: '₹2,12,000.00',
      cgst: '₹3,180.00',
      sgst: '₹3,180.00',
      totalGst: '₹6,360.00',
      type: 'sale',
    },
  ];

  return (
    <div className="bg-atelier-bg font-sans min-h-screen p-8">
      {/* Top Utility Nav */}
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-serif text-atelier-gold text-xl font-bold">
            GST & Tax Compliance
          </span>
          <div className="font-serif flex items-center gap-3 text-sm font-medium">
            <span className="bg-atelier-surface-low border-atelier-ink-variant/10 text-atelier-ink rounded-xl border px-4 py-1.5">
              Gold: ₹6,245
            </span>
            <span className="bg-atelier-surface-low border-atelier-ink-variant/10 text-atelier-ink rounded-xl border px-4 py-1.5">
              Silver: ₹74,200
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-atelier-surface-highest text-atelier-ink hover:bg-atelier-surface-low flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all">
            <Printer className="h-4 w-4" />
            Print View
          </button>
          <button className="bg-linear-to-br from-atelier-gold to-atelier-gold-dark flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold text-white shadow-lg">
            <Download className="h-4 w-4" />
            Export All
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header & Toggle */}
        <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="space-y-3">
            <h1 className="font-serif text-atelier-ink text-5xl font-bold tracking-tight">
              Tax Compliance Suite
            </h1>
            <p className="text-atelier-ink-variant font-medium opacity-70">
              Compliance oversight for the current financial year 2023-24.
            </p>
          </div>
          <div className="bg-atelier-surface-low border-atelier-ink-variant/5 flex items-center rounded-2xl border p-1.5">
            <button
              onClick={() => setPeriod('monthly')}
              className={
                'rounded-xl px-8 py-2.5 text-sm font-bold transition-all' +
                (period === 'monthly'
                  ? ' text-atelier-gold bg-white shadow-md'
                  : ' text-atelier-ink-variant hover:text-atelier-ink')
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod('quarterly')}
              className={
                'rounded-xl px-8 py-2.5 text-sm font-bold transition-all' +
                (period === 'quarterly'
                  ? ' text-atelier-gold bg-white shadow-md'
                  : ' text-atelier-ink-variant hover:text-atelier-ink')
              }
            >
              Quarterly
            </button>
          </div>
        </div>

        {/* Dashboard Cards (Bento Style) */}
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Output GST */}
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            className="border-atelier-ink-variant/10 shadow-atelier-gold/5 flex flex-col justify-between rounded-2xl border bg-white p-8 shadow-xl"
          >
            <div>
              <div className="mb-6 flex items-start justify-between">
                <span className="text-atelier-ink-variant/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                  Total Sales GST (Output)
                </span>
                <TrendingUp className="text-atelier-gold h-5 w-5" />
              </div>
              <h2 className="font-serif text-atelier-ink text-4xl font-bold">
                ₹4,82,450.00
              </h2>
            </div>
            <div className="border-atelier-ink-variant/5 text-atelier-ink-variant mt-8 flex items-center gap-2 border-t pt-6 text-xs">
              <span className="text-atelier-gold font-bold">+12.5%</span> from
              last period
            </div>
          </motion.div>

          {/* Input ITC */}
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.1}}
            className="border-atelier-ink-variant/10 shadow-atelier-gold/5 flex flex-col justify-between rounded-2xl border bg-white p-8 shadow-xl"
          >
            <div>
              <div className="mb-6 flex items-start justify-between">
                <span className="text-atelier-ink-variant/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                  Purchase ITC (Input)
                </span>
                <Landmark className="text-atelier-gold h-5 w-5" />
              </div>
              <h2 className="font-serif text-atelier-ink text-4xl font-bold">
                ₹3,15,800.00
              </h2>
            </div>
            <div className="border-atelier-ink-variant/5 text-atelier-ink-variant mt-8 border-t pt-6 text-xs">
              Eligible ITC based on GSTR-2B
            </div>
          </motion.div>

          {/* Net Payable */}
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.2}}
            className="bg-atelier-navy group relative flex flex-col justify-between overflow-hidden rounded-2xl p-8 shadow-2xl"
          >
            <div className="bg-atelier-gold/20 group-hover:bg-atelier-gold/30 absolute -right-4 -top-4 h-32 w-32 rounded-full blur-3xl transition-all" />
            <div className="relative z-10">
              <div className="mb-6 flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                  Net GST Payable
                </span>
                <Landmark className="text-atelier-gold-light h-5 w-5" />
              </div>
              <h2 className="font-serif text-4xl font-bold tracking-tight text-white">
                ₹1,66,650.00
              </h2>
            </div>
            <div className="relative z-10 mt-8">
              <button className="bg-atelier-gold hover:bg-atelier-gold-light hover:text-atelier-gold-dark w-full transform rounded-xl py-3 text-xs font-bold tracking-[0.2em] text-white transition-all active:scale-95">
                FILE RETURN NOW
              </button>
            </div>
          </motion.div>
        </div>

        {/* Ledger Table Section */}
        <div className="border-atelier-ink-variant/15 shadow-atelier-gold/5 overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="border-atelier-ink-variant/10 bg-atelier-surface-low/30 flex items-center justify-between border-b p-8">
            <h3 className="font-serif text-atelier-ink text-2xl font-bold">
              Compliance Detail Ledger
            </h3>
            <div className="flex gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search GSTIN or Invoice..."
                  className="border-atelier-ink-variant/20 focus:ring-atelier-gold/20 focus:border-atelier-gold w-80 rounded-xl border bg-white py-2.5 pl-12 pr-6 text-sm font-medium outline-none transition-all focus:ring-2"
                />
                <Search className="text-atelier-ink-variant/60 absolute left-4 top-3 h-4 w-4" />
              </div>
              <button className="border-atelier-ink-variant/20 hover:bg-atelier-surface-low flex items-center gap-2 rounded-xl border bg-white px-6 py-2.5 text-sm font-bold transition-all">
                <Filter className="h-4 w-4" /> Filter
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-atelier-surface-low/50 text-atelier-ink-variant text-[10px] font-extrabold uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Invoice #</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">GSTIN / Client</th>
                  <th className="px-8 py-5 text-center">HSN</th>
                  <th className="px-8 py-5 text-right">Taxable Amt</th>
                  <th className="px-8 py-5 text-right">CGST (1.5%)</th>
                  <th className="px-8 py-5 text-right">SGST (1.5%)</th>
                  <th className="px-8 py-5 text-right">Total GST (3%)</th>
                </tr>
              </thead>
              <tbody className="divide-atelier-ink-variant/5 divide-y">
                {ledgerData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-atelier-surface-low transition-colors duration-200"
                  >
                    <td className="font-mono text-atelier-gold px-8 py-6 text-[11px] font-bold tracking-tight">
                      {row.invoice}
                    </td>
                    <td className="text-atelier-ink-variant px-8 py-6 text-sm font-medium">
                      {row.date}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={
                            'text-sm font-bold' +
                            (row.isError ? ' text-red-700' : ' text-atelier-ink')
                          }
                        >
                          {row.gstin}
                        </span>
                        <span className="text-atelier-ink-variant/50 text-[10px] font-bold uppercase tracking-wide">
                          {row.client}
                        </span>
                      </div>
                    </td>
                    <td className="font-mono text-atelier-ink-variant/70 px-8 py-6 text-center text-xs font-bold">
                      {row.hsn}
                    </td>
                    <td
                      className={
                        'px-8 py-6 text-right text-sm font-bold' +
                        (row.isError ? ' text-red-700' : ' text-atelier-ink')
                      }
                    >
                      {row.taxable}
                    </td>
                    <td
                      className={
                        'px-8 py-6 text-right text-xs font-bold' +
                        (row.isError ? ' text-red-700' : ' text-atelier-ink-variant/60')
                      }
                    >
                      {row.cgst}
                    </td>
                    <td
                      className={
                        'px-8 py-6 text-right text-xs font-bold' +
                        (row.isError ? ' text-red-700' : ' text-atelier-ink-variant/60')
                      }
                    >
                      {row.sgst}
                    </td>
                    <td
                      className={
                        'px-8 py-6 text-right text-sm font-black' +
                        (row.isError ? ' text-red-700' : ' text-atelier-ink')
                      }
                    >
                      {row.sgst}
                    </td>
                    <td
                      className={
                        'px-8 py-6 text-right text-sm font-black' +
                        (row.isError ? ' text-red-700' : ' text-atelier-ink')
                      }
                    >
                      {row.totalGst}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-atelier-surface-low border-atelier-gold/20 border-t-2">
                <tr className="text-atelier-ink font-bold">
                  <td
                    className="px-8 py-8 text-right text-[11px] font-black uppercase tracking-[0.2em]"
                    colSpan={4}
                  >
                    Total Compliance Values
                  </td>
                  <td className="px-8 py-8 text-right text-sm">₹4,83,700.00</td>
                  <td className="px-8 py-8 text-right text-xs">₹7,255.50</td>
                  <td className="px-8 py-8 text-right text-xs">₹7,255.50</td>
                  <td className="font-serif text-atelier-gold px-8 py-8 text-right text-2xl tracking-tighter">
                    ₹14,511.00
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Audit Trail Footer */}
        <div className="border-atelier-ink-variant/20 mt-16 grid grid-cols-1 items-end gap-16 border-t pt-10 md:grid-cols-2">
          <div className="space-y-6">
            <h4 className="text-atelier-ink-variant/40 text-[10px] font-black uppercase tracking-[0.3em]">
              Report Audit Information
            </h4>
            <div className="text-atelier-ink/70 grid grid-cols-1 gap-x-12 gap-y-4 text-[11px] font-bold sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <User className="text-atelier-gold h-3.5 w-3.5" /> Generated by:
                Rajesh K. (Admin)
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-atelier-gold h-3.5 w-3.5" /> Timestamp:
                18 Oct 2023, 10:42 AM
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-atelier-gold h-3.5 w-3.5" />{' '}
                Integrity Check: SHA-256 Validated
              </div>
              <div className="flex items-center gap-3">
                <FileText className="text-atelier-gold h-3.5 w-3.5" /> Format:
                GST-B2B-V2.1
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="w-full max-w-xs space-y-3 text-right">
              <p className="text-atelier-ink-variant/40 text-[10px] font-black uppercase tracking-[0.3em]">
                Authorized Signature
              </p>
              <div className="bg-atelier-ink/80 h-0.5 w-full" />
              <p className="font-serif text-atelier-ink-variant text-sm italic">
                The Atelier Jewellery ERP — Private Registry
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSTReport;
