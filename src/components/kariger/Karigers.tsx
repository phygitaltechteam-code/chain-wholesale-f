import React, {useState} from 'react';
import {Search, Plus, Edit, MoreVertical, Verified} from 'lucide-react';
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
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoldBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-[#1a1c1b]';
    if (balance < 0) return 'text-[#ba1a1a]';
    return 'text-[#4f4535]';
  };

  // Table columns for Karigar list - NO ACTION COLUMN
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
                ? 'bg-[#785600] text-white'
                : 'bg-[#eeeeec] text-[#785600] group-hover:bg-[#785600] group-hover:text-white'
            }`}
          >
            {item.initials}
          </div>
          <div>
            <p className="font-bold text-[#1a1c1b]">{item.name}</p>
            <p className="text-xs text-[#4f4535]">{item.specialization}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'phone',
      align: 'left',
      render: (item) => (
        <span className="text-sm font-medium text-[#4f4535]">{item.phone}</span>
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
        <span className="font-bold text-[#1a1c1b]">
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
          <p className="text-[10px] text-[#4f4535]">
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
            className={`font-bold ${item.goldInOut > 0 ? 'text-green-600' : item.goldInOut < 0 ? 'text-[#ba1a1a]' : 'text-[#4f4535]'}`}
          >
            {item.goldInOut > 0 ? '+' : ''}
            {item.goldInOut.toFixed(2)}g
          </p>
          {item.wastage !== undefined && item.wastage > 0 && (
            <p className="text-[9px] text-[#4f4535]">Wst: {item.wastage}%</p>
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
          <p className={item.labour > 0 ? 'text-[#1a1c1b]' : 'text-[#ba1a1a]'}>
            {item.labour > 0 ? '₹' : '-₹'}
            {Math.abs(item.labour).toLocaleString()}
          </p>
          <p className="text-[9px] text-[#4f4535]">{item.labourType}</p>
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
          <p className="text-xs font-medium text-[#4f4535]">
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
    <div className="min-h-screen bg-[#f9f9f7]">
      <div className="px-4 py-6 md:px-6 lg:px-8">
        {/* Header Action Row */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <PageHeader title="Karigar Management" />
          </div>
          <GenericButton onClick={handleAddKarigar}>
            <Plus className="h-4 w-4" />
            Add Karigar
          </GenericButton>
        </div>

        {/* Dashboard Bento Summary */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-[#4f4535]">
                Total Active Karigars
              </span>
              <MdEngineering className="h-5 w-5 text-[#785600]" />
            </div>
            <div className="mt-4">
              <h3 className="font-headline text-3xl font-bold text-[#1a1c1b]">
                {totalActiveKarigars}
              </h3>
              <p className="mt-1 text-xs text-[#4f4535]">
                12 currently on high-priority jobs
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-[#4f4535]">
                Gold Outstanding
              </span>
              <MdPayments className="h-5 w-5 text-[#785600]" />
            </div>
            <div className="mt-4">
              <h3 className="font-headline text-3xl font-bold text-[#1a1c1b]">
                {totalGoldOutstanding.toFixed(2)}
                <span className="ml-1 text-base">g</span>
              </h3>
              <p className="mt-1 text-xs font-bold text-[#785600]">
                Value: ₹{(totalGoldOutstanding * 7245).toLocaleString()} approx
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-[#4f4535]">
                Labour Dues
              </span>
              <MdReceiptLong className="h-5 w-5 text-[#785600]" />
            </div>
            <div className="mt-4">
              <h3 className="font-headline text-3xl font-bold text-[#1a1c1b]">
                ₹{totalLabourDues.toLocaleString()}
              </h3>
              <p className="mt-1 text-xs text-[#4f4535]">
                Pending payout this cycle
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-[#d3c4af]/10 bg-white p-6 shadow-sm">
            <div className="absolute inset-0 opacity-5">
              <img
                className="h-full w-full object-cover"
                src="https://images.unsplash.com/photo-1612033442165-2b5c7f7d9e5e?w=400&h=300&fit=crop"
                alt="Gold workshop"
              />
            </div>
            <div className="relative z-10 flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-[#4f4535]">
                Job Completion Rate
              </span>
              <Verified className="h-5 w-5 text-[#785600]" />
            </div>
            <div className="relative z-10 mt-4">
              <h3 className="font-headline text-3xl font-bold text-[#1a1c1b]">
                {avgEfficiency}%
              </h3>
              <p className="mt-1 text-xs text-[#4f4535]">
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
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4f4535]" />
              <input
                type="text"
                placeholder="Search artisans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-[#d3c4af]/20 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20"
              />
            </div>

            {/* Karigar Table - NO ACTION COLUMN */}
            <GenericTable
              data={filteredKarigars}
              columns={karigarColumns}
              title=""
              searchable={false}
              itemsPerPage={10}
              onRowClick={handleKarigarClick}
              className="cursor-pointer"
              action={false}
            />
          </div>

          {/* Right Sidebar Detail View */}
          {selectedKarigar && (
            <div className="sticky top-28 w-full overflow-hidden rounded-xl border border-[#d3c4af]/20 bg-white shadow-xl lg:w-[450px]">
              {/* Profile Header */}
              <div className="bg-[#1a1a2e] p-6 text-white">
                <div className="absolute right-4 top-4 flex gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-[#ffdea6] bg-[#986d00]/30 text-2xl font-bold">
                    {selectedKarigar.initials}
                  </div>
                  <div>
                    <h3 className="font-headline text-xl font-bold">
                      {selectedKarigar.name}
                    </h3>
                    <p className="text-xs tracking-widest text-white/60">
                      {selectedKarigar.phone}
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-white/50">
                      Gold Balance
                    </p>
                    <p className="text-xl font-bold text-[#ffdea6]">
                      {selectedKarigar.goldBalance.toFixed(3)}g
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-white/50">
                      Labour Due
                    </p>
                    <p className="text-xl font-bold text-[#ffdea6]">
                      ₹{selectedKarigar.labourDue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detail Tabs */}
              <div className="flex border-b border-[#d3c4af]/10">
                <button
                  onClick={() => setActiveTab('jobHistory')}
                  className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${
                    activeTab === 'jobHistory'
                      ? 'border-b-2 border-[#785600] text-[#785600]'
                      : 'text-[#4f4535] hover:text-[#785600]'
                  }`}
                >
                  Job History
                </button>
                <button
                  onClick={() => setActiveTab('ledger')}
                  className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${
                    activeTab === 'ledger'
                      ? 'border-b-2 border-[#785600] text-[#785600]'
                      : 'text-[#4f4535] hover:text-[#785600]'
                  }`}
                >
                  Ledger
                </button>
                <button
                  onClick={() => setActiveTab('settlements')}
                  className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${
                    activeTab === 'settlements'
                      ? 'border-b-2 border-[#785600] text-[#785600]'
                      : 'text-[#4f4535] hover:text-[#785600]'
                  }`}
                >
                  Settlements
                </button>
              </div>

              {/* Ledger Table Content */}
              <div className="max-h-[400px] overflow-y-auto">
                {activeTab === 'ledger' && (
                  <GenericTable
                    data={transactionsData}
                    columns={transactionColumns}
                    title=""
                    searchable={false}
                    itemsPerPage={10}
                    paginationOff={true}
                    action={false}
                  />
                )}
                {activeTab === 'jobHistory' && (
                  <div className="p-8 text-center text-[#4f4535]">
                    Job history content will appear here
                  </div>
                )}
                {activeTab === 'settlements' && (
                  <div className="p-8 text-center text-[#4f4535]">
                    Settlements content will appear here
                  </div>
                )}
              </div>

              {/* Footer Action */}
              <div className="flex gap-3 border-t border-[#d3c4af]/10 bg-[#f4f4f2] p-4">
                <button className="flex-1 rounded-lg border border-[#d3c4af]/20 bg-white py-2 text-xs font-bold uppercase tracking-widest text-[#45455b] transition-colors hover:bg-[#e8e8e6]">
                  Issue Gold
                </button>
                <button className="flex-1 rounded-lg bg-[#785600] py-2 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-[#785600]/20 transition-transform hover:scale-[1.02]">
                  Settle Dues
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Specialized Reporting Card */}
        <div className="mt-8 grid grid-cols-1 gap-8 rounded-xl border border-[#d3c4af]/10 bg-white p-6 shadow-sm md:grid-cols-3">
          <div className="space-y-3">
            <h4 className="font-headline text-lg font-bold text-[#1a1c1b]">
              Top Performers
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center justify-between text-sm">
                <span className="text-[#4f4535]">1. Sanjay Khan</span>
                <span className="font-bold text-green-600">
                  99.8% Efficiency
                </span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span className="text-[#4f4535]">2. Rajesh Maurya</span>
                <span className="font-bold text-green-600">
                  97.2% Efficiency
                </span>
              </li>
            </ul>
          </div>
          <div className="space-y-3 border-l border-[#d3c4af]/10 pl-6">
            <h4 className="font-headline text-lg font-bold text-[#1a1c1b]">
              Wastage Analysis
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#785600] border-t-transparent font-bold text-[#785600]">
                0.8%
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-tighter text-[#4f4535]">
                  Avg. Gold Loss
                </p>
                <p className="text-[10px] text-[#4f4535] opacity-60">
                  Optimized by 0.2% this month
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3 border-l border-[#d3c4af]/10 pl-6">
            <h4 className="font-headline text-lg font-bold text-[#1a1c1b]">
              Quick Action
            </h4>
            <p className="text-xs leading-relaxed text-[#4f4535]">
              Download a comprehensive ledger report for all active karigars in
              PDF/XLS format.
            </p>
            <button className="border-b border-[#785600]/30 pb-1 text-xs font-bold uppercase tracking-widest text-[#785600] transition-all hover:border-[#785600]">
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
                  className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-4 py-2 outline-none focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10"
                  placeholder="Enter karigar name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                  Specialization
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-4 py-2 outline-none focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10"
                  placeholder="e.g., Master Casting Specialist"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-4 py-2 outline-none focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-[#f4f4f2] bg-[#f4f4f2]/30 p-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 rounded-lg border border-[#d3c4af]/30 bg-white py-2.5 font-semibold transition-all hover:bg-[#f4f4f2]"
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
        .font-headline {
          font-family: 'Playfair Display', serif;
        }
      `}</style>
    </div>
  );
}
