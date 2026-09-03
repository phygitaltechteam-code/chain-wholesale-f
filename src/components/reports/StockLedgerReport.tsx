import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Search, Printer, Calendar, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { useGetStock } from '@/lib/api/stock';
import { useGetLossReport } from '@/lib/api/lossreport';
import { useGetStockLedgerReport, StockSummaryData, StockTableItem, StockMovementItem } from '@/lib/api/stockledger';

// Helper to get current month range (1st of month to end of month)
const getDefaultCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  firstDay.setHours(0, 0, 0, 0);

  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  lastDay.setHours(23, 59, 59, 999);

  return { from: firstDay, to: lastDay };
};

const formatNumberDisplay = (value: unknown, decimals = 2): string => {
  if (value === null || value === undefined || value === '') return '0.00';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatDateForDisplay = (date: Date | null): string => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateToISO = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function StockLedgerReport() {
  const navigate = useNavigate();
  const getpdfheaderdata = useGetHeader();

  // Date filters (Defaulted to current month)
  const initialMonthRange = useMemo(() => getDefaultCurrentMonthRange(), []);
  const [fromDate, setFromDate] = useState<Date | null>(initialMonthRange.from);
  const [toDate, setToDate] = useState<Date | null>(initialMonthRange.to);

  // Applied date filters (triggered on "View Report" button click)
  const [appliedFromDate, setAppliedFromDate] = useState<Date | null>(initialMonthRange.from);
  const [appliedToDate, setAppliedToDate] = useState<Date | null>(initialMonthRange.to);

  const [searchTerm, setSearchTerm] = useState('');

  // Fetch API data from POST /admin/stock/report with fromDate and toDate
  const fromDateStr = useMemo(() => formatDateToISO(appliedFromDate), [appliedFromDate]);
  const toDateStr = useMemo(() => formatDateToISO(appliedToDate), [appliedToDate]);

  const {
    data: apiLedgerData,
    isLoading: isLedgerLoading,
    isFetching: isLedgerFetching,
    refetch: refetchLedger,
  } = useGetStockLedgerReport(fromDateStr, toDateStr);

  // Summary State
  const [summaryData, setSummaryData] = useState<StockSummaryData>({
    opening: {
      gold: 0.0,
      raw: 0.0,
      openingChain: 0.0,
      srp: 0.0,
      openingClientDue: 0.0,
      inward: 0.0,
    },
    closing: {
      gold: 0.0,
      raw: 0.0,
      closingChain: 0.0,
      closingClientDue: 0.0,
      loss: 0.0,
      outward: 0.0,
      profitLoss: 0.0,
    },
  });

  // Manufacturing Stock Items
  const [rawStockList, setRawStockList] = useState<StockTableItem[]>([]);

  // Chain Stock Items
  const [chainStockList, setChainStockList] = useState<StockTableItem[]>([]);

  // Client Items
  const [clientList, setClientList] = useState<StockTableItem[]>([]);

  // Inward Outward History Items
  const [movementList, setMovementList] = useState<StockMovementItem[]>([]);

  // Integrate API response from POST /admin/stock/report
  useEffect(() => {
    if (apiLedgerData) {
      const data = apiLedgerData?.data || apiLedgerData;

      // 1. Summary / Opening / Closing mapping (handles section1/section2 and overview)
      const sec1 = data?.section1;
      const sec2 = data?.section2;
      const ovOpening = data?.overview?.opening;
      const ovClosing = data?.overview?.closing;
      const sumOpening = data?.summary?.opening;
      const sumClosing = data?.summary?.closing;

      if (sec1 || sec2 || ovOpening || ovClosing || sumOpening || sumClosing) {
        setSummaryData({
          opening: {
            gold: Number(sec1?.openingGold ?? ovOpening?.gold ?? sumOpening?.gold ?? 0),
            raw: Number(sec1?.openingRaw ?? ovOpening?.raw ?? sumOpening?.raw ?? 0),
            openingChain: Number(sec1?.openingChain ?? ovOpening?.chain ?? sumOpening?.openingChain ?? 0),
            srp: Number(sec1?.srp ?? ovOpening?.srp ?? sumOpening?.srp ?? 0),
            openingClientDue: Number(sec1?.openingClientDue ?? ovOpening?.clientDue ?? sumOpening?.openingClientDue ?? 0),
            inward: Number(sec1?.inward ?? ovOpening?.inward ?? sumOpening?.inward ?? 0),
          },
          closing: {
            gold: Number(sec2?.closingGold ?? ovClosing?.gold ?? sumClosing?.gold ?? 0),
            raw: Number(sec2?.closingRaw ?? ovClosing?.raw ?? sumClosing?.raw ?? 0),
            closingChain: Number(sec2?.closingChain ?? ovClosing?.chain ?? sumClosing?.closingChain ?? 0),
            closingClientDue: Number(sec2?.closingClientDue ?? ovClosing?.clientDue ?? sumClosing?.closingClientDue ?? 0),
            loss: Number(sec2?.loss ?? ovClosing?.loss ?? sumClosing?.loss ?? 0),
            outward: Number(sec2?.outward ?? ovClosing?.outward ?? sumClosing?.outward ?? 0),
            profitLoss: Number(sec2?.profitLoss ?? ovClosing?.profitLoss ?? data?.summary?.profitLoss ?? 0),
          },
        });
      }

      // 2. Chain Stock mapping (from section3.chainStock or chainStock)
      const chainStock = data?.section3?.chainStock || data?.chainStock;
      if (Array.isArray(chainStock) && chainStock.length > 0) {
        setChainStockList(
          chainStock.map((item: any, idx: number) => ({
            id: item.id || `chain-${idx}`,
            name: `${item.name || 'Chain'}${item.size ? ` (${item.size})` : ''}${item.purity ? ` ${item.purity}%` : ''}`,
            opening: Number(item.opening ?? item.openingFine ?? 0),
            closing: Number(item.closing ?? item.closingFine ?? 0),
            due: Number(item.difference ?? item.differenceFine ?? item.closing ?? 0),
          }))
        );
      }

      // 3. Raw Stock mapping (from section3.rawStock, rawStock, or items without size/Gold)
      const rawStock = data?.section3?.rawStock || data?.rawStock;
      const allItems = data?.section3?.items || data?.items;
      if (Array.isArray(rawStock) && rawStock.length > 0) {
        setRawStockList(
          rawStock.map((item: any, idx: number) => ({
            id: item.id || `raw-${idx}`,
            name: item.name || item.item || item.itemName || 'GOLD',
            opening: Number(item.opening ?? item.openingStock ?? 0),
            closing: Number(item.closing ?? item.closingStock ?? item.weight ?? 0),
            due: Number(item.due ?? item.difference ?? item.closing ?? 0),
          }))
        );
      } else if (Array.isArray(allItems) && allItems.length > 0) {
        const rawItems = allItems.filter((i: any) => !i.sizeName || i.itemName?.toUpperCase() === 'GOLD');
        if (rawItems.length > 0) {
          setRawStockList(
            rawItems.map((item: any, idx: number) => ({
              id: item.stockId || item.itemId || item.id || `raw-${idx}`,
              name: item.itemName || item.name || 'GOLD',
              opening: Number(item.openingStock ?? item.openingStockFine ?? item.opening ?? 0),
              closing: Number(item.closingStock ?? item.closingStockFine ?? item.closing ?? 0),
              due: Number(item.netChange ?? item.netChangeFine ?? item.closingStock ?? 0),
            }))
          );
        }
      }

      // 4. Client mapping (from section3.clients or clients)
      const clients = data?.section3?.clients || data?.clients || data?.client;
      if (Array.isArray(clients) && clients.length > 0) {
        setClientList(
          clients.map((item: any, idx: number) => ({
            id: item.id || `client-${idx}`,
            name: item.name || item.clientName || 'Client',
            opening: Number(item.opening ?? 0),
            closing: Number(item.closing ?? 0),
            difference: Number(item.difference ?? 0),
          }))
        );
      }

      // 5. Stock Movement mapping (paired from section3.stockMovement inwards and outwards)
      const stockMovement = data?.section3?.stockMovement || data?.stockMovement;
      if (stockMovement) {
        const inwards = Array.isArray(stockMovement.inwards) ? stockMovement.inwards : [];
        const outwards = Array.isArray(stockMovement.outwards) ? stockMovement.outwards : [];
        const maxLen = Math.max(inwards.length, outwards.length);

        if (maxLen > 0) {
          const movementRows: StockMovementItem[] = [];
          for (let i = 0; i < maxLen; i++) {
            const inItem = inwards[i];
            const outItem = outwards[i];
            const inVal = inItem && (inItem.fineWeight != null || inItem.weight != null) ? Number(inItem.fineWeight ?? inItem.weight ?? 0) : null;
            const outVal = outItem && (outItem.fineWeight != null || outItem.weight != null) ? Number(outItem.fineWeight ?? outItem.weight ?? 0) : null;
            movementRows.push({
              id: inItem?.id || outItem?.id || `mov-${i}`,
              inwardName: inItem ? `${inItem.name}${inItem.sizeName ? ` (${inItem.sizeName})` : ''}` : '',
              inwardSubtext: inItem?.remark || '',
              inward: inVal !== null && inVal > 0 ? inVal : null,
              outwardName: outItem ? `${outItem.name}${outItem.sizeName ? ` (${outItem.sizeName})` : ''}` : '',
              outwardSubtext: outItem?.remark || '',
              outward: outVal !== null && outVal > 0 ? outVal : null,
            });
          }
          setMovementList(movementRows);
        } else {
          setMovementList([]);
        }
      } else {
        setMovementList([]);
      }
    }
  }, [apiLedgerData]);

  // Handle View Report click
  const handleViewReport = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    refetchLedger();
    toast.success('Stock report updated for selected date range');
  };

  // Date change handlers
  const handleFromDateChange = (selectedDates: Date[]) => {
    if (selectedDates && selectedDates.length > 0) {
      const selected = new Date(selectedDates[0]);
      selected.setHours(0, 0, 0, 0);
      setFromDate(selected);
    } else {
      setFromDate(null);
    }
  };

  const handleToDateChange = (selectedDates: Date[]) => {
    if (selectedDates && selectedDates.length > 0) {
      const selected = new Date(selectedDates[0]);
      selected.setHours(23, 59, 59, 999);
      setToDate(selected);
    } else {
      setToDate(null);
    }
  };

  // Search filtering
  const query = searchTerm.toLowerCase().trim();

  const filteredRawStock = useMemo(() => {
    if (!query) return rawStockList;
    return rawStockList.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.opening.toString().includes(query) ||
        item.closing.toString().includes(query) ||
        (item.due !== undefined && item.due.toString().includes(query)),
    );
  }, [rawStockList, query]);

  const filteredChainStock = useMemo(() => {
    if (!query) return chainStockList;
    return chainStockList.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.opening.toString().includes(query) ||
        item.closing.toString().includes(query) ||
        (item.due !== undefined && item.due.toString().includes(query)),
    );
  }, [chainStockList, query]);

  const filteredClient = useMemo(() => {
    if (!query) return clientList;
    return clientList.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.opening.toString().includes(query) ||
        item.closing.toString().includes(query) ||
        (item.difference !== undefined && item.difference.toString().includes(query)),
    );
  }, [clientList, query]);

  const filteredMovement = useMemo(() => {
    if (!query) return movementList;
    return movementList.filter(
      (item) =>
        item.inwardName.toLowerCase().includes(query) ||
        (item.inwardSubtext && item.inwardSubtext.toLowerCase().includes(query)) ||
        item.inward.toString().includes(query) ||
        item.outwardName.toLowerCase().includes(query) ||
        (item.outwardSubtext && item.outwardSubtext.toLowerCase().includes(query)) ||
        item.outward.toString().includes(query),
    );
  }, [movementList, query]);

  // Date range formatted label for display
  const dateRangeLabel = useMemo(() => {
    if (appliedFromDate && appliedToDate) {
      return `${formatDateForDisplay(appliedFromDate)} to ${formatDateForDisplay(appliedToDate)}`;
    }
    if (appliedFromDate) {
      return `From: ${formatDateForDisplay(appliedFromDate)}`;
    }
    if (appliedToDate) {
      return `To: ${formatDateForDisplay(appliedToDate)}`;
    }
    return formatDateForDisplay(new Date());
  }, [appliedFromDate, appliedToDate]);

  // Print function matching the company's PDF Header format
  const handlePrint = () => {
    const printContainer = document.createElement('div');
    printContainer.id = 'stock-ledger-print-container';
    printContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 100%;
      background: white;
      padding: 6px;
      z-index: 9999;
    `;
    document.body.appendChild(printContainer);

    const headerInfo =
      getpdfheaderdata?.data?.data ||
      (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {});
    const leftInvocation = headerInfo.leftInvocation || '॥ श्री गणेश प्रसन्न ॥';
    const rightInvocation = headerInfo.rightInvocation || '॥ श्री साई प्रसन्न ॥';
    const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
    const description = headerInfo.description || 'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
    const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
    const phoneNumbers = headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
    const invocationColor = headerInfo.invocationColor || '#a84b20';
    const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
    const descriptionColor = headerInfo.descriptionColor || '#8b451f';
    const proprietorColor = headerInfo.proprietorColor || '#a84b20';
    const phoneColor = headerInfo.phoneColor || '#a84b20';

    printContainer.innerHTML = `
      <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 8mm;box-sizing:border-box;color:#000;">
        <!-- PDF Header -->
        <div style="width:100%;text-align:center;margin:0 0 8px 0;padding:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
            <span style="font-size:22px;font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
            <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
          </div>
          <div style="margin:2px 0 0 0;font-size:10px;font-weight:bold;color:${descriptionColor};">
            ${description}
          </div>
          <div style="margin:2px 0 0 0;font-size:10px;font-weight:bold;color:${proprietorColor};">
            ${proprietorName}&nbsp;&nbsp; <span style="color:${phoneColor};">${phoneNumbers}</span>
          </div>
          <div style="border-bottom:2px solid ${factoryNameColor};margin:4px 0 8px 0;"></div>
        </div>

        <!-- Banner Title -->
        <div style="text-align:center;margin-bottom:8px;">
          <div style="font-weight:bold;font-size:15px;letter-spacing:1px;color:#000;">
            BUSINESS 360 REPORT
          </div>
          <div style="margin-top:2px;">
            <span style="font-size:11px;font-weight:bold;color:#444;">
              Date: ${dateRangeLabel}
            </span>
          </div>
        </div>

        <!-- Opening / Closing Summary -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px;">
          <thead>
            <tr style="background:#785600;color:white;">
              <th style="width:50%;border:1px solid #785600;padding:4px 6px;text-align:left;font-weight:bold;">OPENING</th>
              <th style="width:50%;border:1px solid #785600;padding:4px 6px;text-align:left;font-weight:bold;">CLOSING</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #ccc;padding:4px;vertical-align:top;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:2px 4px;font-weight:500;color:#000;">Gold Stock</td><td style="padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(summaryData.opening.gold)}</td></tr>
                  <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:2px 4px;font-weight:500;color:#000;">Manufacturing</td><td style="padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(summaryData.opening.raw)}</td></tr>
                  <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:2px 4px;font-weight:500;color:#000;">Chain Stock</td><td style="padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(summaryData.opening.openingChain)}</td></tr>
                  <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:2px 4px;font-weight:500;color:#000;">Client Due</td><td style="padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(summaryData.opening.openingClientDue)}</td></tr>
                  <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:2px 4px;font-weight:500;color:#000;">SRP</td><td style="padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(summaryData.opening.srp)}</td></tr>
                  <tr style="border-top:1.5px solid #000;background:#fef3c7;"><td style="padding:3px 4px;font-weight:bold;color:#000;">Inward</td><td style="padding:3px 4px;text-align:right;font-weight:bold;font-family:monospace;color:#16a34a;">${formatNumberDisplay(summaryData.opening.inward)}</td></tr>
                </table>
              </td>
              <td style="border:1px solid #ccc;padding:4px;vertical-align:top;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:2px 4px;font-weight:500;color:#000;">Gold Stock</td><td style="padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(summaryData.closing.gold)}</td></tr>
                  <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:2px 4px;font-weight:500;color:#000;">Manufacturing</td><td style="padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(summaryData.closing.raw)}</td></tr>
                  <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:2px 4px;font-weight:500;color:#000;">Chain Stock</td><td style="padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(summaryData.closing.closingChain)}</td></tr>
                  <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:2px 4px;font-weight:500;color:#000;">Client Due</td><td style="padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(summaryData.closing.closingClientDue)}</td></tr>
                  <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:2px 4px;font-weight:500;color:#000;">Loss</td><td style="padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(summaryData.closing.loss)}</td></tr>
                  <tr style="border-top:1.5px solid #000;background:#fef3c7;"><td style="padding:3px 4px;font-weight:bold;color:#000;">Outward</td><td style="padding:3px 4px;text-align:right;font-weight:bold;font-family:monospace;color:#b45309;">${formatNumberDisplay(summaryData.closing.outward)}</td></tr>
                  <tr style="border-top:1px solid #000;background:#ecfdf5;"><td style="padding:3px 4px;font-weight:bold;color:#065f46;">Profit / Loss</td><td style="padding:3px 4px;text-align:right;font-weight:bold;font-family:monospace;color:#047857;">${formatNumberDisplay(summaryData.closing.profitLoss ?? 0)}</td></tr>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- RAW STOCK, CHAIN STOCK & CLIENT in ONE ROW -->
        <div style="display:flex;gap:6px;margin-bottom:12px;align-items:flex-start;">
          <!-- MANUFACTURING STOCK -->
          <div style="flex:1;">
            <div style="text-align:center;margin:4px 0 2px 0;">
              <span style="font-weight:bold;font-size:11px;letter-spacing:0.5px;color:#000;">MANUFACTURING STOCK</span>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:10px;">
              <thead>
                <tr style="border-bottom:1.5px solid #000;background:#f9f9f7;">
                  <th style="padding:3px 2px;text-align:left;font-weight:bold;color:#000;">Name</th>
                  <th style="padding:3px 2px;text-align:right;font-weight:bold;color:#000;">Opening</th>
                  <th style="padding:3px 2px;text-align:right;font-weight:bold;color:#000;">Closing</th>
                  <th style="padding:3px 2px;text-align:right;font-weight:bold;color:#000;">Difference</th>
                </tr>
              </thead>
              <tbody>
                ${filteredRawStock.length > 0 ? filteredRawStock
        .map(
          (item) => `
                  <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:3px 2px;font-weight:500;color:#000;">${item.name}</td>
                    <td style="padding:3px 2px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(item.opening)}</td>
                    <td style="padding:3px 2px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(item.closing)}</td>
                    <td style="padding:3px 2px;text-align:right;font-family:monospace;font-weight:bold;color:#000;">${formatNumberDisplay(item.due)}</td>
                  </tr>
                `,
        )
        .join('') : `<tr><td colspan="4" style="padding:4px;text-align:center;color:#666;">No data</td></tr>`}
              </tbody>
            </table>
          </div>

          <!-- CHAIN STOCK -->
          <div style="flex:1;">
            <div style="text-align:center;margin:4px 0 2px 0;">
              <span style="font-weight:bold;font-size:11px;letter-spacing:0.5px;color:#000;">CHAIN STOCK</span>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:10px;">
              <thead>
                <tr style="border-bottom:1.5px solid #000;background:#f9f9f7;">
                  <th style="padding:3px 2px;text-align:left;font-weight:bold;color:#000;">Name</th>
                  <th style="padding:3px 2px;text-align:right;font-weight:bold;color:#000;">Opening</th>
                  <th style="padding:3px 2px;text-align:right;font-weight:bold;color:#000;">Closing</th>
                  <th style="padding:3px 2px;text-align:right;font-weight:bold;color:#000;">Difference</th>
                </tr>
              </thead>
              <tbody>
                ${filteredChainStock.length > 0 ? filteredChainStock
        .map(
          (item) => `
                  <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:3px 2px;color:#000;">${item.name}</td>
                    <td style="padding:3px 2px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(item.opening)}</td>
                    <td style="padding:3px 2px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(item.closing)}</td>
                    <td style="padding:3px 2px;text-align:right;font-family:monospace;font-weight:bold;color:#000;">${formatNumberDisplay(item.due)}</td>
                  </tr>
                `,
        )
        .join('') : `<tr><td colspan="4" style="padding:4px;text-align:center;color:#666;">No data</td></tr>`}
              </tbody>
            </table>
          </div>

          <!-- CLIENT -->
          <div style="flex:1;">
            <div style="text-align:center;margin:4px 0 2px 0;">
              <span style="font-weight:bold;font-size:11px;letter-spacing:0.5px;color:#000;">CLIENT</span>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:10px;">
              <thead>
                <tr style="border-bottom:1.5px solid #000;background:#f9f9f7;">
                  <th style="padding:3px 2px;text-align:left;font-weight:bold;color:#000;">Name</th>
                  <th style="padding:3px 2px;text-align:right;font-weight:bold;color:#000;">Opening</th>
                  <th style="padding:3px 2px;text-align:right;font-weight:bold;color:#000;">Closing</th>
                  <th style="padding:3px 2px;text-align:right;font-weight:bold;color:#000;">Difference</th>
                </tr>
              </thead>
              <tbody>
                ${filteredClient.length > 0 ? filteredClient
        .map(
          (item) => `
                  <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:3px 2px;color:#000;">${item.name}</td>
                    <td style="padding:3px 2px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(item.opening)}</td>
                    <td style="padding:3px 2px;text-align:right;font-family:monospace;color:#000;">${formatNumberDisplay(item.closing)}</td>
                    <td style="padding:3px 2px;text-align:right;font-family:monospace;font-weight:bold;color:#000;">${formatNumberDisplay(item.difference)}</td>
                  </tr>
                `,
        )
        .join('') : `<tr><td colspan="4" style="padding:4px;text-align:center;color:#666;">No data</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <!-- INWARD OUTWARD HISTORY Section -->
        <div style="text-align:center;margin:10px 0 4px 0;">
          <span style="font-weight:bold;font-size:12px;letter-spacing:1px;color:#000;">INWARD OUTWARD HISTORY</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr style="border-bottom:1.5px solid #000;background:#f9f9f7;">
              <th style="padding:4px;text-align:left;font-weight:bold;color:#000;">INWARD NAME</th>
              <th style="padding:4px;text-align:right;font-weight:bold;color:#000;">INWARD</th>
              <th style="padding:4px;text-align:left;font-weight:bold;color:#000;">OUTWARD NAME</th>
              <th style="padding:4px;text-align:right;font-weight:bold;color:#000;">OUTWARD</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMovement
        .map(
          (item) => `
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:4px;">
                  <div style="font-weight:bold;color:#000;">${item.inwardName ? item.inwardName : '-'}</div>
                  ${item.inwardSubtext ? `<div style="font-size:9px;color:#555;">${item.inwardSubtext}</div>` : ''}
                </td>
                <td style="padding:4px;text-align:right;font-family:monospace;font-weight:bold;color:#16a34a;">${item.inwardName && item.inward != null && item.inward > 0 ? formatNumberDisplay(item.inward) : '-'}</td>
                <td style="padding:4px;">
                  <div style="font-weight:bold;color:#000;">${item.outwardName ? item.outwardName : '-'}</div>
                  ${item.outwardSubtext ? `<div style="font-size:9px;color:#555;">${item.outwardSubtext}</div>` : ''}
                </td>
                <td style="padding:4px;text-align:right;font-family:monospace;font-weight:bold;color:#b45309;">${item.outwardName && item.outward != null && item.outward > 0 ? formatNumberDisplay(item.outward) : '-'}</td>
              </tr>
            `,
        )
        .join('')}
          </tbody>
        </table>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @page {
        size: A4 portrait;
        margin: 5mm;
      }
      @media print {
        body * {
          visibility: hidden !important;
        }
        #stock-ledger-print-container, #stock-ledger-print-container * {
          visibility: visible !important;
        }
        #stock-ledger-print-container {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          background: white !important;
          padding: 4px !important;
          overflow: visible !important;
          z-index: 99999 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      window.print();
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

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Top Navigation / Filter Bar */}
      <div className="sticky top-0 z-20 border-b border-[#d3c4af]/20 bg-[#f9f9f7]/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex flex-col items-center justify-between gap-3 px-3 py-2.5 sm:flex-row sm:px-4 sm:py-3 md:px-6">
          {/* Back & Title */}
          <div className="flex w-full min-w-0 items-center gap-2.5 sm:w-auto">
            <button
              onClick={() => navigate({ to: '/Stocks/stockpage' })}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#b8860b] dark:hover:bg-[#b8860b]/20"
              title="Back to Stock"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/40 dark:bg-slate-700" />
            <div>
              <h1 className="font-headline text-xl font-black italic tracking-tight text-[#1a1a2e] sm:text-2xl lg:text-3xl dark:text-white">
                Business 360 Report
              </h1>
            </div>
          </div>

          {/* Right Controls: Search, From Date, To Date, View Report Button, Print Button */}
          <div className="flex w-full flex-wrap items-center justify-end gap-2.5 sm:w-auto">
            {/* From Date */}
            <div className="flex items-center gap-1.5">
              <span className="hidden text-xs font-bold uppercase text-[#785600] dark:text-[#b8860b] lg:inline">
                From:
              </span>
              <GenericWeeklyDatePicker
                id="stock-ledger-from-date"
                placeholder="From Date"
                mode="from"
                initialDates={fromDate ? [fromDate] : []}
                onDateChange={handleFromDateChange}
                className="w-28 sm:w-32 md:w-36"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-1.5">
              <span className="hidden text-xs font-bold uppercase text-[#785600] dark:text-[#b8860b] lg:inline">
                To:
              </span>
              <GenericWeeklyDatePicker
                id="stock-ledger-to-date"
                placeholder="To Date"
                mode="to"
                initialDates={toDate ? [toDate] : []}
                onDateChange={handleToDateChange}
                className="w-28 sm:w-32 md:w-36"
              />
            </div>

            {/* View Report Button */}
            <button
              onClick={handleViewReport}
              disabled={isLedgerFetching}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#785600] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#5d4200] active:scale-95 disabled:opacity-60 sm:py-2 sm:text-sm"
              title="View Report for Selected Dates"
            >
              {isLedgerFetching ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span>{isLedgerFetching ? 'Loading...' : 'View Report'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#785600]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#785600] shadow-sm transition-colors hover:bg-[#785600]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-[#b8860b] dark:hover:bg-slate-800 sm:py-2 sm:text-sm"
              title="Print / Save PDF"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-6 sm:py-6">
        {/* Main Card Container */}
        <div className="overflow-hidden rounded-2xl border border-[#d3c4af]/30 bg-white shadow-md transition-all dark:border-slate-800 dark:bg-slate-900">
          {/* Header Banner */}
          <div className="border-b border-[#d3c4af]/20 bg-gradient-to-b from-white to-[#f9f9f7] px-4 py-4 text-center dark:from-slate-900 dark:to-slate-900/90">
            <h2 className="text-base font-black tracking-wider text-[#1a1c1b] dark:text-white sm:text-lg md:text-xl uppercase">
              BUSINESS 360 REPORT
            </h2>
            <div className="mt-1.5 flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d3c4af]/40 bg-[#f4f1ea] px-3.5 py-0.5 text-xs font-bold text-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-[#b8860b] shadow-sm">
                <Calendar className="h-3 w-3" />
                Date: {dateRangeLabel}
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-5 md:p-6 space-y-5">
            {/* 1. OPENING / CLOSING Split Box */}
            <div className="overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white dark:border-slate-800 dark:bg-slate-900/70 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#d3c4af]/30 dark:divide-slate-800">
                {/* Left: OPENING */}
                <div>
                  <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2 text-center dark:bg-slate-800/60">
                    <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                      OPENING
                    </span>
                  </div>
                  <div className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800 text-xs sm:text-sm font-semibold">
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-[#785600]/5 dark:hover:bg-slate-800/40 transition-colors">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">Gold Stock</span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.opening.gold)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-[#785600]/5 dark:hover:bg-slate-800/40 transition-colors">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">Manufacturing</span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.opening.raw)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-[#785600]/5 dark:hover:bg-slate-800/40 transition-colors">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">Chain Stock</span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.opening.openingChain)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-[#785600]/5 dark:hover:bg-slate-800/40 transition-colors">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">Client Due</span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.opening.openingClientDue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-[#785600]/5 dark:hover:bg-slate-800/40 transition-colors">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">SRP</span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.opening.srp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-[#f4f1ea]/60 px-4 py-2.5 dark:bg-slate-800/50">
                      <span className="font-bold text-[#1a1c1b] dark:text-white">Inward</span>
                      <span className="font-mono text-sm font-bold text-green-700 dark:text-green-400">
                        {formatNumberDisplay(summaryData.opening.inward)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: CLOSING */}
                <div>
                  <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2 text-center dark:bg-slate-800/60">
                    <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                      CLOSING
                    </span>
                  </div>
                  <div className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800 text-xs sm:text-sm font-semibold">
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-[#785600]/5 dark:hover:bg-slate-800/40 transition-colors">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">Gold Stock</span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.closing.gold)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-[#785600]/5 dark:hover:bg-slate-800/40 transition-colors">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">Manufacturing</span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.closing.raw)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-[#785600]/5 dark:hover:bg-slate-800/40 transition-colors">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">Chain Stock</span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.closing.closingChain)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-[#785600]/5 dark:hover:bg-slate-800/40 transition-colors">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">Client Due</span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.closing.closingClientDue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-[#785600]/5 dark:hover:bg-slate-800/40 transition-colors">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">Loss</span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.closing.loss)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-[#f4f1ea]/60 px-4 py-2.5 dark:bg-slate-800/50">
                      <span className="font-bold text-[#1a1c1b] dark:text-white">Outward</span>
                      <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-400">
                        {formatNumberDisplay(summaryData.closing.outward)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#d3c4af]/30 bg-emerald-50/70 px-4 py-2.5 dark:bg-emerald-950/30">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300">Profit / Loss</span>
                      <span className="font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                        {formatNumberDisplay(summaryData.closing.profitLoss ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2, 3, 4: MANUFACTURING STOCK, CHAIN STOCK, & CLIENT in ONE ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              {/* MANUFACTURING STOCK Table */}
              <div className="flex flex-col h-full rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/70">
                <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                  <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                    MANUFACTURING STOCK
                  </span>
                </div>
                <div className="overflow-x-auto flex-1 flex flex-col">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <th className="px-3.5 py-2.5">Name</th>
                        <th className="px-3.5 py-2.5 text-right">Opening</th>
                        <th className="px-3.5 py-2.5 text-right">Closing</th>
                        <th className="px-3.5 py-2.5 text-right">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                      {filteredRawStock.length > 0 ? (
                        filteredRawStock.map((row) => (
                          <tr
                            key={row.id}
                            className="transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-3.5 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                              {row.name}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                              {formatNumberDisplay(row.opening)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                              {formatNumberDisplay(row.closing)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-bold text-[#1a1c1b] dark:text-slate-100">
                              {formatNumberDisplay(row.due)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3.5 py-6 text-center text-xs text-gray-500">
                            No manufacturing stock data found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CHAIN STOCK Table */}
              <div className="flex flex-col h-full rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/70">
                <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                  <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                    CHAIN STOCK
                  </span>
                </div>
                <div className="overflow-x-auto flex-1 flex flex-col">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <th className="px-3.5 py-2.5">Name</th>
                        <th className="px-3.5 py-2.5 text-right">Opening</th>
                        <th className="px-3.5 py-2.5 text-right">Closing</th>
                        <th className="px-3.5 py-2.5 text-right">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                      {filteredChainStock.length > 0 ? (
                        filteredChainStock.map((row) => (
                          <tr
                            key={row.id}
                            className="transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-3.5 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                              {row.name}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                              {formatNumberDisplay(row.opening)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                              {formatNumberDisplay(row.closing)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-bold text-[#1a1c1b] dark:text-slate-100">
                              {formatNumberDisplay(row.due)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3.5 py-6 text-center text-xs text-gray-500">
                            No chain stock data found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CLIENT Table */}
              <div className="flex flex-col h-full rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/70">
                <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                  <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                    CLIENT
                  </span>
                </div>
                <div className="overflow-x-auto flex-1 flex flex-col">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <th className="px-3.5 py-2.5">Name</th>
                        <th className="px-3.5 py-2.5 text-right">Opening</th>
                        <th className="px-3.5 py-2.5 text-right">Closing</th>
                        <th className="px-3.5 py-2.5 text-right">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                      {filteredClient.length > 0 ? (
                        filteredClient.map((row) => (
                          <tr
                            key={row.id}
                            className="transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-3.5 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                              {row.name}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                              {formatNumberDisplay(row.opening)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                              {formatNumberDisplay(row.closing)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-bold text-[#1a1c1b] dark:text-slate-100">
                              {formatNumberDisplay(row.difference)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3.5 py-6 text-center text-xs text-gray-500">
                            No client records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 5. INWARD OUTWARD HISTORY Table */}
            <div className="rounded-xl border border-[#d3c4af]/30 bg-white dark:border-slate-800 dark:bg-slate-900/70 shadow-sm overflow-hidden">
              <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2 text-center dark:bg-slate-800/60">
                <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                  INWARD OUTWARD HISTORY
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <th className="px-4 py-2.5">INWARD NAME</th>
                      <th className="px-4 py-2.5 text-right">INWARD</th>
                      <th className="px-4 py-2.5">OUTWARD NAME</th>
                      <th className="px-4 py-2.5 text-right">OUTWARD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                    {filteredMovement.length > 0 ? (
                      filteredMovement.map((row) => (
                        <tr
                          key={row.id}
                          className="transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-[#1a1c1b] dark:text-white">
                              {row.inwardName ? row.inwardName : '-'}
                            </div>
                            {row.inwardSubtext && (
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                {row.inwardSubtext}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-green-700 dark:text-green-400">
                            {row.inwardName && row.inward != null && row.inward > 0 ? formatNumberDisplay(row.inward) : '-'}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-[#1a1c1b] dark:text-white">
                              {row.outwardName ? row.outwardName : '-'}
                            </div>
                            {row.outwardSubtext && (
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                {row.outwardSubtext}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                            {row.outwardName && row.outward != null && row.outward > 0 ? formatNumberDisplay(row.outward) : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-xs text-gray-500">
                          No stock movement records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
