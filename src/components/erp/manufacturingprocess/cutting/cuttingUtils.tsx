import React from 'react';
import toast from 'react-hot-toast';
import { Column } from '@/components/Forms/Table/GenericTable';
import { Flame, Save } from 'lucide-react';

export interface CuttingEntry {
    id: string;
    srNo: number;
    dateTime: string;
    item: string;
    size: string;
    purity: number;
    chainWeight: number;
    chainGiven: number;
    chainReceived: number;
    scrap: number;
    loss: number;
    isEditing?: boolean;
    isSaved?: boolean;
    chainGivenRaw?: string;
    chainReceivedRaw?: string;
    scrapRaw?: string;
    purityRaw?: string;
    itemId?: string;
    sizeId?: string;
    isCompleted?: boolean;
    isDirty?: boolean;
    status?: string;
    process?: string;
    isMelting?: boolean;
    meltingStatus?: boolean;
}

export const getItemName = (item: any): string => {
    if (!item) return '-';
    if (typeof item === 'string') return item;
    if (item.name) return item.name;
    return '-';
};

export const getSizeName = (size: any): string => {
    if (!size) return '-';
    if (typeof size === 'string') return size;
    if (size.size) return size.size;
    return '-';
};

export const calculateLoss = (
    chainGiven: number,
    chainReceived: number,
    scrap: number = 0,
): number => {
    return Math.max(0, Math.round((chainGiven - chainReceived - scrap) * 1000) / 1000);
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

export const toNumber = (value: unknown): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

// Indian format, maximum 3 decimals and NO trailing zeros.
export const formatNumberDisplay = (value: unknown): string => {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
        useGrouping: true,
    }).format(toNumber(value));
};

export const formatNoTrailingZeros3Dec = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '0';
    const num = Number(value);
    if (!Number.isFinite(num)) return '0';
    const str = num.toString();
    const parts = str.split('.');
    if (parts.length === 1) return parts[0];
    const dec = parts[1].slice(0, 3).replace(/0+$/, '');
    return dec ? `${parts[0]}.${dec}` : parts[0];
};

export const hasMeltingStatus = (item: any): boolean => {
    const s = String(item?.status || item?.process || '').toUpperCase();
    return (
        s === 'MELTING' ||
        item?.isMelting === true ||
        item?.meltingStatus === true
    );
};

export const getHistoryCuttingColumns = (): Column<any>[] => [
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
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {time}
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
        key: 'purity',
        header: 'Purity (%)',
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
                {formatNumberDisplay(item.chainWeight ?? item.chainGiven)} G
            </span>
        ),
    },
    {
        key: 'chainReceived',
        header: 'Chain Received (G)',
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
                    {formatNumberDisplay(item.chainReceived)} G
                </span>
            );
        },
    },
    {
        key: 'scrap',
        header: 'Scrap (G)',
        colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
        render: (item) => {
            if (hasMeltingStatus(item)) {
                return null;
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
        header: 'Loss (G)',
        colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
        render: (item) => {
            if (hasMeltingStatus(item)) {
                return null;
            }
            return (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumberDisplay(item.loss)} G
                </span>
            );
        },
    },
    {
        key: 'timeTaken',
        header: 'Gold Aging',
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

export const getCuttingColumns = (
    getScalePropsParam: any,
    handleInlineChangeParam?: any,
    handleSaveClickParam?: any,
    handleMeltingParam?: any,
    isLoadingParam?: boolean,
    isSubmittingParam?: boolean,
    submitMoveKundaIsPendingParam?: boolean,
    meltingLoadingIdsParam?: Set<string>
): Column<CuttingEntry>[] => {
    let getScaleProps = getScalePropsParam;
    let handleInlineChange = handleInlineChangeParam;
    let handleSaveClick = handleSaveClickParam;
    let handleMelting = handleMeltingParam;
    let isLoading = isLoadingParam;
    let isSubmitting = isSubmittingParam;
    let submitMoveKundaIsPending = submitMoveKundaIsPendingParam;
    let meltingLoadingIds = meltingLoadingIdsParam;

    if (getScalePropsParam && typeof getScalePropsParam === 'object' && typeof getScalePropsParam !== 'function') {
        getScaleProps = getScalePropsParam.getScaleProps;
        handleInlineChange = getScalePropsParam.handleInlineChange;
        handleSaveClick = getScalePropsParam.handleSaveClick;
        handleMelting = getScalePropsParam.handleMelting;
        isLoading = getScalePropsParam.isLoading;
        isSubmitting = getScalePropsParam.isSubmitting;
        submitMoveKundaIsPending = getScalePropsParam.submitMoveKundaIsPending;
        meltingLoadingIds = getScalePropsParam.meltingLoadingIds;
    }

    if (typeof getScaleProps !== 'function') {
        getScaleProps = () => ({});
    }

    return [
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
                        <span className="text-sm text-[#1a1c1b] dark:text-white">
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
                        ? ((item?.item as any)?.name ?? '-')
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
                        ? ((item?.size as any)?.size ?? '-')
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
            key: 'scrap',
            header: 'Scrap (G)',
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
            key: 'loss',
            header: 'Loss (G)',
            render: (item) => (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumberDisplay(item.loss)} G
                </span>
            ),
        },

        {
            key: 'actions',
            header: 'Action',
            render: (item: CuttingEntry, index: number) => {
                const isMeltingLoading = meltingLoadingIds.has(item.id);

                return (
                    <div className="flex items-center justify-center gap-1.5">
                        {/* S / Kunda Button - Only show if entry is not saved */}
                        {!item.isSaved && (
                            <button
                                type="button"
                                onClick={() => handleSaveClick(index, 'kunda')}
                                disabled={
                                    isLoading ||
                                    isSubmitting ||
                                    submitMoveKundaIsPending ||
                                    isMeltingLoading
                                }
                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#d97706] to-[#92400e] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                title="Move to S Kunda"
                            >
                                <Save className="h-3.5 w-3.5" />
                                <span>S / Kunda</span>
                            </button>
                        )}

                        {/* Stock Button - Only show if entry is not saved */}
                        {!item.isSaved && (
                            <button
                                type="button"
                                onClick={() => handleSaveClick(index, 'stock')}
                                disabled={
                                    isLoading ||
                                    isSubmitting ||
                                    submitMoveKundaIsPending ||
                                    isMeltingLoading
                                }
                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                title="Save to Stock"
                            >
                                <Save className="h-3.5 w-3.5" />
                                <span>Stock</span>
                            </button>
                        )}

                        {/* Melting Button - Always visible for all entries */}
                        <button
                            type="button"
                            onClick={() => handleMelting(item)}
                            disabled={
                                isLoading ||
                                isSubmitting ||
                                submitMoveKundaIsPending ||
                                isMeltingLoading
                            }
                            className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${isMeltingLoading
                                ? 'bg-gray-300 text-gray-600 cursor-wait dark:bg-gray-600 dark:text-gray-300'
                                : 'bg-amber-200 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60'
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
                                <>
                                    <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    <span>Melting</span>
                                </>
                            )}
                        </button>
                    </div>
                );
            },
        },
    ];
};

export const printCuttingHistory = (
    filteredData: any[],
    dateRange: Date[],
    getpdfheaderdata: any
) => {
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

    const rows = filteredData
        .map((item: any, index: number) => {
            const { date, time } = formatDate(item?.createdAt);
            const { date: proceedDate, time: proceedTime } = formatDate(
                item?.updatedAt,
            );
            const isMelting = hasMeltingStatus(item);

            return `
      <tr style="${isMelting ? 'opacity:0.6;background-color:#fafafa;' : ''}">
        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${index + 1}</td>
        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
          ${date} ${time}
        </td>
        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${getItemName(item?.item)}</td>
        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${getSizeName(item?.size)}</td>
        ${isMelting
                    ? `<td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.purity)}%</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.chainWeight ?? item?.chainGiven)}</td>
            <td colspan="3" style="border:1px solid #000;padding:1px 2px;text-align:center;font-weight:bold;font-size:11px;color:#785600;background-color:#fffbeb;">Melting</td>`
                    : `
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.purity)}%</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.chainWeight ?? item?.chainGiven)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.chainReceived)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.scrap)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.loss)}</td>
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
            <!-- Title -->
            <!-- Title and Date Range in one line -->
<div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
  <div style="flex:1;"></div>
  <h2 style="margin:0;font-size:16px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
    Cutting History Report
  </h2>
  ${dateRange.length === 2
            ? `
    <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
      From: ${new Date(dateRange[0]).toLocaleDateString('en-IN')} &nbsp; To: ${new Date(dateRange[1]).toLocaleDateString('en-IN')}
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
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Item</th>
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Size</th>
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Purity %</th>
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Chain Given</th>
    <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Chain Rec</th>
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
