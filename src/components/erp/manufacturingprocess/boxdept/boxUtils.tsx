import React from 'react';
import { Column } from '@/components/Forms/Table/GenericTable';
import { Flame, Save } from 'lucide-react';

export interface BoxEntry {
    id: string;
    srNo: number;
    dateTime: string;
    item: any;
    size: any;
    purity: number;
    tarWeight: number;
    chainWeight: number;
    scrap: number;
    loss: number;
    isEditing?: boolean;
    isSaved?: boolean;
    purityRaw?: string;
    chainWeightRaw?: string;
    scrapRaw?: string;
    itemId?: string;
    sizeId?: string;
    isCompleted?: boolean;
    isDirty?: boolean;
    status?: string;
    process?: string;
    isMelting?: boolean;
    meltingStatus?: boolean;
}

export interface BoxCardForm {
    id: string;
    sizeId: string;
    purity: string;
    tarWeight: string;
    chainWeight: string;
    scrap: string;
    isSaving?: boolean;
}

export const createNewBoxCard = (initial?: Partial<BoxCardForm>): BoxCardForm => ({
    id: `box-card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sizeId: initial?.sizeId || '',
    purity: initial?.purity || '',
    scrap: initial?.scrap || '',
    tarWeight: initial?.tarWeight || '',
    chainWeight: initial?.chainWeight || '',
});

// Helper functions for safely extracting values
export const getItemName = (item: any): string => {
    if (!item) return '-';
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item.name) return String(item.name);
    return '-';
};

export const getSizeName = (size: any): string => {
    if (!size) return '-';
    if (typeof size === 'string') return size;
    if (typeof size === 'object' && size.size !== undefined)
        return String(size.size);
    return '-';
};

export const hasMeltingStatus = (item: any): boolean => {
    const s = String(item?.status || item?.process || '').toUpperCase();
    return (
        s === 'MELTING' ||
        item?.isMelting === true ||
        item?.meltingStatus === true
    );
};

export const toNumber = (value: unknown): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

// Helper function for 3 decimal formatted numbers (NO trailing zeroes)
export const formatNumberDisplay = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '0';
    const num = Number(value);
    if (!Number.isFinite(num)) return '0';
    const str = num.toFixed(3);
    return str.replace(/\.?0+$/, '');
};

export const formatDate = (dateString: string) => {
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

export const formatNumber = (value: any) => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toFixed(0);
};

export const printBoxHistory = (
    filteredData: any[],
    fromDate: Date[],
    toDate: Date[],
    getpdfheaderdata: any,
) => {
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

    const rows = filteredData
        .map((item: any, index: number) => {
            const { date, time } = formatDate(item?.createdAt);
            const { date: proceedDate, time: proceedTime } = formatDate(
                item?.updatedAt,
            );
            const isMelting = hasMeltingStatus(item);

            return `
        <tr style="${isMelting ? 'opacity:0.6;background-color:#fafafa;' : ''}">
            <td style="border:1px solid #861818ff;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${index + 1}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
                ${date} ${time}
            </td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${getSizeName(item?.size)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.purity)}%</td>
            ${isMelting
                    ? `<td colspan="3" style="border:1px solid #000;padding:1px 2px;text-align:center;font-weight:bold;font-size:11px;color:#785600;background-color:#fffbeb;">Melting</td>`
                    : `
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.tarWeight)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.chainWeight)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.scrap)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(
                        item?.loss ?? (item?.tarWeight || 0) - (item?.chainWeight || 0),
                    )}</td>
                `}
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

    // Set the content with PDF Header - Minimal padding
    printContainer.innerHTML = `
  <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
    <!-- Header Section -->
    <div>
      <!-- PDF Header -->
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

    <!-- Title and Date Range in one line -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
      <div style="flex:1;"></div>
      <h2 style="margin:0;font-size:16px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
        Box History Report
      </h2>
      ${fromDate.length > 0 && toDate.length > 0
            ? `
        <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
          From: ${new Date(fromDate[0]).toLocaleDateString('en-IN')} &nbsp; To: ${new Date(toDate[0]).toLocaleDateString('en-IN')}
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
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Sr</th>
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Date & Time</th>
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Size</th>
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Purity %</th>
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Tar</th>
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Chain Wt</th>
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Scrap</th>
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Loss</th>
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
    #print-container tfoot tr {
      background: #f0f0f0 !important;
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

export const getHistoryBoxColumns = (): Column<any>[] => [
    {
        key: 'createdAt',
        header: 'Date & Time',
        render: (item) => {
            const { date, time } = formatDate(item?.createdAt);
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
        key: 'size',
        header: 'Size',
        render: (item) => (
            <span className="text-sm text-[#1a1c1b] dark:text-white">
                {item?.size?.size}
            </span>
        ),
    },
    {
        key: 'purity',
        header: 'Purity %',
        render: (item) => (
            <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                {formatNumber(item.purity)}%
            </span>
        ),
    },
    {
        key: 'tarWeight',
        header: 'Tar (तार)',
        colSpan: (item) => (hasMeltingStatus(item) ? 3 : 1),
        render: (item) => {
            if (hasMeltingStatus(item)) {
                return (
                    <div className="flex items-center justify-center py-0.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            Melting
                        </span>
                    </div>
                );
            }
            return (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumberDisplay(item?.tarWeight)} G
                </span>
            );
        },
    },
    {
        key: 'chainWeight',
        header: 'Chain Weight (G)',
        colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
        render: (item) => {
            if (hasMeltingStatus(item)) {
                return null;
            }
            return (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumberDisplay(item?.chainWeight)} G
                </span>
            );
        },
    },
    {
        key: 'scrap',
        header: 'Scrap (स्क्रॅप)',
        colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
        render: (item) => {
            if (hasMeltingStatus(item)) {
                return null;
            }
            return (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumberDisplay(item?.scrap)} G
                </span>
            );
        },
    },
    {
        key: 'loss',
        header: 'Loss',
        colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
        render: (item) => {
            if (hasMeltingStatus(item)) {
                return null;
            }
            return (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumberDisplay(item?.loss)} G
                </span>
            );
        },
    },
    {
        key: 'timeTaken',
        header: 'Aging',
        render: (item) => (
            <span className="font-medium text-sm text-[#1a1c1b] dark:text-white">
                {item?.timeTaken || '-'}
            </span>
        ),
    },

    {
        key: 'updatedAt',
        header: 'Proceed Date & Time',
        render: (item) => {
            const { date, time } = formatDate(item?.updatedAt);
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
];

export const getBoxColumns = (
    getScaleProps: (index: number, field: any) => any,
    handleInlineChange: (index: number, field: any, value: string) => void,
    handleSaveClick: (index: number) => void,
    handleMelting: (item: BoxEntry) => void,
    hasEditableValues: (entry: BoxEntry) => boolean,
    isLoading: boolean,
    isSubmitting: boolean,
    meltingLoadingIds: Set<string>
): Column<BoxEntry>[] => [
        {
            key: 'dateTime',
            header: 'Date & Time',
            render: (item) => {
                const parts = item.dateTime ? item.dateTime.split(', ') : ['', ''];
                return (
                    <div className="flex flex-col items-center">
                        <span className="text-sm text-[#1a1c1b] dark:text-white">
                            {parts[0] || ''}
                        </span>
                        <span className="text-sm text-[#1a1c1b] dark:text-white">
                            {parts.slice(1).join(', ') || ''}
                        </span>
                    </div>
                );
            },
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
            key: 'tarWeight',
            header: 'Tar(तार)',
            render: (item) => (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumberDisplay(item.tarWeight)} G
                </span>
            ),
        },
        {
            key: 'chainWeight',
            header: 'Chain Weight(G)',
            render: (item, index) => {
                if (item.isEditing) {
                    return (
                        <div className="relative inline-block">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={
                                    item.chainWeightRaw !== undefined
                                        ? item.chainWeightRaw
                                        : item.chainWeight === 0
                                            ? ''
                                            : item.chainWeight
                                }
                                {...getScaleProps(index, 'chainWeight')}
                                onChange={(e) =>
                                    handleInlineChange(index, 'chainWeight', e.target.value)
                                }
                                placeholder="0.000"
                                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                            />
                            <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                                G
                            </span>
                        </div>
                    );
                }

                return (
                    <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                        {formatNumberDisplay(item.chainWeight)} G
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
                        <div className="relative inline-block">
                            <input
                                type="text"
                                inputMode="decimal"
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
            key: 'loss',
            header: 'Loss',
            render: (item) => (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumberDisplay(item.loss)} G
                </span>
            ),
        },

        {
            key: 'actions',
            header: 'Action',
            render: (item: BoxEntry, index: number) => {
                const isMeltingLoading = meltingLoadingIds.has(item.id);

                return (
                    <div className="flex items-center justify-center gap-1.5">
                        {/* Soldering Button - Only show if entry is not saved and has editable values */}
                        {!item.isSaved && hasEditableValues(item) && (
                            <button
                                type="button"
                                onClick={() => handleSaveClick(index)}
                                disabled={isLoading || isSubmitting || isMeltingLoading}
                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-2 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                title="Move to Soldering"
                            >
                                <Save className="h-3 w-3" />
                                <span>Soldering</span>
                            </button>
                        )}

                        {/* Melting Button - Always visible for all entries */}
                        <button
                            type="button"
                            onClick={() => handleMelting(item)}
                            disabled={isLoading || isSubmitting || isMeltingLoading}
                            className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${isMeltingLoading
                                ? 'bg-gray-300 text-gray-600 cursor-wait dark:bg-gray-600 dark:text-gray-300'
                                : 'bg-amber-200 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60'
                                }`}
                            title="Send to Melting"
                        >
                            {isMeltingLoading ? (
                                <>
                                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    <span>Melting</span>
                                </>
                            )}
                        </button>
                    </div>
                );
            },
        }
    ];
