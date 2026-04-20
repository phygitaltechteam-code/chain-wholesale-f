import React, {useState} from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Printer,
  AlertCircle,
  Plus,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {FaSync} from 'react-icons/fa';
import {MdVerifiedUser} from 'react-icons/md';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';

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
  const [isLoading, setIsLoading] = useState(false);

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

  // Calculate totals
  const totalGrossWeight = filteredData.reduce(
    (sum, item) => sum + item.grossWeight,
    0,
  );
  const totalFineWeight = filteredData.reduce(
    (sum, item) => sum + item.fineWeight,
    0,
  );
  const totalStockValue = filteredData.reduce(
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
        return <FaSync className="h-4 w-4 text-[#5E5B56]" />;
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
        return 'text-[#5E5B56]';
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

  // Table columns matching the design
  const columns: Column<StockTransaction>[] = [
    {
      header: 'Date',
      accessor: (item) => (
        <span className="text-sm font-medium text-[#5E5B56]">{item.date}</span>
      ),
      align: 'left',
    },
    {
      header: 'Transaction',
      accessor: (item) => (
        <span
          className={`flex items-center gap-2 text-sm font-bold ${getTransactionColor(item.transactionType)}`}
        >
          {getTransactionIcon(item.transactionType)}
          {getTransactionLabel(item.transactionType)}
        </span>
      ),
      align: 'left',
    },
    {
      header: 'Metal',
      accessor: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#1A1C1B]">{item.metal}</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#5E5B56]">{item.purity}</span>
            {item.isLowStock && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600">
                <AlertCircle className="h-3 w-3" />
                LOW STOCK
              </span>
            )}
          </div>
        </div>
      ),
      align: 'left',
    },
    {
      header: 'Batch Ref',
      accessor: (item) => (
        <span className="font-mono rounded bg-[#F4F4F2] px-2 py-1 text-xs text-[#5E5B56]">
          {item.batchRef}
        </span>
      ),
      align: 'left',
    },
    {
      header: 'Gross Wt.',
      accessor: (item) => (
        <span className="text-sm font-bold text-[#1A1C1B]">
          {item.grossWeight.toFixed(2)}g
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Fine Wt.',
      accessor: (item) => (
        <span className="text-sm font-bold text-[#1A1C1B]">
          {item.fineWeight.toFixed(2)}g
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Rate',
      accessor: (item) => (
        <span className="text-sm text-[#5E5B56]">
          ₹{item.rate.toLocaleString()}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Stock Value',
      accessor: (item) => (
        <span className="text-sm font-bold text-[#785600]">
          ₹{item.stockValue.toLocaleString()}
        </span>
      ),
      align: 'right',
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
    <div className="font-sans min-h-screen bg-[#F9F7F3] p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-4xl font-bold tracking-tight text-[#1A1C1B]">
              Stock Movement & Inventory
            </h2>
            <p className="mt-2 font-medium text-[#5E5B56] opacity-70">
              Real-time valuation and logistics of precious metal holdings.
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-lg bg-white p-2 shadow-sm">
            <div className="flex flex-col border-r border-[#D3C4AF]/20 px-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5E5B56]">
                Last Updated
              </span>
              <span className="text-sm font-bold text-[#1A1C1B]">
                14:32 PM, Today
              </span>
            </div>
            <button
              onClick={handleGenerate}
              className="rounded-full p-2 text-[#785600] transition-colors hover:bg-[#F4F4F2]"
            >
              <RefreshCw
                className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Summary Cards - Bento Style */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Total Gold Stock */}
          <div className="group relative overflow-hidden rounded-xl border border-[#D3C4AF]/10 bg-white p-6 shadow-lg shadow-[#785600]/5">
            <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
              <span className="text-6xl">✨</span>
            </div>
            <div className="relative z-10">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#5E5B56]">
                Total Gold Stock
              </p>
              <h3 className="font-serif text-3xl font-bold text-[#785600]">
                {totalGoldStock.toFixed(2)}{' '}
                <span className="text-lg font-normal text-[#5E5B56]">g</span>
              </h3>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-green-50 px-2 py-0.5 font-bold text-green-600">
                  +2.4%
                </span>
                <span className="text-[#5E5B56]">vs last month</span>
              </div>
            </div>
          </div>

          {/* Total Silver Stock */}
          <div className="group relative overflow-hidden rounded-xl border border-[#D3C4AF]/10 bg-white p-6 shadow-lg shadow-[#785600]/5">
            <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
              <span className="text-6xl">📦</span>
            </div>
            <div className="relative z-10">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#5E5B56]">
                Total Silver Stock
              </p>
              <h3 className="font-serif text-3xl font-bold text-[#1A1C1B]">
                {totalSilverStock.toFixed(2)}{' '}
                <span className="text-lg font-normal text-[#5E5B56]">kg</span>
              </h3>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-600">
                  -0.8%
                </span>
                <span className="text-[#5E5B56]">vs last month</span>
              </div>
            </div>
          </div>

          {/* Inventory Value */}
          <div className="group relative overflow-hidden rounded-xl bg-[#B8860B] p-6 text-white shadow-lg">
            <div className="absolute -bottom-4 -right-4 opacity-20">
              <span className="text-8xl">💰</span>
            </div>
            <div className="relative z-10">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/70">
                Inventory Value (₹)
              </p>
              <h3 className="font-serif text-3xl font-bold">
                ₹{totalInventoryValue.toLocaleString()}
              </h3>
              <p className="mt-4 text-xs italic text-white/60">
                Estimated at current live market rates
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[300px] flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5E5B56]" />
            <input
              type="text"
              placeholder="Search by Batch Ref or Transaction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#D3C4AF]/20 bg-white py-3 pl-12 pr-4 text-[#1A1C1B] transition-all placeholder:text-[#5E5B56]/50 focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedMetal}
              onChange={(e) => setSelectedMetal(e.target.value)}
              className="cursor-pointer rounded-lg border border-[#D3C4AF]/20 bg-white px-4 py-3 text-sm font-medium text-[#1A1C1B] outline-none focus:border-[#785600] focus:ring-[#785600]/10"
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
              className="cursor-pointer rounded-lg border border-[#D3C4AF]/20 bg-white px-4 py-3 text-sm font-medium text-[#1A1C1B] outline-none focus:border-[#785600] focus:ring-[#785600]/10"
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-white p-3 transition-colors hover:bg-[#F4F4F2]">
              <span className="text-[#5E5B56]">⚙️</span>
            </button>
          </div>
        </div>

        {/* GenericTable Component */}
        <div className="overflow-hidden rounded-xl border border-[#D3C4AF]/10 bg-white shadow-lg shadow-[#785600]/5">
          <GenericTable
            data={filteredData}
            columns={columns}
            title=""
            searchable={false}
            itemsPerPage={5}
            paginationOff={false}
            className="border-0 shadow-none"
            emptyMessage="No stock transactions found"
          />

          {/* Table Footer with Totals */}
          {filteredData.length > 0 && (
            <div className="border-t border-[#D3C4AF]/10 bg-[#F4F4F2]/30 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6">
                  <p className="text-xs font-medium text-[#5E5B56]">
                    Showing 1 to {filteredData.length} of {filteredData.length}{' '}
                    transactions
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-medium text-[#5E5B56]">Totals:</span>
                    <span className="font-bold text-[#1A1C1B]">
                      Gross: {totalGrossWeight.toFixed(2)}g
                    </span>
                    <span className="font-bold text-[#1A1C1B]">
                      Fine: {totalFineWeight.toFixed(2)}g
                    </span>
                    <span className="font-bold text-[#785600]">
                      Value: ₹{totalStockValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Insights Area */}
        <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Stock Composition Chart Placeholder */}
          <div className="rounded-2xl border border-[#D3C4AF]/5 bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-start justify-between">
              <h4 className="font-serif text-xl font-bold text-[#1A1C1B]">
                Inventory Composition
              </h4>
              <PieChart className="h-5 w-5 text-[#5E5B56]" />
            </div>
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-12">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-[12px] border-[#785600]">
                <div className="absolute inset-0 -rotate-45 rounded-full border-[12px] border-[#1A1C1B]/10 border-t-transparent"></div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-[#1A1C1B]">
                    82%
                  </span>
                  <span className="text-[10px] font-bold uppercase text-[#5E5B56]">
                    Gold Heavy
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[#785600]"></span>
                  <span className="text-sm font-medium text-[#1A1C1B]">
                    Gold 24K (45.2%)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[#785600]/60"></span>
                  <span className="text-sm font-medium text-[#1A1C1B]">
                    Gold 22K (36.8%)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[#1A1C1B]/20"></span>
                  <span className="text-sm font-medium text-[#1A1C1B]">
                    Silver 999 (18.0%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Notifications / Warnings */}
          <div className="rounded-2xl border border-[#D3C4AF]/5 bg-white p-8 shadow-lg">
            <h4 className="font-serif mb-6 text-xl font-bold text-[#1A1C1B]">
              Stock Alerts
            </h4>
            <div className="space-y-4">
              <div className="flex gap-4 rounded-xl border border-red-500/10 bg-red-50/20 p-4">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-bold text-red-700">
                    Critical Low: Silver (999)
                  </p>
                  <p className="mt-1 text-xs text-red-600/70">
                    Current stock is below 15,000g threshold. Immediate purchase
                    recommended.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-[#D3C4AF]/10 bg-[#F4F4F2]/30 p-4">
                <span className="text-xl">📦</span>
                <div>
                  <p className="text-sm font-bold text-[#1A1C1B]">
                    Large Inflow Detected
                  </p>
                  <p className="mt-1 text-xs text-[#5E5B56]">
                    Batch #G-24K-8812 (500g) successfully verified and added to
                    vault.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-[#D3C4AF]/10 bg-[#F4F4F2]/30 p-4">
                <MdVerifiedUser className="h-5 w-5 text-[#785600]" />
                <div>
                  <p className="text-sm font-bold text-[#1A1C1B]">
                    Quarterly Audit Due
                  </p>
                  <p className="mt-1 text-xs text-[#5E5B56]">
                    Next inventory physical verification scheduled for November
                    1st.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions for Export */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-full border border-[#D3C4AF]/30 bg-white px-4 py-2 text-sm font-medium text-[#1A1C1B] transition-colors hover:bg-[#F4F4F2]"
          >
            <Printer className="h-4 w-4" />
            Print View
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-full bg-[#785600] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Export All
          </button>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="group fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#785600] text-white shadow-2xl transition-transform hover:scale-105">
        <Plus className="h-6 w-6" />
        <span className="absolute right-full mr-4 whitespace-nowrap rounded bg-[#1A1C1B] px-3 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          New Entry
        </span>
      </button>
    </div>
  );
}
