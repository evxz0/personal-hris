import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── XLSX EXPORT ──────────────────────────────────────────────────────────────
export function exportToXLSX(data: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  
  // Auto column width
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2
  }))
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ─── PDF EXPORT ───────────────────────────────────────────────────────────────
export function exportToPDF(
  data: Record<string, unknown>[],
  columns: { header: string; dataKey: string }[],
  title: string,
  filename: string
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header
  doc.setFillColor(0, 102, 119) // teal #006677
  doc.rect(0, 0, 297, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('P-HRIS | Sistem Informasi SDM', 14, 10)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(title, 14, 17)

  // Date stamp
  doc.setFontSize(8)
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 230, 10)

  // Table
  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => String(row[c.dataKey] ?? '-'))),
    startY: 26,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica',
      textColor: [43, 52, 64],
    },
    headStyles: {
      fillColor: [0, 102, 119],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [244, 247, 246],
    },
    columnStyles: {},
    margin: { left: 14, right: 14 },
  })

  // Footer
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text(`Halaman ${i} dari ${pageCount}`, 140, 205, { align: 'center' })
  }

  doc.save(`${filename}.pdf`)
}

// ─── XLSX / CSV IMPORT ────────────────────────────────────────────────────────
export async function parseXLSX(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        resolve(json as Record<string, unknown>[])
      } catch {
        reject(new Error('Gagal membaca file Excel/CSV'))
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsArrayBuffer(file)
  })
}

// ─── WORD (.docx) IMPORT ─────────────────────────────────────────────────────
export async function parseWord(file: File): Promise<Record<string, unknown>[]> {
  const mammoth = await import('mammoth')
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const result = await mammoth.extractRawText({ arrayBuffer: e.target!.result as ArrayBuffer })
        // Parse table-like text from Word: each line = one row, tab/pipe-separated
        const lines = result.value
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)

        if (lines.length < 2) {
          resolve([])
          return
        }

        const headers = lines[0].split(/\t|\|/).map(h => h.trim()).filter(Boolean)
        const rows = lines.slice(1).map(line => {
          const cells = line.split(/\t|\|/).map(c => c.trim())
          const obj: Record<string, unknown> = {}
          headers.forEach((h, i) => { obj[h] = cells[i] ?? '' })
          return obj
        })
        resolve(rows)
      } catch {
        reject(new Error('Gagal membaca file Word'))
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsArrayBuffer(file)
  })
}

// ─── TEMPLATE DOWNLOAD ────────────────────────────────────────────────────────
export function downloadTemplate(headers: string[], filename: string) {
  const ws = XLSX.utils.aoa_to_sheet([headers])
  const colWidths = headers.map(h => ({ wch: Math.max(h.length + 4, 20) }))
  ws['!cols'] = colWidths
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, `${filename}_template.xlsx`)
}
