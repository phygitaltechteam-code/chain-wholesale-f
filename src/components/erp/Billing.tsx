// manufacturingprocess/Billing.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, Eye, X, Search } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import toast from 'react-hot-toast';
import { manufacturingStore } from '@/utils/manufacturingStore';

interface BillingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  gross: number;
  purity: string;
  ewastege: number;
  fine: number;
  chainGiven?: number;
  chainReceived?: number;
  scrap?: number;
  isEditing?: boolean;
}

const Billing: React.FC = () => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [billingEntries, setBillingEntries] = useState<BillingEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BillingEntry | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load data from store
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const entries = manufacturingStore.getEntries();
    console.log('📦 Billing - Store entries:', entries);
    
    const billingData = entries.map((entry, index) => ({
      id: entry.id,
      srNo: index + 1,
      dateTime: entry.dateTime || new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      item: entry.item || 'N/A',
      size: entry.size || 'N/A',
      gross: entry.chainGiven || entry.chainWeight || 0,
      purity: entry.purity || '22K',
      ewastege: entry.scrap || 0,
      fine: (entry.chainGiven || entry.chainWeight || 0) - (entry.scrap || 0),
      chainGiven: entry.chainGiven || entry.chainWeight || 0,
      chainReceived: entry.chainReceived || 0,
      scrap: entry.scrap || 0,
      isEditing: false,
    }));
    
    setBillingEntries(billingData);
  };

  const handlePrint = (entry: BillingEntry) => {
    setSelectedEntry(entry);
    setShowPreview(true);
    setTimeout(() => {
      if (printRef.current) {
        const printContent = printRef.current.innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
      }
    }, 500);
  };

  const handlePreview = (entry: BillingEntry) => {
    setSelectedEntry(entry);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedEntry(null);
  };

  const formatNumber = (value: number) => {
    if (value === 0) return '0';
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  const filteredEntries = billingEntries.filter(entry =>
    entry.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.purity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Receipt Preview Component
  const ReceiptPreview = ({ entry }: { entry: BillingEntry }) => (
    <div className="bg-white p-8 max-w-2xl mx-auto" ref={printRef}>
      {/* Header */}
      <div className="text-center border-b-2 border-[#785600] pb-4 mb-4">
        <h1 className="text-2xl font-bold text-[#785600] font-serif">Sona Gold</h1>
        <p className="text-sm text-gray-600">Gold Chain Manufacturing ERP</p>
        <p className="text-xs text-gray-500 mt-1">Invoice #: INV-{entry.srNo.toString().padStart(4, '0')}</p>
        <p className="text-xs text-gray-500">Date: {entry.dateTime}</p>
      </div>

      {/* Customer Info */}
      <div className="mb-4">
        <p className="text-sm font-semibold">Customer Details:</p>
        <p className="text-sm text-gray-600">Name: _________________________</p>
        <p className="text-sm text-gray-600">Mobile: _________________________</p>
        <p className="text-sm text-gray-600">Address: _________________________</p>
      </div>

      {/* Table */}
      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr className="bg-[#785600] text-white">
            <th className="border border-gray-300 px-2 py-1.5 text-left">Sr No</th>
            <th className="border border-gray-300 px-2 py-1.5 text-left">Item</th>
            <th className="border border-gray-300 px-2 py-1.5 text-left">Size</th>
            <th className="border border-gray-300 px-2 py-1.5 text-right">Gross (g)</th>
            <th className="border border-gray-300 px-2 py-1.5 text-left">Purity</th>
            <th className="border border-gray-300 px-2 py-1.5 text-right">Ewastege (g)</th>
            <th className="border border-gray-300 px-2 py-1.5 text-right">Fine (g)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-2 py-1.5">{entry.srNo}</td>
            <td className="border border-gray-300 px-2 py-1.5">{entry.item}</td>
            <td className="border border-gray-300 px-2 py-1.5">{entry.size}</td>
            <td className="border border-gray-300 px-2 py-1.5 text-right">{formatNumber(entry.gross)}</td>
            <td className="border border-gray-300 px-2 py-1.5">{entry.purity}</td>
            <td className="border border-gray-300 px-2 py-1.5 text-right">{formatNumber(entry.ewastege)}</td>
            <td className="border border-gray-300 px-2 py-1.5 text-right font-semibold">{formatNumber(entry.fine)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-gray-50">
            <td colSpan={6} className="border border-gray-300 px-2 py-1.5 text-right font-bold">Total Fine:</td>
            <td className="border border-gray-300 px-2 py-1.5 text-right font-bold">{formatNumber(entry.fine)} g</td>
          </tr>
        </tfoot>
      </table>

      {/* Footer */}
      <div className="border-t-2 border-[#785600] pt-4 mt-4">
        <div className="flex justify-between text-sm">
          <div>
            <p className="font-semibold">Terms & Conditions:</p>
            <p className="text-xs text-gray-500">1. Goods once sold will not be taken back</p>
            <p className="text-xs text-gray-500">2. Subject to [City] jurisdiction</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Authorized Signature</p>
            <div className="h-12 mt-2 border-b border-gray-400 w-32"></div>
            <p className="text-xs text-gray-500">(Authorized Signatory)</p>
          </div>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-4">
          Thank you for your business! | Generated by Sona Gold ERP
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-4 py-4 md:px-8 md:py-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <PageHeader
              title="Billing"
              subtitle="Generate invoices and receipts for finished products"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toast.info('Print all invoices functionality coming soon!')}
              className="flex items-center gap-2 rounded-lg bg-[#785600] px-4 py-2 text-sm font-medium text-white hover:bg-[#5d4200]"
            >
              <Printer className="h-4 w-4" />
              Print All
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              type="text"
              placeholder="Search by item, size or purity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#d3c4af]/10 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f2] text-xs uppercase tracking-[0.15em] text-[#4f4535] dark:bg-slate-800 dark:text-slate-400">
                  <th className="px-3 py-3 text-left font-semibold lg:px-4">Sr No</th>
                  <th className="px-3 py-3 text-left font-semibold lg:px-4">Date & Time</th>
                  <th className="px-3 py-3 text-left font-semibold lg:px-4">Item</th>
                  <th className="px-3 py-3 text-left font-semibold lg:px-4">Size</th>
                  <th className="px-3 py-3 text-right font-semibold lg:px-4">Gross (g)</th>
                  <th className="px-3 py-3 text-left font-semibold lg:px-4">Purity</th>
                  <th className="px-3 py-3 text-right font-semibold lg:px-4">Ewastege (g)</th>
                  <th className="px-3 py-3 text-right font-semibold lg:px-4">Fine (g)</th>
                  <th className="px-3 py-3 text-center font-semibold lg:px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#4f4535] dark:text-slate-400">
                      No billing entries found. Please complete the manufacturing process first.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, index) => (
                    <tr key={entry.id} className="group transition-colors hover:bg-[#f4f4f2]/50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-3 text-sm text-[#4f4535] dark:text-slate-400 lg:px-4">
                        {entry.srNo}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#1a1c1b] dark:text-white lg:px-4">
                        {entry.dateTime}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-[#1a1c1b] dark:text-white lg:px-4">
                        {entry.item}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#1a1c1b] dark:text-white lg:px-4">
                        {entry.size}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm text-[#1a1c1b] dark:text-white lg:px-4">
                        {formatNumber(entry.gross)}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-amber-600 dark:text-amber-400 lg:px-4">
                        {entry.purity}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm text-[#1a1c1b] dark:text-white lg:px-4">
                        {formatNumber(entry.ewastege)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm font-bold text-[#785600] dark:text-amber-400 lg:px-4">
                        {formatNumber(entry.fine)}
                      </td>
                      <td className="px-3 py-3 text-center lg:px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handlePreview(entry)}
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(entry)}
                            className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                            title="Print"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 text-xs text-[#4f4535] dark:text-slate-400">
          Showing {filteredEntries.length} of {billingEntries.length} entries
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
            <button
              onClick={closePreview}
              className="sticky top-2 right-2 float-right z-10 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6">
              <ReceiptPreview entry={selectedEntry} />
              <div className="flex justify-end gap-3 mt-4 border-t pt-4">
                <button
                  onClick={closePreview}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handlePrint(selectedEntry)}
                  className="rounded-lg bg-[#785600] px-4 py-2 text-sm font-medium text-white hover:bg-[#5d4200] flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button
                  onClick={() => {
                    toast.success('Download functionality coming soon!');
                  }}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;