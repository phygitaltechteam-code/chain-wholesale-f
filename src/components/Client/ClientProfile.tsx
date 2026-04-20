import {useState} from 'react';
import { useGetClient } from './api';
import {
  Phone,
  MapPin,
  Wallet,
  Calendar,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  History,
  Lock,
  ShieldCheck,
  FileText,
  Edit,
  ArrowRight,
  TrendingUp,
  ArrowLeft,
  MoreVertical,
  X,
} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import GenericTable, {Column} from '../Forms/Table/GenericTable';
import { Client } from './types';
// Mock transactions data
const mockTransactions = [
  {
    id: '1',
    date: '24 Oct 2023',
    billNo: 'INV-8821',
    type: 'Sale',
    metal: 'Gold 22k',
    weight: '12.450 g',
    amount: 85400,
    balance: -245000,
  },
  {
    id: '2',
    date: '20 Oct 2023',
    billNo: 'RCP-4410',
    type: 'Payment',
    metal: '—',
    weight: '—',
    amount: 150000,
    balance: -159600,
  },
  {
    id: '3',
    date: '18 Oct 2023',
    billNo: 'PUR-2101',
    type: 'Purchase',
    metal: 'Silver 999',
    weight: '250.000 g',
    amount: 22100,
    balance: -309600,
  },
  {
    id: '4',
    date: '15 Oct 2023',
    billNo: 'INV-8790',
    type: 'Sale',
    metal: 'Gold 24k',
    weight: '10.000 g',
    amount: 62500,
    balance: -331700,
  },
  {
    id: '5',
    date: '12 Oct 2023',
    billNo: 'INV-8750',
    type: 'Sale',
    metal: 'Gold 18k',
    weight: '8.500 g',
    amount: 42500,
    balance: -394200,
  },
  {
    id: '6',
    date: '10 Oct 2023',
    billNo: 'RCP-4380',
    type: 'Payment',
    metal: '—',
    weight: '—',
    amount: 50000,
    balance: -344200,
  },
  {
    id: '7',
    date: '08 Oct 2023',
    billNo: 'PUR-2080',
    type: 'Purchase',
    metal: 'Silver 925',
    weight: '180.000 g',
    amount: 15800,
    balance: -360000,
  },
  {
    id: '8',
    date: '05 Oct 2023',
    billNo: 'INV-8720',
    type: 'Sale',
    metal: 'Gold 22k',
    weight: '15.000 g',
    amount: 102750,
    balance: -462750,
  },
];

// Mock client data
const mockClient = {
  id: 1,
  name: 'Vikram Singh',
  initials: 'VS',
  phone: '+91 98765 43210',
  email: 'vikram.singh@example.com',
  city: 'Jaipur',
  state: 'Rajasthan',
  gstStatus: 'Active',
  balance: -245000,
  goldBalance: 45.5,
  silverBalance: 850.0,
  lastActive: '2024-03-15',
  tier: 'Premium',
  kycStatus: 'Verified',
  pendingTasks: 2,
  lastUpdated: '12 days ago',
  avatar:
    'https://ui-avatars.com/api/?background=785600&color=fff&name=Vikram+Singh',
};

interface Transaction {
  id: string;
  date: string;
  billNo: string;
  type: string;
  metal: string;
  weight: string;
  amount: number;
  balance: number;
}

export default function ClientProfile() {
  const [activeTab, setActiveTab] = useState('ledger');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getBalanceColor = (balance: number) => {
    if (balance < 0) return 'text-[#ba1a1a]';
    if (balance > 0) return 'text-green-600';
    return 'text-slate-400';
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Sale':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Payment':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'Purchase':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const {data}  =useGetClient()
     console.log(data);
  
  
   const clients: Client[] =
    data?.map((item: any) => ({
      fullname: item.fullname,
      phoneNumber: item.phoneNumber,
      city: item.city,
      balance: item.balance,
      gold: item.gold,
      silver: item.silver,
      initials: item.fullname
        ?.split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase(),
      tier: item.tier || "regular",
    })) || [];

  const handleBack = () => {
    window.history.back();
  };

  const handleBillClick = (transaction: Transaction) => {
    console.log('View bill:', transaction.billNo);
    // Add navigation to bill details here
  };

  // Define table columns for ledger (no actions)
  const ledgerColumns: Column<Transaction>[] = [
    {
      header: 'Date',
      accessor: 'date',
      align: 'left',
      render: (item) => (
        <span className="text-sm font-medium text-[#4f4535]">{item.date}</span>
      ),
    },
    {
      header: 'Bill #',
      accessor: 'billNo',
      align: 'left',
      render: (item) => (
        <span
          className="cursor-pointer text-sm font-bold text-[#785600] hover:underline"
          onClick={() => handleBillClick(item)}
        >
          {item.billNo}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      align: 'left',
      render: (item) => (
        <span
          className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${getTypeStyles(item.type)}`}
        >
          {item.type}
        </span>
      ),
    },
    {
      header: 'Metal',
      accessor: 'metal',
      align: 'left',
      render: (item) => (
        <span className="text-sm text-[#4f4535]">{item.metal}</span>
      ),
    },
    {
      header: 'Weight',
      accessor: 'weight',
      align: 'right',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b]">
          {item.weight}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      align: 'right',
      render: (item) => (
        <span
          className={`text-sm font-semibold ${
            item.type === 'Sale'
              ? 'text-[#ba1a1a]'
              : item.type === 'Payment'
                ? 'text-green-600'
                : 'text-blue-600'
          }`}
        >
          {item.type === 'Payment' ? '+' : ''}₹{item.amount.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Balance',
      accessor: 'balance',
      align: 'right',
      render: (item) => (
        <span className="text-sm font-bold text-[#1a1c1b]">
          {item.balance < 0
            ? `-₹${Math.abs(item.balance).toLocaleString()}`
            : `₹${item.balance.toLocaleString()}`}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      {/* Canvas */}
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6 sm:pb-12 sm:pt-24 lg:px-8 lg:pt-28">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="group mb-6 flex items-center gap-2 text-sm font-medium text-[#4f4535] transition-colors hover:text-[#785600]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Directory
        </button>

        {/* Client Hero Section */}
        <section className="mb-8 flex flex-col items-end justify-between gap-6 rounded-2xl border border-[#d3c4af]/10 bg-gradient-to-r from-white to-[#f4f4f2]/30 p-4 shadow-sm sm:mb-10 sm:p-6 md:flex-row md:p-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#785600]/20 bg-gradient-to-br from-[#785600]/20 to-[#785600]/5 shadow-lg sm:h-20 sm:w-20 md:h-24 md:w-24">
              <img
                src={mockClient.avatar}
                className="h-full w-full object-cover"
                alt={mockClient.name}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="font-['Noto_Serif'] text-2xl tracking-tight text-[#1a1c1b] sm:text-3xl md:text-4xl">
                  {mockClient.name}
                </h2>
                <span className="rounded-full border border-amber-300 bg-gradient-to-r from-amber-100 to-amber-200 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-amber-800 sm:px-3 sm:text-[10px]">
                  {mockClient.tier} Tier
                </span>
                <span className="rounded-full bg-green-100 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-green-700 sm:px-3 sm:text-[10px]">
                  {mockClient.kycStatus}
                </span>
              </div>
              <div className="mt-2 space-y-1 sm:mt-3">
                <p className="flex items-center gap-2 text-xs text-[#4f4535] sm:text-sm">
                  <Phone className="h-3 w-3 text-[#785600] sm:h-4 sm:w-4" />
                  {mockClient.phone}
                </p>
                <p className="flex items-center gap-2 text-xs text-[#4f4535] sm:text-sm">
                  <MapPin className="h-3 w-3 text-[#785600] sm:h-4 sm:w-4" />
                  {mockClient.city}, {mockClient.state}
                </p>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col items-start md:w-auto md:items-end">
            <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:text-[10px]">
              Total Ledger Balance
            </p>
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg sm:gap-3 sm:px-6 sm:py-4 md:px-8">
              <Wallet className="h-5 w-5 text-[#ba1a1a] sm:h-6 sm:w-6 md:h-7 md:w-7" />
              <span className="font-['Noto_Serif'] text-xl font-bold text-[#ba1a1a] sm:text-2xl md:text-3xl">
                - ₹{Math.abs(mockClient.balance).toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-8 grid grid-cols-1 gap-3 sm:mb-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5 lg:gap-5">
          <StatItem
            label="Cash Balance"
            value={`-₹${Math.abs(mockClient.balance).toLocaleString()}`}
            color="error"
            progress={75}
            subtitle="Outstanding Balance"
          />
          <StatItem
            label="Gold Balance"
            value={`${mockClient.goldBalance.toFixed(2)} g`}
            color="primary"
            progress={50}
            subtitle="Pure 24K Equivalent"
          />
          <StatItem
            label="Silver Balance"
            value={`${mockClient.silverBalance.toFixed(2)} g`}
            color="secondary"
            progress={66}
            subtitle="Pure Silver"
          />
          <StatItem
            label="Lifetime Sales"
            value="₹28.4L"
            color="on-surface"
            trend="+12% vs LY"
            subtitle="Total Revenue"
          />
          <StatItem
            label="Open Bookings"
            value="3"
            color="on-surface"
            icon={Lock}
            subtitle="Pending Deliveries"
          />
        </section>

        {/* Navigation Tabs */}
        <section className="mb-6 overflow-x-auto border-b border-[#d3c4af]/20 sm:mb-8">
          <div className="flex min-w-max gap-6 sm:gap-8 md:gap-10">
            {['ledger', 'bookings', 'metal-balance', 'profile-details'].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-3 text-xs font-semibold tracking-wide transition-all sm:pb-4 sm:text-sm ${
                    activeTab === tab
                      ? 'border-b-2 border-[#785600] text-[#785600]'
                      : 'border-b-2 border-transparent text-[#4f4535] hover:text-[#1a1c1b]'
                  }`}
                >
                  {tab
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </button>
              ),
            )}
          </div>
        </section>

        {/* Tab Content: Ledger */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#d3c4af]/10 bg-[#f4f4f2] p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <FilterItem
                  label="Date Range"
                  value="Oct 01, 2023 - Oct 27, 2023"
                  icon={Calendar}
                />
                <FilterItem label="Type" value="All Transactions" />
                <FilterItem label="Metal" value="All Metals" />
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-2 text-[#4f4535] transition-colors hover:bg-[#eeeeec]">
                  <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button className="rounded-lg p-2 text-[#4f4535] transition-colors hover:bg-[#eeeeec]">
                  <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button className="rounded-lg p-2 text-[#4f4535] transition-colors hover:bg-[#eeeeec]">
                  <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            {/* Generic Table for Ledger - No Actions */}
            <GenericTable
              data={mockTransactions}
              columns={ledgerColumns}
              title=""
              searchable={false}
              itemsPerPage={5}
              paginationOff={false}
              action={false}
              className="ledger-table"
            />
          </div>
        )}

        {/* Tab Content: Bookings */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-6 text-center sm:p-8">
              <History className="mx-auto mb-4 h-12 w-12 text-[#785600]/30 sm:h-16 sm:w-16" />
              <h3 className="mb-2 font-['Noto_Serif'] text-lg text-[#1a1c1b] sm:text-xl">
                No Active Bookings
              </h3>
              <p className="text-xs text-[#4f4535] sm:text-sm">
                This client has no active bookings at the moment.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content: Metal Balance */}
        {activeTab === 'metal-balance' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-amber-100/30 p-6 sm:p-8">
              <h3 className="mb-4 font-['Noto_Serif'] text-lg text-amber-800 sm:mb-6 sm:text-xl">
                Gold Holdings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200 pb-4">
                  <span className="text-sm text-amber-800 sm:text-base">
                    24K Pure Gold
                  </span>
                  <span className="text-xl font-bold text-amber-800 sm:text-2xl">
                    {mockClient.goldBalance.toFixed(2)} g
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-800 sm:text-base">
                    Current Market Value
                  </span>
                  <span className="text-lg font-bold text-amber-800 sm:text-xl">
                    ₹{(mockClient.goldBalance * 7245).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-stroke bg-white p-6 sm:p-8">
              <h3 className="text-gray-700 mb-4 font-['Noto_Serif'] text-lg sm:mb-6 sm:text-xl">
                Silver Holdings
              </h3>
              <div className="space-y-4">
                <div className="border-gray-200 flex items-center justify-between border-b pb-4">
                  <span className="text-gray-700 text-sm sm:text-base">
                    Pure Silver
                  </span>
                  <span className="text-gray-700 text-xl font-bold sm:text-2xl">
                    {mockClient.silverBalance.toFixed(2)} g
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 text-sm sm:text-base">
                    Current Market Value
                  </span>
                  <span className="text-gray-700 text-lg font-bold sm:text-xl">
                    ₹{(mockClient.silverBalance * 88.2).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Profile Details */}
        {activeTab === 'profile-details' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 sm:p-6">
                <h3 className="mb-4 font-['Noto_Serif'] text-base text-[#1a1c1b] sm:mb-6 sm:text-lg">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#4f4535] sm:text-xs">
                      Full Name
                    </label>
                    <p className="mt-1 text-sm font-medium text-[#1a1c1b] sm:text-base">
                      {mockClient.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#4f4535] sm:text-xs">
                      Phone Number
                    </label>
                    <p className="mt-1 text-sm font-medium text-[#1a1c1b] sm:text-base">
                      {mockClient.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#4f4535] sm:text-xs">
                      Email Address
                    </label>
                    <p className="mt-1 text-sm font-medium text-[#1a1c1b] sm:text-base">
                      {mockClient.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#4f4535] sm:text-xs">
                      City / State
                    </label>
                    <p className="mt-1 text-sm font-medium text-[#1a1c1b] sm:text-base">
                      {mockClient.city}, {mockClient.state}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 sm:p-6">
                <h3 className="mb-4 font-['Noto_Serif'] text-base text-[#1a1c1b] sm:mb-6 sm:text-lg">
                  Tax & Compliance
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#4f4535] sm:text-xs">
                      GST Status
                    </label>
                    <p className="mt-1 font-medium">
                      <span className="rounded bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700 sm:text-xs">
                        {mockClient.gstStatus}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#4f4535] sm:text-xs">
                      GST Number
                    </label>
                    <p className="mt-1 text-sm font-medium text-[#1a1c1b] sm:text-base">
                      27AAAAA0000A1Z5
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#4f4535] sm:text-xs">
                      PAN Number
                    </label>
                    <p className="mt-1 text-sm font-medium text-[#1a1c1b] sm:text-base">
                      ABCDE1234F
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#4f4535] sm:text-xs">
                      Aadhaar Number
                    </label>
                    <p className="mt-1 text-sm font-medium text-[#1a1c1b] sm:text-base">
                      XXXX-XXXX-XXXX
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-xl border border-[#785600]/20 bg-gradient-to-br from-[#785600]/5 to-[#785600]/10 p-4 text-center sm:p-6">
                <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-[#785600] sm:h-12 sm:w-12" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#4f4535] sm:text-xs">
                  KYC Status
                </p>
                <p className="mt-1 font-['Noto_Serif'] text-base font-bold uppercase tracking-widest text-green-600 sm:text-xl">
                  {mockClient.kycStatus}
                </p>
              </div>
              <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 text-center sm:p-6">
                <FileText className="mx-auto mb-3 h-10 w-10 text-stone-400 sm:h-12 sm:w-12" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#4f4535] sm:text-xs">
                  Pending Tasks
                </p>
                <p className="mt-1 font-['Noto_Serif'] text-base font-bold text-[#1a1c1b] sm:text-xl">
                  {mockClient.pendingTasks} Documents
                </p>
              </div>
              <button className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#785600] py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl sm:py-4 sm:text-base">
                <Edit className="h-4 w-4 transition-transform group-hover:rotate-3 sm:h-5 sm:w-5" />
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@400;500;700&family=Manrope:wght@400;500;600;700&display=swap');
        
        .font-headline {
          font-family: 'Noto Serif', serif;
        }
        
        .font-label, .font-body {
          font-family: 'Manrope', sans-serif;
        }
        
        .editorial-shadow {
          box-shadow: 0px 10px 40px rgba(121, 88, 0, 0.06);
        }

        .ledger-table .bg-\\[\\#f4f4f2\\] {
          background-color: #f4f4f2;
        }
      `}</style>
    </div>
  );
}

// Helper Components
function StatItem({
  label,
  value,
  color,
  progress,
  trend,
  icon: Icon,
  subtitle,
}: {
  label: string;
  value: string;
  color: string;
  progress?: number;
  trend?: string;
  icon?: any;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4 md:p-5">
      <p className="text-[8px] font-bold uppercase tracking-wider text-[#4f4535] sm:text-[10px]">
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <p
          className={`font-['Noto_Serif'] text-lg font-bold sm:text-xl md:text-2xl ${
            color === 'error'
              ? 'text-[#ba1a1a]'
              : color === 'primary'
                ? 'text-amber-700'
                : color === 'secondary'
                  ? 'text-stone-500'
                  : 'text-[#1a1c1b]'
          }`}
        >
          {value}
        </p>
        {Icon && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#785600]/10 sm:h-7 sm:w-7 md:h-8 md:w-8">
            <Icon className="h-3 w-3 text-[#785600] sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
          </div>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-[8px] text-[#4f4535] sm:text-[9px]">
          {subtitle}
        </p>
      )}
      {progress !== undefined && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-stone-100 sm:mt-3 sm:h-1.5">
          <div
            className={`h-full rounded-full ${
              color === 'error'
                ? 'bg-[#ba1a1a]'
                : color === 'primary'
                  ? 'bg-amber-500'
                  : 'bg-stone-400'
            }`}
            style={{width: `${progress}%`}}
          />
        </div>
      )}
      {trend && (
        <p className="mt-2 flex items-center gap-1 text-[8px] font-bold text-green-600 sm:text-[10px]">
          <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3" />
          {trend}
        </p>
      )}
    </div>
  );
}

function FilterItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: any;
}) {
  return (
    <div className="relative">
      <label className="absolute -top-2 left-3 bg-[#f4f4f2] px-1 text-[8px] font-bold uppercase text-[#4f4535] sm:text-[9px]">
        {label}
      </label>
      <div className="flex min-w-[120px] items-center gap-2 rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 text-xs sm:min-w-[140px] sm:px-3 sm:py-2 sm:text-sm">
        <span className="truncate text-[#4f4535]">{value}</span>
        {Icon && (
          <Icon className="h-3 w-3 flex-shrink-0 text-[#4f4535] sm:h-3.5 sm:w-3.5" />
        )}
      </div>
    </div>
  );
}
