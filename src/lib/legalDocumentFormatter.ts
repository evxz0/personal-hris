/**
 * Intelligent BNI Legal & SK Document Formatter
 * Transforms raw Mammoth docx HTML into pixel-perfect, official BNI legal document layouts.
 */

export function formatLegalDocumentHtml(rawHtml: string): string {
  if (!rawHtml || rawHtml.trim() === '') return '';

  // Extract clean text lines from HTML
  const rawParagraphs = rawHtml
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  if (rawParagraphs.length === 0) return rawHtml;

  const headerMeta: { key: string; val: string }[] = [];
  const titleLines: string[] = [];
  const menimbangItems: string[] = [];
  const mengingatItems: string[] = [];
  const memperhatikanItems: string[] = [];
  let isMemutuskan = false;
  let menetapkanText = '';
  let pertamaHeader = '';
  let subjectPerson = '';
  let subjectRole = '';
  const specs: { key: string; val: string }[] = [];
  let keduaText = '';
  let ketigaText = '';
  let keempatText = '';
  let closingNote = '';
  const signatureLines: string[] = [];

  let stage: 'header_or_title' | 'menimbang' | 'mengingat' | 'memperhatikan' | 'memutuskan' | 'pertama' | 'kedua' | 'ketiga' | 'keempat' | 'closing' = 'header_or_title';

  for (let i = 0; i < rawParagraphs.length; i++) {
    const line = rawParagraphs[i].trim();
    const upper = line.toUpperCase();

    // Skip unwanted watermark artifacts
    if (upper === 'HCMS DIGITAL SK' || upper.includes('WATERMARK') || upper === 'HCMS DIGITAL') {
      continue;
    }

    // Stage Transitions based on standard Indonesian SK Keywords
    if (upper.startsWith('MENIMBANG')) {
      stage = 'menimbang';
      const rest = line.replace(/^MENIMBANG\s*[:|]?\s*/i, '').trim();
      if (rest) menimbangItems.push(rest);
      continue;
    }

    if (upper.startsWith('MENGINGAT')) {
      stage = 'mengingat';
      const rest = line.replace(/^MENGINGAT\s*[:|]?\s*/i, '').trim();
      if (rest) mengingatItems.push(rest);
      continue;
    }

    if (upper.startsWith('MEMPERHATIKAN')) {
      stage = 'memperhatikan';
      const rest = line.replace(/^MEMPERHATIKAN\s*[:|]?\s*/i, '').trim();
      if (rest) memperhatikanItems.push(rest);
      continue;
    }

    if (upper.startsWith('MEMUTUSKAN')) {
      isMemutuskan = true;
      stage = 'memutuskan';
      continue;
    }

    if (upper.startsWith('MENETAPKAN')) {
      stage = 'pertama';
      menetapkanText = line.replace(/^MENETAPKAN\s*[:|]?\s*/i, '').trim();
      continue;
    }

    if (upper.startsWith('PERTAMA')) {
      stage = 'pertama';
      pertamaHeader = line.replace(/^PERTAMA\s*[:|]?\s*/i, '').trim();
      continue;
    }

    if (upper.startsWith('KEDUA')) {
      stage = 'kedua';
      keduaText = line.replace(/^KEDUA\s*[:|]?\s*/i, '').trim();
      continue;
    }

    if (upper.startsWith('KETIGA')) {
      stage = 'ketiga';
      ketigaText = line.replace(/^KETIGA\s*[:|]?\s*/i, '').trim();
      continue;
    }

    if (upper.startsWith('KEEMPAT')) {
      stage = 'keempat';
      keempatText = line.replace(/^KEEMPAT\s*[:|]?\s*/i, '').trim();
      continue;
    }

    if (upper.includes('SURAT KEPUTUSAN INI DISAMPAIKAN') || upper.includes('DIKETAHUI DAN DILAKSANAKAN')) {
      stage = 'closing';
      closingNote = line;
      continue;
    }

    // Process lines according to current stage
    if (stage === 'header_or_title') {
      if (/^(PUTUSAN|NOMOR|TANGGAL|HAL)\s*[:|]/i.test(line)) {
        const parts = line.split(/[:|]/);
        headerMeta.push({ key: parts[0].trim(), val: parts.slice(1).join(':').trim() });
        continue;
      }
      if (
        upper.includes('SURAT KEPUTUSAN') ||
        upper.includes('REGIONAL OFFICE') ||
        upper.includes('PT. BANK NEGARA INDONESIA') ||
        upper.includes('PERSERO')
      ) {
        titleLines.push(line);
        continue;
      }
    } else if (stage === 'menimbang') {
      menimbangItems.push(line);
    } else if (stage === 'mengingat') {
      mengingatItems.push(line);
    } else if (stage === 'memperhatikan') {
      memperhatikanItems.push(line);
    } else if (stage === 'pertama') {
      if (/^(SEBAGAI|UNIT|LOKASI|JABATAN|OUTLET)\s*[:|]/i.test(line)) {
        const parts = line.split(/[:|]/);
        specs.push({ key: parts[0].trim(), val: parts.slice(1).join(':').trim() });
        continue;
      }

      if (upper.startsWith('SDR.') || upper.startsWith('SDR ') || upper.startsWith('SDRI') || upper.includes('NPP')) {
        subjectPerson = line;
        continue;
      }

      if (
        !specs.some(s => s.key.toUpperCase() === 'SEBAGAI') &&
        !subjectRole &&
        subjectPerson
      ) {
        subjectRole = line;
        continue;
      }

      if (!pertamaHeader) {
        pertamaHeader = line;
        continue;
      }
    } else if (stage === 'kedua') {
      keduaText = keduaText ? `${keduaText} ${line}` : line;
    } else if (stage === 'ketiga') {
      ketigaText = ketigaText ? `${ketigaText} ${line}` : line;
    } else if (stage === 'keempat') {
      keempatText = keempatText ? `${keempatText} ${line}` : line;
    } else if (stage === 'closing') {
      signatureLines.push(line);
    }
  }

  // Fallback to enhanced general HTML if not an SK document
  if (titleLines.length === 0 && menimbangItems.length === 0 && !isMemutuskan) {
    return cleanUpGeneralHtml(rawHtml);
  }

  // Parse numbered items in clause lists (supporting "1. ", "a. ", or "Bahwa...")
  function parseNumberedItems(items: string[]): string[] {
    const result: string[] = [];
    let currentItem = '';

    for (const raw of items) {
      const isNewItem = /^(\d+[\.\)]|[a-zA-Z][\.\)]|Bahwa\b)/i.test(raw);
      if (isNewItem) {
        if (currentItem) result.push(currentItem);
        currentItem = raw;
      } else {
        if (currentItem) {
          currentItem += ' ' + raw;
        } else {
          currentItem = raw;
        }
      }
    }
    if (currentItem) result.push(currentItem);

    return result;
  }

  const cleanMenimbang = parseNumberedItems(menimbangItems);
  const cleanMengingat = parseNumberedItems(mengingatItems);
  const cleanMemperhatikan = parseNumberedItems(memperhatikanItems);

  // BUILD STRUCTURED OFFICIAL BNI SK HTML
  let out = '<div class="bni-sk-official-doc" style="font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.45; color: #000;">';

  // 1. Header Meta Table (Top Left)
  if (headerMeta.length > 0) {
    out += '<table style="border-collapse: collapse; margin-bottom: 12px; font-size: 9.5pt;">';
    headerMeta.forEach(m => {
      out += `<tr>
        <td style="width: 70px; padding: 1px 0; vertical-align: top; font-weight: normal;">${m.key}</td>
        <td style="width: 15px; padding: 1px 0; vertical-align: top; text-align: center;">:</td>
        <td style="padding: 1px 0; vertical-align: top;">${m.val}</td>
      </tr>`;
    });
    out += '</table>';
  }

  // 2. Centered Title Block
  if (titleLines.length > 0) {
    out += '<div style="text-align: center; margin: 16px 0 14px 0; line-height: 1.35;">';
    titleLines.forEach((t, idx) => {
      const isFirst = idx === 0;
      out += `<div style="font-weight: bold; font-size: ${isFirst ? '11pt' : '10.5pt'}; letter-spacing: ${isFirst ? '0.5px' : '0px'};">${t}</div>`;
    });
    out += '</div>';
  }

  // Helper to format clause rows
  function formatClauseRow(label: string, items: string[]) {
    if (items.length === 0) return '';
    let rowsHtml = '';

    items.forEach((item, idx) => {
      let num = `${idx + 1}.`;
      let text = item;

      // Extract existing numbering if present
      const matchNum = item.match(/^(\d+[\.\)]|[a-zA-Z][\.\)])\s*(.*)/s);
      if (matchNum) {
        num = matchNum[1];
        text = matchNum[2];
      }

      rowsHtml += `<div style="display: flex; align-items: flex-start; margin-bottom: 5px;">
        <span style="width: 22px; flex-shrink: 0; font-weight: normal;">${num}</span>
        <span style="text-align: justify; flex: 1;">${text}</span>
      </div>`;
    });

    return `<tr>
      <td style="width: 105px; vertical-align: top; padding: 3px 0; font-weight: normal;">${label}</td>
      <td style="width: 15px; vertical-align: top; padding: 3px 0; text-align: center;">:</td>
      <td style="vertical-align: top; padding: 3px 0;">${rowsHtml}</td>
    </tr>`;
  }

  // 3. Preamble Clauses Table (Menimbang, Mengingat, Memperhatikan)
  out += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">';
  out += formatClauseRow('Menimbang', cleanMenimbang);
  out += formatClauseRow('Mengingat', cleanMengingat);
  out += formatClauseRow('Memperhatikan', cleanMemperhatikan);
  out += '</table>';

  // 4. MEMUTUSKAN Banner
  if (isMemutuskan || titleLines.length > 0) {
    out += '<div style="text-align: center; font-weight: bold; font-size: 11pt; margin: 14px 0 10px 0; letter-spacing: 1px;">MEMUTUSKAN</div>';
  }

  // 5. Decision Clauses Table
  out += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">';

  // Menetapkan
  out += `<tr>
    <td style="width: 105px; vertical-align: top; padding: 2px 0;">Menetapkan</td>
    <td style="width: 15px; vertical-align: top; padding: 2px 0; text-align: center;">:</td>
    <td style="vertical-align: top; padding: 2px 0;">${menetapkanText}</td>
  </tr>`;

  // Pertama
  let pertamaBody = '';
  if (pertamaHeader) {
    pertamaBody += `<div style="margin-bottom: 8px;">${pertamaHeader}</div>`;
  }

  if (subjectPerson) {
    pertamaBody += `<div style="text-align: center; margin: 8px 0 10px 0;">
      <div style="font-weight: bold; text-decoration: underline;">${subjectPerson}</div>
      ${subjectRole ? `<div style="font-weight: bold; margin-top: 2px;">${subjectRole}</div>` : ''}
    </div>`;
  }

  if (specs.length > 0) {
    pertamaBody += '<table style="width: 100%; border-collapse: collapse; margin: 6px 0 8px 0;">';
    specs.forEach(s => {
      pertamaBody += `<tr>
        <td style="width: 80px; padding: 2px 0; vertical-align: top;">${s.key}</td>
        <td style="width: 15px; padding: 2px 0; vertical-align: top; text-align: center;">:</td>
        <td style="padding: 2px 0; vertical-align: top; font-weight: bold;">${s.val}</td>
      </tr>`;
    });
    pertamaBody += '</table>';
  }

  out += `<tr>
    <td style="width: 105px; vertical-align: top; padding: 3px 0;">Pertama</td>
    <td style="width: 15px; vertical-align: top; padding: 3px 0; text-align: center;">:</td>
    <td style="vertical-align: top; padding: 3px 0; text-align: justify;">${pertamaBody}</td>
  </tr>`;

  // Kedua
  if (keduaText) {
    out += `<tr>
      <td style="width: 105px; vertical-align: top; padding: 3px 0;">Kedua</td>
      <td style="width: 15px; vertical-align: top; padding: 3px 0; text-align: center;">:</td>
      <td style="vertical-align: top; padding: 3px 0; text-align: justify;">${keduaText}</td>
    </tr>`;
  }

  // Ketiga
  if (ketigaText) {
    out += `<tr>
      <td style="width: 105px; vertical-align: top; padding: 3px 0;">Ketiga</td>
      <td style="width: 15px; vertical-align: top; padding: 3px 0; text-align: center;">:</td>
      <td style="vertical-align: top; padding: 3px 0; text-align: justify;">${ketigaText}</td>
    </tr>`;
  }

  // Keempat
  if (keempatText) {
    out += `<tr>
      <td style="width: 105px; vertical-align: top; padding: 3px 0;">Keempat</td>
      <td style="width: 15px; vertical-align: top; padding: 3px 0; text-align: center;">:</td>
      <td style="vertical-align: top; padding: 3px 0; text-align: justify;">${keempatText}</td>
    </tr>`;
  }

  out += '</table>';

  // 6. Closing Note
  if (closingNote) {
    out += `<div style="margin-top: 14px; text-align: justify; font-size: 9.5pt; line-height: 1.4;">
      ${closingNote}
    </div>`;
  } else {
    out += `<div style="margin-top: 14px; text-align: justify; font-size: 9.5pt; line-height: 1.4;">
      Surat Keputusan ini disampaikan kepada yang bersangkutan melalui unitnya masing-masing untuk diketahui dan dilaksanakan sebagaimana mestinya, dengan tembusan kepada Unit Organisasi lain yang memerlukan.
    </div>`;
  }

  // 7. Signature Block (Bottom Left as in BNI standard SK)
  out += `<div style="margin-top: 16px; font-weight: bold; font-size: 10pt; line-height: 1.35;">
    <div>PT. BANK NEGARA INDONESIA(PERSERO) Tbk.</div>
    <div>REGIONAL OFFICE 09</div>
    <div style="height: 48px;"></div>
    <div>${signatureLines.length > 0 ? signatureLines.join(' - ') : '[PENANDATANGAN_NAMA]'}</div>
  </div>`;

  out += '</div>';

  return out;
}

/**
 * Fallback cleaner for non-SK custom letters (Surat Keterangan, Surat Izin, etc.)
 */
function cleanUpGeneralHtml(html: string): string {
  return html
    .replace(/<table/gi, '<table style="width:100%;border-collapse:collapse;margin:8px 0;"')
    .replace(/<td/gi, '<td style="vertical-align:top;padding:3px 4px;"')
    .replace(/<p/gi, '<p style="margin:0 0 8px 0;line-height:1.45;text-align:justify;"');
}
