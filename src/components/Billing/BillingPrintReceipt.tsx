// BillingPrintReceipt.tsx
import React, {useEffect} from 'react';
import {MdPrint, MdPictureAsPdf, MdClose} from 'react-icons/md';

interface PrintReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    invoiceNo: string;
    date: string;
    client: {
      name: string;
      phone: string;
      address?: string;
      gst?: string;
    };
    items: Array<{
      metalName: string;
      weight: number;
      rate: number;
      amount: number;
    }>;
    makingFees: number;
    gstPercent: number;
    gstAmount: number;
    exchangeValue: number;
    previousBalance: number;
    subTotal: number;
    totalWithTax: number;
    netPayable: number;
    cashPaid: number;
    balanceDue: number;
    transactionType: string;
    billingMode: string;
    paymentMode: string;
    shopName?: string;
    shopAddress?: string;
    gstin?: string;
  };
  user?: {
    fullname?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
  };
}

const BillingPrintReceipt: React.FC<PrintReceiptProps> = ({
  isOpen,
  onClose,
  data,
  user,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 3) => {
    return value.toFixed(decimals);
  };

  const generateHTMLContent = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${data.invoiceNo}</title>
          <meta charset="utf-8" />
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: white;
              padding: 20px;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 1px solid #e0e0e0;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .invoice-header {
              background: #1a1a2e;
              color: white;
              text-align: center;
              padding: 30px;
            }
            .invoice-header h1 {
              font-family: 'Times New Roman', serif;
              font-size: 28px;
              color: #B8860B;
              margin-bottom: 5px;
            }
            .invoice-header p {
              font-size: 10px;
              letter-spacing: 2px;
              opacity: 0.7;
              margin-bottom: 10px;
            }
            .invoice-header .address {
              font-size: 9px;
              opacity: 0.6;
              max-width: 300px;
              margin: 0 auto;
              line-height: 1.4;
            }
            .invoice-body {
              padding: 30px;
            }
            .client-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 1px solid #e0e0e0;
            }
            .client-info h4 {
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              color: #666;
              margin-bottom: 8px;
            }
            .client-info p {
              font-size: 12px;
              margin-bottom: 4px;
            }
            .client-name {
              font-weight: bold;
              font-size: 14px;
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
              border-bottom: 1px solid #e0e0e0;
              padding-bottom: 10px;
            }
            td {
              font-size: 11px;
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .text-right {
              text-align: right;
            }
            .summary {
              margin-top: 20px;
              border-top: 1px solid #e0e0e0;
              padding-top: 15px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 11px;
            }
            .summary-row.total {
              border-top: 2px solid #1a1a2e;
              margin-top: 10px;
              padding-top: 12px;
              font-weight: bold;
              font-size: 14px;
            }
            .summary-row.total .label {
              font-weight: bold;
            }
            .summary-row.total .value {
              color: #785600;
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
            }
            .signature {
              margin-top: 20px;
              display: flex;
              justify-content: center;
            }
            .signature div {
              text-align: center;
            }
            .signature hr {
              width: 150px;
              margin-top: 30px;
              border: none;
              border-top: 1px solid #ccc;
            }
            .signature p {
              font-size: 9px;
              color: #666;
              margin-top: 5px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <h1>${data.shopName || user?.fullname || 'VIKAS JEWELLERS'}</h1>
              <p>Exquisite Craftsmanship Since 1988</p>
              <div class="address">
                ${data.shopAddress || user?.address || 'Goldsmith Street, Jewel Bazaar, Zaveri Mandi, Mumbai - 400002'}
              </div>
              <div class="address" style="margin-top: 5px;">
                ${user?.phoneNumber ? `Mob: ${user.phoneNumber}` : ''}
                ${user?.email ? ` | Email: ${user.email}` : ''}
              </div>
              <div class="address" style="margin-top: 2px;">
                GSTIN: ${data.gstin || '27AABCV1234F1Z1'}
              </div>
            </div>

            <div class="invoice-body">
              <div class="client-info">
                <div>
                  <h4>Billed To</h4>
                  <p class="client-name">${data.client.name}</p>
                  <p>${data.client.phone}</p>
                  ${data.client.address ? `<p>${data.client.address}</p>` : ''}
                  ${data.client.gst ? `<p>GST: ${data.client.gst}</p>` : ''}
                </div>
                <div style="text-align: right;">
                  <h4>Invoice Details</h4>
                  <p><strong>No:</strong> ${data.invoiceNo}</p>
                  <p><strong>Date:</strong> ${data.date}</p>
                  <p><strong>Payment Mode:</strong> ${data.paymentMode}</p>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th class="text-right">Weight (g)</th>
                    <th class="text-right">Rate (₹)</th>
                    <th class="text-right">Amount (₹)</th>
                   </tr>
                </thead>
                <tbody>
                  ${data.items
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.metalName}</td>
                      <td class="text-right">${formatNumber(item.weight, 3)}</td>
                      <td class="text-right">₹${formatNumber(item.rate, 2)}</td>
                      <td class="text-right"><strong>${formatCurrency(item.amount)}</strong></td>
                    </tr>
                  `,
                    )
                    .join('')}
                  <tr>
                    <td colspan="3" class="text-right">Making Charges</td>
                    <td class="text-right">${formatCurrency(data.makingFees)}</td>
                  </tr>
                  ${
                    data.gstAmount > 0
                      ? `
                    <tr>
                      <td colspan="3" class="text-right">GST (${data.gstPercent}%)</td>
                      <td class="text-right">${formatCurrency(data.gstAmount)}</td>
                    </tr>
                  `
                      : ''
                  }
                  ${
                    data.exchangeValue > 0
                      ? `
                    <tr style="color: #5d5c74; font-weight: bold;">
                      <td colspan="3" class="text-right">Less: Metal Exchange</td>
                      <td class="text-right">- ${formatCurrency(data.exchangeValue)}</td>
                    </tr>
                  `
                      : ''
                  }
                </tbody>
              </table>

              <div class="summary">
                <div class="summary-row">
                  <span>Subtotal (Items + Tax)</span>
                  <span>${formatCurrency(data.totalWithTax)}</span>
                </div>
                ${
                  data.exchangeValue > 0
                    ? `
                  <div class="summary-row">
                    <span>Less: Metal Exchange</span>
                    <span style="color: #5d5c74;">- ${formatCurrency(data.exchangeValue)}</span>
                  </div>
                `
                    : ''
                }
                ${
                  data.previousBalance > 0
                    ? `
                  <div class="summary-row">
                    <span>Add: Previous Balance</span>
                    <span style="color: #ba1a1a;">+ ${formatCurrency(data.previousBalance)}</span>
                  </div>
                `
                    : ''
                }
                <div class="summary-row total">
                  <span class="label">Net Payable</span>
                  <span class="value">${formatCurrency(data.netPayable)}</span>
                </div>
                <div class="summary-row">
                  <span>Cash Paid</span>
                  <span>${formatCurrency(data.cashPaid)}</span>
                </div>
                <div class="summary-row">
                  <span>Balance Due</span>
                  <span style="${data.balanceDue > 0 ? 'color: #ba1a1a;' : 'color: green;'}">
                    ${data.balanceDue > 0 ? formatCurrency(data.balanceDue) : 'Settled'}
                  </span>
                </div>
              </div>

              <div class="footer">
                <div class="signature">
                  <div>
                    <hr />
                    <p>Authorized Signatory</p>
                  </div>
                </div>
                <p style="font-size: 8px; color: #999; margin-top: 15px;">
                  This is a computer generated invoice and does not require a physical signature.
                </p>
                <p style="font-size: 8px; color: #999; margin-top: 5px;">
                  Thank you for your business!
                </p>
              </div>
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => {
                window.close();
              }, 500);
            }, 300);
          </script>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open(
      '',
      '_blank',
      'width=800,height=600,scrollbars=yes',
    );
    if (!printWindow) {
      alert('Please allow pop-ups to print the invoice');
      return;
    }
    printWindow.document.write(generateHTMLContent());
    printWindow.document.close();
    onClose();
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open(
      '',
      '_blank',
      'width=800,height=600,scrollbars=yes',
    );
    if (!printWindow) {
      alert('Please allow pop-ups to download PDF');
      return;
    }
    printWindow.document.write(generateHTMLContent());
    printWindow.document.close();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Simple Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4">
          <h3 className="text-lg font-bold text-[#1a1c1b]">Invoice Actions</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:bg-[#f4f4f2]"
          >
            <MdClose className="h-5 w-5 text-[#4f4535]" />
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="p-6">
          <div className="mb-4 text-center">
            <div className="inline-block rounded-full bg-[#785600]/10 px-3 py-1 text-xs font-medium text-[#785600]">
              Invoice #{data.invoiceNo}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#4f4535]">Client:</span>
              <span className="font-medium">{data.client.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#4f4535]">Amount:</span>
              <span className="font-bold text-[#785600]">
                {formatCurrency(data.netPayable)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#4f4535]">Date:</span>
              <span>{data.date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#4f4535]">Items:</span>
              <span>{data.items.length} item(s)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 border-t border-[#d3c4af]/20 p-4">
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#785600] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5d4200]"
          >
            <MdPrint className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1a1a2e] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a2a3e]"
          >
            <MdPictureAsPdf className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingPrintReceipt;
