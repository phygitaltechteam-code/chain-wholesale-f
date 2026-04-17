// SalesReport.tsx - Complete Sales Report matching HTML design exactly
import React, { useState } from 'react';

// Sale Record Type Definition
interface SaleRecord {
  id: string;
  invoiceDate: string;
  billNo: string;
  clientName: string;
  gstNo: string;
  metalDetail: string;
  netWeight: number;
  rate: number;
  taxableValue: number;
  totalPayable: number;
}

// Mock Data
const salesData: SaleRecord[] = [
  {
    id: '1',
    invoiceDate: '12 Oct 2023',
    billNo: 'INV-23-4501',
    clientName: 'Ramesh Chandra J.',
    gstNo: 'GST: 27AABCM8811K',
    metalDetail: 'Gold 22K (Jewellery)',
    netWeight: 45.62,
    rate: 5840,
    taxableValue: 266420.8,
    totalPayable: 274413.0,
  },
  {
    id: '2',
    invoiceDate: '12 Oct 2023',
    billNo: 'INV-23-4502',
    clientName: 'A.K. Jewellers',
    gstNo: 'GST: 27AABCM8812L',
    metalDetail: 'Silver Bullion 99.9',
    netWeight: 1000.0,
    rate: 74,
    taxableValue: 74000.0,
    totalPayable: 76220.0,
  },
  {
    id: '3',
    invoiceDate: '13 Oct 2023',
    billNo: 'INV-23-4503',
    clientName: 'Vikas Trading Corp',
    gstNo: 'GST: 27AABCM8813M',
    metalDetail: 'Gold Bullion 99.9',
    netWeight: 100.0,
    rate: 6245,
    taxableValue: 624500.0,
    totalPayable: 643235.0,
  },
  {
    id: '4',
    invoiceDate: '13 Oct 2023',
    billNo: 'INV-23-4504',
    clientName: 'Sunil Mehta',
    gstNo: 'GST: 27AABCM8814N',
    metalDetail: 'Gold 22K (Ornaments)',
    netWeight: 12.45,
    rate: 5860,
    taxableValue: 72957.0,
    totalPayable: 75145.71,
  },
  {
    id: '5',
    invoiceDate: '14 Oct 2023',
    billNo: 'INV-23-4505',
    clientName: 'Priya Jewellers',
    gstNo: 'GST: 27AABCM8815O',
    metalDetail: 'Gold 18K (Studded)',
    netWeight: 8.22,
    rate: 4820,
    taxableValue: 39620.4,
    totalPayable: 40809.0,
  },
  {
    id: '6',
    invoiceDate: '14 Oct 2023',
    billNo: 'INV-23-4506',
    clientName: 'Rajesh Exports',
    gstNo: 'GST: 27AABCM8816P',
    metalDetail: 'Gold Bullion 99.9',
    netWeight: 250.0,
    rate: 6245,
    taxableValue: 1561250.0,
    totalPayable: 1608087.5,
  },
  {
    id: '7',
    invoiceDate: '15 Oct 2023',
    billNo: 'INV-23-4507',
    clientName: 'Meera Diamonds',
    gstNo: 'GST: 27AABCM8817Q',
    metalDetail: 'Silver Bullion 99.9',
    netWeight: 2500.0,
    rate: 74.2,
    taxableValue: 185500.0,
    totalPayable: 191065.0,
  },
];

// Filter Options
const metalOptions = ['All Metals', 'Gold (99.9)', 'Gold (22K)', 'Silver (99.9)'];
const billTypeOptions = ['GST Invoice', 'Estimate', 'Export Bill', 'All'];

// Helper for number formatting
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
};

const SalesReport: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '2023-10-01',
    end: '2023-10-31',
  });
  const [selectedMetal, setSelectedMetal] = useState('All Metals');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedBillType, setSelectedBillType] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter Logic
  const filteredData = salesData.filter((item) => {
    // Search by Bill No or Client Name
    const matchesSearch =
      searchTerm === '' ||
      item.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase());

    // Client filter
    const matchesClient =
      selectedClient === '' ||
      item.clientName.toLowerCase().includes(selectedClient.toLowerCase());

    // Metal filter
    const matchesMetal =
      selectedMetal === 'All Metals' ||
      (selectedMetal === 'Gold (99.9)' &&
        item.metalDetail.includes('Gold Bullion')) ||
      (selectedMetal === 'Gold (22K)' &&
        item.metalDetail.includes('Gold 22K')) ||
      (selectedMetal === 'Silver (99.9)' && item.metalDetail.includes('Silver'));

    // Bill Type filter (mock - based on metal detail for demo)
    const matchesBillType =
      selectedBillType === 'All' ||
      (selectedBillType === 'GST Invoice' && item.metalDetail.includes('Gold')) ||
      (selectedBillType === 'Estimate' && item.metalDetail.includes('Silver')) ||
      (selectedBillType === 'Export Bill' && item.metalDetail.includes('Bullion'));

    // Date range filter (mock - based on invoice date string)
    const itemDate = new Date(item.invoiceDate);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const matchesDate = itemDate >= startDate && itemDate <= endDate;

    return matchesSearch && matchesClient && matchesMetal && matchesBillType && matchesDate;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Totals for current page
  const totalNetWeight = currentData.reduce((sum, item) => sum + item.netWeight, 0);
  const totalTaxableValue = currentData.reduce((sum, item) => sum + item.taxableValue, 0);
  const totalPayable = currentData.reduce((sum, item) => sum + item.totalPayable, 0);

  // Handlers
  const handleGenerate = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
  };

  const handleExportCSV = () => {
    console.log('Exporting to CSV...', filteredData);
    alert('CSV Export triggered (demo)');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-6 md:px-6 lg:px-8 bg-[#f9f9f7]">
      {/* Header Section - Matching HTML design */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#785600] text-sm font-medium mb-1">
            <span className="material-symbols-outlined text-base">receipt_long</span>
            <span className="uppercase tracking-wider text-xs">Sales Analysis</span>
          </div>
          <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-[#1a1c1b]">
            Sales Ledger & Report
          </h2>
          <p className="text-[#4f4535] mt-2 text-sm">
            Real-time sales performance and transaction summary
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-full border border-[#d3c4af]/30 text-sm font-medium hover:bg-[#eeeeec] transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Print View
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-full bg-[#785600] text-white text-sm font-medium hover:bg-[#5d4200] transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export All
          </button>
        </div>
      </div>

      {/* Summary Cards Row - KPI Cards matching HTML bento style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Sales Card */}
        <div className="bg-white p-6 rounded-xl shadow-[0px_10px_40px_rgba(121,88,0,0.06)] relative overflow-hidden group border border-[#d3c4af]/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl">paid</span>
          </div>
          <div className="relative z-10">
            <p className="text-[#4f4535] text-sm font-semibold uppercase tracking-wider mb-2">Total Sales (MTD)</p>
            <h3 className="font-headline text-3xl font-bold text-[#785600]">
              ₹{formatCurrency(salesData.reduce((sum, s) => sum + s.totalPayable, 0))}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">+12.5%</span>
              <span className="text-[#4f4535]">vs last month</span>
            </div>
          </div>
        </div>

        {/* Total Invoices Card */}
        <div className="bg-white p-6 rounded-xl shadow-[0px_10px_40px_rgba(121,88,0,0.06)] relative overflow-hidden group border border-[#d3c4af]/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl">receipt</span>
          </div>
          <div className="relative z-10">
            <p className="text-[#4f4535] text-sm font-semibold uppercase tracking-wider mb-2">Total Invoices</p>
            <h3 className="font-headline text-3xl font-bold text-[#1a1c1b]">
              {salesData.length}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">+3</span>
              <span className="text-[#4f4535]">this period</span>
            </div>
          </div>
        </div>

        {/* Average Ticket Size Card - Highlight */}
        <div className="bg-gradient-to-br from-[#785600] to-[#986d00] text-white p-6 rounded-xl shadow-[0px_10px_40px_rgba(121,88,0,0.08)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#785600] to-[#986d00] opacity-90"></div>
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-2">Avg. Ticket Size</p>
            <h3 className="font-headline text-3xl font-bold">
              ₹{formatCurrency(salesData.reduce((sum, s) => sum + s.totalPayable, 0) / salesData.length)}
            </h3>
            <p className="mt-4 text-xs text-white/60 italic font-medium">Weighted average per transaction</p>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-20">
            <span className="material-symbols-outlined text-8xl">analytics</span>
          </div>
        </div>
      </div>

      {/* Filters Section - Matching HTML exactly */}
      <div className="bg-[#eeeeec] border border-[#d3c4af]/10 rounded-xl p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#4f4535]/70 text-[10px] font-bold uppercase tracking-wider ml-1">
              Date Range
            </label>
            <div className="bg-white border border-[#d3c4af]/20 rounded-lg flex p-1">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full border-none bg-transparent p-1.5 text-xs focus:ring-0"
              />
              <span className="text-[#817563] flex items-center px-1">→</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full border-none bg-transparent p-1.5 text-xs focus:ring-0"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[#4f4535]/70 text-[10px] font-bold uppercase tracking-wider ml-1">
              Metal
            </label>
            <select
              value={selectedMetal}
              onChange={(e) => setSelectedMetal(e.target.value)}
              className="bg-white border border-[#d3c4af]/20 rounded-lg h-[42px] px-3 py-2 text-xs focus:border-[#785600] focus:ring-[#785600]/20 w-full"
            >
              {metalOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[#4f4535]/70 text-[10px] font-bold uppercase tracking-wider ml-1">
              Client
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Client..."
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="bg-white border border-[#d3c4af]/20 h-[42px] w-full rounded-lg px-3 py-2 pr-8 text-xs focus:border-[#785600] focus:ring-[#785600]/20"
              />
              <span className="material-symbols-outlined text-[#817563]/40 absolute right-2 top-2 text-lg">
                person_search
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[#4f4535]/70 text-[10px] font-bold uppercase tracking-wider ml-1">
              Bill Type
            </label>
            <select
              value={selectedBillType}
              onChange={(e) => setSelectedBillType(e.target.value)}
              className="bg-white border border-[#d3c4af]/20 rounded-lg h-[42px] px-3 py-2 text-xs focus:border-[#785600] focus:ring-[#785600]/20 w-full"
            >
              {billTypeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              {isLoading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Table Header Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="font-headline text-xl font-bold text-[#1a1c1b]">Sales Transaction Ledger</h3>
          <p className="text-[#4f4535] text-xs">
            Displaying {filteredData.length} records for {dateRange.start} to {dateRange.end}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSearchTerm('')}
            className="bg-[#eeeeec] hover:bg-[#e2e3e1] flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-sm">clear_all</span>
            Reset
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#817563] text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search by Bill No, Client Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#d3c4af]/20 rounded-xl focus:ring-2 focus:ring-[#785600]/10 focus:border-[#785600] transition-all text-sm"
          />
        </div>
      </div>

      {/* Data Table - Matching HTML design exactly */}
      <div className="bg-white rounded-xl border border-[#d3c4af]/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#f4f4f2] border-b border-[#d3c4af]/10">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4f4535]">Invoice Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4f4535]">Bill #</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4f4535]">Client Name</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#4f4535]">Metal Detail</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-[#4f4535]">Net Wt (g)</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-[#4f4535]">Rate (₹)</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-[#4f4535]">Taxable Val</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-[#4f4535]">Total Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f2]">
              {currentData.map((item) => (
                <tr key={item.id} className="hover:bg-[#fef9ef] transition-colors cursor-pointer group">
                  <td className="px-6 py-4 text-xs font-medium text-[#1a1c1b]">{item.invoiceDate}</td>
                  <td className="px-6 py-4 text-xs font-bold text-[#785600]">{item.billNo}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#1a1c1b]">{item.clientName}</span>
                      <span className="text-[#4f4535]/60 text-[10px]">{item.gstNo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#1a1c1b]">{item.metalDetail}</td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-[#1a1c1b]">{item.netWeight.toFixed(3)}</td>
                  <td className="px-6 py-4 text-right text-xs text-[#4f4535]">₹{item.rate.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-xs text-[#4f4535]">₹{item.taxableValue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-[#785600]">₹{item.totalPayable.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#785600]/20 bg-[#785600]/5">
                  <td className="px-6 py-4 text-xs font-bold text-[#785600]" colSpan={4}>
                    SUB-TOTAL (PAGE)
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-extrabold text-[#1a1c1b]">
                    {totalNetWeight.toFixed(3)}
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-right text-xs font-extrabold text-[#1a1c1b]">
                    ₹{totalTaxableValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-extrabold text-[#785600]">
                    ₹{totalPayable.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination - Matching HTML exactly */}
        {filteredData.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-[#d3c4af]/10 bg-[#f4f4f2]/30">
            <p className="text-[#4f4535] text-xs">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} results
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d3c4af]/30 hover:bg-[#eeeeec] transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#785600] text-white shadow-sm'
                        : 'border border-[#d3c4af]/30 hover:bg-[#eeeeec] text-[#4f4535]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="px-2 text-[#4f4535] text-xs">...</span>}
              {totalPages > 5 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d3c4af]/30 hover:bg-[#eeeeec] text-xs font-medium"
                >
                  {totalPages}
                </button>
              )}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d3c4af]/30 hover:bg-[#eeeeec] transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Optional Insights Section (matching HTML secondary area) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-[#d3c4af]/10 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-headline text-lg font-bold text-[#1a1c1b]">Sales by Metal Type</h4>
            <span className="material-symbols-outlined text-[#4f4535]">pie_chart</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#785600]"></span>
                <span className="text-sm">Gold Sales</span>
              </div>
              <span className="text-sm font-bold">
                ₹{formatCurrency(salesData.filter(s => s.metalDetail.includes('Gold')).reduce((sum, s) => sum + s.totalPayable, 0))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#986d00]"></span>
                <span className="text-sm">Silver Sales</span>
              </div>
              <span className="text-sm font-bold">
                ₹{formatCurrency(salesData.filter(s => s.metalDetail.includes('Silver')).reduce((sum, s) => sum + s.totalPayable, 0))}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#d3c4af]/10 shadow-sm">
          <h4 className="font-headline text-lg font-bold mb-4 text-[#1a1c1b]">Recent Activity</h4>
          <div className="space-y-3">
            <div className="flex gap-3 text-sm">
              <span className="text-[#785600] font-bold">✓</span>
              <span className="text-[#4f4535]">Highest sale: {salesData.reduce((max, s) => s.totalPayable > max.totalPayable ? s : max, salesData[0]).clientName}</span>
            </div>
            <div className="flex gap-3 text-sm">
              <span className="text-[#785600] font-bold">📊</span>
              <span className="text-[#4f4535]">Average daily sales: ₹{formatCurrency(salesData.reduce((sum, s) => sum + s.totalPayable, 0) / 7)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SalesReport;