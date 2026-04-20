import React, {useState} from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Download,
  Printer,
  Clock,
  AlertCircle,
  CheckCircle,
  Settings,
  History,
  ArrowUp,
  ArrowDown,
  Minus,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Stars,
  Diamond,
} from 'lucide-react';
import GenericTable, {Column} from '../Forms/Table/GenericTable';
import PageHeader from '../Forms/Common/PageHeader';

interface Rate {
  id: string;
  metal: 'Gold' | 'Silver';
  purity: string;
  buyingRate: number;
  sellingRate: number;
  updatedAt: string;
  updatedBy: string;
  change: number;
  changePercent: number;
}

interface RateHistory {
  id: string;
  date: string;
  time: string;
  metal: string;
  purity: string;
  buyingRate: number;
  sellingRate: number;
  change: number;
  updatedBy: string;
}

export default function RateManagement() {
  const [selectedMetal, setSelectedMetal] = useState<'all' | 'Gold' | 'Silver'>(
    'all',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [dateRange, setDateRange] = useState<
    'today' | 'week' | 'month' | 'all'
  >('today');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Mock rates data
  const [rates, setRates] = useState<Rate[]>([
    {
      id: '1',
      metal: 'Gold',
      purity: '24K (999)',
      buyingRate: 71800,
      sellingRate: 72450,
      updatedAt: '2024-03-27 10:30:00',
      updatedBy: 'Rajesh Kumar',
      change: 120,
      changePercent: 0.35,
    },
    {
      id: '2',
      metal: 'Gold',
      purity: '22K (916)',
      buyingRate: 65800,
      sellingRate: 66450,
      updatedAt: '2024-03-27 10:30:00',
      updatedBy: 'Rajesh Kumar',
      change: 95,
      changePercent: 0.27,
    },
    {
      id: '3',
      metal: 'Gold',
      purity: '18K (750)',
      buyingRate: 53800,
      sellingRate: 54375,
      updatedAt: '2024-03-27 10:30:00',
      updatedBy: 'Rajesh Kumar',
      change: 75,
      changePercent: 0.22,
    },
    {
      id: '4',
      metal: 'Silver',
      purity: '999',
      buyingRate: 865,
      sellingRate: 882,
      updatedAt: '2024-03-27 10:15:00',
      updatedBy: 'System Auto-Update',
      change: -15,
      changePercent: -0.17,
    },
    {
      id: '5',
      metal: 'Silver',
      purity: '925',
      buyingRate: 800,
      sellingRate: 815,
      updatedAt: '2024-03-27 10:15:00',
      updatedBy: 'System Auto-Update',
      change: -12,
      changePercent: -0.15,
    },
  ]);

  // Mock rate history
  const rateHistory: RateHistory[] = [
    {
      id: '1',
      date: 'Oct 12, 2023',
      time: '10:30 AM',
      metal: 'Gold',
      purity: '24K (999)',
      buyingRate: 71800,
      sellingRate: 72450,
      change: 120,
      updatedBy: 'Rajesh Kumar',
    },
    {
      id: '2',
      date: 'Oct 12, 2023',
      time: '10:15 AM',
      metal: 'Silver',
      purity: '999',
      buyingRate: 865,
      sellingRate: 882,
      change: -15,
      updatedBy: 'System Auto-Update',
    },
    {
      id: '3',
      date: 'Oct 11, 2023',
      time: '04:00 PM',
      metal: 'Gold',
      purity: '24K (999)',
      buyingRate: 71650,
      sellingRate: 72300,
      change: -150,
      updatedBy: 'Admin',
    },
    {
      id: '4',
      date: 'Oct 11, 2023',
      time: '10:30 AM',
      metal: 'Gold',
      purity: '24K (999)',
      buyingRate: 71800,
      sellingRate: 72450,
      change: 100,
      updatedBy: 'Rajesh Kumar',
    },
    {
      id: '5',
      date: 'Oct 10, 2023',
      time: '10:30 AM',
      metal: 'Gold',
      purity: '24K (999)',
      buyingRate: 71700,
      sellingRate: 72350,
      change: -200,
      updatedBy: 'Admin',
    },
  ];

  // Filter rates based on selection
  const filteredRates = rates.filter((rate) => {
    const matchesMetal =
      selectedMetal === 'all' || rate.metal === selectedMetal;
    const matchesSearch =
      rate.metal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.purity.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMetal && matchesSearch;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRates = filteredRates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRates.length / itemsPerPage);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: value < 1000 ? 0 : 0,
      maximumFractionDigits: value < 1000 ? 0 : 0,
    }).format(value);
  };

  // Get change icon and color
  const getChangeInfo = (change: number) => {
    if (change > 0) {
      return {icon: ArrowUp, color: 'text-emerald-600', bg: 'bg-emerald-50'};
    } else if (change < 0) {
      return {icon: ArrowDown, color: 'text-[#ba1a1a]', bg: 'bg-red-50'};
    }
    return {icon: Minus, color: 'text-gray-400', bg: 'bg-gray-50'};
  };

  const handleEditRate = (rate: Rate) => {
    setSelectedRate(rate);
    setIsEditing(true);
  };

  const handleSaveRate = () => {
    if (selectedRate) {
      setRates(rates.map((r) => (r.id === selectedRate.id ? selectedRate : r)));
      setIsEditing(false);
      setSelectedRate(null);
    }
  };

  const handleRefresh = () => {
    console.log('Refreshing rates...');
  };

  const [goldBuyingRate, setGoldBuyingRate] = useState(71800);
  const [goldSellingRate, setGoldSellingRate] = useState(72450);
  const [silverBuyingRate, setSilverBuyingRate] = useState(865);
  const [silverSellingRate, setSilverSellingRate] = useState(882);

  // Table columns for rate history
  const historyColumns: Column<RateHistory>[] = [
    {
      header: 'Date & Time',
      accessor: 'date',
      align: 'left',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#1a1c1b]">{item.date}</span>
          <span className="text-[11px] text-[#4f4535]">{item.time}</span>
        </div>
      ),
    },
    {
      header: 'Metal',
      accessor: 'metal',
      align: 'left',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${item.metal === 'Gold' ? 'bg-[#785600]' : 'bg-slate-400'}`}
          ></div>
          <span className="text-sm font-medium">{item.metal}</span>
          <span className="text-xs text-[#4f4535]">({item.purity})</span>
        </div>
      ),
    },
    {
      header: 'Buying Rate',
      accessor: 'buyingRate',
      align: 'right',
      render: (item) => (
        <span className="font-headline text-base font-bold text-emerald-700">
          {formatCurrency(item.buyingRate)}
        </span>
      ),
    },
    {
      header: 'Selling Rate',
      accessor: 'sellingRate',
      align: 'right',
      render: (item) => (
        <span className="font-headline text-base font-bold text-[#785600]">
          {formatCurrency(item.sellingRate)}
        </span>
      ),
    },
    {
      header: 'Change',
      accessor: 'change',
      align: 'left',
      render: (item) => {
        const ChangeIcon = getChangeInfo(item.change).icon;
        const changeColor = getChangeInfo(item.change).color;
        return (
          <span
            className={`flex items-center gap-1 text-xs font-bold ${changeColor}`}
          >
            <ChangeIcon className="h-3 w-3" />
            {item.change > 0 ? '+' : ''}
            {item.change}
          </span>
        );
      },
    },
    {
      header: 'Updated By',
      accessor: 'updatedBy',
      align: 'left',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="bg-primary-fixed text-on-primary-fixed flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold">
            {item.updatedBy.charAt(0)}
          </div>
          <span className="text-on-surface text-xs font-medium">
            {item.updatedBy}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-background font-body min-h-screen">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <PageHeader
              title="Rate Management"
              subtitle="Manage your curated list of elite investors and collectors."
            />
          </div>

          {/* Live Rates Indicator */}
          <div className="hidden items-center gap-4 lg:flex">
            <div className="bg-surface-container flex items-center gap-2 rounded-full border border-stroke px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary"></span>
              <span className="text-on-surface-variant flex items-center gap-1.5 text-[10px] font-bold tracking-wider">
                AU:
                <span className="text-emerald-700">B ₹71,800</span>
                <span className="bg-outline-variant/30 h-3 w-px"></span>
                <span className="text-primary">S ₹72,450</span>
              </span>
            </div>
            <div className="border-outline-variant/15 bg-surface-container flex items-center gap-2 rounded-full border px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400"></span>
              <span className="text-on-surface-variant flex items-center gap-1.5 text-[10px] font-bold tracking-wider">
                AG:
                <span className="text-emerald-700">B ₹865</span>
                <span className="bg-outline-variant/30 h-3 w-px"></span>
                <span className="text-slate-600">S ₹882</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bento-style Rate Update Cards */}
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Gold Rate Card */}
          <div className="bg-surface-container-lowest group relative overflow-hidden rounded-xl border border-stroke p-6 shadow-xl shadow-primary/5 sm:p-8">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-110"></div>
            <div className="relative mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="metallic-gradient flex h-10 w-10 items-center justify-center rounded-lg text-white sm:h-12 sm:w-12">
                  <Stars className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className="text-on-surface font-headline text-lg font-bold sm:text-xl">
                    Gold (24K)
                  </h3>
                  <p className="text-on-surface-variant text-[10px] font-medium sm:text-xs">
                    Set buying and selling benchmarks
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-on-surface-variant mb-1 text-[10px] uppercase tracking-widest">
                  Last Update
                </p>
                <p className="text-sm font-bold text-primary">10:30 AM</p>
              </div>
            </div>
            <div className="relative mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#B8860B]/20 bg-[#B8860B]/5 p-4">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#785600]">
                  Selling Rate
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={goldSellingRate}
                    onChange={(e) => setGoldSellingRate(Number(e.target.value))}
                    className="text-on-surface w-full border-none bg-transparent p-0 pl-6 font-headline text-xl font-black focus:ring-0 sm:text-2xl"
                  />
                </div>
                <p className="text-on-surface-variant mt-2 text-[10px]">
                  Market Spread: +0.8%
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-emerald-800">
                  Buying Rate
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-600">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={goldBuyingRate}
                    onChange={(e) => setGoldBuyingRate(Number(e.target.value))}
                    className="text-on-surface w-full border-none bg-transparent p-0 pl-6 font-headline text-xl font-black focus:ring-0 sm:text-2xl"
                  />
                </div>
                <p className="text-on-surface-variant mt-2 text-[10px]">
                  Market Spread: -0.2%
                </p>
              </div>
            </div>
            <button className="metallic-gradient flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 sm:py-4">
              <RefreshCw className="h-4 w-4" />
              Update Both Rates
            </button>
          </div>

          {/* Silver Rate Card */}
          <div className="borderborder-stroke bg-surface-container-lowest group relative overflow-hidden rounded-xl p-6 shadow-xl shadow-primary/5 sm:p-8">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-slate-200 transition-transform duration-500 group-hover:scale-110"></div>
            <div className="relative mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500 text-white sm:h-12 sm:w-12">
                  <Diamond className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className="text-on-surface font-headline text-lg font-bold sm:text-xl">
                    Silver
                  </h3>
                  <p className="text-on-surface-variant text-[10px] font-medium sm:text-xs">
                    Set buying and selling benchmarks
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-on-surface-variant mb-1 text-[10px] uppercase tracking-widest">
                  Last Update
                </p>
                <p className="text-sm font-bold text-slate-600">10:15 AM</p>
              </div>
            </div>
            <div className="relative mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-100 p-4">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-800">
                  Selling Rate
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-600">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={silverSellingRate}
                    onChange={(e) =>
                      setSilverSellingRate(Number(e.target.value))
                    }
                    className="text-on-surface w-full border-none bg-transparent p-0 pl-6 font-headline text-xl font-black focus:ring-0 sm:text-2xl"
                  />
                </div>
                <p className="text-on-surface-variant mt-2 text-[10px]">
                  Per gram
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-emerald-800">
                  Buying Rate
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-600">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={silverBuyingRate}
                    onChange={(e) =>
                      setSilverBuyingRate(Number(e.target.value))
                    }
                    className="text-on-surface w-full border-none bg-transparent p-0 pl-6 font-headline text-xl font-black focus:ring-0 sm:text-2xl"
                  />
                </div>
                <p className="text-on-surface-variant mt-2 text-[10px]">
                  Per gram
                </p>
              </div>
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-700 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-opacity hover:opacity-90 sm:py-4">
              <RefreshCw className="h-4 w-4" />
              Update Both Rates
            </button>
          </div>
        </div>

        {/* Rate History Ledger */}
        <div className="border-outline-variant/15 bg-surface-container-low overflow-hidden rounded-xl border shadow-sm">
          <div className="bg-surface-container-lowest rounded-lg p-4 sm:p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-on-surface font-headline text-xl font-bold">
                  Rate History Ledger
                </h3>
                <p className="text-on-surface-variant text-xs">
                  Dual-rate tracking for inventory valuation
                </p>
              </div>
              <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5">
                <Filter className="h-4 w-4" />
                Filter Log
              </button>
            </div>

            {/* Generic Table for Rate History */}
            <GenericTable
              data={rateHistory}
              columns={historyColumns}
              title=""
              searchable={false}
              itemsPerPage={5}
              emptyMessage="No rate history found"
            />
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;0,800;0,900;1,400&family=Manrope:wght@400;500;600;700&display=swap');
        
        .font-headline {
          font-family: 'Noto Serif', serif;
        }
        
        .font-body {
          font-family: 'Manrope', sans-serif;
        }
        
        .metallic-gradient {
          background: linear-gradient(135deg, #785600 0%, #986d00 100%);
        }
        
        .bg-surface-container-lowest {
          background-color: #ffffff;
        }
        
        .bg-surface-container-low {
          background-color: #f4f4f2;
        }
        
        .bg-primary-fixed {
          background-color: #ffdea6;
        }
        
        .text-on-primary-fixed {
          color: #271900;
        }
        
        .border-outline-variant\\/15 {
          border-color: rgba(211, 196, 175, 0.15);
        }
      `}</style>
    </div>
  );
}
