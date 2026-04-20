// BookingReport.tsx - Complete Booking Ledger matching image design exactly
import React, {useState} from 'react';

interface Booking {
  id: string;
  bookingId: string;
  clientName: string;
  date: string;
  metalType: string;
  purity: string;
  weight: number;
  lockedRate: number;
  currentRate: number;
  initialValue: number;
  pnl: number;
  pnlPercentage: number;
  status: 'overdue' | 'active' | 'delivered' | 'pending';
}

const bookingsData: Booking[] = [
  {
    id: '1',
    bookingId: 'BK-90234',
    clientName: 'Venkatesh Jewels',
    date: '22-Oct',
    metalType: 'Gold 24K',
    purity: '999.9',
    weight: 500.0,
    lockedRate: 6180,
    currentRate: 6245.2,
    initialValue: 3090000,
    pnl: 32600,
    pnlPercentage: 85,
    status: 'overdue',
  },
  {
    id: '2',
    bookingId: 'BK-90451',
    clientName: 'Aditya Bullion Corp',
    date: '24-Oct',
    metalType: 'Silver 999',
    purity: '999',
    weight: 10000,
    lockedRate: 74500,
    currentRate: 74100,
    initialValue: 745000,
    pnl: -4000,
    pnlPercentage: 40,
    status: 'active',
  },
  {
    id: '3',
    bookingId: 'BK-89912',
    clientName: 'Mehta & Sons',
    date: '20-Oct',
    metalType: 'Gold 24K',
    purity: '999.9',
    weight: 100.0,
    lockedRate: 6210,
    currentRate: 6210,
    initialValue: 621000,
    pnl: 0,
    pnlPercentage: 0,
    status: 'delivered',
  },
  {
    id: '4',
    bookingId: 'BK-90782',
    clientName: 'Srinivasa Gold',
    date: '25-Oct',
    metalType: 'Gold 22K',
    purity: '916',
    weight: 250.0,
    lockedRate: 5680,
    currentRate: 5720,
    initialValue: 1420000,
    pnl: 10000,
    pnlPercentage: 65,
    status: 'active',
  },
  {
    id: '5',
    bookingId: 'BK-89123',
    clientName: 'Rajesh Exports',
    date: '18-Oct',
    metalType: 'Silver 999',
    purity: '999',
    weight: 25000,
    lockedRate: 73800,
    currentRate: 74100,
    initialValue: 1845000,
    pnl: 7500,
    pnlPercentage: 30,
    status: 'delivered',
  },
  {
    id: '6',
    bookingId: 'BK-91034',
    clientName: 'Lalitha Jewellers',
    date: '26-Oct',
    metalType: 'Gold 24K',
    purity: '999.9',
    weight: 75.0,
    lockedRate: 6220,
    currentRate: 6245.2,
    initialValue: 466500,
    pnl: 1890,
    pnlPercentage: 55,
    status: 'pending',
  },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
};

const formatWeight = (weight: number, metalType: string) => {
  if (metalType.includes('Silver')) {
    return `${(weight / 1000).toFixed(2)}kg`;
  }
  return `${weight.toFixed(2)}g`;
};

const BookingReport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredBookings = bookingsData.filter(
    (booking) =>
      booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'overdue':
        return {
          borderColor: 'border-l-4 border-red-500',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-700',
          badgeLabel: 'Overdue',
        };
      case 'active':
        return {
          borderColor: 'border-l-4 border-amber-500',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-700',
          badgeLabel: 'Active',
        };
      case 'delivered':
        return {
          borderColor: 'border-l-4 border-slate-300',
          badgeBg: 'bg-slate-100',
          badgeText: 'text-slate-600',
          badgeLabel: 'Delivered',
        };
      default:
        return {
          borderColor: 'border-l-4 border-blue-400',
          badgeBg: 'bg-blue-100',
          badgeText: 'text-blue-700',
          badgeLabel: 'Pending',
        };
    }
  };

  return (
    <div className="font-sans min-h-screen bg-[#F9F7F3] p-8">
      {/* Main Content */}
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-10">
          <h2 className="font-serif text-4xl font-bold tracking-tight text-[#2B2A28]">
            Booking Ledger
          </h2>
          <p className="mt-2 max-w-md font-medium text-[#5E5B56] opacity-70">
            Oversee pending metal deliveries, locked rates, and customer
            accounts in real-time.
          </p>
        </div>

        {/* Segment Control / Tab Bar */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex rounded-lg bg-[#F3F0EA] p-1">
            <button className="rounded-md px-6 py-2 text-sm font-medium text-[#5E5B56] transition-colors hover:text-[#2B2A28]">
              New Booking
            </button>
            <button className="rounded-md bg-white px-6 py-2 text-sm font-bold text-[#B88A44] shadow-sm">
              All Bookings
            </button>
            <button className="rounded-md px-6 py-2 text-sm font-medium text-[#5E5B56] transition-colors hover:text-[#2B2A28]">
              Process Delivery
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 rounded-full border border-[#5E5B56]/10 bg-white px-6 py-2 text-sm placeholder:text-[#5E5B56]/50 focus:border-[#B88A44] focus:outline-none focus:ring-1 focus:ring-[#B88A44]/20"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-4 top-2.5 h-4 w-4 text-[#5E5B56]/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Dashboard Stats Grid - exactly matching image */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-[#5E5B56]/10 bg-white p-6 shadow-lg shadow-[#B88A44]/5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#5E5B56]/60">
              Total Active Volume
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-[#2B2A28]">
                14.850
              </span>
              <span className="text-sm font-medium text-[#5E5B56]">
                kg Gold
              </span>
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[#F3F0EA]">
              <div className="h-full w-2/3 bg-[#B88A44]"></div>
            </div>
          </div>

          <div className="rounded-lg border border-[#5E5B56]/10 bg-white p-6 shadow-lg shadow-[#B88A44]/5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#5E5B56]/60">
              Unrealized PNL
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-green-700">
                +₹{formatCurrency(428400)}
              </span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-green-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              6.2% up from last week
            </p>
          </div>

          <div className="rounded-lg border border-[#5E5B56]/10 bg-white p-6 shadow-lg shadow-[#B88A44]/5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#5E5B56]/60">
              Exposure Limit
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-[#2B2A28]">
                ₹24.5
              </span>
              <span className="text-sm font-medium text-[#5E5B56]">M INR</span>
            </div>
            <p className="mt-2 text-[10px] font-medium text-[#5E5B56]">
              78% of store capacity used
            </p>
          </div>

          <div className="rounded-lg border border-[#5E5B56]/10 bg-white p-6 shadow-lg shadow-[#B88A44]/5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#5E5B56]/60">
              Overdue Deliveries
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-red-600">
                04
              </span>
              <span className="text-sm font-medium text-[#5E5B56]">Orders</span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Action Required
            </p>
          </div>
        </div>

        {/* Booking Cards Section */}
        <div className="space-y-4">
          {/* Header Row - matching image column structure */}
          <div className="grid grid-cols-12 rounded-t-lg bg-[#F3F0EA]/50 px-8 py-3">
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-[#5E5B56]">
              Client &amp; ID
            </div>
            <div className="col-span-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#5E5B56]">
              Metal Detail
            </div>
            <div className="col-span-2 text-right text-[10px] font-bold uppercase tracking-wider text-[#5E5B56]">
              Locked Rate
            </div>
            <div className="col-span-2 text-right text-[10px] font-bold uppercase tracking-wider text-[#5E5B56]">
              Current Rate
            </div>
            <div className="col-span-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#5E5B56]">
              PNL Impact
            </div>
            <div className="col-span-2 text-right text-[10px] font-bold uppercase tracking-wider text-[#5E5B56]">
              Actions
            </div>
          </div>

          {/* Booking Cards */}
          {currentBookings.map((booking) => {
            const statusStyle = getStatusStyles(booking.status);
            const isPositivePNL = booking.pnl >= 0;
            const pnlColor = isPositivePNL ? 'text-green-700' : 'text-red-600';
            const progressColor = isPositivePNL ? 'bg-green-600' : 'bg-red-500';
            const progressBg = isPositivePNL ? 'bg-green-100' : 'bg-red-100';

            return (
              <div
                key={booking.id}
                className={`grid grid-cols-12 items-center rounded-lg border border-[#5E5B56]/10 bg-white px-8 py-6 shadow-sm transition-all hover:bg-[#F3F0EA]/30 ${statusStyle.borderColor} ${
                  booking.status === 'delivered' ? 'opacity-80' : ''
                }`}
              >
                <div className="col-span-2">
                  <p className="text-sm font-bold text-[#2B2A28]">
                    {booking.clientName}
                  </p>
                  <p className="text-[10px] text-[#5E5B56]">
                    #{booking.bookingId} | {booking.date}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase ${statusStyle.badgeBg} ${statusStyle.badgeText}`}
                  >
                    {statusStyle.badgeLabel}
                  </span>
                </div>

                <div className="col-span-2 text-center">
                  <p className="text-sm font-bold text-[#2B2A28]">
                    {booking.metalType}
                  </p>
                  <p className="text-xs text-[#5E5B56]">
                    {formatWeight(booking.weight, booking.metalType)}
                  </p>
                </div>

                <div className="col-span-2 text-right">
                  <p className="text-sm font-medium text-[#2B2A28]">
                    ₹{booking.lockedRate.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#5E5B56]">
                    Initial Value: ₹
                    {formatCurrency(booking.initialValue / 100000)}L
                  </p>
                </div>

                <div className="col-span-2 text-right">
                  <p
                    className={`text-sm font-bold ${
                      booking.currentRate !== booking.lockedRate
                        ? 'text-[#B88A44]'
                        : 'text-[#5E5B56]'
                    }`}
                  >
                    ₹{booking.currentRate.toLocaleString()}
                  </p>
                  <p
                    className={`text-[10px] ${
                      booking.currentRate !== booking.lockedRate
                        ? booking.currentRate > booking.lockedRate
                          ? 'text-[#B88A44]/70'
                          : 'text-red-600/70'
                        : 'text-[#5E5B56]'
                    }`}
                  >
                    Diff:{' '}
                    {booking.currentRate > booking.lockedRate
                      ? `+₹${(booking.currentRate - booking.lockedRate).toFixed(1)}`
                      : booking.currentRate < booking.lockedRate
                        ? `-₹${(booking.lockedRate - booking.currentRate).toFixed(1)}`
                        : '—'}
                    {booking.metalType.includes('Gold') ? '/g' : '/kg'}
                  </p>
                </div>

                <div className="col-span-2 px-4">
                  <div
                    className={`h-1.5 w-full overflow-hidden rounded-full ${progressBg}`}
                  >
                    <div
                      className={`h-full ${progressColor}`}
                      style={{width: `${booking.pnlPercentage}%`}}
                    ></div>
                  </div>
                  <p
                    className={`mt-1 text-center text-[10px] font-bold ${pnlColor}`}
                  >
                    {isPositivePNL ? '+' : ''}₹
                    {formatCurrency(Math.abs(booking.pnl))}
                  </p>
                </div>

                <div className="col-span-2 text-right">
                  {booking.status === 'overdue' && (
                    <button className="rounded-full bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90">
                      Deliver Now
                    </button>
                  )}
                  {booking.status === 'active' && (
                    <button className="rounded-full bg-[#F3F0EA] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#2B2A28] transition-colors hover:bg-[#E8E4DC]">
                      Manage
                    </button>
                  )}
                  {(booking.status === 'delivered' ||
                    booking.status === 'pending') && (
                    <button className="text-[10px] font-bold uppercase tracking-wider text-[#B88A44] hover:underline">
                      View Ledger
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {filteredBookings.length > 0 && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-8">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5B56]">
                Showing {indexOfFirstItem + 1} to{' '}
                {Math.min(indexOfLastItem, filteredBookings.length)} of{' '}
                {filteredBookings.length} bookings
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F0EA] text-[#5E5B56] transition-colors hover:bg-[#E8E4DC] disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      currentPage === i + 1
                        ? 'bg-[#B88A44] text-white'
                        : 'bg-[#F3F0EA] text-[#5E5B56] hover:bg-[#E8E4DC]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F0EA] text-[#5E5B56] transition-colors hover:bg-[#E8E4DC] disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingReport;
