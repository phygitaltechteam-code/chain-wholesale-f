import React, {useState} from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  MoreVertical,
  Lock,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
} from 'lucide-react';
import GenericTable, {Column} from '../Forms/Table/GenericTable';
import {MdAddBox, MdArrowOutward} from 'react-icons/md';
import GenericButton from '../Forms/Buttons/GenericButton';

interface InventoryItem {
  id: string;
  metalType: string;
  purity: string;
  location: string;
  batchId: string;
  netWeight: number;
  avgRate: number;
  marketValue: number;
  category: 'Gold' | 'Silver';
}

interface Transaction {
  id: string;
  type: 'Payment' | 'Sale' | 'Purchase';
  description: string;
  reference: string;
  amount: number;
  date: string;
  time: string;
  clientName?: string;
}

const inventoryData: InventoryItem[] = [
  {
    id: '1',
    metalType: 'Gold Biscuits',
    purity: '24K',
    location: 'Main Vault (B-10)',
    batchId: '#G-2023-901',
    netWeight: 1000.0,
    avgRate: 6840,
    marketValue: 6840000,
    category: 'Gold',
  },
  {
    id: '2',
    metalType: 'Fine Ornaments',
    purity: '22K',
    location: 'Counter Display 02',
    batchId: '#ORN-992',
    netWeight: 4250.45,
    avgRate: 6210,
    marketValue: 26395294,
    category: 'Gold',
  },
  {
    id: '3',
    metalType: 'Gold Coins',
    purity: '24K',
    location: 'Main Vault (B-12)',
    batchId: '#GC-2023-045',
    netWeight: 850.25,
    avgRate: 6840,
    marketValue: 5815710,
    category: 'Gold',
  },
  {
    id: '4',
    metalType: 'Pure Bullion',
    purity: '999',
    location: 'Basement Safe',
    batchId: '#SLV-112',
    netWeight: 84120.0,
    avgRate: 88,
    marketValue: 7402560,
    category: 'Silver',
  },
  {
    id: '5',
    metalType: 'Silver Bars',
    purity: '999',
    location: 'Basement Safe',
    batchId: '#SLV-113',
    netWeight: 12500.5,
    avgRate: 88,
    marketValue: 1100044,
    category: 'Silver',
  },
];

const transactions: Transaction[] = [
  {
    id: '1',
    type: 'Payment',
    description: 'Vendor Payment: MMTC Ltd.',
    reference: '#INV-GOLD-442',
    amount: -1245000,
    date: '14 Oct, 2023',
    time: '11:20 AM',
  },
  {
    id: '2',
    type: 'Sale',
    description: 'Sale: Diamond Necklace Set',
    reference: '#SALE-4501',
    amount: 482000,
    date: '14 Oct, 2023',
    time: '10:05 AM',
    clientName: 'Aditi Verma',
  },
  {
    id: '3',
    type: 'Purchase',
    description: 'Gold Bullion Purchase',
    reference: '#PUR-2023-881',
    amount: -2450000,
    date: '13 Oct, 2023',
    time: '03:30 PM',
  },
  {
    id: '4',
    type: 'Sale',
    description: 'Sale: Gold Chain Set',
    reference: '#SALE-4498',
    amount: 185000,
    date: '13 Oct, 2023',
    time: '12:15 PM',
    clientName: 'Rajesh Khanna',
  },
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<'stock' | 'opening' | 'movement'>(
    'stock',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Calculate totals
  const totalGold = inventoryData
    .filter((item) => item.category === 'Gold')
    .reduce((sum, item) => sum + item.netWeight, 0);

  const totalSilver = inventoryData
    .filter((item) => item.category === 'Silver')
    .reduce((sum, item) => sum + item.netWeight, 0);

  const goldValue = inventoryData
    .filter((item) => item.category === 'Gold')
    .reduce((sum, item) => sum + item.marketValue, 0);

  const silverValue = inventoryData
    .filter((item) => item.category === 'Silver')
    .reduce((sum, item) => sum + item.marketValue, 0);

  // Filter inventory based on search
  const filteredInventory = inventoryData.filter(
    (item) =>
      item.metalType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Table columns for inventory
  const columns: Column<InventoryItem>[] = [
    {
      header: 'Metal / Type',
      accessor: 'metalType',
      align: 'left',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div
            className={`h-2 w-2 rounded-full ${item.category === 'Gold' ? 'bg-[#785600]' : 'bg-[#817563]'}`}
          ></div>
          <div>
            <span className="text-sm font-bold text-[#1a1c1b]">
              {item.metalType}
            </span>
            <span className="ml-2 text-xs text-[#4f4535]">({item.purity})</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: 'location',
      align: 'left',
      render: (item) => (
        <span className="text-sm text-[#4f4535]">{item.location}</span>
      ),
    },
    {
      header: 'Batch ID',
      accessor: 'batchId',
      align: 'left',
      render: (item) => (
        <span className="font-mono text-xs text-[#4f4535]">{item.batchId}</span>
      ),
    },
    {
      header: 'Net Weight (g)',
      accessor: 'netWeight',
      align: 'right',
      render: (item) => (
        <span className="font-headline font-bold text-[#1a1c1b]">
          {item.netWeight.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      header: 'Avg Rate',
      accessor: 'avgRate',
      align: 'right',
      render: (item) => (
        <span className="text-sm">₹{item.avgRate.toLocaleString()}/g</span>
      ),
    },
    {
      header: 'Market Value',
      accessor: 'marketValue',
      align: 'right',
      render: (item) => (
        <span className="font-headline font-bold text-[#785600]">
          ₹{item.marketValue.toLocaleString()}
        </span>
      ),
    },
  ];

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'Payment':
        return <MdArrowOutward className="h-5 w-5 text-[#ba1a1a]" />;
      case 'Sale':
        return <MdArrowOutward className="h-5 w-5 text-[#785600]" />;
      case 'Purchase':
        return <MdArrowOutward className="h-5 w-5 text-[#ba1a1a]" />;
      default:
        return null;
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'Payment':
        return 'bg-[#ffdad6]/20 text-[#ba1a1a]';
      case 'Sale':
        return 'bg-[#785600]/10 text-[#785600]';
      case 'Purchase':
        return 'bg-[#ffdad6]/20 text-[#ba1a1a]';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleNewTrade = () => {
    console.log('New Trade clicked');
  };

  const handleViewStatement = () => {
    console.log('View Statement clicked');
  };

  const handlePlaceBuyOrder = () => {
    console.log('Place Buy Order clicked');
  };

  const handleEditStock = () => {
    console.log('Edit Stock clicked');
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-headline mb-2 text-2xl font-black text-[#1a1c1b] sm:text-3xl lg:text-4xl">
                Inventory & Accounts
              </h2>
              <p className="text-xs tracking-wide text-[#4f4535] sm:text-sm">
                Manage real-time stock ledger and account balances.
              </p>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                <input
                  type="text"
                  placeholder="Search inventory, invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10"
                />
              </div>
              <GenericButton onClick={handleNewTrade}>
                <Plus className="h-4 w-4" />
                New Trade
              </GenericButton>
            </div>
          </div>
        </div>

        {/* Live Rates Bar */}
        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-xl bg-[#f4f4f2]/50 p-3 sm:gap-6 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="font-headline border-b-2 border-[#785600] pb-1 text-sm font-semibold italic text-[#785600]">
              Live Gold: ₹72,450
            </span>
          </div>
          <div className="hidden h-4 w-px bg-[#d3c4af]/30 sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="font-headline text-sm font-semibold italic text-[#4f4535]">
              Live Silver: ₹88,200
            </span>
          </div>
        </div>

        {/* Dashboard Summary Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Gold Summary Card */}
          <div className="rounded-xl border-l-4 border-[#785600] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                Gold Total Stock
              </span>
              <TrendingUp className="h-5 w-5 text-[#785600]" />
            </div>
            <h2 className="font-headline text-3xl font-black tracking-tighter text-[#1a1c1b] sm:text-4xl lg:text-5xl">
              {totalGold.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-base font-normal text-[#4f4535]">g</span>
            </h2>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#785600] sm:text-sm">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Value: ₹{goldValue.toLocaleString()}</span>
            </div>
          </div>

          {/* Silver Summary Card */}
          <div className="rounded-xl border-l-4 border-[#817563] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                Silver Total Stock
              </span>
              <TrendingUp className="h-5 w-5 text-[#817563]" />
            </div>
            <h2 className="font-headline text-3xl font-black tracking-tighter text-[#1a1c1b] sm:text-4xl lg:text-5xl">
              {totalSilver.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-base font-normal text-[#4f4535]">g</span>
            </h2>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#4f4535] sm:text-sm">
              <span>Value: ₹{silverValue.toLocaleString()}</span>
            </div>
          </div>

          {/* Accounts Quick View Card */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#1a1a2e]/95 p-6 text-white">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <Lock className="h-24 w-24" />
            </div>
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Cash & Bank Balances
              </span>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">HDFC Main A/c</span>
                  <span className="font-headline text-base text-[#B8860B] sm:text-lg">
                    ₹4,52,800
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    Store Petty Cash
                  </span>
                  <span className="font-headline text-base text-[#B8860B] sm:text-lg">
                    ₹18,400
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleViewStatement}
              className="mt-4 text-xs font-bold uppercase tracking-widest text-[#B8860B] hover:underline"
            >
              View Statement →
            </button>
          </div>
        </div>

        {/* Inventory Management Section */}
        <div className="mb-8">
          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-4 border-b border-[#d3c4af]/15 sm:gap-8">
            <button
              onClick={() => setActiveTab('stock')}
              className={`pb-3 text-xs font-bold tracking-wide transition-all sm:text-sm ${
                activeTab === 'stock'
                  ? 'border-b-2 border-[#785600] text-[#785600]'
                  : 'text-[#4f4535] hover:text-[#1a1c1b]'
              }`}
            >
              Current Stock
            </button>
            <button
              onClick={() => setActiveTab('opening')}
              className={`pb-3 text-xs font-medium tracking-wide transition-all sm:text-sm ${
                activeTab === 'opening'
                  ? 'border-b-2 border-[#785600] text-[#785600]'
                  : 'text-[#4f4535] hover:text-[#1a1c1b]'
              }`}
            >
              Opening Stock
            </button>
            <button
              onClick={() => setActiveTab('movement')}
              className={`pb-3 text-xs font-medium tracking-wide transition-all sm:text-sm ${
                activeTab === 'movement'
                  ? 'border-b-2 border-[#785600] text-[#785600]'
                  : 'text-[#4f4535] hover:text-[#1a1c1b]'
              }`}
            >
              Stock Movement
            </button>
          </div>

          {/* Inventory Table */}
          <GenericTable
            data={filteredInventory}
            columns={columns}
            title=""
            searchable={false}
            itemsPerPage={10}
            onView={handleViewItem}
            emptyMessage="No inventory items found"
          />
        </div>

        {/* Accounts & Recent Transactions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Ledger Activity */}
          <div className="rounded-xl bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h3 className="font-headline text-lg font-bold text-[#1a1c1b] sm:text-xl">
                Recent Ledger Activity
              </h3>
              <button className="border-b border-[#785600]/30 text-[10px] font-bold uppercase tracking-widest text-[#785600] hover:border-[#785600] sm:text-xs">
                View All Journal Entries
              </button>
            </div>

            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col justify-between gap-3 rounded-lg bg-[#f4f4f2]/30 p-4 transition-all hover:bg-[#f4f4f2] sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${getTransactionColor(transaction.type)}`}
                    >
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1a1c1b]">
                        {transaction.description}
                      </p>
                      <p className="text-xs italic text-[#4f4535]">
                        {transaction.reference}
                        {transaction.clientName &&
                          ` • ${transaction.clientName}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right sm:text-left">
                    <p
                      className={`font-headline font-bold ${transaction.amount > 0 ? 'text-[#785600]' : 'text-[#ba1a1a]'}`}
                    >
                      {transaction.amount > 0 ? '+' : ''}₹
                      {Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-[#4f4535]">
                      {transaction.date} • {transaction.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contextual Insights */}
          <div className="space-y-6">
            {/* Low Stock Alert */}
            <div className="rounded-xl border border-[#785600]/10 bg-[#785600]/5 p-5">
              <h4 className="font-headline mb-2 font-bold italic text-[#785600]">
                Low Stock Alert
              </h4>
              <p className="text-xs leading-relaxed text-[#4f4535] sm:text-sm">
                22K Gold Bullion is currently below the safety threshold (500g).
                Consider initiating a buy trade.
              </p>
              <GenericButton
                onClick={handlePlaceBuyOrder}
                className="mt-4 w-full"
              >
                Place Buy Order
              </GenericButton>
            </div>

            {/* Image Card */}
            <div className="group relative h-40 cursor-pointer overflow-hidden rounded-xl">
              <img
                alt="Luxury Bullion Storage"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                src="https://images.unsplash.com/photo-1612033442165-2b5c7f7d9e5e?w=400&h=300&fit=crop"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#785600]">
                  Safe Management
                </span>
                <p className="font-headline text-sm font-bold text-white sm:text-base">
                  Inventory Audit History
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-5">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                Quick Stats
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#4f4535]">Total SKUs</span>
                  <span className="font-bold text-[#1a1c1b]">
                    {inventoryData.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#4f4535]">
                    Low Stock Items
                  </span>
                  <span className="font-bold text-[#ba1a1a]">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#4f4535]">Pending Orders</span>
                  <span className="font-bold text-[#785600]">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Details Modal */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#f4f4f2] bg-white p-6">
              <div>
                <h3 className="font-headline text-xl font-bold text-[#1a1c1b]">
                  Inventory Details
                </h3>
                <p className="mt-1 text-xs text-[#4f4535]">
                  {selectedItem.batchId}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="rounded-lg p-2 transition-colors hover:bg-[#f4f4f2]"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Metal Type
                  </label>
                  <p className="mt-1 font-medium text-[#1a1c1b]">
                    {selectedItem.metalType}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Purity
                  </label>
                  <p className="mt-1 font-medium text-[#1a1c1b]">
                    {selectedItem.purity}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Location
                  </label>
                  <p className="mt-1 font-medium text-[#1a1c1b]">
                    {selectedItem.location}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Batch ID
                  </label>
                  <p className="font-mono mt-1 text-sm text-[#1a1c1b]">
                    {selectedItem.batchId}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Net Weight
                  </label>
                  <p className="mt-1 font-bold text-[#1a1c1b]">
                    {selectedItem.netWeight.toFixed(2)} g
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Avg Rate
                  </label>
                  <p className="mt-1 font-medium text-[#1a1c1b]">
                    ₹{selectedItem.avgRate.toLocaleString()}/g
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-[#f4f4f2] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#4f4535]">
                    Market Value
                  </span>
                  <span className="text-xl font-bold text-[#785600]">
                    ₹{selectedItem.marketValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <GenericButton onClick={handleEditStock} className="flex-1">
                  Edit Stock
                </GenericButton>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 rounded-lg border border-[#d3c4af]/30 py-2.5 font-semibold hover:bg-[#f4f4f2]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB for quick inventory adjustment */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a2e] text-[#B8860B] shadow-2xl transition-all hover:scale-105 sm:h-14 sm:w-14">
          <MdAddBox className="h-6 w-6" />
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;0,800;0,900;1,400&family=Manrope:wght@400;500;600;700&display=swap');
        
        .font-headline {
          font-family: 'Noto Serif', serif;
        }
      `}</style>
    </div>
  );
}
