import React, {useState} from 'react';
import {
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

import GenericTable, {Column} from '@/components/Forms/Table/GenericTable';

type Ledger = {
  invoice: string;
  date: string;
  gstin: string;
  client: string;
  hsn: string;
  taxable: string;
  cgst: string;
  sgst: string;
  totalGst: string;
  isError?: boolean;
};

const GSTReport = () => {
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');

  const ledgerData: Ledger[] = [
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
    },
  ];

  const columns: Column<Ledger>[] = [
    {
      header: 'Invoice #',
      accessor: 'invoice',
      className: 'font-mono text-[#B88A44] font-bold text-xs',
    },
    {
      header: 'Date',
      accessor: 'date',
      className: 'text-sm text-[#5E5B56]',
    },
    {
      header: 'GSTIN / Client',
      accessor: (item) => item.gstin,
      render: (item) => (
        <div className="flex flex-col">
          <span
            className={`font-bold ${
              item.isError ? 'text-red-700' : 'text-[#2B2A28]'
            }`}
          >
            {item.gstin}
          </span>
          <span className="text-[10px] uppercase text-[#5E5B56]/50">
            {item.client}
          </span>
        </div>
      ),
    },
    {
      header: 'HSN',
      accessor: 'hsn',
      align: 'center',
    },
    {
      header: 'Taxable Amt',
      accessor: 'taxable',
      align: 'right',
      render: (item) => (
        <span className={item.isError ? 'text-red-700' : ''}>
          {item.taxable}
        </span>
      ),
    },
    {
      header: 'CGST',
      accessor: 'cgst',
      align: 'right',
    },
    {
      header: 'SGST',
      accessor: 'sgst',
      align: 'right',
    },
    {
      header: 'Total GST',
      accessor: 'totalGst',
      align: 'right',
      className: 'font-bold',
    },
  ];

  return (
    <div className="font-sans min-h-screen bg-[#F9F7F3] p-8">
      {/* Top Nav */}
      <div className="mb-10 flex justify-between">
        <span className="text-xl font-bold text-[#B88A44]">
          GST & Tax Compliance
        </span>

        <div className="flex gap-4">
          <button className="flex items-center gap-2 rounded-full border px-5 py-2 text-sm">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button className="flex items-center gap-2 rounded-full bg-[#B88A44] px-5 py-2 text-sm text-white">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
        <motion.div className="rounded-2xl bg-white p-6 shadow">
          <TrendingUp className="mb-3 text-[#B88A44]" />
          <h2 className="text-2xl font-bold">₹4,82,450</h2>
          <p className="text-gray-500 text-sm">Output GST</p>
        </motion.div>

        <motion.div className="rounded-2xl bg-white p-6 shadow">
          <Landmark className="mb-3 text-[#B88A44]" />
          <h2 className="text-2xl font-bold">₹3,15,800</h2>
          <p className="text-gray-500 text-sm">Input ITC</p>
        </motion.div>

        <motion.div className="rounded-2xl bg-[#1E2A3A] p-6 text-white shadow">
          <h2 className="text-2xl font-bold">₹1,66,650</h2>
          <button className="mt-4 w-full rounded bg-[#B88A44] py-2">
            FILE RETURN
          </button>
        </motion.div>
      </div>

      {/* ✅ GENERIC TABLE */}
      <GenericTable<Ledger>
        data={ledgerData}
        columns={columns}
        title="Compliance Detail Ledger"
        searchable={true}
        searchPlaceholder="Search GSTIN or Invoice..."
        className="rounded-2xl shadow-xl"
      />

      {/* Footer */}
      <div className="text-gray-500 mt-16 border-t pt-6 text-sm">
        <div className="flex gap-6">
          <User size={14} /> Rajesh K.
          <Clock size={14} /> 18 Oct 2023
          <ShieldCheck size={14} /> Verified
          <FileText size={14} /> GST-B2B
        </div>
      </div>
    </div>
  );
};

export default GSTReport;
