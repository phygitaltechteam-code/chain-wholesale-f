import React from 'react';
import {Printer} from 'lucide-react';
import {
  ClientReportEntry,
  formatNumber,
  getRemarkStyle,
} from './clientReportUtils';

interface ClientReportTableProps {
  filteredData: ClientReportEntry[];
  onOpenReceipt: (entry: ClientReportEntry) => void;
}

export const ClientReportTable: React.FC<ClientReportTableProps> = ({
  filteredData,
  onOpenReceipt,
}) => {
  return (
    <div className="-mx-3 overflow-x-auto sm:-mx-4 md:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="divide-gray-300 min-w-full divide-y dark:divide-slate-700">
            <thead className="bg-[#785600] dark:bg-[#5d4200]">
              <tr>
                <th
                  scope="col"
                  className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Sr No.
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Bill No.
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Date Time
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Item (Size)
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Purity
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Remark
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Chain WT (G)
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Gold WT (G)
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
              {filteredData.map((entry, index) => {
                const isFirstRowOfGroup = entry.isFirstInGroup;

                return (
                  <tr
                    key={entry.id}
                    className={
                      index % 2 === 0
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-gray-50 dark:bg-slate-800/50'
                    }
                  >
                    {isFirstRowOfGroup && (
                      <td
                        rowSpan={entry.groupRowSpan}
                        className="whitespace-nowrap border-r border-[#f4f4f2] py-3 pl-4 pr-3 text-center align-middle text-sm font-medium text-[#1a1c1b] dark:border-slate-700 dark:text-white"
                      >
                        {entry.srNo}
                      </td>
                    )}
                    {isFirstRowOfGroup && (
                      <td
                        rowSpan={entry.groupRowSpan}
                        className="whitespace-nowrap border-r border-[#f4f4f2] px-3 py-3 align-middle text-sm dark:border-slate-700"
                      >
                        <span className="text-base font-bold text-black dark:text-[#785600]">
                          {entry.billNo || ''}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-3 text-left align-middle text-sm text-[#1a1c1b] dark:text-white">
                      <div className="flex flex-col items-start leading-tight">
                        <span>{entry.dateTime.split(' ')[0]}</span>
                        <span>
                          {entry.dateTime.split(' ').slice(1).join(' ')}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-[#1a1c1b] dark:text-white">
                          {entry.item}
                        </span>
                        {entry.size ? (
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            ({entry.size})
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="font-mono whitespace-nowrap px-3 py-3 text-sm text-[#1a1c1b] dark:text-white">
                      {entry.purity !== 'N/A' && entry.purity !== ''
                        ? `${entry.purity}%`
                        : 'N/A'}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getRemarkStyle(
                          entry.remark,
                        )}`}
                      >
                        {entry.remark || 'N/A'}
                      </span>
                    </td>

                    <td className="font-mono whitespace-nowrap px-3 py-3 text-center text-sm font-bold text-[#1a1c1b] dark:text-white">
                      {entry.chainWt !== null && entry.chainWt !== undefined ? (
                        <span>
                          {entry.chainWt > 0 ? '+' : ''}
                          {formatNumber(entry.chainWt)} G
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 font-normal">
                          -
                        </span>
                      )}
                    </td>

                    <td className="font-mono whitespace-nowrap px-3 py-3 text-center text-sm font-bold text-[#1a1c1b] dark:text-white">
                      {entry.goldWt !== null && entry.goldWt !== undefined ? (
                        <span>
                          {entry.goldWt > 0 ? '+' : ''}
                          {formatNumber(entry.goldWt)} G
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 font-normal">
                          -
                        </span>
                      )}
                    </td>

                    {isFirstRowOfGroup && (
                      <td
                        rowSpan={entry.groupRowSpan}
                        className="whitespace-nowrap border-l border-[#f4f4f2] px-3 py-3 text-center align-middle dark:border-slate-700"
                      >
                        {(() => {
                          const remarkLower = (entry.remark || '')
                            .toLowerCase()
                            .trim();

                          // If remark is Opening Balance, do not show print icon
                          if (remarkLower.includes('opening')) {
                            return null;
                          }

                          const groupWeight =
                            entry.rawGroupItems &&
                            entry.rawGroupItems.length > 0
                              ? entry.rawGroupItems.reduce(
                                  (acc, it) => acc + (Number(it.weight) || 0),
                                  0,
                                )
                              : entry.wt !== undefined && entry.wt !== null
                                ? entry.wt
                                : (entry.chainWt ?? entry.goldWt ?? 0);

                          const isNegative =
                            groupWeight < 0 ||
                            entry.wt < 0 ||
                            (entry.goldWt !== null &&
                              entry.goldWt !== undefined &&
                              entry.goldWt < 0) ||
                            (entry.chainWt !== null &&
                              entry.chainWt !== undefined &&
                              entry.chainWt < 0);

                          // Only show print icon for negative / settle / given transactions
                          if (!isNegative) return null;

                          return (
                            <button
                              type="button"
                              onClick={() => onOpenReceipt(entry)}
                              title="Print Settle / Give Receipt"
                              className="inline-flex items-center justify-center rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-amber-400 dark:hover:bg-amber-400/20"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          );
                        })()}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
