import React, {useState} from 'react';
import {
  Search,
  Verified,
  Edit,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
} from 'lucide-react';
import GenericTable, {Column} from '../Forms/Table/GenericTable';
import GenericButton from '../Forms/Buttons/GenericButton';
import {MdEngineering, MdPayments, MdReceiptLong} from 'react-icons/md';
import PageHeader from '../Forms/Common/PageHeader';

interface Karigar {
  id: string;
  name: string;
  initials: string;
  specialization: string;
  phone: string;
  goldBalance: number;
  labourDue: number;
  status: 'On Job' | 'Settled' | 'Idle';
  efficiency?: number;
}

interface KarigarTransaction {
  id: string;
  date: string;
  jobNo: string;
  jobName: string;
  goldInOut: number;
  wastage?: number;
  labour: number;
  labourType: string;
  balanceGold: number;
  balanceLabour: number;
}

const karigarsData: Karigar[] = [
  {
    id: '1',
    name: 'Rajesh Maurya',
    initials: 'RM',
    specialization: 'Master Casting Specialist',
    phone: '+91 98765 43210',
    goldBalance: 145.2,
    labourDue: 42300,
    status: 'On Job',
    efficiency: 97.2,
  },
  {
    id: '2',
    name: 'Sanjay Khan',
    initials: 'SK',
    specialization: 'Filigree Expert',
    phone: '+91 99887 76655',
    goldBalance: 82.45,
    labourDue: 12800,
    status: 'Settled',
    efficiency: 99.8,
  },
  {
    id: '3',
    name: 'Amol Jadhav',
    initials: 'AJ',
    specialization: 'Die Making',
    phone: '+91 91234 56789',
    goldBalance: -12.0,
    labourDue: 0,
    status: 'Idle',
    efficiency: 85.5,
  },
  {
    id: '4',
    name: 'Pankaj Kumar',
    initials: 'PK',
    specialization: 'Polishing & Finish',
    phone: '+91 94567 89012',
    goldBalance: 312.75,
    labourDue: 114500,
    status: 'On Job',
    efficiency: 96.5,
  },
];

const transactionsData: KarigarTransaction[] = [
  {
    id: '1',
    date: 'Oct 12, 2023',
    jobNo: 'ORD-882',
    jobName: 'Chain',
    goldInOut: 50.0,
    wastage: 0.5,
    labour: 4500,
    labourType: '2%',
    balanceGold: 82.45,
    balanceLabour: 12800,
  },
  {
    id: '2',
    date: 'Oct 10, 2023',
    jobNo: 'ORD-875',
    jobName: 'Ring',
    goldInOut: -12.5,
    wastage: 0,
    labour: 1200,
    labourType: 'Fixed',
    balanceGold: 32.45,
    balanceLabour: 8300,
  },
  {
    id: '3',
    date: 'Oct 05, 2023',
    jobNo: 'ORD-860',
    jobName: 'Bangle',
    goldInOut: 44.95,
    wastage: 1.0,
    labour: 7100,
    labourType: '3.5%',
    balanceGold: 44.95,
    balanceLabour: 7100,
  },
  {
    id: '4',
    date: 'Sep 30, 2023',
    jobNo: 'Settlement #44',
    jobName: 'Settlement',
    goldInOut: 0,
    labour: -15000,
    labourType: 'CASH',
    balanceGold: 0,
    balanceLabour: 0,
  },
];

export default function KarigarManagement() {
  const [selectedKarigar, setSelectedKarigar] = useState<Karigar | null>(
    karigarsData[1],
  );
  const [activeTab, setActiveTab] = useState<
    'jobHistory' | 'ledger' | 'settlements'
  >('ledger');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter karigars based on search
  const filteredKarigars = karigarsData.filter(
    (karigar) =>
      karigar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      karigar.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      karigar.phone.includes(searchTerm),
  );

  const getStatusBadge = (status: Karigar['status']) => {
    switch (status) {
      case 'On Job':
        return 'bg-green-100 text-green-800';
      case 'Settled':
        return 'bg-amber-100 text-amber-800';
      case 'Idle':
        return 'bg-surface-container-high text-on-surface-variant';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoldBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-on-surface';
    if (balance < 0) return 'text-error';
    return 'text-on-surface-variant';
  };

  // Table columns for Karigar list
  const karigarColumns: Column<Karigar>[] = [
    {
      header: 'Artisan Name',
      accessor: 'name',
      align: 'left',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold transition-colors ${
              selectedKarigar?.id === item.id
                ? 'bg-primary text-white'
                : 'bg-surface-container text-primary group-hover:bg-primary group-hover:text-white'
            }`}
          >
            {item.initials}
          </div>
          <div>
            <p className="text-on-surface font-bold">{item.name}</p>
            <p className="text-on-surface-variant text-xs">
              {item.specialization}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'phone',
      align: 'left',
      render: (item) => (
        <span className="text-on-surface-variant text-sm font-medium">
          {item.phone}
        </span>
      ),
    },
    {
      header: 'Gold Balance (g)',
      accessor: 'goldBalance',
      align: 'right',
      render: (item) => (
        <span className={`font-bold ${getGoldBalanceColor(item.goldBalance)}`}>
          {item.goldBalance.toFixed(3)}{' '}
          <span className="text-xs font-normal opacity-50">g</span>
        </span>
      ),
    },
    {
      header: 'Labour Due',
      accessor: 'labourDue',
      align: 'right',
      render: (item) => (
        <span className="text-on-surface font-bold">
          ₹{item.labourDue.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (item) => (
        <div className="flex justify-center">
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(item.status)}`}
          >
            {item.status}
          </span>
        </div>
      ),
    },
  ];

  // Table columns for transactions/ledger
  const transactionColumns: Column<KarigarTransaction>[] = [
    {
      header: 'Date | Job',
      accessor: 'date',
      align: 'left',
      render: (item) => (
        <div>
          <p className="text-sm font-bold">{item.date}</p>
          <p className="text-on-surface-variant text-[10px]">
            {item.jobNo} ({item.jobName})
          </p>
        </div>
      ),
    },
    {
      header: 'Gold (In/Out)',
      accessor: 'goldInOut',
      align: 'left',
      render: (item) => (
        <div>
          <p
            className={`font-bold ${item.goldInOut > 0 ? 'text-green-600' : item.goldInOut < 0 ? 'text-error' : 'text-on-surface-variant'}`}
          >
            {item.goldInOut > 0 ? '+' : ''}
            {item.goldInOut.toFixed(2)}g
          </p>
          {item.wastage !== undefined && item.wastage > 0 && (
            <p className="text-on-surface-variant text-[9px]">
              Wst: {item.wastage}%
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Labour',
      accessor: 'labour',
      align: 'left',
      render: (item) => (
        <div>
          <p className={item.labour > 0 ? 'text-on-surface' : 'text-error'}>
            {item.labour > 0 ? '₹' : '-₹'}
            {Math.abs(item.labour).toLocaleString()}
          </p>
          <p className="text-on-surface-variant text-[9px]">
            {item.labourType}
          </p>
        </div>
      ),
    },
    {
      header: 'Balance',
      accessor: 'balanceGold',
      align: 'right',
      render: (item) => (
        <div>
          <p className="font-bold">{item.balanceGold.toFixed(2)}g</p>
          <p className="text-on-surface-variant text-xs font-medium">
            ₹{item.balanceLabour.toLocaleString()}
          </p>
        </div>
      ),
    },
  ];

  const handleKarigarClick = (karigar: Karigar) => {
    setSelectedKarigar(karigar);
  };

  const handleAddKarigar = () => {
    setIsAddModalOpen(true);
  };

  // Calculate summary stats
  const totalActiveKarigars = karigarsData.filter(
    (k) => k.status === 'On Job',
  ).length;
  const totalGoldOutstanding = karigarsData.reduce(
    (sum, k) => sum + (k.goldBalance > 0 ? k.goldBalance : 0),
    0,
  );
  const totalLabourDues = karigarsData.reduce((sum, k) => sum + k.labourDue, 0);
  const avgEfficiency = (
    karigarsData.reduce((sum, k) => sum + (k.efficiency || 0), 0) /
    karigarsData.length
  ).toFixed(1);

  return (
    <div className="bg-background min-h-screen">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Action Row */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <PageHeader title="Kariger Management" />
          </div>
          <GenericButton onClick={handleAddKarigar}>
            <Plus className="h-4 w-4" />
            Add Karigar
          </GenericButton>
        </div>

        {/* Dashboard Bento Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-surface-container-lowest rounded-xl border border-stroke p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-tighter">
                Total Active Karigars
              </span>
              <MdEngineering className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-3">
              <h3 className="serif-heading text-3xl font-bold">
                {totalActiveKarigars}
              </h3>
              <p className="text-on-surface-variant mt-1 text-xs">
                12 currently on high-priority jobs
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-stroke p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-tighter">
                Gold Outstanding
              </span>
              <MdPayments className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-3">
              <h3 className="serif-heading text-3xl font-bold">
                {totalGoldOutstanding.toFixed(2)}
                <span className="ml-1 text-base">g</span>
              </h3>
              <p className="mt-1 text-xs font-bold text-primary">
                Value: ₹{(totalGoldOutstanding * 7245).toLocaleString()} approx
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-stroke p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-tighter">
                Labour Dues
              </span>
              <MdReceiptLong className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-3">
              <h3 className="serif-heading text-3xl font-bold">
                ₹{totalLabourDues.toLocaleString()}
              </h3>
              <p className="text-on-surface-variant mt-1 text-xs">
                Pending payout this cycle
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest relative overflow-hidden rounded-xl border border-stroke p-5 shadow-sm">
            <div className="absolute inset-0 opacity-10">
              <img
                className="h-full w-full object-cover"
                src="https://images.unsplash.com/photo-1612033442165-2b5c7f7d9e5e?w=400&h=300&fit=crop"
                alt="Gold workshop"
              />
            </div>
            <div className="relative z-10 flex items-start justify-between">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-tighter">
                Job Completion Rate
              </span>
              <Verified className="h-5 w-5 text-primary" />
            </div>
            <div className="relative z-10 mt-3">
              <h3 className="serif-heading text-3xl font-bold">
                {avgEfficiency}%
              </h3>
              <p className="text-on-surface-variant mt-1 text-xs">
                Last 30 days performance
              </p>
            </div>
          </div>
        </div>

        {/* Main Interactive Section: List + Detail */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Karigar List */}
          <div className="flex-1 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="text-on-surface-variant absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search artisans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface-container w-full rounded-full border border-stroke px-10 py-2.5 text-sm focus:ring-0 focus:ring-primary"
              />
            </div>

            {/* Karigar Table */}
            <GenericTable
              data={filteredKarigars}
              columns={karigarColumns}
              title=""
              searchable={false}
              itemsPerPage={10}
              onRowClick={handleKarigarClick}
              className="cursor-pointer"
            />
          </div>

          {/* Right Sidebar Detail View */}
          {selectedKarigar && (
            <div className="bg-surface-container-lowest sticky top-28 max-h-[calc(100vh-160px)] w-full overflow-hidden rounded-xl border border-stroke/20 shadow-xl lg:w-[450px]">
              {/* Profile Header */}
              <div className="bg-on-secondary-fixed p-5 text-white">
                <div className="absolute right-4 top-4 flex gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="border-primary-fixed bg-primary-container/30 flex h-16 w-16 items-center justify-center rounded-xl border-2 text-2xl font-bold">
                    {selectedKarigar.initials}
                  </div>
                  <div>
                    <h3 className="serif-heading text-xl font-bold">
                      {selectedKarigar.name}
                    </h3>
                    <p className="text-xs tracking-widest text-white/60">
                      {selectedKarigar.phone}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-white/50">
                      Gold Balance
                    </p>
                    <p className="text-primary-fixed text-xl font-bold">
                      {selectedKarigar.goldBalance.toFixed(3)}g
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-white/50">
                      Labour Due
                    </p>
                    <p className="text-primary-fixed text-xl font-bold">
                      ₹{selectedKarigar.labourDue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detail Tabs */}
              <div className="border-b border-stroke">
                <button
                  onClick={() => setActiveTab('jobHistory')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                    activeTab === 'jobHistory'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Job History
                </button>
                <button
                  onClick={() => setActiveTab('ledger')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                    activeTab === 'ledger'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Ledger
                </button>
                <button
                  onClick={() => setActiveTab('settlements')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                    activeTab === 'settlements'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Settlements
                </button>
              </div>

              {/* Ledger Table Content */}
              <div className="max-h-[400px] overflow-y-auto">
                <GenericTable
                  data={transactionsData}
                  columns={transactionColumns}
                  title=""
                  searchable={false}
                  itemsPerPage={10}
                  paginationOff={true}
                />
              </div>

              {/* Footer Action */}
              <div className="bg-surface-container-low flex gap-3 border-t border-stroke p-4">
                <button className="bg-surface-container-highest text-on-secondary-fixed hover:bg-surface-variant flex-1 rounded-lg border border-stroke py-2 text-xs font-bold uppercase tracking-widest transition-colors">
                  Issue Gold
                </button>
                <button className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]">
                  Settle Dues
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Specialized Reporting Card */}
        <div className="bg-surface-container-lowest mt-8 grid grid-cols-1 gap-8 rounded-xl border border-stroke p-6 shadow-sm md:grid-cols-3">
          <div className="space-y-3">
            <h4 className="serif-heading text-lg font-bold">Top Performers</h4>
            <ul className="space-y-2">
              <li className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">1. Sanjay Khan</span>
                <span className="font-bold text-green-600">
                  99.8% Efficiency
                </span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">
                  2. Rajesh Maurya
                </span>
                <span className="font-bold text-green-600">
                  97.2% Efficiency
                </span>
              </li>
            </ul>
          </div>
          <div className="space-y-3 border-l border-stroke pl-6">
            <h4 className="serif-heading text-lg font-bold">
              Wastage Analysis
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary border-t-transparent font-bold text-primary">
                0.8%
              </div>
              <div>
                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-tighter">
                  Avg. Gold Loss
                </p>
                <p className="text-on-surface-variant text-[10px] opacity-60">
                  Optimized by 0.2% this month
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3 border-l border-stroke pl-6">
            <h4 className="serif-heading text-lg font-bold">Quick Action</h4>
            <p className="text-on-surface-variant text-xs leading-relaxed">
              Download a comprehensive ledger report for all active karigars in
              PDF/XLS format.
            </p>
            <button className="border-b border-primary/30 pb-1 text-xs font-bold uppercase tracking-widest text-primary transition-all hover:border-primary">
              Export Ledger Suite
            </button>
          </div>
        </div>
      </div>

      {/* Add Karigar Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#f4f4f2] bg-white p-6">
              <h3 className="font-headline text-xl font-bold text-[#1a1c1b]">
                Add New Karigar
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
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
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-[#d3c4af]/30 px-4 py-2 outline-none focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10"
                  placeholder="Enter karigar name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                  Specialization
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-[#d3c4af]/30 px-4 py-2 outline-none focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10"
                  placeholder="e.g., Master Casting Specialist"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-[#d3c4af]/30 px-4 py-2 outline-none focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-[#f4f4f2] bg-[#f4f4f2]/30 p-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 rounded-lg border border-[#d3c4af]/30 py-2.5 font-semibold transition-all hover:bg-[#f4f4f2]"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] py-2.5 font-semibold text-white transition-all hover:opacity-90"
              >
                Add Karigar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800;900&family=Manrope:wght@400;500;600;700&display=swap');
        
        .serif-heading {
          font-family: 'Playfair Display', serif;
        }
        
        .bg-on-secondary-fixed {
          background-color: #1a1a2e;
        }
        
        .bg-primary-container {
          background-color: #986d00;
        }
        
        .bg-primary-container\/30 {
          background-color: rgba(120, 86, 0, 0.3);
        }
        
        .text-primary-fixed {
          color: #ffdea6;
        }
        
        .bg-primary-fixed {
          background-color: #ffdea6;
        }
        
        .border-primary-fixed {
          border-color: #ffdea6;
        }
      `}</style>
    </div>
  );
}
