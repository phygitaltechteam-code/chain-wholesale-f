import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Save, History, ChevronRight, ChevronDown, Printer} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {useGetBox, useGetBoxHistory, useSubmitBox} from '@/lib/api/box';

interface BoxEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: any;
  size: any;
  tarWeight: number;
  chainWeight: number;
  scrap: number;
  loss: number;
  isEditing?: boolean;
  isSaved?: boolean;
  chainWeightRaw?: string;
  scrapRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
}

// Helper functions for safely extracting values
const getItemName = (item: any): string => {
  if (!item) return '-';

  if (typeof item === 'string') {
    return item;
  }

  if (typeof item === 'object' && item.name) {
    return String(item.name);
  }

  return '-';
};

const getSizeName = (size: any): string => {
  if (!size) return '-';

  if (typeof size === 'string') {
    return size;
  }

  if (typeof size === 'object' && size.size !== undefined) {
    return String(size.size);
  }

  return '-';
};

const BoxDept: React.FC = () => {
  const navigate = useNavigate();
  const [boxEntries, setBoxEntries] = useState<BoxEntry[]>([]);

  console.log('boxEntriessss', boxEntries);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const isInitialMount = useRef(true);

  // Fetch data from API
  const {data: boxData = [], isLoading: boxLoading, refetch} = useGetBox();
  const {
    data: boxHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetBoxHistory();
  const submitBox = useSubmitBox();

  console.log('boxHistoryyy', boxHistory);
  // Load data from API
  useEffect(() => {
    if (boxLoading) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (boxData.length > 0) {
      const entries: BoxEntry[] = boxData.map((box: any, index: number) => {
        const itemName = box.item?.name || box.itemId || 'N/A';
        const sizeName = box.size?.size || box.sizeId || 'N/A';

        const chainWeight = box.chainWeight || 0;
        const tarWeight = box.tarWeight || 0;
        const loss = tarWeight - chainWeight;

        const isSaved =
          box.isCompleted === true &&
          box.chainWeight !== null &&
          box.chainWeight !== undefined &&
          box.scrap !== null &&
          box.scrap !== undefined;

        const dateTime = new Date(box.createdAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        return {
          id: box.id,
          srNo: index + 1,
          dateTime: dateTime,
          item: itemName,
          size: sizeName,
          tarWeight: tarWeight,
          chainWeight: chainWeight,
          scrap: box.scrap || 0,
          loss: loss,
          isEditing: !isSaved,
          isSaved: isSaved,
          chainWeightRaw: box.chainWeight ? box.chainWeight.toString() : '',
          scrapRaw: box.scrap ? box.scrap.toString() : '',
          itemId: box.itemId,
          sizeId: box.sizeId,
          isCompleted: box.isCompleted || false,
        };
      });
      setBoxEntries(entries);
    } else {
      setBoxEntries([]);
    }
  }, [boxData, boxLoading]);

  // Format date helper for history
  const formatDate = (dateString: string) => {
    if (!dateString) return {date: '-', time: '-'};

    const date = new Date(dateString);

    return {
      date: date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

const handlePrintHistory = () => {
  if (!boxHistory || boxHistory.length === 0) {
    toast.error('No history records available to print');
    return;
  }

  // Create a hidden div for printing
  const printContainer = document.createElement('div');
  printContainer.id = 'print-container';
  printContainer.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 100%;
    background: white;
    padding: 20px;
    z-index: 9999;
  `;
  document.body.appendChild(printContainer);

  // Build the table rows
  const rows = boxHistory
    .map((item: any, index: number) => {
      const {date, time} = formatDate(item?.createdAt);
      const {date: proceedDate, time: proceedTime} = formatDate(item?.updatedAt);

      return `
        <tr>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;">${index + 1}</td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;">
            ${date}<br/>
            <span style="font-size:11px;color:#666;">${time}</span>
          </td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;">${getItemName(item?.item)}</td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;">${getSizeName(item?.size)}</td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:right;font-family:monospace;">${formatNumber(item?.tarWeight)}</td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:right;font-family:monospace;">${formatNumber(item?.chainWeight)}</td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:right;font-family:monospace;">${formatNumber(item?.scrap)}</td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:right;font-family:monospace;">${formatNumber(
            item?.loss ?? ((item?.tarWeight || 0) - (item?.chainWeight || 0))
          )}</td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;">
            ${proceedDate}<br/>
            <span style="font-size:11px;color:#666;">${proceedTime}</span>
          </td>
        </tr>
      `;
    })
    .join('');

  // Calculate totals
  const totalTar = boxHistory.reduce((sum: number, item: any) => sum + (item?.tarWeight || 0), 0);
  const totalChain = boxHistory.reduce((sum: number, item: any) => sum + (item?.chainWeight || 0), 0);
  const totalScrap = boxHistory.reduce((sum: number, item: any) => sum + (item?.scrap || 0), 0);
  const totalLoss = boxHistory.reduce((sum: number, item: any) => sum + (item?.loss ?? ((item?.tarWeight || 0) - (item?.chainWeight || 0))), 0);

  // Set the content
  printContainer.innerHTML = `
    <div style="max-width:1200px;margin:0 auto;font-family:Arial,sans-serif;">
      <h2 style="text-align:center;margin:0 0 10px 0;font-size:22px;color:#000;">Box History Report</h2>
      <p style="text-align:center;font-size:12px;color:#666;margin-bottom:20px;">
        Generated: ${new Date().toLocaleString()}
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f2f2f2;font-weight:600;">
            <th style="border:1px solid #000;padding:8px;text-align:center;">Sr No.</th>
            <th style="border:1px solid #000;padding:8px;text-align:center;">Date & Time</th>
            <th style="border:1px solid #000;padding:8px;text-align:center;">Item</th>
            <th style="border:1px solid #000;padding:8px;text-align:center;">Size</th>
            <th style="border:1px solid #000;padding:8px;text-align:center;">Tar (तार)</th>
            <th style="border:1px solid #000;padding:8px;text-align:center;">Chain Weight (G)</th>
            <th style="border:1px solid #000;padding:8px;text-align:center;">Scrap (स्क्रॅप)</th>
            <th style="border:1px solid #000;padding:8px;text-align:center;">Loss</th>
            <th style="border:1px solid #000;padding:8px;text-align:center;">Proceed Date & Time</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr style="background:#f9f9f7;font-weight:bold;">
            <td colspan="4" style="border:1px solid #000;padding:6px 8px;text-align:right;">Total:</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:right;font-family:monospace;">${formatNumber(totalTar)}</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:right;font-family:monospace;">${formatNumber(totalChain)}</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:right;font-family:monospace;">${formatNumber(totalScrap)}</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:right;font-family:monospace;">${formatNumber(totalLoss)}</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;">${boxHistory.length} entries</td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top:20px;padding-top:10px;border-top:2px solid #785600;text-align:center;">
        <p style="font-size:11px;color:#666;margin:2px 0;">This is a system-generated report</p>
        <span style="font-size:10px;color:#999;">Powered by Matoshree Gold | Total Entries: ${boxHistory.length}</span>
      </div>
    </div>
  `;

  // Add print styles
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      body * {
        visibility: hidden;
      }
      #print-container, #print-container * {
        visibility: visible;
      }
      #print-container {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: white !important;
        padding: 20px !important;
        overflow: auto !important;
        z-index: 9999 !important;
      }
      #print-container table {
        width: 100% !important;
      }
      #print-container tr {
        page-break-inside: avoid !important;
      }
    }
  `;
  document.head.appendChild(style);

  // Trigger print
  setTimeout(() => {
    window.print();
    
    // Clean up after print
    setTimeout(() => {
      document.body.removeChild(printContainer);
      document.head.removeChild(style);
    }, 1000);
  }, 500);
};

  // Format number helper for history
  const formatNumber = (value: any) => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toFixed(0);
  };

  // History table columns - FIXED with proper safety
  const historyColumns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (item) => {
        console.log('itemmmmm', item);
        const {date, time} = formatDate(item?.createdAt);

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {date}
            </span>

            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {time}
            </span>
          </div>
        );
      },
    },

    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item?.item?.name}
        </span>
      ),
    },

    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item?.size?.size}
        </span>
      ),
    },

    {
      key: 'tarWeight',
      header: 'Tar (तार)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item?.tarWeight)}
        </span>
      ),
    },

    {
      key: 'chainWeight',
      header: 'Chain Weight (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item?.chainWeight)}
        </span>
      ),
    },

    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item?.scrap)}
        </span>
      ),
    },

    {
      key: 'loss',
      header: 'Loss',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item?.loss)}
        </span>
      ),
    },

    {
      key: 'updatedAt',
      header: 'Proceed Date & Time',
      render: (item) => {
        const {date, time} = formatDate(item?.updatedAt);

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {date}
            </span>

            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {time}
            </span>
          </div>
        );
      },
    },
  ];

  // Handle inline field change
  const handleInlineChange = useCallback(
    (index: number, field: 'chainWeight' | 'scrap', value: string) => {
      setBoxEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = {...entry};

            if (field === 'chainWeight') {
              updated.chainWeightRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.chainWeight = 0;
              } else {
                const numValue = parseFloat(value);
                updated.chainWeight = isNaN(numValue) ? 0 : numValue;
              }
              updated.loss = Math.max(0, entry.tarWeight - updated.chainWeight);
            } else if (field === 'scrap') {
              updated.scrapRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.scrap = 0;
              } else {
                const numValue = parseFloat(value);
                updated.scrap = isNaN(numValue) ? 0 : numValue;
              }
            }

            return updated;
          }
          return entry;
        }),
      );
    },
    [],
  );

  // Open confirmation popup before saving
  const handleSaveClick = useCallback(
    (index: number) => {
      const entry = boxEntries[index];

      if (!entry.chainWeight || entry.chainWeight < 0) {
        toast.error('Please enter a valid chain weight');
        return;
      }

      if (!entry.scrap || entry.scrap < 0) {
        toast.error('Please enter a valid scrap weight');
        return;
      }

      if (entry.loss < 0) {
        toast.error(
          'Loss Weight cannot be negative. Chain weight must be less than or equal to Tar Weight.',
        );
        return;
      }

      setSaveIndex(index);
      setShowConfirmModal(true);
    },
    [boxEntries],
  );

  // Confirm and save
  const confirmSave = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = boxEntries[index];

    setIsLoading(true);

    try {
      await submitBox.mutateAsync({
        id: entry.id,
        data: {
          chainWeight: entry.chainWeight,
          scrap: entry.scrap,
          loss: entry.loss,
          isCompleted: true,
        },
      });

      setBoxEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? {...s, isEditing: false, isSaved: true, isCompleted: true}
            : s,
        ),
      );

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();

      navigate({
        to: '/manufacturingprocess/process',
        state: {selectedTab: 'soldering'},
      });
    } catch (error) {
      console.error('Error saving box:', error);
      toast.error('Failed to save box entry');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  }, [saveIndex, boxEntries, submitBox, navigate, refetch]);

  const formatNumberDisplay = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  // Check if all entries are saved
  const allSaved = boxEntries.every((entry) => entry.isSaved);

  // Custom action renderer
  const renderActions = useCallback(
    (item: BoxEntry, index: number) => {
      if (item.isEditing) {
        return (
          <button
            onClick={() => handleSaveClick(index)}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-2 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            title="Save Entry"
          >
            <Save className="h-3 w-3" />
            <span>Save</span>
          </button>
        );
      }
      return (
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          ✓ Completed
        </span>
      );
    },
    [isLoading, handleSaveClick],
  );

  // Define columns for GenericTable - main table
  const columns: Column<BoxEntry>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        console.log('entryItem', item);
        const parts = item.dateTime ? item.dateTime.split(', ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts[1] || '';

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {datePart}
            </span>
            <span className="text-sm text-[#4f4535] dark:text-slate-400">
              {timePart}
            </span>
          </div>
        );
      },
    },
    {
      key: 'itemName',
      header: 'Item',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {typeof item?.item === 'object'
            ? (item?.item?.name ?? '-')
            : (item?.item ?? '-')}
        </span>
      ),
    },
    {
      key: 'sizeName',
      header: 'Size',

      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {typeof item?.size === 'object'
            ? (item?.size?.size ?? '-')
            : (item?.size ?? '-')}
        </span>
      ),
    },
    {
      key: 'tarWeight',
      header: 'Tar(तार)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.tarWeight)}
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Weight(G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={
                item.chainWeightRaw !== undefined
                  ? item.chainWeightRaw
                  : item.chainWeight === 0
                    ? ''
                    : item.chainWeight
              }
              onChange={(e) =>
                handleInlineChange(index, 'chainWeight', e.target.value)
              }
              placeholder="0.000"
              className="font-mono w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.chainWeight)}
          </span>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={
                item.scrapRaw !== undefined
                  ? item.scrapRaw
                  : item.scrap === 0
                    ? ''
                    : item.scrap
              }
              onChange={(e) =>
                handleInlineChange(index, 'scrap', e.target.value)
              }
              placeholder="0.000"
              className="font-mono w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.scrap)}
          </span>
        );
      },
    },
    {
      key: 'loss',
      header: 'Loss',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.loss)}
        </span>
      ),
    },
  ];

  const isSubmitting = submitBox.isPending;

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      refetch();
    } else {
      setShowHistory(true);
      refetchHistory();
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-bold text-[#1a1c1b] dark:text-white sm:text-base md:text-lg">
              {showHistory ? 'Box History' : 'Box Department'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* PRINT HISTORY */}
            {showHistory && (
              <GenericButton
                type="button"
                onClick={handlePrintHistory}
                className="flex items-center gap-1.5 whitespace-nowrap !bg-blue-600 !px-3 !py-1.5 !text-xs !text-white hover:!bg-blue-700 sm:!px-4 sm:!py-2 sm:!text-sm"
              >
                <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Print</span>
              </GenericButton>
            )}

            {/* HISTORY / SHOW BOX */}
            <GenericButton
              type="button"
              onClick={toggleHistory}
              className={`flex items-center gap-1.5 whitespace-nowrap !px-3 !py-1.5 !text-xs !text-white sm:!px-4 sm:!py-2 sm:!text-sm ${
                showHistory
                  ? '!bg-amber-600 hover:!bg-amber-700'
                  : '!bg-blue-600 hover:!bg-blue-700'
              }`}
            >
              {showHistory ? (
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}

              <span>{showHistory ? 'Show Box' : 'History'}</span>
            </GenericButton>
          </div>
        </div>
      </div>

      {/* Conditional Rendering: Box Table OR History Table */}
      {!showHistory ? (
        <div className="px-3 py-4 sm:px-4 md:px-6">
          <GenericTable<BoxEntry>
            data={boxEntries}
            columns={columns}
            onSave={(item, index) => handleSaveClick(index)}
            emptyMessage="No box entries found."
            isLoading={boxLoading || isSubmitting}
            renderActions={!allSaved ? renderActions : undefined}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      ) : (
        <div className="px-3 py-4 sm:px-4 md:px-6">
          <GenericTable
            data={boxHistory}
            columns={historyColumns}
            emptyMessage="No history records found. Complete a box process to see history."
            isLoading={historyLoading}
            showSrNo={true}
            srNoLabel="Sr No."
            className="shadow-sm"
          />
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-center">
                <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                  <Save className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Save
              </h3>
              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this box entry? This will move to
                the{' '}
                <strong className="text-[#785600] dark:text-amber-400">
                  Soldering Department
                </strong>
                .
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSaveIndex(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  disabled={isLoading}
                  className="rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Confirm Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoxDept;
