// manufacturingprocess/Billing.tsx
import React, { useState, useEffect } from 'react';
import { Eye, X, Search, Printer, Edit, Trash2, Filter, Calendar, Plus } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import toast from 'react-hot-toast';
import GenericButton from '../Forms/Buttons/GenericButton';

interface BillingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  billNo: string;
  clientName: string;
  phoneNumber: string;
  item: string;
  size: string;
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<BillingEntry | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dateRange, setDateRange] = useState<'weekly' | 'monthly' | 'all'>('weekly');

  // Static data
  const staticData: BillingEntry[] = [
    {
      id: '1',
      srNo: 1,
      dateTime: '05/08/2026, 10:30 AM',
      billNo: 'BILL-0001',
      clientName: 'Rajesh Kumar',
      phoneNumber: '9876543210',
      item: 'Gold Chain',
      size: '18',
      finWt: 15.5,
      srp: 45000,
      receive: 12.0,
      pending: 3.5,
      status: 'completed',
      createdAt: '2026-08-05T10:30:00.000Z',
    },
    {
      id: '2',
      srNo: 2,
      dateTime: '05/08/2026, 11:45 AM',
      billNo: 'BILL-0002',
      clientName: 'Priya Sharma',
      phoneNumber: '8765432109',
      item: 'Gold Bracelet',
      size: '16',
      finWt: 8.2,
      srp: 28000,
      receive: 5.0,
      pending: 3.2,
      status: 'pending',
      createdAt: '2026-08-05T11:45:00.000Z',
    },
    {
      id: '3',
      srNo: 3,
      dateTime: '04/08/2026, 09:15 AM',
      billNo: 'BILL-0003',
      clientName: 'Amit Patel',
      phoneNumber: '7654321098',
      item: 'Gold Ring',
      size: '22',
      finWt: 4.8,
      srp: 15000,
      receive: 4.8,
      pending: 0.0,
      status: 'completed',
      createdAt: '2026-08-04T09:15:00.000Z',
    },
    {
      id: '4',
      srNo: 4,
      dateTime: '04/08/2026, 02:30 PM',
      billNo: 'BILL-0004',
      clientName: 'Sneha Reddy',
      phoneNumber: '6543210987',
      item: 'Gold Earrings',
      size: '14',
      finWt: 3.2,
      srp: 12000,
      receive: 2.0,
      pending: 1.2,
      status: 'draft',
      createdAt: '2026-08-04T14:30:00.000Z',
    },
    {
      id: '5',
      srNo: 5,
      dateTime: '03/08/2026, 04:00 PM',
      billNo: 'BILL-0005',
      clientName: 'Vikram Singh',
      phoneNumber: '5432109876',
      item: 'Gold Necklace',
      size: '20',
      finWt: 22.5,
      srp: 65000,
      receive: 18.0,
      pending: 4.5,
      status: 'pending',
      createdAt: '2026-08-03T16:00:00.000Z',
    },
    {
      id: '6',
      srNo: 6,
      dateTime: '03/08/2026, 11:20 AM',
      billNo: 'BILL-0006',
      clientName: 'Meera Joshi',
      phoneNumber: '4321098765',
      item: 'Gold Pendant',
      size: '10',
      finWt: 2.5,
      srp: 8000,
      receive: 2.5,
      pending: 0.0,
      status: 'completed',
      createdAt: '2026-08-03T11:20:00.000Z',
    },
    {
      id: '7',
      srNo: 7,
      dateTime: '02/08/2026, 10:00 AM',
      billNo: 'BILL-0007',
      clientName: 'Ravi Desai',
      phoneNumber: '3210987654',
      item: 'Gold Bangle',
      size: '24',
      finWt: 12.8,
      srp: 38000,
      receive: 10.0,
      pending: 2.8,
      status: 'draft',
      createdAt: '2026-08-02T10:00:00.000Z',
    },
    {
      id: '8',
      srNo: 8,
      dateTime: '02/08/2026, 03:45 PM',
      billNo: 'BILL-0008',
      clientName: 'Kavita Nair',
      phoneNumber: '2109876543',
      item: 'Gold Chain',
      size: '20',
      finWt: 18.3,
      srp: 52000,
      receive: 15.0,
      pending: 3.3,
      status: 'completed',
      createdAt: '2026-08-02T15:45:00.000Z',
    },
  ];

  useEffect(() => {
    setBillingEntries(staticData);
  }, []);

  // Get week range (Monday to Sunday)
  const getWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  // Get month range
  const getMonthRange = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  // Filter entries
  const filteredEntries = billingEntries.filter(entry => {
    const matchesSearch =
      entry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.phoneNumber.includes(searchTerm) ||
      entry.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.item.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;

    let matchesDate = true;
    const entryDate = new Date(entry.createdAt);

    if (dateRange === 'weekly') {
      const { monday, sunday } = getWeekRange();
      matchesDate = entryDate >= monday && entryDate <= sunday;
    } else if (dateRange === 'monthly') {
      const { start, end } = getMonthRange();
      matchesDate = entryDate >= start && entryDate <= end;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handlePreview = (entry: BillingEntry) => {
    setSelectedEntry(entry);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedEntry(null);
  };

  const handleEdit = (entry: BillingEntry) => {
    toast.success(`Editing bill ${entry.billNo}`);
  };

  const handleDelete = (entry: BillingEntry) => {
    if (window.confirm(`Are you sure you want to delete bill ${entry.billNo}?`)) {
      setBillingEntries(prev => prev.filter(e => e.id !== entry.id));
      toast.success(`Bill ${entry.billNo} deleted successfully`);
    }
  };

  const formatNumber = (value: number) => {
    if (value === 0) return '0.000';
    return value.toFixed(3);
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
        onClick={() => handlePreview(item)}
        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
        title="Preview"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleEdit(item)}
        className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
        title="Edit"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDelete(item)}
        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.dateTime}
        </span>
      ),
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
      key: 'finWt',
      header: 'Fin Wt (g)',
      render: (item) => (
        <span className="text-sm font-mono font-bold text-[#785600] dark:text-amber-400">
          {formatNumber(item.finWt)}
        </span>
      ),
    },
    {
      key: 'srp',
      header: 'SRP (Majri)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.srp)}
        </span>
      ),
    },
    {
      key: 'receive',
      header: 'Receive (g)',
      render: (item) => (
        <span className="text-sm font-mono text-green-600 dark:text-green-400">
          {formatNumber(item.receive)}
        </span>
      ),
    },
    {
      key: 'pending',
      header: 'Pending (g)',
      render: (item) => (
        <span className="text-sm font-mono text-red-600 dark:text-red-400">
          {formatNumber(item.pending)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      ),
    },
  ];

  const ReceiptPreview = ({ entry }: { entry: BillingEntry }) => (
    <div className="bg-white p-6 max-w-2xl mx-auto font-mono">
      <div className="text-center border-b-2 border-black pb-3 mb-3">
        <h1 className="text-xl font-bold tracking-wider">MATOSHREE GOLD MIRAI</h1>
        <p className="text-sm">Bill No: {entry.billNo}</p>
        <p className="text-sm">Date: {entry.dateTime}</p>
      </div>
      <div className="mb-3 text-sm">
        <div className="flex justify-between">
          <span><strong>Client:</strong> {entry.clientName}</span>
          <span><strong>Phone:</strong> {entry.phoneNumber}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span><strong>Item:</strong> {entry.item}</span>
          <span><strong>Size:</strong> {entry.size}</span>
        </div>
      </div>
      <div className="text-sm border-t border-black pt-2">
        <div className="flex justify-between py-1">
          <span><strong>Fin Wt:</strong></span>
          <span>{formatNumber(entry.finWt)} g</span>
        </div>
        <div className="flex justify-between py-1">
          <span><strong>SRP (Majri):</strong></span>
          <span>{formatNumber(entry.srp)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span><strong>Receive:</strong></span>
          <span>{formatNumber(entry.receive)} g</span>
        </div>
        <div className="flex justify-between py-1 border-t border-black">
          <span><strong>Pending:</strong></span>
          <span>{formatNumber(entry.pending)} g</span>
        </div>
        <div className="flex justify-between py-1">
          <span><strong>Status:</strong></span>
          <span className="font-bold capitalize">{entry.status}</span>
        </div>
      </div>
      <div className="mt-4 pt-2 border-t-2 border-black text-center text-xs">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );

  return (
    <div className=" bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-4 py-4 md:px-8 md:py-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <PageHeader
              title="Billing"
              subtitle="Generate invoices and receipts for finished products"
            />
          </div>
          <GenericButton
            type="button"
            onClick={() => navigate({ to: '/receipt/addreciept' })}
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />

            <span className="xs:hidden">Add Bill</span>
          </GenericButton>
        </div>

        {/* Filters - All on one line */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#817563]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Date Range Filters */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#817563]" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'weekly' | 'monthly' | 'all')}
              className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Generic Table */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable<BillingEntry>
            data={filteredEntries}
            columns={columns}
            onSave={(item) => console.log('Save:', item)}
            emptyMessage="No billing entries found for the selected filters."
            isLoading={false}
            renderActions={renderActions}
            showSrNo={true}
            srNoLabel="Sr No."
          />
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
                  onClick={() => window.print()}
                  className="rounded-lg bg-[#785600] px-4 py-2 text-sm font-medium text-white hover:bg-[#5d4200] flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
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