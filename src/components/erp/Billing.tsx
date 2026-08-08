import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Printer, Edit, Trash2, Plus, Calendar } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import toast from 'react-hot-toast';
import GenericButton from '../Forms/Buttons/GenericButton';
import { useGetBill } from '@/lib/api/bill';
import GenericDatePicker from '../Forms/DatePicker/GenericDatePicker';
import { useReactToPrint } from 'react-to-print';
import PDFHeader from '../Forms/Common/PDFHeader';

interface ReceiptItem {
  id: string;
  receiptID: string;
  itemID: string;
  sizeID: string;
  purity: number;
  grossWeight: number;
  srp: number;
  fineWeight: number;
  laborRate: number;
  item: {
    id: string;
    name: string;
  };
  size: {
    id: string;
    size: string;
  };
}

interface ReceiptData {
  id: string;
  clientID: string;
  receiptDate: string;
  totalWeight: number;
  customerWeight: number;
  remainingWeight: number;
  createdAt: string;
  client: {
    id: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    openingBalance: number;
  };
  receiptItems: ReceiptItem[];
}

interface BillingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  billNo: string;
  clientName: string;
  phoneNumber: string;
  item: string;
  size: string;
  purity: number;
  finWt: number;
  srp: number;
  receive: number;
  pending: number;
  status: 'draft' | 'completed' | 'pending';
  createdAt: string;
}

const Billing: React.FC = () => {
  const navigate = useNavigate();
  const [billingEntries, setBillingEntries] = useState<BillingEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<BillingEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState<Date[]>([]);
  const [toDate, setToDate] = useState<Date[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const tablePrintRef = useRef<HTMLDivElement>(null);

  const { data: billData, isLoading: billLoading } = useGetBill();

  // Process API data
  useEffect(() => {
    if (billLoading) {
      setIsLoading(true);
      return;
    }

    if (billData && Array.isArray(billData)) {
      const entries: BillingEntry[] = billData.map((receipt: ReceiptData, index: number) => {
        const firstItem = receipt.receiptItems?.[0];
        const itemName = firstItem?.item?.name || 'N/A';
        const sizeName = firstItem?.size?.size || 'N/A';
        const fineWeight = firstItem?.fineWeight || 0;
        const srp = firstItem?.srp || 0;

        let status: 'draft' | 'completed' | 'pending' = 'pending';
        if (receipt.remainingWeight === 0) {
          status = 'completed';
        } else if (receipt.customerWeight === 0) {
          status = 'draft';
        } else {
          status = 'pending';
        }

        const dateObj = new Date(receipt.receiptDate || receipt.createdAt);
        const formattedDate = dateObj.toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        return {
          id: receipt.id,
          srNo: index + 1,
          dateTime: formattedDate,
          billNo: `BILL-${String(index + 1).padStart(4, '0')}`,
          clientName: receipt.client?.fullName || 'N/A',
          phoneNumber: receipt.client?.phoneNumber || 'N/A',
          item: itemName,
          size: sizeName,
          purity: firstItem?.purity || 0,
          finWt: fineWeight,
          srp: srp,
          receive: receipt.customerWeight || 0,
          pending: receipt.remainingWeight || 0,
          status: status,
          createdAt: receipt.createdAt,
        };
      });

      setBillingEntries(entries);
    } else {
      setBillingEntries([]);
    }
    setIsLoading(false);
  }, [billData, billLoading]);

  // Filter entries
  const filteredEntries = billingEntries.filter(entry => {
    const matchesSearch =
      entry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.phoneNumber.includes(searchTerm) ||
      entry.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.item.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (fromDate.length > 0 && toDate.length > 0) {
      const entryDate = new Date(entry.createdAt);
      const from = new Date(fromDate[0]);
      const to = new Date(toDate[0]);
      to.setHours(23, 59, 59, 999);
      matchesDate = entryDate >= from && entryDate <= to;
    }

    return matchesSearch && matchesDate;
  });

  // Calculate totals from filtered entries
  const totalFinWt = filteredEntries.reduce((sum, item) => sum + item.finWt, 0);
  const totalSRP = filteredEntries.reduce((sum, item) => sum + item.srp, 0);
  const totalReceive = filteredEntries.reduce((sum, item) => sum + item.receive, 0);
  const totalPending = filteredEntries.reduce((sum, item) => sum + item.pending, 0);
  const totalEntries = filteredEntries.length;

  // Direct print without popup
  const handleDirectPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${selectedEntry?.billNo || 'bill'}`,
    pageStyle: `
      @page { 
        size: A4 portrait; 
        margin: 5mm; 
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
        }
        #receipt { 
          page-break-inside: avoid; 
          break-inside: avoid; 
        }
        .no-print { 
          display: none !important; 
        }
      }
    `,
  });

  // Print table with filters - A4 size with proper margins
  const handlePrintTable = useReactToPrint({
    contentRef: tablePrintRef,
    documentTitle: `Billing-Report-${new Date().toLocaleDateString()}`,
    pageStyle: `
      @page { 
        size: A4 landscape; 
        margin: 8mm; 
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
        }
        #table-print { 
          page-break-inside: avoid; 
          break-inside: avoid; 
        }
        .no-print { 
          display: none !important; 
        }
      }
    `,
  });

  const handlePrint = (entry: BillingEntry) => {
    setSelectedEntry(entry);
    setTimeout(() => {
      handleDirectPrint();
    }, 100);
  };

  const handleRowClick = (entry: BillingEntry) => {
    navigate({ to: "/billiupdate/$id", params: { id: entry.id } });
  };

  const handleDelete = (entry: BillingEntry) => {
    if (window.confirm(`Are you sure you want to delete bill ${entry.billNo}?`)) {
      setBillingEntries(prev => prev.filter(e => e.id !== entry.id));
      toast.success(`Bill ${entry.billNo} deleted successfully`);
    }
  };

  // Format number - remove trailing zeros
  const formatNumber = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  // Format number with 3 decimals only if needed
  const formatNumberWithDecimals = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toFixed(3);
    return str.replace(/\.?0+$/, '');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderActions = (item: BillingEntry, index: number) => (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); handlePrint(item); }}
        className="rounded-lg p-1.5 text-[#785600] hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20 transition-colors"
        title="Print Receipt"
      >
        <Printer className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const columns: Column<BillingEntry>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const parts = item.dateTime ? item.dateTime.split(' ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts.slice(1).join(' ') || '';

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {datePart}
            </span>
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {timePart}
            </span>
          </div>
        );
      },
    },
    {
      key: 'billNo',
      header: 'Bill No',
      render: (item) => (
        <span className="text-sm font-medium text-[#785600] dark:text-amber-400">
          {item.billNo}
        </span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client Name',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.clientName}
        </span>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Phone',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.phoneNumber}
        </span>
      ),
    },
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.item}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.size}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity %',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.purity}
        </span>
      ),
    },
    {
      key: 'finWt',
      header: 'Fin Wt (g)',
      render: (item) => (
        <span className="text-sm font-mono font-bold text-black dark:text-amber-400">
          {formatNumberWithDecimals(item.finWt)}
        </span>
      ),
    },
    {
      key: 'srp',
      header: 'SRP (G)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumberWithDecimals(item.srp)}
        </span>
      ),
    },
    {
      key: 'receive',
      header: 'Receive (G)',
      render: (item) => (
        <span className="text-sm font-mono text-black dark:text-green-400">
          {formatNumberWithDecimals(item.receive)}
        </span>
      ),
    },
    {
      key: 'pending',
      header: 'Pending (G)',
      render: (item) => (
        <span className="text-sm font-mono text-black dark:text-red-400">
          {formatNumberWithDecimals(item.pending)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusColor(item.status)}`}>
          {item.status || "-"}
        </span>
      ),
    },
  ];

  // Receipt Preview Component for Print with PDF Header
  const ReceiptPreview = ({ entry }: { entry: BillingEntry }) => (
    <div
      className="bg-white p-4 max-w-4xl mx-auto font-sans"
      ref={printRef}
      id="receipt"
      style={{ width: '210mm', minHeight: '297mm' }}
    >
      {/* PDF Header */}
      <PDFHeader />

      <div className="border-b-2 border-[#c43d5c] my-2" />

      {/* Client Info (Left) and Receipt Info (Right) */}
      <div className="flex justify-between items-start my-3">
        {/* Left - Client Info */}
        <div className="border border-gray-300 p-3 flex-1 mr-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Client Details</h4>
          <div className="space-y-0.5 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-1 font-medium">{entry.clientName}</span>
            </div>
            <div>
              <span className="text-gray-600">Phone:</span>
              <span className="ml-1">{entry.phoneNumber}</span>
            </div>
          </div>
        </div>

        {/* Right - Receipt Info */}
        <div className="border border-gray-300 p-3 flex-1">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Receipt Details</h4>
          <div className="space-y-0.5 text-sm">
            <div>
              <span className="text-gray-600">Receipt #:</span>
              <span className="ml-1 font-bold text-[#785600]">{entry.billNo}</span>
            </div>
            <div>
              <span className="text-gray-600">Date:</span>
              <span className="ml-1">{entry.dateTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="my-3">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-white">
              <th className="border border-[#785600] px-2 py-1 text-left text-xs font-semibold">Sr No.</th>
              <th className="border border-[#785600] px-2 py-1 text-left text-xs font-semibold">Item</th>
              <th className="border border-[#785600] px-2 py-1 text-left text-xs font-semibold">Size</th>
              <th className="border border-[#785600] px-2 py-1 text-right text-xs font-semibold">Fin Wt (G)</th>
              <th className="border border-[#785600] px-2 py-1 text-right text-xs font-semibold">SRP (G)</th>
              <th className="border border-[#785600] px-2 py-1 text-right text-xs font-semibold">Amount (G)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-2 py-1 text-center">1</td>
              <td className="border border-gray-300 px-2 py-1">{entry.item}</td>
              <td className="border border-gray-300 px-2 py-1">{entry.size}</td>
              <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatNumberWithDecimals(entry.finWt)}</td>
              <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatNumberWithDecimals(entry.srp)}</td>
              <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatNumberWithDecimals(entry.finWt * entry.srp)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t-2 border-[#785600] text-center">
        <p className="text-xs text-gray-500">This is a system-generated receipt</p>
        <div className="mt-0.5 flex justify-center gap-3 text-[10px] text-gray-400">
          <span>Powered by Matoshree Gold</span>
          <span>|</span>
          <span>Generated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  // Table Print Preview Component - A4 size with proper design
  const TablePrintPreview = () => {
    const printData = filteredEntries;

    return (
      <div
        className="bg-white p-4 max-w-full mx-auto font-sans"
        ref={tablePrintRef}
        id="table-print"
        style={{ width: '297mm', minHeight: '210mm' }}
      >
        {/* PDF Header */}
        <PDFHeader />

        <div className="border-b-2 border-[#c43d5c] my-2" />

        {/* Title */}
        <div className="mb-2 text-center">
          <h2 className="text-lg font-bold text-black">Billing Report</h2>
        </div>

        {/* Table */}
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-white">
              <th className="border border-[#785600] px-2 py-1 text-left font-semibold">Sr</th>
              <th className="border border-[#785600] px-2 py-1 text-left font-semibold">Date & Time</th>
              <th className="border border-[#785600] px-2 py-1 text-left font-semibold">Bill No</th>
              <th className="border border-[#785600] px-2 py-1 text-left font-semibold">Client</th>
              <th className="border border-[#785600] px-2 py-1 text-left font-semibold">Phone</th>
              <th className="border border-[#785600] px-2 py-1 text-left font-semibold">Item</th>
              <th className="border border-[#785600] px-2 py-1 text-left font-semibold">Size</th>
              <th className="border border-[#785600] px-2 py-1 text-right font-semibold">Purity %</th>
              <th className="border border-[#785600] px-2 py-1 text-right font-semibold">Fin Wt (G)</th>
              <th className="border border-[#785600] px-2 py-1 text-right font-semibold">SRP (G)</th>
              <th className="border border-[#785600] px-2 py-1 text-right font-semibold">Receive (G)</th>
              <th className="border border-[#785600] px-2 py-1 text-right font-semibold">Pending (G)</th>
              <th className="border border-[#785600] px-2 py-1 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {printData.map((entry, index) => (
              <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-2 py-1 text-center">{index + 1}</td>
                <td className="border border-gray-300 px-2 py-1 text-xs">{entry.dateTime}</td>
                <td className="border border-gray-300 px-2 py-1 font-medium">{entry.billNo}</td>
                <td className="border border-gray-300 px-2 py-1">{entry.clientName}</td>
                <td className="border border-gray-300 px-2 py-1">{entry.phoneNumber}</td>
                <td className="border border-gray-300 px-2 py-1">{entry.item}</td>
                <td className="border border-gray-300 px-2 py-1">{entry.size}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{entry.purity}</td>
                <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatNumberWithDecimals(entry.finWt)}</td>
                <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatNumberWithDecimals(entry.srp)}</td>
                <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatNumberWithDecimals(entry.receive)}</td>
                <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatNumberWithDecimals(entry.pending)}</td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <span className={`px-1.5 py-0.5 text-[9px] font-medium capitalize ${getStatusColor(entry.status)}`}>
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={8} className="border border-gray-300 px-2 py-1 text-right">Total:</td>
              <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatNumberWithDecimals(totalFinWt)}</td>
              <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatNumberWithDecimals(totalSRP)}</td>
              <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatNumberWithDecimals(totalReceive)}</td>
              <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatNumberWithDecimals(totalPending)}</td>
              <td className="border border-gray-300 px-2 py-1 text-center text-[10px]">{printData.length} entries</td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t-2 border-[#785600] text-center">
          <p className="text-xs text-gray-500">This is a system-generated report</p>
          <div className="mt-0.5 flex justify-center gap-3 text-[10px] text-gray-400">
            <span>Powered by Matoshree Gold</span>
            <span>|</span>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-4 border-[#785600] border-t-transparent"></div>
          <p className="text-[#4f4535] dark:text-slate-400">Loading billing entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        {/* Header & Filters */}
        <div className="mb-4 space-y-3">
          {/* Row 1: Title and Add Bill button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PageHeader title='Billing' />
            </div>
            <GenericButton
              type="button"
              onClick={() => navigate({ to: '/receipt/addreciept' })}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Add Bill.</span>
            </GenericButton>
          </div>


        </div>

        {/* Summary Cards - Totals for Fin Wt, SRP, Receive, Pending */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Fin Wt Card */}
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Total Fin Wt
              </span>
              <span className="text-lg font-bold text-[#785600] dark:text-amber-400">
                {formatNumberWithDecimals(totalFinWt)} g
              </span>
              <span className="text-[9px] text-[#4f4535] dark:text-slate-400">
                {totalEntries} entries
              </span>
            </div>
          </div>

          {/* Total SRP Card */}
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Total SRP
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatNumberWithDecimals(totalSRP)} g
              </span>
              <span className="text-[9px] text-[#4f4535] dark:text-slate-400">
                {totalEntries} entries
              </span>
            </div>
          </div>

          {/* Total Receive Card */}
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Total Receive
              </span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatNumberWithDecimals(totalReceive)} g
              </span>
              <span className="text-[9px] text-[#4f4535] dark:text-slate-400">
                {totalEntries} entries
              </span>
            </div>
          </div>

          {/* Total Pending Card */}
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Total Pending
              </span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatNumberWithDecimals(totalPending)} g
              </span>
              <span className="text-[9px] text-[#4f4535] dark:text-slate-400">
                {totalEntries} entries
              </span>
            </div>
          </div>
        </div>
        {/* Row 2: Search and Date Filters with Print Button on Right */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
          <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              type="text"
              placeholder="Search by client, phone, bill no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <GenericDatePicker
              id="from-date"
              placeholder="From Date"
              dateFormat="d/m/Y"
              onDateChange={(dates) => setFromDate(dates)}
              className="w-28 sm:w-32"
            />
          </div>

          <div className="flex items-center gap-2">
            <GenericDatePicker
              id="to-date"
              placeholder="To Date"
              dateFormat="d/m/Y"
              onDateChange={(dates) => setToDate(dates)}
              className="w-28 sm:w-32"
            />
          </div>

          {/* Print Report Button */}
          <button
            onClick={() => {
              if (filteredEntries.length === 0) {
                toast.error('No records to print');
                return;
              }
              handlePrintTable();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#785600] px-3 py-2 text-sm font-medium text-white hover:bg-[#5d4200] transition-colors whitespace-nowrap"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>

          {(fromDate.length > 0 || toDate.length > 0 || searchTerm) && (
            <button
              onClick={() => {
                setFromDate([]);
                setToDate([]);
                setSearchTerm('');
              }}
              className="flex items-center gap-1 text-sm text-[#785600] hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300 font-medium whitespace-nowrap"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Generic Table with Row Click */}
        <GenericTable<BillingEntry>
          data={filteredEntries}
          columns={columns}
          onSave={(item) => console.log('Save:', item)}
          emptyMessage="No billing entries found for the selected filters."
          isLoading={false}
          renderActions={renderActions}
          showSrNo={true}
          srNoLabel="Sr No."
          onRowClick={handleRowClick}
        />
      </div>

      {/* Hidden Print Components */}
      <div className="hidden">
        {selectedEntry && <ReceiptPreview entry={selectedEntry} />}
      </div>

      {/* Hidden Table Print Component */}
      <div className="hidden">
        <TablePrintPreview />
      </div>
    </div>
  );
};

export default Billing;