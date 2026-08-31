import React from 'react';
import { terbilang, terbilangEn, formatTanggalTerbilang } from '../../lib/terbilang';

export interface CashData {
  [key: string]: number;
}

export interface BaCashOpnameData {
  nomorSurat: string;
  jenisCabang: string;
  kcp: string;
  tanggal: string;
  waktu: string;
  vaultEnquiry: number;
  oric: { nama: string; npp: string; jabatan: string };
  saksi: Array<{ nama: string; npp: string; jabatan: string }>;
  uleBesar: CashData;
  uleKecil: CashData;
  utleBesar: CashData;
  utleKecil: CashData;
  valasUsd: CashData;
  vaultEnquiryUsd: number;
  valasSgd?: CashData;
  vaultEnquirySgd?: number;
  catatanSelisih?: string;
  kotaPengesahan: string;
}

interface Props { data: BaCashOpnameData; }

const PECAHAN_RUPIAH = [
  { nominal: 100000, satuan: "Lembar" },
  { nominal: 75000, satuan: "Lembar" },
  { nominal: 50000, satuan: "Lembar" },
  { nominal: 20000, satuan: "Lembar" },
  { nominal: 10000, satuan: "Lembar" },
  { nominal: 5000, satuan: "Lembar" },
  { nominal: 2000, satuan: "Lembar" },
  { nominal: 1000, satuan: "Lembar" },
  { nominal: 1000, satuan: "Keping" },
  { nominal: 500, satuan: "Keping" },
  { nominal: 200, satuan: "Keping" },
  { nominal: 100, satuan: "Keping" }
];
const PECAHAN_USD = [100, 50, 20, 10, 5, 2, 1];
const PECAHAN_SGD = [1000, 100, 50, 10, 5, 2, 1];

export const BaCashOpnameTemplate = React.forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const dt = formatTanggalTerbilang(data.tanggal);
  
  const calcTotal = (cash: CashData) => Object.entries(cash).reduce((acc, [key, count]) => {
    const nominal = Number(key.split('_')[0]);
    return acc + (nominal * count);
  }, 0);
  
  const totalUleBesar = calcTotal(data.uleBesar);
  const totalUleKecil = calcTotal(data.uleKecil);
  const totalUtleBesar = calcTotal(data.utleBesar);
  const totalUtleKecil = calcTotal(data.utleKecil);
  const totalUsd = calcTotal(data.valasUsd);
  const totalSgd = calcTotal(data.valasSgd || {});
  
  const grandTotal = totalUleBesar + totalUleKecil + totalUtleBesar + totalUtleKecil;
  const selisih = data.vaultEnquiry - grandTotal; // Note: fixed selisih calculation relative to vaultEnquiry
  const selisihUsd = totalUsd - data.vaultEnquiryUsd;

  const renderTableRows = (cashData: CashData) => (
    <>
      {PECAHAN_RUPIAH.map((p) => {
        const key = `${p.nominal}_${p.satuan}`;
        const amount = cashData[key] || 0;
        return (
          <tr key={key}>
            <td className="text-right px-1">{amount || '-'}</td>
            <td className="text-center px-1">{p.satuan}</td>
            <td className="text-right px-1">{p.nominal.toLocaleString('id-ID')} =</td>
            <td className="text-right px-1">{amount ? (amount * p.nominal).toLocaleString('id-ID') : '-'}</td>
          </tr>
        );
      })}
    </>
  );

  return (
    <div ref={ref} className="bg-white text-black px-8 pt-4 pb-8 font-serif text-[10px] leading-snug mx-auto max-w-[210mm]">
      <style>{`
        @media print { 
          @page { size: A4 portrait; margin: 10mm 15mm 15mm 15mm; } 
          .page-break { page-break-before: always; padding-top: 5mm; }
        }
        .tbl-kas td, .tbl-kas th { border: 1px solid black; padding: 1px 3px; font-size: 9px; }
        .tbl-kas th { font-weight: bold; text-align: center; background-color: #f3f4f6; }
      `}</style>
      
      {/* 1. Header Kop Surat BNI */}
      <div className="w-full flex items-end justify-between mb-4 -mt-2">
        <img src="/logo-kop-bni.jpg" alt="Kop BNI" className="h-6 object-contain" />
        <div className="text-[9px] text-gray-500 font-sans tracking-wide pb-1">
          BA. STOCK OPNAME <span className="font-bold">{data.jenisCabang} {data.kcp.toUpperCase()}</span>
        </div>
      </div>

      <div className="text-center font-bold text-xs leading-tight mb-4">
        <p>BERITA ACARA PEMERIKSAAN KAS</p>
        <p>PADA PT BANK NEGARA INDONESIA (PERSERO) TBK</p>
        <p>{data.jenisCabang} {data.kcp.toUpperCase()}</p>
        <p>No. {data.nomorSurat} Tanggal {dt.raw}</p>
      </div>

      <div className="text-justify mb-3">
        Pada hari ini <strong>{dt.hari}</strong> tanggal <strong>{dt.tgl}</strong> bulan <strong>{dt.bln}</strong> tahun <strong>{dt.thn} ({dt.raw})</strong> pada saat <strong>{data.waktu}</strong>, telah dilakukan pemeriksaan atas persediaan uang kas Rupiah dan Valas Teller oleh <strong><i>Operational Risk Internal Control</i></strong>, yakni:
      </div>

      <div className="mb-3 ml-8">
        - {data.oric?.nama ? `${data.oric.nama} / NPP. ${data.oric.npp}` : '- / NPP.'}
      </div>

      <div className="mb-1">Dengan disaksikan oleh:</div>
      <table className="w-full mb-3 ml-4">
        <tbody>
          {data.saksi.map((s, i) => (
            <tr key={i}>
              <td className="w-6 align-top">{i+1}</td>
              <td className="w-1/3 align-top">{s.nama}</td>
              <td className="w-1/4 align-top">NPP. {s.npp}</td>
              <td className="align-top">{s.jabatan}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-1">Terdapat keadaan sebagai berikut:</div>
      <div className="font-bold mb-1">I. UANG KAS RUPIAH</div>
      <div className="font-bold ml-4 mb-1">A. Uang Layak Edar (ULE)</div>
      
      <div className="flex gap-4 ml-4 mb-2">
        <table className="tbl-kas w-1/2">
          <thead>
            <tr><th colSpan={4}>Uang Kas Besar</th></tr>
            <tr><th>Jml Lbr</th><th>Satuan</th><th>Pecahan (Rp)</th><th>Jumlah (Rp)</th></tr>
          </thead>
          <tbody>
            {renderTableRows(data.uleBesar)}
            <tr className="font-bold bg-gray-100">
              <td colSpan={3} className="text-center">Total Kas Besar</td>
              <td className="text-right">{totalUleBesar.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>
        <table className="tbl-kas w-1/2">
          <thead>
            <tr><th colSpan={4}>Uang Kas Kecil</th></tr>
            <tr><th>Jml Lbr</th><th>Satuan</th><th>Pecahan (Rp)</th><th>Jumlah (Rp)</th></tr>
          </thead>
          <tbody>
            {renderTableRows(data.uleKecil)}
            <tr className="font-bold bg-gray-100">
              <td colSpan={3} className="text-center">Total Kas Kecil</td>
              <td className="text-right">{totalUleKecil.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="font-bold ml-4 mb-1 mt-2">B. Uang Tidak Layak Edar (UTLE)</div>
      <div className="flex gap-4 ml-4 mb-3">
        <table className="tbl-kas w-1/2">
          <thead>
            <tr><th colSpan={4}>Uang Kas Besar</th></tr>
            <tr><th>Jml Lbr</th><th>Satuan</th><th>Pecahan (Rp)</th><th>Jumlah (Rp)</th></tr>
          </thead>
          <tbody>
            {renderTableRows(data.utleBesar)}
            <tr className="font-bold bg-gray-100">
              <td colSpan={3} className="text-center">Total Kas Besar</td>
              <td className="text-right">{totalUtleBesar.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>
        <table className="tbl-kas w-1/2">
          <thead>
            <tr><th colSpan={4}>Uang Kas Kecil</th></tr>
            <tr><th>Jml Lbr</th><th>Satuan</th><th>Pecahan (Rp)</th><th>Jumlah (Rp)</th></tr>
          </thead>
          <tbody>
            {renderTableRows(data.utleKecil)}
            <tr className="font-bold bg-gray-100">
              <td colSpan={3} className="text-center">Total Kas Kecil</td>
              <td className="text-right">{totalUtleKecil.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <table className="tbl-kas w-2/3 ml-4 mb-3 font-bold">
        <tbody>
          <tr><td className="w-2/3">Total Uang Kas (A+B)</td><td className="w-8 text-center">Rp</td><td className="text-right">{grandTotal.toLocaleString('id-ID')}</td></tr>
          <tr><td>Vault Enquiry (009028)</td><td className="text-center">Rp</td><td className="text-right">{data.vaultEnquiry.toLocaleString('id-ID')}</td></tr>
          <tr><td>Selisih</td><td className="text-center">Rp</td><td className="text-right">{selisih === 0 ? '-' : selisih.toLocaleString('id-ID')}</td></tr>
        </tbody>
      </table>

      <div className="mb-2">
        Terbilang fisik:<br/>
        <i>== {grandTotal === 0 ? "Nol" : terbilang(grandTotal)} Rupiah ==</i><br/><br/>
        Saldo tersebut <span className="font-bold">{selisih === 0 ? 'sesuai/cocok' : 'tidak sesuai/tidak cocok'}</span> dengan Register Kas Rupiah dan Branch Total Combined Rupiah per tanggal <span className="font-bold">{dt.raw.replace(/-/g, ' ')}</span>, yaitu sebesar <span className="font-bold">Rp{data.vaultEnquiry.toLocaleString('id-ID')},-</span>.
      </div>

      {selisih !== 0 && data.catatanSelisih && (
        <div className="mb-2 border border-black p-2 bg-gray-50 text-justify">
          <span className="font-bold">Catatan Selisih:</span><br/>
          {data.catatanSelisih}
        </div>
      )}

      {/* --- HALAMAN 2: VALAS & TTD --- */}
      <div className="page-break">
        {data.jenisCabang === 'KC' && (
          <div className="mb-4">
            <div className="font-bold mb-1">II. UANG KAS VALUTA ASING</div>
            
            <div className="font-bold ml-4 mb-1">A. Dollar – USA</div>
            <table className="tbl-kas w-1/2 ml-4 mb-2">
              <thead>
                <tr><th>Jml Lbr</th><th>Satuan</th><th>Pecahan (USD)</th><th>Jumlah (USD)</th></tr>
              </thead>
              <tbody>
                {PECAHAN_USD.map(p => (
                  <tr key={`usd-${p}`}>
                    <td className="text-right px-1">{data.valasUsd[p] || '-'}</td>
                    <td className="text-center px-1">Lembar</td>
                    <td className="text-right px-1">{p} =</td>
                    <td className="text-right px-1">{(data.valasUsd[p] ? data.valasUsd[p] * p : 0).toLocaleString('id-ID') || '-'}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-100">
                  <td colSpan={3} className="text-center">Total Kas USD</td>
                  <td className="text-right">{totalUsd.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
            <div className="mb-3 ml-4 text-[9.5px]">
              <span className="font-bold underline">Terbilang :</span><br/>
              <i>== {totalUsd === 0 ? "Zero" : terbilangEn(totalUsd)} Dollars ==</i><br/>
              Saldo tersebut <span className="font-bold">sesuai/cocok</span> dengan Register Kas USD dan Branch Totals Combined USD per tanggal <span className="font-bold">{dt.raw.replace(/-/g, ' ')}</span>, yaitu sebesar <span className="font-bold">USD {data.vaultEnquiryUsd.toLocaleString('id-ID')},-</span>
            </div>

            <div className="font-bold ml-4 mb-1">B. Dollar – SGD</div>
            <table className="tbl-kas w-1/2 ml-4 mb-2">
              <thead>
                <tr><th>Jml Lbr</th><th>Satuan</th><th>Pecahan (SGD)</th><th>Jumlah (SGD)</th></tr>
              </thead>
              <tbody>
                {PECAHAN_SGD.map(p => (
                  <tr key={`sgd-${p}`}>
                    <td className="text-right px-1">{data.valasSgd?.[p] || '-'}</td>
                    <td className="text-center px-1">Lembar</td>
                    <td className="text-right px-1">{p} =</td>
                    <td className="text-right px-1">{(data.valasSgd?.[p] ? data.valasSgd[p] * p : 0).toLocaleString('id-ID') || '-'}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-100">
                  <td colSpan={3} className="text-center">Total Kas SGD</td>
                  <td className="text-right">{totalSgd.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
            <div className="mb-2 ml-4 text-[9.5px]">
              <span className="font-bold underline">Terbilang :</span><br/>
              <i>== {totalSgd === 0 ? "Nol" : terbilang(totalSgd)} Dolar Singapura ==</i><br/>
              Saldo tersebut <span className="font-bold">sesuai/cocok</span> dengan Register Kas SGD dan Branch Totals Combined SGD per tanggal <span className="font-bold">{dt.raw.replace(/-/g, ' ')}</span>, yaitu sebesar <span className="font-bold">SGD {(data.vaultEnquirySgd || 0).toLocaleString('id-ID')},-</span>
            </div>
          </div>
        )}

        <div className="text-justify mb-6">
          Demikianlah Berita Acara Pemeriksaan Kas PT Bank Negara Indonesia (Persero) Tbk. {data.jenisCabang} {data.kcp}, dibuat dalam rangkap 2 (dua) untuk dipergunakan sebagaimana mestinya.
        </div>

        {/* Tabel Tanda Tangan */}
        <div className="w-full flex justify-between px-4 text-center">
          <div className="w-[45%]">
            <p className="mb-16">Yang Menyaksikan,</p>
            {data.saksi.map((s, i) => (
               <div key={i} className="flex justify-between items-end mb-4 text-left">
                 <div>
                   <p className="font-bold underline">{s.nama || '__________________'}</p>
                   <p>NPP. {s.npp}</p>
                 </div>
                 <div className="w-20 border-b border-black border-dotted"></div>
               </div>
            ))}
          </div>
          <div className="w-[40%]">
            <p className="text-right mb-2">{data.kotaPengesahan}, {dt.raw}</p>
            <p className="mb-16">Yang Memeriksa,</p>
            <div className="text-left flex justify-between items-end">
               <div>
                 <p className="font-bold underline">{data.oric.nama || '__________________'}</p>
                 <p>NPP. {data.oric.npp}</p>
               </div>
               <div className="w-20 border-b border-black border-dotted"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
