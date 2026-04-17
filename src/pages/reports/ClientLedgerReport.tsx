import React from 'react';
import { Calendar, Search, Filter, Printer, Download, Share2, Plus, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-atelier-bg p-8 font-sans selection:bg-atelier-gold-light selection:text-atelier-gold-dark">
      {/* Header Utilities */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-atelier-gold animate-pulse" />
            <span className="font-serif text-lg font-semibold text-atelier-gold">Live Bullion Rates</span>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="text-atelier-ink-variant">Gold: <span className="font-bold text-atelier-gold">₹6,245</span></span>
            <span className="text-atelier-ink-variant">Silver: <span className="font-bold text-atelier-gold">₹74,200</span></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-1.5 rounded-full border border-atelier-ink-variant/10 text-sm font-medium hover:bg-atelier-surface transition-colors flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print View
          </button>
          <button className="px-4 py-1.5 rounded-full bg-linear-to-br from-atelier-gold to-atelier-gold-dark text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Export All
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Page Heading & Editorial Summary */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="font-serif text-4xl font-bold text-atelier-ink tracking-tight">Sales Analysis</h2>
            <p className="text-atelier-ink-variant/70 mt-2 font-medium">Detailed transaction report for the selected period</p>
          </div>
          <div className="flex gap-12 text-right">
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-atelier-ink-variant/60 font-bold mb-1">Total Sales Value</span>
              <span className="font-serif text-3xl font-bold text-atelier-gold">₹2,48,50,000</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-atelier-ink-variant/60 font-bold mb-1">Net Weight</span>
              <span className="font-serif text-3xl font-bold text-atelier-ink">3,982.45g</span>
            </div>
          </div>
        </div>

        {/* Filters Section (Bento Style) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="md:col-span-2 bg-atelier-surface-low p-6 rounded-xl flex flex-col gap-3">
            <label className="text-[10px] font-bold text-atelier-ink-variant/60 uppercase tracking-widest">Date Range Selection</label>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-white border border-atelier-ink-variant/5 rounded-lg px-4 py-2.5 flex items-center justify-between shadow-xs">
                <span className="text-sm font-medium">Oct 01, 2023</span>
                <Calendar className="w-4 h-4 text-atelier-ink-variant/40" />
              </div>
              <span className="text-atelier-ink-variant/40">to</span>
              <div className="flex-1 bg-white border border-atelier-ink-variant/5 rounded-lg px-4 py-2.5 flex items-center justify-between shadow-xs">
                <span className="text-sm font-medium">Oct 31, 2023</span>
                <Calendar className="w-4 h-4 text-atelier-ink-variant/40" />
              </div>
            </div>
          </div>
          <div className="bg-atelier-surface-low p-6 rounded-xl flex flex-col gap-3">
            <label className="text-[10px] font-bold text-atelier-ink-variant/60 uppercase tracking-widest">Metal Category</label>
            <div className="relative">
              <select className="w-full appearance-none bg-white border border-atelier-ink-variant/5 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-atelier-gold shadow-xs">
                <option>All Metals</option>
                <option>Gold (22K/24K)</option>
                <option>Silver (925/999)</option>
                <option>Platinum</option>
              </select>
              <ArrowRight className="absolute right-3 top-3 w-4 h-4 rotate-90 text-atelier-ink-variant/40 pointer-events-none" />
            </div>
          </div>
          <div className="bg-atelier-surface-low p-6 rounded-xl flex flex-col gap-3">
            <label className="text-[10px] font-bold text-atelier-ink-variant/60 uppercase tracking-widest">Client Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name/ID..."
                className="w-full bg-white border border-atelier-ink-variant/5 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-atelier-gold placeholder:text-atelier-ink-variant/30 shadow-xs"
              />
              <Search className="absolute right-3 top-3 w-4 h-4 text-atelier-ink-variant/40 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-2xl shadow-[0px_10px_40px_rgba(121,88,0,0.06)] overflow-hidden border border-atelier-ink-variant/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-atelier-surface-low/50 border-b border-atelier-ink-variant/5">
                  <th className="px-6 py-5 text-[10px] font-bold text-atelier-ink-variant/50 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-atelier-ink-variant/50 uppercase tracking-widest">Invoice #</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-atelier-ink-variant/50 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-atelier-ink-variant/50 uppercase tracking-widest">Metal Detail</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-atelier-ink-variant/50 uppercase tracking-widest">Rate (per g)</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-atelier-ink-variant/50 uppercase tracking-widest text-right">Taxable</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-atelier-ink-variant/50 uppercase tracking-widest text-right">GST (3%)</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-atelier-ink-variant/50 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-atelier-ink-variant/5">
                {transactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-atelier-surface-low/30 transition-colors group">
                    <td className="px-6 py-5 text-sm font-medium text-atelier-ink">{tx.date}</td>
                    <td className="px-6 py-5 text-sm font-bold text-atelier-gold">{tx.invoice}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-atelier-ink">{tx.client}</span>
                        <span className="text-[10px] text-atelier-ink-variant/60">ID: {tx.clientId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.metalColor }} />
                        <span className="text-sm text-atelier-ink">{tx.metalDetail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-atelier-ink-variant">{tx.rate}</td>
                    <td className="px-6 py-5 text-sm font-medium text-right text-atelier-ink-variant">{tx.taxable}</td>
                    <td className="px-6 py-5 text-sm font-medium text-right text-atelier-ink-variant">{tx.gst}</td>
                    <td className="px-6 py-5 text-sm font-bold text-right text-atelier-ink">{tx.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Totals Bar */}
        <div className="mt-8 bg-atelier-surface/50 p-6 rounded-2xl flex items-center justify-between border border-atelier-ink-variant/5">
          <div className="flex gap-16">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-atelier-gold/10 flex items-center justify-center">
                <Filter className="w-5 h-5 text-atelier-gold" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-atelier-ink-variant/60 uppercase tracking-widest leading-none mb-1.5">Total Net Weight</p>
                <p className="text-2xl font-serif font-bold">186.40g <span className="text-xs font-sans font-medium text-atelier-ink-variant/50 ml-1">Au</span> / 240.00g <span className="text-xs font-sans font-medium text-atelier-ink-variant/50 ml-1">Ag</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-atelier-navy/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-atelier-navy" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-atelier-ink-variant/60 uppercase tracking-widest leading-none mb-1.5">Consolidated GST</p>
                <p className="text-2xl font-serif font-bold">₹31,238.10</p>
              </div>
            </div>
          </div>
          <div className="bg-white px-8 py-5 rounded-xl border border-atelier-ink-variant/10 shadow-sm text-right">
            <p className="text-[10px] font-bold text-atelier-ink-variant/60 uppercase tracking-widest mb-1">Grand Total (Net Receivable)</p>
            <p className="text-4xl font-serif font-bold text-atelier-gold tracking-tighter">₹10,72,508.10</p>
          </div>
        </div>

        {/* Footer Utilities */}
        <div className="mt-12 flex justify-between items-center text-xs text-atelier-ink-variant/40 font-medium">
          <p>Generated on Oct 25, 2023 • 10:45 AM • User: Admin_Karan</p>
          <div className="flex gap-8">
            <button className="hover:text-atelier-gold transition-colors">Audit Log</button>
            <button className="hover:text-atelier-gold transition-colors flex items-center gap-1">
              <Download className="w-3 h-3" />
              Download CSV
            </button>
            <button className="hover:text-atelier-gold transition-colors">Direct WhatsApp</button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-10 right-10 w-16 h-16 bg-linear-to-br from-atelier-gold to-atelier-gold-dark text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
        <Plus className="w-8 h-8" />
        <span className="absolute right-full mr-4 bg-atelier-ink text-white px-4 py-2 rounded-xl text-xs font-bold tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 pointer-events-none shadow-xl">
          RECORD NEW SALE
        </span>
      </button>
    </div>
  );
};

export default ClientLedgerReport;
