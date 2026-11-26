import React, { useRef, useState, useMemo } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface TelemetryDataTableProps<TData> {
  data: TData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  getRowTeamColor?: (row: TData) => string | undefined;
  onRowClick?: (row: TData) => void;
  selectedRowId?: string | number;
  getRowId?: (row: TData) => string;
  maxHeightPx?: number;
  rowHeightPx?: number;
  emptyMessage?: string;
  ariaLabel?: string;
  enableSorting?: boolean;
  filterValue?: string;
  className?: string;
}

export function TelemetryDataTable<TData>({
  data,
  columns,
  getRowTeamColor,
  onRowClick,
  selectedRowId,
  getRowId,
  maxHeightPx = 560,
  rowHeightPx = 38,
  emptyMessage = 'No matching telemetry records found.',
  ariaLabel = 'Telemetry Data Table',
  enableSorting = true,
  filterValue = '',
  className = '',
}: TelemetryDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: filterValue,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeightPx,
    overscan: 10,
    initialRect: { width: 1000, height: maxHeightPx },
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Deterministic fallback for environments without layout engine (e.g. JSDOM / headless tests)
  const itemsToRender = useMemo(() => {
    if (virtualRows.length > 0) return virtualRows;
    if (rows.length === 0) return [];
    return rows.slice(0, Math.min(rows.length, 50)).map((_, index) => ({
      index,
      start: index * rowHeightPx,
      end: (index + 1) * rowHeightPx,
      size: rowHeightPx,
      key: index,
    }));
  }, [virtualRows, rows, rowHeightPx]);

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

  return (
    <div
      className={`flex flex-col border border-white/10 rounded-md bg-[#0B0F17]/90 backdrop-blur-md overflow-hidden ${className}`}
      aria-label={ariaLabel}
    >
      <div
        ref={parentRef}
        className="overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        style={{ maxHeight: `${maxHeightPx}px` }}
      >
        <table className="w-full text-left border-collapse text-xs" role="table">
          {/* Sticky Timing Header */}
          <thead className="sticky top-0 z-10 bg-[#070A0F] border-b border-white/15 select-none font-telemetry tracking-wider uppercase">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort() && enableSorting;
                  const sortDir = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }}
                      className={`px-3 py-2.5 font-bold text-slate-400 text-[11px] whitespace-nowrap transition-colors ${
                        canSort ? 'cursor-pointer hover:text-white' : ''
                      }`}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      aria-sort={
                        sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none'
                      }
                    >
                      <div className="flex items-center gap-1.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-slate-500">
                            {sortDir === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                            ) : sortDir === 'desc' ? (
                              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <ChevronsUpDown className="w-3 h-3 text-slate-600 opacity-60 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Virtualized Timing Tower Rows */}
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-slate-500 font-telemetry tracking-wider"
                >
                  // {emptyMessage}
                </td>
              </tr>
            ) : (
              <>
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} colSpan={columns.length} />
                  </tr>
                )}
                {itemsToRender.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  const teamColor = getRowTeamColor ? getRowTeamColor(row.original) : undefined;
                  const rowId = getRowId ? getRowId(row.original) : row.id;
                  const isSelected = selectedRowId !== undefined && String(selectedRowId) === String(rowId);

                  return (
                    <tr
                      key={row.id}
                      data-index={virtualRow.index}
                      role={onRowClick ? 'button' : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      onClick={() => onRowClick?.(row.original)}
                      onKeyDown={(e) => {
                        if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          onRowClick(row.original);
                        }
                      }}
                      style={{
                        height: `${rowHeightPx}px`,
                        borderLeft: teamColor ? `3px solid ${teamColor}` : undefined,
                      }}
                      className={`border-b border-white/[0.04] transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/15 text-white'
                          : 'hover:bg-white/[0.04] text-slate-200'
                      } ${onRowClick ? 'cursor-pointer' : ''}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3 py-1.5 whitespace-nowrap align-middle"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} colSpan={columns.length} />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
