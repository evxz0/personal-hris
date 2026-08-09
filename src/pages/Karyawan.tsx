import { Plus, Search, Edit2, Trash2, Users, FileDown, FileText, ArrowRightLeft, Type } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useKaryawan, useAddKaryawan, useUpdateKaryawan, useDeleteKaryawan, useBulkDeleteKaryawan, useBulkInsertKaryawan, useUppercaseAllNames, type Karyawan, type KaryawanInsert } from '../hooks/useKaryawan'
import { useAddMutasi } from '../hooks/useMutasi'
import { useReferensi } from '../hooks/useReferensi'
import { DataTable } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea, MultiSelect } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ImportModal } from '../components/ui/ImportModal'
import { ImportDropdown, type ImportMode } from '../components/ui/ImportDropdown'
import { exportToXLSX, exportToPDF } from '../lib/importExport'
import { formatDate } from '../lib/utils'

const EMPTY: KaryawanInsert = {
  npp: '', nama: '', kategori: 'FTE', outlet: null, tanggal_lahir: null,
  posisi_saat_ini: null, jenjang: null, jabatan: null, grade: null,
  nik: null, npp_digi_hc: null, npp_webmail: null,
  jenis_kelamin: null, tanggal_mulai: null, tanggal_berakhir: null, kd_wil: null, batch: null,
  no_rek: null, no_hp: null, sisa_cuti: 18,
}

const parseDateStringToISO = (val: any): string | null => {
  if (!val) return null
  const s = String(val).trim()
  if (!s) return null

  const cleanStr = s.includes(',') ? s.split(',')[1].trim() : s

  // 1. Direct YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    return cleanStr
  }

  // 2. Indonesian Month Names map
  const MONTH_MAP: Record<string, string> = {
    januari: '01', jan: '01', februari: '02', feb: '02', maret: '03', mar: '03',
    april: '04', apr: '04', mei: '05', juni: '06', jun: '06', juli: '07', jul: '07',
    agustus: '08', agu: '08', ags: '08', september: '09', sep: '09', oktober: '10', okt: '10',
    november: '11', nov: '11', desember: '12', des: '12'
  }

  const indoMatch = cleanStr.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
  if (indoMatch) {
    const day = indoMatch[1].padStart(2, '0')
    const mStr = indoMatch[2].toLowerCase()
    const month = MONTH_MAP[mStr]
    const year = indoMatch[3]
    if (month) return `${year}-${month}-${day}`
  }

  // 3. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = cleanStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch
    const formattedDay = day.padStart(2, '0')
    const formattedMonth = month.padStart(2, '0')
    return `${year}-${formattedMonth}-${formattedDay}`
  }

  // 4. Excel Serial Date
  if (/^\d+(\.\d+)?$/.test(cleanStr)) {
    const num = Number(cleanStr)
    if (num > 20000 && num < 60000) {
      const date = new Date((num - 25569) * 86400 * 1000)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    }
  }

  // 5. Fallback JS Date
  try {
    const parsed = new Date(cleanStr)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  } catch (e) {
    // Ignore
  }

  return cleanStr
}

export const formatGradeValue = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined || val === '') return ''
  const s = String(val).trim().toUpperCase()
  if (s.includes('NON')) return '.NON.GRADE'
  const num = s.replace(/\D/g, '')
  if (num) return `.GRADE.${num}`
  return s
}

const KARYAWAN_FIELD_MAPPING: Record<string, string> = {
  'NPP': 'npp', 'Nama': 'nama', 'NIK': 'nik',
  'TTL': 'ttl', 'Tempat Tanggal Lahir': 'ttl',
  'Jenis Kelamin': 'jenis_kelamin', 'Alamat': 'alamat', 'Agama': 'agama',
  'Kategori': 'kategori', 'Outlet': 'outlet', 'Tanggal Lahir': 'tanggal_lahir',
  'Posisi Saat Ini': 'posisi_saat_ini', 'Jenjang': 'jenjang',
  'Jabatan': 'jabatan', 'Grade': 'grade',
  'NPP DIGI HC': 'npp_digi_hc', 'NPP WEBMAIL': 'npp_webmail',
  'Tanggal Mulai': 'tanggal_mulai', 'Tanggal Berakhir': 'tanggal_berakhir',
  'KD Wil': 'kd_wil', 'Batch': 'batch',
  'No Rekening': 'no_rek', 'No HP': 'no_hp',
}

const TEMPLATE_HEADERS = ['NPP','Nama','NIK','TTL','Jenis Kelamin','Alamat','Agama','Kategori','Outlet','Tanggal Lahir','Posisi Saat Ini','Jenjang','Jabatan','Grade','NPP DIGI HC','NPP WEBMAIL','Tanggal Mulai','Tanggal Berakhir','KD Wil','Batch','No Rekening','No HP']

import { useState, useEffect } from 'react'

export default function KaryawanPage() {
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState<string[]>([])
  const [filterOutlet, setFilterOutlet] = useState<string[]>([])
  const [filterJabatan, setFilterJabatan] = useState<string[]>([])
  const [filterGrade, setFilterGrade] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('excel')
   const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [form, setForm] = useState<KaryawanInsert>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  
  const [mutasiOpen, setMutasiOpen] = useState(false)
  const [mutasiForm, setMutasiForm] = useState<{
    npp: string; nama: string; kategori: string; outlet: string; jenjang: string;
    jabatan: string; grade: string | number; tanggal_lahir: string; nik: string; no_rek: string; no_hp: string;
    sisa_cuti: number; keterangan: string; tanggal_aktif: string;
  }>({
    npp: '', nama: '', kategori: 'FTE', outlet: '', jenjang: '',
    jabatan: '', grade: '', tanggal_lahir: '', nik: '', no_rek: '', no_hp: '',
    sisa_cuti: 18, keterangan: '', tanggal_aktif: ''
  })

  const { data: rawData = [], isLoading } = useKaryawan(search)
  const { data: outlets = [] } = useReferensi('OUTLET')
  const { data: jabatans = [] } = useReferensi('JABATAN_KARYAWAN')

  const addMutation      = useAddKaryawan()
  const updateMutation   = useUpdateKaryawan()
  const deleteMutation   = useDeleteKaryawan()
  const bulkDeleteMutation = useBulkDeleteKaryawan()
  const bulkInsert       = useBulkInsertKaryawan()
  const mutasiMutation   = useAddMutasi()
  const uppercaseMutation = useUppercaseAllNames()

  const categoryOrder: Record<string, number> = { 'FTE': 1, 'TAD': 2, 'BINA': 3 }

  const data = rawData
    .filter(k => {
      if (filterKategori.length > 0 && !filterKategori.includes(k.kategori)) return false
      if (filterOutlet.length > 0 && (!k.outlet || !filterOutlet.includes(k.outlet))) return false
      if (filterJabatan.length > 0 && (!k.jabatan || !filterJabatan.includes(k.jabatan))) return false
      if (filterGrade.length > 0 && (k.grade === null || k.grade === undefined || !filterGrade.includes(String(k.grade)))) return false
      return true
    })
    .sort((a, b) => {
      if (filterKategori.length > 0) {
        const orderA = categoryOrder[a.kategori] || 99
        const orderB = categoryOrder[b.kategori] || 99
        if (orderA !== orderB) return orderA - orderB
      }
      return (a.nama || '').localeCompare(b.nama || '')
    })

  const openAdd = () => {
    setForm({
      ...EMPTY,
      kategori: filterKategori.length === 1 ? (filterKategori[0] as any) : 'FTE'
    })
    setEditId(null)
    setModalOpen(true)
  }
  const openEdit = (k: Karyawan) => {
    setForm({ ...k })
    setEditId(k.id)
    setModalOpen(true)
  }

  const openMutasi = (k: Karyawan) => {
    setMutasiForm({
      npp: k.npp,
      nama: k.nama,
      kategori: k.kategori,
      outlet: k.outlet || '',
      jenjang: k.jenjang || '',
      jabatan: k.jabatan || '',
      grade: k.grade || '',
      tanggal_lahir: k.tanggal_lahir || '',
      nik: k.nik || '',
      no_rek: k.no_rek || '',
      no_hp: k.no_hp || '',
      sisa_cuti: k.sisa_cuti || 18,
      keterangan: '',
      tanggal_aktif: ''
    })
    setMutasiOpen(true)
  }

  const handleSave = async () => {
    try {
      const { id, created_at, ...cleanForm } = form as any

      let parsedGrade: number | null = null
      if (cleanForm.grade !== null && cleanForm.grade !== undefined && cleanForm.grade !== '') {
        const gradeStr = String(cleanForm.grade).trim().toUpperCase()
        if (!gradeStr.includes('NON')) {
          const numMatch = gradeStr.match(/\d+/)
          if (numMatch) {
            parsedGrade = parseInt(numMatch[0], 10)
          }
        }
      }

      const payload: KaryawanInsert = {
        ...cleanForm,
        nama: String(cleanForm.nama || '').toUpperCase().trim(),
        grade: parsedGrade,
        tanggal_lahir: cleanForm.tanggal_lahir || null,
        tanggal_mulai: cleanForm.tanggal_mulai || null,
        tanggal_berakhir: cleanForm.tanggal_berakhir || null,
        outlet: cleanForm.outlet || null,
        jenjang: cleanForm.jenjang || null,
        jabatan: cleanForm.jabatan || null,
        nik: cleanForm.nik || null,
        no_rek: cleanForm.no_rek || null,
        no_hp: cleanForm.no_hp || null,
      }

      if (editId) {
        await updateMutation.mutateAsync({ id: editId, payload })
      } else {
        await addMutation.mutateAsync(payload)
      }
      setModalOpen(false)
    } catch (err: any) {
      console.error('Error saving karyawan:', err)
      alert(`Gagal menyimpan data karyawan: ${err?.message || JSON.stringify(err)}`)
    }
  }

  const handleSaveMutasi = async () => {
    try {
      const { id, created_at, ...cleanMutasi } = mutasiForm as any

      let parsedGrade: number | null = null
      if (cleanMutasi.grade !== null && cleanMutasi.grade !== undefined && cleanMutasi.grade !== '') {
        const gradeStr = String(cleanMutasi.grade).trim().toUpperCase()
        if (!gradeStr.includes('NON')) {
          const numMatch = gradeStr.match(/\d+/)
          if (numMatch) {
            parsedGrade = parseInt(numMatch[0], 10)
          }
        }
      }

      await mutasiMutation.mutateAsync({
        ...cleanMutasi,
        nama: String(cleanMutasi.nama || '').toUpperCase().trim(),
        grade: parsedGrade || 1
      })
      setMutasiOpen(false)
    } catch (err: any) {
      console.error(err)
      alert(`Gagal memproses mutasi: ${err?.message || JSON.stringify(err)}`)
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteMutation.mutateAsync(deleteId)
      } catch (err: any) {
        console.error(err)
        alert(`Gagal menghapus karyawan: ${err?.message || JSON.stringify(err)}`)
      } finally {
        setDeleteId(null)
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length > 0) {
      try {
        await bulkDeleteMutation.mutateAsync(selectedIds)
      } catch (err: any) {
        console.error(err)
        alert(`Gagal menghapus massal karyawan: ${err?.message || JSON.stringify(err)}`)
      } finally {
        setSelectedIds([])
        setBulkDeleteOpen(false)
      }
    }
  }

  useEffect(() => {
    setSelectedIds([])
  }, [search, filterKategori, filterOutlet, filterJabatan, filterGrade])

  const handleImport = async (rows: Record<string, unknown>[]) => {
    const mapped = rows.map(r => {
      const isBina = String(r.kategori ?? '').toUpperCase() === 'BINA'
      const isTad = String(r.kategori ?? '').toUpperCase() === 'TAD'
      
      const digiHc = r.npp_digi_hc ? String(r.npp_digi_hc).trim() : null
      const webmail = r.npp_webmail ? String(r.npp_webmail).trim() : null
      
      // Fallback for npp: if empty or simple row sequence number (1-3 digits), use digiHc/webmail or generate ID
      let nppVal = String(r.npp ?? '').trim()
      if (!nppVal || /^\d{1,3}$/.test(nppVal)) {
        if (isTad && digiHc) {
          nppVal = digiHc
        } else if (isTad && webmail) {
          nppVal = webmail
        } else {
          nppVal = `GEN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        }
      }

      const gradeRaw = r.grade ? Number(r.grade) : null
      const validGrade = gradeRaw && gradeRaw >= 1 && gradeRaw <= 12 ? gradeRaw : null
      return {
        ...EMPTY,
        npp: nppVal,
        nama: String(r.nama ?? '').toUpperCase().trim(),
        kategori: (isTad ? 'TAD' : isBina ? 'BINA' : 'FTE') as 'FTE'|'TAD'|'BINA',
        outlet: r.outlet ? String(r.outlet) : null,
        tanggal_lahir: parseDateStringToISO(r.tanggal_lahir || r.ttl || r.tempat_tanggal_lahir),
        posisi_saat_ini: isBina ? null : r.posisi_saat_ini ? String(r.posisi_saat_ini) : null,
        jenjang: isBina ? null : r.jenjang ? String(r.jenjang) : null,
        jabatan: r.jabatan ? String(r.jabatan) : null,
        grade: isTad ? null : validGrade,
        nik: r.nik ? String(r.nik) : null,
        npp_digi_hc: isTad ? digiHc : null,
        npp_webmail: isTad ? webmail : null,
        jenis_kelamin: r.jenis_kelamin ? String(r.jenis_kelamin) : null,
        tanggal_mulai: isBina ? parseDateStringToISO(r.tanggal_mulai) : null,
        tanggal_berakhir: isBina ? parseDateStringToISO(r.tanggal_berakhir) : null,
        kd_wil: isBina && r.kd_wil ? String(r.kd_wil) : null,
        batch: isBina && r.batch ? String(r.batch) : null,
        no_rek: r.no_rek ? String(r.no_rek) : null,
        no_hp: r.no_hp ? String(r.no_hp) : null,
        sisa_cuti: 18,
      }
    })

    // Filter out duplicate NPPs in the same import batch to prevent ON CONFLICT DO UPDATE crash
    const uniqueMapped: typeof mapped = []
    const seenNpps = new Set<string>()
    for (const item of mapped) {
      if (!seenNpps.has(item.npp)) {
        seenNpps.add(item.npp)
        uniqueMapped.push(item)
      }
    }

    await bulkInsert.mutateAsync(uniqueMapped)
  }

  const handleExportXLSX = () => {
    exportToXLSX(data.map(k => ({
      NPP: k.npp,
      'NPP DIGI HC': k.npp_digi_hc || '-',
      'NPP WEBMAIL': k.npp_webmail || '-',
      Nama: k.nama, Kategori: k.kategori,
      Outlet: k.outlet,
      'Jenis Kelamin': k.jenis_kelamin || '-',
      TTL: formatDate(k.tanggal_lahir),
      'Posisi': k.posisi_saat_ini, Jenjang: k.jenjang,
      Jabatan: k.jabatan,
      'Tgl Mulai': formatDate(k.tanggal_mulai),
      'Tgl Berakhir': formatDate(k.tanggal_berakhir),
      'KD Wil': k.kd_wil || '-',
      Grade: k.grade || '-',
      Batch: k.batch ? `Batch ${k.batch}` : '-',
      NIK: k.nik || '-',
      'No Rek': k.no_rek || '-', 'No HP': k.no_hp || '-',
    })), 'Master_Karyawan')
  }

  const handleExportPDF = () => {
    exportToPDF(
      data.map(k => ({
        ...k,
        tanggal_lahir: formatDate(k.tanggal_lahir),
        tanggal_mulai: formatDate(k.tanggal_mulai),
        tanggal_berakhir: formatDate(k.tanggal_berakhir),
      })) as unknown as Record<string, unknown>[],
      [
        { header: 'NPP', dataKey: 'npp' },
        { header: 'NPP DIGI HC', dataKey: 'npp_digi_hc' },
        { header: 'NPP WEBMAIL', dataKey: 'npp_webmail' },
        { header: 'Nama', dataKey: 'nama' },
        { header: 'Kategori', dataKey: 'kategori' },
        { header: 'Outlet', dataKey: 'outlet' },
        { header: 'Jenis Kelamin', dataKey: 'jenis_kelamin' },
        { header: 'Jenjang', dataKey: 'jenjang' },
        { header: 'Jabatan', dataKey: 'jabatan' },
        { header: 'Tgl Mulai', dataKey: 'tanggal_mulai' },
        { header: 'Tgl Berakhir', dataKey: 'tanggal_berakhir' },
        { header: 'KD Wil', dataKey: 'kd_wil' },
        { header: 'Grade', dataKey: 'grade' },
        { header: 'Batch', dataKey: 'batch' },
        { header: 'TTL', dataKey: 'tanggal_lahir' },
      ],
      'Master Data Karyawan (FTE & TAD)',
      'Master_Karyawan'
    )
  }

  const renderNameCell = (val: unknown) => {
    const str = String(val || '')
    if (!str) return '-'
    const words = str.trim().split(/\s+/).filter(Boolean)
    const isNoWrap = words.length <= 3
    return (
      <span className={`font-semibold ${isNoWrap ? 'whitespace-nowrap' : 'break-words max-w-[200px]'}`}>
        {str}
      </span>
    )
  }

  const getColumns = () => {
    const isTad = filterKategori.length === 1 && filterKategori.includes('TAD')
    const isFte = filterKategori.length === 1 && filterKategori.includes('FTE')
    const isBina = filterKategori.length === 1 && filterKategori.includes('BINA')

    const colMap = {
      npp: { key: 'npp', header: 'NPP', width: 'w-28' },
      npp_digi_hc: { key: 'npp_digi_hc', header: 'NPP DIGI HC', render: (r: any) => <span>{String(r.npp_digi_hc || '-')}</span> },
      npp_webmail: { key: 'npp_webmail', header: 'NPP WEBMAIL', render: (r: any) => <span>{String(r.npp_webmail || '-')}</span> },
      nama: { key: 'nama', header: 'Nama', render: (r: any) => renderNameCell(r.nama) },
      kategori: { key: 'kategori', header: 'Tipe', render: (r: any) => {
        let bg = 'bg-teal-100 text-teal-700'
        if (r.kategori === 'TAD') bg = 'bg-orange-100 text-orange-700'
        else if (r.kategori === 'BINA') bg = 'bg-blue-100 text-blue-700'
        return (
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${bg}`}>
            {String(r.kategori)}
          </span>
        )
      }},
      tanggal_lahir: { key: 'tanggal_lahir', header: 'TTL', render: (r: any) => <span className="whitespace-nowrap">{r.tanggal_lahir ? formatDate(r.tanggal_lahir) : '-'}</span> },
      outlet: { key: 'outlet', header: 'Outlet' },
      jenis_kelamin: { key: 'jenis_kelamin', header: 'Jenis Kelamin', render: (r: any) => <span>{String(r.jenis_kelamin || '-')}</span> },
      alamat: { key: 'alamat', header: 'Alamat', render: (r: any) => <span className="text-xs text-[#475569] max-w-[240px] inline-block truncate" title={String(r.alamat || r.rumah || '-')}>{String(r.alamat || r.rumah || '-')}</span> },
      jenjang: { key: 'jenjang', header: 'Jenjang' },
      jabatan: { key: 'jabatan', header: 'Jabatan' },
      tanggal_mulai: { key: 'tanggal_mulai', header: 'Tgl Mulai', render: (r: any) => <span className="whitespace-nowrap">{r.tanggal_mulai ? formatDate(r.tanggal_mulai) : '-'}</span> },
      tanggal_berakhir: { key: 'tanggal_berakhir', header: 'Tgl Berakhir', render: (r: any) => <span className="whitespace-nowrap">{r.tanggal_berakhir ? formatDate(r.tanggal_berakhir) : '-'}</span> },
      grade: { key: 'grade', header: 'Grade', render: (r: any) => (
        <span className="font-bold text-teal-700">{formatGradeValue(r.grade) || '-'}</span>
      )},
      batch: { key: 'batch', header: 'Batch', render: (r: any) => <span>{r.batch ? `Batch ${r.batch}` : '-'}</span> },
      nik: { key: 'nik', header: 'NIK' },
      no_hp: { key: 'no_hp', header: 'No HP' },
    }

    if (isTad) {
      return [
        colMap.npp_digi_hc,
        colMap.npp_webmail,
        colMap.nama,
        colMap.kategori,
        colMap.outlet,
        colMap.alamat,
        colMap.jabatan,
        colMap.nik,
        colMap.no_hp,
      ]
    }

    if (isFte) {
      return [
        colMap.npp,
        colMap.nama,
        colMap.tanggal_lahir,
        colMap.kategori,
        colMap.outlet,
        colMap.alamat,
        colMap.jenjang,
        colMap.jabatan,
        colMap.grade,
        colMap.nik,
        colMap.no_hp,
      ]
    }

    if (isBina) {
      return [
        colMap.npp,
        colMap.nama,
        colMap.jenis_kelamin,
        colMap.kategori,
        colMap.outlet,
        colMap.alamat,
        colMap.jabatan,
        colMap.tanggal_mulai,
        colMap.tanggal_berakhir,
        colMap.grade,
        colMap.batch,
      ]
    }

    // "ALL" (Semua Tipe)
    return [
      colMap.npp,
      colMap.npp_digi_hc,
      colMap.npp_webmail,
      colMap.nama,
      colMap.tanggal_lahir,
      colMap.kategori,
      colMap.outlet,
      colMap.alamat,
      colMap.jenis_kelamin,
      colMap.jenjang,
      colMap.jabatan,
      colMap.tanggal_mulai,
      colMap.tanggal_berakhir,
      colMap.grade,
      colMap.batch,
      colMap.nik,
      colMap.no_hp,
    ]
  }

  const isBusy = addMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
            <Users size={24} className="text-teal-600" /> Master Karyawan
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Kelola data karyawan FTE & TAD</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportDropdown
            onSelectExcel={() => { setImportMode('excel'); setImportOpen(true); }}
            onSelectOcr={() => { setImportMode('ocr'); setImportOpen(true); }}
          />
          <Button
            variant="outline"
            size="sm"
            icon={<Type size={15} />}
            loading={uppercaseMutation.isPending}
            onClick={async () => {
              try {
                await uppercaseMutation.mutateAsync()
                alert('Berhasil mengonversi seluruh nama karyawan di database menjadi HURUF KAPITAL (UPPERCASE)!')
              } catch (e: any) {
                alert('Gagal mengonversi nama: ' + (e?.message || JSON.stringify(e)))
              }
            }}
          >
            Ubah Uppercase
          </Button>
          <Button variant="outline" size="sm" icon={<FileDown size={15} />} onClick={handleExportXLSX}>
            Excel
          </Button>
          <Button variant="outline" size="sm" icon={<FileText size={15} />} onClick={handleExportPDF}>
            PDF
          </Button>
          <Button variant="secondary" size="sm" icon={<Plus size={15} />} onClick={openAdd}>
            Tambah
          </Button>
        </div>
      </div>

      {/* Bulk Delete Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 animate-fade-in mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-red-800">
              {selectedIds.length} data karyawan terpilih
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-100"
              onClick={() => setSelectedIds([])}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
              icon={<Trash2 size={14} />}
              onClick={() => setBulkDeleteOpen(true)}
              loading={bulkDeleteMutation.isPending}
            >
              Hapus Terpilih
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Cari NPP, nama, jabatan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <MultiSelect
            selectedValues={filterKategori}
            onChange={setFilterKategori}
            placeholder="Semua Tipe"
            options={[
              { value: 'FTE', label: 'FTE' },
              { value: 'TAD', label: 'TAD' },
              { value: 'BINA', label: 'BINA' },
            ]}
          />
          <MultiSelect
            selectedValues={filterOutlet}
            onChange={setFilterOutlet}
            placeholder="Semua Outlet"
            options={outlets.map(o => ({ value: o.nama_referensi, label: o.nama_referensi }))}
          />
          <MultiSelect
            selectedValues={filterJabatan}
            onChange={setFilterJabatan}
            placeholder="Semua Jabatan"
            options={jabatans.map(j => ({ value: j.nama_referensi, label: j.nama_referensi }))}
          />
          <MultiSelect
            selectedValues={filterGrade}
            onChange={setFilterGrade}
            placeholder="Semua Grade"
            options={[
              { value: '.GRADE.12', label: '.GRADE.12' },
              { value: '.GRADE.11', label: '.GRADE.11' },
              { value: '.GRADE.10', label: '.GRADE.10' },
              { value: '.GRADE.9', label: '.GRADE.9' },
              { value: '.GRADE.8', label: '.GRADE.8' },
              { value: '.GRADE.7', label: '.GRADE.7' },
              { value: '.GRADE.6', label: '.GRADE.6' },
              { value: '.GRADE.5', label: '.GRADE.5' },
              { value: '.GRADE.4', label: '.GRADE.4' },
              { value: '.NON.GRADE', label: '.NON.GRADE' },
            ]}
          />
        </div>
        <div className="text-xs text-[#64748B] self-center px-3 py-1.5 bg-white rounded-xl border border-gray-200 font-medium whitespace-nowrap">
          {data.length} data
        </div>
      </div>

      {/* Table */}
      <DataTable
        tableId="master_karyawan"
        data={data as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="Belum ada data karyawan"
        emptyIcon={<Users size={40} className="text-gray-200" />}
        columns={getColumns()}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => openMutasi(row as unknown as Karyawan)}
              title="Mutasi Karyawan"
              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <ArrowRightLeft size={14} />
            </button>
            <button
              onClick={() => openEdit(row as unknown as Karyawan)}
              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => setDeleteId(String(row.id))}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" loading={isBusy} onClick={handleSave}>
              {editId ? 'Simpan Perubahan' : 'Tambah Karyawan'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="NPP" value={form.npp} onChange={e => setForm(f => ({ ...f, npp: e.target.value }))} placeholder="Contoh: 12345" />
          {(form.kategori === 'TAD' || filterKategori.length === 0) && (
            <>
              <Input label="NPP DIGI HC" value={form.npp_digi_hc || ''} onChange={e => setForm(f => ({ ...f, npp_digi_hc: e.target.value }))} placeholder="NPP di aplikasi DIGI HC" />
              <Input label="NPP WEBMAIL" value={form.npp_webmail || ''} onChange={e => setForm(f => ({ ...f, npp_webmail: e.target.value }))} placeholder="NPP Webmail BJB" />
            </>
          )}
          <Input label="Nama Lengkap" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Nama karyawan" />

          <Select
            label="Kategori"
            value={form.kategori}
            onChange={e => {
              const kat = e.target.value as 'FTE'|'TAD'|'BINA'
              setForm(f => {
                const clears = 
                  kat === 'FTE' ? { npp_digi_hc: null, npp_webmail: null, jenis_kelamin: null, tanggal_mulai: null, tanggal_berakhir: null, kd_wil: null, batch: null } :
                  kat === 'TAD' ? { grade: null, posisi_saat_ini: null, jenjang: null, no_rek: null, tanggal_lahir: null, jenis_kelamin: null, tanggal_mulai: null, tanggal_berakhir: null, kd_wil: null, batch: null } :
                  { npp_digi_hc: null, npp_webmail: null, posisi_saat_ini: null, jenjang: null, no_rek: null, tanggal_lahir: null, nik: null, no_hp: null, kd_wil: null }
                return {
                  ...f,
                  kategori: kat,
                  ...clears
                }
              })
            }}
            options={[{ value: 'FTE', label: 'FTE' }, { value: 'TAD', label: 'TAD' }, { value: 'BINA', label: 'BINA' }]}
          />
          <Select
            label="Outlet"
            value={form.outlet || ''}
            onChange={e => setForm(f => ({ ...f, outlet: e.target.value }))}
            options={outlets.map(o => ({ value: o.nama_referensi, label: o.nama_referensi }))}
            placeholder="-- Pilih Outlet --"
          />

          {(form.kategori === 'BINA' || filterKategori.length === 0) && (
            <Select
              label="Jenis Kelamin"
              value={form.jenis_kelamin || ''}
              onChange={e => setForm(f => ({ ...f, jenis_kelamin: e.target.value }))}
              options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]}
              placeholder="-- Pilih Jenis Kelamin --"
            />
          )}

          {(form.kategori === 'FTE' || filterKategori.length === 0) && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Tanggal Lahir</label>
              <DatePicker
                selected={form.tanggal_lahir ? new Date(form.tanggal_lahir) : null}
                onChange={(date: Date | null) => setForm(f => ({ ...f, tanggal_lahir: date ? date.toISOString().split('T')[0] : '' }))}
                dateFormat="dd MMMM yyyy"
                placeholderText="Pilih tanggal lahir"
                showYearDropdown
                yearDropdownItemNumber={60}
                scrollableYearDropdown
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#2B3440] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          )}

          {(form.kategori === 'FTE' || filterKategori.length === 0) && (
            <Select
              label="Jenjang"
              value={form.jenjang || ''}
              onChange={e => setForm(f => ({ ...f, jenjang: e.target.value || null }))}
              options={[
                { value: 'VP', label: 'VP' },
                { value: 'AVP', label: 'AVP' },
                { value: 'MGR', label: 'MGR' },
                { value: 'AMGR', label: 'AMGR' },
                { value: 'ASST', label: 'ASST' },
              ]}
              placeholder="-- Pilih Jenjang --"
            />
          )}

          <Input
            label="Jabatan"
            value={form.jabatan || ''}
            onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
            placeholder="Masukkan jabatan..."
          />

          {(form.kategori === 'BINA' || filterKategori.length === 0) && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Tanggal Mulai</label>
                <DatePicker
                  selected={form.tanggal_mulai ? new Date(form.tanggal_mulai) : null}
                  onChange={(date: Date | null) => setForm(f => ({ ...f, tanggal_mulai: date ? date.toISOString().split('T')[0] : '' }))}
                  dateFormat="dd MMMM yyyy"
                  placeholderText="Pilih tanggal mulai"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#2B3440] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Tanggal Berakhir</label>
                <DatePicker
                  selected={form.tanggal_berakhir ? new Date(form.tanggal_berakhir) : null}
                  onChange={(date: Date | null) => setForm(f => ({ ...f, tanggal_berakhir: date ? date.toISOString().split('T')[0] : '' }))}
                  dateFormat="dd MMMM yyyy"
                  placeholderText="Pilih tanggal berakhir"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#2B3440] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </>
          )}

          {(form.kategori === 'FTE' || form.kategori === 'BINA' || filterKategori.length === 0) && (
            <Select
              label="Grade"
              value={formatGradeValue(form.grade)}
              onChange={e => setForm(f => ({ ...f, grade: e.target.value || null }))}
              options={[
                { value: '.GRADE.12', label: '.GRADE.12' },
                { value: '.GRADE.11', label: '.GRADE.11' },
                { value: '.GRADE.10', label: '.GRADE.10' },
                { value: '.GRADE.9', label: '.GRADE.9' },
                { value: '.GRADE.8', label: '.GRADE.8' },
                { value: '.GRADE.7', label: '.GRADE.7' },
                { value: '.GRADE.6', label: '.GRADE.6' },
                { value: '.GRADE.5', label: '.GRADE.5' },
                { value: '.GRADE.4', label: '.GRADE.4' },
                { value: '.NON.GRADE', label: '.NON.GRADE' },
              ]}
              placeholder="-- Pilih Grade --"
            />
          )}

          {(form.kategori === 'BINA' || filterKategori.length === 0) && (
            <Select
              label="Batch"
              value={form.batch || ''}
              onChange={e => setForm(f => ({ ...f, batch: e.target.value }))}
              options={[{ value: '1', label: 'Batch 1' }, { value: '2', label: 'Batch 2' }]}
              placeholder="-- Pilih Batch --"
            />
          )}

          {(form.kategori === 'FTE' || form.kategori === 'TAD' || filterKategori.length === 0) && (
            <Input label="NIK" value={form.nik || ''} onChange={e => setForm(f => ({ ...f, nik: e.target.value }))} placeholder="Nomor Induk Kependudukan" type="number" />
          )}
          {form.kategori === 'FTE' && (
            <Input label="No. Rekening" value={form.no_rek || ''} onChange={e => setForm(f => ({ ...f, no_rek: e.target.value }))} placeholder="Nomor rekening bank" />
          )}
          {(form.kategori === 'FTE' || form.kategori === 'TAD' || filterKategori.length === 0) && (
            <Input label="No. HP" value={form.no_hp || ''} onChange={e => setForm(f => ({ ...f, no_hp: e.target.value }))} placeholder="08xx-xxxx-xxxx" type="tel" />
          )}
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-[#64748B]">Apakah Anda yakin ingin menghapus data karyawan ini? Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>

      {/* Bulk Delete Confirm */}
      <Modal isOpen={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} title="Konfirmasi Hapus Massal" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBulkDeleteOpen(false)}>Batal</Button>
            <Button variant="danger" loading={bulkDeleteMutation.isPending} onClick={handleBulkDelete}>Hapus Semua ({selectedIds.length})</Button>
          </>
        }
      >
        <p className="text-sm text-[#64748B]">Apakah Anda yakin ingin menghapus <strong>{selectedIds.length}</strong> data karyawan terpilih? Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>

      {/* Import Modal */}
      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        title="Import Data Karyawan"
        templateHeaders={TEMPLATE_HEADERS}
        templateFilename="Template_Karyawan"
        fieldMapping={KARYAWAN_FIELD_MAPPING}
        requiredFields={['nama']}
        initialMode={importMode}
      />

      {/* Mutasi Modal */}
      <Modal
        isOpen={mutasiOpen}
        onClose={() => setMutasiOpen(false)}
        title="Mutasi Karyawan"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setMutasiOpen(false)}>Batal</Button>
            <Button variant="primary" loading={mutasiMutation.isPending} onClick={handleSaveMutasi}>
              Proses Mutasi
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm">
            <div>
              <span className="text-gray-500">NPP:</span> <span className="font-bold text-[#2B3440]">{mutasiForm.npp}</span>
            </div>
            <div>
              <span className="text-gray-500">Nama:</span> <span className="font-bold text-[#2B3440]">{mutasiForm.nama}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Outlet Baru"
              value={mutasiForm.outlet}
              onChange={e => setMutasiForm(f => ({ ...f, outlet: e.target.value }))}
              options={outlets.map(o => ({ value: o.nama_referensi, label: o.nama_referensi }))}
              placeholder="-- Pilih Outlet Baru --"
            />
            <Input
              label="Jabatan Baru"
              value={mutasiForm.jabatan}
              onChange={e => setMutasiForm(f => ({ ...f, jabatan: e.target.value }))}
              placeholder="Masukkan jabatan baru..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Jenjang Baru"
              value={mutasiForm.jenjang}
              onChange={e => setMutasiForm(f => ({ ...f, jenjang: e.target.value }))}
              options={[
                { value: 'VP', label: 'VP' },
                { value: 'AVP', label: 'AVP' },
                { value: 'MGR', label: 'MGR' },
                { value: 'AMGR', label: 'AMGR' },
                { value: 'ASST', label: 'ASST' },
              ]}
              placeholder="-- Pilih Jenjang Baru --"
            />
            <Select
              label="Grade Baru"
              value={formatGradeValue(mutasiForm.grade)}
              onChange={e => setMutasiForm(f => ({ ...f, grade: e.target.value }))}
              options={[
                { value: '.GRADE.12', label: '.GRADE.12' },
                { value: '.GRADE.11', label: '.GRADE.11' },
                { value: '.GRADE.10', label: '.GRADE.10' },
                { value: '.GRADE.9', label: '.GRADE.9' },
                { value: '.GRADE.8', label: '.GRADE.8' },
                { value: '.GRADE.7', label: '.GRADE.7' },
                { value: '.GRADE.6', label: '.GRADE.6' },
                { value: '.GRADE.5', label: '.GRADE.5' },
                { value: '.GRADE.4', label: '.GRADE.4' },
                { value: '.NON.GRADE', label: '.NON.GRADE' },
              ]}
              placeholder="-- Pilih Grade Baru --"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Tanggal Aktif (Masa Berlaku)</label>
              <DatePicker
                selected={mutasiForm.tanggal_aktif ? new Date(mutasiForm.tanggal_aktif) : null}
                onChange={(date: Date | null) => setMutasiForm(f => ({ ...f, tanggal_aktif: date ? date.toISOString().split('T')[0] : '' }))}
                dateFormat="dd MMMM yyyy"
                placeholderText="Pilih tanggal aktif mutasi"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#2B3440] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <Textarea
            label="Keterangan Mutasi"
            value={mutasiForm.keterangan}
            onChange={e => setMutasiForm(f => ({ ...f, keterangan: e.target.value }))}
            placeholder="Alasan mutasi/keterangan tambahan..."
          />
        </div>
      </Modal>
    </div>
  )
}
