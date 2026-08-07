// manufacturingprocess/Settlement.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, User, Phone, 
  Plus, Minus, Eye, CheckCircle, X,
  Printer, Save, ArrowRight, DollarSign,
  Wallet, Users, Clock, TrendingUp, TrendingDown
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import toast from 'react-hot-toast';
import { manufacturingStore } from '@/utils/manufacturingStore';

interface SettlementEntry {
  id: string;
  srNo: number;
  clientName: string;
  phoneNumber: string;
  goldBalance: number;
  totalBill: number;
  status: 'pending' | 'settled' | 'partial';
}

interface SettlementDetail {
  clientName: string;
  phoneNumber: string;
  pendingBalance: number;
  totalGiven: number;
  totalReceived: number;
  settlementAmount: number;
  settlementType: 'receive' | 'give';
  notes: string;
  date: string;
}

const Settlement: React.FC = () => {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState<SettlementEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementEntry | null>(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settlementDetail, setSettlementDetail] = useState<SettlementDetail>({
    clientName: '',
    phoneNumber: '',
    pendingBalance: 0,
    totalGiven: 0,
    totalReceived: 0,
    settlementAmount: 0,
    settlementType: 'receive',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
    setDefaultDateRange();
  }, []);

  const setDefaultDateRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    
    const sunday = new Date(now);
    sunday.setDate(monday.getDate() + 6);
    
    setDateRange({
      from: monday.toISOString().split('T')[0],
      to: sunday.toISOString().split('T')[0]
    });
  };

  const loadData = () => {
    const entries = manufacturingStore.getEntries();
    
    const clientMap = new Map<string, {
      clientName: string;
      phoneNumber: string;
      totalGiven: number;
      totalReceived: number;
      totalBill: number;
    }>();

    entries.forEach((entry, index) => {
      const key = entry.clientName || 'Walk-in Customer';
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          clientName: entry.clientName || 'Walk-in Customer',
          phoneNumber: entry.phoneNumber || 'N/A',
          totalGiven: 0,
          totalReceived: 0,
          totalBill: 0
        });
      }
      
      const client = clientMap.get(key)!;
      client.totalGiven += entry.chainGiven || entry.chainWeight || 0;
      client.totalReceived += entry.chainReceived || 0;
      client.totalBill += (entry.chainGiven || entry.chainWeight || 0);
    });

    const settlementData: SettlementEntry[] = Array.from(clientMap.entries()).map(([name, data], index) => ({
      id: `settlement-${index}`,
      srNo: index + 1,
      clientName: data.clientName,
      phoneNumber: data.phoneNumber,
      goldBalance: data.totalReceived - data.totalGiven,
      totalBill: data.totalBill,
      status: data.totalReceived >= data.totalGiven ? 'settled' : 'pending'
    }));

    setSettlements(settlementData);
  };

  const handleSettle = (entry: SettlementEntry) => {
    setSelectedSettlement(entry);
    setSettlementDetail({
      clientName: entry.clientName,
      phoneNumber: entry.phoneNumber,
      pendingBalance: Math.abs(entry.goldBalance),
      totalGiven: entry.goldBalance < 0 ? Math.abs(entry.goldBalance) : 0,
      totalReceived: entry.goldBalance > 0 ? entry.goldBalance : 0,
      settlementAmount: Math.abs(entry.goldBalance),
      settlementType: entry.goldBalance > 0 ? 'receive' : 'give',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowSettleModal(true);
  };

  const handleSaveSettlement = () => {
    if (settlementDetail.settlementAmount <= 0) {
      toast.error('Please enter a valid settlement amount');
      return;
    }
    toast.success(`Settlement saved successfully for ${settlementDetail.clientName}`);
    setShowSettleModal(false);
    loadData();
  };

  const formatNumber = (value: number) => {
    if (value === 0) return '0.000';
    return value.toFixed(3);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600 dark:text-green-400';
    if (balance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <Plus className="h-3 w-3" />;
    if (balance < 0) return <Minus className="h-3 w-3" />;
    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'settled':
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3" /> Settled
        </span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock className="h-3 w-3" /> Pending
        </span>;
      case 'partial':
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <Clock className="h-3 w-3" /> Partial
        </span>;
      default:
        return null;
    }
  };

  // Filter logic
  const filteredSettlements = settlements.filter(entry => {
    const matchesSearch = 
      entry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.phoneNumber.includes(searchTerm);
    
    const matchesBalance = 
      balanceFilter === 'all' ||
      (balanceFilter === 'positive' && entry.goldBalance > 0) ||
      (balanceFilter === 'negative' && entry.goldBalance < 0) ||
      (balanceFilter === 'zero' && entry.goldBalance === 0);
    
    return matchesSearch && matchesBalance;
  });

  // Calculate totals
  const totalPositiveBalance = settlements.reduce((sum, s) => s.goldBalance > 0 ? sum + s.goldBalance : sum, 0);
  const totalNegativeBalance = settlements.reduce((sum, s) => s.goldBalance < 0 ? sum + Math.abs(s.goldBalance) : sum, 0);
  const totalPending = settlements.filter(s => s.status !== 'settled').length;
  const totalSettled = settlements.filter(s => s.status === 'settled').length;

  // Custom action renderer for GenericTable
  const renderActions = (item: SettlementEntry, index: number) => (
    <button
      onClick={() => handleSettle(item)}
      disabled={item.status === 'settled'}
      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        item.status === 'settled'
          ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-600'
          : 'bg-[#785600] text-white hover:bg-[#5d4200]'
      }`}
    >
      {item.status === 'settled' ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <>
          <CheckCircle className="h-3 w-3" />
          Settle
        </>
      )}
    </button>
  );

  // Define columns for GenericTable
  const columns: Column<SettlementEntry>[] = [
    {
      key: 'clientName',
      header: 'Client Name',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.clientName}
        </span>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Phone',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.phoneNumber}
        </span>
      ),
    },
    {
      key: 'goldBalance',
      header: 'Gold Balance',
      render: (item) => (
        <div className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-bold ${getBalanceColor(item.goldBalance)}`}>
          {getBalanceIcon(item.goldBalance)}
          {formatNumber(item.goldBalance)} g
        </div>
      ),
    },
    {
      key: 'totalBill',
      header: 'Total Bill',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.totalBill)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getStatusBadge(item.status),
    },
  ];

  // Settlement Modal Component
  const SettlementModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-slate-900">
        <button
          onClick={() => setShowSettleModal(false)}
          className="sticky top-2 right-2 float-right z-10 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#1a1c1b] dark:text-white mb-4">
            Settlement Details
          </h2>

          <div className="mb-6 rounded-lg bg-[#f4f4f2] p-4 dark:bg-slate-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#4f4535] dark:text-slate-400">Client Name</label>
                <p className="font-semibold text-[#1a1c1b] dark:text-white">
                  {settlementDetail.clientName}
                </p>
              </div>
              <div>
                <label className="text-xs text-[#4f4535] dark:text-slate-400">Phone Number</label>
                <p className="font-semibold text-[#1a1c1b] dark:text-white">
                  {settlementDetail.phoneNumber}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-green-200 p-4 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Plus className="h-4 w-4" />
                <span>Total Received</span>
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(settlementDetail.totalReceived)} g
              </p>
            </div>
            <div className="rounded-lg border border-red-200 p-4 dark:border-red-800">
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <Minus className="h-4 w-4" />
                <span>Total Given</span>
              </div>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatNumber(settlementDetail.totalGiven)} g
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-amber-800 dark:text-amber-400">
                  Pending Balance
                </label>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {formatNumber(settlementDetail.pendingBalance)} g
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-amber-800 dark:text-amber-400">
                  {settlementDetail.settlementType === 'receive' ? 'Receiving' : 'Giving'}
                </span>
                {settlementDetail.settlementType === 'receive' ? 
                  <TrendingUp className="h-5 w-5 text-green-600" /> :
                  <TrendingDown className="h-5 w-5 text-red-600" />
                }
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#4f4535] dark:text-slate-400">
                Settlement Amount (in grams) *
              </label>
              <input
                type="number"
                step="0.001"
                value={settlementDetail.settlementAmount || ''}
                onChange={(e) => setSettlementDetail({
                  ...settlementDetail,
                  settlementAmount: parseFloat(e.target.value) || 0
                })}
                placeholder="Enter amount in grams"
                className="mt-1 w-full rounded-lg border border-[#d3c4af]/30 px-4 py-2 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#4f4535] dark:text-slate-400">
                Settlement Type
              </label>
              <select
                value={settlementDetail.settlementType}
                onChange={(e) => setSettlementDetail({
                  ...settlementDetail,
                  settlementType: e.target.value as 'receive' | 'give'
                })}
                className="mt-1 w-full rounded-lg border border-[#d3c4af]/30 px-4 py-2 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              >
                <option value="receive">Receive (Client gives gold)</option>
                <option value="give">Give (Client takes gold)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#4f4535] dark:text-slate-400">
                Date
              </label>
              <input
                type="date"
                value={settlementDetail.date}
                onChange={(e) => setSettlementDetail({
                  ...settlementDetail,
                  date: e.target.value
                })}
                className="mt-1 w-full rounded-lg border border-[#d3c4af]/30 px-4 py-2 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#4f4535] dark:text-slate-400">
                Notes (Optional)
              </label>
              <textarea
                value={settlementDetail.notes}
                onChange={(e) => setSettlementDetail({
                  ...settlementDetail,
                  notes: e.target.value
                })}
                placeholder="Add any notes..."
                rows={2}
                className="mt-1 w-full rounded-lg border border-[#d3c4af]/30 px-4 py-2 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <button
              onClick={() => setShowSettleModal(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettlement}
              className="flex items-center gap-2 rounded-lg bg-[#785600] px-6 py-2 text-sm font-medium text-white hover:bg-[#5d4200] transition-colors"
            >
              <Save className="h-4 w-4" />
              Save Settlement
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-4 py-4 md:px-8 md:py-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <PageHeader
            title="Settlement"
            subtitle="Manage client settlements and gold balances"
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              Receiving: {formatNumber(totalPositiveBalance)}g
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-400">
              <TrendingDown className="h-3 w-3" />
              Given: {formatNumber(totalNegativeBalance)}g
            </span>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#4f4535] dark:text-slate-400">Total Clients</p>
                <p className="text-2xl font-bold text-[#1a1c1b] dark:text-white">{settlements.length}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#4f4535] dark:text-slate-400">Pending Settlements</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalPending}</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#4f4535] dark:text-slate-400">Settled</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalSettled}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#4f4535] dark:text-slate-400">Net Balance</p>
                <p className={`text-2xl font-bold ${getBalanceColor(totalPositiveBalance - totalNegativeBalance)}`}>
                  {formatNumber(totalPositiveBalance - totalNegativeBalance)}g
                </p>
              </div>
              <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#817563]" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
            />
            <span className="text-[#4f4535] dark:text-slate-400">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
            />
          </div>

          <div className="flex flex-1 items-center gap-2 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search by client name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
            </div>
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
            >
              <option value="all">All Balance</option>
              <option value="positive">Receiving (+) </option>
              <option value="negative">Giving (-)</option>
              <option value="zero">Zero Balance</option>
            </select>
          </div>
        </div>

        {/* Generic Table */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable<SettlementEntry>
            data={filteredSettlements}
            columns={columns}
            onSave={(item) => console.log('Save:', item)}
            emptyMessage="No settlement entries found."
            isLoading={false}
            renderActions={renderActions}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      </div>

      {/* Settlement Modal */}
      {showSettleModal && <SettlementModal />}
    </div>
  );
};

export default Settlement;