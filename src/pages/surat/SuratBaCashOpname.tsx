import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useReactToPrint } from 'react-to-print'
import { supabase } from '../../lib/supabase'
import { BaCashOpnameTemplate, type BaCashOpnameData } from '../../components/templates/BaCashOpnameTemplate'
import { DocumentDownloadDropdown } from '../../components/ui/DocumentDownloadDropdown'
import { exportElementToPDF } from '../../lib/documentExport'
import { FileText, Calculator } from 'lucide-react'

const PECAHAN = [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
const PECAHAN_USD = [100, 50, 20, 10, 5, 2, 1];
const PECAHAN_SGD = [1000, 100, 50, 10, 5, 2, 1];

const oricOptions = [
  { nama: "Adirama Chrisna Putra", npp: "P060320", jabatan: "Operational Risk Internal Control" },
  { nama: "Nurmayanti", npp: "P050190", jabatan: "Operational Risk Internal Control" }
];

const outletOptions = [
  "GAJAH MADA",
  "JERUJU",
  "KUALA DUA",
  "KUBU RAYA",
  "M YAMIN",
  "MEGA MALL",
  "MEMPAWAH",
  "NGABANG",
  "PANGLIMA AIM",
  "PASAR SIANTAN",
  "PONTIANAK",
  "REGIONAL OFFICE 09",
  "SEI PINYUH",
  "SULTAN ABDURAHMAN",
  "SULTAN MUHAMMAD",
  "SUNGAI JAWI",
  "UNIVERSITAS TANJUNGPURA"
];

const SearchableDropdown = ({ options, value, onChange, placeholder }: { options: {value: string, label: string}[], value: string, onChange: (val: string) => void, placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const selectedLabel = value === 'MANUAL' ? '-- Isi Manual / Pilih Karyawan --' : options.find(o => o.value === value)?.label || placeholder;
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()) || o.value.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-xs p-2 border rounded-lg bg-white cursor-pointer flex justify-between items-center focus:ring-1 focus:ring-teal-500"
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="text-gray-400 text-[10px]">▼</span>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b sticky top-0 bg-white rounded-t-lg">
            <input
              type="text"
              placeholder="Cari nama atau NPP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs p-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto custom-scrollbar">
            <div 
              className="p-2 text-xs cursor-pointer hover:bg-teal-50 text-slate-600 border-b"
              onClick={() => { onChange('MANUAL'); setIsOpen(false); setSearch(''); }}
            >
              -- Isi Manual / Pilih Karyawan --
            </div>
            {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className={`p-2 text-xs cursor-pointer hover:bg-teal-50 ${value === opt.value ? 'bg-teal-50 font-bold text-teal-700' : 'text-slate-700'}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                {opt.label}
              </div>
            )) : (
              <div className="p-2 text-xs text-slate-400 text-center">Tidak ditemukan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


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
    nomorSurat: '', jenisCabang: 'KCP', kcp: 'PONTIANAK', tanggal: new Date().toISOString().slice(0, 10), waktu: 'sebelum jam layanan operasional', vaultEnquiry: 0,
    oric: { nama: '', npp: '', jabatan: 'Operational Risk Internal Control' },
    saksi: [
      { nama: '', npp: '', jabatan: 'Teller' },
      { nama: '', npp: '', jabatan: 'Branch Banking Officer' },
      { nama: '', npp: '', jabatan: 'Branch Manager' }
    ],
    uleBesar: {}, uleKecil: {}, utleBesar: {}, utleKecil: {},
    valasUsd: {}, vaultEnquiryUsd: 0,
    valasSgd: {}, vaultEnquirySgd: 0, catatanSelisih: '',
    kotaPengesahan: 'PONTIANAK'
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

  const handleOricSelection = (npp: string) => {
    if (npp === 'MANUAL' || npp === '') {
      setFormData({ ...formData, oric: { nama: '', npp: '', jabatan: 'Operational Risk Internal Control' } });
      return;
    }
    const emp = oricOptions.find(o => o.npp === npp);
    if (emp) {
      setFormData({ ...formData, oric: { nama: emp.nama, npp: emp.npp, jabatan: emp.jabatan } });
    }
  };

  const calcTotal = (cash: Record<number, number>) => Object.entries(cash).reduce((sum, [p, jml]) => sum + (parseInt(p) * jml), 0);
  const totalRupiah = calcTotal(formData.uleBesar) + calcTotal(formData.uleKecil) + calcTotal(formData.utleBesar) + calcTotal(formData.utleKecil);
  const selisihRupiah = formData.vaultEnquiry - totalRupiah;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* Editor Panel */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-6 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
        
        {/* 1. Informasi Dasar */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-teal-800 uppercase border-l-2 border-teal-600 pl-2">1. Informasi Dasar</p>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Nomor Surat" value={formData.nomorSurat} onChange={e => setFormData({...formData, nomorSurat: e.target.value})} className="text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            
            <div className="flex gap-2">
              <select value={formData.jenisCabang} onChange={e => setFormData({...formData, jenisCabang: e.target.value})} className="text-xs p-2 border rounded-lg bg-white w-1/3">
                <option value="KC">KC</option>
                <option value="KCP">KCP</option>
              </select>
              <select value={formData.kcp} onChange={e => setFormData({...formData, kcp: e.target.value})} className="w-2/3 text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white">
                <option value="">-- Pilih Outlet --</option>
                {outletOptions.map(outlet => (
                  <option key={outlet} value={outlet}>{outlet}</option>
                ))}
              </select>
            </div>

            <input type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <select value={formData.waktu} onChange={e => setFormData({...formData, waktu: e.target.value})} className="text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white">
              <option value="sebelum jam layanan operasional">Sebelum jam layanan operasional</option>
              <option value="sedang jam layanan operasional">Sedang jam layanan operasional</option>
              <option value="sesudah jam layanan operasional">Sesudah jam layanan operasional</option>
            </select>
            
            <div className="col-span-2 mt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Kota Pengesahan (Tanda Tangan)</label>
              <select value={formData.kotaPengesahan} onChange={e => setFormData({...formData, kotaPengesahan: e.target.value})} className="w-full text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white">
                {outletOptions.map(outlet => (
                  <option key={outlet} value={outlet}>{outlet}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Pihak Terlibat */}
        <div className="space-y-5">
          <p className="text-xs font-bold text-teal-800 uppercase border-l-2 border-teal-600 pl-2">2. Pihak Terlibat</p>
          
          {/* ORIC */}
          <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Pemeriksa (ORIC)</label>
            <select 
              value={formData.oric.npp || ''}
              onChange={(e) => handleOricSelection(e.target.value)}
              className="w-full text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Isi Manual / Pilih Karyawan --</option>
              {oricOptions.map((oric) => (
                <option key={oric.npp} value={oric.npp}>
                  {oric.nama} - {oric.npp}
                </option>
              ))}
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
              <SearchableDropdown
                options={karyawanList.map(k => ({ value: k.npp, label: `${k.nama} (${k.npp})` }))}
                value={s.npp || 'MANUAL'}
                onChange={val => handleSelectPegawai(i, val)}
                placeholder="-- Pilih Karyawan --"
              />
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
          
          {selisihRupiah !== 0 && (
            <div className="pt-4 border-t border-slate-100 mt-4">
              <label className="text-[11px] font-bold text-rose-700 block mb-1">Terdapat Selisih! (Rp {selisihRupiah.toLocaleString('id-ID')})</label>
              <textarea 
                placeholder="Tuliskan catatan penjelasan selisih kas..." 
                value={formData.catatanSelisih} 
                onChange={e => setFormData({...formData, catatanSelisih: e.target.value})} 
                className="w-full text-xs p-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 min-h-[60px]"
              />
            </div>
          )}
        </div>

        {/* Valuta Asing (Hanya untuk KC) */}
        {formData.jenisCabang === 'KC' && (
          <>
            {/* 6. Rincian Valas USD */}
            <div className="space-y-3 pt-4 border-t border-slate-200 pb-4">
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

            {/* 7. Rincian Valas SGD */}
            <div className="space-y-3 pt-4 border-t border-slate-200 pb-6">
              <p className="text-xs font-bold text-red-800 uppercase border-l-2 border-red-500 pl-2 flex items-center justify-between">
                <span>7. Rincian Uang Kas Valas (SGD)</span>
                <Calculator size={14}/>
              </p>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[10px] font-bold text-center bg-red-50 text-red-800 py-1 rounded border border-red-100">Pecahan SGD (Lembar)</p>
                   {PECAHAN_SGD.map(p => (
                     <div key={`sgd-${p}`} className="flex items-center gap-2 mt-1">
                       <span className="w-16 text-[10px] text-right text-slate-600 font-mono">SGD {p}</span>
                       <input type="number" min="0" value={formData.valasSgd?.[p] || ''} onChange={e => setFormData({...formData, valasSgd: {...(formData.valasSgd || {}), [p]: parseInt(e.target.value)||0}})} className="w-full text-xs p-1.5 border rounded text-right focus:ring-1 focus:ring-red-500 focus:outline-none font-mono" />
                     </div>
                   ))}
                 </div>
                 
                 {/* Input Saldo Vault SGD */}
                 <div className="pt-6">
                   <label className="text-[11px] font-bold text-slate-700 block mb-1">Saldo Vault Enquiry SGD</label>
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border">S$</span>
                     <input type="number" min="0" value={formData.vaultEnquirySgd || ''} onChange={e => setFormData({...formData, vaultEnquirySgd: parseInt(e.target.value)||0})} className="w-full text-sm p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold" />
                   </div>
                 </div>
              </div>
            </div>
          </>
        )}

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
