import React, {useState} from 'react';
import {
  Diamond,
  Plus,
  Eye,
  ArrowRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  Bell,
  UserCircle,
  Menu,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import GenericTable, {Column} from '../Forms/Table/GenericTable';

// Types
interface Order {
  id: string;
  name: string;
  totalGold: number;
  issuedGold: number;
  receivedGold: number;
  wastage: number;
  status: 'In Progress' | 'Completed' | 'Assigned';
  priority: boolean;
}

interface Stage {
  no: string;
  name: string;
  status: 'RECEIVED' | 'IN TRANSIT' | 'PENDING';
  karigar: string;
  issuedGold: number;
  receivedGold?: number;
  wastage: number;
  labour: {
    percent: number;
    amount: number;
  };
  issueDate?: string;
}

const ORDERS: Order[] = [
  {
    id: '#JW-8801',
    name: 'Antique Kundan Necklace',
    totalGold: 120.5,
    issuedGold: 120.5,
    receivedGold: 45.2,
    wastage: 1.25,
    status: 'In Progress',
    priority: true,
  },
  {
    id: '#JW-8798',
    name: 'Bridal Jhumkas (Set of 2)',
    totalGold: 42.15,
    issuedGold: 42.15,
    receivedGold: 41.8,
    wastage: 0.35,
    status: 'Completed',
    priority: false,
  },
  {
    id: '#JW-8805',
    name: 'Mens Gold Kada 22K',
    totalGold: 55.0,
    issuedGold: 55.0,
    receivedGold: 0.0,
    wastage: 0.0,
    status: 'Assigned',
    priority: false,
  },
];

const STAGES: Stage[] = [
  {
    no: '01',
    name: 'Casting & Melting',
    status: 'RECEIVED',
    karigar: 'Ramesh Soni',
    issuedGold: 120.5,
    receivedGold: 119.85,
    wastage: 0.65,
    labour: {percent: 2.5, amount: 12450},
    issueDate: 'Oct 20, 2023',
  },
  {
    no: '02',
    name: 'Hand Polishing',
    status: 'IN TRANSIT',
    karigar: 'Abdul Karim',
    issuedGold: 119.85,
    wastage: 0.0,
    labour: {percent: 1.8, amount: 8200},
    issueDate: 'Oct 24, 2023',
  },
  {
    no: '03',
    name: 'Stone Setting',
    status: 'PENDING',
    karigar: 'Mohan Lal',
    issuedGold: 0,
    wastage: 0.0,
    labour: {percent: 3.2, amount: 15600},
  },
];

export default function JewelleryWork() {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(ORDERS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const selectedOrder =
    ORDERS.find((o) => o.id === selectedOrderId) || ORDERS[0];

  // Filter orders based on search
  const filteredOrders = ORDERS.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'In Progress':
        return 'bg-[#785600]/10 text-[#785600] italic';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'Assigned':
        return 'bg-[#f4f4f2] text-[#4f4535]';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStageStatusBadge = (status: Stage['status']) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-green-100 text-green-700';
      case 'IN TRANSIT':
        return 'bg-[#785600]/20 text-[#785600] italic';
      case 'PENDING':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Define table columns
  const columns: Column<Order>[] = [
    {
      header: 'Order No',
      accessor: 'id',
      align: 'left',
      render: (item) => (
        <span
          className={`font-bold ${selectedOrderId === item.id ? 'text-[#785600]' : 'text-[#1a1c1b]'}`}
        >
          {item.id}
        </span>
      ),
    },
    {
      header: 'Order Name',
      accessor: 'name',
      align: 'left',
      render: (item) => (
        <span className="block max-w-[200px] truncate text-[#1a1c1b]">
          {item.name}
        </span>
      ),
    },
    {
      header: 'Total Gold (g)',
      accessor: 'totalGold',
      align: 'right',
      render: (item) => (
        <span className="tabular-nums">{item.totalGold.toFixed(3)}</span>
      ),
    },
    {
      header: 'Issued (g)',
      accessor: 'issuedGold',
      align: 'right',
      render: (item) => (
        <span className="tabular-nums">{item.issuedGold.toFixed(3)}</span>
      ),
    },
    {
      header: 'Received (g)',
      accessor: 'receivedGold',
      align: 'right',
      render: (item) => (
        <span className="tabular-nums">{item.receivedGold.toFixed(3)}</span>
      ),
    },
    {
      header: 'Wastage (g)',
      accessor: 'wastage',
      align: 'right',
      render: (item) => (
        <span className="font-bold tabular-nums text-[#ba1a1a]">
          {item.wastage.toFixed(3)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'left',
      render: (item) => (
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(item.status)}`}
        >
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      {/* Responsive Padding */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end lg:gap-6">
            <div>
              <h2 className="mb-2 font-headline text-2xl font-black text-[#1a1c1b] sm:text-3xl lg:text-4xl">
                Jewellery Job Work
              </h2>
              <p className="text-xs tracking-wide text-[#4f4535] sm:text-sm">
                Manage ongoing craft processes and karigar allocations.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              {/* Search Bar */}
              <div className="group relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563] sm:left-4 sm:h-5 sm:w-5" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-[#817563] focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 sm:w-72 sm:py-3 sm:pl-11"
                  placeholder="Search orders..."
                  type="text"
                />
              </div>

              {/* New Order Button */}
              <button className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] sm:px-6 sm:py-3 sm:text-base">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>New Order</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:mb-8 lg:grid-cols-4">
          <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-[#4f4535]">Total Orders</p>
            <p className="text-2xl font-bold text-[#1a1c1b]">{ORDERS.length}</p>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-[#4f4535]">In Progress</p>
            <p className="text-2xl font-bold text-[#785600]">
              {ORDERS.filter((o) => o.status === 'In Progress').length}
            </p>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-[#4f4535]">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {ORDERS.filter((o) => o.status === 'Completed').length}
            </p>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-[#4f4535]">Total Gold (g)</p>
            <p className="text-xl font-bold text-[#1a1c1b]">
              {ORDERS.reduce((sum, o) => sum + o.totalGold, 0).toFixed(2)} g
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Left Side: Orders Table */}
          <div className="lg:col-span-2">
            <GenericTable
              data={filteredOrders}
              columns={columns}
              title=""
              searchable={false}
              itemsPerPage={5}
              onRowClick={(order) => setSelectedOrderId(order.id)}
              className="cursor-pointer"
            />
          </div>

          {/* Right Side: Detail Panel */}
          <div className="overflow-hidden rounded-xl border border-[#d3c4af]/10 bg-white shadow-sm">
            {/* Order Header */}
            <div className="border-b border-[#f4f4f2] p-4 sm:p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-[#785600]/10 px-2 py-0.5 text-[10px] font-bold text-[#785600]">
                      {selectedOrder.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#4f4535]">
                      Selected Order
                    </span>
                  </div>
                  <h4 className="font-headline text-xl font-bold text-[#1a1c1b] sm:text-2xl">
                    {selectedOrder.name}
                  </h4>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(selectedOrder.status)}`}
                >
                  {selectedOrder.status}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f4f4f2]/50 p-3 sm:p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                    Gold Required
                  </p>
                  <p className="font-headline text-xl font-bold text-[#785600] sm:text-2xl">
                    {selectedOrder.totalGold.toFixed(3)}{' '}
                    <span className="font-sans text-xs font-medium text-[#4f4535]">
                      g
                    </span>
                  </p>
                </div>
                <div className="rounded-xl bg-[#f4f4f2]/50 p-3 sm:p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                    Current Purity
                  </p>
                  <p className="font-headline text-xl font-bold text-[#1a1c1b] sm:text-2xl">
                    22K{' '}
                    <span className="font-sans text-xs font-medium text-[#4f4535]">
                      91.6%
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Crafting Stages */}
            <div className="border-b border-[#f4f4f2] p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                  Crafting Stages
                </h5>
                <button className="text-[10px] font-bold uppercase text-[#785600] hover:underline">
                  View History
                </button>
              </div>

              <div className="space-y-4">
                {STAGES.map((stage, index) => (
                  <div
                    key={stage.no}
                    className={`rounded-xl p-4 transition-all ${
                      stage.status === 'IN TRANSIT'
                        ? 'border border-[#785600]/20 bg-[#785600]/5'
                        : 'border border-[#d3c4af]/10 bg-[#f4f4f2]/30'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${stage.status === 'IN TRANSIT' ? 'text-[#785600]' : 'text-[#4f4535]'}`}
                      >
                        STAGE {stage.no}: {stage.name}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStageStatusBadge(stage.status)}`}
                      >
                        {stage.status}
                      </span>
                    </div>

                    <div className="mb-3 grid grid-cols-3 gap-3 text-[11px]">
                      <div>
                        <p className="mb-1 text-[#4f4535]">Karigar</p>
                        <p className="font-bold text-[#1a1c1b]">
                          {stage.karigar}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-[#4f4535]">
                          {stage.status === 'IN TRANSIT'
                            ? 'Issue Date'
                            : 'Issued'}
                        </p>
                        <p className="font-bold tabular-nums text-[#1a1c1b]">
                          {stage.issueDate || `${stage.issuedGold.toFixed(2)}g`}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-[#4f4535]">
                          {stage.receivedGold ? 'Received' : 'Status'}
                        </p>
                        <p
                          className={`font-bold tabular-nums ${stage.receivedGold ? 'text-green-600' : 'text-[#1a1c1b]'}`}
                        >
                          {stage.receivedGold
                            ? `${stage.receivedGold.toFixed(2)}g`
                            : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#d3c4af]/10 pt-3 text-[11px]">
                      <p className="text-[#4f4535]">
                        Labour:{' '}
                        <span className="font-bold text-[#1a1c1b]">
                          {stage.labour.percent}% (₹
                          {stage.labour.amount.toLocaleString()})
                        </span>
                      </p>
                      <p className="text-[#4f4535]">
                        Wastage:{' '}
                        <span className="font-bold text-[#ba1a1a]">
                          {stage.wastage.toFixed(3)}g
                        </span>
                      </p>
                    </div>

                    {stage.status === 'IN TRANSIT' && (
                      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] py-2.5 text-[11px] font-bold text-white transition-all hover:opacity-90">
                        Update Reception
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Settlement Overview */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a1a2e]/95 p-4 text-white sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-[#785600]/20 p-2">
                  <Wallet className="h-4 w-4 text-[#785600]" />
                </div>
                <h5 className="text-[11px] font-bold uppercase tracking-widest text-[#f7bd48]">
                  Settlement Overview
                </h5>
              </div>

              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#d3c4af]/70">
                    Cumulative Wastage
                  </span>
                  <span className="font-headline text-xl font-bold text-white">
                    {selectedOrder.wastage.toFixed(3)}{' '}
                    <span className="font-sans text-xs text-[#d3c4af]/50">
                      g
                    </span>
                  </span>
                </div>
                <div className="h-px bg-white/10"></div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#d3c4af]/70">
                    Labour Payable
                  </span>
                  <span className="font-headline text-2xl font-bold text-[#f7bd48]">
                    ₹ 48,200
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="rounded-xl border border-white/10 bg-white/5 py-3 text-[11px] font-bold text-white transition-all hover:bg-white/10">
                  Adjust Gold
                </button>
                <button className="rounded-xl bg-gradient-to-br from-[#785600] to-[#986d00] py-3 text-[11px] font-bold text-white shadow-lg transition-all hover:opacity-90">
                  Settle Labour
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Rate Ticker */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 rounded-full border border-[#d3c4af]/20 bg-white/80 px-4 py-3 shadow-lg backdrop-blur-xl sm:gap-8 sm:px-6 lg:mt-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-[#4f4535]">
              Gold Rate Live
            </p>
            <p className="font-headline font-bold text-[#785600]">
              ₹ 6,245.00 <span className="text-[8px] text-[#4f4535]">/g</span>
            </p>
          </div>
          <div className="hidden h-6 w-px bg-[#d3c4af]/30 sm:block"></div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-tighter text-[#4f4535]">
              Silver Rate
            </p>
            <p className="font-headline font-bold text-[#1a1c1b]">
              ₹ 74.20 <span className="text-[8px] text-[#4f4535]">/g</span>
            </p>
          </div>
          <div className="hidden h-6 w-px bg-[#d3c4af]/30 sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-600">
              +0.42%
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
        
        .font-headline {
          font-family: 'Playfair Display', serif;
        }
        
        .font-body {
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>
    </div>
  );
}
