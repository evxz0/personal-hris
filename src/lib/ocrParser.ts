/**
 * Utility to parse raw extracted text from Gemini OCR into structured data object(s)
 */

export interface ParsedOcrResult {
  rawText: string
  parsedRow: Record<string, unknown>
  detectedFields: { label: string; key: string; value: string }[]
}

/**
 * Parse OCR raw text based on field mappings or standard HRIS fields
 */
export function parseOcrText(
  rawText: string,
  fieldMapping?: Record<string, string>
): ParsedOcrResult {
  const resultRow: Record<string, unknown> = {}
  const detectedFields: { label: string; key: string; value: string }[] = []

  if (!rawText) {
    return { rawText: '', parsedRow: {}, detectedFields: [] }
  }

  // Split lines
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  // Standard regex helpers
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i
  const phoneRegex = /\b(08\d{8,11}|\+62\d{9,12})\b/
  const nikRegex = /\b\d{16}\b/
  const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/

  // Check email
  const emailMatch = rawText.match(emailRegex)
  if (emailMatch) {
    resultRow['email'] = emailMatch[0]
  }

  // Check phone
  const phoneMatch = rawText.match(phoneRegex)
  if (phoneMatch) {
    resultRow['no_hp'] = phoneMatch[0]
    resultRow['telepon'] = phoneMatch[0]
  }

  // Check NIK
  const nikMatch = rawText.match(nikRegex)
  if (nikMatch) {
    resultRow['nik'] = nikMatch[0]
  }

  // Check date
  const dateMatch = rawText.match(dateRegex)
  if (dateMatch && !resultRow['tanggal']) {
    resultRow['tanggal'] = dateMatch[0]
  }

  // Parse line by line for key: value or key = value pattern
  lines.forEach(line => {
    // Look for separator like :, =, or multiple spaces
    const parts = line.split(/[:=]/)
    if (parts.length >= 2) {
      const rawKey = parts[0].trim()
      const rawVal = parts.slice(1).join(':').trim()

      if (rawKey && rawVal) {
        const cleanKey = rawKey.toLowerCase()

        // Match against fieldMapping if provided
        if (fieldMapping) {
          for (const [header, mappedKey] of Object.entries(fieldMapping)) {
            if (cleanKey.includes(header.toLowerCase()) || header.toLowerCase().includes(cleanKey)) {
              resultRow[mappedKey] = rawVal
              detectedFields.push({ label: header, key: mappedKey, value: rawVal })
              return
            }
          }
        }

        // Generic key mapping fallbacks
        if (cleanKey.includes('npp')) resultRow['npp'] = rawVal
        else if (cleanKey.includes('nama')) resultRow['nama'] = rawVal
        else if (cleanKey.includes('nik')) resultRow['nik'] = rawVal
        else if (cleanKey.includes('jabatan')) resultRow['jabatan'] = rawVal
        else if (cleanKey.includes('unit') || cleanKey.includes('departemen')) resultRow['unit'] = rawVal
        else if (cleanKey.includes('kategori')) resultRow['kategori'] = rawVal
        else if (cleanKey.includes('tgl') || cleanKey.includes('tanggal')) resultRow['tanggal'] = rawVal
        else if (cleanKey.includes('alasan') || cleanKey.includes('keterangan')) resultRow['keterangan'] = rawVal
        else {
          const snakeKey = cleanKey.replace(/\s+/g, '_')
          resultRow[snakeKey] = rawVal
        }

        detectedFields.push({ label: rawKey, key: cleanKey.replace(/\s+/g, '_'), value: rawVal })
      }
    }
  })

  // If nama wasn't found in key-value, try to detect lines without colons
  if (!resultRow['nama']) {
    for (const line of lines) {
      if (!line.includes(':') && !line.includes('=') && /^[A-Z\s\.\,\']{3,40}$/i.test(line) && !/http|www|sk|surat|keputusan/i.test(line)) {
        resultRow['nama'] = line
        detectedFields.push({ label: 'Nama (Detected)', key: 'nama', value: line })
        break
      }
    }
  }

  // Ensure default field values if fieldMapping is provided
  if (fieldMapping) {
    for (const key of Object.values(fieldMapping)) {
      if (!resultRow[key]) {
        resultRow[key] = ''
      }
    }
  }

  return {
    rawText,
    parsedRow: resultRow,
    detectedFields
  }
}
