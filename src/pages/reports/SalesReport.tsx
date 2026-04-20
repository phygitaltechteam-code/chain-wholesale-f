// SalesReport.tsx - Fully Responsive for all screen sizes
import {useGetSalesData} from '@/components/Billing/billapi';
import GenericTable, {Column} from '@/components/Forms/Table/GenericTable';
import React, {useState} from 'react';

// Sale Record Type Definition based on API response
interface SaleRecord {
  id: string;
  createdAt: string;
  transactionType: string;
  billingMode: string;
  paymentMode: string;
  subTotal: number;
  makingFees: number;
  hsnCode: string;
  gstPercentage: number;
  totalTax: number;
  discount: number;
  exchangeValue: number;
  previousBalance: number;
  netPayable: number;
  cashPaid: number;
  balanceDue: number;
  client: {
    id: string;
    fullname: string;
    phoneNumber: string;
    city?: string;
    GST?: string;
    PAN?: string;
  };
  items?: Array<{
    metalName: string;
    weight: number;
    rate: number;
    amount: number;
  }>;
}

// Filter Options
const transactionTypeOptions = ['All', 'SELL', 'BUY'];
const billingModeOptions = ['All', 'CASH_BILL', 'GST_BILL'];
const paymentModeOptions = ['All', 'CASH_UPI', 'EXCHANGE', 'SPLIT'];

// Helper for number formatting
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
};

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const SalesReport: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTransactionType, setSelectedTransactionType] = useState('All');
  const [selectedBillingMode, setSelectedBillingMode] = useState('All');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Get sales data from API
  const {
    data: salesDataResponse,
    isLoading: isDataLoading,
    refetch,
  } = useGetSalesData();

  // Extract data array from response
  const salesData: SaleRecord[] = salesDataResponse || [];

  // Filter Logic
  const filteredData = salesData.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.client?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client?.phoneNumber?.includes(searchTerm);

    const matchesClient =
      selectedClient === '' ||
      item.client?.fullname
        ?.toLowerCase()
        .includes(selectedClient.toLowerCase());

    const matchesTransactionType =
      selectedTransactionType === 'All' ||
      item.transactionType === selectedTransactionType;

    const matchesBillingMode =
      selectedBillingMode === 'All' || item.billingMode === selectedBillingMode;

    const matchesPaymentMode =
      selectedPaymentMode === 'All' || item.paymentMode === selectedPaymentMode;

    const itemDate = new Date(item.createdAt);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59);
    const matchesDate = itemDate >= startDate && itemDate <= endDate;

    return (
      matchesSearch &&
      matchesClient &&
      matchesTransactionType &&
      matchesBillingMode &&
      matchesPaymentMode &&
      matchesDate
    );
  });

  // Sort by date descending (newest first)
  const sortedData = [...filteredData].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Overall totals
  const overallTotalSales = salesData.reduce(
    (sum, item) => sum + item.netPayable,
    0,
  );
  const overallTotalInvoices = salesData.length;
  const averageTicketSize =
    overallTotalInvoices > 0 ? overallTotalSales / overallTotalInvoices : 0;
  const totalDiscount = salesData.reduce((sum, item) => sum + item.discount, 0);
  const totalGST = salesData.reduce((sum, item) => sum + item.totalTax, 0);

  // Get unique clients for filter dropdown
  const uniqueClients = [
    ...new Map(
      salesData.map((item) => [item.client?.id, item.client?.fullname]),
    ).entries(),
  ]
    .filter(([_, name]) => name)
    .map(([id, name]) => ({id, name}));

  // Handlers
  const handleGenerate = async () => {
    setIsGenerating(true);
    await refetch();
    setIsGenerating(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'Invoice Date',
      'Client Name',
      'Phone',
      'Transaction Type',
      'Billing Mode',
      'Payment Mode',
      'Sub Total',
      'Making Fees',
      'GST',
      'Discount',
      'Exchange Value',
      'Net Payable',
      'Cash Paid',
      'Balance Due',
    ];

    const csvData = filteredData.map((item) => [
      formatDate(item.createdAt),
      item.client?.fullname || 'N/A',
      item.client?.phoneNumber || 'N/A',
      item.transactionType,
      item.billingMode,
      item.paymentMode,
      item.subTotal,
      item.makingFees,
      item.totalTax,
      item.discount,
      item.exchangeValue,
      item.netPayable,
      item.cashPaid,
      item.balanceDue,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csvContent], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedClient('');
    setSelectedTransactionType('All');
    setSelectedBillingMode('All');
    setSelectedPaymentMode('All');
  };

  // Define table columns for GenericTable
  const columns: Column<SaleRecord>[] = [
    {
      header: 'Invoice Date',
      accessor: (item) => formatDate(item.createdAt),
      sortable: true,
      align: 'left',
      className: 'font-medium',
    },
    {
      header: 'Client Name',
      accessor: (item) => item.client?.fullname || 'N/A',
      sortable: true,
      align: 'left',
    },
    {
      header: 'Phone',
      accessor: (item) => item.client?.phoneNumber || 'N/A',
      sortable: true,
      align: 'left',
    },
    {
      header: 'Type',
      accessor: (item) => item.transactionType,
      sortable: true,
      align: 'center',
    },
    {
      header: 'Billing',
      accessor: (item) => (item.billingMode === 'GST_BILL' ? 'GST' : 'Cash'),
      sortable: true,
      align: 'center',
    },
    {
      header: 'Sub Total',
      accessor: (item) => item.subTotal,
      sortable: true,
      align: 'right',
      render: (item) => `₹${formatCurrency(item.subTotal)}`,
    },
    {
      header: 'Making Fees',
      accessor: (item) => item.makingFees,
      sortable: true,
      align: 'right',
      render: (item) => `₹${formatCurrency(item.makingFees)}`,
    },
    {
      header: 'GST',
      accessor: (item) => item.totalTax,
      sortable: true,
      align: 'right',
      render: (item) => `₹${formatCurrency(item.totalTax)}`,
    },
    {
      header: 'Discount',
      accessor: (item) => item.discount,
      sortable: true,
      align: 'right',
      render: (item) => `-₹${formatCurrency(item.discount)}`,
    },
    {
      header: 'Exchange',
      accessor: (item) => item.exchangeValue,
      sortable: true,
      align: 'right',
      render: (item) => `-₹${formatCurrency(item.exchangeValue)}`,
    },
    {
      header: 'Net Payable',
      accessor: (item) => item.netPayable,
      sortable: true,
      align: 'right',
      render: (item) => `₹${formatCurrency(item.netPayable)}`,
    },
    {
      header: 'Balance',
      accessor: (item) => item.balanceDue,
      sortable: true,
      align: 'right',
      render: (item) => `₹${formatCurrency(item.balanceDue)}`,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f9f9f7]">
      {/* Header Section - Responsive */}
      <div className="px-4 py-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#785600]">
              <span className="material-symbols-outlined text-base">
                receipt_long
              </span>
              <span className="text-xs uppercase tracking-wider">
                Sales Analysis
              </span>
            </div>
            <h2 className="font-headline text-2xl font-bold tracking-tight text-[#1a1c1b] md:text-3xl lg:text-4xl">
              Sales Ledger & Report
            </h2>
            <p className="text-xs text-[#4f4535] md:text-sm">
              Real-time sales performance and transaction summary
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-full border border-[#d3c4af]/30 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#eeeeec] md:gap-2 md:px-4 md:py-2"
            >
              <span className="material-symbols-outlined text-sm md:text-base">
                print
              </span>
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 rounded-full bg-[#785600] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#5d4200] md:gap-2 md:px-4 md:py-2"
            >
              <span className="material-symbols-outlined text-sm md:text-base">
                download
              </span>
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Responsive */}
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 md:grid-cols-3 md:gap-4 lg:gap-6">
        {/* Total Sales Card */}
        <div className="relative overflow-hidden rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm md:p-5 lg:p-6">
          <div className="absolute right-0 top-0 p-2 opacity-10 md:p-3 lg:p-4">
            <span className="material-symbols-outlined text-4xl md:text-5xl lg:text-6xl">
              paid
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4f4535] md:text-xs">
              Total Sales
            </p>
            <h3 className="text-xl font-bold text-[#785600] md:text-2xl lg:text-3xl">
              ₹{formatCurrency(overallTotalSales)}
            </h3>
            <div className="mt-2 flex items-center gap-2 text-[10px] md:mt-3 md:text-xs">
              <span className="rounded-full bg-green-50 px-2 py-0.5 font-bold text-green-600">
                {salesData.length} Invoices
              </span>
            </div>
          </div>
        </div>

        {/* Total Invoices Card */}
        <div className="relative overflow-hidden rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm md:p-5 lg:p-6">
          <div className="absolute right-0 top-0 p-2 opacity-10 md:p-3 lg:p-4">
            <span className="material-symbols-outlined text-4xl md:text-5xl lg:text-6xl">
              receipt
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4f4535] md:text-xs">
              Total Invoices
            </p>
            <h3 className="text-xl font-bold text-[#1a1c1b] md:text-2xl lg:text-3xl">
              {overallTotalInvoices}
            </h3>
            <div className="mt-2 flex items-center gap-2 text-[10px] md:mt-3 md:text-xs">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 font-bold text-blue-600">
                {filteredData.length} filtered
              </span>
            </div>
          </div>
        </div>

        {/* Average Ticket Size Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#785600] to-[#986d00] p-4 text-white shadow-sm sm:col-span-2 md:col-span-1 md:p-5 lg:p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-[#785600] to-[#986d00] opacity-90"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70 md:text-xs">
              Avg. Ticket Size
            </p>
            <h3 className="text-xl font-bold md:text-2xl lg:text-3xl">
              ₹{formatCurrency(averageTicketSize)}
            </h3>
            <p className="mt-2 text-[10px] font-medium italic text-white/60 md:mt-3">
              Weighted average per transaction
            </p>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-20">
            <span className="material-symbols-outlined text-6xl md:text-7xl lg:text-8xl">
              analytics
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className="mt-4 px-4 md:hidden">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#eeeeec] py-2 text-xs font-bold text-[#4f4535]"
        >
          <span className="material-symbols-outlined text-sm">filter_list</span>
          {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters Section - Responsive */}
      <div
        className={`mt-4 px-4 transition-all duration-300 ${mobileFiltersOpen ? 'block' : 'hidden md:block'}`}
      >
        <div className="rounded-xl border border-[#d3c4af]/10 bg-[#eeeeec] p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#4f4535]/70">
                Date Range
              </label>
              <div className="flex rounded-lg border border-[#d3c4af]/20 bg-white p-1">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({...dateRange, start: e.target.value})
                  }
                  className="w-full border-none bg-transparent p-1.5 text-xs focus:ring-0"
                />
                <span className="flex items-center px-1 text-xs text-[#817563]">
                  →
                </span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({...dateRange, end: e.target.value})
                  }
                  className="w-full border-none bg-transparent p-1.5 text-xs focus:ring-0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#4f4535]/70">
                Transaction Type
              </label>
              <select
                value={selectedTransactionType}
                onChange={(e) => setSelectedTransactionType(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#d3c4af]/20 bg-white px-3 py-2 text-xs focus:border-[#785600] focus:ring-[#785600]/20"
              >
                {transactionTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#4f4535]/70">
                Billing Mode
              </label>
              <select
                value={selectedBillingMode}
                onChange={(e) => setSelectedBillingMode(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#d3c4af]/20 bg-white px-3 py-2 text-xs focus:border-[#785600] focus:ring-[#785600]/20"
              >
                {billingModeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#4f4535]/70">
                Payment Mode
              </label>
              <select
                value={selectedPaymentMode}
                onChange={(e) => setSelectedPaymentMode(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#d3c4af]/20 bg-white px-3 py-2 text-xs focus:border-[#785600] focus:ring-[#785600]/20"
              >
                {paymentModeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || isDataLoading}
                className="flex flex-1 items-center justify-center gap-1 rounded-full bg-gradient-to-br from-[#785600] to-[#986d00] px-3 py-2 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">
                  refresh
                </span>
                {isGenerating || isDataLoading ? 'Loading...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Reset - Responsive */}
      <div className="mt-4 px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#817563]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by Client Name or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[#d3c4af]/20 bg-white py-2.5 pl-10 pr-3 text-sm transition-all focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 md:py-3"
            />
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#eeeeec] px-3 py-2 text-xs font-bold transition-colors hover:bg-[#e2e3e1]"
          >
            <span className="material-symbols-outlined text-sm">clear_all</span>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Generic Table - Responsive */}
      <div className="mt-4 px-4 pb-8">
        <GenericTable
          data={sortedData}
          columns={columns}
          itemsPerPage={10}
          searchable={false}
          loading={isDataLoading}
          emptyMessage="No sales records found for the selected filters"
          paginationOff={false}
        />
      </div>
    </div>
  );
};

export default SalesReport;
