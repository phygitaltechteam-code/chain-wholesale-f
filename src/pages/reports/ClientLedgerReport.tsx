import React from 'react';
import {
  Calendar,
  Search,
  Filter,
  Printer,
  Download,
  Share2,
  Plus,
  ArrowRight,
} from 'lucide-react';

const ClientLedgerReport = () => {
  const transactions = [
    {
      date: 'Oct 24, 2023',
      invoice: '#INV-9842',
      client: 'Aditya Verma',
      clientId: 'CL-2204',
      metalDetail: '14.50g / 22K Gold',
      metalColor: '#f7bd48',
      rate: '₹5,850.00',
      taxable: '₹84,825.00',
      gst: '₹2,544.75',
      total: '₹87,369.75',
    },
    {
      date: 'Oct 24, 2023',
      invoice: '#INV-9843',
      client: 'Meera Singhania',
      clientId: 'CL-1092',
      metalDetail: '240.00g / 925 Silver',
      metalColor: '#cdc6b6',
      rate: '₹74.50',
      taxable: '₹17,880.00',
      gst: '₹536.40',
      total: '₹18,416.40',
    },
    {
      date: 'Oct 23, 2023',
      invoice: '#INV-9840',
      client: 'Karan Johar',
      clientId: 'CL-5531',
      metalDetail: '45.00g / 24K Gold',
      metalColor: '#f7bd48',
      rate: '₹6,245.00',
      taxable: '₹2,81,025.00',
      gst: '₹8,430.75',
      total: '₹2,89,455.75',
    },
    {
      date: 'Oct 23, 2023',
      invoice: '#INV-9839',
      client: 'Zoya Akhtar',
      clientId: 'CL-0032',
      metalDetail: '112.40g / 22K Gold',
      metalColor: '#f7bd48',
      rate: '₹5,850.00',
      taxable: '₹6,57,540.00',
      gst: '₹19,726.20',
      total: '₹6,77,266.20',
    },
  ];

  return (
    <div className="bg-atelier-bg font-sans selection:bg-atelier-gold-light selection:text-atelier-gold-dark min-h-screen p-8">
      {/* Header Utilities */}
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-atelier-gold h-2 w-2 animate-pulse rounded-full" />
            <span className="font-serif text-atelier-gold text-lg font-semibold">
              Live Bullion Rates
            </span>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="text-atelier-ink-variant">
              Gold: <span className="text-atelier-gold font-bold">₹6,245</span>
            </span>
            <span className="text-atelier-ink-variant">
              Silver:{' '}
              <span className="text-atelier-gold font-bold">₹74,200</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="border-atelier-ink-variant/10 hover:bg-atelier-surface flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors">
            <Printer className="h-4 w-4" />
            Print View
          </button>
          <button className="bg-linear-to-br from-atelier-gold to-atelier-gold-dark flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
            <Share2 className="h-4 w-4" />
            Export All
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Page Heading & Editorial Summary */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-atelier-ink text-4xl font-bold tracking-tight">
              Sales Analysis
            </h2>
            <p className="text-atelier-ink-variant/70 mt-2 font-medium">
              Detailed transaction report for the selected period
            </p>
          </div>
          <div className="flex gap-12 text-right">
            <div>
              <span className="text-atelier-ink-variant/60 mb-1 block text-[10px] font-bold uppercase tracking-widest">
                Total Sales Value
              </span>
              <span className="font-serif text-atelier-gold text-3xl font-bold">
                ₹2,48,50,000
              </span>
            </div>
            <div>
              <span className="text-atelier-ink-variant/60 mb-1 block text-[10px] font-bold uppercase tracking-widest">
                Net Weight
              </span>
              <span className="font-serif text-atelier-ink text-3xl font-bold">
                3,982.45g
              </span>
            </div>
          </div>
        </div>

        {/* Filters Section (Bento Style) */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="bg-atelier-surface-low flex flex-col gap-3 rounded-xl p-6 md:col-span-2">
            <label className="text-atelier-ink-variant/60 text-[10px] font-bold uppercase tracking-widest">
              Date Range Selection
            </label>
            <div className="flex items-center gap-4">
              <div className="border-atelier-ink-variant/5 shadow-xs flex flex-1 items-center justify-between rounded-lg border bg-white px-4 py-2.5">
                <span className="text-sm font-medium">Oct 01, 2023</span>
                <Calendar className="text-atelier-ink-variant/40 h-4 w-4" />
              </div>
              <span className="text-atelier-ink-variant/40">to</span>
              <div className="border-atelier-ink-variant/5 shadow-xs flex flex-1 items-center justify-between rounded-lg border bg-white px-4 py-2.5">
                <span className="text-sm font-medium">Oct 31, 2023</span>
                <Calendar className="text-atelier-ink-variant/40 h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="bg-atelier-surface-low flex flex-col gap-3 rounded-xl p-6">
            <label className="text-atelier-ink-variant/60 text-[10px] font-bold uppercase tracking-widest">
              Metal Category
            </label>
            <div className="relative">
              <select className="border-atelier-ink-variant/5 focus:ring-atelier-gold shadow-xs w-full appearance-none rounded-lg border bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-1">
                <option>All Metals</option>
                <option>Gold (22K/24K)</option>
                <option>Silver (925/999)</option>
                <option>Platinum</option>
              </select>
              <ArrowRight className="text-atelier-ink-variant/40 pointer-events-none absolute right-3 top-3 h-4 w-4 rotate-90" />
            </div>
          </div>
          <div className="bg-atelier-surface-low flex flex-col gap-3 rounded-xl p-6">
            <label className="text-atelier-ink-variant/60 text-[10px] font-bold uppercase tracking-widest">
              Client Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name/ID..."
                className="border-atelier-ink-variant/5 focus:ring-atelier-gold placeholder:text-atelier-ink-variant/30 shadow-xs w-full rounded-lg border bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-1"
              />
              <Search className="text-atelier-ink-variant/40 pointer-events-none absolute right-3 top-3 h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="border-atelier-ink-variant/5 overflow-hidden rounded-2xl border bg-white shadow-[0px_10px_40px_rgba(121,88,0,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-atelier-surface-low/50 border-atelier-ink-variant/5 border-b">
                  <th className="text-atelier-ink-variant/50 px-6 py-5 text-[10px] font-bold uppercase tracking-widest">
                    Date
                  </th>
                  <th className="text-atelier-ink-variant/50 px-6 py-5 text-[10px] font-bold uppercase tracking-widest">
                    Invoice #
                  </th>
                  <th className="text-atelier-ink-variant/50 px-6 py-5 text-[10px] font-bold uppercase tracking-widest">
                    Client
                  </th>
                  <th className="text-atelier-ink-variant/50 px-6 py-5 text-[10px] font-bold uppercase tracking-widest">
                    Metal Detail
                  </th>
                  <th className="text-atelier-ink-variant/50 px-6 py-5 text-[10px] font-bold uppercase tracking-widest">
                    Rate (per g)
                  </th>
                  <th className="text-atelier-ink-variant/50 px-6 py-5 text-right text-[10px] font-bold uppercase tracking-widest">
                    Taxable
                  </th>
                  <th className="text-atelier-ink-variant/50 px-6 py-5 text-right text-[10px] font-bold uppercase tracking-widest">
                    GST (3%)
                  </th>
                  <th className="text-atelier-ink-variant/50 px-6 py-5 text-right text-[10px] font-bold uppercase tracking-widest">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-atelier-ink-variant/5 divide-y">
                {transactions.map((tx, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-atelier-surface-low/30 group transition-colors"
                  >
                    <td className="text-atelier-ink px-6 py-5 text-sm font-medium">
                      {tx.date}
                    </td>
                    <td className="text-atelier-gold px-6 py-5 text-sm font-bold">
                      {tx.invoice}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-atelier-ink text-sm font-bold">
                          {tx.client}
                        </span>
                        <span className="text-atelier-ink-variant/60 text-[10px]">
                          ID: {tx.clientId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{backgroundColor: tx.metalColor}}
                        />
                        <span className="text-atelier-ink text-sm">
                          {tx.metalDetail}
                        </span>
                      </div>
                    </td>
                    <td className="text-atelier-ink-variant px-6 py-5 text-sm font-medium">
                      {tx.rate}
                    </td>
                    <td className="text-atelier-ink-variant px-6 py-5 text-right text-sm font-medium">
                      {tx.taxable}
                    </td>
                    <td className="text-atelier-ink-variant px-6 py-5 text-right text-sm font-medium">
                      {tx.gst}
                    </td>
                    <td className="text-atelier-ink px-6 py-5 text-right text-sm font-bold">
                      {tx.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Totals Bar */}
        <div className="bg-atelier-surface/50 border-atelier-ink-variant/5 mt-8 flex items-center justify-between rounded-2xl border p-6">
          <div className="flex gap-16">
            <div className="flex items-center gap-4">
              <div className="bg-atelier-gold/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Filter className="text-atelier-gold h-5 w-5" />
              </div>
              <div>
                <p className="text-atelier-ink-variant/60 mb-1.5 text-[10px] font-bold uppercase leading-none tracking-widest">
                  Total Net Weight
                </p>
                <p className="font-serif text-2xl font-bold">
                  186.40g{' '}
                  <span className="font-sans text-atelier-ink-variant/50 ml-1 text-xs font-medium">
                    Au
                  </span>{' '}
                  / 240.00g{' '}
                  <span className="font-sans text-atelier-ink-variant/50 ml-1 text-xs font-medium">
                    Ag
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-atelier-navy/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Search className="text-atelier-navy h-5 w-5" />
              </div>
              <div>
                <p className="text-atelier-ink-variant/60 mb-1.5 text-[10px] font-bold uppercase leading-none tracking-widest">
                  Consolidated GST
                </p>
                <p className="font-serif text-2xl font-bold">₹31,238.10</p>
              </div>
            </div>
          </div>
          <div className="border-atelier-ink-variant/10 rounded-xl border bg-white px-8 py-5 text-right shadow-sm">
            <p className="text-atelier-ink-variant/60 mb-1 text-[10px] font-bold uppercase tracking-widest">
              Grand Total (Net Receivable)
            </p>
            <p className="font-serif text-atelier-gold text-4xl font-bold tracking-tighter">
              ₹10,72,508.10
            </p>
          </div>
        </div>

        {/* Footer Utilities */}
        <div className="text-atelier-ink-variant/40 mt-12 flex items-center justify-between text-xs font-medium">
          <p>Generated on Oct 25, 2023 • 10:45 AM • User: Admin_Karan</p>
          <div className="flex gap-8">
            <button className="hover:text-atelier-gold transition-colors">
              Audit Log
            </button>
            <button className="hover:text-atelier-gold flex items-center gap-1 transition-colors">
              <Download className="h-3 w-3" />
              Download CSV
            </button>
            <button className="hover:text-atelier-gold transition-colors">
              Direct WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="bg-linear-to-br from-atelier-gold to-atelier-gold-dark group fixed bottom-10 right-10 z-50 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-2xl transition-all hover:scale-110 active:scale-95">
        <Plus className="h-8 w-8" />
        <span className="bg-atelier-ink pointer-events-none absolute right-full mr-4 translate-x-4 transform whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold tracking-widest text-white opacity-0 shadow-xl transition-all group-hover:translate-x-0 group-hover:opacity-100">
          RECORD NEW SALE
        </span>
      </button>
    </div>
  );
};

export default ClientLedgerReport;
