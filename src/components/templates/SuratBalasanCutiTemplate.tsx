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
  const pejabatNama = data.penandatangan?.nama ?? '';
  const pejabatJabatan = data.penandatangan?.jabatan ?? '';

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
          }
          body * {
            visibility: hidden;
          }
          .sk-balasan-paper, .sk-balasan-paper * {
            visibility: visible;
          }
          .sk-balasan-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }

        .sk-balasan-paper {
          width: 210mm;
          min-height: 297mm;
          padding: 1.5cm 1.5cm 1.5cm 2.2cm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9.5pt;
          line-height: 1.35;
          color: #000;
          box-sizing: border-box;
        }
        .table-balasan-meta td { vertical-align: top; padding: 1.5px 0; }
        .list-cuti ol { margin: 0; padding-left: 20px; }
        .list-cuti li { margin-bottom: 8px; text-align: justify; }
      `}</style>

      {/* Header: Logo BNI on Right Header */}
      <div style={{ textAlign: 'right', marginTop: '4px', marginBottom: '8px' }}>
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

      {/* Metadata Table (Ultra Compact) */}
      <table className="table-balasan-meta" style={{ width: '100%', marginBottom: '10px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '60px', padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>No.</td>
            <td style={{ width: '15px', padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>:</td>
            <td style={{ padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}><b>{data.nomorSurat || 'W09/10.3/014/2026'}</b></td>
          </tr>
          <tr>
            <td style={{ padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>Lamp.</td>
            <td style={{ padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>:</td>
            <td style={{ padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>-</td>
          </tr>
        </tbody>
      </table>

      {/* Kepada & Hal */}
      <div style={{ marginBottom: '16px', lineHeight: '1.4' }}>
        Kepada :<br />
        <b>Sdr/i. {data.pegawai.nama || 'Feri Wahyudi'} – NPP. {data.pegawai.npp || 'P036191'}</b><br />
        PT. Bank Negara Indonesia (Persero) Tbk<br />
        {data.pegawai.unitAsal || 'Pontianak Branch Office'}<br />
        <b><u>{data.pegawai.kotaUnit || 'PONTIANAK'}</u></b>
      </div>

      <div style={{ marginBottom: '16px', lineHeight: '1.4' }}>
        Hal : Pelaksanaan Cuti Tahunan Tahun {data.tahunCuti || '2026'}<br />
        <b><u>Cfm. Surat Permohonan Pelaksanaan Cuti Sdr. Tanggal {data.tanggalPermohonan || '16 Juli 2026'}</u></b>
      </div>

      {/* Body Content */}
      <div style={{ textAlign: 'justify', marginBottom: '12px' }}>
        Menunjuk perihal pada pokok surat, dengan ini kami sampaikan sebagai berikut :
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', lineHeight: '1.25' }}>
        <tbody>
          <tr>
            <td style={{ width: '24px', minWidth: '24px', verticalAlign: 'top', paddingBottom: '2px' }}>1.</td>
            <td style={{ textAlign: 'justify', verticalAlign: 'top', paddingBottom: '2px' }}>
              Pelaksanaan cuti tahunan Saudara tahun {data.tahunCuti || '2026'} dapat dilaksanakan selama <b>{String(data.cuti.jumlahHari || '5').padStart(2, '0')} ({data.cuti.jumlahHariTerbilang || 'lima'})</b> hari kerja terhitung sejak tanggal <b>{data.cuti.tanggalMulai || '03 Agustus 2026'} s/d {data.cuti.tanggalSelesai || '07 Agustus 2026'}</b> dan aktif kembali bekerja pada tanggal <b>{data.cuti.tanggalAktif || '10 Agustus 2026'}</b>
            </td>
          </tr>
          <tr>
            <td style={{ width: '24px', minWidth: '24px', verticalAlign: 'top', paddingBottom: '2px' }}>2.</td>
            <td style={{ textAlign: 'justify', verticalAlign: 'top', paddingBottom: '2px' }}>
              Dengan dilaksanakan cuti tersebut diatas, maka sisa cuti tahunan Saudara untuk tahun {data.tahunCuti || '2026'} adalah <b>{data.cuti.sisaCuti || '5'} ({data.cuti.sisaCutiTerbilang || 'lima'})</b> hari kerja.
            </td>
          </tr>
          <tr>
            <td style={{ width: '24px', minWidth: '24px', verticalAlign: 'top', paddingBottom: '2px' }}>3.</td>
            <td style={{ textAlign: 'justify', verticalAlign: 'top', paddingBottom: '2px' }}>
              Ongkos Perjalanan Cuti Tahunan (OPCT) {data.tahunCuti || '2026'} Saudara <u><b>{data.cuti.statusOpct || 'dapat'}</b></u> dibayarkan. Pengajuan pencairan OPCT tahun {data.tahunCuti || '2026'} dapat saudara ajukan melalui aplikasi DigiHc.
            </td>
          </tr>
          <tr>
            <td style={{ width: '24px', minWidth: '24px', verticalAlign: 'top', paddingBottom: '2px' }}>4.</td>
            <td style={{ textAlign: 'justify', verticalAlign: 'top', paddingBottom: '2px' }}>
              Sebelum pelaksanaan cuti tersebut, harap Saudara mengisi form rencana ketidakhadiran pada aplikasi DigiHc.
            </td>
          </tr>
          <tr>
            <td style={{ width: '24px', minWidth: '24px', verticalAlign: 'top', paddingBottom: '2px' }}>5.</td>
            <td style={{ textAlign: 'justify', verticalAlign: 'top', paddingBottom: '2px' }}>
              Jika diperlukan Saudara bersedia kami panggil dan Sisa Cuti Saudara akan kami perhitungkan kembali.
            </td>
          </tr>
          <tr>
            <td style={{ width: '24px', minWidth: '24px', verticalAlign: 'top', paddingBottom: '2px' }}>6.</td>
            <td style={{ textAlign: 'justify', verticalAlign: 'top', paddingBottom: '2px' }}>
              Untuk selanjutnya selamat melaksanakan Cuti, semoga dapat dimanfaatkan sebaik-baiknya dengan harapan sekembalinya dari Cuti, Saudara akan bekerja lebih baik lagi.
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: '16px', marginBottom: '24px', textAlign: 'justify' }}>
        Demikian kami sampaikan untuk dimaklumi.
      </div>

      {/* Signature Block */}
      <div style={{ marginTop: '14px', textAlign: 'left' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>PT Bank Negara Indonesia (Persero) Tbk</p>
        <p style={{ margin: 0, fontWeight: 'bold' }}>Regional Office 09, Area III, Kalimantan Barat</p>

        {pejabatNama ? (
          <>
            <p style={{ margin: 0, marginTop: '90px', fontWeight: 'bold', textDecoration: 'underline' }}>
              {pejabatNama}
            </p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              {pejabatJabatan}
            </p>
          </>
        ) : (
          <div style={{ height: '90px' }} />
        )}
      </div>
    </div>
  );
});

SuratBalasanCutiTemplate.displayName = 'SuratBalasanCutiTemplate';
