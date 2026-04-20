import React, {useState} from 'react';
import {ChevronRight, CheckCircle} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import {
  MdAccountBalanceWallet,
  MdContentCut,
  MdExpandMore,
  MdLocalShipping,
  MdReceiptLong,
} from 'react-icons/md';

interface BookingDetails {
  id: string;
  customerName: string;
  bookingId: string;
  status: string;
  bookingDate: string;
  scheduledDelivery: string;
  lockedRate: number;
  totalWeight: number;
  purity: string;
  totalValue: number;
  advanceToken: number;
  balanceDue: number;
}

const Settlement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'delivery' | 'cut'>('delivery');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [currentRate, setCurrentRate] = useState('6,200');
  const [settlementAmount, setSettlementAmount] = useState('');

  // Mock booking data
  const bookingData: BookingDetails = {
    id: 'BKG-2023-089',
    customerName: 'Aarav Patel Jewellers',
    bookingId: 'BKG-2023-089',
    status: 'Pending Delivery',
    bookingDate: 'Oct 12, 2023',
    scheduledDelivery: 'Oct 15, 2023',
    lockedRate: 6150,
    totalWeight: 500.0,
    purity: '24K (999)',
    totalValue: 3075000,
    advanceToken: 500000,
    balanceDue: 2575000,
  };

  const accountOptions = [
    {value: 'cash', label: 'Main Cash Counter'},
    {value: 'bank_a', label: 'HDFC Bank - Current (0987)'},
    {value: 'bank_b', label: 'ICICI Bank - RTGS (4321)'},
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleDeliverySubmit = () => {
    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }
    toast.success(
      'Delivery marked as delivered! Invoice created successfully.',
    );
    setTimeout(() => {
      navigate({to: '/bookdelivery/bookings-delivery'});
    }, 1500);
  };

  const handleCutDeliverySubmit = () => {
    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }
    if (!settlementAmount) {
      toast.error('Please enter settlement amount');
      return;
    }
    toast.success('Cut delivery executed successfully!');
    setTimeout(() => {
      navigate({to: '/bookdelivery/bookings-delivery'});
    }, 1500);
  };

  const rateDifference =
    (parseInt(currentRate.replace(/,/g, '')) - bookingData.lockedRate) *
    bookingData.totalWeight;
  const isRatePositive =
    parseInt(currentRate.replace(/,/g, '')) > bookingData.lockedRate;

  return (
    <div className="min-h-screen w-full bg-[#f9f9f7]">
      <div className="px-3 py-4 md:px-4 md:py-6">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-6 md:mb-10">
            <div className="mb-2 flex items-center gap-1 text-xs text-[#4f4535] md:gap-2">
              <button
                onClick={() =>
                  navigate({to: '/bookdelivery/bookings-delivery'})
                }
                className="transition-colors hover:text-[#785600]"
              >
                Bookings
              </button>
              <ChevronRight size={12} />
              <span className="font-medium text-[#785600]">
                Delivery & Settlement
              </span>
            </div>
            <h1 className="font-headline text-2xl font-bold tracking-tight text-[#1a1c1b] md:text-4xl lg:text-5xl">
              Delivery & Settlement
            </h1>
            <p className="mt-2 text-sm text-[#4f4535] md:text-base">
              Finalize delivery terms or execute cut delivery for pending
              booking.
            </p>
          </div>

          {/* Booking Details Section */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:mb-12 md:grid-cols-3 md:gap-6">
            {/* Main Info Card */}
            <div className="relative overflow-hidden rounded-xl border border-[#d3c4af]/10 bg-white p-5 shadow-sm md:col-span-2 md:p-8">
              <div className="absolute right-0 top-0 p-4 opacity-5 md:p-8">
                <MdReceiptLong size={120} className="text-7xl md:text-9xl" />
              </div>
              <div className="relative z-10 mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row md:mb-8">
                <div>
                  <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#785600] md:text-sm">
                    Customer
                  </h2>
                  <p className="font-headline text-xl font-bold text-[#1a1c1b] md:text-2xl">
                    {bookingData.customerName}
                  </p>
                  <p className="mt-1 text-xs text-[#4f4535] md:text-sm">
                    {bookingData.bookingId}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-flex items-center rounded-full bg-[#eae2d2] px-2 py-1 text-[10px] font-medium text-[#4b463b] md:px-3 md:py-1 md:text-xs">
                    {bookingData.status}
                  </span>
                </div>
              </div>
              <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-[#d3c4af]/15 pt-4 sm:grid-cols-4 md:gap-6 md:pt-6">
                <div>
                  <p className="mb-1 text-[10px] text-[#4f4535] md:text-xs">
                    Booking Date
                  </p>
                  <p className="text-xs font-medium text-[#1a1c1b] md:text-sm">
                    {bookingData.bookingDate}
                  </p>
                  <p className="text-[10px] text-[#4f4535] md:text-xs">
                    10:45 AM
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] text-[#4f4535] md:text-xs">
                    Scheduled Delivery
                  </p>
                  <p className="text-xs font-medium text-[#1a1c1b] md:text-sm">
                    {bookingData.scheduledDelivery}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] text-[#4f4535] md:text-xs">
                    Locked Price
                  </p>
                  <p className="text-xs font-medium text-[#1a1c1b] md:text-sm">
                    ₹{bookingData.lockedRate.toLocaleString()}
                    <span className="text-[10px] font-normal text-[#4f4535] md:text-xs">
                      /g
                    </span>
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] text-[#4f4535] md:text-xs">
                    Total Weight
                  </p>
                  <p className="text-xs font-medium text-[#1a1c1b] md:text-sm">
                    {bookingData.totalWeight.toFixed(2)}g
                  </p>
                  <p className="text-[10px] text-[#4f4535] md:text-xs">
                    {bookingData.purity}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="flex flex-col justify-center rounded-xl border border-[#d3c4af]/10 bg-[#eeeeec] p-5 md:p-8">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-medium text-[#4f4535] md:mb-4 md:text-sm">
                <MdAccountBalanceWallet size={16} />
                Financial Overview
              </h3>
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#4f4535] md:text-sm">
                    Total Value
                  </span>
                  <span className="text-xs font-medium text-[#1a1c1b] md:text-sm">
                    {formatCurrency(bookingData.totalValue)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-b border-[#d3c4af]/15 pb-3 md:pb-4">
                  <span className="text-xs text-[#4f4535] md:text-sm">
                    Advance Token
                  </span>
                  <span className="text-xs font-medium text-[#785600] md:text-sm">
                    - {formatCurrency(bookingData.advanceToken)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-2">
                  <span className="text-xs font-semibold text-[#1a1c1b] md:text-sm">
                    Balance Due
                  </span>
                  <span className="font-headline text-xl font-bold text-[#1a1c1b] md:text-2xl">
                    {formatCurrency(bookingData.balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Settlement Options Tabs */}
          <div className="mb-6 flex w-full max-w-xs gap-1 rounded-lg bg-[#eeeeec] p-1 md:mb-8 md:max-w-md">
            <button
              onClick={() => setActiveTab('delivery')}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all md:py-3 md:text-sm ${
                activeTab === 'delivery'
                  ? 'bg-white text-[#785600] shadow-sm'
                  : 'text-[#4f4535] hover:bg-[#e8e8e6]'
              }`}
            >
              Take Delivery
            </button>
            <button
              onClick={() => setActiveTab('cut')}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all md:py-3 md:text-sm ${
                activeTab === 'cut'
                  ? 'bg-white text-[#785600] shadow-sm'
                  : 'text-[#4f4535] hover:bg-[#e8e8e6]'
              }`}
            >
              Cut Delivery
            </button>
          </div>

          {/* Take Delivery Section */}
          {activeTab === 'delivery' && (
            <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
              <div className="rounded-xl border border-[#785600]/20 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#986d00]/20 text-[#785600]">
                    <MdLocalShipping size={16} />
                  </div>
                  <h3 className="font-headline text-lg font-semibold text-[#1a1c1b] md:text-xl">
                    Physical Delivery
                  </h3>
                </div>
                <div className="space-y-6">
                  <div className="rounded-lg bg-[#f4f4f2] p-4">
                    <p className="mb-1 text-xs text-[#4f4535] md:text-sm">
                      Remaining Amount to Collect
                    </p>
                    <p className="font-headline text-2xl font-bold text-[#785600] md:text-3xl">
                      {formatCurrency(bookingData.balanceDue)}
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#4f4535] md:text-sm">
                      Select Account for Collection
                    </label>
                    <div className="relative">
                      <select
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-[#d3c4af]/20 bg-white px-4 py-2.5 text-xs text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/10 md:py-3 md:text-sm"
                      >
                        <option value="" disabled>
                          Choose Account
                        </option>
                        {accountOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <MdExpandMore
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4f4535]"
                        size={16}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#4f4535] md:text-sm">
                      Reference / Cheque No. (Optional)
                    </label>
                    <input
                      type="text"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder="Enter reference details"
                      className="w-full rounded-lg border border-[#d3c4af]/20 bg-white px-4 py-2.5 text-xs text-[#1a1c1b] placeholder:text-[#4f4535]/50 focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/10 md:py-3 md:text-sm"
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleDeliverySubmit}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#785600] to-[#986d00] py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg md:py-4 md:text-base"
                    >
                      <CheckCircle size={16} />
                      Mark as Delivered & Create Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cut Delivery Section */}
          {activeTab === 'cut' && (
            <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
              <div className="rounded-xl border border-[#d3c4af]/15 bg-[#eeeeec] p-6 md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e2e3e1] text-[#4f4535]">
                    <MdContentCut size={16} />
                  </div>
                  <h3 className="font-headline text-lg font-semibold text-[#1a1c1b] md:text-xl">
                    Cut Delivery
                  </h3>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-[#4f4535] md:text-sm">
                        Current Rate (Editable)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#4f4535] md:text-sm">
                          ₹
                        </span>
                        <input
                          type="text"
                          value={currentRate}
                          onChange={(e) => setCurrentRate(e.target.value)}
                          className="w-full rounded-lg border border-[#d3c4af]/20 bg-white py-2.5 pl-7 pr-4 text-xs text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/10 md:py-3 md:text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center rounded-lg bg-[#e2e3e1] p-3">
                      <p className="mb-1 text-[10px] text-[#4f4535] md:text-xs">
                        Locked Rate
                      </p>
                      <p className="text-xs font-medium text-[#1a1c1b] md:text-sm">
                        ₹{bookingData.lockedRate.toLocaleString()} /g
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#f4f4f2] p-4">
                    <div>
                      <p className="mb-1 text-xs text-[#4f4535] md:text-sm">
                        Rate Difference
                      </p>
                      <p className="text-xs font-medium text-[#1a1c1b] md:text-sm">
                        ₹
                        {Math.abs(
                          parseInt(currentRate.replace(/,/g, '')) -
                            bookingData.lockedRate,
                        ).toLocaleString()}{' '}
                        /g × {bookingData.totalWeight}g
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="mb-1 text-[10px] text-[#4f4535] md:text-xs">
                        Customer {isRatePositive ? 'Owes' : 'Gets'}
                      </p>
                      <p
                        className={`font-headline text-base font-bold md:text-xl ${isRatePositive ? 'text-[#ba1a1a]' : 'text-green-600'}`}
                      >
                        {formatCurrency(Math.abs(rateDifference))}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#4f4535] md:text-sm">
                      Settlement Amount Collected
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#4f4535] md:text-sm">
                        ₹
                      </span>
                      <input
                        type="text"
                        value={settlementAmount}
                        onChange={(e) => setSettlementAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full rounded-lg border border-[#d3c4af]/20 bg-white py-2.5 pl-7 pr-4 text-xs text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/10 md:py-3 md:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#4f4535] md:text-sm">
                      Select Account
                    </label>
                    <div className="relative">
                      <select
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-[#d3c4af]/20 bg-white px-4 py-2.5 text-xs text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/10 md:py-3 md:text-sm"
                      >
                        <option value="" disabled>
                          Choose Account
                        </option>
                        {accountOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <MdExpandMore
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4f4535]"
                        size={16}
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleCutDeliverySubmit}
                      className="w-full rounded-full bg-[#e2e3e1] py-3 text-sm font-semibold text-[#45455b] transition-all hover:bg-[#d3d4d2] md:py-4 md:text-base"
                    >
                      Execute Cut Delivery
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .font-headline {
          font-family: 'Noto Serif', serif;
        }
      `}</style>
    </div>
  );
};

export default Settlement;

// import React, {useState} from 'react';
// import {ChevronRight, CheckCircle} from 'lucide-react';
// import {useNavigate} from '@tanstack/react-router';
// import toast from 'react-hot-toast';
// import {
//   MdAccountBalanceWallet,
//   MdContentCut,
//   MdExpandMore,
//   MdLocalShipping,
//   MdReceiptLong,
// } from 'react-icons/md';
// import PageHeader from '../Forms/Common/PageHeader';

// interface BookingDetails {
//   id: string;
//   customerName: string;
//   bookingId: string;
//   status: string;
//   bookingDate: string;
//   scheduledDelivery: string;
//   lockedRate: number;
//   totalWeight: number;
//   purity: string;
//   totalValue: number;
//   advanceToken: number;
//   balanceDue: number;
// }

// const Settlement: React.FC = () => {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState<'delivery' | 'cut'>('delivery');
//   const [selectedAccount, setSelectedAccount] = useState('');
//   const [referenceNo, setReferenceNo] = useState('');
//   const [currentRate, setCurrentRate] = useState('6,200');
//   const [settlementAmount, setSettlementAmount] = useState('');

//   // Mock booking data
//   const bookingData: BookingDetails = {
//     id: 'BKG-2023-089',
//     customerName: 'Aarav Patel Jewellers',
//     bookingId: 'BKG-2023-089',
//     status: 'Pending Delivery',
//     bookingDate: 'Oct 12, 2023',
//     scheduledDelivery: 'Oct 15, 2023',
//     lockedRate: 6150,
//     totalWeight: 500.0,
//     purity: '24K (999)',
//     totalValue: 3075000,
//     advanceToken: 500000,
//     balanceDue: 2575000,
//   };

//   const accountOptions = [
//     {value: 'cash', label: 'Main Cash Counter'},
//     {value: 'bank_a', label: 'HDFC Bank - Current (0987)'},
//     {value: 'bank_b', label: 'ICICI Bank - RTGS (4321)'},
//   ];

//   const formatCurrency = (value: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(value);
//   };

//   const handleDeliverySubmit = () => {
//     if (!selectedAccount) {
//       toast.error('Please select an account');
//       return;
//     }
//     toast.success(
//       'Delivery marked as delivered! Invoice created successfully.',
//     );
//     setTimeout(() => {
//       navigate({to: '/bookdelivery/bookings-delivery'});
//     }, 1500);
//   };

//   const handleCutDeliverySubmit = () => {
//     if (!selectedAccount) {
//       toast.error('Please select an account');
//       return;
//     }
//     if (!settlementAmount) {
//       toast.error('Please enter settlement amount');
//       return;
//     }
//     toast.success('Cut delivery executed successfully!');
//     setTimeout(() => {
//       navigate({to: '/bookdelivery/bookings-delivery'});
//     }, 1500);
//   };

//   const rateDifference =
//     (parseInt(currentRate.replace(/,/g, '')) - bookingData.lockedRate) *
//     bookingData.totalWeight;
//   const isRatePositive =
//     parseInt(currentRate.replace(/,/g, '')) > bookingData.lockedRate;

//   return (
//     <div className="min-h-screen w-full bg-[#f9f9f7]">
//       <div className="px-3 py-4 md:px-4 md:py-6">
//         <div className="mx-auto max-w-7xl">
//           {/* Page Header */}
//           <div className="mb-6 md:mb-10">
//             <div className="mb-2 flex items-center gap-1 text-xs text-[#4f4535] md:gap-2">
//               <button
//                 onClick={() =>
//                   navigate({to: '/bookdelivery/bookings-delivery'})
//                 }
//                 className="transition-colors hover:text-[#785600] text-md"
//               >
//                 Bookings
//               </button>
//               <ChevronRight size={12} />
//             </div>
//             <PageHeader
//               title="Delivery & Settlement"
//               subtitle="Finalize delivery terms or execute cut delivery for pending"
//             />
//           </div>

//           {/* Two Column Layout - Left: Customer Info & Financial, Right: Settlement Options */}
//           <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//             {/* Left Column - Customer Details & Financial Overview */}
//             <div className="space-y-6">
//               {/* Main Info Card */}
//               <div className="relative overflow-hidden rounded-xl border border-[#d3c4af]/10 bg-white p-5 shadow-sm md:p-8">
//                 <div className="absolute right-0 top-0 p-4 opacity-5 md:p-8">
//                   <MdReceiptLong size={120} className="text-7xl md:text-9xl" />
//                 </div>
//                 <div className="relative z-10 mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row md:mb-8">
//                   <div>
//                     <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#785600] md:text-sm">
//                       Customer
//                     </h2>
//                     <p className="font-headline text-xl font-bold text-[#1a1c1b] md:text-2xl">
//                       {bookingData.customerName}
//                     </p>
//                     <p className="mt-1 text-xs text-[#4f4535] md:text-sm">
//                       {bookingData.bookingId}
//                     </p>
//                   </div>
//                   <div className="text-left sm:text-right">
//                     <span className="inline-flex items-center rounded-full bg-[#eae2d2] px-2 py-1 text-[10px] font-medium text-[#4b463b] md:px-3 md:py-1 md:text-xs">
//                       {bookingData.status}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-[#d3c4af]/15 pt-4 sm:grid-cols-4 md:gap-6 md:pt-6">
//                   <div>
//                     <p className="mb-1 text-[10px] text-[#4f4535] md:text-xs">
//                       Booking Date
//                     </p>
//                     <p className="text-xs font-medium text-[#1a1c1b] md:text-sm">
//                       {bookingData.bookingDate}
//                     </p>
//                     <p className="text-[10px] text-[#4f4535] md:text-xs">
//                       10:45 AM
//                     </p>
//                   </div>
//                   <div>
//                     <p className="mb-1 text-[10px] text-[#4f4535] md:text-xs">
//                       Scheduled Delivery
//                     </p>
//                     <p className="text-xs font-medium text-[#1a1c1b] md:text-sm">
//                       {bookingData.scheduledDelivery}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="mb-1 text-[10px] text-[#4f4535] md:text-xs">
//                       Locked Price
//                     </p>
//                     <p className="text-xs font-medium text-[#1a1c1b] md:text-sm">
//                       ₹{bookingData.lockedRate.toLocaleString()}
//                       <span className="text-[10px] font-normal text-[#4f4535] md:text-xs">
//                         /g
//                       </span>
//                     </p>
//                   </div>
//                   <div>
//                     <p className="mb-1 text-[10px] text-[#4f4535] md:text-xs">
//                       Total Weight
//                     </p>
//                     <p className="text-xs font-medium text-[#1a1c1b] md:text-sm">
//                       {bookingData.totalWeight.toFixed(2)}g
//                     </p>
//                     <p className="text-[10px] text-[#4f4535] md:text-xs">
//                       {bookingData.purity}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Financial Summary Card */}
//               <div className="flex flex-col justify-center rounded-xl border border-[#d3c4af]/10 bg-[#eeeeec] p-5 md:p-8">
//                 <h3 className="mb-3 flex items-center gap-2 text-xs font-medium text-[#4f4535] md:mb-4 md:text-sm">
//                   <MdAccountBalanceWallet size={16} />
//                   Financial Overview
//                 </h3>
//                 <div className="space-y-3 md:space-y-4">
//                   <div className="flex items-baseline justify-between">
//                     <span className="text-xs text-[#4f4535] md:text-sm">
//                       Total Value
//                     </span>
//                     <span className="text-xs font-medium text-[#1a1c1b] md:text-sm">
//                       {formatCurrency(bookingData.totalValue)}
//                     </span>
//                   </div>
//                   <div className="flex items-baseline justify-between border-b border-[#d3c4af]/15 pb-3 md:pb-4">
//                     <span className="text-xs text-[#4f4535] md:text-sm">
//                       Advance Token
//                     </span>
//                     <span className="text-xs font-medium text-[#785600] md:text-sm">
//                       - {formatCurrency(bookingData.advanceToken)}
//                     </span>
//                   </div>
//                   <div className="flex items-baseline justify-between pt-2">
//                     <span className="text-xs font-semibold text-[#1a1c1b] md:text-sm">
//                       Balance Due
//                     </span>
//                     <span className="font-headline text-xl font-bold text-[#1a1c1b] md:text-2xl">
//                       {formatCurrency(bookingData.balanceDue)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Right Column - Settlement Options */}
//             <div className="space-y-6">
//               {/* Settlement Options Tabs */}
//               <div className="flex w-full gap-1 rounded-lg bg-[#eeeeec] p-1">
//                 <button
//                   onClick={() => setActiveTab('delivery')}
//                   className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all md:py-3 md:text-sm ${
//                     activeTab === 'delivery'
//                       ? 'bg-white text-[#785600] shadow-sm'
//                       : 'text-[#4f4535] hover:bg-[#e8e8e6]'
//                   }`}
//                 >
//                   Take Delivery
//                 </button>
//                 <button
//                   onClick={() => setActiveTab('cut')}
//                   className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all md:py-3 md:text-sm ${
//                     activeTab === 'cut'
//                       ? 'bg-white text-[#785600] shadow-sm'
//                       : 'text-[#4f4535] hover:bg-[#e8e8e6]'
//                   }`}
//                 >
//                   Cut Delivery
//                 </button>
//               </div>

//               {/* Take Delivery Section */}
//               {activeTab === 'delivery' && (
//                 <div className="rounded-xl border border-[#785600]/20 bg-white p-6 shadow-sm md:p-8">
//                   <div className="mb-6 flex items-center gap-3">
//                     <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#986d00]/20 text-[#785600]">
//                       <MdLocalShipping size={16} />
//                     </div>
//                     <h3 className="font-headline text-lg font-semibold text-[#1a1c1b] md:text-xl">
//                       Physical Delivery
//                     </h3>
//                   </div>
//                   <div className="space-y-6">
//                     <div className="rounded-lg bg-[#f4f4f2] p-4">
//                       <p className="mb-1 text-xs text-[#4f4535] md:text-sm">
//                         Remaining Amount to Collect
//                       </p>
//                       <p className="font-headline text-2xl font-bold text-[#785600] md:text-3xl">
//                         {formatCurrency(bookingData.balanceDue)}
//                       </p>
//                     </div>
//                     <div>
//                       <label className="mb-2 block text-xs font-medium text-[#4f4535] md:text-sm">
//                         Select Account for Collection
//                       </label>
//                       <div className="relative">
//                         <select
//                           value={selectedAccount}
//                           onChange={(e) => setSelectedAccount(e.target.value)}
//                           className="w-full appearance-none rounded-lg border border-[#d3c4af]/20 bg-white px-4 py-2.5 text-xs text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/10 md:py-3 md:text-sm"
//                         >
//                           <option value="" disabled>
//                             Choose Account
//                           </option>
//                           {accountOptions.map((opt) => (
//                             <option key={opt.value} value={opt.value}>
//                               {opt.label}
//                             </option>
//                           ))}
//                         </select>
//                         <MdExpandMore
//                           className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4f4535]"
//                           size={16}
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="mb-2 block text-xs font-medium text-[#4f4535] md:text-sm">
//                         Reference / Cheque No. (Optional)
//                       </label>
//                       <input
//                         type="text"
//                         value={referenceNo}
//                         onChange={(e) => setReferenceNo(e.target.value)}
//                         placeholder="Enter reference details"
//                         className="w-full rounded-lg border border-[#d3c4af]/20 bg-white px-4 py-2.5 text-xs text-[#1a1c1b] placeholder:text-[#4f4535]/50 focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/10 md:py-3 md:text-sm"
//                       />
//                     </div>
//                     <div className="pt-4">
//                       <button
//                         onClick={handleDeliverySubmit}
//                         className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#785600] to-[#986d00] py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg md:py-4 md:text-base"
//                       >
//                         <CheckCircle size={16} />
//                         Mark as Delivered & Create Invoice
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Cut Delivery Section */}
//               {activeTab === 'cut' && (
//                 <div className="rounded-xl border border-[#d3c4af]/15 bg-[#eeeeec] p-6 md:p-8">
//                   <div className="mb-6 flex items-center gap-3">
//                     <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e2e3e1] text-[#4f4535]">
//                       <MdContentCut size={16} />
//                     </div>
//                     <h3 className="font-headline text-lg font-semibold text-[#1a1c1b] md:text-xl">
//                       Cut Delivery
//                     </h3>
//                   </div>
//                   <div className="space-y-6">
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="mb-2 block text-xs font-medium text-[#4f4535] md:text-sm">
//                           Current Rate (Editable)
//                         </label>
//                         <div className="relative">
//                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#4f4535] md:text-sm">
//                             ₹
//                           </span>
//                           <input
//                             type="text"
//                             value={currentRate}
//                             onChange={(e) => setCurrentRate(e.target.value)}
//                             className="w-full rounded-lg border border-[#d3c4af]/20 bg-white py-2.5 pl-7 pr-4 text-xs text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/10 md:py-3 md:text-sm"
//                           />
//                         </div>
//                       </div>
//                       <div className="flex flex-col justify-center rounded-lg bg-[#e2e3e1] p-3">
//                         <p className="mb-1 text-[10px] text-[#4f4535] md:text-xs">
//                           Locked Rate
//                         </p>
//                         <p className="text-xs font-medium text-[#1a1c1b] md:text-sm">
//                           ₹{bookingData.lockedRate.toLocaleString()} /g
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center justify-between rounded-lg bg-[#f4f4f2] p-4">
//                       <div>
//                         <p className="mb-1 text-xs text-[#4f4535] md:text-sm">
//                           Rate Difference
//                         </p>
//                         <p className="text-xs font-medium text-[#1a1c1b] md:text-sm">
//                           ₹
//                           {Math.abs(
//                             parseInt(currentRate.replace(/,/g, '')) -
//                               bookingData.lockedRate,
//                           ).toLocaleString()}{' '}
//                           /g × {bookingData.totalWeight}g
//                         </p>
//                       </div>
//                       <div className="text-right">
//                         <p className="mb-1 text-[10px] text-[#4f4535] md:text-xs">
//                           Customer {isRatePositive ? 'Owes' : 'Gets'}
//                         </p>
//                         <p
//                           className={`font-headline text-base font-bold md:text-xl ${isRatePositive ? 'text-[#ba1a1a]' : 'text-green-600'}`}
//                         >
//                           {formatCurrency(Math.abs(rateDifference))}
//                         </p>
//                       </div>
//                     </div>
//                     <div>
//                       <label className="mb-2 block text-xs font-medium text-[#4f4535] md:text-sm">
//                         Settlement Amount Collected
//                       </label>
//                       <div className="relative">
//                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#4f4535] md:text-sm">
//                           ₹
//                         </span>
//                         <input
//                           type="text"
//                           value={settlementAmount}
//                           onChange={(e) => setSettlementAmount(e.target.value)}
//                           placeholder="Enter amount"
//                           className="w-full rounded-lg border border-[#d3c4af]/20 bg-white py-2.5 pl-7 pr-4 text-xs text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/10 md:py-3 md:text-sm"
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="mb-2 block text-xs font-medium text-[#4f4535] md:text-sm">
//                         Select Account
//                       </label>
//                       <div className="relative">
//                         <select
//                           value={selectedAccount}
//                           onChange={(e) => setSelectedAccount(e.target.value)}
//                           className="w-full appearance-none rounded-lg border border-[#d3c4af]/20 bg-white px-4 py-2.5 text-xs text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/10 md:py-3 md:text-sm"
//                         >
//                           <option value="" disabled>
//                             Choose Account
//                           </option>
//                           {accountOptions.map((opt) => (
//                             <option key={opt.value} value={opt.value}>
//                               {opt.label}
//                             </option>
//                           ))}
//                         </select>
//                         <MdExpandMore
//                           className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4f4535]"
//                           size={16}
//                         />
//                       </div>
//                     </div>
//                     <div className="pt-4">
//                       <button
//                         onClick={handleCutDeliverySubmit}
//                         className="w-full rounded-full bg-[#e2e3e1] py-3 text-sm font-semibold text-[#45455b] transition-all hover:bg-[#d3d4d2] md:py-4 md:text-base"
//                       >
//                         Execute Cut Delivery
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         .font-headline {
//           font-family: 'Noto Serif', serif;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Settlement;
