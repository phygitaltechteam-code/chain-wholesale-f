// SalesReport.tsx - Complete Sales Report matching HTML design exactly
import React, {useState} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  RefreshCw,
} from 'lucide-react';

interface SaleRecord {
  id: string;
  invoiceDate: string;
  billNo: string;
  clientName: string;
  gstNo: string;
  metalDetail: string;
  netWeight: number;
  rate: number;
  taxableValue: number;
  totalPayable: number;
}

const salesData: SaleRecord[] = [
  {
    id: '1',
    invoiceDate: '12 Oct 2023',
    billNo: 'INV-23-4501',
    clientName: 'Ramesh Chandra J.',
    gstNo: 'GST: 27AABCM8811K',
    metalDetail: 'Gold 22K (Jewellery)',
    netWeight: 45.62,
    rate: 5840,
    taxableValue: 266420.8,
    totalPayable: 274413.0,
  },
  {
    id: '2',
    invoiceDate: '12 Oct 2023',
    billNo: 'INV-23-4502',
    clientName: 'A.K. Jewellers',
    gstNo: 'GST: 27AABCM8812L',
    metalDetail: 'Silver Bullion 99.9',
    netWeight: 1000.0,
    rate: 74,
    taxableValue: 74000.0,
    totalPayable: 76220.0,
  },
  {
    id: '3',
    invoiceDate: '13 Oct 2023',
    billNo: 'INV-23-4503',
    clientName: 'Vikas Trading Corp',
    gstNo: 'GST: 27AABCM8813M',
    metalDetail: 'Gold Bullion 99.9',
    netWeight: 100.0,
    rate: 6245,
    taxableValue: 624500.0,
    totalPayable: 643235.0,
  },
  {
    id: '4',
    invoiceDate: '13 Oct 2023',
    billNo: 'INV-23-4504',
    clientName: 'Sunil Mehta',
    gstNo: 'GST: 27AABCM8814N',
    metalDetail: 'Gold 22K (Ornaments)',
    netWeight: 12.45,
    rate: 5860,
    taxableValue: 72957.0,
    totalPayable: 75145.71,
  },
  {
    id: '5',
    invoiceDate: '14 Oct 2023',
    billNo: 'INV-23-4505',
    clientName: 'Priya Jewellers',
    gstNo: 'GST: 27AABCM8815O',
    metalDetail: 'Gold 18K (Studded)',
    netWeight: 8.22,
    rate: 4820,
    taxableValue: 39620.4,
    totalPayable: 40809.0,
  },
];

const metalOptions = [
  'All Metals',
  'Gold (99.9)',
  'Gold (22K)',
  'Silver (99.9)',
];

const billTypeOptions = ['GST Invoice', 'Estimate', 'Export Bill'];

export default function SalesReport() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '2023-10-01',
    end: '2023-10-31',
  });
  const [selectedMetal, setSelectedMetal] = useState('All Metals');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedBillType, setSelectedBillType] = useState('GST Invoice');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter data based on all filters
  const filteredData = salesData.filter((item) => {
    const matchesSearch =
      item.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient =
      selectedClient === '' ||
      item.clientName.toLowerCase().includes(selectedClient.toLowerCase());

    const matchesMetal =
      selectedMetal === 'All Metals' ||
      (selectedMetal === 'Gold (99.9)' &&
        item.metalDetail.includes('Gold Bullion')) ||
      (selectedMetal === 'Gold (22K)' &&
        item.metalDetail.includes('Gold 22K')) ||
      (selectedMetal === 'Silver (99.9)' &&
        item.metalDetail.includes('Silver'));

    return matchesSearch && matchesClient && matchesMetal;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Calculate totals
  const totalNetWeight = currentData.reduce(
    (sum, item) => sum + item.netWeight,
    0,
  );
  const totalTaxableValue = currentData.reduce(
    (sum, item) => sum + item.taxableValue,
    0,
  );
  const totalPayable = currentData.reduce(
    (sum, item) => sum + item.totalPayable,
    0,
  );

  const handleGenerate = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExportCSV = () => {
    console.log('Exporting to CSV...');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="flex flex-1 flex-col gap-6">
      {/* Filters Section - Matching HTML exactly */}
      <div className="bg-surface-container-low border-outline-variant/10 rounded-xl border p-6 shadow-sm">
        <div className="grid grid-cols-5 items-end gap-4">
          <div className="col-span-1 flex flex-col gap-2">
            <label className="text-on-surface-variant/60 ml-1 text-[10px] font-bold uppercase tracking-wider">
              Date Range
            </label>
            <div className="bg-surface-container-lowest border-outline-variant/20 flex rounded-lg border p-1">
              <input
                className="w-full border-none bg-transparent p-1 text-xs focus:ring-0"
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({...dateRange, start: e.target.value})
                }
              />
              <span className="text-outline-variant flex items-center px-1">
                →
              </span>
              <input
                className="w-full border-none bg-transparent p-1 text-xs focus:ring-0"
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({...dateRange, end: e.target.value})
                }
              />
            </div>
          </div>
          <div className="col-span-1 flex flex-col gap-2">
            <label className="text-on-surface-variant/60 ml-1 text-[10px] font-bold uppercase tracking-wider">
              Metal
            </label>
            <select
              className="bg-surface-container-lowest border-outline-variant/20 h-[38px] rounded-lg border p-2 text-xs focus:border-primary focus:ring-primary/20"
              value={selectedMetal}
              onChange={(e) => setSelectedMetal(e.target.value)}
            >
              {metalOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1 flex flex-col gap-2">
            <label className="text-on-surface-variant/60 ml-1 text-[10px] font-bold uppercase tracking-wider">
              Client
            </label>
            <div className="relative">
              <input
                className="bg-surface-container-lowest border-outline-variant/20 h-[38px] w-full rounded-lg border p-2 pr-8 text-xs focus:border-primary focus:ring-primary/20"
                placeholder="Search Client..."
                type="text"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              />
              <span className="material-symbols-outlined text-on-surface-variant/30 absolute right-2 top-2 text-lg">
                person_search
              </span>
            </div>
          </div>
          <div className="col-span-1 flex flex-col gap-2">
            <label className="text-on-surface-variant/60 ml-1 text-[10px] font-bold uppercase tracking-wider">
              Bill Type
            </label>
            <select
              className="bg-surface-container-lowest border-outline-variant/20 h-[38px] rounded-lg border p-2 text-xs focus:border-primary focus:ring-primary/20"
              value={selectedBillType}
              onChange={(e) => setSelectedBillType(e.target.value)}
            >
              {billTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1 flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="to-primary-container flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Table Header Actions - Matching HTML exactly */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline text-on-surface text-xl font-bold">
            Sales Analysis Ledger
          </h3>
          <p className="text-on-surface-variant text-xs">
            Displaying {filteredData.length} records for {dateRange.start} to{' '}
            {dateRange.end}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-surface-container hover:bg-surface-container-high flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            CSV
          </button>
          <button
            onClick={handlePrint}
            className="bg-surface-container hover:bg-surface-container-high flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Print
          </button>
        </div>
      </div>

      {/* Data Table - Matching HTML exactly */}
      <div className="bg-surface-container-lowest border-outline-variant/10 overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container/30 border-outline-variant/20 border-b">
                <th className="text-on-surface-variant/60 px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Invoice Date
                </th>
                <th className="text-on-surface-variant/60 px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Bill #
                </th>
                <th className="text-on-surface-variant/60 px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Client Name
                </th>
                <th className="text-on-surface-variant/60 px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Metal Detail
                </th>
                <th className="text-on-surface-variant/60 px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">
                  Net Wt (g)
                </th>
                <th className="text-on-surface-variant/60 px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">
                  Rate
                </th>
                <th className="text-on-surface-variant/60 px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">
                  Taxable Val
                </th>
                <th className="text-on-surface-variant/60 px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">
                  Total Payable
                </th>
              </tr>
            </thead>
            <tbody className="divide-outline-variant/10 divide-y">
              {currentData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-surface-container-low cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-xs font-medium">
                    {item.invoiceDate}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-primary">
                    {item.billNo}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">
                        {item.clientName}
                      </span>
                      <span className="text-on-surface-variant/60 text-[10px]">
                        {item.gstNo}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs">{item.metalDetail}</td>
                  <td className="px-6 py-4 text-right text-xs font-bold">
                    {item.netWeight.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 text-right text-xs">
                    ₹{item.rate.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-xs">
                    ₹{item.taxableValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-primary">
                    ₹{item.totalPayable.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-primary/20 bg-primary/5">
                  <td
                    className="px-6 py-4 text-xs font-bold text-primary"
                    colSpan={4}
                  >
                    SUB-TOTAL (PAGE)
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-extrabold">
                    {totalNetWeight.toFixed(3)}
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-right text-xs font-extrabold">
                    ₹{totalTaxableValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-extrabold text-primary">
                    ₹{totalPayable.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Pagination - Matching HTML exactly */}
      {filteredData.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-on-surface-variant text-xs">
            Showing {indexOfFirstItem + 1} to{' '}
            {Math.min(indexOfLastItem, filteredData.length)} of{' '}
            {filteredData.length} results
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="hover:bg-surface-container text-on-surface-variant flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">
                chevron_left
              </span>
            </button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const pageNumber = i + 1;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                    currentPage === pageNumber
                      ? 'bg-primary text-white shadow-sm'
                      : 'hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            {totalPages > 5 && (
              <span className="text-on-surface-variant flex h-8 w-8 items-center justify-center text-xs">
                ...
              </span>
            )}
            {totalPages > 5 && (
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="hover:bg-surface-container text-on-surface-variant flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium"
              >
                {totalPages}
              </button>
            )}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="hover:bg-surface-container text-on-surface-variant flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
