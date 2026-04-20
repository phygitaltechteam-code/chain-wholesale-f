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
} from 'lucide-react';
import {motion} from 'framer-motion';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';

// Define the ledger entry type
interface LedgerEntry {
  invoice: string;
  date: string;
  gstin: string;
  client: string;
  hsn: string;
  taxable: string;
  cgst: string;
  sgst: string;
  totalGst: string;
  type: 'sale' | 'purchase';
  isError?: boolean;
}

const GSTReport = () => {
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [searchQuery, setSearchQuery] = useState('');

  const ledgerData: LedgerEntry[] = [
    {
      invoice: 'ZNW-2823-0842',
      date: 'Oct 2023',
      gstin: '27AAACH0000A125',
      client: 'Mehta & Sons Jewellers',
      hsn: '711.3',
      taxable: '₹64,500.00',
      cgst: '₹1,267.50',
      sgst: '₹1,267.50',
      totalGst: '₹2,535.00',
      type: 'sale',
    },
    {
      invoice: 'ZNW-2823-0843',
      date: 'Oct 2023',
      gstin: '2788BCY1234F122',
      client: 'Zaveri Ornaments Ltd.',
      hsn: '711.3',
      taxable: '₹1,42,000.00',
      cgst: '₹2,130.00',
      sgst: '₹2,130.00',
      totalGst: '₹4,260.00',
      type: 'sale',
    },
    {
      invoice: 'ZNW-2823-0844',
      date: 'Oct 2023',
      gstin: 'URD (Unregistered)',
      client: 'Individual Walk-in',
      hsn: '711.3',
      taxable: '₹45,200.00',
      cgst: '₹678.00',
      sgst: '₹678.00',
      totalGst: '₹1,356.00',
      type: 'sale',
    },
    {
      invoice: 'PWB-2823-0112',
      date: 'Oct 2023',
      gstin: '24CCCDX4567G128',
      client: 'Bullion Supply Corp',
      hsn: '7188',
      taxable: '-',
      cgst: '(₹7,806.00)',
      sgst: '(₹7,806.00)',
      totalGst: '-',
      type: 'purchase',
      isError: true,
    },
    {
      invoice: 'ZNW-2823-0845',
      date: 'Oct 2023',
      gstin: '27DDDEW9876H120',
      client: 'Royal Craft Exports',
      hsn: '711.3',
      taxable: '₹2,12,000.00',
      cgst: '₹5,180.00',
      sgst: '₹5,180.00',
      totalGst: '₹6,360.00',
      type: 'sale',
    },
  ];

  // Calculate total values
  const totals = {
    taxable: '₹4,83,700.00',
    cgst: '₹7,255.50',
    sgst: '₹7,255.50',
    totalGst: '₹14,511.00',
  };

  // Define columns for GenericTable
  const columns: Column<LedgerEntry>[] = [
    {
      header: 'Invoice #',
      accessor: 'invoice',
      className:
        'font-mono text-[#785600] text-[11px] font-bold tracking-tight',
      align: 'left',
    },
    {
      header: 'Date',
      accessor: 'date',
      className: 'text-[#4f4535] text-sm font-medium',
      align: 'left',
    },
    {
      header: 'GSTIN / Client',
      accessor: (item) => (
        <div className="flex flex-col gap-0.5">
          <span
            className={`text-sm font-bold ${item.isError ? 'text-red-700' : 'text-[#1a1c1b]'}`}
          >
            {item.gstin}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#817563]/50">
            {item.client}
          </span>
        </div>
      ),
      align: 'left',
    },
    {
      header: 'HSN',
      accessor: 'hsn',
      className: 'font-mono text-[#817563]/70 text-center text-xs font-bold',
      align: 'center',
    },
    {
      header: 'Taxable Amt',
      accessor: 'taxable',
      className: (item) =>
        `text-right text-sm font-bold ${item.isError ? 'text-red-700' : 'text-[#1a1c1b]'}`,
      align: 'right',
    },
    {
      header: 'CGST (1.5%)',
      accessor: 'cgst',
      className: (item) =>
        `text-right text-xs font-bold ${item.isError ? 'text-red-700' : 'text-[#817563]/60'}`,
      align: 'right',
    },
    {
      header: 'SGST (1.5%)',
      accessor: 'sgst',
      className: (item) =>
        `text-right text-xs font-bold ${item.isError ? 'text-red-700' : 'text-[#817563]/60'}`,
      align: 'right',
    },
    {
      header: 'Total GST (3%)',
      accessor: 'totalGst',
      className: (item) =>
        `text-right text-sm font-black ${item.isError ? 'text-red-700' : 'text-[#1a1c1b]'}`,
      align: 'right',
    },
  ];

  return (
    <div className="font-sans min-h-screen bg-[#faf9f7] p-8">
      {/* Top Utility Nav */}
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-serif text-xl font-bold text-[#785600]">
            GST & Tax Compliance
          </span>
          <div className="font-serif flex items-center gap-3 text-sm font-medium">
            <span className="rounded-xl border border-[#d3c4af]/10 bg-white px-4 py-1.5 text-[#1a1c1b]">
              Gold: ₹6,245
            </span>
            <span className="rounded-xl border border-[#d3c4af]/10 bg-white px-4 py-1.5 text-[#1a1c1b]">
              Silver: ₹74,200
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-[#1a1c1b] transition-all hover:bg-[#f4f4f2]">
            <Printer className="h-4 w-4" />
            Print View
          </button>
          <button className="flex items-center gap-2 rounded-full bg-gradient-to-br from-[#785600] to-[#5a4000] px-5 py-2 text-sm font-bold text-white shadow-lg">
            <Download className="h-4 w-4" />
            Export All
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header & Toggle */}
        <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="space-y-3">
            <h1 className="font-serif text-5xl font-bold tracking-tight text-[#1a1c1b]">
              Tax Compliance Suite
            </h1>
            <p className="font-medium text-[#4f4535] opacity-70">
              Compliance oversight for the current financial year 2023-24.
            </p>
          </div>
          <div className="flex items-center rounded-2xl border border-[#d3c4af]/5 bg-white p-1.5">
            <button
              onClick={() => setPeriod('monthly')}
              className={
                'rounded-xl px-8 py-2.5 text-sm font-bold transition-all' +
                (period === 'monthly'
                  ? ' bg-white text-[#785600] shadow-md'
                  : ' text-[#4f4535] hover:text-[#1a1c1b]')
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod('quarterly')}
              className={
                'rounded-xl px-8 py-2.5 text-sm font-bold transition-all' +
                (period === 'quarterly'
                  ? ' bg-white text-[#785600] shadow-md'
                  : ' text-[#4f4535] hover:text-[#1a1c1b]')
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
            className="flex flex-col justify-between rounded-2xl border border-[#d3c4af]/10 bg-white p-8 shadow-xl shadow-[#785600]/5"
          >
            <div>
              <div className="mb-6 flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4f4535]/60">
                  Total Sales GST (Output)
                </span>
                <TrendingUp className="h-5 w-5 text-[#785600]" />
              </div>
              <h2 className="font-serif text-4xl font-bold text-[#1a1c1b]">
                ₹4,82,450.00
              </h2>
            </div>
            <div className="mt-8 flex items-center gap-2 border-t border-[#d3c4af]/5 pt-6 text-xs text-[#4f4535]">
              <span className="font-bold text-[#785600]">+12.5%</span> from last
              period
            </div>
          </motion.div>

          {/* Input ITC */}
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.1}}
            className="flex flex-col justify-between rounded-2xl border border-[#d3c4af]/10 bg-white p-8 shadow-xl shadow-[#785600]/5"
          >
            <div>
              <div className="mb-6 flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4f4535]/60">
                  Purchase ITC (Input)
                </span>
                <Landmark className="h-5 w-5 text-[#785600]" />
              </div>
              <h2 className="font-serif text-4xl font-bold text-[#1a1c1b]">
                ₹3,15,800.00
              </h2>
            </div>
            <div className="mt-8 border-t border-[#d3c4af]/5 pt-6 text-xs text-[#4f4535]">
              Eligible ITC based on GSTR-2B
            </div>
          </motion.div>

          {/* Net Payable */}
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.2}}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#1a2a3a] p-8 shadow-2xl"
          >
            <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-[#785600]/20 blur-3xl transition-all group-hover:bg-[#785600]/30" />
            <div className="relative z-10">
              <div className="mb-6 flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                  Net GST Payable
                </span>
                <Landmark className="h-5 w-5 text-[#a07c2e]" />
              </div>
              <h2 className="font-serif text-4xl font-bold tracking-tight text-white">
                ₹1,66,650.00
              </h2>
            </div>
            <div className="relative z-10 mt-8">
              <button className="w-full transform rounded-xl bg-[#785600] py-3 text-xs font-bold tracking-[0.2em] text-white transition-all hover:bg-[#a07c2e] hover:text-[#5a4000] active:scale-95">
                FILE RETURN NOW
              </button>
            </div>
          </motion.div>
        </div>

        {/* GenericTable Component */}
        <div className="overflow-hidden rounded-2xl border border-[#d3c4af]/15 bg-white shadow-2xl shadow-[#785600]/5">
          <GenericTable
            data={ledgerData}
            columns={columns}
            itemsPerPage={8}
            searchable={true}
            searchPlaceholder="Search GSTIN or Invoice..."
            title="Compliance Detail Ledger"
            paginationOff={false}
            className="border-0 shadow-none"
          />

          {/* Custom Footer with Total Values */}
          <div className="border-t border-[#d3c4af]/10 bg-[#f4f4f2]/30 px-8 py-6">
            <div className="flex flex-wrap items-center justify-end gap-8">
              <div className="flex items-center gap-6">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4f4535]">
                  Total Compliance Values
                </span>
                <div className="flex gap-8">
                  <div className="text-right">
                    <div className="text-xs text-[#4f4535]/60">Taxable Amt</div>
                    <div className="text-sm font-bold text-[#1a1c1b]">
                      {totals.taxable}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#4f4535]/60">CGST</div>
                    <div className="text-xs font-bold text-[#817563]/80">
                      {totals.cgst}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#4f4535]/60">SGST</div>
                    <div className="text-xs font-bold text-[#817563]/80">
                      {totals.sgst}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#4f4535]/60">Total GST</div>
                    <div className="font-serif text-2xl font-bold tracking-tighter text-[#785600]">
                      {totals.totalGst}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Trail Footer */}
        <div className="mt-16 grid grid-cols-1 items-end gap-16 border-t border-[#d3c4af]/20 pt-10 md:grid-cols-2">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4f4535]/40">
              Report Audit Information
            </h4>
            <div className="grid grid-cols-1 gap-x-12 gap-y-4 text-[11px] font-bold text-[#1a1c1b]/70 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <User className="h-3.5 w-3.5 text-[#785600]" /> Generated by:
                Rajesh K. (Admin)
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-3.5 w-3.5 text-[#785600]" /> Timestamp: 18
                Oct 2023, 10:42 AM
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-3.5 w-3.5 text-[#785600]" /> Integrity
                Check: SHA-256 Validated
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-3.5 w-3.5 text-[#785600]" /> Format:
                GST-B2B-V2.1
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="w-full max-w-xs space-y-3 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4f4535]/40">
                Authorized Signature
              </p>
              <div className="h-0.5 w-full bg-[#1a1c1b]/80" />
              <p className="font-serif text-sm italic text-[#4f4535]">
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
