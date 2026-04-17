// Reports.tsx - Complete Reports Page with Category Sidebar matching HTML exactly
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

// Report categories configuration matching HTML exactly
const reportCategories = [
  {
    id: 'sales',
    label: 'Sales Report',
    icon: <FaSellcast className="h-5 w-5" />,
    badge: 12,
  },
  {
    id: 'purchase',
    label: 'Purchase',
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {id: 'booking', label: 'Booking', icon: <Calendar className="h-5 w-5" />},
  {
    id: 'pendingDelivery',
    label: 'Pending Delivery',
    icon: <Truck className="h-5 w-5" />,
    badge: 3,
  },
  {id: 'stock', label: 'Stock', icon: <MdInventory2 className="h-5 w-5" />},
  {
    id: 'clientLedger',
    label: 'Client Ledger',
    icon: <MdContactPage className="h-5 w-5" />,
  },
  {id: 'separator1', label: '', icon: null, isSeparator: true},
  {id: 'cashbook', label: 'Cashbook', icon: <MdPayments className="h-5 w-5" />},
  {
    id: 'bankbook',
    label: 'Bankbook',
    icon: <MdAccountBalance className="h-5 w-5" />,
  },
  {id: 'gst', label: 'GST Report', icon: <MdReceipt className="h-5 w-5" />},
  {
    id: 'karigar',
    label: 'Karigar',
    icon: <MdEngineering className="h-5 w-5" />,
  },
  {id: 'pl', label: 'P&L Statement', icon: <BarChart3 className="h-5 w-5" />},
  {
    id: 'pendingDues',
    label: 'Pending Dues',
    icon: <MdHourglassEmpty className="h-5 w-5" />,
    badge: 7,
  },
];

// Sidebar Category Item Component - No padding/margin, darker text
function SidebarCategoryItem({
  category,
  isActive,
  onClick,
}: {
  category: (typeof reportCategories)[0];
  isActive: boolean;
  onClick: () => void;
}) {
  if (category.isSeparator) {
    return (
      <div className="my-1">
        <div className="h-px w-full bg-[#d3c4af]/20"></div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
        isActive
          ? 'border-l-3 border-[#B8860B] bg-[#B8860B]/15 font-semibold text-[#B8860B]'
          : 'text-[#4a4a4a] hover:bg-[#f0f0f0] hover:text-[#1a1a1a]'
      }`}
    >
      <span className="text-lg">{category.icon}</span>
      <span className="font-['DM_Sans'] text-sm">{category.label}</span>
      {category.badge && (
        <span className="ml-auto rounded-full bg-[#B8860B]/15 px-2 py-0.5 text-xs font-semibold text-[#B8860B]">
          {category.badge}
        </span>
      )}
    </button>
  );
}

// Left Sidebar Component - No extra padding/margin
function LeftSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-[#e0e0e0] bg-white shadow-sm">
      <div className="px-5 py-5">
        <h1 className="font-['Noto_Serif'] text-xl font-bold text-[#1a1a1a]">
          BullionPro
        </h1>
        <p className="mt-1 text-[11px] uppercase tracking-wider text-[#666666]">
          The Digital Goldsmith
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-0.5">
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#4a4a4a] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
          >
            <MdPayments className="h-5 w-5" />
            <span className="font-['DM_Sans']">Sales</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#4a4a4a] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-['DM_Sans']">Purchase</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg bg-[#B8860B]/10 px-3 py-2.5 text-sm font-semibold text-[#B8860B]"
          >
            <MdInventory2 className="h-5 w-5" />
            <span className="font-['DM_Sans']">Stock</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#4a4a4a] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
          >
            <MdContactPage className="h-5 w-5" />
            <span className="font-['DM_Sans']">Client Ledger</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#4a4a4a] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
          >
            <MdEngineering className="h-5 w-5" />
            <span className="font-['DM_Sans']">Karigar</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#4a4a4a] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-['DM_Sans']">P&amp;L</span>
          </a>
          <div className="my-2 h-px bg-[#e0e0e0]"></div>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#4a4a4a] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
          >
            <FileText className="h-5 w-5" />
            <span className="font-['DM_Sans']">Settings</span>
          </a>
        </div>
      </nav>
      <div className="border-t border-[#e0e0e0] p-4">
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#4a4a4a] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
        >
          <Users className="h-5 w-5" />
          <span className="font-['DM_Sans']">Support</span>
        </a>
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-[#f9f9f9] px-3 py-2">
          <img
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover"
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
          />
          <div>
            <p className="text-sm font-medium text-[#1a1a1a]">Aditya Verma</p>
            <p className="text-[11px] text-[#888888]">Master Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

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
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Left Sidebar */}
      <LeftSidebar />

      {/* Main Content Area */}
      <main className="mt-0 min-h-screen p-6">
        {/* Reports Header Section */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight text-[#1a1c1b]">
              Reports Console
            </h2>
            <p className="mt-1 text-sm text-[#666666]">
              Real-time valuation and logistics of precious metal holdings.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white p-1.5 shadow-sm">
            <div className="flex flex-col border-r border-[#e0e0e0] px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">
                Last Updated
              </span>
              <span className="text-sm font-semibold text-[#1a1a1a]">
                {new Date().toLocaleTimeString()}, Today
              </span>
            </div>
            <button className="rounded-full p-1.5 text-[#B8860B] transition-colors hover:bg-[#f5f5f5]">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Reports Body Section - Category Sidebar + Content */}
        <div className="flex gap-5">
          {/* Left Sidebar - Report Categories */}
          <aside className="w-56 flex-shrink-0 rounded-xl bg-white p-3 shadow-sm">
            <p className="mb-2 px-2 font-['DM_Sans'] text-[10px] font-bold uppercase tracking-wider text-[#888888]">
              Report Category
            </p>
            <nav className="space-y-0.5">
              {reportCategories.map((category) => (
                <SidebarCategoryItem
                  key={category.id}
                  category={category}
                  isActive={activeReport === category.id}
                  onClick={() => setActiveReport(category.id)}
                />
              ))}
            </nav>
          </aside>

          {/* Main Content Area - Reports */}
          <div className="min-w-0 flex-1">{renderReportContent()}</div>
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
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
          font-size: 20px;
        }
      `}</style>
    </div>
  );
}
