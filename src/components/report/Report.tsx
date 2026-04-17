// Reports.tsx - Main Reports Page with Category Sidebar matching HTML exactly
import React, {useState} from 'react';
import PageHeader from '@/components/Forms/Common/PageHeader';
import {
  TrendingUp,
  ShoppingCart,
  Calendar,
  Truck,
  Package,
  Users,
  Wallet,
  Building2,
  FileText,
  Wrench,
  BarChart3,
  Clock,
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
  {id: 'separator', label: '', icon: null, isSeparator: true},
  {id: 'cashbook', label: 'Cashbook', icon: <MdPayments className="h-5 w-5" />},
  {
    id: 'bankbook',
    label: 'Bankbook',
    icon: <MdAccountBalance className="h-5 w-5" />,
  },
  {id: 'gst', label: 'GST', icon: <MdReceipt className="h-5 w-5" />},
  {
    id: 'karigar',
    label: 'Karigar',
    icon: <MdEngineering className="h-5 w-5" />,
  },
  {id: 'pl', label: 'P&L', icon: <BarChart3 className="h-5 w-5" />},
  {
    id: 'pendingDues',
    label: 'Pending Dues',
    icon: <MdHourglassEmpty className="h-5 w-5" />,
    badge: 7,
  },
];

// Sidebar Category Item Component matching HTML exactly
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
      <div className="py-2">
        <div className="bg-outline-variant/10 h-px w-full"></div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
        isActive
          ? 'bg-surface-container-lowest border-l-4 border-primary font-bold text-primary shadow-sm'
          : 'text-on-surface-variant hover:bg-surface-container-low'
      }`}
    >
      <span
        className={`text-xl ${isActive ? 'text-primary' : 'group-hover:text-primary'}`}
      >
        {category.icon}
      </span>
      <span className="text-sm font-medium">{category.label}</span>
      {category.badge && (
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
          {category.badge}
        </span>
      )}
    </button>
  );
}

export default function Reports() {
  const [activeReport, setActiveReport] = useState('sales');

  const renderReportContent = () => {
    switch (activeReport) {
      case 'sales':
        return <SalesReport />;
      default:
        return (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <BarChart3 className="text-on-surface-variant/30 mx-auto mb-4 h-16 w-16" />
              <h3 className="text-on-surface text-lg font-semibold">
                {reportCategories.find((c) => c.id === activeReport)?.label}{' '}
                Report
              </h3>
              <p className="text-on-surface-variant mt-2 text-sm">
                Report module under development
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="p-6 lg:p-8">
        {/* Reports Body Section - Matching HTML layout exactly */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left Sidebar - Report Categories matching HTML exactly */}
          <aside className="flex w-64 flex-col gap-1">
            <p className="text-on-surface-variant/40 mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.2em]">
              Report Category
            </p>
            <nav className="space-y-1">
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

          {/* Main Content Area */}
          {renderReportContent()}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
