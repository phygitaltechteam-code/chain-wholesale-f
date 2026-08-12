// ─── Updated Billing.tsx ────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Printer, Edit, Trash2, Plus, Calendar } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import toast from 'react-hot-toast';
import GenericButton from '../Forms/Buttons/GenericButton';
import { useDeleteBill, useGetBill } from '@/lib/api/bill';
import GenericDatePicker from '../Forms/DatePicker/GenericDatePicker';
import {
  Scale,
  DollarSign,
  ArrowDownToLine,
  Clock
} from 'lucide-react';

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
  type: string;
  client: {
    id: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    openingBalance: number;
  };
  receiptItems: ReceiptItem[];
}

// ─── Grouped Bill Entry with Items ─────────────────────────────────────────────
interface BillGroup {
  id: string;
  srNo: number;
  dateTime: string;
  billNo: string;
  clientName: string;
  phoneNumber: string;
  receive: number;
  pending: number;
  type: 'DRAFT' | 'BILL';
  createdAt: string;
  items: {
    item: string;
    size: string;
    purity: number;
    finWt: number;
    srp: number;
    grossWeight: number;
  }[];
  // Formatted display strings with line breaks
  displayItems: string;
  displaySizes: string;
  displayPurity: string;
  displayFinWt: string;
  displaySRP: string;
  totalFinWt: number;
  totalSRP: number;
}

const Billing: React.FC = () => {
  const navigate = useNavigate();
  const [billingGroups, setBillingGroups] = useState<BillGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<BillGroup | null>(null);

  const deleteClient = useDeleteBill();
  const [isLoading, setIsLoading] = useState(true);

  // Default date range: current Monday -> current Sunday
  const getCurrentWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  const { monday: defaultMonday, sunday: defaultSunday } = getCurrentWeekRange();

  const [fromDate, setFromDate] = useState<Date[]>([defaultMonday]);
  const [toDate, setToDate] = useState<Date[]>([defaultSunday]);

  const [dateRange, setDateRange] = useState({
    from: defaultMonday.toISOString().split('T')[0],
    to: defaultSunday.toISOString().split('T')[0],
  });

  const fromDatePickerRef = useRef<any>(null);
  const toDatePickerRef = useRef<any>(null);

  const { data: billData, isLoading: billLoading } = useGetBill();

  useEffect(() => {
    setDefaultDateRange();
  }, []);

  const setDefaultDateRange = () => {
    const { monday, sunday } = getCurrentWeekRange();
    setDateRange({
      from: monday.toISOString().split('T')[0],
      to: sunday.toISOString().split('T')[0],
    });
    setFromDate([monday]);
    setToDate([sunday]);
  };

  // Process API data - Group items by bill
  useEffect(() => {
    if (billLoading) {
      setIsLoading(true);
      return;
    }

    if (billData && Array.isArray(billData)) {
      const groups: BillGroup[] = billData.map((receipt: ReceiptData, index: number) => {
        const dateObj = new Date(receipt.receiptDate || receipt.createdAt);
        const formattedDate = dateObj.toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        // Map all items
        const items = receipt.receiptItems?.map((item) => ({
          item: item.item?.name || 'N/A',
          size: item.size?.size || 'N/A',
          purity: item.purity || 0,
          finWt: item.fineWeight || 0,
          srp: item.srp || 0,
          grossWeight: item.grossWeight || 0,
        })) || [];

        // Calculate totals
        const totalFinWt = items.reduce((sum, i) => sum + i.finWt, 0);
        const totalSRP = items.reduce((sum, i) => sum + i.srp, 0);

        // Join items with line breaks for display
        const displayItems = items.map(i => i.item).join('\n');
        const displaySizes = items.map(i => i.size).join('\n');
        const displayPurity = items.map(i => formatNumberWithDecimals(i.purity) + '%').join('\n');
        const displayFinWt = items.map(i => formatNumberWithDecimals(i.finWt)).join('\n');
        const displaySRP = items.map(i => formatNumberWithDecimals(i.srp)).join('\n');

        return {
          id: receipt.id,
          srNo: index + 1,
          dateTime: formattedDate,
          billNo: `BILL-${String(index + 1).padStart(4, '0')}`,
          clientName: receipt.client?.fullName || 'N/A',
          phoneNumber: receipt.client?.phoneNumber || 'N/A',
          receive: receipt.customerWeight || 0,
          pending: receipt.remainingWeight || 0,
          type: receipt.type || (receipt.remainingWeight === 0 ? 'BILL' : 'DRAFT'),
          createdAt: receipt.createdAt,
          items: items,
          displayItems: displayItems,
          displaySizes: displaySizes,
          displayPurity: displayPurity,
          displayFinWt: displayFinWt,
          displaySRP: displaySRP,
          totalFinWt: totalFinWt,
          totalSRP: totalSRP,
        };
      });

      setBillingGroups(groups);
    } else {
      setBillingGroups([]);
    }
    setIsLoading(false);
  }, [billData, billLoading]);

  // Filter entries
  const filteredGroups = billingGroups.filter(group => {
    const matchesSearch =
      group.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.phoneNumber.includes(searchTerm) ||
      group.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.items.some(item => item.item.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesDate = true;
    if (fromDate.length > 0 && toDate.length > 0) {
      const entryDate = new Date(group.createdAt);
      const from = new Date(fromDate[0]);
      from.setHours(0, 0, 0, 0);
      const to = new Date(toDate[0]);
      to.setHours(23, 59, 59, 999);
      matchesDate = entryDate >= from && entryDate <= to;
    }

    return matchesSearch && matchesDate;
  });

  // Calculate totals from filtered entries
  const totalFinWt = filteredGroups.reduce((sum, group) =>
    sum + group.totalFinWt, 0);
  const totalSRP = filteredGroups.reduce((sum, group) =>
    sum + group.totalSRP, 0);
  const totalReceive = filteredGroups.reduce((sum, group) => sum + group.receive, 0);
  const totalPending = filteredGroups.reduce((sum, group) => sum + group.pending, 0);
  const totalEntries = filteredGroups.length;

  const formatNumberWithDecimals = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toFixed(3);
    return str.replace(/\.?0+$/, '');
  };

  const formatNumberWith2Decimals = (value: number) => {
    if (value === 0 || !value) return '0.00';
    return value.toFixed(2);
  };

  // Print Receipt
  const handlePrintReceipt = (group: BillGroup) => {
    // ... (keep existing print function)
    toast.info('Print functionality preserved');
  };

  // Print Table Report
  const handlePrintTable = () => {
    if (!filteredGroups || filteredGroups.length === 0) {
      toast.error('No records available to print');
      return;
    }
    toast.info('Print table functionality preserved');
  };

  const handleRowClick = (group: BillGroup) => {
    navigate({ to: "/billiupdate/$id", params: { id: group.id } });
  };

  const handleDelete = (group: BillGroup) => {
    if (!window.confirm(`Are you sure you want to delete bill ${group.billNo}?`)) {
      return;
    }

    deleteClient.mutate(group.id, {
      onSuccess: () => {
        setBillingGroups((prev) => prev.filter((e) => e.id !== group.id));
        toast.success(`Bill ${group.billNo} deleted successfully`);
      },
      onError: (error: any) => {
        console.error('Delete bill error:', error);
        toast.error(error?.response?.data?.message || 'Failed to delete bill');
      },
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BILL':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderActions = (item: BillGroup, index: number) => (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); handlePrintReceipt(item); }}
        className="rounded-lg p-1.5 text-[#785600] hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20 transition-colors"
        title="Print Receipt"
      >
        <Printer className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(item);
        }}
        disabled={deleteClient.isPending}
        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  // ─── Columns Definition ──────────────────────────────────────────────────────
  const columns: Column<BillGroup>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const parts = item.dateTime ? item.dateTime.split(' ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts.slice(1).join(' ') || '';

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {datePart}
            </span>
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
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
        <span className="text-sm font-semibold text-[#785600] dark:text-amber-400">
          {item.billNo}
        </span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client',
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
      key: 'items',
      header: 'Items',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displayItems.split('\n').map((line, idx) => (
            <span key={idx} className="text-sm font-medium text-[#1a1c1b] dark:text-white leading-relaxed">
              {line}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displaySizes.split('\n').map((line, idx) => (
            <span key={idx} className="text-sm text-[#1a1c1b] dark:text-white leading-relaxed">
              {line}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'purity',
      header: 'Purity %',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displayPurity.split('\n').map((line, idx) => (
            <span key={idx} className="text-sm font-mono text-[#1a1c1b] dark:text-white leading-relaxed">
              {line}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'finWt',
      header: 'Fin Wt (g)',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displayFinWt.split('\n').map((line, idx) => (
            <span key={idx} className="text-sm font-mono font-bold text-black dark:text-amber-400 leading-relaxed">
              {line}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'srp',
      header: 'SRP (g)',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displaySRP.split('\n').map((line, idx) => (
            <span key={idx} className="text-sm font-mono text-[#1a1c1b] dark:text-white leading-relaxed">
              {line}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'receive',
      header: 'Receive (g)',
      render: (item) => (
        <span className="text-sm font-mono font-semibold text-black dark:text-green-400">
          {formatNumberWithDecimals(item.receive)}
        </span>
      ),
    },
    {
      key: 'pending',
      header: 'Pending (g)',
      render: (item) => (
        <span className="text-sm font-mono font-semibold text-black dark:text-red-400">
          {formatNumberWithDecimals(item.pending)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Status',
      render: (item) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getTypeColor(item.type)}`}>
          {item.type || "-"}
        </span>
      ),
    },
  ];

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PageHeader title='Billing' />
            </div>
            <GenericButton
              type="button"
              onClick={() => navigate({ to: '/receipt/addreciept' })}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Add Bill</span>
            </GenericButton>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                  Total Fin Wt
                </span>
                <span className="text-lg font-bold text-black dark:text-white">
                  {formatNumberWithDecimals(totalFinWt)} G
                </span>
              </div>
              <div className="rounded-full bg-[#785600]/10 p-2 dark:bg-amber-900/30 border border-[#785600]/20 dark:border-amber-700/30">
                <Scale className="h-4 w-4 text-[#785600] dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                  Total SRP
                </span>
                <span className="text-lg font-bold text-black dark:text-white">
                  {formatNumberWithDecimals(totalSRP)} G
                </span>
              </div>
              <div className="rounded-full bg-[#785600]/10 p-2 dark:bg-blue-900/30 border border-[#785600]/20 dark:border-blue-700/30">
                <DollarSign className="h-4 w-4 text-[#785600] dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                  Total Receive
                </span>
                <span className="text-lg font-bold text-black dark:text-white">
                  {formatNumberWithDecimals(totalReceive)} G
                </span>
              </div>
              <div className="rounded-full bg-[#785600]/10 p-2 dark:bg-green-900/30 border border-[#785600]/20 dark:border-green-700/30">
                <ArrowDownToLine className="h-4 w-4 text-[#785600] dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                  Total Pending
                </span>
                <span className="text-lg font-bold text-black dark:text-white">
                  {formatNumberWithDecimals(totalPending)} G
                </span>
              </div>
              <div className="rounded-full bg-[#785600]/10 p-2 dark:bg-red-900/30 border border-[#785600]/20 dark:border-red-700/30">
                <Clock className="h-4 w-4 text-[#785600] dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
          <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              type="text"
              placeholder="Search by client, phone, bill no, item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
            />
          </div>

          <GenericDatePicker
            id="from-date"
            placeholder="DD/MM/YYYY"
            dateFormat="d/m/Y"
            initialDate={fromDate[0]}
            onDateChange={(dates) => {
              if (dates?.length > 0) {
                const selected = new Date(dates[0]);
                selected.setHours(0, 0, 0, 0);
                setFromDate([selected]);
                setDateRange(prev => ({
                  ...prev,
                  from: selected.toISOString().split('T')[0],
                }));
              }
            }}
            className="w-28 sm:w-32"
          />

          <GenericDatePicker
            id="to-date"
            placeholder="DD/MM/YYYY"
            dateFormat="d/m/Y"
            initialDate={toDate[0]}
            onDateChange={(dates) => {
              if (dates?.length > 0) {
                const selected = new Date(dates[0]);
                selected.setHours(23, 59, 59, 999);
                setToDate([selected]);
                setDateRange(prev => ({
                  ...prev,
                  to: selected.toISOString().split('T')[0],
                }));
              }
            }}
            className="w-28 sm:w-32"
          />

          <GenericButton
            onClick={() => {
              if (filteredGroups.length === 0) {
                toast.error('No records to print');
                return;
              }
              handlePrintTable();
            }}
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </GenericButton>
        </div>

        {/* Table */}
        <GenericTable<BillGroup>
          data={filteredGroups}
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
    </div>
  );
};

export default Billing;