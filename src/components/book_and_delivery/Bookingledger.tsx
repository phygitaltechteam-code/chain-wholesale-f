// BookingLedger.tsx
import React, {useState, useEffect} from 'react';
import {Plus, Download, Search, Filter, ChevronDown, Eye} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericTable, {Column} from '@/components/Forms/Table/GenericTable';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import PageHeader from '../Forms/Common/PageHeader';

interface Booking {
  id: string;
  bookingId: string;
  clientName: string;
  clientInitials: string;
  metal: string;
  purity: string;
  weight: number;
  lockedRate: number;
  advancePaid: number;
  totalValue: number;
  dueDate: string;
  status: 'Pending' | 'Overdue' | 'Delivered' | 'Active';
  createdAt: string;
}

// Mock data
const mockBookings: Booking[] = [
  {
    id: '1',
    bookingId: 'BK-9021',
    clientName: 'Rajesh Jewellers',
    clientInitials: 'RJ',
    metal: 'Gold',
    purity: '995',
    weight: 100.0,
    lockedRate: 73500,
    advancePaid: 50000,
    totalValue: 735000,
    dueDate: '2024-04-15',
    status: 'Overdue',
    createdAt: '2024-03-25',
  },
  {
    id: '2',
    bookingId: 'BK-9022',
    clientName: 'Aditya Bullion',
    clientInitials: 'AB',
    metal: 'Gold',
    purity: '999',
    weight: 250.0,
    lockedRate: 73500,
    advancePaid: 100000,
    totalValue: 1837500,
    dueDate: '2024-04-20',
    status: 'Active',
    createdAt: '2024-03-26',
  },
  {
    id: '3',
    bookingId: 'BK-9023',
    clientName: 'Mehta & Sons',
    clientInitials: 'MS',
    metal: 'Silver',
    purity: '999',
    weight: 5000,
    lockedRate: 91200,
    advancePaid: 50000,
    totalValue: 456000,
    dueDate: '2024-04-10',
    status: 'Delivered',
    createdAt: '2024-03-20',
  },
  {
    id: '4',
    bookingId: 'BK-9024',
    clientName: 'Srinivasa Gold',
    clientInitials: 'SG',
    metal: 'Gold',
    purity: '995',
    weight: 75.5,
    lockedRate: 73500,
    advancePaid: 25000,
    totalValue: 554925,
    dueDate: '2024-04-25',
    status: 'Pending',
    createdAt: '2024-03-28',
  },
  {
    id: '5',
    bookingId: 'BK-9025',
    clientName: 'Lalitha Jewellers',
    clientInitials: 'LJ',
    metal: 'Gold',
    purity: '999',
    weight: 150.0,
    lockedRate: 73500,
    advancePaid: 75000,
    totalValue: 1102500,
    dueDate: '2024-04-18',
    status: 'Active',
    createdAt: '2024-03-27',
  },
];

// Filter Options
const statusOptions = ['All', 'Pending', 'Active', 'Overdue', 'Delivered'];
const metalOptions = ['All', 'Gold', 'Silver'];

const Bookingledger: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedMetal, setSelectedMetal] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const itemsPerPage = 10;

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsFilterOpen(false);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Filter Logic
  const filteredBookings = mockBookings.filter((booking) => {
    const matchesSearch =
      searchTerm === '' ||
      booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'All' || booking.status === selectedStatus;

    const matchesMetal =
      selectedMetal === 'All' || booking.metal === selectedMetal;

    const matchesDate = !selectedDate || booking.dueDate >= selectedDate;

    return matchesSearch && matchesStatus && matchesMetal && matchesDate;
  });

  // Sort by date descending (newest first)
  const sortedData = [...filteredBookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('All');
    setSelectedMetal('All');
    setSelectedDate('');
  };

  const handleNewBooking = () => {
    navigate({to: '/bookdelivery/newbooking'});
  };

  const handleExport = () => {
    toast.success('Exporting bookings data...');
  };

  const handleViewBooking = (booking: Booking) => {
    toast.success(`Viewing booking: ${booking.bookingId}`);
  };

  const handleProcessDelivery = (booking: Booking) => {
    toast.success(`Processing delivery for ${booking.bookingId}`);
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'Overdue':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'Delivered':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'Pending':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  // Table columns
  const columns: Column<Booking>[] = [
    {
      header: 'Booking ID',
      accessor: 'bookingId',
      align: 'left',
      render: (item) => (
        <span className="font-mono text-sm font-semibold text-[#785600]">
          {item.bookingId}
        </span>
      ),
    },
    {
      header: 'Client',
      accessor: 'clientName',
      align: 'left',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#785600]/10 text-xs font-bold text-[#785600]">
            {item.clientInitials}
          </div>
          <div>
            <p className="font-semibold text-[#1a1c1b]">{item.clientName}</p>
            <p className="text-xs text-[#4f4535]">
              Due:{' '}
              {new Date(item.dueDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Metal / Wt',
      accessor: 'metal',
      align: 'left',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#785600]/10 text-[#785600]">
            <span className="text-sm">
              {item.metal === 'Gold' ? '⭐' : '⚪'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-[#1a1c1b]">
              {item.weight.toFixed(2)}g
            </p>
            <p className="text-xs text-[#4f4535]">
              {item.metal} {item.purity}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Locked Rate',
      accessor: 'lockedRate',
      align: 'right',
      render: (item) => (
        <div className="text-right">
          <p className="font-headline font-semibold text-[#1a1c1b]">
            ₹{item.lockedRate.toLocaleString()}
          </p>
          <p className="text-xs text-[#4f4535]">/10g</p>
        </div>
      ),
    },
    {
      header: 'Advance',
      accessor: 'advancePaid',
      align: 'right',
      render: (item) => (
        <div className="text-right">
          <p className="font-semibold text-[#1a1c1b]">
            ₹{item.advancePaid.toLocaleString()}
          </p>
          <p className="text-xs text-[#4f4535]">Paid</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (item) => (
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadge(item.status)}`}
          >
            {item.status}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewBooking(item);
            }}
            className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2]"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {(item.status === 'Active' || item.status === 'Pending') && (
            <button
              onClick={() => {
                navigate({to: '/bookdelivery/settlement'});
              }}
              className="rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#5d4200]"
            >
              Deliver
            </button>
          )}
          {item.status === 'Overdue' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleProcessDelivery(item);
              }}
              className="rounded-lg border border-red-500 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Cut
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f9f9f7]">
      {/* Page Header with New Booking Button */}
      <div className="px-3 pt-4 md:px-4 md:pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader title="Bookings Ledger" />
          <GenericButton
            onClick={handleNewBooking}
            className="w-full rounded-full !px-4 !py-2 text-sm shadow-[0_4px_14px_rgba(120,86,0,0.2)] sm:w-auto md:!px-5 md:!py-2.5 md:text-base"
          >
            New Booking
          </GenericButton>
        </div>
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className="sticky top-0 z-10 bg-[#f9f9f7] px-3 py-2 md:hidden">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#eeeeec] py-2.5 text-xs font-bold text-[#4f4535] transition-transform active:scale-95"
        >
          <Filter size={16} />
          {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters Section - Responsive */}
      <div
        className={`px-3 transition-all duration-300 md:px-4 ${isFilterOpen || !isMobile ? 'block' : 'hidden'}`}
      >
        <div className="mt-2 rounded-xl border border-[#d3c4af]/10 bg-[#eeeeec] p-3 shadow-sm md:mt-3 md:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Client or ID..."
                className="h-[36px] w-full rounded-lg border border-[#d3c4af]/20 bg-white pl-9 pr-3 text-xs focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 md:h-[38px]"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-[36px] w-full appearance-none rounded-lg border border-[#d3c4af]/20 bg-white px-3 pr-8 text-xs focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 md:h-[38px]"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            </div>

            {/* Metal Filter */}
            <div className="relative">
              <select
                value={selectedMetal}
                onChange={(e) => setSelectedMetal(e.target.value)}
                className="h-[36px] w-full appearance-none rounded-lg border border-[#d3c4af]/20 bg-white px-3 pr-8 text-xs focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 md:h-[38px]"
              >
                {metalOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-[36px] w-full rounded-lg border border-[#d3c4af]/20 bg-white px-3 text-xs focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 md:h-[38px]"
              />
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={resetFilters}
              className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#4f4535] transition-colors hover:bg-[#eeeeec] active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar - Responsive */}
      <div className="mt-3 px-3 md:mt-4 md:px-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
          <input
            type="text"
            placeholder="Search by Client Name or Booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[#d3c4af]/20 bg-white py-2 pl-9 pr-3 text-sm transition-all focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 md:py-2.5 md:pl-10"
          />
        </div>
      </div>

      {/* Results Count - Responsive */}
      <div className="mt-3 flex flex-col items-start justify-between gap-2 px-3 sm:flex-row sm:items-center md:mt-4 md:px-4">
        <p className="text-xs text-[#4f4535]">
          Showing {filteredBookings.length} booking
          {filteredBookings.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-[#eeeeec] px-3 py-1.5 text-xs font-medium text-[#4f4535] transition-colors hover:bg-[#e2e3e1]"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {/* Generic Table - Responsive */}
      <div className="mt-3 px-3 pb-8 md:mt-4 md:px-4">
        <div className="overflow-x-auto">
          <GenericTable
            data={sortedData}
            columns={columns}
            itemsPerPage={itemsPerPage}
            searchable={false}
            loading={false}
            emptyMessage="No bookings found for the selected filters"
            paginationOff={false}
          />
        </div>
      </div>

      <style>{`
        .font-headline {
          font-family: 'Noto Serif', serif;
        }
        @media (max-width: 640px) {
          .generic-table th, .generic-table td {
            padding: 8px 6px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default Bookingledger;
