// DisplayBill.tsx - Fixed Client column with proper alignment
import {useGetSalesData} from '@/components/Billing/billapi';
import GenericTable, {Column} from '@/components/Forms/Table/GenericTable';
import React, {useState} from 'react';
import PageHeader from '../Forms/Common/PageHeader';

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

interface DisplayBillProps {
  hideHeader?: boolean;
}

const DisplayBill: React.FC<DisplayBillProps> = ({hideHeader = false}) => {
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Get sales data from API
  const {data: salesDataResponse, isLoading: isDataLoading} = useGetSalesData();

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

  // Handlers
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
    a.download = `bills_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedClient('');
    setSelectedTransactionType('All');
    setSelectedBillingMode('All');
    setSelectedPaymentMode('All');
    setDateRange({
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0],
      end: new Date().toISOString().split('T')[0],
    });
  };

  // Define table columns with proper styling
  const columns: Column<SaleRecord>[] = [
    {
      header: 'Invoice Date',
      accessor: (item) => formatDate(item.createdAt),
      sortable: true,
      align: 'left',
    },
    {
      header: 'Client Details',
      accessor: (item) => item.client?.fullname || 'N/A',
      sortable: true,
      align: 'left',
      render: (item) => {
        const clientName = item.client?.fullname || 'N/A';
        const phoneNumber = item.client?.phoneNumber || 'N/A';
        return (
          <div>
            <div className="font-semibold text-[#1a1c1b]">{clientName}</div>
            <div className="text-xs text-[#4f4535]">{phoneNumber}</div>
          </div>
        );
      },
    },
    {
      header: 'Billing',
      accessor: (item) => (item.billingMode === 'GST_BILL' ? 'GST' : 'Cash'),
      sortable: true,
      align: 'center',
      render: (item) => (
        <div className="flex justify-center">
          <span
            className={`inline-flex min-w-[50px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-bold ${
              item.billingMode === 'GST_BILL'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {item.billingMode === 'GST_BILL' ? 'GST' : 'Cash'}
          </span>
        </div>
      ),
    },
    {
      header: 'Sub Total',
      accessor: (item) => item.subTotal,
      sortable: true,
      align: 'right',
      render: (item) => (
        <div className="text-right">₹{formatCurrency(item.subTotal)}</div>
      ),
    },
    {
      header: 'Making Fees',
      accessor: (item) => item.makingFees,
      sortable: true,
      align: 'right',
      render: (item) => (
        <div className="text-right">₹{formatCurrency(item.makingFees)}</div>
      ),
    },
    {
      header: 'GST',
      accessor: (item) => item.totalTax,
      sortable: true,
      align: 'right',
      render: (item) => (
        <div className="text-right">₹{formatCurrency(item.totalTax)}</div>
      ),
    },
    {
      header: 'Discount',
      accessor: (item) => item.discount,
      sortable: true,
      align: 'right',
      render: (item) => (
        <div className="text-right text-red-600">
          -₹{formatCurrency(item.discount)}
        </div>
      ),
    },
    {
      header: 'Exchange',
      accessor: (item) => item.exchangeValue,
      sortable: true,
      align: 'right',
      render: (item) => (
        <div className="text-right">-₹{formatCurrency(item.exchangeValue)}</div>
      ),
    },
    {
      header: 'Net Payable',
      accessor: (item) => item.netPayable,
      sortable: true,
      align: 'right',
      render: (item) => (
        <div className="text-right font-bold text-[#785600]">
          ₹{formatCurrency(item.netPayable)}
        </div>
      ),
    },
    {
      header: 'Balance',
      accessor: (item) => item.balanceDue,
      sortable: true,
      align: 'right',
      render: (item) => (
        <div className="text-right font-bold text-[#ba1a1a]">
          ₹{formatCurrency(item.balanceDue)}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f9f9f7]">
      {/* Header Section - Only show if hideHeader is false */}
      {!hideHeader && (
        <div>
          <div className="">
            <div>
              <PageHeader
                title="Sales Bills"
                subtitle="View and manage all sales transactions"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Toggle Button */}
      <div className="mt-3 px-4 md:hidden">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#eeeeec] py-2.5 text-xs font-bold text-[#4f4535]"
        >
          <span className="material-symbols-outlined text-sm">filter_list</span>
          {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters Section */}
      <div
        className={`mt-3 px-4 transition-all duration-300 ${mobileFiltersOpen ? 'block' : 'hidden md:block'}`}
      >
        <div className="rounded-xl border border-[#d3c4af]/10 bg-[#eeeeec] p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
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
          </div>
        </div>
      </div>

      {/* Search and Reset */}
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

      {/* Results Count */}
      <div className="mt-4 px-4">
        <p className="text-xs text-[#4f4535]">
          Showing {filteredData.length} record
          {filteredData.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Generic Table */}
      <div className="mt-3 px-4 pb-8">
        <GenericTable
          data={sortedData}
          columns={columns}
          itemsPerPage={10}
          searchable={false}
          loading={isDataLoading}
          emptyMessage="No bills found for the selected filters"
          paginationOff={false}
        />
      </div>

      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
          font-size: 20px;
        }
      `}</style>
    </div>
  );
};

export default DisplayBill;
