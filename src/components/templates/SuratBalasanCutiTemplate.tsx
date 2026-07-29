import React from 'react';

export interface SuratBalasanCutiData {
  tanggalSurat: string;
  nomorSurat: string;
  pegawai: {
    nama: string;
    npp: string;
    unitAsal: string;
    kotaUnit: string;
  };
  tahunCuti: string;
  tanggalPermohonan: string;
  cuti: {
    jumlahHari: string;
    jumlahHariTerbilang: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    tanggalAktif: string;
    sisaCuti: string;
    sisaCutiTerbilang: string;
    statusOpct: string; // 'dapat' | 'tidak dapat'
  };
  penandatangan?: {
    nama: string;
    jabatan: string;
  };
}

interface Props {
  data: SuratBalasanCutiData;
}

export const SuratBalasanCutiTemplate = React.forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const pejabatNama = data.penandatangan?.nama || 'Ucok P. Sianipar';
  const pejabatJabatan = data.penandatangan?.jabatan || 'ABS Team Leader';

  return (
    <div ref={ref} className="sk-balasan-paper">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.75in 0.5in 0.5in 0.75in;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sk-balasan-paper, .sk-balasan-paper * {
            visibility: visible;
          }
          .sk-balasan-paper {
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 10pt !important;
            line-height: 1.4 !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }
        }
        .sk-balasan-paper {
          width: 210mm;
          min-height: 297mm;
          padding: 0.75in 0.5in 0.5in 0.75in;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          line-height: 1.45;
          color: #000;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          margin: 0 auto;
          box-sizing: border-box;
        }
        .table-balasan-meta td { vertical-align: top; padding: 1.5px 0; }
        .list-cuti ol { margin: 0; padding-left: 20px; }
        .list-cuti li { margin-bottom: 8px; text-align: justify; }
      `}</style>

      {/* Header: Logo BNI on Right Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', marginBottom: '15px' }}>
        <img
          src="/logo-kop-bni.jpg"
          alt="BNI Logo"
          style={{ height: '1.25cm', width: '4.09cm', objectFit: 'contain', display: 'inline-block' }}
        />
      </div>

      {/* Top Location & Date */}
      <div style={{ marginBottom: '14px' }}>
        Pontianak, <b>{data.tanggalSurat || '28 Juli 2026'}</b>
      </div>

      {/* Metadata & Receiver */}
      <table className="table-balasan-meta" style={{ width: '100%', marginBottom: '14px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50px' }}>No.</td>
            <td style={{ width: '15px' }}>:</td>
            <td><b>{data.nomorSurat || 'W09/10.3/014/2026'}</b></td>
          </tr>
          <tr>
            <td>Lamp.</td>
            <td>:</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>

      {/* Kepada */}
      <div style={{ marginBottom: '16px', lineHeight: '1.4' }}>
        Kepada :<br />
        <b>Sdr/i. {data.pegawai.nama || 'Feri Wahyudi'} – NPP. {data.pegawai.npp || 'P036191'}</b><br />
        PT. Bank Negara Indonesia (Persero) Tbk<br />
        {data.pegawai.unitAsal || 'Pontianak Branch Office'}<br />
        <b><u>{data.pegawai.kotaUnit || 'PONTIANAK'}</u></b>
      </div>

      {/* Subject & Sub-header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '8px' }}>
          Hal &nbsp;&nbsp;&nbsp;&nbsp;: Pelaksanaan Cuti Tahunan Tahun {data.tahunCuti || '2026'}
        </div>
        <div>
          <u><b>Cfm. Surat Permohonan Pelaksanaan Cuti Sdr. Tanggal {data.tanggalPermohonan || '16 Juli 2026'}</b></u>
        </div>
      </div>

      {/* Body Opening */}
      <div style={{ marginBottom: '12px' }}>
        Menunjuk perihal pada pokok surat, dengan ini kami sampaikan sebagai berikut :
      </div>

      {/* Body Points (1 - 6) */}
      <div className="list-cuti" style={{ marginBottom: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '22px', verticalAlign: 'top', paddingBottom: '8px' }}>1.</td>
              <td style={{ textAlign: 'justify', verticalAlign: 'top', paddingBottom: '8px' }}>
                Pelaksanaan cuti tahunan Saudara tahun {data.tahunCuti || '2026'} dapat dilaksanakan selama <b>{data.cuti.jumlahHari || '5'} ({data.cuti.jumlahHariTerbilang || 'lima'})</b> hari kerja terhitung sejak tanggal <b>{data.cuti.tanggalMulai || '03 Agustus 2026'} s/d {data.cuti.tanggalSelesai || '07 Agustus 2026'}</b> dan aktif kembali bekerja pada tanggal <b>{data.cuti.tanggalAktif || '10 Agustus 2026'}</b>
              </td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top', paddingBottom: '8px' }}>2.</td>
              <td style={{ textAlign: 'justify', verticalAlign: 'top', paddingBottom: '8px' }}>
                Dengan dilaksanakan cuti tersebut diatas, maka sisa cuti tahunan Saudara untuk tahun {data.tahunCuti || '2026'} adalah <b>{data.cuti.sisaCuti || '5'} ({data.cuti.sisaCutiTerbilang || 'lima'})</b> hari kerja.
              </td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top', paddingBottom: '8px' }}>3.</td>
              <td style={{ textAlign: 'justify', verticalAlign: 'top', paddingBottom: '8px' }}>
                Ongkos Perjalanan Cuti Tahunan (OPCT) {data.tahunCuti || '2026'} Saudara <b>{data.cuti.statusOpct || 'dapat'}</b> dibayarkan. Pengajuan pencairan OPCT tahun {data.tahunCuti || '2026'} dapat saudara ajukan melalui aplikasi DigiHc.
              </td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top', paddingBottom: '8px' }}>4.</td>
              <td style={{ textAlign: 'justify', verticalAlign: 'top', paddingBottom: '8px' }}>
                Sebelum pelaksanaan cuti tersebut, harap Saudara mengisi form rencana ketidakhadiran pada aplikasi DigiHc.
              </td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top', paddingBottom: '8px' }}>5.</td>
              <td style={{ textAlign: 'justify', verticalAlign: 'top', paddingBottom: '8px' }}>
                Jika diperlukan Saudara bersedia kami panggil dan Sisa Cuti Saudara akan kami perhitungkan kembali.
              </td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top', paddingBottom: '8px' }}>6.</td>
              <td style={{ textAlign: 'justify', verticalAlign: 'top', paddingBottom: '8px' }}>
                Untuk selanjutnya selamat melaksanakan Cuti, semoga dapat dimanfaatkan sebaik-baiknya dengan harapan sekembalinya dari Cuti, Saudara akan bekerja lebih baik lagi.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Closing */}
      <div style={{ marginBottom: '24px' }}>
        Demikian kami sampaikan untuk dimaklumi.
      </div>

      {/* Signature Block */}
      <div style={{ marginTop: '20px', textAlign: 'left' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>PT Bank Negara Indonesia (Persero) Tbk</p>
        <p style={{ margin: 0, fontWeight: 'bold' }}>Regional Office 09, Area III, Kalimantan Barat</p>

        <div style={{ height: '70px', width: '100%' }}></div>

        <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>
          {pejabatNama}
        </p>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          {pejabatJabatan}
        </p>
      </div>
    </div>
  );
});

SuratBalasanCutiTemplate.displayName = 'SuratBalasanCutiTemplate';
