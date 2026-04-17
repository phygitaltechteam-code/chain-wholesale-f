import React, {useState} from 'react';
import {
  Calendar,
  Info,
  Lock,
  TrendingUp,
  Bell,
  UserCircle,
  Menu,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Percent,
  Shield,
  ArrowRight,
  Download,
  Printer,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
} from 'lucide-react';

import {useForm} from 'react-hook-form';
import GenericTable, {Column} from '../Forms/Table/GenericTable';
import PageHeader from '../Forms/Common/PageHeader';

interface Booking {
  id: string;
  clientName: string;
  metal: 'Gold' | 'Silver';
  weight: number;
  purity: number;
  rate: number;
  totalValue: number;
  advancePaid: number;
  dueDate: string;
  status: 'Pending' | 'Confirmed' | 'Delivered' | 'Expired';
  createdAt: string;
}

interface BookingFormData {
  metal: string;
  grossWeight: number;
  purity: number;
  gracePeriod: string;
  advancePayment: number;
  paymentMode: string;
}

const mockBookings: Booking[] = [
  {
    id: 'BK-1001',
    clientName: 'Vikram Singh',
    metal: 'Gold',
    weight: 10.5,
    purity: 99.9,
    rate: 72450,
    totalValue: 76072,
    advancePaid: 10000,
    dueDate: '2024-04-15',
    status: 'Confirmed',
    createdAt: '2024-03-25',
  },
  {
    id: 'BK-1002',
    clientName: 'Ananya Mehta',
    metal: 'Silver',
    weight: 500,
    purity: 99.9,
    rate: 8820,
    totalValue: 44100,
    advancePaid: 5000,
    dueDate: '2024-04-20',
    status: 'Pending',
    createdAt: '2024-03-26',
  },
  {
    id: 'BK-1003',
    clientName: 'Rajesh Khanna',
    metal: 'Gold',
    weight: 25.75,
    purity: 99.5,
    rate: 72450,
    totalValue: 186523,
    advancePaid: 25000,
    dueDate: '2024-04-10',
    status: 'Delivered',
    createdAt: '2024-03-20',
  },
];

export default function BookingsAndDelivery() {
  const [activeTab, setActiveTab] = useState<'new' | 'all' | 'process'>('new');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetal, setSelectedMetal] = useState<'Gold' | 'Silver'>('Gold');
  const [grossWeight, setGrossWeight] = useState<number>(0);
  const [purity, setPurity] = useState<number>(99.9);
  const [gracePeriod, setGracePeriod] = useState<string>('3');
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('BANK');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const {control, handleSubmit} = useForm<BookingFormData>();

  // Calculate fine weight
  const fineWeight = (grossWeight * purity) / 100;

  // Calculate total value (assuming rate per gram)
  const currentRate = selectedMetal === 'Gold' ? 7245 : 88.2;
  const totalValue = fineWeight * currentRate;

  // Calculate balance due
  const balanceDue = totalValue - advancePayment;

  // Filter bookings based on search
  const filteredBookings = mockBookings.filter(
    (booking) =>
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-700';
      case 'Pending':
        return 'bg-amber-100 text-amber-700';
      case 'Delivered':
        return 'bg-blue-100 text-blue-700';
      case 'Expired':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Table columns for all bookings
  const columns: Column<Booking>[] = [
    {
      header: 'Booking ID',
      accessor: 'id',
      align: 'left',
      render: (item) => (
        <span className="font-bold text-[#785600]">{item.id}</span>
      ),
    },
    {
      header: 'Client Name',
      accessor: 'clientName',
      align: 'left',
      render: (item) => (
        <span className="font-medium text-[#1a1c1b]">{item.clientName}</span>
      ),
    },
    {
      header: 'Metal',
      accessor: 'metal',
      align: 'left',
    },
    {
      header: 'Weight (g)',
      accessor: 'weight',
      align: 'right',
      render: (item) => (
        <span className="tabular-nums">{item.weight.toFixed(3)} g</span>
      ),
    },
    {
      header: 'Total Value (₹)',
      accessor: 'totalValue',
      align: 'right',
      render: (item) => (
        <span className="font-bold">₹{item.totalValue.toLocaleString()}</span>
      ),
    },
    {
      header: 'Advance (₹)',
      accessor: 'advancePaid',
      align: 'right',
      render: (item) => (
        <span className="text-green-600">
          ₹{item.advancePaid.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Due Date',
      accessor: 'dueDate',
      align: 'left',
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

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end lg:gap-6">
            <div>
              <PageHeader
                title="Bookings & Delivery"
                subtitle="Manage client bookings, deliveries, and rate locking."
              />
            </div>

            {/* Search Bar */}
            {activeTab !== 'new' && (
              <div className="group relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563] sm:left-4 sm:h-5 sm:w-5" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-[#817563] focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 sm:w-72 sm:py-3 sm:pl-11"
                  placeholder="Search bookings..."
                  type="text"
                />
              </div>
            )}
          </div>
        </div>

        {/* Segmented Control Tabs */}
        <div className="mb-8">
          <div className="flex w-full gap-1 rounded-full bg-[#f4f4f2] p-1 sm:w-auto">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 rounded-full px-6 py-2 text-xs font-semibold tracking-tight transition-all sm:flex-initial sm:text-sm ${
                activeTab === 'new'
                  ? 'bg-white text-[#785600] shadow-sm'
                  : 'text-[#4f4535] hover:bg-[#eeeeec]'
              }`}
            >
              New Booking
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 rounded-full px-6 py-2 text-xs font-semibold tracking-tight transition-all sm:flex-initial sm:text-sm ${
                activeTab === 'all'
                  ? 'bg-white text-[#785600] shadow-sm'
                  : 'text-[#4f4535] hover:bg-[#eeeeec]'
              }`}
            >
              All Bookings
            </button>
            <button
              onClick={() => setActiveTab('process')}
              className={`flex-1 rounded-full px-6 py-2 text-xs font-semibold tracking-tight transition-all sm:flex-initial sm:text-sm ${
                activeTab === 'process'
                  ? 'bg-white text-[#785600] shadow-sm'
                  : 'text-[#4f4535] hover:bg-[#eeeeec]'
              }`}
            >
              Process Delivery
            </button>
          </div>
        </div>

        {/* Notice Area */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-[#d3c4af]/10 bg-[#f4f4f2] p-4 sm:gap-4 sm:p-6">
          <div className="flex-shrink-0 rounded-lg bg-[#785600]/10 p-2">
            <Info className="h-5 w-5 text-[#785600]" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-[#1a1c1b] sm:text-base">
              Sale Booking Notice
            </h4>
            <p className="mt-1 text-xs text-[#4f4535] sm:text-sm">
              Client is locking a rate to buy gold from you later. This
              transaction will create a liability until the physical delivery is
              fulfilled.
            </p>
          </div>
        </div>

        {/* New Booking Form */}
        {activeTab === 'new' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Form Column */}
            <div className="space-y-8 lg:col-span-2">
              <div>
                <h3 className="font-headline mb-6 text-2xl text-[#1a1c1b] sm:text-3xl">
                  Booking Details
                </h3>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Metal Toggle */}
                  <div className="sm:col-span-2">
                    <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                      Select Metal
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setSelectedMetal('Gold')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 transition-all sm:gap-3 sm:py-4 ${
                          selectedMetal === 'Gold'
                            ? 'border-2 border-[#785600] bg-white font-bold text-[#785600] shadow-sm'
                            : 'border border-[#d3c4af]/20 bg-[#f4f4f2] font-medium text-[#4f4535] hover:bg-[#eeeeec]'
                        }`}
                      >
                        <span className="text-amber-600">✨</span>
                        Gold 24K
                      </button>
                      <button
                        onClick={() => setSelectedMetal('Silver')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 transition-all sm:gap-3 sm:py-4 ${
                          selectedMetal === 'Silver'
                            ? 'border-2 border-[#785600] bg-white font-bold text-[#785600] shadow-sm'
                            : 'border border-[#d3c4af]/20 bg-[#f4f4f2] font-medium text-[#4f4535] hover:bg-[#eeeeec]'
                        }`}
                      >
                        <span className="text-gray-500">⚪</span>
                        Silver 999
                      </button>
                    </div>
                  </div>

                  {/* Gross Weight */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                      Gross Weight (g)
                    </label>
                    <input
                      type="number"
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(Number(e.target.value))}
                      placeholder="0.000"
                      className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-4 py-3 text-base font-medium outline-none transition-all focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 sm:text-lg"
                    />
                  </div>

                  {/* Purity */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                      Purity (%)
                    </label>
                    <input
                      type="number"
                      value={purity}
                      onChange={(e) => setPurity(Number(e.target.value))}
                      step="0.01"
                      className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-4 py-3 text-base font-medium outline-none transition-all focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 sm:text-lg"
                    />
                  </div>

                  {/* Fine Weight Display */}
                  <div className="flex items-center justify-between rounded-lg border border-[#d3c4af]/10 bg-[#f4f4f2] p-4 sm:col-span-2 sm:p-5">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                        Calculated Fine Weight
                      </span>
                      <span className="text-xs text-[#4f4535]">
                        Standardized 24K equivalent
                      </span>
                    </div>
                    <span className="text-xl font-bold text-[#1a1c1b] sm:text-2xl">
                      {fineWeight.toFixed(3)} g
                    </span>
                  </div>

                  {/* Grace Period */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                      Grace Period
                    </label>
                    <select
                      value={gracePeriod}
                      onChange={(e) => setGracePeriod(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-[#d3c4af]/30 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10"
                    >
                      <option value="3">3 Days</option>
                      <option value="7">7 Days</option>
                      <option value="15">15 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>

                  {/* Advance Payment */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                      Advance Payment (₹)
                    </label>
                    <input
                      type="number"
                      value={advancePayment}
                      onChange={(e) =>
                        setAdvancePayment(Number(e.target.value))
                      }
                      placeholder="Enter Amount"
                      className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10"
                    />
                  </div>

                  {/* Payment Mode */}
                  <div className="sm:col-span-2">
                    <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-[#4f4535]">
                      Payment Mode
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {['CASH', 'BANK', 'UPI'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setPaymentMode(mode)}
                          className={`rounded-full px-5 py-2 text-xs font-bold transition-all sm:px-6 ${
                            paymentMode === mode
                              ? 'bg-[#785600] text-white shadow-md'
                              : 'border border-[#d3c4af]/30 bg-white text-[#4f4535] hover:bg-[#f4f4f2]'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Summary Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                {/* Booking Summary Card */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#1a1a2e]/95 p-6 text-white shadow-2xl">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#785600]/20 blur-3xl"></div>

                  <h3 className="font-headline relative z-10 mb-6 text-xl">
                    Live Booking Summary
                  </h3>

                  <div className="relative z-10 space-y-5">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
                        Current {selectedMetal} Rate (per g)
                      </p>
                      <p className="font-headline text-3xl italic text-[#f7bd48] sm:text-4xl">
                        ₹{currentRate.toFixed(2)}
                      </p>
                    </div>

                    <div className="h-px bg-white/10"></div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Total Weight</span>
                        <span className="font-medium">
                          {grossWeight.toFixed(3)} g
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Purity Adjustment</span>
                        <span className="font-medium">{purity}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Fine Weight</span>
                        <span className="font-medium">
                          {fineWeight.toFixed(3)} g
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-white/20 pt-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-100/60">
                          Total Booking Value
                        </span>
                        <span className="text-xl font-bold text-[#f7bd48] sm:text-2xl">
                          ₹{totalValue.toFixed(2)}
                        </span>
                      </div>
                      {advancePayment > 0 && (
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-amber-100/60">
                            Balance Due
                          </span>
                          <span className="text-lg font-bold text-white">
                            ₹{balanceDue.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rate Difference Engine */}
                <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#785600]" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#1a1c1b]">
                      Rate Difference Engine
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-[#f4f4f2] p-4">
                      <p className="text-[11px] leading-relaxed text-[#4f4535]">
                        If the market rate exceeds{' '}
                        <span className="font-bold text-[#1a1c1b]">
                          ₹{currentRate.toFixed(2)}
                        </span>{' '}
                        after {gracePeriod} days, the client pays the difference
                        or the booking expires.
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="italic text-[#4f4535] underline decoration-dotted underline-offset-4">
                        View Volatility Protection Clause
                      </span>
                      <ArrowRight className="h-3 w-3 text-[#817563]" />
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#785600] to-[#986d00] py-4 text-base font-bold text-white shadow-lg shadow-[#785600]/20 transition-all hover:opacity-90 sm:py-5 sm:text-lg">
                  Confirm & Lock Booking
                  <Lock className="h-5 w-5" />
                </button>
                <p className="text-center text-[10px] uppercase tracking-widest text-[#817563]">
                  Digital signature required upon confirmation
                </p>
              </div>
            </div>
          </div>
        )}

        {/* All Bookings Table */}
        {activeTab === 'all' && (
          <GenericTable
            data={filteredBookings}
            columns={columns}
            title=""
            searchable={false}
            itemsPerPage={10}
            onView={handleViewBooking}
            onEdit={(booking) => console.log('Edit', booking)}
            emptyMessage="No bookings found"
          />
        )}

        {/* Process Delivery Tab */}
        {activeTab === 'process' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-6">
              <h3 className="font-headline mb-4 text-xl">Pending Deliveries</h3>
              <GenericTable
                data={mockBookings.filter(
                  (b) => b.status === 'Confirmed' || b.status === 'Pending',
                )}
                columns={columns}
                title=""
                searchable={false}
                itemsPerPage={10}
                onView={handleViewBooking}
                emptyMessage="No pending deliveries"
              />
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#f4f4f2] bg-white p-6">
              <div>
                <h3 className="font-headline text-xl font-bold text-[#1a1c1b]">
                  Booking Details
                </h3>
                <p className="mt-1 text-xs text-[#4f4535]">
                  {selectedBooking.id}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="rounded-lg p-2 transition-colors hover:bg-[#f4f4f2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Client Name
                  </label>
                  <p className="mt-1 font-medium text-[#1a1c1b]">
                    {selectedBooking.clientName}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Metal
                  </label>
                  <p className="mt-1 font-medium text-[#1a1c1b]">
                    {selectedBooking.metal}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Weight
                  </label>
                  <p className="mt-1 font-medium text-[#1a1c1b]">
                    {selectedBooking.weight} g
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Purity
                  </label>
                  <p className="mt-1 font-medium text-[#1a1c1b]">
                    {selectedBooking.purity}%
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Rate
                  </label>
                  <p className="mt-1 font-medium text-[#1a1c1b]">
                    ₹{selectedBooking.rate}/g
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Total Value
                  </label>
                  <p className="mt-1 font-bold text-[#785600]">
                    ₹{selectedBooking.totalValue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Advance Paid
                  </label>
                  <p className="mt-1 font-medium text-green-600">
                    ₹{selectedBooking.advancePaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4f4535]">
                    Due Date
                  </label>
                  <p className="mt-1 font-medium text-[#1a1c1b]">
                    {selectedBooking.dueDate}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 rounded-lg bg-[#785600] py-2.5 font-semibold text-white">
                  Process Delivery
                </button>
                <button className="flex-1 rounded-lg border border-[#d3c4af]/30 py-2.5 font-semibold hover:bg-[#f4f4f2]">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;0,800;0,900;1,400&family=Manrope:wght@400;500;600;700&display=swap');
        
        .font-headline {
          font-family: 'Noto Serif', serif;
        }
      `}</style>
    </div>
  );
}
