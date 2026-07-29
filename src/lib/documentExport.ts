import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Export a DOM element (like A4 document preview) directly to a pixel-perfect PDF file
 */
export async function exportElementToPDF(element: HTMLElement, fileName: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  })

  const imgData = canvas.toDataURL('image/jpeg', 0.98)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
  pdf.save(`${fileName}.pdf`)
}

/**
 * Export a DOM element HTML content directly to a Microsoft Word (.doc) document
 */
export function exportElementToWord(element: HTMLElement, fileName: string) {
  const content = element.innerHTML
  const html = `
    <!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${fileName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0.75in 0.5in 0.5in 0.75in;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9.5pt;
          line-height: 1.35;
          color: #000;
        }
        table { border-collapse: collapse; width: 100%; }
        td, th { vertical-align: top; padding: 2px 0; }
        b, strong { font-weight: bold; }
        u { text-decoration: underline; }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `

  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword'
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
