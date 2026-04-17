// BookingReport.tsx - Complete Booking Ledger matching HTML design exactly
import React, { useState } from 'react';

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
      booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'overdue':
        return {
          borderColor: 'border-l-4 border-error',
          badgeBg: 'bg-error-container',
          badgeText: 'text-error',
          badgeLabel: 'Overdue',
        };
      case 'active':
        return {
          borderColor: 'border-l-4 border-amber-500',
          badgeBg: 'bg-primary-fixed',
          badgeText: 'text-on-primary-fixed-variant',
          badgeLabel: 'Active',
        };
      case 'delivered':
        return {
          borderColor: 'border-l-4 border-slate-300',
          badgeBg: 'bg-surface-container-high',
          badgeText: 'text-on-surface-variant',
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
    <div className="min-h-screen bg-background font-body">
      {/* Main Content */}
      <div className="px-12 py-8">
        {/* Page Header */}
        <div className="mb-10">
          <h2 className="font-headline text-4xl text-on-surface tracking-tight font-bold">
            Booking Ledger
          </h2>
          <p className="text-on-surface-variant mt-2 max-w-md">
            Oversee pending metal deliveries, locked rates, and customer accounts in real-time.
          </p>
        </div>

        {/* Segment Control / Tab Bar */}
        <div className="flex justify-between items-end mb-10">
          <div className="flex bg-surface-container-high p-1 rounded-lg">
            <button className="px-6 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
              New Booking
            </button>
            <button className="px-6 py-2 text-sm font-bold bg-surface-container-lowest text-primary shadow-sm rounded-md">
              All Bookings
            </button>
            <button className="px-6 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
              Process Delivery
            </button>
          </div>
          <div className="relative group">
            <input
              type="text"
              placeholder="Search Bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-container border-none rounded-full px-6 py-2 text-sm w-64 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
            />
            <span className="material-symbols-outlined absolute right-4 top-2 text-on-surface-variant text-sm">
              search
            </span>
          </div>
        </div>

        {/* Dashboard Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <div className="bg-surface-container-lowest p-6 rounded-lg shadow-[0px_10px_40px_rgba(121,88,0,0.06)] border border-outline-variant/10">
            <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-1">
              Total Active Volume
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-headline font-bold text-on-surface">14.850</span>
              <span className="text-sm font-medium text-on-surface-variant">kg Gold</span>
            </div>
            <div className="mt-4 h-1 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary w-2/3"></div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-lg shadow-[0px_10px_40px_rgba(121,88,0,0.06)] border border-outline-variant/10">
            <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-1">
              Unrealized PNL
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-headline font-bold text-green-700">
                +₹{formatCurrency(428400)}
              </span>
            </div>
            <p className="text-[10px] text-green-600 font-medium mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              4.2% up from last week
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-lg shadow-[0px_10px_40px_rgba(121,88,0,0.06)] border border-outline-variant/10">
            <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-1">
              Exposure Limit
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-headline font-bold text-on-surface">₹24.5</span>
              <span className="text-sm font-medium text-on-surface-variant">M INR</span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-medium mt-2">
              78% of store capacity used
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-lg shadow-[0px_10px_40px_rgba(121,88,0,0.06)] border border-outline-variant/10">
            <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-1">
              Overdue Deliveries
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-headline font-bold text-error">04</span>
              <span className="text-sm font-medium text-on-surface-variant">Orders</span>
            </div>
            <p className="text-[10px] text-error font-medium mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">warning</span>
              Action Required
            </p>
          </div>
        </div>

        {/* Booking Cards Section */}
        <div className="space-y-4">
          {/* Header Row */}
          <div className="grid grid-cols-12 px-8 py-3 bg-surface-container-low rounded-t-lg">
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Client &amp; ID
            </div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center">
              Metal Detail
            </div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">
              Locked Rate
            </div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">
              Current Rate
            </div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center">
              PNL Impact
            </div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">
              Actions
            </div>
          </div>

          {/* Booking Cards */}
          {currentBookings.map((booking) => {
            const statusStyle = getStatusStyles(booking.status);
            const isPositivePNL = booking.pnl >= 0;
            const pnlColor = isPositivePNL ? 'text-green-700' : 'text-error';
            const progressColor = isPositivePNL ? 'bg-green-600' : 'bg-error';
            const progressBg = isPositivePNL ? 'bg-green-100' : 'bg-error-container';

            return (
              <div
                key={booking.id}
                className={`grid grid-cols-12 items-center px-8 py-6 bg-surface-container-lowest rounded-lg shadow-[0px_2px_8px_rgba(0,0,0,0.02)] ${statusStyle.borderColor} hover:bg-surface-container-low transition-all ${
                  booking.status === 'delivered' ? 'opacity-80' : ''
                }`}
              >
                <div className="col-span-2">
                  <p className="text-xs font-bold text-on-surface">{booking.clientName}</p>
                  <p className="text-[10px] text-on-surface-variant">
                    #{booking.bookingId} | {booking.date}
                  </p>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 ${statusStyle.badgeBg} ${statusStyle.badgeText} text-[9px] font-bold rounded uppercase`}
                  >
                    {statusStyle.badgeLabel}
                  </span>
                </div>

                <div className="col-span-2 text-center">
                  <p className="text-sm font-bold text-on-secondary-fixed">{booking.metalType}</p>
                  <p className="text-xs text-on-surface-variant">
                    {formatWeight(booking.weight, booking.metalType)}
                  </p>
                </div>

                <div className="col-span-2 text-right">
                  <p className="text-sm font-medium text-on-surface">
                    ₹{booking.lockedRate.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    Initial Value: ₹{formatCurrency(booking.initialValue / 100000)}L
                  </p>
                </div>

                <div className="col-span-2 text-right">
                  <p
                    className={`text-sm font-bold ${booking.currentRate !== booking.lockedRate ? 'text-primary' : 'text-on-surface-variant'}`}
                  >
                    ₹{booking.currentRate.toLocaleString()}
                  </p>
                  <p
                    className={`text-[10px] ${booking.currentRate !== booking.lockedRate ? (booking.currentRate > booking.lockedRate ? 'text-primary/70' : 'text-error/70') : 'text-on-surface-variant'}`}
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
                  <div className={`${progressBg} h-1.5 w-full rounded-full overflow-hidden`}>
                    <div
                      className={`${progressColor} h-full`}
                      style={{ width: `${booking.pnlPercentage}%` }}
                    ></div>
                  </div>
                  <p className={`text-[10px] font-bold ${pnlColor} mt-1 text-center`}>
                    {isPositivePNL ? '+' : ''}₹{formatCurrency(Math.abs(booking.pnl))}
                  </p>
                </div>

                <div className="col-span-2 text-right">
                  {booking.status === 'overdue' && (
                    <button className="bg-on-secondary-fixed text-white px-4 py-2 rounded-full text-[10px] font-bold hover:opacity-90 transition-opacity uppercase tracking-wider">
                      Deliver Now
                    </button>
                  )}
                  {booking.status === 'active' && (
                    <button className="bg-surface-container-high text-on-secondary-fixed px-4 py-2 rounded-full text-[10px] font-bold hover:bg-surface-container-highest transition-colors uppercase tracking-wider">
                      Manage
                    </button>
                  )}
                  {(booking.status === 'delivered' || booking.status === 'pending') && (
                    <button className="text-primary text-[10px] font-bold hover:underline uppercase tracking-wider">
                      View Ledger
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {filteredBookings.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-8 px-4">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                Showing {indexOfFirstItem + 1} to{' '}
                {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length}{' '}
                bookings
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      currentPage === i + 1
                        ? 'bg-on-secondary-fixed text-white'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Required styles for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
          font-size: 20px;
          display: inline-block;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}
export default BookingReport; 