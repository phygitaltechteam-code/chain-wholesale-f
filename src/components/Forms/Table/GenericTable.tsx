// components/Common/GenericTable.tsx
import React, {useState, useEffect} from 'react';
import {Edit, Trash2, Save, X, Search} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

export interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode | string;
  render?: (item: T, index: number) => React.ReactNode;
  editable?: boolean;
  inputType?: 'text' | 'number' | 'select';
  options?: {value: string; label: string}[];
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
  showSrNo?: boolean;
  srNoLabel?: string;
  rowClassName?: (item: T, index: number) => string;
  rowTextColor?: (item: T, index: number) => string;
  onRowClick?: (item: T, index: number) => void;
  hoverColor?: string;
  evenRowColor?: string;
  oddRowColor?: string;
  selectedRowColor?: string;
}

export function GenericTable<T extends {id: string | number}>({
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
  rowClassName,
  rowTextColor,
  onRowClick,
  hoverColor = 'hover:bg-[#f4f4f2]/50 dark:hover:bg-slate-800/50',
  evenRowColor = 'bg-white dark:bg-slate-900',
  oddRowColor = 'bg-[#f8f6f4] dark:bg-slate-800/60',
  selectedRowColor = 'bg-[#785600]/5 dark:bg-amber-900/10',
}: GenericTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<T>>({});
  const [tableData, setTableData] = useState<T[]>(data);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  // Update tableData when data prop changes
  useEffect(() => {
    setTableData(data);
  }, [data]);

  const handleEdit = (item: T, index: number) => {
    if (enableInlineEdit) {
      setEditingIndex(index);
      setEditData({...item});
    }
    if (onEdit) onEdit(item, index);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditData({});
  };

  const handleSave = (item: T, index: number) => {
    const updatedItem = {...item, ...editData};
    onSave(updatedItem, index);
    setEditingIndex(null);
    setEditData({});
  };

  const handleFieldChange = (key: string, value: any) => {
    setEditData((prev) => ({...prev, [key]: value}));
  };

  const handleRowClick = (item: T, index: number) => {
    setSelectedRowIndex(index);
    if (onRowClick) {
      onRowClick(item, index);
    }
  };

  const filteredData =
    searchFields.length > 0 && searchTerm
      ? tableData.filter((item) =>
          searchFields.some((field) => {
            const value = item[field];
            return (
              value &&
              String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
          }),
        )
      : tableData;

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

  const isEditing = (index: number) =>
    editingIndex === index && enableInlineEdit;

  const showActionsColumn =
    renderActions ||
    customActions ||
    showEdit ||
    showDelete ||
    (enableInlineEdit && (onEdit || onDelete));

  // Get all columns including SR No if enabled
  const allColumns = showSrNo
    ? [
        {
          key: '__srNo' as keyof T,
          header: srNoLabel,
          align: 'center' as const,
          width: '60px',
          className: 'text-center font-semibold text-white dark:text-[#986d00]',
          render: (_: T, index: number) => (
            <span className="text-xs font-semibold text-[#1a1c1b] dark:text-[#986d00] sm:text-sm">
              {index + 1}
            </span>
          ),
        },
        ...columns,
      ]
    : columns;

  const getColumnAlign = (column: Column<T>) => {
    return column.align || 'center';
  };

  const getRowColor = (item: T, index: number) => {
    if (rowClassName) {
      return rowClassName(item, index);
    }

    if (selectedRowIndex === index) {
      return selectedRowColor;
    }

    return index % 2 === 0 ? evenRowColor : oddRowColor;
  };

  const getRowTextColorClass = (item: T, index: number) => {
    if (rowTextColor) {
      return rowTextColor(item, index);
    }
    return 'text-[#1a1c1b] dark:text-white';
  };

  if (isLoading) {
    return (
      <div className="bg-[#f9f9f7] dark:bg-slate-950">
        <div className="overflow-hidden border border-[#d3c4af]/10 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="p-8 text-center text-[#4f4535] dark:text-slate-400">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div>
        {/* Header with Title, Search and Add Button */}
        {(title || onAdd || searchFields.length > 0) && (
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {title && (
              <h2 className="text-xl font-bold text-[#1a1c1b] dark:text-white">
                {title}
              </h2>
            )}

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              {searchFields.length > 0 && (
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:w-64"
                  />
                </div>
              )}

              {onAdd && (
                <GenericButton
                  type="button"
                  onClick={onAdd}
                  className="flex items-center gap-2 whitespace-nowrap !bg-amber-600 !px-4 !py-2 !text-white hover:!bg-amber-700"
                >
                  <span className="text-lg leading-none">+</span>
                  {addButtonLabel}
                </GenericButton>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="border border-[#d3c4af]/10 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-xs uppercase tracking-[0.15em] text-white">
                  {allColumns.map((column, idx) => (
                    <th
                      key={idx}
                      className={`px-3 py-3 text-center font-semibold lg:px-4 ${column.className || ''}`}
                      style={{width: column.width}}
                    >
                      {column.header}
                    </th>
                  ))}
                  {showActionsColumn && (
                    <th className="px-3 py-3 text-center font-semibold text-white lg:px-4">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={allColumns.length + (showActionsColumn ? 1 : 0)}
                      className="py-12 text-center text-[#4f4535] dark:text-slate-400"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => {
                    const isItemEditing = isEditing(index);
                    const rowColor = getRowColor(item, index);
                    const textColor = getRowTextColorClass(item, index);
                    const isClickable = !!onRowClick;

                    return (
                      <tr
                        key={item.id || index}
                        className={`group transition-colors duration-150 ${rowColor} ${hoverColor} ${isClickable ? 'cursor-pointer' : ''} ${isItemEditing ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                        onClick={() => handleRowClick(item, index)}
                      >
                        {allColumns.map((column, colIdx) => {
                          const value = getCellValue(item, column, index);
                          const isEditable = column.editable && isItemEditing;
                          const align = getColumnAlign(column);

                          return (
                            <td
                              key={colIdx}
                              className={`px-3 py-3 text-sm lg:px-4 ${textColor} ${column.className || ''}`}
                              style={{textAlign: align}}
                            >
                              {isEditable ? (
                                column.inputType === 'select' &&
                                column.options ? (
                                  <select
                                    value={
                                      (editData[
                                        column.key as keyof T
                                      ] as string) ||
                                      (value as string) ||
                                      ''
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(
                                        column.key as string,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                                  >
                                    <option value="">Select</option>
                                    {column.options.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={column.inputType || 'text'}
                                    value={
                                      (editData[
                                        column.key as keyof T
                                      ] as string) ||
                                      (value as string) ||
                                      ''
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(
                                        column.key as string,
                                        e.target.value,
                                      )
                                    }
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
                                  className="rounded-lg bg-emerald-600 p-1.5 text-white transition-colors hover:bg-emerald-700"
                                  title="Save"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEdit(item, index);
                                        }}
                                        className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
                                        title="Edit"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                    )}
                                    {showDelete && onDelete && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDelete(item, index);
                                        }}
                                        className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                    {customActions &&
                                      customActions(item, index)}
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
        {tableData.length > 0 && (
          <div className="mt-3 text-xs text-[#4f4535] dark:text-slate-400">
            Showing {filteredData.length} of {tableData.length} entries
          </div>
        )}
      </div>
    </div>
  );
}
