// Reports.tsx - Complete Reports Page with Tab-style navigation matching Billing design
import React, {useState} from 'react';
import {
  ShoppingCart,
  Calendar,
  Truck,
  BarChart3,
  FileText,
  Users,
  RefreshCw,
} from 'lucide-react';
import {FaSellcast} from 'react-icons/fa';
import {
  MdAccountBalance,
  MdContactPage,
  MdEngineering,
  MdHourglassEmpty,
  MdInventory2,
  MdPayments,
  MdReceipt,
} from 'react-icons/md';
import SalesReport from '@/pages/reports/SalesReport';
import StockReport from '@/pages/reports/StockReport';
import GSTReport from '@/pages/reports/GSTReport';
import ClientLedgerReport from '@/pages/reports/ClientLedgerReport';
import PLReport from '@/pages/reports/PLReport';
import PageHeader from '../Forms/Common/PageHeader';
import BookingReport from '@/pages/reports/BookingReport';

// Report categories configuration
const reportCategories = [
  {
    id: 'sales',
    label: 'Sales Report',
    icon: <FaSellcast className="h-4 w-4" />,
  },
  {
    id: 'purchase',
    label: 'Purchase',
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  {id: 'booking', label: 'Booking', icon: <Calendar className="h-4 w-4" />},
  {
    id: 'pendingDelivery',
    label: 'Pending Delivery',
    icon: <Truck className="h-4 w-4" />,
  },
  {id: 'stock', label: 'Stock', icon: <MdInventory2 className="h-4 w-4" />},
  {
    id: 'clientLedger',
    label: 'Client Ledger',
    icon: <MdContactPage className="h-4 w-4" />,
  },
  {id: 'cashbook', label: 'Cashbook', icon: <MdPayments className="h-4 w-4" />},
  {
    id: 'bankbook',
    label: 'Bankbook',
    icon: <MdAccountBalance className="h-4 w-4" />,
  },
  {id: 'gst', label: 'GST Report', icon: <MdReceipt className="h-4 w-4" />},
  {
    id: 'karigar',
    label: 'Karigar',
    icon: <MdEngineering className="h-4 w-4" />,
  },
  {id: 'pl', label: 'P&L Statement', icon: <BarChart3 className="h-4 w-4" />},
  {
    id: 'pendingDues',
    label: 'Pending Dues',
    icon: <MdHourglassEmpty className="h-4 w-4" />,
  },
];

// Main Reports Component
export default function Reports() {
  const [activeReport, setActiveReport] = useState('sales');

  const renderReportContent = () => {
    switch (activeReport) {
      case 'sales':
        return <SalesReport />;
      case 'stock':
        return <StockReport />;
      case 'gst':
        return <GSTReport />;
      case 'clientLedger':
        return <ClientLedgerReport />;
      case 'pl':
        return <PLReport />;
      case 'booking':
        return <BookingReport />;
      default:
        return (
          <div className="flex min-h-[60vh] flex-1 items-center justify-center">
            <div className="text-center">
              <BarChart3 className="mx-auto mb-4 h-16 w-16 text-[#4f4535]/30" />
              <h3 className="font-headline text-lg font-semibold text-[#1a1c1b]">
                {reportCategories.find((c) => c.id === activeReport)?.label}{' '}
                Report
              </h3>
              <p className="mt-2 text-sm text-[#4f4535]">
                Report module under development
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      <main className="min-h-screen">
        {/* Header Section */}
        <div className="bg-[#f9f9f7] px-4 py-4 md:px-6 lg:px-8">
          <PageHeader
            title="Reports Console"
            subtitle="Comprehensive analytics and transaction reports"
          />
        </div>

        <div className="px-4 pb-8 md:px-6 lg:px-8">
          {/* Single Tab-style Navigation Row */}
          <div className="mb-6 rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm md:p-6">
            <div className="flex flex-wrap gap-2">
              {reportCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveReport(category.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all md:gap-2 md:px-5 md:py-2 md:text-sm ${
                    activeReport === category.id
                      ? 'bg-[#785600] text-white shadow-md'
                      : 'bg-[#f4f4f2] text-[#4f4535] hover:bg-[#e8e8e6]'
                  }`}
                >
                  {category.icon}
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Report Content */}
          <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm md:p-6">
            {renderReportContent()}
          </div>
        </div>
      </main>

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
        }
      `}</style>
    </div>
  );
}
