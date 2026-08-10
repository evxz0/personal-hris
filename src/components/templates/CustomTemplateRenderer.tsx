import React from 'react';
import { formatLegalDocumentHtml } from '../../lib/legalDocumentFormatter';

interface Props {
  htmlContent: string;
  placeholderValues: Record<string, string>;
  hideLogo?: boolean;
}

/**
 * Replace placeholders in HTML string.
 * Supports format: [NAMA], [NPP], {NAMA}, {NPP}, %NAMA%, etc.
 */
export function replacePlaceholdersInHtml(html: string, values: Record<string, string>): string {
  if (!html) return '';

  let processed = html;

  // Replace each key in values
  Object.entries(values).forEach(([key, val]) => {
    if (!key) return;
    const cleanVal = val ?? '';

    // Regex for bracketed [KEY] or {KEY} or %KEY% case-insensitive
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:\\[${escapedKey}\\]|\\{${escapedKey}\\}|%${escapedKey}%)`, 'gi');
    processed = processed.replace(regex, cleanVal);
  });

  return processed;
}

export const CustomTemplateRenderer = React.forwardRef<HTMLDivElement, Props>(({ htmlContent, placeholderValues, hideLogo = false }, ref) => {
  const structuredHtml = htmlContent.includes('bni-sk-official-doc')
    ? htmlContent
    : formatLegalDocumentHtml(htmlContent);

  const finalHtml = replacePlaceholdersInHtml(structuredHtml, placeholderValues);

  return (
    <div ref={ref} className="sk-custom-paper">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.75in 0.5in 0.5in 0.75in;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sk-custom-paper, .sk-custom-paper * {
            visibility: visible;
          }
          .sk-custom-paper {
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 10pt !important;
            line-height: 1.4 !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }
        }
        .sk-custom-paper {
          width: 210mm;
          min-height: 297mm;
          padding: 0.75in 0.5in 0.5in 0.75in;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: #000;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          margin: 0 auto;
          box-sizing: border-box;
        }
        .sk-custom-body table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        .sk-custom-body table td {
          vertical-align: top;
          padding: 2px 4px;
        }
        .sk-custom-body p {
          margin: 0 0 10px 0;
          line-height: 1.45;
        }
      `}</style>

      {/* Header: Logo BNI on Top Right */}
      {!hideLogo && (
        <div style={{ textAlign: 'right', marginTop: '4px', marginBottom: '8px' }}>
          <img
            src="/logo-kop-bni.jpg"
            alt="BNI Logo"
            style={{ height: '1.25cm', width: '4.09cm', objectFit: 'contain', display: 'inline-block' }}
          />
        </div>
      )}

      {/* Dynamic Rendered Content from Word Document */}
      <div
        className="sk-custom-body"
        dangerouslySetInnerHTML={{ __html: finalHtml }}
      />
    </div>
  );
});

CustomTemplateRenderer.displayName = 'CustomTemplateRenderer';
