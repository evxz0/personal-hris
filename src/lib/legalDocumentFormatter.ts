/**
 * Intelligent BNI Legal & SK Document Formatter
 * Transforms raw Mammoth docx HTML into pixel-perfect, official BNI legal document layouts.
 */

export function formatLegalDocumentHtml(rawHtml: string): string {
  if (!rawHtml || rawHtml.trim() === '') return '';

  // Extract clean text lines from HTML paragraphs or tables
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = rawHtml;

  // If the document is already a nicely formatted custom table, preserve basic structure
  // but enhance styling
  const rawParagraphs: string[] = [];

  // Recursively collect text chunks / paragraphs
  function collectNodes(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toUpperCase();

      if (tag === 'TABLE') {
        // Collect rows
        const rows = Array.from(el.querySelectorAll('tr'));
        rows.forEach(r => {
          const cells = Array.from(r.querySelectorAll('td, th')).map(c => c.textContent?.trim() || '');
          const combined = cells.filter(Boolean).join(' | ');
          if (combined) rawParagraphs.push(combined);
        });
        return;
      }

      if (['P', 'H1', 'H2', 'H3', 'H4', 'DIV', 'LI'].includes(tag)) {
        const text = el.textContent?.trim() || '';
        if (text) rawParagraphs.push(text);
        return;
      }
    }

    node.childNodes.forEach(collectNodes);
  }

  collectNodes(tempDiv);

  if (rawParagraphs.length === 0) {
    return rawHtml;
  }

  // State machine to identify SK sections
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

  let currentSection: 'header' | 'title' | 'menimbang' | 'mengingat' | 'memperhatikan' | 'memutuskan' | 'pertama' | 'kedua' | 'ketiga' | 'closing' = 'header';

  for (let i = 0; i < rawParagraphs.length; i++) {
    const rawLine = rawParagraphs[i].trim();
    const upper = rawLine.toUpperCase();

    // 1. Header Meta (Putusan, Nomor, Tanggal, Hal)
    if (
      currentSection === 'header' &&
      (/^(PUTUSAN|NOMOR|TANGGAL|HAL|NO)\s*[:|]/i.test(rawLine) ||
        /^(KP\/\d+|KEPUTUSAN|SURAT)/i.test(rawLine))
    ) {
      const parts = rawLine.split(/[:|]/);
      if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join(':').trim();
        headerMeta.push({ key: k, val: v });
        continue;
      }
    }

    // 2. Title Block (SURAT KEPUTUSAN / REGIONAL OFFICE 09 / PT. BANK NEGARA INDONESIA)
    if (
      upper.includes('SURAT KEPUTUSAN') ||
      upper.includes('SURAT KETERANGAN') ||
      upper.includes('SURAT TUGAS') ||
      upper.includes('SURAT EDARAN') ||
      (currentSection === 'header' && (upper.includes('REGIONAL OFFICE') || upper.includes('PT. BANK NEGARA INDONESIA')))
    ) {
      currentSection = 'title';
      titleLines.push(rawLine);
      continue;
    }

    if (currentSection === 'title') {
      if (
        upper.includes('REGIONAL OFFICE') ||
        upper.includes('PT. BANK NEGARA INDONESIA') ||
        upper.includes('PERSERO') ||
        upper.includes('CABANG')
      ) {
        titleLines.push(rawLine);
        continue;
      } else {
        currentSection = 'menimbang';
      }
    }

    // 3. Preamble Sections (Menimbang, Mengingat, Memperhatikan)
    if (upper.startsWith('MENIMBANG')) {
      currentSection = 'menimbang';
      const rest = rawLine.replace(/^MENIMBANG\s*[:|]?\s*/i, '').trim();
      if (rest) menimbangItems.push(rest);
      continue;
    }

    if (upper.startsWith('MENGINGAT')) {
      currentSection = 'mengingat';
      const rest = rawLine.replace(/^MENGINGAT\s*[:|]?\s*/i, '').trim();
      if (rest) mengingatItems.push(rest);
      continue;
    }

    if (upper.startsWith('MEMPERHATIKAN')) {
      currentSection = 'memperhatikan';
      const rest = rawLine.replace(/^MEMPERHATIKAN\s*[:|]?\s*/i, '').trim();
      if (rest) memperhatikanItems.push(rest);
      continue;
    }

    if (upper.startsWith('MEMUTUSKAN')) {
      isMemutuskan = true;
      currentSection = 'memutuskan';
      continue;
    }

    if (currentSection === 'menimbang') {
      if (!upper.startsWith('MENGINGAT') && !upper.startsWith('MEMPERHATIKAN') && !upper.startsWith('MEMUTUSKAN')) {
        // Skip watermark artifacts like "HCMS Digital SK"
        if (!upper.includes('HCMS DIGITAL') && !upper.includes('WATERMARK')) {
          menimbangItems.push(rawLine);
        }
        continue;
      }
    }

    if (currentSection === 'mengingat') {
      if (!upper.startsWith('MEMPERHATIKAN') && !upper.startsWith('MEMUTUSKAN')) {
        if (!upper.includes('HCMS DIGITAL') && !upper.includes('WATERMARK')) {
          mengingatItems.push(rawLine);
        }
        continue;
      }
    }

    if (currentSection === 'memperhatikan') {
      if (!upper.startsWith('MEMUTUSKAN')) {
        if (!upper.includes('HCMS DIGITAL') && !upper.includes('WATERMARK')) {
          memperhatikanItems.push(rawLine);
        }
        continue;
      }
    }

    // 4. Decision Clauses (Menetapkan, Pertama, Kedua, Ketiga, Keempat)
    if (upper.startsWith('MENETAPKAN')) {
      menetapkanText = rawLine.replace(/^MENETAPKAN\s*[:|]?\s*/i, '').trim();
      currentSection = 'pertama';
      continue;
    }

    if (upper.startsWith('PERTAMA')) {
      currentSection = 'pertama';
      pertamaHeader = rawLine.replace(/^PERTAMA\s*[:|]?\s*/i, '').trim();
      continue;
    }

    if (upper.startsWith('KEDUA')) {
      currentSection = 'kedua';
      keduaText = rawLine.replace(/^KEDUA\s*[:|]?\s*/i, '').trim();
      continue;
    }

    if (upper.startsWith('KETIGA')) {
      currentSection = 'ketiga';
      ketigaText = rawLine.replace(/^KETIGA\s*[:|]?\s*/i, '').trim();
      continue;
    }

    if (upper.startsWith('KEEMPAT')) {
      currentSection = 'ketiga';
      keempatText = rawLine.replace(/^KEEMPAT\s*[:|]?\s*/i, '').trim();
      continue;
    }

    // Capture Sub-specs (Sebagai, Unit, Lokasi, etc.)
    if (currentSection === 'pertama') {
      if (/^(SEBAGAI|UNIT|LOKASI|JABATAN|GRADE|OUTLET)\s*[:|]/i.test(rawLine)) {
        const parts = rawLine.split(/[:|]/);
        specs.push({ key: parts[0].trim(), val: parts.slice(1).join(':').trim() });
        continue;
      }

      if (upper.startsWith('SDR.') || upper.startsWith('SDR ') || upper.startsWith('SDRI') || upper.includes('NPP.')) {
        subjectPerson = rawLine;
        continue;
      }

      if (
        (upper.includes('LEADER') || upper.includes('MANAGER') || upper.includes('OFFICER') || upper.includes('GRADE')) &&
        !specs.some(s => s.key.toUpperCase() === 'SEBAGAI') &&
        !subjectRole
      ) {
        subjectRole = rawLine;
        continue;
      }

      if (!pertamaHeader) {
        pertamaHeader = rawLine;
        continue;
      }
    }

    if (currentSection === 'kedua') {
      keduaText = keduaText ? `${keduaText} ${rawLine}` : rawLine;
      continue;
    }

    if (currentSection === 'ketiga') {
      ketigaText = ketigaText ? `${ketigaText} ${rawLine}` : rawLine;
      continue;
    }

    // 5. Closing & Signature
    if (upper.includes('SURAT KEPUTUSAN INI DISAMPAIKAN') || upper.includes('DIKETAHUI DAN DILAKSANAKAN')) {
      closingNote = rawLine;
      currentSection = 'closing';
      continue;
    }

    if (currentSection === 'closing') {
      signatureLines.push(rawLine);
    }
  }

  // If unable to parse standard SK structure, fallback to enhanced clean paragraphs
  if (titleLines.length === 0 && menimbangItems.length === 0 && !isMemutuskan) {
    return cleanUpGeneralHtml(rawHtml);
  }

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

  // Helper to format clause items
  function formatClauseRow(label: string, items: string[]) {
    if (items.length === 0) return '';
    let rowsHtml = '';

    items.forEach((item, idx) => {
      let num = `${idx + 1}.`;
      let text = item;

      // If text already has numbering like "1. Bahwa ..."
      const matchNum = item.match(/^(\d+[\.\)])\s*(.*)/s);
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
  out += formatClauseRow('Menimbang', menimbangItems);
  out += formatClauseRow('Mengingat', mengingatItems);
  out += formatClauseRow('Memperhatikan', memperhatikanItems);
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
