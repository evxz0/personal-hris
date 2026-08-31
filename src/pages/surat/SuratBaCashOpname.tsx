import React, { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useReactToPrint } from 'react-to-print'
import { supabase } from '../../lib/supabase'
import { BaCashOpnameTemplate, type BaCashOpnameData } from '../../components/templates/BaCashOpnameTemplate'
import { DocumentDownloadDropdown } from '../../components/ui/DocumentDownloadDropdown'
import { exportElementToPDF } from '../../lib/documentExport'
import { FileText, Calculator } from 'lucide-react'
import { getTodayIndonesian } from '../../lib/dateUtils'

const PECAHAN = [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

export default function SuratBaCashOpnamePage() {
  const printRef = useRef<HTMLDivElement>(null);
  
  const { data: karyawanList = [] } = useQuery({
    queryKey: ['karyawan-select-ba'],
    queryFn: async () => {
      const { data } = await supabase.from('karyawan').select('nama, npp, jabatan').order('nama', { ascending: true })
      return data || []
    }
  });

  const [formData, setFormData] = useState<BaCashOpnameData>({
    nomorSurat: '', kcp: 'JERUJU', tanggal: new Date().toISOString().slice(0, 10), waktu: 'sebelum jam layanan operasional', vaultEnquiry: 0,
    oric: { nama: '', npp: '', jabatan: 'Operational Risk Internal Control' },
    saksi: [
      { nama: '', npp: '', jabatan: 'Teller' },
      { nama: '', npp: '', jabatan: 'Branch Banking Officer' },
      { nama: '', npp: '', jabatan: 'Branch Manager' }
    ],
    uleBesar: {}, uleKecil: {}, utleBesar: {}, utleKecil: {}
  });

  const handlePrint = useReactToPrint({ contentRef: printRef });
  const handleDownloadPDF = async () => { if (printRef.current) await exportElementToPDF(printRef.current, `BA_Cash_Opname_${formData.kcp}`); };

  // Komponen Input Pegawai (Bisa Ketik / Pilih)
  const EmployeeSelect = ({ label, value, onChange }: any) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-500 uppercase">{label}</label>
      <input
        type="text"
        list="karyawan-list"
        value={value.nama}
        placeholder="Ketik nama / pilih dari database..."
        onChange={e => {
          const selected = karyawanList.find(k => k.nama === e.target.value);
          onChange({ ...value, nama: e.target.value, npp: selected ? selected.npp : value.npp, jabatan: selected ? selected.jabatan : value.jabatan });
        }}
        className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-teal-500"
      />
      <div className="flex gap-2">
        <input type="text" placeholder="NPP" value={value.npp} onChange={e => onChange({ ...value, npp: e.target.value })} className="w-1/3 text-xs p-2 border rounded-lg" />
        <input type="text" placeholder="Jabatan" value={value.jabatan} onChange={e => onChange({ ...value, jabatan: e.target.value })} className="w-2/3 text-xs p-2 border rounded-lg" />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      <datalist id="karyawan-list">
        {karyawanList.map(k => <option key={k.npp} value={k.nama} />)}
      </datalist>

      {/* Editor Panel */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-6 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
        
        <div className="space-y-3">
          <p className="text-xs font-bold text-teal-800 uppercase border-l-2 border-teal-600 pl-2">1. Informasi Dasar</p>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Nomor Surat" value={formData.nomorSurat} onChange={e => setFormData({...formData, nomorSurat: e.target.value})} className="text-xs p-2 border rounded-lg" />
            <input type="text" placeholder="Nama KCP" value={formData.kcp} onChange={e => setFormData({...formData, kcp: e.target.value})} className="text-xs p-2 border rounded-lg" />
            <input type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="text-xs p-2 border rounded-lg" />
            <input type="text" placeholder="Waktu (Cth: sebelum jam layanan)" value={formData.waktu} onChange={e => setFormData({...formData, waktu: e.target.value})} className="text-xs p-2 border rounded-lg" />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold text-teal-800 uppercase border-l-2 border-teal-600 pl-2">2. Pihak Terlibat</p>
          <EmployeeSelect 
            label="Pemeriksa (ORIC)" 
            value={formData.oric}
            onChange={(val: any) => setFormData({...formData, oric: val})} 
          />
          {formData.saksi.map((s, i) => (
             <EmployeeSelect 
               key={i} 
               label={`Saksi ${i+1}`} 
               value={s}
               onChange={(val: any) => {
                 const newSaksi = [...formData.saksi]; 
                 newSaksi[i] = val; 
                 setFormData({...formData, saksi: newSaksi});
               }} 
             />
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-teal-800 uppercase border-l-2 border-teal-600 pl-2 flex items-center justify-between">
            <span>3. Rincian Uang Kas ULE</span>
            <Calculator size={14}/>
          </p>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <p className="text-[10px] font-bold text-center bg-slate-100 py-1 rounded">KAS BESAR (Lembar/Keping)</p>
               {PECAHAN.map(p => (
                 <div key={p} className="flex items-center gap-2 mt-1">
                   <span className="w-16 text-[10px] text-right">{p.toLocaleString('id-ID')}</span>
                   <input type="number" min="0" value={formData.uleBesar[p] || ''} onChange={e => setFormData({...formData, uleBesar: {...formData.uleBesar, [p]: parseInt(e.target.value)||0}})} className="w-full text-xs p-1 border rounded text-right" />
                 </div>
               ))}
             </div>
             <div>
               <p className="text-[10px] font-bold text-center bg-slate-100 py-1 rounded">KAS KECIL (Lembar/Keping)</p>
               {PECAHAN.map(p => (
                 <div key={p} className="flex items-center gap-2 mt-1">
                   <span className="w-16 text-[10px] text-right">{p.toLocaleString('id-ID')}</span>
                   <input type="number" min="0" value={formData.uleKecil[p] || ''} onChange={e => setFormData({...formData, uleKecil: {...formData.uleKecil, [p]: parseInt(e.target.value)||0}})} className="w-full text-xs p-1 border rounded text-right" />
                 </div>
               ))}
             </div>
          </div>
          <div className="pt-4">
            <label className="text-[11px] font-bold text-slate-700">Saldo Vault Enquiry (Pembanding)</label>
            <input type="number" value={formData.vaultEnquiry || ''} onChange={e => setFormData({...formData, vaultEnquiry: parseInt(e.target.value)||0})} className="w-full text-xs p-2 border rounded-lg mt-1" />
          </div>
        </div>

      </div>

      {/* Preview Panel */}
      <div className="lg:col-span-7 space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><FileText className="text-teal-600" size={14}/> Pratinjau BA Cash Opname</span>
          <DocumentDownloadDropdown loading={false} onDownloadPDF={handleDownloadPDF} onPrint={handlePrint}/>
        </div>
        <div className="bg-slate-200 p-4 rounded-2xl overflow-auto h-[calc(100vh-10rem)] shadow-inner custom-scrollbar flex justify-center">
          <BaCashOpnameTemplate data={formData} ref={printRef}/>
        </div>
      </div>
    </div>
  )
}
