// DisplayBill.tsx - Original columns preserved, with exact print design
import {useGetSalesData} from '@/components/Billing/billapi';
import GenericTable, {Column} from '@/components/Forms/Table/GenericTable';
import React, {useState} from 'react';
import {Printer} from 'lucide-react';
import toast from 'react-hot-toast';
import {useAuthContext} from '@/context/AuthContext';

// Sale Record Type Definition based on API response
interface SaleRecord {
  id: string;
  createdAt: string;
  transactionType: string;
  billingMode: string;
  paymentMode: string;
  subTotal: number;
  makingFees: number;
  hsnCode: string;
  gstPercentage: number;
  totalTax: number;
  discount: number;
  exchangeValue: number;
  previousBalance: number;
  netPayable: number;
  cashPaid: number;
  balanceDue: number;
  client: {
    id: string;
    fullname: string;
    phoneNumber: string;
    city?: string;
    GST?: string;
    PAN?: string;
  };
  items?: Array<{
    metalName: string;
    weight: number;
    rate: number;
    amount: number;
  }>;
}

// Filter Options
const metalOptions = ['All', 'Gold', 'Silver'];
const billingTypeOptions = ['All', 'GST_BILL', 'CASH_BILL'];
const paymentModeOptions = ['All', 'CASH_UPI', 'EXCHANGE', 'SPLIT'];

// Date Range Options
const dateRangeOptions = [
  {value: 'today', label: 'Today'},
  {value: 'weekly', label: 'Weekly'},
  {value: 'monthly', label: 'Monthly'},
  {value: 'custom', label: 'Custom'},
];

// Helper for number formatting
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
};

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

interface DisplayBillProps {
  hideHeader?: boolean;
}

const DisplayBill: React.FC<DisplayBillProps> = ({hideHeader = false}) => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedMetal, setSelectedMetal] = useState('All');
  const [selectedBillingType, setSelectedBillingType] = useState('All');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('All');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const {user: currentUser} = useAuthContext();

  // Get sales data from API
  const {
    data: salesDataResponse,
    isLoading: isDataLoading,
    refetch,
  } = useGetSalesData();

  // Extract data array from response
  const salesData: SaleRecord[] = salesDataResponse || [];

  // Calculate date range based on selection
  const getDateRange = () => {
    const today = new Date();
    const start = new Date();
    const end = new Date();

    switch (selectedDateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(today.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setMonth(today.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate),
            end: new Date(customEndDate),
          };
        }
        return {start: new Date(0), end: new Date()};
      default:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }
    return {start, end};
  };

  const {start: startDate, end: endDate} = getDateRange();

  // Filter Logic
  const filteredData = salesData.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.client?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client?.phoneNumber?.includes(searchTerm) ||
      item.id?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesMetal = selectedMetal === 'All';
    if (!matchesMetal && item.items && item.items.length > 0) {
      matchesMetal = item.items.some((i) =>
        selectedMetal === 'Gold'
          ? i.metalName.toLowerCase().includes('gold')
          : selectedMetal === 'Silver'
            ? i.metalName.toLowerCase().includes('silver')
            : false,
      );
    }

    const matchesBillingType =
      selectedBillingType === 'All' || item.billingMode === selectedBillingType;
    const matchesPaymentMode =
      selectedPaymentMode === 'All' || item.paymentMode === selectedPaymentMode;
    const itemDate = new Date(item.createdAt);
    const matchesDate = itemDate >= startDate && itemDate <= endDate;

    return (
      matchesSearch &&
      matchesMetal &&
      matchesBillingType &&
      matchesPaymentMode &&
      matchesDate
    );
  });

  // Sort by date descending (newest first)
  const sortedData = [...filteredData].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    setSelectedDateRange(value);
    setShowCustomDate(value === 'custom');
  };

  // Direct print bill with exact design matching image
  const handlePrintBill = (item: SaleRecord) => {
    // Calculate totals
    const itemsSubtotal =
      item.items?.reduce((sum, i) => sum + i.amount, 0) || 0;
    const totalWithTax = itemsSubtotal + item.makingFees + item.totalTax;
    const afterExchange = totalWithTax - item.exchangeValue;
    const finalTotal =
      afterExchange + (item.previousBalance || 0) - (item.discount || 0);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${item.id.slice(0, 8).toUpperCase()}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              background: #e0e0e0;
              padding: 30px 20px;
              display: flex;
              justify-content: center;
              min-height: 100vh;
            }
            .invoice-container {
              max-width: 800px;
              width: 100%;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .invoice-header {
              background: #1a1a2e;
              color: white;
              text-align: center;
              padding: 25px 30px;
            }
            .invoice-header h1 {
              font-size: 28px;
              color: #B8860B;
              margin-bottom: 5px;
              letter-spacing: 1px;
            }
            .invoice-header .tagline {
              font-size: 9px;
              letter-spacing: 2px;
              opacity: 0.7;
              margin-bottom: 8px;
            }
            .invoice-header .address {
              font-size: 8px;
              opacity: 0.6;
              line-height: 1.4;
            }
            .invoice-body {
              padding: 25px 30px;
            }
            .client-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 1px solid #ddd;
            }
            .client-info h4 {
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              color: #666;
              margin-bottom: 8px;
              letter-spacing: 0.5px;
            }
            .client-info p {
              font-size: 11px;
              margin-bottom: 3px;
            }
            .client-name {
              font-weight: bold;
              font-size: 13px;
              color: #1a1a2e;
            }
            .invoice-details {
              text-align: right;
            }
            .invoice-details p {
              font-size: 11px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              text-align: left;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              color: #666;
              border-bottom: 1px solid #ddd;
              padding-bottom: 8px;
            }
            td {
              font-size: 11px;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .text-right {
              text-align: right;
            }
            .summary {
              margin-top: 15px;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 11px;
            }
            .summary-row.total {
              border-top: 1px solid #ddd;
              margin-top: 10px;
              padding-top: 10px;
              font-weight: bold;
              font-size: 14px;
            }
            .summary-row.total .value {
              color: #B8860B;
              font-size: 16px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 25px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
            }
            .signature {
              margin-top: 20px;
              text-align: center;
            }
            .signature hr {
              width: 150px;
              margin: 0 auto;
              border: none;
              border-top: 1px solid #ccc;
            }
            .signature p {
              font-size: 9px;
              color: #666;
              margin-top: 5px;
            }
            .thankyou {
              text-align: center;
              margin-top: 12px;
              font-size: 9px;
              color: #B8860B;
              font-style: italic;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
            }
            @media (max-width: 600px) {
              body {
                padding: 15px 10px;
              }
              .invoice-header h1 {
                font-size: 22px;
              }
              .invoice-body {
                padding: 15px 20px;
              }
              .client-info {
                flex-direction: column;
                gap: 10px;
              }
              .invoice-details {
                text-align: left;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <h1>${currentUser?.fullname?.toUpperCase() || 'VIKAS JEWELLERS'}</h1>
              <div class="tagline">EXQUISITE CRAFTSMANSHIP SINCE 1988</div>
              <div class="address">
                ${currentUser?.address || 'Goldsmith Street, Jewel Bazaar, Zaveri Mandi, Mumbai-400002'}
              </div>
              
            </div>

            <div class="invoice-body">
              <div class="client-info">
                <div>
                  <h4>BILLED TO</h4>
                  <p class="client-name">${item.client?.fullname || 'N/A'}</p>
                  <p>${item.client?.phoneNumber || 'N/A'}</p>
                  ${item.client?.address ? `<p>${item.client.address}</p>` : ''}
                </div>
                <div class="invoice-details">
                  <h4>INVOICE DETAILS</h4>
                  <p><strong>No:</strong> #${item.id.slice(0, 8).toUpperCase()}</p>
                  <p><strong>Date:</strong> ${formatDate(item.createdAt)}</p>
                  <p><strong>Payment:</strong> ${item.paymentMode}</p>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>DESCRIPTION</th>
                    <th class="text-right">WEIGHT</th>
                    <th class="text-right">RATE</th>
                    <th class="text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  ${item.items
                    ?.map(
                      (i) => `
                    <tr>
                      <td>${i.metalName}</td>
                      <td class="text-right">${i.weight.toFixed(3)}g</td>
                      <td class="text-right">₹${i.rate.toFixed(2)}</td>
                      <td class="text-right"><strong>${formatCurrency(i.amount)}</strong></td>
                    </tr>
                  `,
                    )
                    .join('')}
                  <tr>
                    <td colspan="3" class="text-right">Making Charges</td>
                    <td class="text-right">${formatCurrency(item.makingFees)}</td>
                  </tr>
                  ${
                    item.totalTax > 0
                      ? `
                    <tr>
                      <td colspan="3" class="text-right">GST (${item.gstPercentage}%)</td>
                      <td class="text-right">${formatCurrency(item.totalTax)}</td>
                    </tr>
                  `
                      : ''
                  }
                  ${
                    item.exchangeValue > 0
                      ? `
                    <tr>
                      <td colspan="3" class="text-right">Less: Metal Exchange</td>
                      <td class="text-right" style="color: #5d5c74;">- ${formatCurrency(item.exchangeValue)}</td>
                    </tr>
                  `
                      : ''
                  }
                </tbody>
              </table>

              <div class="summary">
                <div class="summary-row">
                  <span>Bill Balance</span>
                  <span>${formatCurrency(item.subTotal + item.makingFees + item.totalTax - item.exchangeValue)}</span>
                </div>
                ${
                  item.previousBalance > 0
                    ? `
                  <div class="summary-row">
                    <span>Add Old Balance</span>
                    <span>+ ${formatCurrency(item.previousBalance)}</span>
                  </div>
                `
                    : ''
                }
                ${
                  item.discount > 0
                    ? `
                  <div class="summary-row">
                    <span>Less Discount</span>
                    <span style="color: #ba1a1a;">- ${formatCurrency(item.discount)}</span>
                  </div>
                `
                    : ''
                }
                <div class="summary-row total">
                  <span>NET PAYABLE</span>
                  <span class="value">${formatCurrency(item.netPayable)}</span>
                </div>
                <div class="summary-row">
                  <span>Cash Paid</span>
                  <span>${formatCurrency(item.cashPaid)}</span>
                </div>
                <div class="summary-row">
                  <span>Balance Due</span>
                  <span style="${item.balanceDue > 0 ? 'color: #ba1a1a;' : 'color: green;'}">
                    ${item.balanceDue > 0 ? formatCurrency(item.balanceDue) : 'Settled'}
                  </span>
                </div>
              </div>

              <div class="footer">
                <div class="signature">
                  <hr />
                  <p>AUTHORIZED SIGNATORY</p>
                </div>
                <p style="font-size: 7px; color: #999; margin-top: 8px;">
                  This is a computer generated invoice
                </p>
              </div>
            </div>
          </div>
          <script>
            window.print();
            setTimeout(function() { window.close(); }, 1000);
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedMetal('All');
    setSelectedBillingType('All');
    setSelectedPaymentMode('All');
    setSelectedDateRange('today');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // Original table columns - UNCHANGED
  const columns: Column<SaleRecord>[] = [
    {
      header: 'Invoice Date',
      accessor: (item) => formatDate(item.createdAt),
      sortable: true,
      align: 'left',
    },
    {
      header: 'Invoice No',
      accessor: (item) => item.id.slice(0, 8).toUpperCase(),
      sortable: true,
      align: 'left',
    },
    {
      header: 'Client Details',
      accessor: (item) => item.client?.fullname || 'N/A',
      sortable: true,
      align: 'left',
      render: (item) => (
        <div>
          <div className="font-semibold text-[#1a1c1b]">
            {item.client?.fullname || 'N/A'}
          </div>
          <div className="text-xs text-[#4f4535]">
            {item.client?.phoneNumber || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Billing Type',
      accessor: (item) => item.billingMode,
      sortable: true,
      align: 'center',
      render: (item) => (
        <div className="flex justify-center">
          <span
            className={`inline-flex min-w-[50px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-bold ${
              item.billingMode === 'GST_BILL'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {item.billingMode === 'GST_BILL' ? 'GST' : 'Cash'}
          </span>
        </div>
      ),
    },
    {
      header: 'Metal',
      accessor: (item) => item.items?.[0]?.metalName || 'N/A',
      sortable: true,
      align: 'left',
      render: (item) => {
        const metals = item.items?.map((i) => i.metalName).join(', ') || 'N/A';
        return <div className="text-sm">{metals}</div>;
      },
    },
    {
      header: 'Given Metal (g)',
      accessor: (item) =>
        item.items?.reduce((sum, i) => sum + i.weight, 0) || 0,
      sortable: true,
      align: 'right',
      render: (item) => {
        const totalWeight =
          item.items?.reduce((sum, i) => sum + i.weight, 0) || 0;
        return <div className="text-right">{totalWeight.toFixed(3)} g</div>;
      },
    },
    {
      header: 'Exchange Metal (₹)',
      accessor: (item) => item.exchangeValue,
      sortable: true,
      align: 'right',
      render: (item) => (
        <div className="text-right text-[#5d5c74]">
          {item.exchangeValue > 0
            ? `-₹${formatCurrency(item.exchangeValue)}`
            : '-'}
        </div>
      ),
    },
    {
      header: 'Total Amount (₹)',
      accessor: (item) => item.subTotal,
      sortable: true,
      align: 'right',
      render: (item) => (
        <div className="text-right font-semibold text-[#1a1c1b]">
          ₹{formatCurrency(item.subTotal)}
        </div>
      ),
    },
    {
      header: 'Total Bill Value (₹)',
      accessor: (item) => item.netPayable,
      sortable: true,
      align: 'right',
      render: (item) => (
        <div className="text-right font-bold text-[#785600]">
          ₹{formatCurrency(item.netPayable)}
        </div>
      ),
    },
    {
      header: 'Bill',
      accessor: (item) => item.id,
      align: 'center',
      render: (item) => (
        <div className="flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrintBill(item);
            }}
            className="rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#f4f4f2]"
            title="Print Bill"
          >
            <Printer size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f9f9f7]">
      {/* Mobile Filter Toggle Button */}
      <div className="mt-1 px-4 md:hidden">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#eeeeec] py-2.5 text-xs font-bold text-[#4f4535]"
        >
          <span className="material-symbols-outlined text-sm">filter_list</span>
          {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters Section */}
      <div
        className={`mt-3 px-4 transition-all duration-300 ${mobileFiltersOpen ? 'block' : 'hidden md:block'}`}
      >
        <div className="rounded-xl border border-[#d3c4af]/10 bg-[#eeeeec] p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Date Range Tabs */}
            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#4f4535]/70">
                Date Range
              </label>
              <div className="flex flex-wrap gap-1">
                {dateRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDateRangeChange(option.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedDateRange === option.value
                        ? 'bg-[#785600] text-white shadow-sm'
                        : 'bg-white text-[#4f4535] hover:bg-[#e8e8e6]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {showCustomDate && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="flex-1 rounded-lg border border-[#d3c4af]/20 bg-white px-2 py-1.5 text-xs focus:border-[#785600] focus:outline-none"
                    placeholder="Start Date"
                  />
                  <span className="text-xs text-[#4f4535]">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="flex-1 rounded-lg border border-[#d3c4af]/20 bg-white px-2 py-1.5 text-xs focus:border-[#785600] focus:outline-none"
                    placeholder="End Date"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#4f4535]/70">
                Metal
              </label>
              <select
                value={selectedMetal}
                onChange={(e) => setSelectedMetal(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#d3c4af]/20 bg-white px-3 py-2 text-xs focus:border-[#785600] focus:ring-[#785600]/20"
              >
                {metalOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#4f4535]/70">
                Billing Type
              </label>
              <select
                value={selectedBillingType}
                onChange={(e) => setSelectedBillingType(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#d3c4af]/20 bg-white px-3 py-2 text-xs focus:border-[#785600] focus:ring-[#785600]/20"
              >
                {billingTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'GST_BILL'
                      ? 'GST'
                      : opt === 'CASH_BILL'
                        ? 'Cash'
                        : opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#4f4535]/70">
                Payment Mode
              </label>
              <select
                value={selectedPaymentMode}
                onChange={(e) => setSelectedPaymentMode(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-[#d3c4af]/20 bg-white px-3 py-2 text-xs focus:border-[#785600] focus:ring-[#785600]/20"
              >
                {paymentModeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-4 px-4">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#817563]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by Client Name, Phone, or Invoice No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[#d3c4af]/20 bg-white py-2.5 pl-10 pr-3 text-sm transition-all focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 md:py-3"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mt-4 flex items-center justify-between px-4">
        <p className="text-xs text-[#4f4535]">
          Showing {filteredData.length} record
          {filteredData.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={resetFilters}
          className="text-xs text-[#785600] hover:underline"
        >
          Reset All
        </button>
      </div>

      {/* Generic Table */}
      <div className="mt-3 px-4 pb-8">
        <GenericTable
          data={sortedData}
          columns={columns}
          itemsPerPage={10}
          searchable={false}
          loading={isDataLoading}
          emptyMessage="No bills found for the selected filters"
          paginationOff={false}
        />
      </div>

      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
          font-size: 20px;
        }
      `}</style>
    </div>
  );
};

export default DisplayBill;
