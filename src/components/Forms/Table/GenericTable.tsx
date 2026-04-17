import React, {useState} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';

export type Button<T> = {
  label: string;
  onClick: (item: T) => void;
  className?: string;
  icon?: React.ReactNode;
};

export type Column<T> = {
  /** Column header text */
  header: string;

  /** Data accessor - can be a key of T or a function */
  accessor: keyof T | ((item: T) => React.ReactNode);

  /** Custom render function for the cell */
  render?: (item: T) => React.ReactNode;

  /** Additional CSS classes for the column */
  className?: string;

  /** Action buttons for the column */
  buttons?: Button<T>[];

  /** Enable sorting on this column */
  sortable?: boolean;

  /** Text alignment */
  align?: 'left' | 'right' | 'center';

  /** Click handler for the cell */
  onCellClick?: (item: T) => void;
};

export type GenericTableProps<T> = {
  /** Array of data to display */
  data: T[];

  /** Column definitions */
  columns: Column<T>[];

  /** Number of items per page */
  itemsPerPage?: number;

  /** Enable search functionality */
  searchable?: boolean;

  /** Search input placeholder text */
  searchPlaceholder?: string;

  /** Table title */
  title?: string;

  /** Show action buttons column */
  action?: boolean;

  /** Edit button handler */
  onEdit?: (item: T) => void;

  /** Delete button handler */
  onDelete?: (item: T) => void;

  /** View button handler */
  onView?: (item: T) => void;

  /** Disable pagination */
  paginationOff?: boolean;

  /** Show back button */
  showBackButton?: boolean;

  /** Back button handler */
  onBack?: () => void;

  /** Show filters button (mobile) */
  showFilters?: boolean;

  /** Filter button handler */
  onFilter?: () => void;

  /** Additional CSS classes for the table container */
  className?: string;

  /** Loading state */
  loading?: boolean;

  /** Empty state message */
  emptyMessage?: string;

  /** Enable row click */
  onRowClick?: (item: T) => void;

  /** Custom loading component */
  loadingComponent?: React.ReactNode;

  /** Custom empty state component */
  emptyComponent?: React.ReactNode;
};

export const GenericTable = <T,>({
  data,
  columns,
  itemsPerPage = 8,
  searchable = true,
  searchPlaceholder = 'Search...',
  title,
  action = false,
  onEdit: handleEdit,
  onDelete: handleDelete,
  onView,
  paginationOff = false,
  showBackButton = false,
  onBack,
  showFilters = false,
  onFilter,
  className = '',
  loading = false,
  emptyMessage = 'No data found',
  onRowClick,
  loadingComponent,
  emptyComponent,
}: GenericTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const sortedData = React.useMemo(() => {
    const sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({key, direction});
  };

  const filteredData = sortedData.filter((item) =>
    columns.some((column) => {
      const value =
        typeof column.accessor === 'function'
          ? column.accessor(item)
          : item[column.accessor];
      return value
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    }),
  );

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;

  const paginatedData = paginationOff
    ? filteredData
    : filteredData.slice(startIdx, endIdx);

  const getAlignClass = (align?: 'left' | 'right' | 'center') => {
    switch (align) {
      case 'right':
        return 'text-right';
      case 'center':
        return 'text-center';
      default:
        return 'text-left';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-[#d3c4af]/10 bg-white p-8 shadow-sm">
        {loadingComponent || (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#785600] border-t-transparent"></div>
              <p className="mt-2 text-sm text-[#4f4535]">Loading...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[#d3c4af]/10 bg-white shadow-sm ${className}`}
    >
      {/* Header with Title and Search */}
      {(title || searchable || showFilters) && (
        <div className="border-b border-[#f4f4f2] p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            {title && (
              <div className="flex items-center gap-3">
                {showBackButton && onBack && (
                  <button
                    onClick={onBack}
                    className="rounded-lg p-2 transition-colors hover:bg-[#f4f4f2]"
                  >
                    <ChevronLeft className="h-5 w-5 text-[#4f4535]" />
                  </button>
                )}
                <div>
                  <h2 className="font-headline text-xl font-bold text-[#1a1c1b] sm:text-2xl">
                    {title}
                  </h2>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 sm:w-64"
                  />
                </div>
              )}

              {showFilters && onFilter && (
                <button
                  onClick={() => {
                    setShowMobileFilters(!showMobileFilters);
                    onFilter();
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-[#d3c4af]/30 bg-white px-4 py-2 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] lg:hidden"
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-sm">Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredData.length === 0 ? (
        <div className="p-8">
          {emptyComponent || (
            <div className="py-12 text-center">
              <p className="text-[#4f4535]">{emptyMessage}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f2] text-xs uppercase tracking-[0.15em] text-[#4f4535]">
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className={`px-4 py-4 lg:px-6 ${getAlignClass(column.align)} font-semibold ${column.className || ''}`}
                      onClick={
                        column.sortable && typeof column.accessor === 'string'
                          ? () => handleSort(column.accessor as keyof T)
                          : undefined
                      }
                      style={{cursor: column.sortable ? 'pointer' : 'default'}}
                    >
                      <div className="flex items-center gap-1">
                        {column.header}
                        {column.sortable &&
                          sortConfig?.key === column.accessor &&
                          (sortConfig.direction === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          ))}
                      </div>
                    </th>
                  ))}
                  {(action || handleEdit || handleDelete || onView) && (
                    <th
                      className={`px-4 py-4 lg:px-6 ${getAlignClass('center')} font-semibold`}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f2]">
                {paginatedData.map((item, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`group transition-colors hover:bg-[#f4f4f2]/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column, colIndex) => {
                      const value =
                        typeof column.accessor === 'function'
                          ? column.accessor(item)
                          : item[column.accessor];

                      return (
                        <td
                          key={colIndex}
                          className={`px-4 py-4 text-sm lg:px-6 ${getAlignClass(column.align)} ${column.className || ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            column.onCellClick?.(item);
                          }}
                          style={{
                            cursor: column.onCellClick ? 'pointer' : 'default',
                          }}
                        >
                          {column.render
                            ? column.render(item)
                            : value?.toString() || '-'}
                          {column.buttons && (
                            <div className="mt-2 flex gap-2">
                              {column.buttons.map((button, btnIndex) => (
                                <button
                                  key={btnIndex}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    button.onClick(item);
                                  }}
                                  className={`rounded px-2 py-1 text-xs ${button.className || ''}`}
                                >
                                  {button.icon || button.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {(action || handleEdit || handleDelete || onView) && (
                      <td className="px-4 py-4 text-center lg:px-6">
                        <div className="flex items-center justify-center gap-2">
                          {onView && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onView(item);
                              }}
                              className="p-1.5 text-[#817563] transition-colors hover:text-[#785600]"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          {handleEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(item);
                              }}
                              className="p-1.5 text-[#817563] transition-colors hover:text-[#785600]"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {handleDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item);
                              }}
                              className="p-1.5 text-[#817563] transition-colors hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="divide-y divide-[#f4f4f2] md:hidden">
            {paginatedData.map((item, rowIndex) => (
              <div
                key={rowIndex}
                className={`p-4 transition-colors hover:bg-[#f4f4f2]/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column, colIndex) => {
                  const value =
                    typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : item[column.accessor];

                  if (!value && value !== 0) return null;

                  return (
                    <div key={colIndex} className="mb-3 last:mb-0">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#4f4535]">
                          {column.header}
                        </span>
                        <div
                          className={`text-sm font-medium text-[#1a1c1b] ${getAlignClass(column.align)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            column.onCellClick?.(item);
                          }}
                        >
                          {column.render
                            ? column.render(item)
                            : value?.toString() || '-'}
                        </div>
                      </div>
                      {column.buttons && (
                        <div className="mt-2 flex justify-end gap-2">
                          {column.buttons.map((button, btnIndex) => (
                            <button
                              key={btnIndex}
                              onClick={(e) => {
                                e.stopPropagation();
                                button.onClick(item);
                              }}
                              className={`rounded px-2 py-1 text-xs ${button.className || ''}`}
                            >
                              {button.icon || button.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {(action || handleEdit || handleDelete || onView) && (
                  <div className="mt-4 flex justify-end gap-3 border-t border-[#f4f4f2] pt-3">
                    {onView && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(item);
                        }}
                        className="p-2 text-[#817563] transition-colors hover:text-[#785600]"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {handleEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        className="p-2 text-[#817563] transition-colors hover:text-[#785600]"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {handleDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                        className="p-2 text-[#817563] transition-colors hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {!paginationOff && totalItems > itemsPerPage && (
            <div className="flex flex-col justify-between gap-4 border-t border-[#f4f4f2] bg-[#f4f4f2]/30 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
              <span className="text-center text-xs text-[#4f4535] sm:text-left">
                Showing {startIdx + 1} to {Math.min(endIdx, totalItems)} of{' '}
                {totalItems} entries
              </span>
              <div className="flex justify-center gap-2 sm:justify-end">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d3c4af]/30 transition-colors hover:bg-[#eeeeec] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="hidden gap-2 sm:flex">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-all ${
                          currentPage === pageNumber
                            ? 'border-[#785600] bg-[#785600] text-white shadow-md'
                            : 'border-[#d3c4af]/30 hover:bg-[#eeeeec]'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <span className="px-2 text-[#4f4535]">...</span>
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d3c4af]/30 transition-colors hover:bg-[#eeeeec] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GenericTable;

// import React, {useState} from 'react';
// import {FiEdit} from 'react-icons/fi';
// import {GrFormNext, GrFormPrevious} from 'react-icons/gr';
// import {MdDelete} from 'react-icons/md';
// import {FiEye} from 'react-icons/fi';
// import {FaArrowLeft} from 'react-icons/fa';

// type Button<T> = {
//   label: string;
//   onClick: (item: T) => void;
//   className?: string;
//   icon?: React.ReactNode;
// };

// export type Column<T> = {
//   header: string;
//   accessor: keyof T | ((item: T) => React.ReactNode);
//   render?: (item: T) => React.ReactNode;
//   className?: string;
//   buttons?: Button<T>[];
//   sortable?: boolean;
//   action?: boolean;
//   onEdit?: (item: T) => void;
//   onDelete?: (item: T) => void;
//   onCellClick?: (item: T) => void;
// };

// type GenericTableProps<T> = {
//   data: T[];
//   columns: Column<T>[];
//   itemsPerPage?: number;
//   searchAble?: boolean;
//   title?: string;
//   action?: boolean;
//   onEdit?: (item: T) => void;
//   onDelete?: (item: T) => void;
//   paginationOff?: boolean;
//   onView?: (item: T) => void;
//   showBackButton?: boolean;
//   onBack?: () => void;
// };

// export const GenericTable = <T,>({
//   data,
//   columns,
//   itemsPerPage = 5,
//   searchAble,
//   action,
//   title,
//   onEdit: handleEdit,
//   onDelete: handleDelete,
//   paginationOff = false,
//   onView,
//   showBackButton = false,
//   onBack,
// }: GenericTableProps<T>) => {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [sortConfig, setSortConfig] = useState<{
//     key: keyof T;
//     direction: 'asc' | 'desc';
//   } | null>(null);

//   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchQuery(e.target.value);
//     setCurrentPage(1);
//   };

//   const sortedData = React.useMemo(() => {
//     const sortableData = [...data];
//     if (sortConfig !== null) {
//       sortableData.sort((a, b) => {
//         const aValue =
//           typeof sortConfig.key === 'function'
//             ? (sortConfig.key as (a: T) => string | number | boolean)(a)
//             : a[sortConfig.key];
//         const bValue =
//           typeof sortConfig.key === 'function'
//             ? (sortConfig.key as (a: T) => string | number | boolean)(b)
//             : b[sortConfig.key];

//         if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
//         if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
//         return 0;
//       });
//     }
//     return sortableData;
//   }, [data, sortConfig]);

//   const handleSort = (key: keyof T) => {
//     let direction: 'asc' | 'desc' = 'asc';
//     if (
//       sortConfig &&
//       sortConfig.key === key &&
//       sortConfig.direction === 'asc'
//     ) {
//       direction = 'desc';
//     }
//     setSortConfig({key, direction});
//   };

//   const filteredData = sortedData.filter((item) =>
//     columns.some((column) => {
//       const value =
//         typeof column.accessor === 'function'
//           ? column.accessor(item)
//           : item[column.accessor];
//       return value
//         ?.toString()
//         .toLowerCase()
//         .includes(searchQuery.toLowerCase());
//     }),
//   );

//   const totalItems = filteredData.length;
//   const totalPages = Math.ceil(totalItems / itemsPerPage);
//   const startIdx = (currentPage - 1) * itemsPerPage;

//   const paginatedData = paginationOff
//     ? filteredData
//     : filteredData.slice(startIdx, startIdx + itemsPerPage);

//   return (
//     <div className="rounded-sm border border-stroke bg-white px-4 pb-2 pt-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-6">
//       {title && (
//         <div className="mb-3 flex items-center gap-2">
//           {showBackButton && onBack && (
//             <button
//               onClick={onBack}
//               className="hover:bg-gray-100 rounded p-1.5 dark:hover:bg-meta-4"
//             >
//               <FaArrowLeft className="h-5 w-5" />
//             </button>
//           )}

//           <h2 className="text-lg font-semibold">{title}</h2>
//         </div>
//       )}

//       {searchAble && (
//         <div className="mb-3 flex justify-between">
//           <input
//             type="text"
//             placeholder="Search..."
//             value={searchQuery}
//             onChange={handleSearch}
//             className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-1.5 text-sm outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
//           />
//         </div>
//       )}
//       <div className="max-w-full overflow-x-auto">
//         <table className="w-full table-auto">
//           <thead>
//             <tr className="bg-gray-2 text-left dark:bg-meta-4">
//               {columns.map((column, index) => (
//                 <th
//                   key={index}
//                   className={`min-w-[120px] px-3 py-2.5 font-medium text-black dark:text-white ${column.className || ''}`}
//                   onClick={
//                     column.sortable
//                       ? () => handleSort(column.accessor as keyof T)
//                       : undefined
//                   }
//                   style={{cursor: column.sortable ? 'pointer' : 'default'}}
//                 >
//                   <div className="text-sm">
//                     {column.header}{' '}
//                     {sortConfig?.key === column.accessor
//                       ? sortConfig.direction === 'asc'
//                         ? '↑'
//                         : '↓'
//                       : null}
//                   </div>
//                 </th>
//               ))}
//               {action && (
//                 <th className="min-w-[100px] px-3 py-2.5">
//                   <div className="text-sm">Action</div>
//                 </th>
//               )}
//             </tr>
//           </thead>
//           <tbody>
//             {paginatedData.map((item, rowIndex) => (
//               <tr key={rowIndex} className="text-sm">
//                 {columns.map((column, colIndex) => {
//                   const value =
//                     typeof column.accessor === 'function'
//                       ? column.accessor(item)
//                       : item[column.accessor];

//                   return (
//                     <td
//                       key={colIndex}
//                       className="border-b border-[#eee] px-3 py-2 dark:border-strokedark"
//                       onClick={() => column.onCellClick?.(item)} // 👈 Trigger click
//                       style={{
//                         cursor: column.onCellClick ? 'pointer' : 'default',
//                       }} // 👈 Show pointer
//                     >
//                       <div className="py-1.5">
//                         {column.render
//                           ? column.render(item)
//                           : typeof value === 'string'
//                             ? value
//                             : JSON.stringify(value)}
//                         {column.buttons && (
//                           <div className="mt-1.5 space-x-2">
//                             {column.buttons.map((button, btnIndex) => (
//                               <button
//                                 key={btnIndex}
//                                 onClick={() => button.onClick(item)}
//                                 className={`rounded px-2 py-1 text-xs ${button.className || ''}`}
//                               >
//                                 {button.icon || button.label}
//                               </button>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </td>
//                   );
//                 })}
//                 {action && (
//                   <td className="border-b border-[#eee] px-3 py-2 dark:border-strokedark">
//                     <div className="flex items-center space-x-2 py-1.5 sm:block sm:space-x-0 sm:space-y-2">
//                       {onView && (
//                         <button
//                           className="hover:bg-gray-100 rounded p-1.5 dark:hover:bg-meta-4"
//                           onClick={() => onView(item)}
//                         >
//                           <FiEye className="h-4 w-4" />
//                         </button>
//                       )}
//                       {handleEdit && (
//                         <button
//                           className="hover:bg-gray-100 rounded p-1.5 dark:hover:bg-meta-4"
//                           onClick={() => handleEdit(item)}
//                         >
//                           <FiEdit className="h-4 w-4" />
//                         </button>
//                       )}
//                       {handleDelete && (
//                         <button
//                           className="hover:bg-gray-100 rounded p-1.5 dark:hover:bg-meta-4"
//                           onClick={() => handleDelete(item)}
//                         >
//                           <MdDelete className="h-4 w-4" />
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                 )}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination Controls */}
//       {!paginationOff && (
//         <div className="mt-3 flex items-center justify-between">
//           <span className="text-sm">
//             Page {currentPage} of {totalPages}
//           </span>
//           <div className="space-x-2">
//             <button
//               className="hover:bg-gray-100 rounded p-1.5 dark:hover:bg-meta-4"
//               onClick={() => setCurrentPage(currentPage - 1)}
//               disabled={currentPage === 1}
//             >
//               <GrFormPrevious className="h-4 w-4" />
//             </button>
//             <button
//               className="hover:bg-gray-100 rounded p-1.5 dark:hover:bg-meta-4"
//               onClick={() => setCurrentPage(currentPage + 1)}
//               disabled={currentPage === totalPages}
//             >
//               <GrFormNext className="h-4 w-4" />
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default GenericTable;
