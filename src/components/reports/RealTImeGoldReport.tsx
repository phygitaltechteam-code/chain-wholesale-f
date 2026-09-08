import React, {useState, useEffect, useMemo} from 'react';
import {
  Search,
  Printer,
  Loader2,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {useGetHeader} from '@/lib/api/headerapi';
import {useGetRealTimeGold} from '@/lib/api/realtimegold';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';

// ======================================================
// INTERFACES
// ======================================================
export interface GoldItem {
  id?: string | number;
  name: string;
  grossweight?: number;
  grossWeight: number;
  purity: number | null;
  fineweight?: number;
  fineWeight: number;
  category?: string;
  type?: 'stock' | 'process';
}

export interface CategoryGroup {
  id: string;
  name: string;
  type: 'Stock' | 'Process';
  items: GoldItem[];
  totalGrossWeight: number;
  totalFineWeight: number;
  count: number;
}

export interface SummaryData {
  totalStockWeight: number;
  totalStockFineWeight: number;
  totalProcessWeight: number;
  totalProcessFineWeight: number;
  totalScrapWeight?: number;
  totalScrapFineWeight?: number;
  totalCuttingScrapWeight?: number;
  totalCuttingScrapFineWeight?: number;
  grandTotalWeight: number;
  grandTotalFineWeight: number;
  stockItemsCount: number;
  processItemsCount: number;
  scrapItemsCount?: number;
  cuttingScrapItemsCount?: number;
  totalItemsCount: number;
  byProcess?: Record<
    string,
    {totalWeight: number; totalFineWeight: number; count: number}
  >;
}

interface ApiStockData {
  stock?: GoldItem[];
  tarStock?: GoldItem[];
  boxStock?: GoldItem[];
  scrap?: GoldItem[];
  cuttingScrap?: GoldItem[];
}

interface ApiProcessData {
  tar?: GoldItem[];
  box?: GoldItem[];
  soldering?: GoldItem[];
  joint?: GoldItem[];
  cutting?: GoldItem[];
  kunda?: GoldItem[];
  melting?: GoldItem[];
  all?: GoldItem[];
}

interface ApiResponse {
  statusCode?: number;
  status?: boolean;
  message?: string;
  data?: {
    summary?: SummaryData;
    stock?: GoldItem[];
    stocks?: ApiStockData;
    process?: ApiProcessData | GoldItem[];
    processes?: ApiProcessData;
    all?: GoldItem[];
  };
  summary?: SummaryData;
  stock?: GoldItem[];
  stocks?: ApiStockData;
  process?: ApiProcessData | GoldItem[];
  processes?: ApiProcessData;
  all?: GoldItem[];
  errors?: null;
}

// ======================================================
// HELPER FUNCTIONS
// ======================================================
const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatNumberDisplay = (value: unknown, minDecimals = 3): string => {
  if (value === null || value === undefined || value === '') return '0.000';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000';

  const roundedClean = Number(Math.round(Number(num + 'e+6')) + 'e-6');
  const strVal = String(roundedClean);
  const decimalPart = strVal.includes('.') ? strVal.split('.')[1] : '';
  const actualDecimals = decimalPart.length;

  const decimals = Math.max(minDecimals, Math.min(actualDecimals, 4));
  return num.toFixed(decimals);
};

const calculateAvgPurity = (gross: number, fine: number): string => {
  if (!gross || gross <= 0 || !fine || fine <= 0) return '0.00';
  const purity = (fine / gross) * 100;
  return purity.toFixed(2);
};

const getDefaultWeekRange = () => {
  const {fromDate, toDate} = getCurrentAppWeekRange();
  return {monday: fromDate, sunday: toDate};
};

const formatDateForDisplay = (date: Date | null) => {
  if (!date) return '';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateForApi = (date: Date | null): string | null => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Map items into structured categories
const buildCategoryGroups = (data: any | undefined): CategoryGroup[] => {
  if (!data) return [];

  const groups: CategoryGroup[] = [];

  const normalizeItem = (
    item: any,
    type: 'stock' | 'process',
    categoryName: string,
  ): GoldItem => {
    const gw = toNumber(item.grossWeight ?? item.grossweight ?? item.due ?? 0);
    const fw = toNumber(item.fineWeight ?? item.fineweight ?? item.due ?? 0);
    const itemName = item.clientName || item.name || 'Unnamed Item';
    return {
      id: item.id || `${categoryName}-${itemName}-${gw}-${fw}`,
      name: itemName,
      grossWeight: gw,
      grossweight: gw,
      fineWeight: fw,
      fineweight: fw,
      purity:
        item.purity !== undefined && item.purity !== null
          ? toNumber(item.purity)
          : null,
      category: categoryName,
      type,
    };
  };

  const addGroup = (
    id: string,
    name: string,
    type: 'Stock' | 'Process',
    rawItems: any[] | undefined,
  ) => {
    if (!rawItems || rawItems.length === 0) return;
    const items = rawItems.map((i) =>
      normalizeItem(i, type === 'Stock' ? 'stock' : 'process', name),
    );
    const totalGrossWeight = items.reduce((sum, i) => sum + i.grossWeight, 0);
    const totalFineWeight = items.reduce((sum, i) => sum + i.fineWeight, 0);

    groups.push({
      id,
      name,
      type,
      items,
      totalGrossWeight,
      totalFineWeight,
      count: items.length,
    });
  };

  // 1. Stock Data Categories
  if (data.stocks) {
    addGroup(
      'stock-gold',
      'Gold Stock',
      'Stock',
      data.stocks.gold || data.gold,
    );
    addGroup('stock-ready', 'Stock (Ready)', 'Stock', data.stocks.stock);
    addGroup('stock-scrap', 'Scrap', 'Stock', data.stocks.scrap);
    addGroup(
      'stock-cutting-scrap',
      'Cutting Scrap',
      'Stock',
      data.stocks.cuttingScrap,
    );
    addGroup('stock-tar', 'Tar Stock', 'Stock', data.stocks.tarStock);
    addGroup('stock-box', 'Box Stock', 'Stock', data.stocks.boxStock);
  } else {
    if (data.gold) {
      addGroup('stock-gold', 'Gold Stock', 'Stock', data.gold);
    }
    if (Array.isArray(data.stock)) {
      // Fallback grouping by name keywords for stock items
      const scrapItems: GoldItem[] = [];
      const cuttingScrapItems: GoldItem[] = [];
      const tarStockItems: GoldItem[] = [];
      const boxStockItems: GoldItem[] = [];
      const generalStockItems: GoldItem[] = [];

      data.stock.forEach((item: any) => {
        const upper = (item.name || '').toUpperCase();
        if (upper.includes('CUTTING SCRAP')) {
          cuttingScrapItems.push(item);
        } else if (upper.includes('SCRAP')) {
          scrapItems.push(item);
        } else if (upper.includes('TAR STOCK')) {
          tarStockItems.push(item);
        } else if (upper.includes('BOX STOCK')) {
          boxStockItems.push(item);
        } else {
          generalStockItems.push(item);
        }
      });

      addGroup('stock-ready', 'Stock (Ready)', 'Stock', generalStockItems);
      addGroup('stock-scrap', 'Scrap', 'Stock', scrapItems);
      addGroup(
        'stock-cutting-scrap',
        'Cutting Scrap',
        'Stock',
        cuttingScrapItems,
      );
      addGroup('stock-tar', 'Tar Stock', 'Stock', tarStockItems);
      addGroup('stock-box', 'Box Stock', 'Stock', boxStockItems);
    }
  }

  // 2. Process Data Categories
  const processDataObj =
    data.processes ||
    (typeof data.process === 'object' && !Array.isArray(data.process)
      ? data.process
      : null);

  if (processDataObj) {
    addGroup(
      'process-melting',
      'Melting Process',
      'Process',
      processDataObj.melting,
    );
    addGroup('process-tar', 'Tar Process', 'Process', processDataObj.tar);
    addGroup('process-box', 'Box Process', 'Process', processDataObj.box);
    addGroup('process-kunda', 'Kunda Process', 'Process', processDataObj.kunda);
    addGroup(
      'process-soldering',
      'Soldering Process',
      'Process',
      processDataObj.soldering,
    );
    addGroup('process-joint', 'Joint Process', 'Process', processDataObj.joint);
    addGroup(
      'process-cutting',
      'Cutting Process',
      'Process',
      processDataObj.cutting,
    );
  } else if (Array.isArray(data.process)) {
    // Fallback grouping by name keywords for process items
    const meltingItems: GoldItem[] = [];
    const tarItems: GoldItem[] = [];
    const boxItems: GoldItem[] = [];
    const kundaItems: GoldItem[] = [];
    const solderingItems: GoldItem[] = [];
    const jointItems: GoldItem[] = [];
    const cuttingItems: GoldItem[] = [];
    const otherProcessItems: GoldItem[] = [];

    data.process.forEach((item: any) => {
      const upper = (item.name || '').toUpperCase();
      if (upper.includes('MELTING')) meltingItems.push(item);
      else if (upper.includes('TAR')) tarItems.push(item);
      else if (upper.includes('BOX')) boxItems.push(item);
      else if (upper.includes('KUNDA')) kundaItems.push(item);
      else if (upper.includes('SOLDER')) solderingItems.push(item);
      else if (upper.includes('JOINT')) jointItems.push(item);
      else if (upper.includes('CUTTING')) cuttingItems.push(item);
      else otherProcessItems.push(item);
    });

    addGroup('process-melting', 'Melting Process', 'Process', meltingItems);
    addGroup('process-tar', 'Tar Process', 'Process', tarItems);
    addGroup('process-box', 'Box Process', 'Process', boxItems);
    addGroup('process-kunda', 'Kunda Process', 'Process', kundaItems);
    addGroup(
      'process-soldering',
      'Soldering Process',
      'Process',
      solderingItems,
    );
    addGroup('process-joint', 'Joint Process', 'Process', jointItems);
    addGroup('process-cutting', 'Cutting Process', 'Process', cuttingItems);
    addGroup('process-other', 'Other Process', 'Process', otherProcessItems);
  }

  // 3. Client Due Data Categories
  const clientDueItems =
    data.clientDues ||
    data.clientDue ||
    data.client_due ||
    data.stocks?.clientDues ||
    data.stocks?.clientDue;
  if (clientDueItems && Array.isArray(clientDueItems)) {
    const activeDueItems = clientDueItems
      .filter((i: any) => {
        const dueVal = toNumber(
          i.due ??
            i.fineWeight ??
            i.fineweight ??
            i.grossWeight ??
            i.grossweight ??
            0,
        );
        return dueVal > 0;
      })
      .map((i: any) => {
        const dueVal = toNumber(
          i.due ??
            i.fineWeight ??
            i.fineweight ??
            i.grossWeight ??
            i.grossweight ??
            0,
        );
        const clientName = i.clientName || i.name || 'Unnamed Client';
        return {
          id: i.id || `client-due-${clientName}-${dueVal}`,
          name: clientName,
          grossWeight: 0,
          grossweight: 0,
          fineWeight: dueVal,
          fineweight: dueVal,
          purity: null,
          category: 'Client Due',
          type: 'Stock' as const,
        };
      });

    if (activeDueItems.length > 0) {
      const totalDue = activeDueItems.reduce((sum, i) => sum + i.fineWeight, 0);
      groups.push({
        id: 'client-due',
        name: 'Client Due',
        type: 'Stock',
        items: activeDueItems,
        totalGrossWeight: 0,
        totalFineWeight: totalDue,
        count: activeDueItems.length,
      });
    }
  }

  return groups;
};

// ======================================================
// MAIN COMPONENT
// ======================================================
const RealTimeGoldReport: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [fromDate, setFromDate] = useState<Date | null>(
    () => getDefaultWeekRange().monday,
  );
  const [toDate, setToDate] = useState<Date | null>(
    () => getDefaultWeekRange().sunday,
  );

  useEffect(() => {
    const handleWeekCycleUpdate = () => {
      const {monday, sunday} = getDefaultWeekRange();
      setFromDate(monday);
      setToDate(sunday);
    };
    window.addEventListener('app_week_cycle_changed', handleWeekCycleUpdate);
    return () => {
      window.removeEventListener(
        'app_week_cycle_changed',
        handleWeekCycleUpdate,
      );
    };
  }, []);

  const fromDateStr = useMemo(() => formatDateForApi(fromDate), [fromDate]);
  const toDateStr = useMemo(() => formatDateForApi(toDate), [toDate]);

  const {
    data: goldData,
    isLoading,
    isError,
    refetch,
  } = useGetRealTimeGold(fromDateStr, toDateStr);

  // Safely extract raw data regardless of Axios response or direct payload nesting
  const rawData = useMemo(() => {
    if (!goldData) return undefined;
    if ((goldData as any)?.data?.data) return (goldData as any).data.data;
    if ((goldData as any)?.data) return (goldData as any).data;
    return goldData;
  }, [goldData]);

  const summaryFromApi = rawData?.summary;

  // Build category groups
  const categoryGroups = useMemo(() => buildCategoryGroups(rawData), [rawData]);

  // Handle date changes
  const handleFromDateChange = (dates: Date[]) => {
    if (dates && dates.length > 0) {
      const from = new Date(dates[0]);
      from.setHours(0, 0, 0, 0);

      if (toDate && from > toDate) {
        const sunday = new Date(from);
        sunday.setDate(from.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        setFromDate(from);
        setToDate(sunday);
      } else {
        setFromDate(from);
      }
    } else {
      setFromDate(null);
    }
  };

  const handleToDateChange = (dates: Date[]) => {
    if (dates && dates.length > 0) {
      const to = new Date(dates[0]);
      to.setHours(23, 59, 59, 999);

      if (fromDate && to < fromDate) {
        const monday = new Date(to);
        monday.setDate(to.getDate() - 6);
        monday.setHours(0, 0, 0, 0);
        setFromDate(monday);
        setToDate(to);
      } else {
        setToDate(to);
      }
    } else {
      setToDate(null);
    }
  };

  // Toggle expansion of a category row
  const toggleRow = (groupId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Filter categories and inner items based on search term
  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return categoryGroups;

    return categoryGroups
      .map((group) => {
        const groupMatches = group.name.toLowerCase().includes(term);
        const matchingItems = group.items.filter(
          (item) =>
            item.name.toLowerCase().includes(term) ||
            item.grossWeight.toString().includes(term) ||
            item.fineWeight.toString().includes(term) ||
            (item.purity !== null && item.purity.toString().includes(term)),
        );

        if (groupMatches) {
          return group;
        }

        if (matchingItems.length > 0) {
          return {
            ...group,
            items: matchingItems,
            totalGrossWeight: matchingItems.reduce(
              (s, i) => s + i.grossWeight,
              0,
            ),
            totalFineWeight: matchingItems.reduce(
              (s, i) => s + i.fineWeight,
              0,
            ),
            count: matchingItems.length,
          };
        }

        return null;
      })
      .filter((g): g is CategoryGroup => g !== null);
  }, [categoryGroups, searchTerm]);

  // Auto expand matching rows on search
  useEffect(() => {
    if (searchTerm.trim()) {
      const matchIds = filteredGroups.map((g) => g.id);
      setExpandedRows(new Set(matchIds));
    }
  }, [searchTerm, filteredGroups]);

  // Segment into 3 columns
  const stockGroups = useMemo(() => {
    return filteredGroups.filter(
      (g) => g.type === 'Stock' && g.id !== 'client-due',
    );
  }, [filteredGroups]);

  const processGroups = useMemo(() => {
    return filteredGroups.filter((g) => g.type === 'Process');
  }, [filteredGroups]);

  const clientDueGroup = useMemo(() => {
    return filteredGroups.find((g) => g.id === 'client-due');
  }, [filteredGroups]);

  const stockTotals = useMemo(() => {
    const gross = stockGroups.reduce((s, g) => s + g.totalGrossWeight, 0);
    const fine = stockGroups.reduce((s, g) => s + g.totalFineWeight, 0);
    return {gross, fine, count: stockGroups.reduce((s, g) => s + g.count, 0)};
  }, [stockGroups]);

  const processTotals = useMemo(() => {
    const gross = processGroups.reduce((s, g) => s + g.totalGrossWeight, 0);
    const fine = processGroups.reduce((s, g) => s + g.totalFineWeight, 0);
    return {gross, fine, count: processGroups.reduce((s, g) => s + g.count, 0)};
  }, [processGroups]);

  const clientDueTotal = useMemo(() => {
    const fine = clientDueGroup ? clientDueGroup.totalFineWeight : 0;
    return {fine, count: clientDueGroup ? clientDueGroup.count : 0};
  }, [clientDueGroup]);

  const grandTotals = useMemo(() => {
    const totalGrossWeight = stockTotals.gross + processTotals.gross;
    const totalFineWeight =
      stockTotals.fine + processTotals.fine + clientDueTotal.fine;
    const totalItems =
      stockTotals.count + processTotals.count + clientDueTotal.count;

    // Get grand total from API summary if available
    const apiGrandGross = summaryFromApi?.grandTotalWeight || 0;
    const apiGrandFine = summaryFromApi?.grandTotalFineWeight || 0;

    const grandTotalWeight = apiGrandGross || totalGrossWeight;
    const grandTotalFineWeight = apiGrandFine || totalFineWeight;

    return {
      totalGrossWeight,
      totalFineWeight,
      totalItems,
      grandTotalWeight,
      grandTotalFineWeight,
      stockGrossWeight: stockTotals.gross,
      stockFineWeight: stockTotals.fine,
      stockAvgPurity: calculateAvgPurity(stockTotals.gross, stockTotals.fine),
      processGrossWeight: processTotals.gross,
      processFineWeight: processTotals.fine,
      processAvgPurity: calculateAvgPurity(
        processTotals.gross,
        processTotals.fine,
      ),
      avgPurity: calculateAvgPurity(grandTotalWeight, grandTotalFineWeight),
      clientDueFineWeight: clientDueTotal.fine,
    };
  }, [stockTotals, processTotals, clientDueTotal, summaryFromApi]);

  // Print Handler
  const handlePrint = () => {
    const headerInfo = getpdfheaderdata?.data?.data || {};
    const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
    const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
    const phoneNumbers =
      headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
    const leftInvocation = headerInfo.leftInvocation || '॥ श्री गणेश प्रसन्न ॥';
    const rightInvocation =
      headerInfo.rightInvocation || '॥ श्री साई प्रसन्न ॥';
    const description =
      headerInfo.description ||
      'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
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

    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';

    let stockGroupsHtml = '';
    let processGroupsHtml = '';
    let clientDueHtml = '';

    // Separate groups by type
    const stockGroups = filteredGroups.filter(
      (g) => g.type === 'Stock' && g.id !== 'client-due',
    );
    const processGroups = filteredGroups.filter((g) => g.type === 'Process');
    const clientDueGroup = filteredGroups.find((g) => g.id === 'client-due');

    // Build Stock Groups HTML
    stockGroups.forEach((group) => {
      const rowsHtml = group.items
        .map(
          (item, idx) => `
          <tr style="border-bottom:1px solid #785600;">
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${idx + 1}</td>
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">
              ${item.name}
              ${item.purity !== null && item.purity !== undefined ? `<span style="font-size:7px;color:#785600;font-weight:400;"> (${item.purity}%)</span>` : ''}
            </td>
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${formatNumberDisplay(item.grossWeight)}</td>
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${item.purity === null ? '-' : formatNumberDisplay(item.purity, 2) + '%'}</td>
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:bold;">${formatNumberDisplay(item.fineWeight)}</td>
          </tr>
        `,
        )
        .join('');

      const catPurity = calculateAvgPurity(
        group.totalGrossWeight,
        group.totalFineWeight,
      );

      stockGroupsHtml += `
      <div style="margin-bottom:8px;page-break-inside:avoid;">
        <div style="background:#fff8e6;padding:3px 6px;font-weight:bold;font-size:9.5px;border:1px solid #785600;border-bottom:none;color:#785600;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;">${group.name}</span>
          <span style="font-size:8.5px;color:#000;">Gross: <b>${formatNumberDisplay(group.totalGrossWeight)} G</b> | Avg Purity: <b>${catPurity}%</b> | Fine: <b>${formatNumberDisplay(group.totalFineWeight)} G</b> | Items: <b>${group.count}</b></span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:8.5px;margin:0;padding:0;">
          <thead>
            <tr style="background:#785600;color:white;font-weight:600;">
              <th style="border:1px solid #785600;padding:2px 3px;width:32px;text-align:center;font-size:8px;color:white;">Sr. No</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;color:white;">Item Name</th>
              <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Gross WT (G)</th>
              <th style="border:1px solid #785600;padding:2px 3px;width:65px;text-align:center;font-size:8px;color:white;">Purity</th>
              <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Fine WT (G)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
    });

    // Add Grand Total for Stock
    if (stockGroups.length > 0) {
      const totalStockGross = stockGroups.reduce(
        (sum, g) => sum + g.totalGrossWeight,
        0,
      );
      const totalStockFine = stockGroups.reduce(
        (sum, g) => sum + g.totalFineWeight,
        0,
      );

      stockGroupsHtml += `
      <div style="margin-top:-4px;margin-bottom:12px;page-break-inside:avoid;">
        <div style="background:#785600;padding:4px 8px;font-weight:bold;font-size:10px;border:1px solid #785600;color:white;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;">GRAND TOTAL (Stock)</span>
          <span style="font-size:9px;">Gross: <b>${formatNumberDisplay(grandTotals.grandTotalWeight)} G</b> | Fine: <b>${formatNumberDisplay(grandTotals.grandTotalFineWeight)} G</b></span>
        </div>
      </div>
    `;
    }

    // Build Process Groups HTML
    processGroups.forEach((group) => {
      const rowsHtml = group.items
        .map(
          (item, idx) => `
          <tr style="border-bottom:1px solid #785600;">
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${idx + 1}</td>
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">
              ${item.name}
              ${item.purity !== null && item.purity !== undefined ? `<span style="font-size:7px;color:#785600;font-weight:400;"> (${item.purity}%)</span>` : ''}
            </td>
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${formatNumberDisplay(item.grossWeight)}</td>
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${item.purity === null ? '-' : formatNumberDisplay(item.purity, 2) + '%'}</td>
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:bold;">${formatNumberDisplay(item.fineWeight)}</td>
          </tr>
        `,
        )
        .join('');

      const catPurity = calculateAvgPurity(
        group.totalGrossWeight,
        group.totalFineWeight,
      );

      processGroupsHtml += `
      <div style="margin-bottom:8px;page-break-inside:avoid;">
        <div style="background:#fff8e6;padding:3px 6px;font-weight:bold;font-size:9.5px;border:1px solid #785600;border-bottom:none;color:#785600;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;">${group.name}</span>
          <span style="font-size:8.5px;color:#000;">Gross: <b>${formatNumberDisplay(group.totalGrossWeight)} G</b> | Avg Purity: <b>${catPurity}%</b> | Fine: <b>${formatNumberDisplay(group.totalFineWeight)} G</b> | Items: <b>${group.count}</b></span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:8.5px;margin:0;padding:0;">
          <thead>
            <tr style="background:#785600;color:white;font-weight:600;">
              <th style="border:1px solid #785600;padding:2px 3px;width:32px;text-align:center;font-size:8px;color:white;">Sr. No</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;color:white;">Item Name</th>
              <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Gross WT (G)</th>
              <th style="border:1px solid #785600;padding:2px 3px;width:65px;text-align:center;font-size:8px;color:white;">Purity</th>
              <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Fine WT (G)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
    });

    // Build Client Due HTML
    if (clientDueGroup && clientDueGroup.items.length > 0) {
      const rowsHtml = clientDueGroup.items
        .map(
          (item, idx) => `
          <tr style="border-bottom:1px solid #785600;">
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${idx + 1}</td>
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${item.name}</td>
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">-</td>
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">-</td>
            <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:bold;">${formatNumberDisplay(item.fineWeight)}</td>
          </tr>
        `,
        )
        .join('');

      clientDueHtml = `
      <div style="margin-bottom:8px;page-break-inside:avoid;">
        <div style="background:#fff8e6;padding:3px 6px;font-weight:bold;font-size:9.5px;border:1px solid #785600;border-bottom:none;color:#785600;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;">${clientDueGroup.name}</span>
          <span style="font-size:8.5px;color:#000;">Due: <b>${formatNumberDisplay(clientDueGroup.totalFineWeight)} G</b> | Items: <b>${clientDueGroup.count}</b></span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:8.5px;margin:0;padding:0;">
          <thead>
            <tr style="background:#785600;color:white;font-weight:600;">
              <th style="border:1px solid #785600;padding:2px 3px;width:32px;text-align:center;font-size:8px;color:white;">Sr. No</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;color:white;">Client Name</th>
              <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Gross WT (G)</th>
              <th style="border:1px solid #785600;padding:2px 3px;width:65px;text-align:center;font-size:8px;color:white;">Purity</th>
              <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Due WT (G)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
    }

    const grandPurity = grandTotals.avgPurity;

    printContainer.innerHTML = `
    <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
      <div>
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

        <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
          <div style="flex:1;"></div>
          <h2 style="margin:0;font-size:14px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
            Real Time Gold Report
          </h2>
          ${
            fromDate || toDate
              ? `
              <div style="font-size:9px;color:#000;font-weight:bold;flex:1;text-align:right;">
                ${fromDate ? `From: ${formatDateForDisplay(fromDate)}` : ''} 
                ${fromDate && toDate ? '&nbsp;&nbsp;' : ''}
                ${toDate ? `To: ${formatDateForDisplay(toDate)}` : ''}
              </div>
            `
              : `
              <div style="font-size:9px;color:#000;font-weight:bold;flex:1;text-align:right;">
                Date: ${new Date().toLocaleDateString('en-IN')}
              </div>
            `
          }
        </div>

        <!-- Grand Summary Box -->
        <div style="display:flex;justify-content:space-around;background:#fff8e6;border:1px solid #785600;padding:5px;margin-bottom:8px;font-size:9.5px;font-weight:bold;color:#000;">
          <div>Grand Gross: <span style="color:#785600;">${formatNumberDisplay(grandTotals.grandTotalWeight)} G</span></div>
          <div>Avg Purity: <span style="color:#785600;">${grandPurity}%</span></div>
          <div>Grand Fine: <span style="color:#785600;">${formatNumberDisplay(grandTotals.grandTotalFineWeight)} G</span></div>
          <div>Total Items: <span style="color:#785600;">${grandTotals.totalItems}</span></div>
        </div>

        <!-- Stock Groups -->
        ${stockGroupsHtml}

        <!-- Process Groups -->
        ${processGroupsHtml}

        <!-- Client Due -->
        ${clientDueHtml}
      </div>

      <div style="width:100%;margin-top:auto;padding-top:4px;">
        <div style="border-top:1px solid #785600;padding-top:2px;text-align:center;">
          <p style="margin:0;font-size:7px;color:#000;">
            This is a computer generated report
          </p>
          <div style="margin-top:1px;font-size:6.5px;color:#000;display:flex;justify-content:center;gap:10px;">
            <span>Powered by Matoshree Gold</span>
            <span>|</span>
            <span>Generated: ${new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })} ${new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}</span>
          </div>
        </div>
      </div>
    </div>
  `;

    const style = document.createElement('style');
    style.textContent = `
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @media print {
      html, body {
        margin: 0;
        padding: 0;
        width: 210mm;
        height: 297mm;
      }
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
        width: 210mm !important;
        height: 297mm !important;
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
    document.body.appendChild(printContainer);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (document.body.contains(printContainer))
          document.body.removeChild(printContainer);
        if (document.head.contains(style)) document.head.removeChild(style);
      }, 1000);
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#785600]" />
          <p className="mt-4 text-[#785600] dark:text-amber-400">
            Loading Real Time Gold Report...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            Failed to load Real Time Gold Report.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-[#785600] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5d4200]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-12 dark:bg-slate-950">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 border-b border-[#d3c4af]/30 bg-white/95 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Title */}
          <div>
            <h1 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
              Real Time Gold Dashboard
            </h1>
            <p className="text-xs text-[#817563] dark:text-slate-400">
              Live breakdown of Stock, Manufacturing processes, and Client Dues
            </p>
          </div>

          {/* Right Controls: Search, Date Pickers, Print */}
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-44 md:w-52">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#5d4200]"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4 p-3 sm:p-4 md:p-6">
        {/* Simple Summary Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-slate-300">
                Total Gross WT
              </span>
              <span className="text-lg font-black text-black dark:text-white">
                {formatNumberDisplay(grandTotals.grandTotalWeight)} G
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-slate-300">
                Avg Purity
              </span>
              <span className="text-lg font-black text-black dark:text-white">
                {grandTotals.avgPurity}%
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-slate-300">
                Total Fine WT
              </span>
              <span className="text-lg font-black text-black dark:text-white">
                {formatNumberDisplay(grandTotals.grandTotalFineWeight)} G
              </span>
            </div>
          </div>
        </div>

        {/* 3 Horizontal Column Layout */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          {/* 1. GOLD & STOCK Panel */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
              <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white">
                GOLD & Chain STOCK
              </span>
            </div>
            <div className="flex flex-1 flex-col overflow-x-auto">
              <table className="w-full text-center text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-black dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                    <th className="w-8 px-2 py-2.5 text-center text-black dark:text-white"></th>
                    <th className="px-3 py-2.5 text-center text-black dark:text-white">
                      Category
                    </th>
                    <th className="px-3 py-2.5 text-center text-black dark:text-white">
                      Gross WT (G)
                    </th>
                    <th className="px-3 py-2.5 text-center text-black dark:text-white">
                      Fine WT (G)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                  {stockGroups.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-xs font-semibold text-black dark:text-slate-300"
                      >
                        No stock data found.
                      </td>
                    </tr>
                  ) : (
                    stockGroups.map((group) => {
                      const isExpanded = expandedRows.has(group.id);
                      return (
                        <React.Fragment key={group.id}>
                          <tr
                            onClick={() => toggleRow(group.id)}
                            className={`cursor-pointer transition-colors ${
                              isExpanded
                                ? 'bg-[#785600]/10 dark:bg-amber-900/20'
                                : 'hover:bg-[#785600]/5 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="px-2 py-2.5 text-center">
                              <div className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#785600]/10 text-black dark:bg-amber-400/20 dark:text-amber-400">
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-black dark:text-white">
                              {group.name}
                            </td>
                            <td className="font-mono px-3 py-2.5 text-center font-bold text-black dark:text-white">
                              {formatNumberDisplay(group.totalGrossWeight)}
                            </td>
                            <td className="font-mono px-3 py-2.5 text-center font-bold text-black dark:text-white">
                              {formatNumberDisplay(group.totalFineWeight)}
                            </td>
                          </tr>

                          {isExpanded &&
                            group.items.map((item, itemIdx) => (
                              <tr
                                key={item.id || `${group.id}-${itemIdx}`}
                                className="border-b border-[#d3c4af]/10 bg-[#fcfbf9]/60 text-xs hover:bg-[#f5f3ef] dark:bg-slate-900/40 dark:hover:bg-slate-800/40"
                              >
                                <td className="px-2 py-2 text-center font-semibold text-black dark:text-slate-300">
                                  {itemIdx + 1}
                                </td>
                                <td className="px-3 py-2 text-center font-semibold text-black dark:text-slate-200">
                                  {item.name}
                                  {item.purity !== null &&
                                    item.purity !== undefined && (
                                      <span className="ml-1 text-xs text-[#785600] dark:text-amber-400">
                                        ({item.purity}%)
                                      </span>
                                    )}
                                </td>
                                <td className="font-mono px-3 py-2 text-center font-semibold text-black dark:text-slate-200">
                                  {formatNumberDisplay(item.grossWeight)}
                                </td>
                                <td className="font-mono px-3 py-2 text-center font-bold text-black dark:text-slate-200">
                                  {formatNumberDisplay(item.fineWeight)}
                                </td>
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 font-bold dark:bg-slate-800/70">
                    <td
                      colSpan={2}
                      className="px-3 py-2.5 text-center font-black text-black dark:text-white"
                    >
                      Total Stock
                    </td>
                    <td className="font-mono px-3 py-2.5 text-center font-black text-black dark:text-white">
                      {formatNumberDisplay(stockTotals.gross)}
                    </td>
                    <td className="font-mono px-3 py-2.5 text-center font-black text-black dark:text-white">
                      {formatNumberDisplay(stockTotals.fine)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 2. MANUFACTURING Panel */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
              <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white">
                MANUFACTURING Stock
              </span>
            </div>
            <div className="flex flex-1 flex-col overflow-x-auto">
              <table className="w-full text-center text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-black dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                    <th className="w-8 px-2 py-2.5 text-center text-black dark:text-white"></th>
                    <th className="px-3 py-2.5 text-center text-black dark:text-white">
                      Process
                    </th>
                    <th className="px-3 py-2.5 text-center text-black dark:text-white">
                      Gross WT (G)
                    </th>
                    <th className="px-3 py-2.5 text-center text-black dark:text-white">
                      Fine WT (G)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                  {processGroups.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-xs font-semibold text-black dark:text-slate-300"
                      >
                        No manufacturing data found.
                      </td>
                    </tr>
                  ) : (
                    processGroups.map((group) => {
                      const isExpanded = expandedRows.has(group.id);
                      return (
                        <React.Fragment key={group.id}>
                          <tr
                            onClick={() => toggleRow(group.id)}
                            className={`cursor-pointer transition-colors ${
                              isExpanded
                                ? 'bg-[#785600]/10 dark:bg-amber-900/20'
                                : 'hover:bg-[#785600]/5 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="px-2 py-2.5 text-center">
                              <div className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#785600]/10 text-black dark:bg-amber-400/20 dark:text-amber-400">
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-black dark:text-white">
                              {group.name}
                            </td>
                            <td className="font-mono px-3 py-2.5 text-center font-bold text-black dark:text-white">
                              {formatNumberDisplay(group.totalGrossWeight)}
                            </td>
                            <td className="font-mono px-3 py-2.5 text-center font-bold text-black dark:text-white">
                              {formatNumberDisplay(group.totalFineWeight)}
                            </td>
                          </tr>

                          {isExpanded &&
                            group.items.map((item, itemIdx) => (
                              <tr
                                key={item.id || `${group.id}-${itemIdx}`}
                                className="border-b border-[#d3c4af]/10 bg-[#fcfbf9]/60 text-xs hover:bg-[#f5f3ef] dark:bg-slate-900/40 dark:hover:bg-slate-800/40"
                              >
                                <td className="px-2 py-2 text-center font-semibold text-black dark:text-slate-300">
                                  {itemIdx + 1}
                                </td>
                                <td className="px-3 py-2 text-center font-semibold text-black dark:text-slate-200">
                                  {item.name}
                                </td>
                                <td className="font-mono px-3 py-2 text-center font-semibold text-black dark:text-slate-200">
                                  {formatNumberDisplay(item.grossWeight)}
                                </td>
                                <td className="font-mono px-3 py-2 text-center font-bold text-black dark:text-slate-200">
                                  {formatNumberDisplay(item.fineWeight)}
                                </td>
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 font-bold dark:bg-slate-800/70">
                    <td
                      colSpan={2}
                      className="px-3 py-2.5 text-center font-black text-black dark:text-white"
                    >
                      Total Process
                    </td>
                    <td className="font-mono px-3 py-2.5 text-center font-black text-black dark:text-white">
                      {formatNumberDisplay(processTotals.gross)}
                    </td>
                    <td className="font-mono px-3 py-2.5 text-center font-black text-black dark:text-white">
                      {formatNumberDisplay(processTotals.fine)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 3. CLIENT DUE Panel */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
              <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white">
                Customer DUE
              </span>
            </div>
            <div className="flex flex-1 flex-col overflow-x-auto">
              <table className="w-full text-center text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-black dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                    <th className="w-8 px-2 py-2.5 text-center text-black dark:text-white">
                      Sr.
                    </th>
                    <th className="px-3 py-2.5 text-center text-black dark:text-white">
                      Client Name
                    </th>
                    <th className="px-3 py-2.5 text-center text-black dark:text-white">
                      Due WT (G)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                  {clientDueGroup && clientDueGroup.items.length > 0 ? (
                    clientDueGroup.items.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-2 py-2.5 text-center text-xs font-semibold text-black dark:text-slate-300">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-black dark:text-white">
                          {item.name}
                        </td>
                        <td className="font-mono px-3 py-2.5 text-center font-bold text-black dark:text-white">
                          {formatNumberDisplay(item.fineWeight)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-6 text-center text-xs font-semibold text-black dark:text-slate-300"
                      >
                        No client due records found.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 font-bold dark:bg-slate-800/70">
                    <td
                      colSpan={2}
                      className="px-3 py-2.5 text-center font-black text-black dark:text-white"
                    >
                      Total Due
                    </td>
                    <td className="font-mono px-3 py-2.5 text-center font-black text-black dark:text-white">
                      {formatNumberDisplay(clientDueTotal.fine)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeGoldReport;
