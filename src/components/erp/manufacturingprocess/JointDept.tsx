import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, History, ChevronRight, ChevronDown, Printer } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetJoint, useGetJointHistory, useSubmitJoint } from '@/lib/api/joint';
import GenericDatePicker from '@/components/Forms/DatePicker/GenericDatePicker';

interface JointEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: number;
  chainWeight: number;
  chainReceived: number;
  powder: number;
  powderReceived: number;
  srp: number;
  scrap: number;
  isEditing?: boolean;
  isSaved?: boolean;
  powderReceivedRaw?: string;
  srpRaw?: string;
  purityRaw?: string;
  scrapRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
}

// Helper functions for safely extracting values
const getItemName = (item: any): string => {
  if (!item) return '-';
  if (typeof item === 'string') return item;
  if (item.name) return item.name;
  return '-';
};

const getSizeName = (size: any): string => {
  if (!size) return '-';
  if (typeof size === 'string') return size;
  if (size.size) return size.size;
  return '-';
};

const JointDept: React.FC = () => {
  const navigate = useNavigate();
  const [jointEntries, setJointEntries] = useState<JointEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fromDate, setFromDate] = useState<Date[]>([]);
  const [toDate, setToDate] = useState<Date[]>([]);
  const isInitialMount = useRef(true);

  // Fetch data from API
  const { data: jointData = [], isLoading: jointLoading, refetch } = useGetJoint();
  const { data: jointHistory = [], isLoading: historyLoading, refetch: refetchHistory } = useGetJointHistory();
  const submitJoint = useSubmitJoint();

  // Load data from API
  useEffect(() => {
    if (jointLoading) {
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (jointData.length > 0) {
      const entries: JointEntry[] = jointData.map((joint: any, index: number) => {
        const itemName = joint.item?.name || joint.itemId || 'N/A';
        const sizeName = joint.size?.size || joint.sizeId || 'N/A';

        const isSaved = joint.isCompleted === true &&
          joint.powderReceived !== null &&
          joint.powderReceived !== undefined &&
          joint.srp !== null &&
          joint.srp !== undefined &&
          joint.purity !== null &&
          joint.purity !== undefined &&
          joint.scrap !== null &&
          joint.scrap !== undefined;

        return {
          id: joint.id,
          srNo: index + 1,
          dateTime: new Date(joint.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          item: itemName,
          size: sizeName,
          purity: joint.purity || 0,
          chainWeight: joint.chainWeight || 0,
          chainReceived: joint.chainReceived || 0,
          powder: joint.powder || 0,
          powderReceived: joint.powderReceived || 0,
          srp: joint.srp || 0,
          scrap: joint.scrap || 0,
          isEditing: !isSaved,
          isSaved: isSaved,
          powderReceivedRaw: joint.powderReceived ? joint.powderReceived.toString() : '',
          srpRaw: joint.srp ? joint.srp.toString() : '',
          purityRaw: joint.purity ? joint.purity.toString() : '',
          scrapRaw: joint.scrap ? joint.scrap.toString() : '',
          itemId: joint.itemId,
          sizeId: joint.sizeId,
          isCompleted: joint.isCompleted || false,
        };
      });
      setJointEntries(entries);
    } else {
      setJointEntries([]);
    }
  }, [jointData, jointLoading]);

  // Format date helper for history
  const formatDate = (dateString: string) => {
    if (!dateString) return { date: '-', time: '-' };
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

  // Format number helper for history
  const formatNumber = (value: any) => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toFixed(0);
  };

  // Format number for display
  const formatNumberDisplay = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  // Filter history by date
  const getFilteredHistory = () => {
    let filtered = jointHistory;

    if (fromDate.length > 0 && toDate.length > 0) {
      const from = new Date(fromDate[0]);
      const to = new Date(toDate[0]);
      to.setHours(23, 59, 59, 999);
      
      filtered = jointHistory.filter((item: any) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= from && itemDate <= to;
      });
    }

    return filtered;
  };

  // Print History Function
  const handlePrintHistory = () => {
    const filteredData = getFilteredHistory();
    
    if (!filteredData || filteredData.length === 0) {
      toast.error('No history records available to print for the selected date range');
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
        padding: 4px;
        z-index: 9999;
    `;
    document.body.appendChild(printContainer);

    // Build the table rows - Compact with minimum padding
    const rows = filteredData
        .map((item: any, index: number) => {
            const { date, time } = formatDate(item?.createdAt);
            const { date: proceedDate, time: proceedTime } = formatDate(item?.updatedAt);

            return `
                <tr>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${index + 1}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
                        ${date} ${time}
                    </td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${getItemName(item?.item)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${getSizeName(item?.size)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item?.chainWeight)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item?.chainReceived)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item?.powder)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item?.powderReceived)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item?.purity)}%</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item?.srp)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item?.scrap)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
                        ${proceedDate} ${proceedTime}
                    </td>
                </tr>
            `;
        })
        .join('');

    // Calculate totals
    const totalChainWeight = filteredData.reduce((sum: number, item: any) => sum + (item?.chainWeight || 0), 0);
    const totalChainReceived = filteredData.reduce((sum: number, item: any) => sum + (item?.chainReceived || 0), 0);
    const totalPowder = filteredData.reduce((sum: number, item: any) => sum + (item?.powder || 0), 0);
    const totalPowderReceived = filteredData.reduce((sum: number, item: any) => sum + (item?.powderReceived || 0), 0);
    const totalSRP = filteredData.reduce((sum: number, item: any) => sum + (item?.srp || 0), 0);
    const totalScrap = filteredData.reduce((sum: number, item: any) => sum + (item?.scrap || 0), 0);

    // Set the content with PDF Header - Minimal padding
    printContainer.innerHTML = `
        <div style="max-width:1200px;margin:0 auto;font-family:Arial,sans-serif;padding:0;">
            <!-- PDF Header -->
            <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin:0;padding:0;font-size:11px;font-weight:bold;color:#a84b20;">
                    <span>॥ श्री गणेश प्रसन्न ॥</span>
                    <span>॥ श्री साई प्रसन्न ॥</span>
                </div>
                <div style="margin:1px 0 0 0;padding:0;font-size:20px;font-weight:bold;color:#c43d5c;line-height:1.1;">
                    मातोश्री चेन फॅक्टरी
                </div>
                <div style="margin:1px 0 0 0;padding:0;font-size:10px;font-weight:bold;color:#8b451f;line-height:1.2;">
                    आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.
                </div>
                <div style="margin:1px 0 0 0;padding:0;font-size:10px;font-weight:bold;color:#a84b20;line-height:1.2;">
                    प्रो. नितीन खरात&nbsp;&nbsp; मो. ९३७०२४७०३५ / ९३०९३५५१३६
                </div>
                <div style="border-bottom:2px solid #c43d5c;margin:2px 0 3px 0;"></div>
            </div>

            <!-- Title -->
            <h2 style="text-align:center;margin:2px 0 2px 0;font-size:16px;color:#000;padding:0;">Joint History Report</h2>
            ${fromDate.length > 0 && toDate.length > 0 ? `
                <p style="text-align:center;font-size:10px;color:#000;margin:0 0 2px 0;">
                    Date Range: ${new Date(fromDate[0]).toLocaleDateString()} to ${new Date(toDate[0]).toLocaleDateString()}
                </p>
            ` : ''}

            <!-- Table -->
            <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">
                <thead>
                    <tr style="background:#785600;color:white;font-weight:600;">
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Sr</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Date & Time</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Item</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Size</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Chain Given</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Chain Rec</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Powder</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Powder Rec</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Purity %</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">SRP</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Scrap</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Proceed</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>

            </table>
        </div>
    `;

    // Add print styles
    const style = document.createElement('style');
    style.textContent = `
        @page {
            margin: 3mm;
        }
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
                padding: 4px !important;
                overflow: auto !important;
                z-index: 9999 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            #print-container table {
                width: 100% !important;
            }
            #print-container tr {
                page-break-inside: avoid !important;
            }
            #print-container thead tr {
                background: #785600 !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            #print-container thead tr th {
                background: #785600 !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    `;
    document.head.appendChild(style);

    // Trigger print
    setTimeout(() => {
        window.print();
        
        // Clean up after print
        setTimeout(() => {
            if (document.body.contains(printContainer)) {
                document.body.removeChild(printContainer);
            }
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        }, 1000);
    }, 500);
  };

  // History table columns
  const historyColumns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (item) => {
        const { date, time } = formatDate(item.createdAt);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">{date}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{time}</span>
          </div>
        );
      },
    },
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {getItemName(item?.item)}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {getSizeName(item?.size)}
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Given',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.chainWeight)}
        </span>
      ),
    },
    {
      key: 'chainReceived',
      header: 'Chain Received',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.chainReceived)}
        </span>
      ),
    },
    {
      key: 'powder',
      header: 'Powder',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.powder)}
        </span>
      ),
    },
    {
      key: 'powderReceived',
      header: 'Powder Received',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.powderReceived)}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.purity)}%
        </span>
      ),
    },
    {
      key: 'srp',
      header: 'SRP (Majuri)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.srp)}
        </span>
      ),
    },
    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.scrap)}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Proceed Date & Time',
      render: (item) => {
        const { date, time } = formatDate(item.updatedAt);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">{date}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{time}</span>
          </div>
        );
      },
    },
  ];

  // Handle inline field change
  const handleInlineChange = useCallback((index: number, field: 'powderReceived' | 'srp' | 'purity' | 'scrap', value: string) => {
    setJointEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        const updated = { ...entry };

        if (field === 'powderReceived') {
          updated.powderReceivedRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.powderReceived = 0;
          } else {
            const numValue = parseFloat(value);
            updated.powderReceived = isNaN(numValue) ? 0 : numValue;
          }
        } else if (field === 'srp') {
          updated.srpRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.srp = 0;
          } else {
            const numValue = parseFloat(value);
            updated.srp = isNaN(numValue) ? 0 : numValue;
          }
        } else if (field === 'purity') {
          updated.purityRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.purity = 0;
          } else {
            const numValue = parseFloat(value);
            updated.purity = isNaN(numValue) ? 0 : numValue;
          }
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
    }));
  }, []);

  // Open confirmation popup before saving
  const handleSaveClick = useCallback((index: number) => {
    const entry = jointEntries[index];

    if (!entry.powderReceived || entry.powderReceived < 0) {
      toast.error('Please enter a valid powder received weight');
      return;
    }

    if (!entry.srp || entry.srp < 0) {
      toast.error('Please enter a valid SRP (Majuri)');
      return;
    }

    if (!entry.purity || entry.purity < 0) {
      toast.error('Please enter a valid purity percentage');
      return;
    }

    if (!entry.scrap || entry.scrap < 0) {
      toast.error('Please enter a valid scrap weight');
      return;
    }

    setSaveIndex(index);
    setShowConfirmModal(true);
  }, [jointEntries]);

  // Confirm and save
  const confirmSave = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = jointEntries[index];

    setIsLoading(true);

    try {
      await submitJoint.mutateAsync({
        id: entry.id,
        data: {
          powderReceived: entry.powderReceived,
          srp: entry.srp,
          purity: entry.purity,
          scrap: entry.scrap,
          isCompleted: true,
        }
      });

      setJointEntries(prev => prev.map((s, i) =>
        i === index ? { ...s, isEditing: false, isSaved: true, isCompleted: true } : s
      ));

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();

      navigate({
        to: '/manufacturingprocess/process',
        state: { selectedTab: 'cutting' }
      });
    } catch (error) {
      console.error('Error saving joint:', error);
      toast.error('Failed to save joint entry');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  }, [saveIndex, jointEntries, submitJoint, navigate, refetch]);

  // Check if all entries are saved
  const allSaved = jointEntries.every(entry => entry.isSaved);

  // Custom action renderer
  const renderActions = useCallback((item: JointEntry, index: number) => {
    if (item.isEditing) {
      return (
        <button
          onClick={() => handleSaveClick(index)}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-2 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          title="Save Entry"
        >
          <Save className="h-3 w-3" />
          <span>Save</span>
        </button>
      );
    }
    return (
      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        ✓ Completed
      </span>
    );
  }, [isLoading, handleSaveClick]);

  // Define columns for GenericTable
  const columns: Column<JointEntry>[] = [
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
            <span className="text-sm text-[#4f4535] dark:text-slate-400">
              {timePart}
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
          {typeof item?.item === 'object'
            ? (item?.item?.name ?? '-')
            : (item?.item ?? '-')}
        </span>
      ),
    },
    {
      key: 'size',
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
      key: 'chainWeight',
      header: 'Chain Given',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainWeight)}
        </span>
      ),
    },
    {
      key: 'chainReceived',
      header: 'Chain Received',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainReceived)}
        </span>
      ),
    },
    {
      key: 'powder',
      header: 'Powder',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.powder)}
        </span>
      ),
    },
    {
      key: 'powderReceived',
      header: 'Powder Received',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.powderReceivedRaw !== undefined ? item.powderReceivedRaw : (item.powderReceived === 0 ? '' : item.powderReceived)}
              onChange={(e) => handleInlineChange(index, 'powderReceived', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.powderReceived)}
          </span>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.purityRaw !== undefined ? item.purityRaw : (item.purity === 0 ? '' : item.purity)}
              onChange={(e) => handleInlineChange(index, 'purity', e.target.value)}
              placeholder="e.g., 98 %"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity)}
          </span>
        );
      },
    },
    {
      key: 'srp',
      header: 'SRP (Majuri)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.srpRaw !== undefined ? item.srpRaw : (item.srp === 0 ? '' : item.srp)}
              onChange={(e) => handleInlineChange(index, 'srp', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.srp)}
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
              value={item.scrapRaw !== undefined ? item.scrapRaw : (item.scrap === 0 ? '' : item.scrap)}
              onChange={(e) => handleInlineChange(index, 'scrap', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
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
  ];

  const isSubmitting = submitJoint.isPending;

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      refetch();
    } else {
      setShowHistory(true);
      refetchHistory();
    }
  };

  // Clear date filters
  const clearDateFilters = () => {
    setFromDate([]);
    setToDate([]);
  };

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#f9f9f7] dark:bg-slate-950 border-b border-[#d3c4af]/10 dark:border-slate-700">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-[#1a1c1b] dark:text-white truncate">
              {showHistory ? 'Joint History' : 'Joint Department'}
            </h1>
           
          </div>
          <div className="flex items-center gap-2">
            {/* Date Filters - Only show when viewing history */}
            {showHistory && (
              <>
                <div className="flex items-center gap-2">
                  <GenericDatePicker
                    id="from-date-joint"
                    placeholder="From Date"
                    dateFormat="d/m/Y"
                    onDateChange={(dates) => setFromDate(dates)}
                    className="w-24 sm:w-28"
                  />
                  <span className="text-xs text-[#4f4535] dark:text-slate-400">to</span>
                  <GenericDatePicker
                    id="to-date-joint"
                    placeholder="To Date"
                    dateFormat="d/m/Y"
                    onDateChange={(dates) => setToDate(dates)}
                    className="w-24 sm:w-28"
                  />
                  {(fromDate.length > 0 || toDate.length > 0) && (
                    <button
                      onClick={clearDateFilters}
                      className="rounded-lg p-1 text-[#4f4535] hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                      title="Clear filters"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Print History Button */}
            {showHistory && (
              <GenericButton
                type="button"
                onClick={handlePrintHistory}
                className="flex items-center gap-1.5 whitespace-nowrap !bg-green-600 !px-3 !py-1.5 !text-xs !text-white hover:!bg-green-700 sm:!px-4 sm:!py-2 sm:!text-sm"
              >
                <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Print</span>
              </GenericButton>
            )}

            {/* History Toggle Button */}
            <GenericButton
              type="button"
              onClick={toggleHistory}
              className={`flex items-center gap-1.5 !px-3 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm !text-white whitespace-nowrap ${
                showHistory ? '!bg-amber-600 hover:!bg-amber-700' : '!bg-blue-600 hover:!bg-blue-700'
              }`}
            >
              {showHistory ? (
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span>
                {showHistory ? 'Show Joint' : 'History'}
              </span>
            </GenericButton>
          </div>
        </div>
      </div>

      {/* Conditional Rendering: Joint Table OR History Table */}
      {!showHistory ? (
        /* Joint Department Table */
        <div className="px-3 py-4 sm:px-4 md:px-6">
          <GenericTable<JointEntry>
            data={jointEntries}
            columns={columns}
            onSave={(item, index) => handleSaveClick(index)}
            emptyMessage="No joint entries found."
            isLoading={jointLoading || isSubmitting}
            renderActions={!allSaved ? renderActions : undefined}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      ) : (
        /* History Table */
        <div className="px-3 py-4 sm:px-4 md:px-6">
          <GenericTable
            data={getFilteredHistory()}
            columns={historyColumns}
            emptyMessage={
              fromDate.length > 0 && toDate.length > 0
                ? `No history records found for the selected date range (${new Date(fromDate[0]).toLocaleDateString()} to ${new Date(toDate[0]).toLocaleDateString()})`
                : "No history records found. Complete a joint process to see history."
            }
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
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                  <Save className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h3 className="text-center text-lg font-bold text-[#1a1c1b] dark:text-white mb-2">
                Confirm Save
              </h3>
              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this joint entry?
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
                  className="rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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

export default JointDept;