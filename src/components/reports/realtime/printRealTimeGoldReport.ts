import {
  CategoryGroup,
  formatNumberDisplay,
  calculateAvgPurity,
  getItemPrintName,
  getItemPurity,
  formatDateForDisplay,
} from './realTimeGoldUtils';

interface PrintReportParams {
  headerInfo: any;
  filteredGroups: CategoryGroup[];
  grandTotals: {
    grandTotalWeight: number;
    grandTotalFineWeight: number;
    avgPurity: string;
    stockGrossWeight?: number;
    stockFineWeight?: number;
    stockAvgPurity?: string;
    processGrossWeight?: number;
    processFineWeight?: number;
    processAvgPurity?: string;
    clientDueFineWeight?: number;
  };
  fromDate?: Date | null;
  toDate?: Date | null;
}

export const printRealTimeGoldReport = ({
  headerInfo,
  filteredGroups,
  grandTotals,
  fromDate,
  toDate,
}: PrintReportParams) => {
  const header = headerInfo || {};
  const factoryName = header.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
  const proprietorName = header.proprietorName || 'प्रो. नितीन खरात';
  const phoneNumbers = header.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
  const leftInvocation = header.leftInvocation || '॥ श्री गणेश प्रसन्न ॥';
  const rightInvocation = header.rightInvocation || '॥ श्री साई प्रसन्न ॥';
  const description =
    header.description || 'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
  const invocationColor = header.invocationColor || '#a84b20';
  const factoryNameColor = header.factoryNameColor || '#c43d5c';
  const descriptionColor = header.descriptionColor || '#8b451f';
  const proprietorColor = header.proprietorColor || '#a84b20';
  const phoneColor = header.phoneColor || '#a84b20';
  const factoryFontSize = header.factoryFontSize
    ? `${header.factoryFontSize}px`
    : '20px';
  const descriptionFontSize = header.descriptionFontSize
    ? `${header.descriptionFontSize}px`
    : '9px';
  const proprietorFontSize = header.proprietorFontSize
    ? `${header.proprietorFontSize}px`
    : '9px';
  const phoneFontSize = header.phoneFontSize
    ? `${header.phoneFontSize}px`
    : '9px';

  const printContainer = document.createElement('div');
  printContainer.id = 'print-container';

  let stockGroupsHtml = '';
  let processGroupsHtml = '';
  let clientDueHtml = '';

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
            ${getItemPrintName(item)}
          </td>
          <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${formatNumberDisplay(item.grossWeight)}</td>
          <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${(() => {
            const p = getItemPurity(item);
            return p === null ? '-' : formatNumberDisplay(p, 2) + '%';
          })()}</td>
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
            ${getItemPrintName(item)}
          </td>
          <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${formatNumberDisplay(item.grossWeight)}</td>
          <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${(() => {
            const p = getItemPurity(item);
            return p === null ? '-' : formatNumberDisplay(p, 2) + '%';
          })()}</td>
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
          <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:bold;">${formatNumberDisplay(item.fineWeight)}</td>
        </tr>
      `,
      )
      .join('');

    clientDueHtml = `
      <div style="margin-bottom:8px;page-break-inside:avoid;">
        <div style="background:#fff8e6;padding:3px 6px;font-weight:bold;font-size:9.5px;border:1px solid #785600;border-bottom:none;color:#785600;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;">Customer Due</span>
          <span style="font-size:8.5px;color:#000;">Total Due: <b>${formatNumberDisplay(clientDueGroup.totalFineWeight)} G</b> | Clients: <b>${clientDueGroup.count}</b></span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:8.5px;margin:0;padding:0;">
          <thead>
            <tr style="background:#785600;color:white;font-weight:600;">
              <th style="border:1px solid #785600;padding:2px 3px;width:32px;text-align:center;font-size:8px;color:white;">Sr. No</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;color:white;">Customer Name</th>
              <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Fine WT (G)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Real-Time Stock Report</title>
        <style>
          @page {
            size: A4;
            margin: 4mm 5mm 4mm 5mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #000;
            background: #fff;
            font-size: 8.5px;
          }
          .header-container {
            width: 100%;
            text-align: center;
            border-bottom: 2px solid ${factoryNameColor};
            padding-bottom: 3px;
            margin-bottom: 5px;
          }
          .title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1px;
          }
          .summary-card {
            background: #fffdfa;
            border: 1px solid #785600;
            padding: 4px 6px;
            border-radius: 4px;
            margin-bottom: 8px;
            page-break-inside: avoid;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
            text-align: center;
          }
          .summary-item {
            padding: 3px 2px;
            background: #fdfbf7;
            border: 1px solid #e2d7c3;
            border-radius: 3px;
          }
          .summary-label {
            font-size: 7.5px;
            font-weight: 700;
            color: #785600;
            text-transform: uppercase;
          }
          .summary-val {
            font-size: 8.5px;
            font-weight: bold;
            color: #000;
            margin-top: 1px;
          }
          table {
            border: 1px solid #785600;
          }
          th {
            border: 1px solid #785600;
          }
          td {
            border: 1px solid #785600;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="title-row">
            <span style="font-size:9.5px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
            <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
            <span style="font-size:9.5px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
          </div>
          <div style="font-size:${descriptionFontSize};font-weight:bold;color:${descriptionColor};margin-top:1px;">
            ${description}
          </div>
          <div style="font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};margin-top:1px;">
            ${proprietorName} &nbsp;&nbsp;|&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;border-bottom:1px solid #785600;padding-bottom:2px;">
          <span style="font-size:11px;font-weight:bold;color:#785600;letter-spacing:1px;text-transform:uppercase;">
            REAL-TIME GOLD STOCK REPORT
          </span>
          <span style="font-size:8px;font-weight:bold;color:#555;">
            ${fromDate || toDate ? `Period: ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)} | ` : ''}Printed: ${new Date().toLocaleString('en-IN')}
          </span>
        </div>

        <div class="summary-card">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Total Stock</div>
              <div class="summary-val">${formatNumberDisplay(grandTotals.stockGrossWeight)} G <span style="font-size:7.5px;color:#785600;">(${grandTotals.stockAvgPurity}%)</span></div>
              <div style="font-size:7.5px;color:#444;">Fine: <b>${formatNumberDisplay(grandTotals.stockFineWeight)} G</b></div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Manufacturing Process</div>
              <div class="summary-val">${formatNumberDisplay(grandTotals.processGrossWeight)} G <span style="font-size:7.5px;color:#785600;">(${grandTotals.processAvgPurity}%)</span></div>
              <div style="font-size:7.5px;color:#444;">Fine: <b>${formatNumberDisplay(grandTotals.processFineWeight)} G</b></div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Customer Due</div>
              <div class="summary-val" style="color:#785600;">Fine: ${formatNumberDisplay(grandTotals.clientDueFineWeight)} G</div>
              <div style="font-size:7.5px;color:#444;">Pure Gold (100%)</div>
            </div>
            <div class="summary-item" style="background:#fff4d4;border-color:#785600;">
              <div class="summary-label" style="color:#785600;">Grand Total</div>
              <div class="summary-val" style="color:#785600;">${formatNumberDisplay(grandTotals.grandTotalWeight)} G <span style="font-size:7.5px;">(${grandTotals.avgPurity}%)</span></div>
              <div style="font-size:7.5px;color:#000;">Fine: <b>${formatNumberDisplay(grandTotals.grandTotalFineWeight)} G</b></div>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:8px;align-items:flex-start;">
          <div style="flex:1;">
            <div style="font-size:9.5px;font-weight:bold;color:#785600;margin-bottom:3px;border-bottom:1.5px solid #785600;padding-bottom:1px;text-transform:uppercase;">
              Stock Details
            </div>
            ${stockGroupsHtml || '<p style="text-align:center;font-size:8px;color:#777;">No Stock Data</p>'}
          </div>

          <div style="flex:1;">
            <div style="font-size:9.5px;font-weight:bold;color:#785600;margin-bottom:3px;border-bottom:1.5px solid #785600;padding-bottom:1px;text-transform:uppercase;">
              Manufacturing & Customer Due
            </div>
            ${processGroupsHtml || '<p style="text-align:center;font-size:8px;color:#777;">No Process Data</p>'}
            ${clientDueHtml}
          </div>
        </div>
      </body>
    </html>
  `;

  printContainer.innerHTML = printContent;
  document.body.appendChild(printContainer);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(printContent);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        const el = document.getElementById('print-container');
        if (el) document.body.removeChild(el);
      }, 1000);
    }, 500);
  }
};
