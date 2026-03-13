import {useNavigate} from '@tanstack/react-router';
import React, {useState} from 'react';
import {
  MdArrowDropDown,
  MdArrowDropUp,
  MdClose,
  MdMenu,
  MdNotifications,
  MdSearch,
  MdShowChart,
  MdTrendingDown,
  MdTrendingUp,
  MdTune,
} from 'react-icons/md';

const ALL_INSTRUMENTS = [
  {
    name: 'GOLD-26MAR-FUT',
    market: 'MCX',
    sub: 'Exp: 26 Mar 2024',
    price: '59,240.00',
    change: '0.45%',
    up: true,
  },
  {
    name: 'GOLD-05JUN-FUT',
    market: 'MCX',
    sub: 'Exp: 05 Jun 2024',
    price: '59,810.00',
    change: '0.32%',
    up: true,
  },
  {
    name: 'SILVER-05MAR-FUT',
    market: 'MCX',
    sub: 'Exp: 05 Mar 2024',
    price: '71,450.00',
    change: '0.12%',
    up: false,
  },
  {
    name: "GCJ4 (Apr '24)",
    market: 'COMEX',
    sub: 'Volume: 125K',
    price: '2,054.30',
    change: '1.15%',
    up: true,
  },
  {
    name: "GCM4 (Jun '24)",
    market: 'COMEX',
    sub: 'Volume: 45K',
    price: '2,068.10',
    change: '1.08%',
    up: true,
  },
];

const Market: React.FC = () => {
  const navigate = useNavigate();
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Display selected ones, or all if nothing is selected
  const displayedInstruments =
    selectedInstruments.length === 0
      ? ALL_INSTRUMENTS
      : ALL_INSTRUMENTS.filter((item) =>
          selectedInstruments.includes(item.name),
        );

  return (
    <div className="flex min-h-screen justify-center bg-[#050a05] font-[Inter] text-white">
      {/* Mobile Frame */}
      <div className="relative flex min-h-screen w-full flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-[#050a05] px-5 py-4">
          <div className="flex items-center gap-3">
            <button className="rounded-full p-2 hover:bg-[#102210]">
              <MdMenu className="text-gray-400 text-xl" />
            </button>
            <h1 className="text-xl font-bold">Asset Universe</h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="text-[#0df20d]">
              <MdNotifications className="text-xl" />
            </button>

            <div
              onClick={() => {
                navigate({to: '/profile'});
              }}
              className="h-8 w-8 cursor-pointer rounded-full border border-[#0df20d]/40 bg-[#102210]"
            />
          </div>
        </header>

        {/* Search - now opens modal */}
        <div className="px-5 pb-4 pt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MdSearch className="text-gray-500 absolute left-3 top-3" />

              <input
                readOnly
                placeholder="Search Symbol, ISIN... (tap to select)"
                // value={
                //   selectedInstruments.length > 0
                //     ? `${selectedInstruments.length} selected`
                //     : ""
                // }
                onClick={() => setShowSearchModal(true)}
                className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#0a140a] py-3 pl-10 pr-4 text-sm focus:border-[#0df20d]"
              />
            </div>

            <button className="rounded-lg border border-white/10 bg-[#0a140a] px-3">
              <MdTune />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="overflow-x-auto px-5 pb-2">
          <div className="flex gap-2 border-b border-white/10 text-xs">
            <button className="border-b-2 border-[#0df20d] pb-3 font-semibold text-[#0df20d]">
              Derivatives (Futures)
            </button>
            <button className="text-gray-400 pb-3">Spot Gold</button>
            <button className="text-gray-400 pb-3">ETFs</button>
            <button className="text-gray-400 pb-3">Options</button>
          </div>
        </div>

        {/* Market Cards */}
        <div className="flex gap-4 overflow-x-auto px-5 py-4">
          <MarketCard
            title="Gold Index"
            price="2,041.50"
            change="0.8%"
            up
            icon={<MdTrendingUp />}
          />
          <MarketCard
            title="Silver Spot"
            price="22.84"
            change="0.3%"
            icon={<MdTrendingDown />}
          />
          <MarketCard
            title="Volatility (VIX)"
            price="14.20"
            change="1.2%"
            up
            icon={<MdShowChart />}
          />
        </div>

        {/* Table Header */}
        <div className="text-gray-500 flex justify-between border-b border-white/10 px-5 py-2 text-xs uppercase">
          <span>Instrument</span>
          <div className="flex gap-8">
            <span>Price</span>
            <span>Chg%</span>
          </div>
        </div>

        {/* Instruments */}
        <main className="flex-1 space-y-3 overflow-y-auto px-5 pb-24 pt-3">
          {displayedInstruments.map((item) => (
            <InstrumentItem
              key={item.name}
              name={item.name}
              market={item.market}
              sub={item.sub}
              price={item.price}
              change={item.change}
              up={item.up}
            />
          ))}

          {displayedInstruments.length === 0 &&
            selectedInstruments.length > 0 && (
              <div className="text-gray-500 py-10 text-center">
                No instruments selected
              </div>
            )}
        </main>

        {/* ─── Selection Modal ─── */}
        {showSearchModal && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/70">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0a140a] px-5 py-4">
              <h2 className="text-lg font-semibold">Select Instruments</h2>
              <button
                onClick={() => setShowSearchModal(false)}
                className="rounded-full p-2 hover:bg-[#102210]"
              >
                <MdClose className="text-gray-300 text-xl" />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {ALL_INSTRUMENTS.map((item) => {
                const isSelected = selectedInstruments.includes(item.name);

                return (
                  <div
                    key={item.name}
                    onClick={() => {
                      setSelectedInstruments((prev) =>
                        isSelected
                          ? prev.filter((n) => n !== item.name)
                          : [...prev, item.name],
                      );
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors ${
                      isSelected
                        ? 'border-[#0df20d] bg-[#102210]/70'
                        : 'border-white/5 bg-[#0a140a] hover:bg-[#102210]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.name}</span>
                        <span className="text-gray-400 rounded border border-white/10 bg-[#102210] px-1.5 py-0.5 text-[8px]">
                          {item.market}
                        </span>
                      </div>
                      <div className="text-gray-500 mt-1 text-xs">
                        {item.sub}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm">{item.price}</div>
                      <div
                        className={`flex items-center justify-end text-xs ${
                          item.up ? 'text-[#0df20d]' : 'text-red-400'
                        }`}
                      >
                        {item.up ? <MdArrowDropUp /> : <MdArrowDropDown />}
                        {item.change}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 border-t border-white/10 bg-[#0a140a] p-4">
              <button
                onClick={() => {
                  setSelectedInstruments([]);
                  setShowSearchModal(false);
                }}
                className="flex-1 rounded-lg border border-white/20 py-3 text-sm hover:bg-white/5"
              >
                Clear All
              </button>

              <button
                onClick={() => setShowSearchModal(false)}
                className="flex-1 rounded-lg bg-[#0df20d] py-3 text-sm font-medium text-black hover:bg-[#0be30b]"
              >
                Done ({selectedInstruments.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- Components ---------------- */

const MarketCard = ({
  title,
  price,
  change,
  icon,
  up,
}: {
  title: string;
  price: string;
  change: string;
  icon: React.ReactNode;
  up?: boolean;
}) => (
  <div className="min-w-[140px] rounded-xl border border-white/5 bg-gradient-to-br from-[#0a140a] to-[#102210] p-3">
    <div className="text-gray-500 mb-1 text-xs">{title}</div>

    <div className="font-mono mb-2 text-lg font-bold">{price}</div>

    <div
      className={`flex items-center text-xs font-medium ${
        up ? 'text-[#0df20d]' : 'text-red-400'
      }`}
    >
      {up ? <MdArrowDropUp /> : <MdArrowDropDown />}
      {change}
    </div>
  </div>
);

const InstrumentItem = ({
  name,
  market,
  sub,
  price,
  change,
  up,
}: {
  name: string;
  market: string;
  sub: string;
  price: string;
  change: string;
  up?: boolean;
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate({to: '/marketdetails'})}
      className="flex cursor-pointer items-center justify-between rounded-xl border border-white/5 bg-[#0a140a] p-4 hover:bg-[#102210]"
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs">{name}</span>

          <span className="text-gray-400 rounded border border-white/10 bg-[#102210] px-1.5 py-0.5 text-[8px]">
            {market}
          </span>
        </div>

        <div className="text-xs text-gray">{sub}</div>
      </div>

      <div className="text-right">
        <div className="text-xs">{price}</div>

        <div
          className={`flex items-center justify-end text-xs ${
            up ? 'text-[#0df20d]' : 'text-red-400'
          }`}
        >
          {up ? <MdArrowDropUp /> : <MdArrowDropDown />}
          {change}
        </div>
      </div>
    </div>
  );
};

export default Market;
