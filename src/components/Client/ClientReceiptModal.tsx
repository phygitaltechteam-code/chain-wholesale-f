import React from 'react';
import { X, Printer, CheckCircle, FileText } from 'lucide-react';
import {
  ClientReceiptData,
  printClientReceipt,
} from '@/utils/printClientReceipt';
import { useGetHeader } from '@/lib/api/headerapi';

interface ClientReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ClientReceiptData | null;
}

const formatNumber = (val: any, decimals: number = 3): string => {
  if (val === null || val === undefined || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  const str = num.toFixed(decimals);
  return str.replace(/\.?0+$/, '');
};

const ClientReceiptModal: React.FC<ClientReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  const getpdfheaderdata = useGetHeader();

  if (!isOpen || !receiptData) return null;

  const headerInfo =
    getpdfheaderdata?.data?.data ||
    (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {}) ||
    {};

  const leftInvocation =
    headerInfo.leftInvocation ||
    headerInfo.leftInovation ||
    '॥ श्री गणेश प्रसन्न ॥';
  const rightInvocation =
    headerInfo.rightInvocation ||
    headerInfo.rightInovation ||
    '॥ श्री साई प्रसन्न ॥';
  const factoryName =
    headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
  const description =
    headerInfo.description || 'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
  const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
  const phoneNumbers =
    headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';

  const dateFormatted =
    receiptData.dateStr ||
    receiptData.dateTime ||
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const hasItems = receiptData.items && receiptData.items.length > 0;

  const handlePrint = () => {
    printClientReceipt(receiptData, getpdfheaderdata);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl border border-[#d3c4af]/30 dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 bg-[#785600] px-5 py-3 text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/20 p-1.5">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Client Receipt Preview</h3>
              <p className="text-xs text-amber-100">
                Receipt for {receiptData.clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body - Receipt Paper View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-50/50 dark:bg-slate-950/40">
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
            {/* Header / Letterhead */}
            <div className="text-center pb-2 border-b border-[#785600]">
              <div className="flex justify-between items-center text-[10px] font-bold text-[#a84b20]">
                <span>{leftInvocation}</span>
                <span className="text-base sm:text-lg font-black text-[#785600] dark:text-amber-400">
                  {factoryName}
                </span>
                <span>{rightInvocation}</span>
              </div>
              <p className="text-[9px] font-medium text-[#8b451f] dark:text-slate-300 mt-0.5">
                {description}
              </p>
              <p className="text-[9px] font-bold text-[#a84b20] mt-0.5">
                {proprietorName} &nbsp;|&nbsp; {phoneNumbers}
              </p>
            </div>

            {/* Badge & Bill No */}
            <div className="relative text-center mt-3 mb-2">
              <span className="inline-block rounded bg-[#785600] px-3.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                {receiptData.transactionType === 'give'
                  ? 'GIVE RECEIPT'
                  : receiptData.transactionType === 'receive'
                  ? 'PAYMENT RECEIPT'
                  : 'CLIENT RECEIPT'}
              </span>
              {receiptData.billNumber && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-bold text-[#785600] dark:text-amber-400">
                  Bill No: {receiptData.billNumber}
                </span>
              )}
            </div>

            {/* Client Info & Date */}
            <div className="mb-2 rounded-lg border border-[#d3c4af]/30 bg-[#faf9f6] p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="text-xs font-bold text-[#1a1c1b] dark:text-white">
                    <span className="font-semibold text-[#4f4535] dark:text-slate-400">Client:</span> {receiptData.clientName || 'N/A'}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-[#4f4535] dark:text-slate-300">
                    {receiptData.phoneNumber && <div><strong className="text-[#4f4535] dark:text-slate-400">Phone:</strong> {receiptData.phoneNumber}</div>}
                    {receiptData.address && <div><strong className="text-[#4f4535] dark:text-slate-400">Address:</strong> {receiptData.address}</div>}
                  </div>
                </div>
                <div className="text-right text-[11px] text-[#4f4535] dark:text-slate-300 whitespace-nowrap">
                  <div><strong>Date:</strong> {dateFormatted}</div>
                  {receiptData.remark && !hasItems && (
                    <div className="mt-0.5 text-[#785600] font-semibold">
                      <strong>Remark:</strong> {receiptData.remark}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table if Bill */}
            {hasItems && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-[#d3c4af]/30 dark:border-slate-700">
                  <thead>
                    <tr className="bg-[#785600] text-white">
                      <th className="p-1.5 border border-[#785600] text-center w-8">
                        #
                      </th>
                      <th className="p-1.5 border border-[#785600] text-left">
                        Item
                      </th>
                      <th className="p-1.5 border border-[#785600] text-center w-16">
                        Purity
                      </th>
                      <th className="p-1.5 border border-[#785600] text-center w-16">
                        Remark
                      </th>
                      <th className="p-1.5 border border-[#785600] text-right w-24">
                        Weight (G)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.items!.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-[#d3c4af]/20 dark:border-slate-800"
                      >
                        <td className="p-1.5 text-center text-[#4f4535] dark:text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-1.5 font-bold text-[#1a1c1b] dark:text-white">
                          {item.item || 'Gold'}
                          {item.size ? ` (${item.size})` : ''}
                        </td>
                        <td className="p-1.5 text-center">
                          {item.purity ? `${item.purity}%` : '-'}
                        </td>
                        <td className="p-1.5 text-center">
                          {item.remark || '-'}
                        </td>
                        <td className="p-1.5 text-right font-mono font-bold text-[#785600] dark:text-amber-400">
                          {formatNumber(item.weight || item.grossWeight || 0)} G
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Transaction / Balance Card */}
            <div className="mt-3 rounded-lg border border-[#d3c4af]/30 bg-[#fcfbf9] p-3 dark:border-slate-700 dark:bg-slate-800/60 ml-auto max-w-xs">
              {receiptData.previousBalance !== undefined && (
                <div className="flex justify-between text-xs py-0.5 text-[#4f4535] dark:text-slate-400 border-b border-dashed border-[#d3c4af]/30 pb-1">
                  <span>Previous Due Balance:</span>
                  <span className="font-mono font-bold text-[#1a1c1b] dark:text-white">
                    {formatNumber(receiptData.previousBalance)} G
                  </span>
                </div>
              )}
              {receiptData.amount !== undefined && (
                <div className="flex justify-between text-xs py-1 text-[#4f4535] dark:text-slate-400">
                  <span>
                    {receiptData.transactionType === 'give'
                      ? 'Given Weight (+):'
                      : receiptData.transactionType === 'receive'
                      ? 'Received Weight (-):'
                      : 'Total Weight:'}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      receiptData.transactionType === 'give'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {receiptData.transactionType === 'give'
                      ? '+'
                      : receiptData.transactionType === 'receive'
                      ? '-'
                      : ''}
                    {formatNumber(receiptData.amount)} G
                  </span>
                </div>
              )}
              {receiptData.newBalance !== undefined && (
                <div className="flex justify-between text-xs pt-1.5 border-t border-[#785600] font-bold text-[#785600] dark:text-amber-400">
                  <span>New Due Balance:</span>
                  <span className="font-mono">
                    {formatNumber(receiptData.newBalance)} G
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#d3c4af]/20 p-3.5 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientReceiptModal;
