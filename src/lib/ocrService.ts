import axios from 'axios'

const OCR_SERVICE_URL = import.meta.env.VITE_OCR_SERVICE_URL || 'https://hris-ocr-service-pkp-1.vercel.app/extract-document'
const OCR_SECRET_TOKEN = import.meta.env.VITE_OCR_SECRET_TOKEN || '8e82e84046a7a55c80a03838612f21d6'

export interface OcrResponse {
  success: boolean
  extracted_text?: string
  error?: string
  message?: string
}

/**
 * Upload scanned document/image file to Vercel Gemini OCR Service
 * @param file Scanned image / PDF / Document file
 */
export async function extractDocumentScan(file: File): Promise<OcrResponse> {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await axios.post<OcrResponse>(
      OCR_SERVICE_URL,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${OCR_SECRET_TOKEN}`
        }
      }
    )

    if (response.data && response.data.success) {
      console.log('Teks hasil scan berhasil didapat:', response.data.extracted_text)
    }

    return response.data
  } catch (error: unknown) {
    console.error('Gagal mengekstrak berkas di server Vercel:', error)
    let errMessage = 'Terjadi kendala keamanan atau server saat membaca dokumen.'
    if (axios.isAxiosError(error) && error.response?.data) {
      errMessage = error.response.data.detail || error.response.data.error || error.response.data.message || errMessage
    } else if (error instanceof Error) {
      errMessage = error.message
    }
    return {
      success: false,
      error: errMessage
    }
  }
}
