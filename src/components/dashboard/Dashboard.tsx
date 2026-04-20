import React, {useState} from 'react';
import {SummaryView} from './view/SummaryView';
import {DetailedDayBookView} from './view/DetailsDayBookView';
import {LayoutDashboard, BookOpen} from 'lucide-react';

const TABS = [
  {id: 'summary', label: 'Summary', Icon: LayoutDashboard},
  {id: 'detailed', label: 'Day Book', Icon: BookOpen},
] as const;

type TabId = (typeof TABS)[number]['id'];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  return (
    <div className="min-h-screen w-full">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-[#D3C4AF]/30 bg-[#F9F9F7]/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
            {/* Title */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4F4535]">
                Gold Management
              </p>
              <h1 className="mt-10 text-2xl font-bold leading-tight text-[#1A1C1B] md:mt-0">
                Dashboard
              </h1>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1 self-start rounded-xl border border-[#D3C4AF]/35 bg-white p-1 shadow-sm sm:self-auto">
              {TABS.map(({id, label, Icon}) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={[
                    'flex items-center gap-2 rounded-lg px-5 py-2.5 text-base font-semibold transition-all duration-200',
                    activeTab === id
                      ? 'bg-[#785600] text-white shadow-md shadow-[#785600]/30'
                      : 'text-[#817563] hover:bg-[#F4F4F2] hover:text-[#1A1C1B]',
                  ].join(' ')}
                >
                  <Icon size={15} />
                  <span className="xs:inline hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'summary' ? <SummaryView /> : <DetailedDayBookView />}
      </div>
    </div>
  );
};

export default Dashboard;
