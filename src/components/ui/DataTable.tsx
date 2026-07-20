import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  pageSize?: number
  actions?: (row: T) => React.ReactNode
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'Tidak ada data',
  emptyIcon,
  pageSize = 15,
  actions,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(1)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const paged = data.slice((page - 1) * pageSize, page * pageSize)

  const allIds = data.map(d => String(d.id || ''))
  const isAllSelected = data.length > 0 && allIds.every(id => selectedIds.includes(id))
  const isSomeSelected = data.length > 0 && allIds.some(id => selectedIds.includes(id)) && !isAllSelected

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return
    if (e.target.checked) {
      onSelectionChange(allIds)
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(x => x !== id))
    }
  }

  // Reset page when data changes
  React.useEffect(() => { setPage(1) }, [data.length])

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-100 animate-pulse">
            {[...Array(columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0))].map((_, j) => (
              <div key={j} className="h-4 bg-gray-100 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  const totalCols = columns.length + 1 + (selectable ? 1 : 0) + (actions ? 1 : 0)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-teal-600 text-white">
              {selectable && (
                <th className="px-3 py-2 text-center text-[11px] font-semibold w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={el => {
                      if (el) el.indeterminate = isSomeSelected
                    }}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                  />
                </th>
              )}
              <th className="px-3 py-2 text-center text-[11px] font-semibold w-12">#</th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${col.width ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-3 py-2 text-center text-[11px] font-semibold w-32">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-[#64748B]">
                    {emptyIcon}
                    <p className="text-xs">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, i) => {
                const rowId = String(row.id || '')
                const isSelected = selectedIds.includes(rowId)
                return (
                  <tr
                    key={rowId || i}
                    className={`border-b border-gray-50 hover:bg-teal-50/40 transition-colors duration-150 ${isSelected ? 'bg-teal-50/20' : ''}`}
                  >
                    {selectable && (
                      <td className="px-3 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-3 py-1.5 text-center text-[11px] text-[#64748B] font-medium">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    {columns.map(col => (
                      <td key={col.key} className="px-3 py-1.5 text-[#2B3440]">
                        {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-3 py-1.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-[#F4F7F6]/60">
          <p className="text-xs text-[#64748B]">
            Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.length)} dari {data.length} data
          </p>
          <div className="flex items-center gap-1">
            <PageBtn onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft size={14}/></PageBtn>
            <PageBtn onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft size={14}/></PageBtn>
            <span className="px-3 py-1 text-xs font-semibold text-teal-700 bg-teal-100 rounded-lg">
              {page} / {totalPages}
            </span>
            <PageBtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><ChevronRight size={14}/></PageBtn>
            <PageBtn onClick={() => setPage(totalPages)} disabled={page === totalPages}><ChevronsRight size={14}/></PageBtn>
          </div>
        </div>
      )}
    </div>
  )
}

function PageBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-lg text-[#64748B] hover:bg-white hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
    >
      {children}
    </button>
  )
}
