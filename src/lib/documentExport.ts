import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Helper to convert all <img> elements inside a container to Base64 data URIs
 * so Microsoft Word embeds images natively without rendering broken [x] boxes.
 */
async function convertImagesToBase64(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'))
  for (const img of images) {
    const src = img.getAttribute('src')
    if (!src) continue

    // Skip if already base64
    if (src.startsWith('data:')) continue

    try {
      // Resolve to absolute URL
      const absoluteUrl = new URL(src, window.location.href).href
      const response = await fetch(absoluteUrl)
      const blob = await response.blob()

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      img.setAttribute('src', base64)
    } catch (err) {
      console.warn('Failed to convert image to base64 for Word export:', src, err)
    }
  }
}

/**
 * Export a DOM element (like A4 document preview) directly to a pixel-perfect PDF file
 * Renders an unscaled, 1:1 clone in an off-screen container to guarantee precise word spacing & typography.
 */
export async function exportElementToPDF(element: HTMLElement, fileName: string) {
  // Create off-screen container for unscaled 1:1 rendering
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '210mm'
  container.style.minHeight = '297mm'
  container.style.transform = 'none'
  container.style.zIndex = '-9999'
  container.style.background = '#ffffff'

  // Clone element
  const clone = element.cloneNode(true) as HTMLElement
  clone.style.transform = 'none'
  clone.style.margin = '0'
  clone.style.boxShadow = 'none'

  container.appendChild(clone)
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(clone, {
      scale: 3, // High DPI rendering
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200
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
  } finally {
    document.body.removeChild(container)
  }
}

/**
 * Export a DOM element HTML content directly to a Microsoft Word (.doc) document
 * Converts all images (including BNI Logo) to Base64 so Word embeds them natively.
 */
export async function exportElementToWord(element: HTMLElement, fileName: string) {
  // Clone element to convert images to Base64 without mutating the live UI
  const clone = element.cloneNode(true) as HTMLElement
  await convertImagesToBase64(clone)

  const content = clone.innerHTML
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
          line-height: 1.4;
          color: #000;
        }
        table { border-collapse: collapse; width: 100%; }
        td, th { vertical-align: top; padding: 2px 0; }
        b, strong { font-weight: bold; }
        u { text-decoration: underline; }
        img { max-width: 100%; height: auto; display: inline-block; }
        p { margin: 0 0 10px 0; }
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
