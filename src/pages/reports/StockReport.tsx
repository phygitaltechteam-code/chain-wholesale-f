// StockReport.tsx - Stock Movement & Inventory Report matching HTML design exactly
import React, {useState} from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {FaSync} from 'react-icons/fa';
import {MdVerifiedUser} from 'react-icons/md';
import GenericTable, {Column} from '@/components/Forms/Table/GenericTable';

interface StockTransaction {
  id: string;
  date: string;
  transactionType:
    | 'Purchase'
    | 'Sales'
    | 'Internal Transfer'
    | 'Karigar Return';
  metal: string;
  purity: string;
  batchRef: string;
  grossWeight: number;
  fineWeight: number;
  rate: number;
  stockValue: number;
  isLowStock?: boolean;
}

const stockData: StockTransaction[] = [
  {
    id: '1',
    date: 'Oct 24, 2023',
    transactionType: 'Purchase',
    metal: 'Gold (24K)',
    purity: '999.9 Purity',
    batchRef: '#G-24K-8812',
    grossWeight: 500.0,
    fineWeight: 499.95,
    rate: 6245,
    stockValue: 3122187,
  },
  {
    id: '2',
    date: 'Oct 23, 2023',
    transactionType: 'Sales',
    metal: 'Silver (999)',
    purity: '999 Purity',
    batchRef: '#S-999-4401',
    grossWeight: 15000.0,
    fineWeight: 14985.0,
    rate: 74.2,
    stockValue: 1111887,
    isLowStock: true,
  },
  {
    id: '3',
    date: 'Oct 22, 2023',
    transactionType: 'Internal Transfer',
    metal: 'Gold (22K)',
    purity: 'KDM Hallmark',
    batchRef: '#G-22K-1102',
    grossWeight: 120.5,
    fineWeight: 110.45,
    rate: 5780,
    stockValue: 638401,
  },
  {
    id: '4',
    date: 'Oct 22, 2023',
    transactionType: 'Karigar Return',
    metal: 'Gold (22K)',
    purity: 'Antique Finished',
    batchRef: '#G-22K-5521',
    grossWeight: 45.2,
    fineWeight: 41.4,
    rate: 5780,
    stockValue: 239292,
  },
  {
    id: '5',
    date: 'Oct 21, 2023',
    transactionType: 'Purchase',
    metal: 'Gold (22K)',
    purity: '916 Hallmark',
    batchRef: '#G-22K-8810',
    grossWeight: 250.0,
    fineWeight: 229.0,
    rate: 5780,
    stockValue: 1323620,
  },
  {
    id: '6',
    date: 'Oct 20, 2023',
    transactionType: 'Sales',
    metal: 'Gold (24K)',
    purity: '999.9 Purity',
    batchRef: '#G-24K-4399',
    grossWeight: 75.5,
    fineWeight: 75.45,
    rate: 6245,
    stockValue: 471192,
  },
];

const metalOptions = [
  {value: 'all', label: 'All Metals'},
  {value: 'gold_24k', label: 'Gold (24K)'},
  {value: 'gold_22k', label: 'Gold (22K)'},
  {value: 'silver', label: 'Silver (999)'},
];

const dateRangeOptions = [
  {value: '30days', label: 'Last 30 Days'},
  {value: 'quarter', label: 'This Quarter'},
  {value: 'year', label: 'Financial Year'},
  {value: 'custom', label: 'Custom Range'},
];

export default function StockReport() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetal, setSelectedMetal] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('30days');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 5;

  // Filter data based on search and metal
  const filteredData = stockData.filter((item) => {
    const matchesSearch =
      item.batchRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.metal.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMetal =
      selectedMetal === 'all' ||
      (selectedMetal === 'gold_24k' && item.metal === 'Gold (24K)') ||
      (selectedMetal === 'gold_22k' && item.metal === 'Gold (22K)') ||
      (selectedMetal === 'silver' && item.metal === 'Silver (999)');

    return matchesSearch && matchesMetal;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Calculate totals
  const totalGrossWeight = currentData.reduce(
    (sum, item) => sum + item.grossWeight,
    0,
  );
  const totalFineWeight = currentData.reduce(
    (sum, item) => sum + item.fineWeight,
    0,
  );
  const totalStockValue = currentData.reduce(
    (sum, item) => sum + item.stockValue,
    0,
  );

  // Summary stats
  const totalGoldStock = 4852.45;
  const totalSilverStock = 114.2;
  const totalInventoryValue = 34285200;

  const getTransactionIcon = (type: StockTransaction['transactionType']) => {
    switch (type) {
      case 'Purchase':
        return <ArrowDownRight className="h-4 w-4 text-green-700" />;
      case 'Sales':
        return <ArrowUpRight className="h-4 w-4 text-amber-700" />;
      case 'Internal Transfer':
        return <FaSync className="text-on-surface-variant h-4 w-4" />;
      case 'Karigar Return':
        return <ArrowDownRight className="h-4 w-4 text-green-700" />;
      default:
        return null;
    }
  };

  const getTransactionColor = (type: StockTransaction['transactionType']) => {
    switch (type) {
      case 'Purchase':
        return 'text-green-700';
      case 'Sales':
        return 'text-amber-700';
      case 'Internal Transfer':
        return 'text-on-surface-variant';
      case 'Karigar Return':
        return 'text-green-700';
      default:
        return '';
    }
  };

  const getTransactionLabel = (type: StockTransaction['transactionType']) => {
    switch (type) {
      case 'Purchase':
        return 'Purchase (In)';
      case 'Sales':
        return 'Sales (Out)';
      case 'Internal Transfer':
        return 'Internal Transfer';
      case 'Karigar Return':
        return 'Karigar Return (In)';
      default:
        return type;
    }
  };

  // Table columns matching HTML design
  const columns: Column<StockTransaction>[] = [
    {
      header: 'Date',
      accessor: 'date',
      align: 'left',
      render: (item) => (
        <span className="text-on-surface-variant text-sm font-medium">
          {item.date}
        </span>
      ),
    },
    {
      header: 'Transaction',
      accessor: 'transactionType',
      align: 'left',
      render: (item) => (
        <span
          className={`flex items-center gap-2 text-sm font-bold ${getTransactionColor(item.transactionType)}`}
        >
          {getTransactionIcon(item.transactionType)}
          {getTransactionLabel(item.transactionType)}
        </span>
      ),
    },
    {
      header: 'Metal',
      accessor: 'metal',
      align: 'left',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold">{item.metal}</span>
          <div className="flex items-center gap-1">
            <span className="text-on-surface-variant text-[10px]">
              {item.purity}
            </span>
            {item.isLowStock && (
              <span className="text-error flex items-center gap-0.5 text-[10px] font-bold">
                <AlertCircle className="h-3 w-3" />
                LOW STOCK
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Batch Ref',
      accessor: 'batchRef',
      align: 'left',
      render: (item) => (
        <span className="bg-surface-container font-mono text-on-surface-variant rounded px-2 py-1 text-xs">
          {item.batchRef}
        </span>
      ),
    },
    {
      header: 'Gross Wt.',
      accessor: 'grossWeight',
      align: 'right',
      render: (item) => (
        <span className="text-sm font-bold">
          {item.grossWeight.toFixed(2)}g
        </span>
      ),
    },
    {
      header: 'Fine Wt.',
      accessor: 'fineWeight',
      align: 'right',
      render: (item) => (
        <span className="text-sm font-bold">{item.fineWeight.toFixed(2)}g</span>
      ),
    },
    {
      header: 'Rate',
      accessor: 'rate',
      align: 'right',
      render: (item) => (
        <span className="text-on-surface-variant text-sm">
          ₹{item.rate.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Stock Value',
      accessor: 'stockValue',
      align: 'right',
      render: (item) => (
        <span className="text-sm font-bold text-primary">
          ₹{item.stockValue.toLocaleString()}
        </span>
      ),
    },
  ];

  const handleGenerate = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Generating stock report...');
    setIsLoading(false);
  };

  const handleExportCSV = () => {
    console.log('Exporting to CSV...');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-headline text-on-surface text-4xl font-bold tracking-tight">
              Stock Movement & Inventory
            </h2>
            <p className="text-on-surface-variant mt-2 font-medium">
              Real-time valuation and logistics of precious metal holdings.
            </p>
          </div>
          <div className="bg-surface-container-low flex items-center gap-4 rounded-lg p-2">
            <div className="border-outline-variant/20 flex flex-col border-r px-4">
              <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                Last Updated
              </span>
              <span className="text-sm font-bold">14:32 PM, Today</span>
            </div>
            <button
              onClick={handleGenerate}
              className="hover:bg-surface-container rounded-full p-2 text-primary transition-colors"
            >
              <RefreshCw
                className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Summary Cards: Bento Style - Matching HTML exactly */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Total Gold Stock */}
          <div className="bg-surface-container-lowest border-outline-variant/5 group relative overflow-hidden rounded-xl border p-6 shadow-[0px_10px_40px_rgba(121,88,0,0.06)]">
            <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
              <span className="material-symbols-outlined text-6xl">
                conversion_path
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-on-surface-variant mb-2 text-sm font-semibold uppercase tracking-wider">
                Total Gold Stock
              </p>
              <h3 className="font-headline text-3xl font-bold text-primary">
                {totalGoldStock.toFixed(2)}{' '}
                <span className="text-on-surface-variant text-lg font-normal">
                  g
                </span>
              </h3>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-green-50 px-2 py-0.5 font-bold text-green-600">
                  +2.4%
                </span>
                <span className="text-on-surface-variant">vs last month</span>
              </div>
            </div>
          </div>

          {/* Total Silver Stock */}
          <div className="bg-surface-container-lowest border-outline-variant/5 group relative overflow-hidden rounded-xl border p-6 shadow-[0px_10px_40px_rgba(121,88,0,0.06)]">
            <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
              <span className="material-symbols-outlined text-6xl">layers</span>
            </div>
            <div className="relative z-10">
              <p className="text-on-surface-variant mb-2 text-sm font-semibold uppercase tracking-wider">
                Total Silver Stock
              </p>
              <h3 className="font-headline text-on-surface text-3xl font-bold">
                {totalSilverStock.toFixed(2)}{' '}
                <span className="text-on-surface-variant text-lg font-normal">
                  kg
                </span>
              </h3>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-600">
                  -0.8%
                </span>
                <span className="text-on-surface-variant">vs last month</span>
              </div>
            </div>
          </div>

          {/* Inventory Value */}
          <div className="group relative overflow-hidden rounded-xl bg-primary p-6 text-white">
            <div className="to-primary-container absolute inset-0 bg-gradient-to-br from-primary opacity-90"></div>
            <div className="absolute -bottom-4 -right-4 opacity-20">
              <span className="material-symbols-outlined text-8xl">
                account_balance
              </span>
            </div>
            <div className="relative z-10">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/70">
                Inventory Value (₹)
              </p>
              <h3 className="font-headline text-3xl font-bold">
                ₹{totalInventoryValue.toLocaleString()}
              </h3>
              <p className="mt-4 text-xs italic text-white/60">
                Estimated at current live market rates
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Search Bar - Matching HTML exactly */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[300px] flex-1">
            <Search className="text-on-surface-variant absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Batch Ref or Transaction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-container-lowest border-outline-variant/20 placeholder:text-on-surface-variant/50 w-full rounded-lg py-3 pl-12 pr-4 transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedMetal}
              onChange={(e) => setSelectedMetal(e.target.value)}
              className="bg-surface-container-lowest border-outline-variant/20 cursor-pointer rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-primary/10"
            >
              {metalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="bg-surface-container-lowest border-outline-variant/20 cursor-pointer rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-primary/10"
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="bg-surface-container-highest hover:bg-surface-container rounded-lg p-3 transition-colors">
              <span className="material-symbols-outlined">tune</span>
            </button>
          </div>
        </div>

        {/* Table: Stock Ledger - Using GenericTable */}
        <div className="bg-surface-container-lowest border-outline-variant/10 overflow-hidden rounded-xl border shadow-[0px_10px_40px_rgba(121,88,0,0.04)]">
          <GenericTable
            data={currentData}
            columns={columns}
            title=""
            searchable={false}
            itemsPerPage={5}
            paginationOff={true}
          />

          {/* Table Footer with Totals and Pagination */}
          {filteredData.length > 0 && (
            <div className="bg-surface-container-low border-outline-variant/10 border-t px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6">
                  <p className="text-on-surface-variant text-xs font-medium">
                    Showing {indexOfFirstItem + 1} to{' '}
                    {Math.min(indexOfLastItem, filteredData.length)} of{' '}
                    {filteredData.length} transactions
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-on-surface-variant font-medium">
                      Totals:
                    </span>
                    <span className="font-bold">
                      Gross: {totalGrossWeight.toFixed(2)}g
                    </span>
                    <span className="font-bold">
                      Fine: {totalFineWeight.toFixed(2)}g
                    </span>
                    <span className="font-bold text-primary">
                      Value: ₹{totalStockValue.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="border-outline-variant/30 hover:bg-surface-container rounded border px-3 py-1 text-xs transition-colors disabled:opacity-30"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`rounded border px-3 py-1 text-xs transition-colors ${
                          currentPage === pageNumber
                            ? 'border-primary bg-primary/5 font-bold text-primary'
                            : 'border-outline-variant/30 hover:bg-surface-container'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <span className="px-3 py-1 text-xs">...</span>
                  )}
                  {totalPages > 5 && (
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="border-outline-variant/30 hover:bg-surface-container rounded border px-3 py-1 text-xs transition-colors"
                    >
                      {totalPages}
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="border-outline-variant/30 hover:bg-surface-container rounded border px-3 py-1 text-xs transition-colors disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Insights Area - Matching HTML exactly */}
        <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Stock Composition Chart Placeholder */}
          <div className="bg-surface-container-low border-outline-variant/5 rounded-2xl border p-8">
            <div className="mb-6 flex items-start justify-between">
              <h4 className="font-headline text-xl font-bold">
                Inventory Composition
              </h4>
              <PieChart className="text-on-surface-variant h-5 w-5" />
            </div>
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-12">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-[12px] border-primary">
                <div className="border-on-surface/10 absolute inset-0 -rotate-45 rounded-full border-[12px] border-t-transparent"></div>
                <div className="text-center">
                  <span className="block text-2xl font-bold">82%</span>
                  <span className="text-on-surface-variant text-[10px] font-bold uppercase">
                    Gold Heavy
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-primary"></span>
                  <span className="text-sm font-medium">Gold 24K (45.2%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-primary/60"></span>
                  <span className="text-sm font-medium">Gold 22K (36.8%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-on-surface/20 h-3 w-3 rounded-full"></span>
                  <span className="text-sm font-medium">
                    Silver 999 (18.0%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Notifications / Warnings - Matching HTML exactly */}
          <div className="bg-surface-container-lowest border-outline-variant/5 rounded-2xl border p-8 shadow-[0px_10px_40px_rgba(121,88,0,0.04)]">
            <h4 className="font-headline mb-6 text-xl font-bold">
              Stock Alerts
            </h4>
            <div className="space-y-4">
              <div className="border-error/10 bg-error-container/20 flex gap-4 rounded-xl border p-4">
                <AlertCircle className="text-error h-5 w-5" />
                <div>
                  <p className="text-on-error-container text-sm font-bold">
                    Critical Low: Silver (999)
                  </p>
                  <p className="text-on-error-container/70 mt-1 text-xs">
                    Current stock is below 15,000g threshold. Immediate purchase
                    recommended.
                  </p>
                </div>
              </div>
              <div className="border-outline-variant/10 bg-surface-container-low flex gap-4 rounded-xl border p-4">
                <span className="material-symbols-outlined text-primary">
                  inventory
                </span>
                <div>
                  <p className="text-sm font-bold">Large Inflow Detected</p>
                  <p className="text-on-surface-variant mt-1 text-xs">
                    Batch #G-24K-8812 (500g) successfully verified and added to
                    vault.
                  </p>
                </div>
              </div>
              <div className="border-outline-variant/10 bg-surface-container-low flex gap-4 rounded-xl border p-4">
                <MdVerifiedUser className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm font-bold">Quarterly Audit Due</p>
                  <p className="text-on-surface-variant mt-1 text-xs">
                    Next inventory physical verification scheduled for November
                    1st.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions for Export - Matching HTML exactly */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handlePrint}
            className="border-outline-variant/30 hover:bg-surface-container flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print View
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Export All
          </button>
        </div>
      </div>

      {/* Floating Action Button - Matching HTML exactly */}
      <button className="group fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-transform hover:scale-105">
        <Plus className="h-6 w-6" />
        <span className="bg-on-surface absolute right-full mr-4 whitespace-nowrap rounded px-3 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          New Entry
        </span>
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          display: inline-block;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}
