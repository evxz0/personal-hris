import React, { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  width?: string
  isCustom?: boolean
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
  tableId?: string // Unique identifier to persist column customization in localStorage
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
  tableId = 'default_table'
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)

  // Load custom columns from localStorage
  const [customColumns, setCustomColumns] = useState<Column<T>[]>(() => {
    try {
      const saved = localStorage.getItem(`table_custom_cols_${tableId}`)
      if (saved) {
        const parsed = JSON.parse(saved) as { key: string; header: string }[]
        return parsed.map(c => ({
          key: c.key,
          header: c.header,
          isCustom: true,
          render: (row: T) => <span>{String(row[c.key] ?? '-')}</span>
        }))
      }
    } catch (e) {
      // Ignore storage errors
    }
    return []
  })

  // Load hidden column keys from localStorage
  const [hiddenKeys, setHiddenKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`table_hidden_cols_${tableId}`)
      if (saved) {
        return JSON.parse(saved) as string[]
      }
    } catch (e) {
      // Ignore storage errors
    }
    return []
  })

  // Save custom columns whenever changed
  useEffect(() => {
    try {
      const toSave = customColumns.map(c => ({ key: c.key, header: c.header }))
      localStorage.setItem(`table_custom_cols_${tableId}`, JSON.stringify(toSave))
    } catch (e) {
      // Ignore storage errors
    }
  }, [customColumns, tableId])

  // Save hidden keys whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(`table_hidden_cols_${tableId}`, JSON.stringify(hiddenKeys))
    } catch (e) {
      // Ignore storage errors
    }
  }, [hiddenKeys, tableId])

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [popoverOpen])

  // Combined list of all available columns
  const allAvailableColumns: Column<T>[] = [...columns, ...customColumns]

  // Columns currently visible on table
  const displayedColumns = allAvailableColumns.filter(c => !hiddenKeys.includes(c.key))

  // If user hides all columns, fallback to showing all to avoid broken empty table
  const activeColumns = displayedColumns.length > 0 ? displayedColumns : allAvailableColumns

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

  const toggleColumnVisibility = (key: string) => {
    if (hiddenKeys.includes(key)) {
      setHiddenKeys(prev => prev.filter(k => k !== key))
    } else {
      // Prevent hiding if it's the last visible column
      if (displayedColumns.length > 1) {
        setHiddenKeys(prev => [...prev, key])
      }
    }
  }

  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newColumnName.trim()
    if (!trimmed) return

    const key = `custom_${Date.now()}_${trimmed.toLowerCase().replace(/\s+/g, '_')}`
    const newCol: Column<T> = {
      key,
      header: trimmed,
      isCustom: true,
      render: (row: T) => <span>{String(row[key] ?? '-')}</span>
    }

    setCustomColumns(prev => [...prev, newCol])
    setNewColumnName('')
  }

  const handleDeleteCustomColumn = (key: string) => {
    setCustomColumns(prev => prev.filter(c => c.key !== key))
    setHiddenKeys(prev => prev.filter(k => k !== key))
  }

  const handleResetColumns = () => {
    setHiddenKeys([])
    setCustomColumns([])
    try {
      localStorage.removeItem(`table_custom_cols_${tableId}`)
      localStorage.removeItem(`table_hidden_cols_${tableId}`)
    } catch (e) {
      // Ignore
    }
  }

  // Reset page when data changes
  useEffect(() => { setPage(1) }, [data.length])

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

  const totalCols = activeColumns.length + 1 + (selectable ? 1 : 0) + (actions ? 1 : 0)

  return (
    <div className="space-y-3">
      {/* Top Toolbar: Column Control */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="text-xs text-[#64748B] font-medium">
          Menampilkan <span className="font-bold text-teal-700">{activeColumns.length}</span> dari {allAvailableColumns.length} kolom
        </div>

        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setPopoverOpen(!popoverOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 shadow-sm transition-all active:scale-95"
          >
            <SlidersHorizontal size={14} className="text-teal-600" />
            Kelola Kolom
            <span className="ml-1 px-1.5 py-0.2 bg-teal-200 text-teal-800 text-[10px] rounded-full font-extrabold">
              {activeColumns.length}
            </span>
          </button>

          {/* Column Manager Dropdown Popover */}
          {popoverOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <h4 className="text-xs font-extrabold text-[#2B3440] flex items-center gap-1.5">
                    <SlidersHorizontal size={14} className="text-teal-600" /> Atur Kolom Tabel
                  </h4>
                  <p className="text-[10px] text-[#64748B]">Centang untuk menampilkan/menyembunyikan</p>
                </div>
                <button
                  onClick={handleResetColumns}
                  title="Reset ke tampilan default"
                  className="text-[10px] flex items-center gap-1 text-gray-500 hover:text-teal-600 font-semibold transition-colors"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>

              {/* Checkbox List */}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {allAvailableColumns.map(col => {
                  const isVisible = !hiddenKeys.includes(col.key)
                  return (
                    <div
                      key={col.key}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-teal-50/60 transition-colors group cursor-pointer"
                      onClick={() => toggleColumnVisibility(col.key)}
                    >
                      <label className="flex items-center gap-2 text-xs text-[#2B3440] cursor-pointer select-none font-medium flex-1">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => {}} // handled by parent div click
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <span className={col.isCustom ? 'font-semibold text-teal-700' : ''}>
                          {col.header}
                        </span>
                        {col.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded font-bold">
                            Custom
                          </span>
                        )}
                      </label>

                      <div className="flex items-center gap-1.5">
                        {isVisible ? (
                          <Eye size={13} className="text-teal-600" />
                        ) : (
                          <EyeOff size={13} className="text-gray-300" />
                        )}
                        {col.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCustomColumn(col.key)
                            }}
                            title="Hapus kolom custom ini"
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add Custom Column Section */}
              <div className="border-t border-gray-100 pt-3">
                <form onSubmit={handleAddCustomColumn} className="space-y-2">
                  <label className="text-[11px] font-bold text-[#2B3440] block">
                    + Tambah Kolom Custom Baru
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Nama kolom baru..."
                      value={newColumnName}
                      onChange={e => setNewColumnName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={!newColumnName.trim()}
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} /> Tambah
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
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
                {activeColumns.map(col => (
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
                      {activeColumns.map(col => (
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
