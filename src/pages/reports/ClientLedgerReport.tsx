import React, {useState} from 'react';
import {
  Calendar,
  Search,
  Filter,
  Printer,
  Download,
  Share2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';

interface SalesTransaction {
  id: string;
  date: string;
  invoice: string;
  client: string;
  clientId: string;
  metalDetail: string;
  metalColor: string;
  rate: string;
  taxable: string;
  gst: string;
  total: string;
  weightGold?: number;
  weightSilver?: number;
}

const transactionsData: SalesTransaction[] = [
  {
    id: '1',
    date: 'Oct 24, 2023',
    invoice: '#INV-9842',
    client: 'Aditya Verma',
    clientId: 'CL-2204',
    metalDetail: '14.50g / 22K Gold',
    metalColor: '#f7bd48',
    rate: '₹5,850.00',
    taxable: '₹84,825.00',
    gst: '₹2,544.75',
    total: '₹87,369.75',
    weightGold: 14.5,
  },
  {
    id: '2',
    date: 'Oct 24, 2023',
    invoice: '#INV-9843',
    client: 'Meera Singhania',
    clientId: 'CL-1092',
    metalDetail: '240.00g / 925 Silver',
    metalColor: '#cdc6b6',
    rate: '₹74.50',
    taxable: '₹17,880.00',
    gst: '₹536.40',
    total: '₹18,416.40',
    weightSilver: 240,
  },
  {
    id: '3',
    date: 'Oct 23, 2023',
    invoice: '#INV-9840',
    client: 'Karan Johar',
    clientId: 'CL-5531',
    metalDetail: '45.00g / 24K Gold',
    metalColor: '#f7bd48',
    rate: '₹6,245.00',
    taxable: '₹2,81,025.00',
    gst: '₹8,430.75',
    total: '₹2,89,455.75',
    weightGold: 45,
  },
  {
    id: '4',
    date: 'Oct 23, 2023',
    invoice: '#INV-9839',
    client: 'Zoya Akhtar',
    clientId: 'CL-0032',
    metalDetail: '112.40g / 22K Gold',
    metalColor: '#f7bd48',
    rate: '₹5,850.00',
    taxable: '₹6,57,540.00',
    gst: '₹19,726.20',
    total: '₹6,77,266.20',
    weightGold: 112.4,
  },
];

const ClientLedgerReport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetal, setSelectedMetal] = useState('All Metals');
  const [startDate, setStartDate] = useState('Oct 01, 2023');
  const [endDate, setEndDate] = useState('Oct 31, 2023');

  // Filter data based on search and metal
  const filteredData = transactionsData.filter((item) => {
    const matchesSearch =
      item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoice.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMetal =
      selectedMetal === 'All Metals' ||
      (selectedMetal === 'Gold (22K/24K)' &&
        item.metalDetail.includes('Gold')) ||
      (selectedMetal === 'Silver (925/999)' &&
        item.metalDetail.includes('Silver'));

    return matchesSearch && matchesMetal;
  });

  // Calculate totals
  const totalGoldWeight = filteredData
    .filter((item) => item.weightGold)
    .reduce((sum, item) => sum + (item.weightGold || 0), 0);
  const totalSilverWeight = filteredData
    .filter((item) => item.weightSilver)
    .reduce((sum, item) => sum + (item.weightSilver || 0), 0);

  const totalGST = filteredData.reduce((sum, item) => {
    const gstValue = parseFloat(item.gst.replace(/[^0-9.-]+/g, ''));
    return sum + gstValue;
  }, 0);

  const totalGrand = filteredData.reduce((sum, item) => {
    const totalValue = parseFloat(item.total.replace(/[^0-9.-]+/g, ''));
    return sum + totalValue;
  }, 0);

  // Define columns for GenericTable
  const columns: Column<SalesTransaction>[] = [
    {
      header: 'Date',
      accessor: (item) => (
        <span className="text-sm font-medium text-[#1A1C1B]">{item.date}</span>
      ),
      align: 'left',
    },
    {
      header: 'Invoice #',
      accessor: (item) => (
        <span className="text-sm font-bold text-[#785600]">{item.invoice}</span>
      ),
      align: 'left',
    },
    {
      header: 'Client',
      accessor: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#1A1C1B]">
            {item.client}
          </span>
          <span className="text-[10px] text-[#5E5B56]/60">
            ID: {item.clientId}
          </span>
        </div>
      ),
      align: 'left',
    },
    {
      header: 'Metal Detail',
      accessor: (item) => (
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{backgroundColor: item.metalColor}}
          />
          <span className="text-sm text-[#1A1C1B]">{item.metalDetail}</span>
        </div>
      ),
      align: 'left',
    },
    {
      header: 'Rate (per g)',
      accessor: (item) => (
        <span className="text-sm font-medium text-[#5E5B56]">{item.rate}</span>
      ),
      align: 'left',
    },
    {
      header: 'Taxable',
      accessor: (item) => (
        <span className="text-right text-sm font-medium text-[#5E5B56]">
          {item.taxable}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'GST (3%)',
      accessor: (item) => (
        <span className="text-right text-sm font-medium text-[#5E5B56]">
          {item.gst}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Total',
      accessor: (item) => (
        <span className="text-right text-sm font-bold text-[#1A1C1B]">
          {item.total}
        </span>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="font-sans min-h-screen bg-[#F9F7F3] p-8">
      {/* Header Utilities */}
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#785600]" />
            <span className="font-serif text-lg font-semibold text-[#785600]">
              Live Bullion Rates
            </span>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="text-[#5E5B56]">
              Gold: <span className="font-bold text-[#785600]">₹6,245</span>
            </span>
            <span className="text-[#5E5B56]">
              Silver: <span className="font-bold text-[#785600]">₹74,200</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-full border border-[#D3C4AF]/10 bg-white px-4 py-1.5 text-sm font-medium text-[#1A1C1B] transition-colors hover:bg-[#F4F4F2]">
            <Printer className="h-4 w-4" />
            Print View
          </button>
          <button className="flex items-center gap-2 rounded-full bg-gradient-to-br from-[#785600] to-[#5a4000] px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
            <Share2 className="h-4 w-4" />
            Export All
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Page Heading & Editorial Summary */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-4xl font-bold tracking-tight text-[#1A1C1B]">
              Sales Analysis
            </h2>
            <p className="mt-2 font-medium text-[#5E5B56]/70">
              Detailed transaction report for the selected period
            </p>
          </div>
          <div className="flex gap-12 text-right">
            <div>
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#5E5B56]/60">
                Total Sales Value
              </span>
              <span className="font-serif text-3xl font-bold text-[#785600]">
                ₹2,48,50,000
              </span>
            </div>
            <div>
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#5E5B56]/60">
                Net Weight
              </span>
              <span className="font-serif text-3xl font-bold text-[#1A1C1B]">
                3,982.45g
              </span>
            </div>
          </div>
        </div>

        {/* Filters Section (Bento Style) */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-3 rounded-xl bg-[#F4F4F2] p-6 md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5E5B56]/60">
              Date Range Selection
            </label>
            <div className="flex items-center gap-4">
              <div className="flex flex-1 items-center justify-between rounded-lg border border-[#D3C4AF]/5 bg-white px-4 py-2.5 shadow-sm">
                <span className="text-sm font-medium">{startDate}</span>
                <Calendar className="h-4 w-4 text-[#5E5B56]/40" />
              </div>
              <span className="text-[#5E5B56]/40">to</span>
              <div className="flex flex-1 items-center justify-between rounded-lg border border-[#D3C4AF]/5 bg-white px-4 py-2.5 shadow-sm">
                <span className="text-sm font-medium">{endDate}</span>
                <Calendar className="h-4 w-4 text-[#5E5B56]/40" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-xl bg-[#F4F4F2] p-6">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5E5B56]/60">
              Metal Category
            </label>
            <div className="relative">
              <select
                value={selectedMetal}
                onChange={(e) => setSelectedMetal(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[#D3C4AF]/5 bg-white px-4 py-2.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-[#785600]"
              >
                <option>All Metals</option>
                <option>Gold (22K/24K)</option>
                <option>Silver (925/999)</option>
                <option>Platinum</option>
              </select>
              <ArrowRight className="pointer-events-none absolute right-3 top-3 h-4 w-4 rotate-90 text-[#5E5B56]/40" />
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-xl bg-[#F4F4F2] p-6">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5E5B56]/60">
              Client Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name/ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#D3C4AF]/5 bg-white px-4 py-2.5 text-sm font-medium shadow-sm placeholder:text-[#5E5B56]/30 focus:outline-none focus:ring-1 focus:ring-[#785600]"
              />
              <Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#5E5B56]/40" />
            </div>
          </div>
        </div>

        {/* GenericTable Component */}
        <div className="overflow-hidden rounded-2xl border border-[#D3C4AF]/5 bg-white shadow-lg shadow-[#785600]/5">
          <GenericTable
            data={filteredData}
            columns={columns}
            title=""
            searchable={false}
            itemsPerPage={5}
            paginationOff={false}
            className="border-0 shadow-none"
            emptyMessage="No sales transactions found"
          />
        </div>

        {/* Summary Totals Bar */}
        <div className="mt-8 flex items-center justify-between rounded-2xl border border-[#D3C4AF]/5 bg-[#F4F4F2]/30 p-6">
          <div className="flex gap-16">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#785600]/10">
                <Filter className="h-5 w-5 text-[#785600]" />
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase leading-none tracking-widest text-[#5E5B56]/60">
                  Total Net Weight
                </p>
                <p className="font-serif text-2xl font-bold text-[#1A1C1B]">
                  {totalGoldWeight.toFixed(2)}g{' '}
                  <span className="font-sans ml-1 text-xs font-medium text-[#5E5B56]/50">
                    Au
                  </span>{' '}
                  / {totalSilverWeight.toFixed(2)}g{' '}
                  <span className="font-sans ml-1 text-xs font-medium text-[#5E5B56]/50">
                    Ag
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1A2A3A]/10">
                <Search className="h-5 w-5 text-[#1A2A3A]" />
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase leading-none tracking-widest text-[#5E5B56]/60">
                  Consolidated GST
                </p>
                <p className="font-serif text-2xl font-bold text-[#1A1C1B]">
                  ₹
                  {totalGST.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[#D3C4AF]/10 bg-white px-8 py-5 text-right shadow-sm">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#5E5B56]/60">
              Grand Total (Net Receivable)
            </p>
            <p className="font-serif text-4xl font-bold tracking-tighter text-[#785600]">
              ₹
              {totalGrand.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* Footer Utilities */}
        <div className="mt-12 flex items-center justify-between text-xs font-medium text-[#5E5B56]/40">
          <p>Generated on Oct 25, 2023 • 10:45 AM • User: Admin_Karan</p>
          <div className="flex gap-8">
            <button className="transition-colors hover:text-[#785600]">
              Audit Log
            </button>
            <button className="flex items-center gap-1 transition-colors hover:text-[#785600]">
              <Download className="h-3 w-3" />
              Download CSV
            </button>
            <button className="transition-colors hover:text-[#785600]">
              Direct WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="group fixed bottom-10 right-10 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#785600] to-[#5a4000] text-white shadow-2xl transition-all hover:scale-110 active:scale-95">
        <Plus className="h-8 w-8" />
        <span className="pointer-events-none absolute right-full mr-4 translate-x-4 transform whitespace-nowrap rounded-xl bg-[#1A1C1B] px-4 py-2 text-xs font-bold tracking-widest text-white opacity-0 shadow-xl transition-all group-hover:translate-x-0 group-hover:opacity-100">
          RECORD NEW SALE
        </span>
      </button>
    </div>
  );
};

export default ClientLedgerReport;
