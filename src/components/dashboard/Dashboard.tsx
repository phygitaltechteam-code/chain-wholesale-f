import React, { useState } from 'react';
import { SummaryView } from './view/SummaryView';
import { DetailedDayBookView } from './view/DetailsDayBookView';
import { LayoutDashboard, BookOpen } from 'lucide-react';

const TABS = [
  { id: 'summary',  label: 'Summary',  Icon: LayoutDashboard },
  { id: 'detailed', label: 'Day Book', Icon: BookOpen },
] as const;

type TabId = typeof TABS[number]['id'];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  return (
    <div className="min-h-screen w-full">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#F9F9F7]/90 backdrop-blur-xl border-b border-[#D3C4AF]/30 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
            {/* Title */}
            <div>
              <p className="text-xs font-semibold text-[#4F4535] uppercase tracking-[0.2em]">
                Gold Management
              </p>
              <h1 className="text-2xl font-bold text-[#1A1C1B] leading-tight mt-10 md:mt-0">
                Dashboard
              </h1>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center bg-white border border-[#D3C4AF]/35 rounded-xl p-1 gap-1 self-start sm:self-auto shadow-sm">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={[
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-all duration-200',
                    activeTab === id
                      ? 'bg-[#785600] text-white shadow-md shadow-[#785600]/30'
                      : 'text-[#817563] hover:text-[#1A1C1B] hover:bg-[#F4F4F2]',
                  ].join(' ')}
                >
                  <Icon size={15} />
                  <span className="hidden xs:inline sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'summary' ? <SummaryView /> : <DetailedDayBookView />}
      </div>
    </div>
  );
};

export default Dashboard;
