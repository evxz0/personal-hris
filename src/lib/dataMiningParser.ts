import * as XLSX from 'xlsx'

// Dictionary of synonyms for smart AI field recognition
const SYNONYMS: Record<string, string[]> = {
  npp: [
    'npp', 'nip', 'nik', 'no. peg', 'no peg', 'no_pegawai', 'nomor pegawai',
    'id', 'id_karyawan', 'id_pegawai', 'code', 'kode', 'npp_digi_hc', 'npp_webmail',
    'npp / nip', 'npp/nip', 'no pegawai', 'no.pegawai', 'npp_karyawan', 'nomor id',
    'npp/nik', 'badge', 'empid', 'emp_id'
  ],
  nama: [
    'nama', 'name', 'full name', 'nama lengkap', 'nama karyawan', 'nama pegawai',
    'sdr', 'sdri', 'karyawan', 'pegawai', 'personnel', 'employee', 'fullname', 'nama_lengkap',
    'nama_karyawan', 'nama_pegawai'
  ],
  jabatan: [
    'jabatan', 'posisi', 'position', 'role', 'tugas', 'pekerjaan', 'job', 'title',
    'posisi saat ini', 'posisi_saat_ini', 'posisi/jabatan', 'posisi / jabatan', 'posisi / role',
    'jabatan asal', 'jabatan baru', 'jabatan_asal', 'jabatan_baru', 'posisi_pekerjaan'
  ],
  outlet: [
    'outlet', 'unit', 'unit kerja', 'departemen', 'department', 'divisi', 'cabang',
    'lokasi', 'kantor', 'wilayah', 'work unit', 'branch', 'penempatan', 'unit asal',
    'unit kerja asal', 'kantor_cabang', 'unit_asal', 'lokasi_kerja', 'departemen/unit'
  ],
  kategori: [
    'kategori', 'category', 'status', 'tipe', 'jenis', 'kelompok', 'hubungan kerja',
    'jenis pegawai', 'status pegawai', 'tipe pegawai', 'kategori_pegawai', 'status_kerja',
    'keterangan', 'ket'
  ],
  grade: [
    'grade', 'golongan', 'pangkat', 'tingkat', 'level', 'grade asal', 'grade pgs', 'gol', 'grade.'
  ],
  jenjang: [
    'jenjang', 'subgrade', 'sub-grade', 'jenjang jabatan', 'band', 'jenjang asal', 'jenjang pgs'
  ],
  tanggal_lahir: [
    'tanggal lahir', 'tgl lahir', 'birth date', 'dob', 'date of birth', 'lahir',
    'tgl_lahir', 'tgl. lahir', 'tgl_lhr', 'tanggal_lhr', 'birth day', 'birthday', 'efektif', 'tgl efektif'
  ],
  tanggal_masuk: [
    'tanggal masuk', 'tgl masuk', 'join date', 'hire date', 'tgl bergabung',
    'tgl mulai', 'tgl_masuk', 'mulai bekerja', 'tanggal_bergabung'
  ],
  nik: [
    'nik', 'no ktp', 'ktp', 'nomor ktp', 'identity', 'no. ktp', 'no_ktp', 'nik_ktp', 'no_identitas'
  ],
  no_hp: [
    'no hp', 'no. hp', 'handphone', 'telepon', 'phone', 'mobile', 'wa', 'whatsapp',
    'no telp', 'no. telp', 'hp', 'no_hp', 'nomor_hp', 'no_telepon'
  ],
  no_rek: [
    'no rek', 'no. rek', 'rekening', 'account number', 'bank account', 'no rekening',
    'no. rekening', 'no_rek', 'nomor_rekening', 'no_rekening'
  ],
  sisa_cuti: [
    'sisa cuti', 'cuti', 'leave', 'hak cuti', 'kuota cuti', 'sisa_cuti', 'kuota_cuti'
  ],
  email: [
    'email', 'e-mail', 'surel', 'mail', 'email address', 'e_mail'
  ]
}

/**
 * Clean & normalize string header for fuzzy matching
 */
function normalizeString(str: string): string {
  return String(str || '')
    .toLowerCase()
    .replace(/[_\-./\\()\s]+/g, ' ')
    .trim()
}

/**
 * Smart Header Field Matcher using Data Mining Synonym Rules
 */
export function matchHeaderToKey(header: string, fieldMapping: Record<string, string>): string | null {
  const normHeader = normalizeString(header)
  if (!normHeader) return null

  // Ignore row index/sequence headers (e.g. 'no', 'no.', 'no urut', '#')
  const isRowIndexHeader = /^(no|no\.|no urut|nomor urut|nr|index|#)$/i.test(normHeader)
  if (isRowIndexHeader) return null

  // 1. Direct match with fieldMapping keys (e.g. 'NPP', 'Nama Lengkap', etc.)
  for (const [mapLabel, targetKey] of Object.entries(fieldMapping)) {
    if (normalizeString(mapLabel) === normHeader) return targetKey
    if (normalizeString(targetKey) === normHeader) return targetKey
  }

  // 2. Data Mining Synonym Matching
  const targetKeys = Array.from(new Set(Object.values(fieldMapping)))

  for (const targetKey of targetKeys) {
    const synonymList = SYNONYMS[targetKey] || [targetKey]
    for (const syn of synonymList) {
      const normSyn = normalizeString(syn)
      if (normHeader === normSyn) {
        return targetKey
      }
      if (normSyn.length > 3 && (normHeader.includes(normSyn) || normSyn.includes(normHeader))) {
        return targetKey
      }
    }
  }

  return null
}

/**
 * Data Mining Parser Engine: Reads Excel/CSV ArrayBuffer and intelligently
 * extracts data rows regardless of title lines, unknown column names, or layout anomalies.
 */
export function parseSpreadsheetSmart(
  arrayBuffer: ArrayBuffer,
  fieldMapping: Record<string, string>,
  requiredFields: string[]
): Record<string, unknown>[] {
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Convert sheet to 2D array of strings
  const matrix = XLSX.utils.sheet_to_json<Array<unknown>>(sheet, { header: 1, defval: '' })
  if (!matrix || matrix.length === 0) return []

  // Step 1: Scan matrix rows (0 to 15) to auto-detect true Header Row
  let bestHeaderIndex = 0
  let maxScore = -1

  for (let r = 0; r < Math.min(15, matrix.length); r++) {
    const rowCells = matrix[r] || []
    let score = 0

    for (const cell of rowCells) {
      const cellStr = String(cell || '').trim()
      if (cellStr && matchHeaderToKey(cellStr, fieldMapping)) {
        score += 1
      }
    }

    if (score > maxScore) {
      maxScore = score
      bestHeaderIndex = r
    }
  }

  // If score is 0, fall back to row 0
  if (maxScore === 0) {
    bestHeaderIndex = 0
  }

  const rawHeaders = (matrix[bestHeaderIndex] || []).map(c => String(c || '').trim())

  // Step 2: Build Column Index to Field Key Map
  const colIndexToKeyMap: Record<number, string> = {}
  const usedKeys = new Set<string>()

  rawHeaders.forEach((h, colIdx) => {
    const matchedKey = matchHeaderToKey(h, fieldMapping)
    if (matchedKey && !usedKeys.has(matchedKey)) {
      colIndexToKeyMap[colIdx] = matchedKey
      usedKeys.add(matchedKey)
    }
  })

  // Step 3: Value Profiling Fallback for unmapped required fields
  const unmappedRequiredKeys = requiredFields.filter(k => !usedKeys.has(k))

  if (unmappedRequiredKeys.length > 0 && matrix.length > bestHeaderIndex + 1) {
    // Inspect first 5 data rows
    const sampleRows = matrix.slice(bestHeaderIndex + 1, bestHeaderIndex + 6)
    
    rawHeaders.forEach((_, colIdx) => {
      if (colIndexToKeyMap[colIdx]) return // already mapped

      const colValues = sampleRows.map(r => String(r[colIdx] || '').trim()).filter(Boolean)
      if (colValues.length === 0) return

      for (const unmappedKey of unmappedRequiredKeys) {
        if (usedKeys.has(unmappedKey)) continue

        // Check if values look like names (alphabetical, multiple words or >2 chars)
        if (unmappedKey === 'nama') {
          const isNameLike = colValues.every(val => /^[A-Za-z\s'.,-]+$/.test(val) && val.length >= 2)
          if (isNameLike) {
            colIndexToKeyMap[colIdx] = 'nama'
            usedKeys.add('nama')
            break
          }
        }
        // Check if values look like NPP (alphanumeric 4-12 chars)
        if (unmappedKey === 'npp') {
          const isNppLike = colValues.every(val => /^[A-Za-z0-9\-]{3,15}$/.test(val))
          if (isNppLike) {
            colIndexToKeyMap[colIdx] = 'npp'
            usedKeys.add('npp')
            break
          }
        }
      }
    })
  }

  // Step 4: Extract Data Rows starting from bestHeaderIndex + 1
  const resultRows: Record<string, unknown>[] = []

  for (let r = bestHeaderIndex + 1; r < matrix.length; r++) {
    const rowCells = matrix[r] || []
    
    // Skip empty rows
    const hasData = rowCells.some(c => String(c || '').trim() !== '')
    if (!hasData) continue

    // Check if this row is a repeating/stacked sub-header in multi-table sheets
    let headerMatches = 0
    const tempColMap: Record<number, string> = {}
    const tempUsed = new Set<string>()
    rowCells.forEach((c, idx) => {
      const cStr = String(c || '').trim()
      const m = matchHeaderToKey(cStr, fieldMapping)
      if (m && !tempUsed.has(m)) {
        headerMatches++
        tempColMap[idx] = m
        tempUsed.add(m)
      }
    })

    // If row matches >= 3 headers, update colIndexToKeyMap and skip this header row
    if (headerMatches >= 3) {
      Object.assign(colIndexToKeyMap, tempColMap)
      continue
    }

    // Skip if row is a sub-table header line (e.g. contains 'NPP' or 'NAMA PEGAWAI')
    const nppColIdx = Object.keys(colIndexToKeyMap).find(k => colIndexToKeyMap[Number(k)] === 'npp')
    const namaColIdx = Object.keys(colIndexToKeyMap).find(k => colIndexToKeyMap[Number(k)] === 'nama')
    const possibleNpp = nppColIdx !== undefined ? String(rowCells[Number(nppColIdx)] || '').trim().toUpperCase() : ''
    const possibleNama = namaColIdx !== undefined ? String(rowCells[Number(namaColIdx)] || '').trim().toUpperCase() : ''
    if (possibleNpp === 'NPP' || possibleNama === 'NAMA' || possibleNama === 'NAMA PEGAWAI' || possibleNama === 'NAMA KARYAWAN') {
      continue
    }

    const rowObj: Record<string, unknown> = {}

    // Populate mapped fields
    Object.entries(colIndexToKeyMap).forEach(([colIdxStr, fieldKey]) => {
      const colIdx = Number(colIdxStr)
      let val: unknown = rowCells[colIdx]

      // Format dates if object
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0]
      } else {
        val = String(val ?? '').trim()
      }

      if (fieldKey === 'nama' && typeof val === 'string') {
        val = val.toUpperCase()
      }

      rowObj[fieldKey] = val
    })

    // Also populate raw headers as fallback keys in case caller expects them
    rawHeaders.forEach((h, colIdx) => {
      if (h && !(h in rowObj)) {
        rowObj[h] = String(rowCells[colIdx] ?? '').trim()
      }
    })

    // Validation check: check if row has data in at least required fields OR any non-empty field
    const isValid = requiredFields.every(req => {
      const val = rowObj[req]
      return val !== undefined && val !== null && String(val).trim() !== ''
    })

    if (isValid) {
      resultRows.push(rowObj)
    } else {
      // Fallback: If 'nama' is required but empty, check if 'npp' or any other cell has content
      const anyFieldWithValue = Object.values(rowObj).some(v => String(v || '').trim() !== '')
      if (anyFieldWithValue) {
        // Generate fallback values for required fields if needed
        if (requiredFields.includes('nama') && !rowObj['nama']) {
          rowObj['nama'] = rowObj['npp'] || rowObj[rawHeaders[0]] || 'Pegawai Import'
        }
        resultRows.push(rowObj)
      }
    }
  }

  return resultRows
}
