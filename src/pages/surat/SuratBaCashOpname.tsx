import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useReactToPrint } from 'react-to-print'
import { supabase } from '../../lib/supabase'
import { BaCashOpnameTemplate, type BaCashOpnameData } from '../../components/templates/BaCashOpnameTemplate'
import { DocumentDownloadDropdown } from '../../components/ui/DocumentDownloadDropdown'
import { exportElementToPDF } from '../../lib/documentExport'
import { FileText, Calculator } from 'lucide-react'

const PECAHAN = [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
const PECAHAN_USD = [100, 50, 20, 10, 5, 2, 1];

export default function SuratBaCashOpnamePage() {
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch Karyawan untuk Dropdown
  const { data: karyawanList = [] } = useQuery({
    queryKey: ['karyawan-select-ba'],
    queryFn: async () => {
      const { data } = await supabase.from('karyawan').select('nama, npp, jabatan').order('nama', { ascending: true })
      return data || []
    }
  });

  const [formData, setFormData] = useState<BaCashOpnameData>({
    nomorSurat: '', kcp: 'PONTIANAK', tanggal: new Date().toISOString().slice(0, 10), waktu: 'sebelum jam layanan operasional', vaultEnquiry: 0,
    oric: { nama: '', npp: '', jabatan: 'Operational Risk Internal Control' },
    saksi: [
      { nama: '', npp: '', jabatan: 'Teller' },
      { nama: '', npp: '', jabatan: 'Branch Banking Officer' },
      { nama: '', npp: '', jabatan: 'Branch Manager' }
    ],
    uleBesar: {}, uleKecil: {}, utleBesar: {}, utleKecil: {},
    valasUsd: {}, vaultEnquiryUsd: 0
  });

  const handlePrint = useReactToPrint({ contentRef: printRef });
  const handleDownloadPDF = async () => { if (printRef.current) await exportElementToPDF(printRef.current, `BA_Cash_Opname_${formData.kcp}`); };

  // Helper untuk update state ORIC / Saksi
  const handleSelectPegawai = (index: number | 'oric', selectedNpp: string) => {
    if (selectedNpp === 'MANUAL') {
      if (index === 'oric') setFormData({ ...formData, oric: { nama: '', npp: '', jabatan: formData.oric.jabatan } });
      else {
        const newSaksi = [...formData.saksi];
        newSaksi[index] = { nama: '', npp: '', jabatan: newSaksi[index].jabatan };
        setFormData({ ...formData, saksi: newSaksi });
      }
      return;
    }

    const emp = karyawanList.find(k => k.npp === selectedNpp);
    if (!emp) return;

    if (index === 'oric') {
      setFormData({ ...formData, oric: { nama: emp.nama, npp: emp.npp, jabatan: formData.oric.jabatan } });
    } else {
      const newSaksi = [...formData.saksi];
      newSaksi[index] = { nama: emp.nama, npp: emp.npp, jabatan: newSaksi[index].jabatan };
      setFormData({ ...formData, saksi: newSaksi });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* Editor Panel */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-6 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
        
        {/* 1. Informasi Dasar */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-teal-800 uppercase border-l-2 border-teal-600 pl-2">1. Informasi Dasar</p>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Nomor Surat" value={formData.nomorSurat} onChange={e => setFormData({...formData, nomorSurat: e.target.value})} className="text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <input type="text" placeholder="Nama KCP" value={formData.kcp} onChange={e => setFormData({...formData, kcp: e.target.value})} className="text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <input type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <input type="text" placeholder="Waktu (Cth: sebelum jam layanan)" value={formData.waktu} onChange={e => setFormData({...formData, waktu: e.target.value})} className="text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
          </div>
        </div>

        {/* 2. Pihak Terlibat */}
        <div className="space-y-5">
          <p className="text-xs font-bold text-teal-800 uppercase border-l-2 border-teal-600 pl-2">2. Pihak Terlibat</p>
          
          {/* ORIC */}
          <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Pemeriksa (ORIC)</label>
            <select
              onChange={e => handleSelectPegawai('oric', e.target.value)}
              className="w-full text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            >
              <option value="MANUAL">-- Isi Manual / Pilih Karyawan --</option>
              {karyawanList.map(k => <option key={k.npp} value={k.npp}>{k.nama} ({k.npp})</option>)}
            </select>
            <div className="flex gap-2 mt-1.5">
              <input type="text" placeholder="Ketik Nama Manual..." value={formData.oric.nama} onChange={e => setFormData({...formData, oric: {...formData.oric, nama: e.target.value}})} className="w-full text-xs p-1.5 border rounded-lg" />
              <input type="text" placeholder="NPP" value={formData.oric.npp} onChange={e => setFormData({...formData, oric: {...formData.oric, npp: e.target.value}})} className="w-24 text-xs p-1.5 border rounded-lg" />
            </div>
            <input type="text" placeholder="Jabatan" value={formData.oric.jabatan} onChange={e => setFormData({...formData, oric: {...formData.oric, jabatan: e.target.value}})} className="w-full text-xs p-1.5 border rounded-lg mt-1" />
          </div>

          {/* SAKSI 1-3 */}
          {formData.saksi.map((s, i) => (
            <div key={i} className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Saksi {i + 1}</label>
              <select
                onChange={e => handleSelectPegawai(i, e.target.value)}
                className="w-full text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              >
                <option value="MANUAL">-- Isi Manual / Pilih Karyawan --</option>
                {karyawanList.map(k => <option key={k.npp} value={k.npp}>{k.nama} ({k.npp})</option>)}
              </select>
              <div className="flex gap-2 mt-1.5">
                <input type="text" placeholder="Ketik Nama Manual..." value={s.nama} onChange={e => { const newS = [...formData.saksi]; newS[i].nama = e.target.value; setFormData({...formData, saksi: newS}); }} className="w-full text-xs p-1.5 border rounded-lg" />
                <input type="text" placeholder="NPP" value={s.npp} onChange={e => { const newS = [...formData.saksi]; newS[i].npp = e.target.value; setFormData({...formData, saksi: newS}); }} className="w-24 text-xs p-1.5 border rounded-lg" />
              </div>
              <input type="text" placeholder="Jabatan" value={s.jabatan} onChange={e => { const newS = [...formData.saksi]; newS[i].jabatan = e.target.value; setFormData({...formData, saksi: newS}); }} className="w-full text-xs p-1.5 border rounded-lg mt-1" />
            </div>
          ))}
        </div>

        {/* 3. Rincian Uang Kas ULE (Layak Edar) */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-teal-800 uppercase border-l-2 border-teal-600 pl-2 flex items-center justify-between">
            <span>3. Rincian Uang Kas ULE (Layak)</span>
            <Calculator size={14}/>
          </p>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <p className="text-[10px] font-bold text-center bg-teal-50 text-teal-800 py-1 rounded border border-teal-100">KAS BESAR (Lbr/Keping)</p>
               {PECAHAN.map(p => (
                 <div key={`ule-bsr-${p}`} className="flex items-center gap-2 mt-1">
                   <span className="w-16 text-[10px] text-right text-slate-600 font-mono">{p.toLocaleString('id-ID')}</span>
                   <input type="number" min="0" value={formData.uleBesar[p] || ''} onChange={e => setFormData({...formData, uleBesar: {...formData.uleBesar, [p]: parseInt(e.target.value)||0}})} className="w-full text-xs p-1.5 border rounded text-right focus:ring-1 focus:ring-teal-500 focus:outline-none font-mono" />
                 </div>
               ))}
             </div>
             <div>
               <p className="text-[10px] font-bold text-center bg-teal-50 text-teal-800 py-1 rounded border border-teal-100">KAS KECIL (Lbr/Keping)</p>
               {PECAHAN.map(p => (
                 <div key={`ule-kcl-${p}`} className="flex items-center gap-2 mt-1">
                   <span className="w-16 text-[10px] text-right text-slate-600 font-mono">{p.toLocaleString('id-ID')}</span>
                   <input type="number" min="0" value={formData.uleKecil[p] || ''} onChange={e => setFormData({...formData, uleKecil: {...formData.uleKecil, [p]: parseInt(e.target.value)||0}})} className="w-full text-xs p-1.5 border rounded text-right focus:ring-1 focus:ring-teal-500 focus:outline-none font-mono" />
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* 4. Rincian Uang Kas UTLE (Tidak Layak Edar) */}
        <div className="space-y-3 pb-2">
          <p className="text-xs font-bold text-rose-800 uppercase border-l-2 border-rose-600 pl-2 flex items-center justify-between">
            <span>4. Rincian Uang Kas UTLE (Tidak Layak)</span>
            <Calculator size={14} className="text-rose-600"/>
          </p>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <p className="text-[10px] font-bold text-center bg-rose-50 text-rose-800 py-1 rounded border border-rose-100">KAS BESAR (Lbr/Keping)</p>
               {PECAHAN.map(p => (
                 <div key={`utle-bsr-${p}`} className="flex items-center gap-2 mt-1">
                   <span className="w-16 text-[10px] text-right text-slate-600 font-mono">{p.toLocaleString('id-ID')}</span>
                   <input type="number" min="0" value={formData.utleBesar[p] || ''} onChange={e => setFormData({...formData, utleBesar: {...formData.utleBesar, [p]: parseInt(e.target.value)||0}})} className="w-full text-xs p-1.5 border border-rose-200 rounded text-right focus:ring-1 focus:ring-rose-500 focus:outline-none font-mono" />
                 </div>
               ))}
             </div>
             <div>
               <p className="text-[10px] font-bold text-center bg-rose-50 text-rose-800 py-1 rounded border border-rose-100">KAS KECIL (Lbr/Keping)</p>
               {PECAHAN.map(p => (
                 <div key={`utle-kcl-${p}`} className="flex items-center gap-2 mt-1">
                   <span className="w-16 text-[10px] text-right text-slate-600 font-mono">{p.toLocaleString('id-ID')}</span>
                   <input type="number" min="0" value={formData.utleKecil[p] || ''} onChange={e => setFormData({...formData, utleKecil: {...formData.utleKecil, [p]: parseInt(e.target.value)||0}})} className="w-full text-xs p-1.5 border border-rose-200 rounded text-right focus:ring-1 focus:ring-rose-500 focus:outline-none font-mono" />
                 </div>
               ))}
             </div>
          </div>
          <div className="pt-6 border-t border-slate-100 mt-4">
            <label className="text-[11px] font-bold text-slate-700">Saldo Vault Enquiry (Pembanding Rupiah)</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border">Rp</span>
              <input type="number" min="0" value={formData.vaultEnquiry || ''} onChange={e => setFormData({...formData, vaultEnquiry: parseInt(e.target.value)||0})} className="w-full text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold" />
            </div>
          </div>
        </div>

        {/* 6. Rincian Valas USD */}
        <div className="space-y-3 pt-4 border-t border-slate-200 pb-6">
          <p className="text-xs font-bold text-sky-800 uppercase border-l-2 border-sky-500 pl-2 flex items-center justify-between">
            <span>6. Rincian Uang Kas Valas (USD)</span>
            <Calculator size={14}/>
          </p>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <p className="text-[10px] font-bold text-center bg-sky-50 text-sky-800 py-1 rounded border border-sky-100">Pecahan USD (Lembar)</p>
               {PECAHAN_USD.map(p => (
                 <div key={`usd-${p}`} className="flex items-center gap-2 mt-1">
                   <span className="w-16 text-[10px] text-right text-slate-600 font-mono">USD {p}</span>
                   <input type="number" min="0" value={formData.valasUsd[p] || ''} onChange={e => setFormData({...formData, valasUsd: {...formData.valasUsd, [p]: parseInt(e.target.value)||0}})} className="w-full text-xs p-1.5 border rounded text-right focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono" />
                 </div>
               ))}
             </div>
             
             {/* Input Saldo Vault USD */}
             <div className="pt-6">
               <label className="text-[11px] font-bold text-slate-700 block mb-1">Saldo Vault Enquiry USD</label>
               <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border">$</span>
                 <input type="number" min="0" value={formData.vaultEnquiryUsd || ''} onChange={e => setFormData({...formData, vaultEnquiryUsd: parseInt(e.target.value)||0})} className="w-full text-sm p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold" />
               </div>
             </div>
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
