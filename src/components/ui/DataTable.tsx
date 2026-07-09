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
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'Tidak ada data',
  emptyIcon,
  pageSize = 15,
  actions,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(1)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const paged = data.slice((page - 1) * pageSize, page * pageSize)

  // Reset page when data changes
  React.useEffect(() => { setPage(1) }, [data.length])

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-100 animate-pulse">
            {[...Array(columns.length + (actions ? 1 : 0))].map((_, j) => (
              <div key={j} className="h-4 bg-gray-100 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-600 text-white">
              <th className="px-4 py-3 text-center text-xs font-semibold w-12">#</th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${col.width ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-center text-xs font-semibold w-32">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-[#64748B]">
                    {emptyIcon}
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={String(row.id ?? i)}
                  className="border-b border-gray-50 hover:bg-teal-50/40 transition-colors duration-150"
                >
                  <td className="px-4 py-3 text-center text-xs text-[#64748B] font-medium">
                    {(page - 1) * pageSize + i + 1}
                  </td>
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-[#2B3440]">
                      {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
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
