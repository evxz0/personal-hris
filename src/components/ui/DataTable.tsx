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
  EyeOff,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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
  const [kelolaDropdownOpen, setKelolaDropdownOpen] = useState(false)
  const [showSelectColumn, setShowSelectColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [draggedKey, setDraggedKey] = useState<string | null>(null)
  
  // Sort State
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)

  const kelolaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (kelolaRef.current && !kelolaRef.current.contains(e.target as Node)) {
        setKelolaDropdownOpen(false)
        setPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // All available columns list
  const allAvailableColumns: Column<T>[] = [...columns, ...customColumns]

  // Load column order from localStorage
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`table_col_order_${tableId}`)
      if (saved) {
        return JSON.parse(saved) as string[]
      }
    } catch (e) {
      // Ignore storage errors
    }
    return allAvailableColumns.map(c => c.key)
  })

  // Synchronize columnOrder when columns or customColumns change
  useEffect(() => {
    const currentKeys = allAvailableColumns.map(c => c.key)
    setColumnOrder(prev => {
      const existing = prev.filter(k => currentKeys.includes(k))
      const added = currentKeys.filter(k => !existing.includes(k))
      return [...existing, ...added]
    })
  }, [columns, customColumns])

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

  // Save column order whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(`table_col_order_${tableId}`, JSON.stringify(columnOrder))
    } catch (e) {
      // Ignore storage errors
    }
  }, [columnOrder, tableId])

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (kelolaRef.current && !kelolaRef.current.contains(e.target as Node)) {
        setKelolaDropdownOpen(false)
        setPopoverOpen(false)
      }
    }
    if (popoverOpen || kelolaDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [popoverOpen, kelolaDropdownOpen])

  // Sort Handler (Ascending -> Descending -> Reset)
  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDirection('asc')
    } else if (sortDirection === 'asc') {
      setSortDirection('desc')
    } else {
      setSortKey(null)
      setSortDirection(null)
    }
  }

  // Sorted Data Computation
  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDirection) return data

    return [...data].sort((a, b) => {
      let valA = a[sortKey]
      let valB = b[sortKey]

      // Empty / Null / Undefined sent to end
      if (valA === null || valA === undefined || valA === '') return 1
      if (valB === null || valB === undefined || valB === '') return -1

      // Direct Numbers
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA
      }

      // Try numeric strings (e.g. "12", "1", "100")
      const strA = String(valA).trim()
      const strB = String(valB).trim()

      const numA = Number(strA)
      const numB = Number(strB)
      if (!isNaN(numA) && !isNaN(numB) && strA !== '' && strB !== '' && !strA.startsWith('0x')) {
        return sortDirection === 'asc' ? numA - numB : numB - numA
      }

      // Try Date parsing
      const dateA = Date.parse(strA)
      const dateB = Date.parse(strB)
      if (!isNaN(dateA) && !isNaN(dateB) && strA.length >= 8 && strB.length >= 8 && /\d/.test(strA)) {
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
      }

      // String comparison (A-Z / Z-A)
      const comp = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
      return sortDirection === 'asc' ? comp : -comp
    })
  }, [data, sortKey, sortDirection])

  // Map of columns for fast lookup
  const colMap = new Map(allAvailableColumns.map(c => [c.key, c]))

  // Sorted list of available columns according to columnOrder
  const orderedAvailableColumns: Column<T>[] = columnOrder
    .map(key => colMap.get(key))
    .filter((col): col is Column<T> => col !== undefined)

  // Columns currently visible on table
  const displayedColumns = orderedAvailableColumns.filter(c => !hiddenKeys.includes(c.key))

  // Fallback to all if user hides all
  const activeColumns = displayedColumns.length > 0 ? displayedColumns : orderedAvailableColumns

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const paged = sortedData.slice((page - 1) * pageSize, page * pageSize)

  const allIds = sortedData.map(d => String(d.id || ''))
  const isAllSelected = sortedData.length > 0 && allIds.every(id => selectedIds.includes(id))
  const isSomeSelected = sortedData.length > 0 && allIds.some(id => selectedIds.includes(id)) && !isAllSelected

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

  const moveColumn = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= columnOrder.length) return
    setColumnOrder(prev => {
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return updated
    })
  }

  const handleDragStart = (e: React.DragEvent, key: string) => {
    setDraggedKey(key)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault()
    if (!draggedKey || draggedKey === targetKey) return
    const fromIndex = columnOrder.indexOf(draggedKey)
    const toIndex = columnOrder.indexOf(targetKey)
    if (fromIndex !== -1 && toIndex !== -1) {
      moveColumn(fromIndex, toIndex)
    }
    setDraggedKey(null)
  }

  const toggleColumnVisibility = (key: string) => {
    if (hiddenKeys.includes(key)) {
      setHiddenKeys(prev => prev.filter(k => k !== key))
    } else {
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
    setColumnOrder(prev => prev.filter(k => k !== key))
  }

  const handleResetColumns = () => {
    setHiddenKeys([])
    setCustomColumns([])
    setColumnOrder(columns.map(c => c.key))
    setSortKey(null)
    setSortDirection(null)
    try {
      localStorage.removeItem(`table_custom_cols_${tableId}`)
      localStorage.removeItem(`table_hidden_cols_${tableId}`)
      localStorage.removeItem(`table_col_order_${tableId}`)
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

  const totalCols = activeColumns.length + 1 + (selectable && showSelectColumn ? 1 : 0) + (actions ? 1 : 0)

  return (
    <div className="space-y-3">
      {/* Top Toolbar: Column Control & Active Sort Indicator */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs text-[#64748B] font-medium">
          <span>Menampilkan <span className="font-bold text-teal-700">{activeColumns.length}</span> dari {orderedAvailableColumns.length} kolom</span>
          {sortKey && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200 text-[11px] font-semibold animate-fade-in">
              Sorting: <span className="font-bold">{colMap.get(sortKey)?.header || sortKey}</span> ({sortDirection === 'asc' ? 'A-Z / Kecil→Besar' : 'Z-A / Besar→Kecil'})
              <button
                type="button"
                onClick={() => { setSortKey(null); setSortDirection(null); }}
                className="ml-1 text-yellow-600 hover:text-yellow-900 font-bold"
                title="Batal urutkan"
              >
                ×
              </button>
            </span>
          )}
        </div>

        <div className="relative" ref={kelolaRef}>
          <button
            type="button"
            onClick={() => setKelolaDropdownOpen(prev => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl border shadow-sm transition-all active:scale-95 cursor-pointer ${
              showSelectColumn
                ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
            }`}
          >
            <SlidersHorizontal size={14} className={showSelectColumn ? 'text-orange-600' : 'text-teal-600'} />
            Kelola
            {showSelectColumn && (
              <span className="px-1.5 py-0.2 bg-orange-200 text-orange-800 text-[10px] rounded-full font-extrabold">
                Mode Hapus
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform duration-200 ${kelolaDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu Kelola */}
          {kelolaDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setKelolaDropdownOpen(false)
                  setShowSelectColumn(false)
                  if (onSelectionChange) onSelectionChange([])
                  setPopoverOpen(true)
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors cursor-pointer text-[#2B3440]"
              >
                <SlidersHorizontal size={14} className="text-teal-600 shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span>Kelola Kolom</span>
                  <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[10px] rounded-full font-extrabold">
                    {activeColumns.length}
                  </span>
                </div>
              </button>

              {selectable && (
                <button
                  type="button"
                  onClick={() => {
                    setKelolaDropdownOpen(false)
                    const nextState = !showSelectColumn
                    setShowSelectColumn(nextState)
                    if (!nextState && onSelectionChange) {
                      onSelectionChange([])
                    }
                  }}
                  className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-gray-100 ${
                    showSelectColumn
                      ? 'bg-orange-50/80 text-orange-700 font-bold hover:bg-orange-100/80'
                      : 'hover:bg-red-50 hover:text-red-700 text-[#2B3440]'
                  }`}
                >
                  <Trash2 size={14} className={showSelectColumn ? 'text-orange-600 shrink-0' : 'text-red-500 shrink-0'} />
                  <span>{showSelectColumn ? 'Sembunyikan Hapus' : 'Kelola Data (Hapus)'}</span>
                </button>
              )}
            </div>
          )}

          {/* Column Manager Dropdown Popover */}
          {popoverOpen && (
            <div className="absolute right-0 top-full mt-2 w-84 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <h4 className="text-xs font-extrabold text-[#2B3440] flex items-center gap-1.5">
                    <SlidersHorizontal size={14} className="text-teal-600" /> Kelola Kolom
                  </h4>
                  <p className="text-[10px] text-[#64748B]">Geser (drag) atau panah ↑↓ untuk merubah urutan</p>
                </div>
                <button
                  type="button"
                  onClick={handleResetColumns}
                  title="Reset ke tampilan default"
                  className="text-[10px] flex items-center gap-1 text-gray-500 hover:text-teal-600 font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>

              {/* Checkbox & Reorderable List */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {orderedAvailableColumns.map((col, idx) => {
                  const isVisible = !hiddenKeys.includes(col.key)
                  const isDragging = draggedKey === col.key
                  return (
                    <div
                      key={col.key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, col.key)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col.key)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-transparent transition-all duration-150 group select-none ${
                        isDragging
                          ? 'bg-teal-100 border-teal-300 opacity-50 scale-95'
                          : 'hover:bg-teal-50/70 hover:border-teal-100 bg-white border-gray-50'
                      }`}
                    >
                      {/* Drag Handle & Checkbox Label */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="cursor-grab active:cursor-grabbing p-0.5 text-gray-300 group-hover:text-teal-600 transition-colors shrink-0"
                          title="Klik & tarik untuk menggeser urutan"
                        >
                          <GripVertical size={14} />
                        </div>

                        <label
                          className="flex items-center gap-2 text-xs text-[#2B3440] cursor-pointer font-medium truncate flex-1"
                          onClick={(e) => {
                            e.preventDefault()
                            toggleColumnVisibility(col.key)
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => {}}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer shrink-0"
                          />
                          <span className={`truncate ${col.isCustom ? 'font-semibold text-teal-700' : ''}`}>
                            {col.header}
                          </span>
                          {col.isCustom && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded font-bold shrink-0">
                              Custom
                            </span>
                          )}
                        </label>
                      </div>

                      {/* Action Controls: Up/Down Arrows, Eye, Delete */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {/* Move Up/Down buttons */}
                        <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg p-0.5 border border-gray-100 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveColumn(idx, idx - 1)}
                            title="Geser ke Atas"
                            className="p-0.5 text-gray-500 hover:text-teal-700 hover:bg-white rounded disabled:opacity-20 transition-all cursor-pointer"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === orderedAvailableColumns.length - 1}
                            onClick={() => moveColumn(idx, idx + 1)}
                            title="Geser ke Bawah"
                            className="p-0.5 text-gray-500 hover:text-teal-700 hover:bg-white rounded disabled:opacity-20 transition-all cursor-pointer"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>

                        {/* Visibility Eye Icon */}
                        <button
                          type="button"
                          onClick={() => toggleColumnVisibility(col.key)}
                          title={isVisible ? 'Sembunyikan kolom' : 'Tampilkan kolom'}
                          className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          {isVisible ? (
                            <Eye size={13} className="text-teal-600" />
                          ) : (
                            <EyeOff size={13} className="text-gray-300" />
                          )}
                        </button>

                        {/* Custom Column Delete */}
                        {col.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomColumn(col.key)}
                            title="Hapus kolom custom ini"
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
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
              <tr className="bg-teal-600 text-white select-none">
                {selectable && showSelectColumn && (
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
                {activeColumns.map(col => {
                  const isSorted = sortKey === col.key
                  const isAsc = isSorted && sortDirection === 'asc'
                  const isDesc = isSorted && sortDirection === 'desc'
                  const sortTooltip = isAsc
                    ? `Urutan: A-Z / Kecil ke Besar. Klik lagi untuk Z-A / Besar ke Kecil.`
                    : isDesc
                    ? `Urutan: Z-A / Besar ke Kecil. Klik lagi untuk batal urutkan.`
                    : `Klik untuk mengurutkan A-Z / Angka kecil ke besar.`

                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap hover:bg-teal-700 transition-colors group cursor-pointer ${col.width ?? ''}`}
                      title={sortTooltip}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={isSorted ? 'text-yellow-300 font-bold' : ''}>{col.header}</span>

                        {/* Interactive Sort Icon on the right side */}
                        <span className="shrink-0 transition-all">
                          {isAsc ? (
                            <ArrowUp size={13} className="text-yellow-300 font-bold animate-bounce-short" />
                          ) : isDesc ? (
                            <ArrowDown size={13} className="text-yellow-300 font-bold animate-bounce-short" />
                          ) : (
                            <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      </div>
                    </th>
                  )
                })}
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
                      {selectable && showSelectColumn && (
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
              Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sortedData.length)} dari {sortedData.length} data
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
      className="p-1.5 rounded-lg text-[#64748B] hover:bg-white hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
    >
      {children}
    </button>
  )
}
