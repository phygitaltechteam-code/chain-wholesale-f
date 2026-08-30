import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save,
  Scissors,
  Hammer,
  History,
  ChevronRight,
  ChevronDown,
  Printer,
  Plus,
  X,
  Layers,
  Sparkles,
  Box,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {
  useGetSoldering,
  useGetSolderingHistory,
  useSubmitSoldering,
  useCreateSoldering,
} from '@/lib/api/soldering';
import { useGetItems, Item } from '@/lib/api/items';
import { useGetSizes, Size } from '@/lib/api/sizes';
import { useSubmitMoveCutting } from '@/lib/api/cutting';
import { useGetBox, useGetBoxweight } from '@/lib/api/box';
import { useGetStock } from '@/lib/api/stock';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import { useAddMelting } from '@/lib/api/tar';
import { useAddSolderingMelting } from '@/lib/api/processmelting';

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

  return { monday, sunday };
};

interface SolderingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: string;
  fine: number;
  chainWeight: number;
  chainReceived: number;
  powder: number;
  increase: number;
  scrap: number;
  isEditing?: boolean;
  isSaved?: boolean;
  chainReceivedRaw?: string;
  powderRaw?: string;
  scrapRaw?: string;
  purityRaw?: string;
  fineRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
  isDirty?: boolean;
}

interface SolderingCardForm {
  id: string;
  itemId?: string;
  sizeId: string;
  purity: string;
  chainWeight: string;
  fine?: string;
  isSaving?: boolean;
}

const createNewSolderingCard = (
  initial?: Partial<SolderingCardForm>,
): SolderingCardForm => ({
  id: `soldering-card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  itemId: initial?.itemId || '',
  sizeId: initial?.sizeId || '',
  purity: initial?.purity || '',
  chainWeight: initial?.chainWeight || '',
  fine: initial?.fine || '',
});

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
  const [meltingLoadingIds, setMeltingLoadingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hasEditedRow, setHasEditedRow] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'joint' | 'cutting' | null>(
    null,
  );
  const [showHistory, setShowHistory] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCards, setModalCards] = useState<SolderingCardForm[]>([
    createNewSolderingCard(),
  ]);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<
    'chainReceived' | 'scrap'
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

    return { monday, sunday };
  };
  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const { monday, sunday } = getDefaultWeekRange();
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

  const { data: items = [], isLoading: itemsLoading } = useGetItems();
  const itemsList: Item[] = Array.isArray((items as any)?.data)
    ? (items as any).data
    : Array.isArray(items)
      ? items
      : [];
  const { data: sizes = [], isLoading: sizesLoading } = useGetSizes();
  const { data: boxData = [] } = useGetBox();
  const { data: stockData = [] } = useGetStock();
  const { data: tarData = [], isLoading: tarLoading, refetch: tarRefetch } = useGetBoxweight();

  const submitSoldering = useSubmitSoldering();
  const createSoldering = useCreateSoldering();
  const submitCutting = useSubmitMoveCutting();

  const submitMelting = useAddSolderingMelting();
  const handleMelting = async (entry: SolderingEntry) => {
    // Add this entry ID to loading set
    setMeltingLoadingIds((prev) => new Set(prev).add(entry.id));

    try {
      await submitMelting.mutateAsync({
        id: entry.id,
        data: {
          purity: parseFloat(entry.purity) || 0,
          chainWeight: entry.chainWeight || 0,
          solderingId: entry.id,
        },
      });
      await refetch();
    } catch (error: any) {
      console.error('Error in melting:', error);
      const errorMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.data?.message ||
        error?.message ||
        'Failed to process melting';
      toast.error(errorMessage);
    } finally {
      // Remove this entry ID from loading set
      setMeltingLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
    }
  };
  // Weighing Scale modal focus hook
  const { getScaleProps: getModalScaleProps } = useTableScaleFocus<'chainWeight'>(
    (cardIndex, field, weight) => {
      handleCardChange(cardIndex, field, weight.toString());
    },
  );

  const boxStockList = Array.isArray(tarData?.data)
    ? tarData.data
    : Array.isArray(tarData)
      ? tarData
      : [];

  // Top Box Cards for Soldering Department (from /admin/box/stock)
  const boxCards = React.useMemo(() => {
    return boxStockList
      .map((item: any) => {
        const sizeLabel =
          item.size?.size ||
          (typeof item.size === 'string' ? item.size : '') ||
          'Box';
        const p = Number(item.purity || 0);
        const wt = Number(
          item.tarWeight || item.chainWeight || item.weight || 0,
        );
        return {
          id: item.id,
          sizeId: item.sizeId || item.size?.id,
          size: sizeLabel,
          purity: p,
          totalWeight: Math.round(wt * 1000) / 1000,
        };
      })
      .filter((c: any) => c.totalWeight > 0);
  }, [boxStockList]);

  // Unique available purities from Box Stock (or standard defaults)
  const availablePurities = React.useMemo(() => {
    const pSet = new Set<number>();
    boxCards.forEach((c) => {
      if (c.purity && c.purity > 0) pSet.add(c.purity);
    });
    if (pSet.size === 0) {
      return [92, 90, 84, 75];
    }
    return Array.from(pSet).sort((a, b) => b - a);
  }, [boxCards]);

  // Helper to get purities that actually have available stock for the selected size
  const getPuritiesForSize = (sizeId?: string): number[] => {
    if (!sizeId) {
      return availablePurities;
    }
    const pSet = new Set<number>();
    boxCards.forEach((c) => {
      if (
        String(c.sizeId) === String(sizeId) &&
        c.purity &&
        c.purity > 0 &&
        c.totalWeight > 0
      ) {
        pSet.add(c.purity);
      }
    });

    if (pSet.size === 0) {
      boxStockList.forEach((b: any) => {
        const bSizeId = b.sizeId || b.size?.id;
        const wt = Number(b.tarWeight || b.chainWeight || b.weight || 0);
        const p = Number(b.purity || 0);
        if (String(bSizeId) === String(sizeId) && wt > 0 && p > 0) {
          pSet.add(p);
        }
      });
    }

    return Array.from(pSet).sort((a, b) => b - a);
  };

  // Helper to get available box quantity for a size and purity
  const getAvailableBoxQty = (sizeId?: string, purity?: string): number => {
    if (!sizeId) {
      return 0;
    }

    if (boxStockList.length > 0) {
      let filtered = boxStockList.filter(
        (b: any) =>
          (String(b.sizeId) === String(sizeId) || String(b.size?.id) === String(sizeId)) &&
          Number(b.tarWeight || b.chainWeight || b.weight || 0) > 0,
      );
      if (purity && parseFloat(purity) > 0) {
        const pNum = parseFloat(purity);
        filtered = filtered.filter(
          (b: any) => parseFloat(b.purity) === pNum,
        );
      }
      const total = filtered.reduce((sum: number, b: any) => {
        const wt = Number(b.tarWeight || b.chainWeight || b.weight || 0);
        return sum + (isNaN(wt) ? 0 : wt);
      }, 0);
      return Math.round(total * 1000) / 1000;
    }

    if (Array.isArray(boxData) && boxData.length > 0) {
      let filtered = boxData.filter(
        (b: any) =>
          (String(b.sizeId) === String(sizeId) || String(b.size?.id) === String(sizeId)) &&
          Number(b.chainWeight || 0) > 0,
      );
      if (purity && parseFloat(purity) > 0) {
        const pNum = parseFloat(purity);
        filtered = filtered.filter(
          (b: any) => parseFloat(b.purity) === pNum,
        );
      }
      const total = filtered.reduce((sum: number, b: any) => {
        const wt = Number(b.chainWeight || 0);
        return sum + (isNaN(wt) ? 0 : wt);
      }, 0);
      return Math.round(total * 1000) / 1000;
    }

    if (Array.isArray(stockData) && stockData.length > 0) {
      let filtered = stockData.filter(
        (s: any) =>
          (String(s.sizeId) === String(sizeId) || String(s.size?.id) === String(sizeId)) &&
          Number(s.weight ?? s.stockQty ?? 0) > 0,
      );
      if (purity && parseFloat(purity) > 0) {
        const pNum = parseFloat(purity);
        filtered = filtered.filter(
          (s: any) => parseFloat(s.purity) === pNum,
        );
      }
      const total = filtered.reduce((sum: number, s: any) => {
        const wt = Number(s.weight ?? s.stockQty ?? 0);
        return sum + (isNaN(wt) ? 0 : wt);
      }, 0);
      return Math.round(total * 1000) / 1000;
    }

    return 0;
  };

  // When a size is selected in the modal, automatically prefill purity and chain weight from box stock
  const handleSizeSelect = (cardIndex: number, selectedSizeId: string) => {
    const sizePurities = getPuritiesForSize(selectedSizeId);
    const chosenPurity = sizePurities.length > 0 ? String(sizePurities[0]) : '';

    const stockMatch = boxStockList.find(
      (b: any) =>
        (String(b.sizeId) === String(selectedSizeId) || String(b.size?.id) === String(selectedSizeId)) &&
        (chosenPurity ? String(b.purity) === chosenPurity : true) &&
        Number(b.tarWeight || b.chainWeight || b.weight || 0) > 0,
    );

    setModalCards((prev) =>
      prev.map((c, idx) => {
        if (idx !== cardIndex) return c;
        return {
          ...c,
          sizeId: selectedSizeId,
          purity: chosenPurity,
          chainWeight: '',
        };
      }),
    );
  };

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

          const chainWeight = soldering.chainWeight || 0;
          const purity = soldering.purity;
          const fine =
            soldering.fine !== undefined && soldering.fine !== null
              ? soldering.fine
              : Math.round(
                ((chainWeight * (parseFloat(purity) || 0)) / 100) * 1000,
              ) / 1000;
          const chainReceived = soldering.chainReceived || 0;
          const powder =
            chainReceived > 0
              ? Math.max(
                0,
                Math.round((chainReceived - chainWeight) * 1000) / 1000,
              )
              : soldering.powder || 0;
          const increase =
            powder > 0 && chainReceived > 0
              ? Math.round(((powder / chainReceived) * 100) * 1000) / 1000
              : soldering.increase || 0;

          const isSaved =
            soldering.isCompleted === true &&
            soldering.chainReceived !== null &&
            soldering.chainReceived !== undefined;

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
            purity: soldering.purity || '',
            fine: fine,

            chainWeight: chainWeight,
            chainReceived: chainReceived,
            powder: powder,

            increase: increase,

            scrap: soldering.scrap || 0,

            isEditing: !isSaved,
            isSaved: isSaved,

            chainReceivedRaw: soldering.chainReceived
              ? soldering.chainReceived.toString()
              : '',

            powderRaw: soldering.powder ? soldering.powder.toString() : '',

            scrapRaw: soldering.scrap ? soldering.scrap.toString() : '',
            purityRaw:
              soldering.purity !== null && soldering.purity !== undefined
                ? soldering.purity.toString()
                : '',
            fineRaw: fine > 0 ? fine.toString() : '',

            itemId: soldering.itemId,
            sizeId: soldering.sizeId,
            isCompleted: soldering.isCompleted || false,
            isDirty: false,
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
  const formatNumberDisplay = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '0';
    const num = Number(value);
    if (!Number.isFinite(num)) return '0';
    const str = num.toFixed(3);
    return str.replace(/\.?0+$/, '');
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
        const { date, time } = formatDate(item?.createdAt);

        const { date: proceedDate, time: proceedTime } = formatDate(
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
                        ${item?.purity || '-'}%
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
                        ${formatNumberDisplay(item?.increase)}%
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
            ${fromDate && toDate
        ? `
            <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
              From: ${formatDate(fromDate.toISOString()).date} &nbsp; To: ${formatDate(toDate.toISOString()).date}
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
                  Purity %
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Chain Given
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Chain Rec
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Powder Given
                </th>

                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">
                  Increase %
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
        const { date, time } = formatDate(item.createdAt);

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {date}
            </span>

            <span className="text-sm text-[#1a1c1b] dark:text-white">
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
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.purity)}%
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Given (G)',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainWeight)} G
        </span>
      ),
    },

    {
      key: 'chainReceived',
      header: 'Chain Received (G)',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainReceived)} G
        </span>
      ),
    },

    {
      key: 'powder',
      header: 'Powder Given (G)',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.powder)} G
        </span>
      ),
    },

    {
      key: 'increase',
      header: 'Increase %',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.increase)} %
        </span>
      ),
    },

    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.scrap)} G
        </span>
      ),
    },
    {
      key: 'process',
      header: 'Status',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.process}
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
      field: 'chainReceived' | 'scrap' | 'purity',
      value: string,
    ) => {
      // Show Action column when user edits an input
      setHasEditedRow(true);

      setSolderingEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = { ...entry };

            if (field === 'purity') {
              updated.purityRaw = value;
              updated.purity = value;
            } else if (field === 'chainReceived') {
              updated.chainReceivedRaw = value;

              if (value === '' || value === '.' || value === '-') {
                updated.chainReceived = 0;
              } else {
                const numValue = parseFloat(value);

                updated.chainReceived = isNaN(numValue) ? 0 : numValue;
              }

              // Auto calculate: Powder Given = Chain Received - Chain Given
              const autoPowder =
                Math.max(
                  0,
                  Math.round((updated.chainReceived - entry.chainWeight) * 1000) /
                  1000,
                );
              updated.powder = autoPowder;
              updated.powderRaw =
                autoPowder > 0 ? autoPowder.toString() : '0';
            } else if (field === 'scrap') {
              updated.scrapRaw = value;

              if (value === '' || value === '.' || value === '-') {
                updated.scrap = 0;
              } else {
                const numValue = parseFloat(value);

                updated.scrap = isNaN(numValue) ? 0 : numValue;
              }
            }

            // Auto calculate: Increase % = (Powder Given / Chain Received) * 100
            if (updated.powder > 0 && updated.chainReceived > 0) {
              updated.increase =
                Math.round(
                  ((updated.powder / updated.chainReceived) * 100) * 1000,
                ) / 1000;
            } else {
              updated.increase = 0;
            }

            updated.isDirty = true;
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

      if (!entry.chainReceived || entry.chainReceived <= 0) {
        toast.error('Please enter a valid chain received weight');
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
          purity: entry.purity,
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
    } catch (error: any) {
      console.error('Error saving soldering:', error);
      const errorMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to save soldering entry';
      toast.error(errorMessage);

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
          purity: entry.purity,
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
          purity: entry.purity,
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
    } catch (error: any) {
      console.error('Error saving soldering:', error);
      const errorMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to save soldering entry';
      toast.error(errorMessage);

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

  const handleCardChange = (
    cardIndex: number,
    field: 'sizeId' | 'purity' | 'chainWeight' | 'itemId',
    value: string,
  ) => {
    setModalCards((prev) =>
      prev.map((card, idx) => {
        if (idx !== cardIndex) return card;
        const sanitized =
          field === 'sizeId' || field === 'itemId'
            ? value
            : value.replace(/[^0-9.]/g, '');
        return { ...card, [field]: sanitized };
      }),
    );
  };

  const handleAddCard = () => {
    setModalCards((prev) => [...prev, createNewSolderingCard()]);
  };

  const handleRemoveCard = (cardIndex: number) => {
    setModalCards((prev) => {
      const next = prev.filter((_, idx) => idx !== cardIndex);
      if (next.length === 0) {
        setIsModalOpen(false);
        return [createNewSolderingCard()];
      }
      return next;
    });
  };

  const handleOpenModal = () => {
    setModalCards([createNewSolderingCard()]);
    setIsModalOpen(true);
  };

  const handleSaveCard = async (cardIndex: number) => {
    const card = modalCards[cardIndex];
    if (!card) return;

    if (!card.itemId) {
      toast.error(`Please select an item`);
      return;
    }

    if (!card.sizeId) {
      toast.error(`Please select a size`);
      return;
    }

    const chainWeightVal = parseFloat(card.chainWeight) || 0;
    const purityVal = parseFloat(card.purity) || 0;
    const fineVal =
      Math.round(((chainWeightVal * purityVal) / 100) * 1000) / 1000;

    if (chainWeightVal <= 0) {
      toast.error(`Please enter a valid Chain Weight`);
      return;
    }

    setModalCards((prev) =>
      prev.map((c, idx) => (idx === cardIndex ? { ...c, isSaving: true } : c)),
    );

    try {
      const itemsList = Array.isArray(items?.data)
        ? items.data
        : Array.isArray(items)
          ? items
          : [];
      const selectedItem = itemsList.find(
        (i: any) => String(i.id || i._id) === String(card.itemId),
      );
      const selectedSize = sizes.find(
        (s: any) => String(s.id || s._id) === String(card.sizeId),
      );

      const payload = {
        itemId: card.itemId,
        item: selectedItem?.name || '',
        sizeId: card.sizeId,
        size: selectedSize?.size || '',
        purity: purityVal ? String(purityVal) : '',
        fine: fineVal,
        chainWeight: chainWeightVal,
      };
      console.log(payload, 'pay');
      await createSoldering.mutateAsync(payload);
      toast.success(`Soldering Item added successfully`);

      setModalCards((prev) => {
        const next = prev.filter((_, idx) => idx !== cardIndex);
        if (next.length === 0) {
          setIsModalOpen(false);
          return [createNewSolderingCard()];
        }
        return next;
      });

      await tarRefetch();
      await refetch();
    } catch (error: any) {
      console.error('Error saving soldering card:', error);
      const backendMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.data?.message ||
        error?.message ||
        'Failed to save soldering entry';
      toast.error(backendMessage);
      setModalCards((prev) =>
        prev.map((c, idx) =>
          idx === cardIndex ? { ...c, isSaving: false } : c,
        ),
      );
    }
  };

  // A row is edited only when the user has entered a value.
  const hasEditableValues = (entry: SolderingEntry): boolean => {
    return Boolean(entry.isDirty);
  };

  // The whole Action column is conditional.
  const showActionColumn = solderingEntries.some(
    (entry) => !entry.isSaved && Boolean(entry.isDirty),
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
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <div className="flex w-24 items-center justify-center gap-1 whitespace-nowrap  bg-gray-50/50 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800/50">
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity)}%
          </span>
        </div>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Given(G)',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainWeight)} G
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
      header: 'Powder Given(G)',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.powder)} G
        </span>
      ),
    },

    {
      key: 'increase',
      header: 'Increase %',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.increase)} %
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

    {
      key: 'actions',
      header: 'Action',
      render: (item: SolderingEntry, index: number) => {
        const isMeltingLoading = meltingLoadingIds.has(item.id);

        return (
          <div className="flex items-center justify-center gap-1.5">
            {/* Joint Button - Only show if entry is not saved and has editable values */}
            {!item.isSaved && hasEditableValues(item) && (
              <button
                type="button"
                onClick={() => handleSaveClick(index, 'joint')}
                disabled={isLoading || isSubmitting || isMeltingLoading}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#d97706] to-[#92400e] px-2.5 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                title="Go to Joint"
              >
                <Hammer className="h-3.5 w-3.5" />
                <span>Joint</span>
              </button>
            )}

            {/* Cutting Button - Only show if entry is not saved and has editable values */}
            {!item.isSaved && hasEditableValues(item) && (
              <button
                type="button"
                onClick={() => handleSaveClick(index, 'cutting')}
                disabled={isLoading || isSubmitting || isMeltingLoading}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-2.5 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                title="Go to Cutting"
              >
                <Scissors className="h-3.5 w-3.5" />
                <span>Cutting</span>
              </button>
            )}

            {/* Melting Button - Always visible for all entries */}
            <button
              type="button"
              onClick={() => handleMelting(item)}
              disabled={isLoading || isSubmitting || isMeltingLoading}
              className={`inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${isMeltingLoading
                  ? 'bg-gray-400 cursor-wait'
                  : 'bg-gradient-to-br from-[#785600] to-[#986d00]'
                }`}
              title="Send to Melting"
            >
              {isMeltingLoading ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Melting</span>
              )}
            </button>
          </div>
        );
      },
    } as Column<SolderingEntry>,
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
      const { monday, sunday } = getCurrentWeekRange();
      setFromDate(monday);
      setToDate(sunday);
      refetchHistory();
    }
  };



  return (
    <div className="flex flex-col gap-4">
      {/* Top Box Cards Bar with Smooth Scrollbar */}
      {boxCards.length > 0 && !showHistory && (
        <div className="w-full">
          <div className="mb-2 flex items-center gap-2 px-1">
            <Box className="h-4 w-4 text-[#785600] dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Available Box Stock
            </span>
          </div>

          {/* Scrollable Container */}
          <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-[#785600]/40 dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600">
            {boxCards.map((card, idx) => (
              <div
                key={card.id || idx}
                className="flex min-w-[90px] flex-col rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <span className="font-mono text-[11px] font-bold text-black dark:text-white">
                  {card.size} ({card.purity}%)
                </span>
                <span className="font-mono text-[11px] font-bold text-black dark:text-white">
                  {formatNumberDisplay(card.totalWeight)} G
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
            {showHistory ? 'Soldering History' : 'Soldering Department'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filters */}
          {showHistory && (
            <div className="flex flex-wrap items-center gap-2">
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
          )}

          {/* Print History Button */}
          {showHistory && (
            <GenericButton type="button" onClick={handlePrintHistory} variant="primary">
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </GenericButton>
          )}

          {!showHistory && (
            <GenericButton
              type="button"
              onClick={handleOpenModal}
              variant="primary"
            >
              <Plus className="h-4 w-4" />
              <span>Add Soldering</span>
            </GenericButton>
          )}

          {/* History Toggle Button */}
          <GenericButton
            type="button"
            onClick={toggleHistory}
            variant="primary"
          >
            {showHistory ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{showHistory ? 'Show Soldering' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {/* Table Section */}
      {!showHistory ? (
        <div>
          <GenericTable<SolderingEntry>
            data={solderingEntries}
            columns={columns}
            onSave={(item, index) => handleSaveClick(index, 'joint')}
            emptyMessage="No soldering entries found."
            isLoading={solderingLoading || isSubmitting}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      ) : (
        <div>
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
              <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Save
              </h3>

              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this soldering entry and go to the{' '}
                <strong className="text-[#785600] dark:text-amber-400">
                  {actionType === 'joint' ? 'Joint' : 'Cutting'}
                </strong>{' '}
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
      {/* Add Soldering Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
          <div
            className={`w-full ${modalCards.length > 1 ? 'max-w-4xl' : 'max-w-lg'
              } flex max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-[#d3c4af]/30 dark:border-slate-700`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                    Add Soldering Process
                  </h3>
                  <p className="text-xs text-[#4f4535] dark:text-slate-400">
                    {modalCards.length}{' '}
                    {modalCards.length === 1
                      ? 'soldering item'
                      : 'soldering items'}{' '}
                    to configure
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Cards Container */}
            <div className="flex-1 overflow-y-auto p-4">
              <div
                className={`grid gap-4 ${modalCards.length > 1
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1'
                  }`}
              >
                {modalCards.map((card, idx) => {
                  const isCardSaving = card.isSaving || false;
                  const availableQty = getAvailableBoxQty(card.sizeId, card.purity);

                  return (
                    <div
                      key={card.id || idx}
                      className="relative flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80"
                    >
                      {modalCards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCard(idx)}
                          disabled={isCardSaving}
                          className="absolute right-2 top-2 rounded-md p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                          title="Remove this card"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      {/* Card Inputs */}
                      <div className="space-y-3">
                        {/* Row 1: Size, Purity, Available Qty in one line */}
                        <div className="grid grid-cols-3 gap-2">
                          {/* Size */}
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Size <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={card.sizeId}
                              onChange={(e) =>
                                handleSizeSelect(idx, e.target.value)
                              }
                              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                              <option value="">Select</option>
                              {sizes.map((size) => {
                                const stock = boxCards.find((b: any) => b.sizeId === size.id);
                                return (
                                  <option key={size.id} value={size.id}>
                                    {size.size || JSON.stringify(size)}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Purity (%) Dropdown */}
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Purity (%) <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={card.purity}
                              onChange={(e) => {
                                const newPurity = e.target.value;
                                setModalCards((prev) =>
                                  prev.map((c, i) =>
                                    i === idx
                                      ? {
                                        ...c,
                                        purity: newPurity,
                                      }
                                      : c,
                                  ),
                                );
                              }}
                              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                              <option value="">Select</option>
                              {getPuritiesForSize(card.sizeId).map((p) => (
                                <option key={p} value={p}>
                                  {p}%
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Available Qty */}
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Available Qty (G)
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                readOnly
                                value={formatNumberDisplay(availableQty)}
                                className="font-mono w-full rounded-lg border border-[#d3c4af]/20 bg-amber-50/50 px-2 py-1.5 pr-6 text-sm font-bold text-black outline-none cursor-not-allowed dark:bg-amber-950/20 dark:text-amber-400"
                              />
                              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-[10px] dark:text-slate-500">
                                G
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Item and Chain Weight */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Item */}
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Item <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={card.itemId}
                              onChange={(e) =>
                                handleCardChange(idx, 'itemId', e.target.value)
                              }
                              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                              <option value="">Select Item</option>
                              {itemsList
                                .filter(
                                  (item) =>
                                    item?.name?.trim().toLowerCase() !== 'gold',
                                )
                                .map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name || JSON.stringify(item)}
                                  </option>
                                ))}
                            </select>
                          </div>

                          {/* Chain Weight */}
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Chain Weight (G) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={card.chainWeight}
                                {...getModalScaleProps(idx, 'chainWeight')}
                                onChange={(e) =>
                                  handleCardChange(
                                    idx,
                                    'chainWeight',
                                    e.target.value,
                                  )
                                }
                                placeholder="0.000"
                                className="font-mono w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 pr-6 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              />
                              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-[10px] dark:text-slate-500">
                                G
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Button */}
                      <div className="mt-4 border-t border-[#d3c4af]/20 pt-3 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleSaveCard(idx)}
                          disabled={isCardSaving}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] py-2 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.01] hover:shadow active:scale-[0.99] disabled:opacity-50"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>
                            {isCardSaving ? 'Saving...' : 'Save'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolderingDept;

