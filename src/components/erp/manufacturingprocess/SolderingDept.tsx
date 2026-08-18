import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  Save,
  Scissors,
  Hammer,
  History,
  ChevronRight,
  ChevronDown,
  Printer,
} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {
  useGetSoldering,
  useGetSolderingHistory,
  useSubmitSoldering,
} from '@/lib/api/soldering';
import {useSubmitCutting, useSubmitMoveCutting} from '@/lib/api/cutting';
import GenericDatePicker from '@/components/Forms/DatePicker/GenericDatePicker';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {useGetHeader} from '@/lib/api/headerapi';
import {useTableScaleFocus} from '@/lib/hooks/useScaleFocus';

// ======================================================
// HELPER: Get Current Week Range
// ======================================================
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

  return {monday, sunday};
};

interface SolderingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: string;
  chainGiven: number;
  chainReceived: number;
  powder: number;
  increase: number;
  scrap: number;
  isEditing?: boolean;
  isSaved?: boolean;
  chainReceivedRaw?: string;
  powderRaw?: string;
  scrapRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
}

// Helper function to safely get item name
const getItemName = (item: any): string => {
  if (!item) return '-';
  if (typeof item === 'string') return item;
  if (item.name) return item.name;
  return '-';
};

// Helper function to safely get size name
const getSizeName = (size: any): string => {
  if (!size) return '-';
  if (typeof size === 'string') return size;
  if (size.size) return size.size;
  return '-';
};

const SolderingDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [solderingEntries, setSolderingEntries] = useState<SolderingEntry[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasEditedRow, setHasEditedRow] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'joint' | 'cutting' | null>(
    null,
  );
  const [showHistory, setShowHistory] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Weighing Scale table focus hook
  const {getScaleProps} = useTableScaleFocus<
    'chainReceived' | 'powder' | 'scrap'
  >((index, field, weight) => {
    handleInlineChange(index, field, weight.toString());
  });

  const isInitialMount = useRef(true);
  const getDefaultWeekRange = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 1 = Mon, ...
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {monday, sunday};
  };
  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const {monday, sunday} = getDefaultWeekRange();
    return [monday, sunday];
  });
  // Fetch data from API
  const {
    data: solderingData = [],
    isLoading: solderingLoading,
    refetch,
  } = useGetSoldering();

  const {
    data: solderingHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetSolderingHistory();

  const submitSoldering = useSubmitSoldering();
  const submitCutting = useSubmitMoveCutting();

  // Load data from API
  useEffect(() => {
    if (solderingLoading) {
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (solderingData.length > 0) {
      const entries: SolderingEntry[] = solderingData.map(
        (soldering: any, index: number) => {
          const itemName = soldering.item?.name || soldering.itemId || 'N/A';

          const sizeName = soldering.size?.size || soldering.sizeId || 'N/A';

          const chainGiven = soldering.chainWeight || 0;
          const powder = soldering.powder || 0;
          const increase = powder - chainGiven;

          const isSaved =
            soldering.isCompleted === true &&
            soldering.chainReceived !== null &&
            soldering.chainReceived !== undefined &&
            soldering.scrap !== null &&
            soldering.scrap !== undefined;

          return {
            id: soldering.id,
            srNo: index + 1,

            dateTime: new Date(soldering.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),

            item: itemName,
            size: sizeName,
            purity: soldering.purity || '22K',

            chainGiven: chainGiven,
            chainReceived: soldering.chainReceived || 0,
            powder: powder,

            increase: increase > 0 ? increase : 0,

            scrap: soldering.scrap || 0,

            isEditing: !isSaved,
            isSaved: isSaved,

            chainReceivedRaw: soldering.chainReceived
              ? soldering.chainReceived.toString()
              : '',

            powderRaw: soldering.powder ? soldering.powder.toString() : '',

            scrapRaw: soldering.scrap ? soldering.scrap.toString() : '',

            itemId: soldering.itemId,
            sizeId: soldering.sizeId,
            isCompleted: soldering.isCompleted || false,
          };
        },
      );

      setSolderingEntries(entries);
    } else {
      setSolderingEntries([]);
    }
  }, [solderingData, solderingLoading]);

  // Format date helper for history
  const formatDate = (dateString: string) => {
    if (!dateString) {
      return {
        date: '-',
        time: '-',
      };
    }

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
    if (value === null || value === undefined) {
      return '0';
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
      return '0';
    }

    return num.toFixed(0);
  };

  // Format number for display
  const formatNumberDisplay = (value: number) => {
    if (value === 0 || !value) {
      return '0';
    }

    const str = value.toString();

    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }

    return str;
  };

  // Filter history by date
  const getFilteredHistory = () => {
    let filtered = solderingHistory;

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter((item: any) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= from;
      });
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((item: any) => {
        const itemDate = new Date(item.createdAt);
        return itemDate <= to;
      });
    }

    return filtered;
  };

  // Print History Function
  const handlePrintHistory = () => {
    const filteredData = getFilteredHistory();

    if (!filteredData || filteredData.length === 0) {
      toast.error(
        'No history records available to print for the selected date range',
      );
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

    // Build the table rows
    const rows = filteredData
      .map((item: any, index: number) => {
        const {date, time} = formatDate(item?.createdAt);

        const {date: proceedDate, time: proceedTime} = formatDate(
          item?.updatedAt,
        );

        return `
                <tr>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">
                        ${index + 1}
                    </td>

                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
                        ${date} ${time}
                    </td>

                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">
                        ${getItemName(item?.item)}
                    </td>

                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">
                        ${getSizeName(item?.size)}
                    </td>

                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">
                        ${item?.purity || '-'}
                    </td>

                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">
                        ${formatNumber(item?.chainWeight)}
                    </td>

                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">
                        ${formatNumber(item?.chainReceived)}
                    </td>

                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">
                        ${formatNumber(item?.powder)}
                    </td>

                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">
                        ${formatNumber(item?.increase)}
                    </td>

                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">
                        ${formatNumber(item?.scrap)}
                    </td>

                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
                        ${proceedDate} ${proceedTime}
                    </td>
                </tr>
            `;
      })
      .join('');

    const headerInfo =
      getpdfheaderdata?.data?.data ||
      (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {});
    const leftInvocation =
      headerInfo.leftInvocation ||
      headerInfo.leftInovation ||
      '॥ श्री गणेश प्रसन्न ॥';
    const rightInvocation =
      headerInfo.rightInvocation ||
      headerInfo.rightInovation ||
      '॥ श्री साई प्रसन्न ॥';
    const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
    const description =
      headerInfo.description ||
      'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
    const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
    const phoneNumbers =
      headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
    const invocationColor = headerInfo.invocationColor || '#a84b20';
    const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
    const descriptionColor = headerInfo.descriptionColor || '#8b451f';
    const proprietorColor = headerInfo.proprietorColor || '#a84b20';
    const phoneColor = headerInfo.phoneColor || '#a84b20';
    const factoryFontSize = headerInfo.factoryFontSize
      ? `${headerInfo.factoryFontSize}px`
      : '20px';
    const descriptionFontSize = headerInfo.descriptionFontSize
      ? `${headerInfo.descriptionFontSize}px`
      : '9px';
    const proprietorFontSize = headerInfo.proprietorFontSize
      ? `${headerInfo.proprietorFontSize}px`
      : '9px';
    const phoneFontSize = headerInfo.phoneFontSize
      ? `${headerInfo.phoneFontSize}px`
      : '9px';

    // Set print content
    printContainer.innerHTML = `
     <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <!-- Header Section -->
          <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
              <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
              <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
              <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
            </div>
            <div style="margin:1px 0 0 0;padding:0;font-size:${descriptionFontSize};font-weight:bold;color:${descriptionColor};line-height:1.2;">
              ${description}
            </div>
            <div style="margin:1px 0 0 0;padding:0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;">
              ${proprietorName}&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
            </div>
            <div style="border-bottom:2px solid ${factoryNameColor};margin:2px 0 4px 0;"></div>
          </div>

          <!-- Title -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">

            <div style="flex:1;"></div>

            <h2 style="margin:0;font-size:16px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
              Soldering History Report
            </h2>

            ${
              fromDate && toDate
                ? `
                  <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
                    From: ${new Date(fromDate).toLocaleDateString('en-IN')}
                    &nbsp; To:
                    ${new Date(toDate).toLocaleDateString('en-IN')}
                  </div>
                `
                : `
                  <div style="flex:1;"></div>
                `
            }

          </div>

          <!-- Table -->
          <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">

            <thead>

              <tr style="background:#785600;color:white;font-weight:600;">

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Sr
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Date & Time
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Item
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Size
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Purity
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Chain Given
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Chain Rec
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Powder
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Increase
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Scrap
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Proceed
                </th>

              </tr>

            </thead>

            <tbody>
              ${rows}
            </tbody>

          </table>

        </div>

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

            #print-container,
            #print-container * {
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
        const {date, time} = formatDate(item.createdAt);

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
      key: 'itemName',
      header: 'Item',

      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item?.item?.name}
        </span>
      ),
    },

    {
      key: 'sizeName',
      header: 'Size',

      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item?.size?.size}
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Given (G)',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.chainWeight)} G
        </span>
      ),
    },

    {
      key: 'chainReceived',
      header: 'Chain Received (G)',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.chainReceived)} G
        </span>
      ),
    },

    {
      key: 'powder',
      header: 'Powder (G)',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.powder)} G
        </span>
      ),
    },

    {
      key: 'increase',
      header: 'Increase',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.increase)} G
        </span>
      ),
    },

    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.scrap)} G
        </span>
      ),
    },

    {
      key: 'updatedAt',
      header: 'Proceed Date & Time',

      render: (item) => {
        const {date, time} = formatDate(item.updatedAt);

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
    (
      index: number,
      field: 'chainReceived' | 'powder' | 'scrap',
      value: string,
    ) => {
      // Show Action column when user edits an input
      setHasEditedRow(true);

      setSolderingEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = {...entry};

            if (field === 'chainReceived') {
              updated.chainReceivedRaw = value;

              if (value === '' || value === '.' || value === '-') {
                updated.chainReceived = 0;
              } else {
                const numValue = parseFloat(value);

                updated.chainReceived = isNaN(numValue) ? 0 : numValue;
              }
            } else if (field === 'powder') {
              updated.powderRaw = value;

              if (value === '' || value === '.' || value === '-') {
                updated.powder = 0;
              } else {
                const numValue = parseFloat(value);

                updated.powder = isNaN(numValue) ? 0 : numValue;
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

            updated.increase = Math.max(0, updated.powder - entry.chainGiven);

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
    (index: number, action: 'joint' | 'cutting') => {
      const entry = solderingEntries[index];

      if (!entry.chainReceived || entry.chainReceived < 0) {
        toast.error('Please enter a valid chain received weight');
        return;
      }

      if (!entry.powder || entry.powder < 0) {
        toast.error('Please enter a valid powder weight');
        return;
      }

      if (!entry.scrap || entry.scrap < 0) {
        toast.error('Please enter a valid scrap weight');
        return;
      }

      setSaveIndex(index);
      setActionType(action);
      setShowConfirmModal(true);
    },
    [solderingEntries],
  );

  // Confirm and save - Joint
  const confirmSaveJoint = useCallback(async () => {
    if (saveIndex === null) {
      return;
    }

    const index = saveIndex;
    const entry = solderingEntries[index];

    setIsLoading(true);

    try {
      await submitSoldering.mutateAsync({
        id: entry.id,

        data: {
          chainReceived: entry.chainReceived,
          powder: entry.powder,
          increase: entry.increase,
          scrap: entry.scrap,
          isCompleted: true,
        },
      });

      setSolderingEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? {
                ...s,
                isEditing: false,
                isSaved: true,
                isCompleted: true,
              }
            : s,
        ),
      );

      setHasEditedRow(false);

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);

      await refetch();

      navigate({
        to: '/manufacturingprocess/process',
        state: {
          selectedTab: 'joint',
        },
      });
    } catch (error) {
      console.error('Error saving soldering:', error);

      toast.error('Failed to save soldering entry');

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [saveIndex, solderingEntries, submitSoldering, navigate, refetch]);

  // Confirm and save - Cutting
  const confirmSaveCutting = useCallback(async () => {
    if (saveIndex === null) {
      return;
    }

    const index = saveIndex;
    const entry = solderingEntries[index];

    setIsLoading(true);

    try {
      // First save the soldering entry
      await submitSoldering.mutateAsync({
        id: entry.id,

        data: {
          chainReceived: entry.chainReceived,
          powder: entry.powder,
          increase: entry.increase,
          scrap: entry.scrap,
          isCompleted: true,
        },
      });

      // Then submit to Cutting API
      await submitCutting.mutateAsync({
        id: entry.id,

        data: {
          chainReceived: entry.chainReceived,
          powder: entry.powder,
          increase: entry.increase,
          scrap: entry.scrap,
          isCompleted: true,
        },
      });

      setSolderingEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? {
                ...s,
                isEditing: false,
                isSaved: true,
                isCompleted: true,
              }
            : s,
        ),
      );

      setHasEditedRow(false);

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);

      await refetch();

      navigate({
        to: '/manufacturingprocess/process',
        state: {
          selectedTab: 'cutting',
        },
      });
    } catch (error) {
      console.error('Error saving soldering:', error);

      toast.error('Failed to save soldering entry');

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [
    saveIndex,
    solderingEntries,
    submitSoldering,
    submitCutting,
    navigate,
    refetch,
  ]);

  // Custom action renderer
  const renderActions = useCallback(
    (item: SolderingEntry, index: number) => {
      if (!item.isEditing) {
        return (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            ✓ Completed
          </span>
        );
      }

      return (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleSaveClick(index, 'joint')}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#d97706] to-[#92400e] px-3 py-1.5 text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            title="Go to Joint"
          >
            <Hammer className="h-4 w-4" />

            <span className="text-xs">Joint</span>
          </button>

          <button
            onClick={() => handleSaveClick(index, 'cutting')}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-3 py-1.5 text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            title="Go to Cutting"
          >
            <Scissors className="h-4 w-4" />

            <span className="text-xs">Cutting</span>
          </button>
        </div>
      );
    },
    [isLoading, handleSaveClick],
  );

  // Define columns for GenericTable
  const columns: Column<SolderingEntry>[] = [
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
      key: 'chainGiven',
      header: 'Chain Given(G)',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainGiven)} G
        </span>
      ),
    },

    {
      key: 'chainReceived',
      header: 'Chain Received(G)',

      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                value={
                  item.chainReceivedRaw !== undefined
                    ? item.chainReceivedRaw
                    : item.chainReceived === 0
                      ? ''
                      : item.chainReceived
                }
                {...getScaleProps(index, 'chainReceived')}
                onChange={(e) =>
                  handleInlineChange(index, 'chainReceived', e.target.value)
                }
                placeholder="0.000"
                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                G
              </span>
            </div>
          );
        }

        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.chainReceived)} G
          </span>
        );
      },
    },

    {
      key: 'powder',
      header: 'Powder(G)',

      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                value={
                  item.powderRaw !== undefined
                    ? item.powderRaw
                    : item.powder === 0
                      ? ''
                      : item.powder
                }
                {...getScaleProps(index, 'powder')}
                onChange={(e) =>
                  handleInlineChange(index, 'powder', e.target.value)
                }
                placeholder="0.000"
                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                G
              </span>
            </div>
          );
        }

        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.powder)} G
          </span>
        );
      },
    },

    {
      key: 'increase',
      header: 'Increase',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.increase)} G
        </span>
      ),
    },

    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',

      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                value={
                  item.scrapRaw !== undefined
                    ? item.scrapRaw
                    : item.scrap === 0
                      ? ''
                      : item.scrap
                }
                {...getScaleProps(index, 'scrap')}
                onChange={(e) =>
                  handleInlineChange(index, 'scrap', e.target.value)
                }
                placeholder="0.000"
                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                G
              </span>
            </div>
          );
        }

        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.scrap)} G
          </span>
        );
      },
    },
  ];

  const isSubmitting = submitSoldering.isPending || submitCutting.isPending;

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      setFromDate(null);
      setToDate(null);
      refetch();
    } else {
      setShowHistory(true);
      // Set default dates when showing history
      const {monday, sunday} = getCurrentWeekRange();
      setFromDate(monday);
      setToDate(sunday);
      refetchHistory();
    }
  };

  // Clear date filters
  const clearDateFilters = () => {
    setFromDate(null);
    setToDate(null);
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-bold text-[#1a1c1b] dark:text-white sm:text-base md:text-lg">
              {showHistory ? 'Soldering History' : 'Soldering Department'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Filters */}
            {showHistory && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <div>
                    <GenericWeeklyDatePicker
                      id="from-date-box"
                      placeholder="DD/MM/YYYY"
                      mode="from"
                      initialDates={fromDate ? [fromDate] : []}
                      onDateChange={(dates) => {
                        if (dates && dates.length > 0) {
                          const selected = new Date(dates[0]);
                          selected.setHours(0, 0, 0, 0);
                          setFromDate(selected);
                        } else {
                          setFromDate(null);
                        }
                      }}
                      className="w-32 sm:w-36 md:w-40"
                    />
                  </div>

                  <GenericWeeklyDatePicker
                    id="to-date-box"
                    placeholder="DD/MM/YYYY"
                    mode="to"
                    initialDates={toDate ? [toDate] : []}
                    onDateChange={(dates) => {
                      if (dates && dates.length > 0) {
                        const selected = new Date(dates[0]);
                        selected.setHours(23, 59, 59, 999);
                        setToDate(selected);
                      } else {
                        setToDate(null);
                      }
                    }}
                    className="w-32 sm:w-36 md:w-40"
                  />
                </div>
              </>
            )}

            {/* Print History Button */}
            {showHistory && (
              <GenericButton type="button" onClick={handlePrintHistory}>
                <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Print</span>
              </GenericButton>
            )}

            {/* History Toggle Button */}
            <GenericButton
              type="button"
              onClick={toggleHistory}
              variant="primary"
            >
              {showHistory ? (
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span>{showHistory ? 'Show Soldering' : 'History'}</span>
            </GenericButton>
          </div>
        </div>
      </div>

      {/* Conditional Rendering */}
      {!showHistory ? (
        /* Soldering Department Table */
        <div className="px-3 py-4 sm:px-4 md:px-6">
          <GenericTable<SolderingEntry>
            data={solderingEntries}
            columns={columns}
            onSave={(item, index) => handleSaveClick(index, 'joint')}
            emptyMessage="No soldering entries found."
            isLoading={solderingLoading || isSubmitting}
            renderActions={hasEditedRow ? renderActions : undefined}
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
              fromDate && toDate
                ? `No history records found for the selected date range (${new Date(
                    fromDate,
                  ).toLocaleDateString()} to ${new Date(
                    toDate,
                  ).toLocaleDateString()})`
                : 'No history records found. Complete a soldering process to see history.'
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
              <div className="mb-4 flex items-center justify-center">
                <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                  <Save className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>

              <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Save
              </h3>

              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this soldering entry and go to the{' '}
                <strong>{actionType === 'joint' ? 'Joint' : 'Cutting'}</strong>{' '}
                department?
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSaveIndex(null);
                    setActionType(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    actionType === 'joint'
                      ? confirmSaveJoint
                      : confirmSaveCutting
                  }
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

export default SolderingDept;
