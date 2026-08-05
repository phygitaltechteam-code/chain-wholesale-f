// components/Common/GenericTable.tsx
import React, { useState } from 'react';
import { Edit, Trash2, Save, X, Search } from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

export interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T, index: number) => React.ReactNode;
    editable?: boolean;
    inputType?: 'text' | 'number' | 'select';
    options?: { value: string; label: string }[];
    className?: string;
    align?: 'left' | 'right' | 'center';
    width?: string;
}

export interface GenericTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onSave: (item: T, index: number) => void;
    onEdit?: (item: T, index: number) => void;
    onDelete?: (item: T, index: number) => void;
    onAdd?: () => void;
    searchPlaceholder?: string;
    searchFields?: (keyof T)[];
    title?: string;
    addButtonLabel?: string;
    emptyMessage?: string;
    isLoading?: boolean;
    renderActions?: (item: T, index: number) => React.ReactNode;
    customActions?: (item: T, index: number) => React.ReactNode;
    showEdit?: boolean;
    showDelete?: boolean;
    enableInlineEdit?: boolean;
    showSrNo?: boolean; // New prop to show/hide SR No column
    srNoLabel?: string; // Custom label for SR No column
}

export function GenericTable<T extends { id: string | number }>({
    data,
    columns,
    onSave,
    onEdit,
    onDelete,
    onAdd,
    searchPlaceholder = 'Search...',
    searchFields = [],
    title,
    addButtonLabel = 'Add New',
    emptyMessage = 'No entries found',
    isLoading = false,
    renderActions,
    customActions,
    showEdit = false,
    showDelete = false,
    enableInlineEdit = false,
    showSrNo = false,
    srNoLabel = 'Sr No.',
}: GenericTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editData, setEditData] = useState<Partial<T>>({});

    const handleEdit = (item: T, index: number) => {
        if (enableInlineEdit) {
            setEditingIndex(index);
            setEditData({ ...item });
        }
        if (onEdit) onEdit(item, index);
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditData({});
    };

    const handleSave = (item: T, index: number) => {
        const updatedItem = { ...item, ...editData };
        onSave(updatedItem, index);
        setEditingIndex(null);
        setEditData({});
    };

    const handleFieldChange = (key: string, value: any) => {
        setEditData(prev => ({ ...prev, [key]: value }));
    };

    const filteredData = searchFields.length > 0 && searchTerm
        ? data.filter(item =>
            searchFields.some(field => {
                const value = item[field];
                return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
            })
        )
        : data;

    const getValue = (item: T, key: string | keyof T) => {
        if (typeof key === 'string' && key.includes('.')) {
            const parts = key.split('.');
            let value: any = item;
            for (const part of parts) {
                value = value?.[part];
                if (value === undefined) break;
            }
            return value;
        }
        return item[key as keyof T];
    };

    const getCellValue = (item: T, column: Column<T>, index: number) => {
        if (column.render) {
            return column.render(item, index);
        }
        return getValue(item, column.key);
    };

    const isEditing = (index: number) => editingIndex === index && enableInlineEdit;

    const showActionsColumn = renderActions || customActions || showEdit || showDelete || (enableInlineEdit && (onEdit || onDelete));

    // Get all columns including SR No if enabled
    const allColumns = showSrNo
        ? [
            {
                key: '__srNo' as keyof T,
                header: srNoLabel,
                align: 'left' as const,
                width: '60px',
                render: (_: T, index: number) => (
                    <span className="text-xs sm:text-sm text-[#4f4535] dark:text-slate-400">
                        {index + 1}
                    </span>
                ),
            },
            ...columns
        ]
        : columns;

    return (
        <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
            <div className="px-4 py-4 md:px-8 md:py-6">
                {/* Header with Title, Search and Add Button */}
                {(title || onAdd || searchFields.length > 0) && (
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Left side - Title */}
                        {title && (
                            <h2 className="text-xl font-bold text-[#1a1c1b] dark:text-white">
                                {title}
                            </h2>
                        )}

                        {/* Right side - Search and Add Button */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            {/* Search */}
                            {searchFields.length > 0 && (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                                    <input
                                        type="text"
                                        placeholder={searchPlaceholder}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700 sm:w-64"
                                    />
                                </div>
                            )}

                            {/* Add Button */}
                            {onAdd && (
                                <GenericButton
                                    type="button"
                                    onClick={onAdd}
                                    className="flex items-center gap-2 !px-4 !py-2 !bg-amber-600 hover:!bg-amber-700 !text-white"
                                >
                                    <span className="text-lg leading-none">+</span>
                                    {addButtonLabel}
                                </GenericButton>
                            )}
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-[#d3c4af]/10 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[#f4f4f2] text-xs uppercase tracking-[0.15em] text-[#4f4535] dark:bg-slate-800 dark:text-slate-400">
                                    {allColumns.map((column, idx) => (
                                        <th
                                            key={idx}
                                            className={`px-3 py-3 text-${column.align || 'left'} font-semibold lg:px-4 ${column.className || ''}`}
                                            style={{ width: column.width }}
                                        >
                                            {column.header}
                                        </th>
                                    ))}
                                    {showActionsColumn && (
                                        <th className="px-3 py-3 text-center font-semibold lg:px-4">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={allColumns.length + (showActionsColumn ? 1 : 0)} className="py-12 text-center text-[#4f4535] dark:text-slate-400">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={allColumns.length + (showActionsColumn ? 1 : 0)} className="py-12 text-center text-[#4f4535] dark:text-slate-400">
                                            {emptyMessage}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => {
                                        const isItemEditing = isEditing(index);
                                        const originalIndex = data.indexOf(item); // Get original index for SR No

                                        return (
                                            <tr key={item.id} className="group transition-colors hover:bg-[#f4f4f2]/50 dark:hover:bg-slate-800/50">
                                                {allColumns.map((column, colIdx) => {
                                                    const value = getCellValue(item, column, index);
                                                    const isEditable = column.editable && isItemEditing;

                                                    return (
                                                        <td
                                                            key={colIdx}
                                                            className={`px-3 py-3 text-sm lg:px-4 ${column.className || ''}`}
                                                            style={{ textAlign: column.align || 'left' }}
                                                        >
                                                            {isEditable ? (
                                                                column.inputType === 'select' && column.options ? (
                                                                    <select
                                                                        value={editData[column.key as keyof T] as string || value as string || ''}
                                                                        onChange={(e) => handleFieldChange(column.key as string, e.target.value)}
                                                                        className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                                                                    >
                                                                        <option value="">Select</option>
                                                                        {column.options.map(opt => (
                                                                            <option key={opt.value} value={opt.value}>
                                                                                {opt.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <input
                                                                        type={column.inputType || 'text'}
                                                                        value={editData[column.key as keyof T] as string || value as string || ''}
                                                                        onChange={(e) => handleFieldChange(column.key as string, e.target.value)}
                                                                        className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                                                                        placeholder={`Enter ${column.header.toLowerCase()}`}
                                                                    />
                                                                )
                                                            ) : (
                                                                value
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                {/* Actions */}
                                                {showActionsColumn && (
                                                    <td className="px-3 py-3 text-center lg:px-4">
                                                        {isItemEditing ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleSave(item, index)}
                                                                    className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
                                                                    title="Save"
                                                                >
                                                                    <Save className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="rounded-lg bg-gray-400 p-1.5 text-white hover:bg-gray-500"
                                                                    title="Cancel"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-2">
                                                                {renderActions ? (
                                                                    renderActions(item, index)
                                                                ) : (
                                                                    <>
                                                                        {showEdit && onEdit && (
                                                                            <button
                                                                                onClick={() => handleEdit(item, index)}
                                                                                className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                                                title="Edit"
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </button>
                                                                        )}
                                                                        {showDelete && onDelete && (
                                                                            <button
                                                                                onClick={() => onDelete(item, index)}
                                                                                className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </button>
                                                                        )}
                                                                        {customActions && customActions(item, index)}
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                {data.length > 0 && (
                    <div className="mt-3 text-xs text-[#4f4535] dark:text-slate-400">
                        Showing {filteredData.length} of {data.length} entries
                    </div>
                )}
            </div>
        </div>
    );
}