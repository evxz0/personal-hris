/**
 * Utility to parse raw extracted text from Gemini OCR into structured data object(s)
 */

export interface ParsedOcrResult {
  rawText: string
  parsedRow: Record<string, unknown>
  detectedFields: { label: string; key: string; value: string }[]
}

/**
 * Remove markdown symbols (*, **, #, bullet points) to leave only clean text and numbers
 */
export function cleanMarkdownText(text: string): string {
  if (!text) return ''
  return text
    .replace(/\*\*/g, '')           // Remove bold **
    .replace(/\*/g, '')             // Remove asterisks *
    .replace(/^[\s\-\•\*\#]+/gm, '') // Remove leading bullets, dashes, hashes
    .replace(/[\*\#]+/g, '')        // Remove any remaining asterisks or hashes
    .trim()
}

/**
 * Parse OCR raw text based on field mappings or standard HRIS fields
 */
export function parseOcrText(
  rawText: string,
  fieldMapping?: Record<string, string>
): ParsedOcrResult {
  const cleanedRawText = cleanMarkdownText(rawText)
  const resultRow: Record<string, unknown> = {}
  const detectedFields: { label: string; key: string; value: string }[] = []

  if (!cleanedRawText) {
    return { rawText: '', parsedRow: {}, detectedFields: [] }
  }

  // Split lines
  const lines = cleanedRawText
    .split(/\r?\n/)
    .map(l => cleanMarkdownText(l))
    .filter(Boolean)

  let mainAddress = ''
  let rtRw = ''
  let kelDesa = ''
  let kecamatan = ''

  lines.forEach(line => {
    // Look for separator like :, =, or multiple spaces
    const parts = line.split(/[:=]/)
    if (parts.length >= 2) {
      const rawKey = cleanMarkdownText(parts[0])
      const rawVal = cleanMarkdownText(parts.slice(1).join(':'))

      if (rawKey && rawVal) {
        const cleanKey = rawKey.toLowerCase()

        // TTL (Tempat Tanggal Lahir)
        if (
          cleanKey.includes('ttl') ||
          (cleanKey.includes('tempat') && (cleanKey.includes('lahir') || cleanKey.includes('tgl')))
        ) {
          resultRow['ttl'] = rawVal
          resultRow['tempat_tanggal_lahir'] = rawVal

          // Split tempat & tanggal if comma exists
          if (rawVal.includes(',')) {
            const [tempat, tgl] = rawVal.split(',').map(s => s.trim())
            if (tempat) resultRow['tempat_lahir'] = tempat
            if (tgl) {
              resultRow['tanggal_lahir'] = tgl
              resultRow['tanggal'] = tgl
            }
          }
        }

        // Jenis Kelamin
        if (cleanKey.includes('jenis kelamin') || cleanKey === 'jk' || cleanKey.includes('sex')) {
          resultRow['jenis_kelamin'] = rawVal
        }

        // Agama
        if (cleanKey.includes('agama') || cleanKey.includes('religion')) {
          resultRow['agama'] = rawVal
        }

        // Address components
        if (cleanKey === 'alamat' || cleanKey.includes('alamat')) {
          mainAddress = rawVal
          resultRow['alamat_utama'] = rawVal
        } else if (cleanKey.includes('rt') || cleanKey.includes('rw')) {
          rtRw = rawVal
          resultRow['rt_rw'] = rawVal
        } else if (cleanKey.includes('kel') || cleanKey.includes('desa') || cleanKey.includes('kelurahan')) {
          kelDesa = rawVal
          resultRow['kel_desa'] = rawVal
        } else if (cleanKey.includes('kecamatan') || cleanKey === 'kec') {
          kecamatan = rawVal
          resultRow['kecamatan'] = rawVal
        }

        // Match against fieldMapping if provided
        if (fieldMapping) {
          for (const [header, mappedKey] of Object.entries(fieldMapping)) {
            if (cleanKey.includes(header.toLowerCase()) || header.toLowerCase().includes(cleanKey)) {
              resultRow[mappedKey] = rawVal
              detectedFields.push({ label: header, key: mappedKey, value: rawVal })
              break
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
        else if (cleanKey.includes('alasan') || cleanKey.includes('keterangan')) resultRow['keterangan'] = rawVal

        detectedFields.push({ label: rawKey, key: cleanKey.replace(/\s+/g, '_'), value: rawVal })
      }
    }
  })

  // Assemble combined Alamat field if address components exist
  const addressParts: string[] = []
  if (mainAddress) addressParts.push(mainAddress)
  if (rtRw) addressParts.push(`RT/RW: ${rtRw}`)
  if (kelDesa) addressParts.push(`Kel/Desa: ${kelDesa}`)
  if (kecamatan) addressParts.push(`Kecamatan: ${kecamatan}`)

  if (addressParts.length > 0) {
    const combinedAddress = addressParts.join(', ')
    resultRow['alamat'] = combinedAddress
    resultRow['rumah'] = combinedAddress

    if (fieldMapping) {
      for (const [header, mappedKey] of Object.entries(fieldMapping)) {
        if (header.toLowerCase().includes('alamat') || header.toLowerCase().includes('rumah')) {
          resultRow[mappedKey] = combinedAddress
        }
      }
    }
  }

  // Map TTL into mapped fields if fieldMapping provided
  if (resultRow['ttl'] && fieldMapping) {
    for (const [header, mappedKey] of Object.entries(fieldMapping)) {
      if (
        header.toLowerCase().includes('ttl') ||
        header.toLowerCase().includes('tempat tanggal') ||
        header.toLowerCase().includes('tanggal lahir')
      ) {
        if (!resultRow[mappedKey]) {
          resultRow[mappedKey] = resultRow['ttl']
        }
      }
    }
  }

  // Map Agama into mapped fields
  if (resultRow['agama'] && fieldMapping) {
    for (const [header, mappedKey] of Object.entries(fieldMapping)) {
      if (header.toLowerCase().includes('agama')) {
        resultRow[mappedKey] = resultRow['agama']
      }
    }
  }

  // Map Jenis Kelamin into mapped fields
  if (resultRow['jenis_kelamin'] && fieldMapping) {
    for (const [header, mappedKey] of Object.entries(fieldMapping)) {
      if (header.toLowerCase().includes('jenis kelamin') || header.toLowerCase().includes('jk')) {
        resultRow[mappedKey] = resultRow['jenis_kelamin']
      }
    }
  }

  // Fallback for nama if not detected in key-value
  if (!resultRow['nama']) {
    for (const line of lines) {
      if (!line.includes(':') && !line.includes('=') && /^[A-Z\s\.\,\']{3,40}$/i.test(line) && !/provinsi|kabupaten|kota|http|www|sk|surat/i.test(line)) {
        resultRow['nama'] = line
        detectedFields.push({ label: 'Nama (Detected)', key: 'nama', value: line })
        break
      }
    }
  }

  // Standard regex helpers for email, phone, nik
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i
  const phoneRegex = /\b(08\d{8,11}|\+62\d{9,12})\b/
  const nikRegex = /\b\d{16}\b/

  if (!resultRow['email']) {
    const emailMatch = cleanedRawText.match(emailRegex)
    if (emailMatch) resultRow['email'] = emailMatch[0]
  }
  if (!resultRow['no_hp']) {
    const phoneMatch = cleanedRawText.match(phoneRegex)
    if (phoneMatch) {
      resultRow['no_hp'] = phoneMatch[0]
      resultRow['telepon'] = phoneMatch[0]
    }
  }
  if (!resultRow['nik']) {
    const nikMatch = cleanedRawText.match(nikRegex)
    if (nikMatch) resultRow['nik'] = nikMatch[0]
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
    rawText: cleanedRawText,
    parsedRow: resultRow,
    detectedFields
  }
}
