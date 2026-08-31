import React from 'react';
import { terbilang, formatTanggalTerbilang } from '../../lib/terbilang';
import { formatRupiah } from '../../lib/utils';

export interface CashData {
  [pecahan: number]: number; // pecahan -> jumlah lembar/keping
}

export interface BaCashOpnameData {
  nomorSurat: string;
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
}

interface Props { data: BaCashOpnameData; }

const PECAHAN_KERTAS = [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000];
const PECAHAN_KOIN = [1000, 500, 200, 100];

export const BaCashOpnameTemplate = React.forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const dt = formatTanggalTerbilang(data.tanggal);
  
  const calcTotal = (cash: CashData) => Object.entries(cash).reduce((acc, [pecahan, lembar]) => acc + (Number(pecahan) * lembar), 0);
  
  const totalUleBesar = calcTotal(data.uleBesar);
  const totalUleKecil = calcTotal(data.uleKecil);
  const totalUtleBesar = calcTotal(data.utleBesar);
  const totalUtleKecil = calcTotal(data.utleKecil);
  const grandTotal = totalUleBesar + totalUleKecil + totalUtleBesar + totalUtleKecil;
  const selisih = grandTotal - data.vaultEnquiry;

  const renderTableRows = (cashData: CashData) => (
    <>
      {PECAHAN_KERTAS.map(p => (
        <tr key={p}>
          <td className="text-right px-1">{cashData[p] || '-'}</td>
          <td className="text-center px-1">Lembar</td>
          <td className="text-right px-1">{p.toLocaleString('id-ID')} =</td>
          <td className="text-right px-1">{(cashData[p] ? cashData[p] * p : 0).toLocaleString('id-ID') || '-'}</td>
        </tr>
      ))}
      {PECAHAN_KOIN.map(p => (
        <tr key={p}>
          <td className="text-right px-1">{cashData[p] || '-'}</td>
          <td className="text-center px-1">Keping</td>
          <td className="text-right px-1">{p.toLocaleString('id-ID')} =</td>
          <td className="text-right px-1">{(cashData[p] ? cashData[p] * p : 0).toLocaleString('id-ID') || '-'}</td>
        </tr>
      ))}
    </>
  );

  return (
    <div ref={ref} className="bg-white text-black p-8 font-serif text-[11px] leading-snug mx-auto max-w-[210mm]">
      <style>{`
        @media print { @page { size: A4 portrait; margin: 15mm; } }
        .tbl-kas td, .tbl-kas th { border: 1px solid black; padding: 2px 4px; }
        .tbl-kas th { font-weight: bold; text-align: center; background-color: #f3f4f6; }
      `}</style>
      
      <div className="text-center font-bold text-sm leading-tight mb-6">
        <p>BERITA ACARA PEMERIKSAAN KAS</p>
        <p>PADA PT BANK NEGARA INDONESIA (PERSERO) TBK</p>
        <p>KCP {data.kcp.toUpperCase()}</p>
        <p>No. {data.nomorSurat} Tanggal {dt.raw}</p>
      </div>

      <div className="text-justify mb-4">
        Pada hari ini <strong>{dt.hari}</strong> tanggal <strong>{dt.tgl}</strong> bulan <strong>{dt.bln}</strong> tahun <strong>{dt.thn} ({dt.raw})</strong> pada saat <strong>{data.waktu}</strong>, telah dilakukan pemeriksaan atas persediaan uang kas Rupiah dan Valas Teller oleh <i>Operational Risk Internal Control</i>, yakni:
      </div>

      <div className="mb-4 ml-8">
        - {data.oric.nama} / NPP. {data.oric.npp}
      </div>

      <div className="mb-2">Dengan disaksikan oleh:</div>
      <table className="w-full mb-6 ml-4">
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
      
      <div className="flex gap-4 ml-4 mb-4">
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

      <div className="font-bold ml-4 mb-1 mt-4">B. Uang Tidak Layak Edar (UTLE)</div>
      <div className="flex gap-4 ml-4 mb-6">
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

      <table className="tbl-kas w-2/3 ml-4 mb-4 font-bold">
        <tbody>
          <tr><td className="w-2/3">Total Uang Kas (A+B)</td><td className="w-8 text-center">Rp</td><td className="text-right">{grandTotal.toLocaleString('id-ID')}</td></tr>
          <tr><td>Vault Enquiry (009028)</td><td className="text-center">Rp</td><td className="text-right">{data.vaultEnquiry.toLocaleString('id-ID')}</td></tr>
          <tr><td>Selisih</td><td className="text-center">Rp</td><td className="text-right">{selisih === 0 ? '-' : selisih.toLocaleString('id-ID')}</td></tr>
        </tbody>
      </table>

      <div className="mb-4">
        Terbilang fisik:<br/>
        <i>{terbilang(grandTotal)} Rupiah.</i><br/><br/>
        Saldo tersebut sesuai/cocok dengan Register Kas Rupiah dan Branch Total Combined Rupiah per tanggal {dt.raw.replace(/-/g, ' ')}, yaitu sebesar Rp{grandTotal.toLocaleString('id-ID')},-.
      </div>

      <div className="font-bold mb-1">II. UANG KAS VALUTA ASING</div>
      <div className="mb-6 ml-4">Dollar – USA<br/>Terbilang :<br/><i>0 US Dollar.</i><br/>Saldo tersebut sesuai/cocok dengan Register Kas USD dan Branch Totals Combined USD per tanggal {dt.raw.replace(/-/g, ' ')}, yaitu sebesar USD 0,-</div>

      <div className="text-justify mb-8">
        Demikianlah Berita Acara Pemeriksaan Kas PT Bank Negara Indonesia (Persero) Tbk. KCP {data.kcp}, dibuat dalam rangkap 2 (dua) untuk dipergunakan sebagaimana mestinya.
      </div>

      <div className="w-full flex justify-between px-8 text-center">
        <div className="w-1/2">
          <p className="mb-20">Yang Menyaksikan,</p>
          {data.saksi.map((s, i) => (
             <div key={i} className="flex justify-between items-end mb-4 text-left">
               <div>
                 <p className="font-bold underline">{s.nama || '__________________'}</p>
                 <p>NPP. {s.npp}</p>
               </div>
               <div className="w-16 border-b border-black border-dotted"></div>
             </div>
          ))}
        </div>
        <div className="w-1/3">
          <p className="text-right mb-2">Pontianak, {dt.raw}</p>
          <p className="mb-20">Yang Memeriksa,</p>
          <div className="text-left">
             <p className="font-bold underline">{data.oric.nama || '__________________'}</p>
             <p>NPP. {data.oric.npp}</p>
          </div>
        </div>
      </div>
    </div>
  );
});
