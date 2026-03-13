import React, {useState} from 'react';
import {
  MdArrowBack,
  MdHelpOutline,
  MdReceiptLong,
  MdPictureAsPdf,
  MdTableView,
  MdCandlestickChart,
  MdPieChart,
  MdAccountBalanceWallet,
  MdAssessment,
} from 'react-icons/md';

const Report: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'month' | 'custom'>('today');

  return (
    <div className="flex min-h-screen justify-center bg-[#132210]">
      <div className="text-gray-100 relative flex min-h-screen w-full flex-col overflow-hidden bg-[#000000]">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[rgba(55,236,19,0.2)] bg-[rgba(0,0,0,0.95)] px-4 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Reports Hub
            </h1>
          </div>
          <button className="rounded-full p-2 transition-colors hover:bg-[rgba(55,236,19,0.1)]">
            <MdHelpOutline className="text-xl text-[#37ec13]" />
          </button>
        </header>

        <main className="w-full flex-1 space-y-8 px-4 py-3 pb-32">
          <section className="group relative overflow-hidden rounded-2xl border border-[rgba(55,236,19,0.2)] bg-[#0a0a0a] p-6 shadow-[0_0_25px_rgba(55,236,19,0.08)]">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[rgba(55,236,19,0.1)] blur-3xl transition-all duration-500 group-hover:bg-[rgba(55,236,19,0.2)]"></div>

            <div className="relative z-10">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(55,236,19,0.8)]">
                    Fiscal Snapshot
                  </p>
                  <h2 className="text-gray-400 mt-1 text-sm">
                    Total Transaction Value
                  </h2>
                </div>

                <span className="rounded border border-[rgba(55,236,19,0.2)] bg-[rgba(55,236,19,0.1)] px-2 py-1 text-[10px] font-bold uppercase text-[#37ec13]">
                  FY 23-24
                </span>
              </div>

              <div>
                <span className="text-4xl font-bold tracking-tighter text-white">
                  ₹ 14,82,500
                  <span className="text-gray-600 text-xl">.00</span>
                </span>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <label className="text-gray-500 ml-1 text-[10px] font-bold uppercase tracking-widest">
              Reporting Period
            </label>

            <div className="flex items-center rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#0a0a0a] p-1">
              <button
                onClick={() => setPeriod('today')}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
                  period === 'today'
                    ? 'bg-[#37ec13] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Today
              </button>

              <button
                onClick={() => setPeriod('month')}
                className={`flex-1 rounded-lg py-2.5 text-xs transition-all ${
                  period === 'month'
                    ? 'bg-[#37ec13] font-bold text-black shadow-sm'
                    : 'text-gray-400 font-medium hover:text-white'
                }`}
              >
                This Month
              </button>

              <button
                onClick={() => setPeriod('custom')}
                className={`flex-1 rounded-lg py-2.5 text-xs transition-all ${
                  period === 'custom'
                    ? 'bg-[#37ec13] font-bold text-black shadow-sm'
                    : 'text-gray-400 font-medium hover:text-white'
                }`}
              >
                Custom
              </button>
            </div>
          </section>

          <section>
            <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#0a0a0a] p-6 transition-all hover:border-[rgba(55,236,19,0.4)]">
              <div className="mb-8 flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(55,236,19,0.2)] bg-[rgba(55,236,19,0.1)]">
                  <MdReceiptLong className="text-3xl text-[#37ec13]" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    All Transactions Report
                  </h3>
                  <p className="text-gray-500 mt-1 text-xs leading-relaxed">
                    Download a comprehensive log of every gold and digital asset
                    trade within the selected period.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#111111] py-4 text-xs font-semibold text-white transition-all hover:border-[rgba(55,236,19,0.3)]">
                  <MdPictureAsPdf className="text-xl text-red-500" />
                  Export as PDF
                </button>

                <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#111111] py-4 text-xs font-semibold text-white transition-all hover:border-[rgba(55,236,19,0.3)]">
                  <MdTableView className="text-xl text-green-500" />
                  Export as CSV/Excel
                </button>
              </div>

              <div className="mt-8 border-t border-[rgba(255,255,255,0.05)] pt-6">
                <div className="text-gray-500 flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-widest">
                  <span>Last Generated</span>
                  <span className="text-gray-400">10 mins ago</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Report;
