import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Filter,
  Stars,
  Diamond,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import GenericTable, { Column } from '../Forms/Table/GenericTable';
import PageHeader from '../Forms/Common/PageHeader';
import { useRates, useUpdateRate, MOCK_RATE_HISTORY } from './api';
import type { Rate, RateHistory } from './api';

export default function RateManagement() {
  // ─── Server / API state ────────────────────────────────────────────────────
  const { data: rates = [], isLoading, isError } = useRates();
  const updateMutation = useUpdateRate();

  // ─── Gold card local state (seeded from API data) ──────────────────────────
  const [goldBuying, setGoldBuying] = useState(0);
  const [goldSelling, setGoldSelling] = useState(0);

  // ─── Silver card local state (seeded from API data) ───────────────────────
  const [silverBuying, setSilverBuying] = useState(0);
  const [silverSelling, setSilverSelling] = useState(0);

  // ─── Seed card inputs once data loads ──────────────────────────────────────
  useEffect(() => {
    if (rates.length === 0) return;
    const gold24k = rates.find((r) => r.metal === 'Gold' && r.purity === '24K (999)');
    const silver999 = rates.find((r) => r.metal === 'Silver' && r.purity === '999');
    if (gold24k) {
      setGoldBuying(gold24k.buyingRate);
      setGoldSelling(gold24k.sellingRate);
    }
    if (silver999) {
      setSilverBuying(silver999.buyingRate);
      setSilverSelling(silver999.sellingRate);
    }
  }, [rates]);

  // ─── Table / filter state ──────────────────────────────────────────────────
  const [selectedMetal, setSelectedMetal] = useState<'all' | 'Gold' | 'Silver'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Derived: live ticker values from rates list ───────────────────────────
  const gold24k = rates.find((r) => r.metal === 'Gold' && r.purity === '24K (999)');
  const silver999 = rates.find((r) => r.metal === 'Silver' && r.purity === '999');

  // ─── Filtered rates for table ──────────────────────────────────────────────
  const filteredRates = rates.filter((rate) => {
    const matchesMetal = selectedMetal === 'all' || rate.metal === selectedMetal;
    const matchesSearch =
      rate.metal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.purity.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMetal && matchesSearch;
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  /** Update ALL Gold rows with new buying/selling rates */
  const handleSaveGold = () => {
    const goldRates = rates.filter((r) => r.metal === 'Gold');
    goldRates.forEach((r) => {
      updateMutation.mutate({
        id: r.id,
        data: { buyingRate: goldBuying, sellingRate: goldSelling },
      });
    });
  };

  /** Update ALL Silver rows with new buying/selling rates */
  const handleSaveSilver = () => {
    const silverRates = rates.filter((r) => r.metal === 'Silver');
    silverRates.forEach((r) => {
      updateMutation.mutate({
        id: r.id,
        data: { buyingRate: silverBuying, sellingRate: silverSelling },
      });
    });
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const getChangeInfo = (change: number) => {
    if (change > 0) return { icon: ArrowUp, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (change < 0) return { icon: ArrowDown, color: 'text-[#ba1a1a]', bg: 'bg-red-50' };
    return { icon: Minus, color: 'text-gray-400', bg: 'bg-gray-50' };
  };

  // ─── History table columns ─────────────────────────────────────────────────
  const historyColumns: Column<RateHistory>[] = [
    {
      header: 'Date & Time',
      accessor: 'date',
      align: 'left',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#1a1c1b]">{item.date}</span>
          <span className="text-[11px] text-[#4f4535]">{item.time}</span>
        </div>
      ),
    },
    {
      header: 'Metal',
      accessor: 'metal',
      align: 'left',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${item.metal === 'Gold' ? 'bg-[#785600]' : 'bg-slate-400'}`}
          />
          <span className="text-sm font-medium">{item.metal}</span>
          <span className="text-xs text-[#4f4535]">({item.purity})</span>
        </div>
      ),
    },
    {
      header: 'Buying Rate',
      accessor: 'buyingRate',
      align: 'right',
      render: (item) => (
        <span className="font-headline text-base font-bold text-emerald-700">
          {formatCurrency(item.buyingRate)}
        </span>
      ),
    },
    {
      header: 'Selling Rate',
      accessor: 'sellingRate',
      align: 'right',
      render: (item) => (
        <span className="font-headline text-base font-bold text-[#785600]">
          {formatCurrency(item.sellingRate)}
        </span>
      ),
    },
    {
      header: 'Change',
      accessor: 'change',
      align: 'left',
      render: (item) => {
        const { icon: ChangeIcon, color: changeColor } = getChangeInfo(item.change);
        return (
          <span className={`flex items-center gap-1 text-xs font-bold ${changeColor}`}>
            <ChangeIcon className="h-3 w-3" />
            {item.change > 0 ? '+' : ''}
            {item.change}
          </span>
        );
      },
    },
    {
      header: 'Updated By',
      accessor: 'updatedBy',
      align: 'left',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="bg-primary-fixed text-on-primary-fixed flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold">
            {item.updatedBy.charAt(0)}
          </div>
          <span className="text-on-surface text-xs font-medium">{item.updatedBy}</span>
        </div>
      ),
    },
  ];

  // ─── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-background font-body flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-on-surface-variant text-sm font-medium">Loading rates…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-background font-body flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-[#ba1a1a]" />
          <p className="text-on-surface text-sm font-bold">Failed to load rates</p>
          <p className="text-on-surface-variant text-xs">Please check your connection and retry.</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-background font-body min-h-screen">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <PageHeader
              title="Rate Management"
              subtitle="Manage buying and selling rates for Gold and Silver."
            />
          </div>

          {/* Live Rates Ticker — driven by actual API data */}
          <div className="hidden items-center gap-4 lg:flex">
            <div className="bg-surface-container flex items-center gap-2 rounded-full border border-stroke px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-on-surface-variant flex items-center gap-1.5 text-[10px] font-bold tracking-wider">
                AU:
                <span className="text-emerald-700">
                  B {gold24k ? formatCurrency(gold24k.buyingRate) : '—'}
                </span>
                <span className="bg-outline-variant/30 h-3 w-px" />
                <span className="text-primary">
                  S {gold24k ? formatCurrency(gold24k.sellingRate) : '—'}
                </span>
              </span>
            </div>
            <div className="border-outline-variant/15 bg-surface-container flex items-center gap-2 rounded-full border px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
              <span className="text-on-surface-variant flex items-center gap-1.5 text-[10px] font-bold tracking-wider">
                AG:
                <span className="text-emerald-700">
                  B {silver999 ? formatCurrency(silver999.buyingRate) : '—'}
                </span>
                <span className="bg-outline-variant/30 h-3 w-px" />
                <span className="text-slate-600">
                  S {silver999 ? formatCurrency(silver999.sellingRate) : '—'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Rate Update Cards */}
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ── Gold Card ──────────────────────────────────────────────────── */}
          <div className="bg-surface-container-lowest group relative overflow-hidden rounded-xl border border-stroke p-6 shadow-xl shadow-primary/5 sm:p-8">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="metallic-gradient flex h-10 w-10 items-center justify-center rounded-lg text-white sm:h-12 sm:w-12">
                  <Stars className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className="font-headline text-on-surface text-lg font-bold sm:text-xl">
                    Gold (24K)
                  </h3>
                  <p className="text-on-surface-variant text-[10px] font-medium sm:text-xs">
                    Set buying and selling benchmarks
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-on-surface-variant mb-1 text-[10px] uppercase tracking-widest">
                  Last Update
                </p>
                <p className="text-sm font-bold text-primary">
                  {gold24k
                    ? new Date(gold24k.updatedAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </p>
              </div>
            </div>

            <div className="relative mb-6 grid grid-cols-2 gap-4">
              {/* Selling */}
              <div className="rounded-xl border border-[#B8860B]/20 bg-[#B8860B]/5 p-4">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#785600]">
                  Selling Rate
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">
                    ₹
                  </span>
                  <input
                    id="gold-selling-rate"
                    type="number"
                    value={goldSelling}
                    onChange={(e) => setGoldSelling(Number(e.target.value))}
                    className="font-headline text-on-surface w-full border-none bg-transparent p-0 pl-6 text-xl font-black focus:ring-0 sm:text-2xl"
                  />
                </div>
                <p className="text-on-surface-variant mt-2 text-[10px]">Market Spread: +0.8%</p>
              </div>

              {/* Buying */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-emerald-800">
                  Buying Rate
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-600">
                    ₹
                  </span>
                  <input
                    id="gold-buying-rate"
                    type="number"
                    value={goldBuying}
                    onChange={(e) => setGoldBuying(Number(e.target.value))}
                    className="font-headline text-on-surface w-full border-none bg-transparent p-0 pl-6 text-xl font-black focus:ring-0 sm:text-2xl"
                  />
                </div>
                <p className="text-on-surface-variant mt-2 text-[10px]">Market Spread: -0.2%</p>
              </div>
            </div>

            <button
              id="gold-update-btn"
              onClick={handleSaveGold}
              disabled={updateMutation.isPending}
              className="metallic-gradient flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:opacity-60 sm:py-4"
            >
              <RefreshCw className={`h-4 w-4 ${updateMutation.isPending ? 'animate-spin' : ''}`} />
              {updateMutation.isPending ? 'Updating…' : 'Update Gold Rates'}
            </button>
          </div>

          {/* ── Silver Card ────────────────────────────────────────────────── */}
          <div className="bg-surface-container-lowest group relative overflow-hidden rounded-xl border border-stroke p-6 shadow-xl shadow-primary/5 sm:p-8">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-slate-200 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500 text-white sm:h-12 sm:w-12">
                  <Diamond className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className="font-headline text-on-surface text-lg font-bold sm:text-xl">
                    Silver
                  </h3>
                  <p className="text-on-surface-variant text-[10px] font-medium sm:text-xs">
                    Set buying and selling benchmarks
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-on-surface-variant mb-1 text-[10px] uppercase tracking-widest">
                  Last Update
                </p>
                <p className="text-sm font-bold text-slate-600">
                  {silver999
                    ? new Date(silver999.updatedAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </p>
              </div>
            </div>

            <div className="relative mb-6 grid grid-cols-2 gap-4">
              {/* Selling */}
              <div className="rounded-xl border border-slate-200 bg-slate-100 p-4">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-800">
                  Selling Rate
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-600">
                    ₹
                  </span>
                  <input
                    id="silver-selling-rate"
                    type="number"
                    value={silverSelling}
                    onChange={(e) => setSilverSelling(Number(e.target.value))}
                    className="font-headline text-on-surface w-full border-none bg-transparent p-0 pl-6 text-xl font-black focus:ring-0 sm:text-2xl"
                  />
                </div>
                <p className="text-on-surface-variant mt-2 text-[10px]">Per gram</p>
              </div>

              {/* Buying */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-emerald-800">
                  Buying Rate
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-600">
                    ₹
                  </span>
                  <input
                    id="silver-buying-rate"
                    type="number"
                    value={silverBuying}
                    onChange={(e) => setSilverBuying(Number(e.target.value))}
                    className="font-headline text-on-surface w-full border-none bg-transparent p-0 pl-6 text-xl font-black focus:ring-0 sm:text-2xl"
                  />
                </div>
                <p className="text-on-surface-variant mt-2 text-[10px]">Per gram</p>
              </div>
            </div>

            <button
              id="silver-update-btn"
              onClick={handleSaveSilver}
              disabled={updateMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-700 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-opacity hover:opacity-90 disabled:opacity-60 sm:py-4"
            >
              <RefreshCw className={`h-4 w-4 ${updateMutation.isPending ? 'animate-spin' : ''}`} />
              {updateMutation.isPending ? 'Updating…' : 'Update Silver Rates'}
            </button>
          </div>
        </div>

        {/* Rate History Ledger */}
        <div className="border-outline-variant/15 bg-surface-container-low overflow-hidden rounded-xl border shadow-sm">
          <div className="bg-surface-container-lowest rounded-lg p-4 sm:p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-headline text-on-surface text-xl font-bold">
                  Rate History Ledger
                </h3>
                <p className="text-on-surface-variant text-xs">
                  Dual-rate tracking for inventory valuation
                </p>
              </div>
              <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5">
                <Filter className="h-4 w-4" />
                Filter Log
              </button>
            </div>

            <GenericTable
              data={MOCK_RATE_HISTORY}
              columns={historyColumns}
              title=""
              searchable={false}
              itemsPerPage={5}
              emptyMessage="No rate history found"
            />
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;0,800;0,900;1,400&family=Manrope:wght@400;500;600;700&display=swap');

        .font-headline { font-family: 'Noto Serif', serif; }
        .font-body { font-family: 'Manrope', sans-serif; }
        .metallic-gradient { background: linear-gradient(135deg, #785600 0%, #986d00 100%); }
        .bg-surface-container-lowest { background-color: #ffffff; }
        .bg-surface-container-low { background-color: #f4f4f2; }
        .bg-primary-fixed { background-color: #ffdea6; }
        .text-on-primary-fixed { color: #271900; }
        .border-outline-variant\\/15 { border-color: rgba(211, 196, 175, 0.15); }
      `}</style>
    </div>
  );
}
