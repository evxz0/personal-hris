import { FileText, Clock } from 'lucide-react'

export default function SuratMatakuliahPage() {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider mb-1">
          <FileText size={16} /> Surat Keterangan
        </div>
        <h1 className="text-2xl font-extrabold text-[#2B3440]">Untuk Matakuliah</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Penerbitan Surat Keterangan Mahasiswa/Siswa untuk keperluan Mata Kuliah.
        </p>
      </div>

      <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center space-y-4">
        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto text-teal-600">
          <Clock size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#2B3440]">Modul Surat Keterangan Matakuliah</h3>
        <p className="text-sm text-[#64748B] max-w-md mx-auto">
          Template dan fitur pembuatan Surat Keterangan untuk Matakuliah sedang siap digunakan. Silakan gunakan menu <span className="font-bold text-teal-700">Untuk Pengganti Sementara (PGS)</span> untuk mencetak SK PGS.
        </p>
      </div>
    </div>
  )
}
