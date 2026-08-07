import React from 'react';

export interface SuratKeteranganKerjaData {
  kotaSurat?: string;
  tanggalSurat: string;
  nomorSurat: string;
  halSurat?: string;
  lampiran?: string;
  pejabat: {
    nama: string;
    npp: string;
    jabatan: string;
    unitOrgLine1?: string;
    unitOrgLine2?: string;
  };
  pegawai: {
    nama: string;
    npp: string;
    ttl: string;
    posisi: string;
    unitOrgLine1?: string;
    unitOrgLine2?: string;
  };
  keterangan: {
    tanggalMulai: string;
    tanggalSelesai: string;
    posisiTerakhir: string;
  };
  penandatangan?: {
    nama: string;
    jabatan: string;
    unitHeader1?: string;
    unitHeader2?: string;
  };
}

interface Props {
  data: SuratKeteranganKerjaData;
}

export const SuratKeteranganKerjaTemplate = React.forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const pejabatNama = data.pejabat?.nama || '[NAMA]';
  const pejabatNpp = data.pejabat?.npp || '[NPP]';
  const pejabatJabatan = data.pejabat?.jabatan || '[POSISI]';

  const pegawaiNama = data.pegawai?.nama || '[NAMA]';
  const pegawaiNpp = data.pegawai?.npp || '[NPP]';
  const pegawaiTtl = data.pegawai?.ttl || '[TTL]';
  const pegawaiPosisi = data.pegawai?.posisi || '[POSISI]';

  const tglMulai = data.keterangan?.tanggalMulai || '[Tanggal Mulai]';
  const tglSelesai = data.keterangan?.tanggalSelesai || '[Tanggal Selesai]';
  const posisiTerakhir = data.keterangan?.posisiTerakhir || data.pegawai?.posisi || '[Posisi Terakhir]';

  const penandatanganNama = data.penandatangan?.nama ?? '';
  const penandatanganJabatan = data.penandatangan?.jabatan ?? '';

  const kotaText = data.kotaSurat || 'Pontianak';
  const fullNomor = data.nomorSurat ? (data.nomorSurat.startsWith('PNK') ? data.nomorSurat : `PNK / 12 / ${data.nomorSurat}`) : 'PNK / 12 / ';

  return (
    <div ref={ref} className="sk-kerja-paper">
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
          .sk-kerja-paper, .sk-kerja-paper * {
            visibility: visible;
          }
          .sk-kerja-paper {
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
        .sk-kerja-paper {
          width: 210mm;
          min-height: 297mm;
          padding: 0.75in 0.5in 0.5in 0.75in;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: #000;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          margin: 0 auto;
          box-sizing: border-box;
        }
        .table-meta td, .table-data td { vertical-align: top; padding: 1.5px 0; }
      `}</style>

      {/* Header: Logo BNI on Top Right */}
      <div style={{ textAlign: 'right', marginTop: '4px', marginBottom: '8px' }}>
        <img
          src="/logo-kop-bni.jpg"
          alt="BNI Logo"
          style={{ height: '1.25cm', width: '4.09cm', objectFit: 'contain', display: 'inline-block' }}
        />
      </div>

      {/* Place & Date */}
      <div style={{ marginBottom: '10px' }}>
        {kotaText}, {data.tanggalSurat}
      </div>

      {/* Metadata Table (Ultra Compact) */}
      <table className="table-meta" style={{ width: '60%', marginBottom: '12px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '70px', padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>Nomor</td>
            <td style={{ width: '15px', padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>:</td>
            <td style={{ padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>{fullNomor}</td>
          </tr>
          <tr>
            <td style={{ padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>Hal</td>
            <td style={{ padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>:</td>
            <td style={{ padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>{data.halSurat || 'Keterangan Bekerja'}</td>
          </tr>
          <tr>
            <td style={{ padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>Lamp</td>
            <td style={{ padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>:</td>
            <td style={{ padding: '0px 2px', verticalAlign: 'top', lineHeight: '1.2' }}>{data.lampiran || '---'}</td>
          </tr>
        </tbody>
      </table>

      {/* Title */}
      <div style={{ textAlign: 'center', marginTop: '15px', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: 'bold', textDecoration: 'underline', letterSpacing: '0.5px' }}>
          SURAT KETERANGAN
        </h3>
      </div>

      {/* Pejabat Intro */}
      <p style={{ margin: '0 0 10px 0' }}>Yang bertanda tangan dibawah ini :</p>

      {/* Data Pejabat Table */}
      <table className="table-data" style={{ width: '100%', marginBottom: '15px', marginLeft: '0px' }}>
        <tbody>
          <tr>
            <td style={{ width: '150px' }}>Nama</td>
            <td style={{ width: '15px' }}>:</td>
            <td>{pejabatNama}</td>
          </tr>
          <tr>
            <td>NPP</td>
            <td>:</td>
            <td>{pejabatNpp}</td>
          </tr>
          <tr>
            <td>Jabatan</td>
            <td>:</td>
            <td>
              {pejabatJabatan}<br />
              {data.pejabat?.unitOrgLine1 || 'PT. Bank Negara Indonesia (Persero) Tbk.'}<br />
              {data.pejabat?.unitOrgLine2 || 'Pontianak Branch Office'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Menerangkan bahwa */}
      <p style={{ margin: '0 0 10px 0' }}>Menerangkan bahwa,</p>

      {/* Data Pegawai Table */}
      <table className="table-data" style={{ width: '100%', marginBottom: '15px', marginLeft: '0px' }}>
        <tbody>
          <tr>
            <td style={{ width: '150px' }}>Nama</td>
            <td style={{ width: '15px' }}>:</td>
            <td>{pegawaiNama}</td>
          </tr>
          <tr>
            <td>NPP</td>
            <td>:</td>
            <td>{pegawaiNpp}</td>
          </tr>
          <tr>
            <td>Tempat/Tanggal Lahir</td>
            <td>:</td>
            <td>{pegawaiTtl}</td>
          </tr>
          <tr>
            <td>Posisi</td>
            <td>:</td>
            <td>
              {pegawaiPosisi}<br />
              {data.pegawai?.unitOrgLine1 || 'PT. Bank Negara Indonesia (Persero) Tbk'}<br />
              {data.pegawai?.unitOrgLine2 || 'Pontianak Branch Office'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Paragraph 1 */}
      <p style={{ textAlign: 'justify', marginTop: '15px', marginBottom: '15px', lineHeight: '1.45' }}>
        Adalah benar tercatat sebagai pegawai PT. Bank Negara Indonesia (Persero) Tbk sejak tanggal {tglMulai} sampai dengan {tglSelesai}, yang bersangkutan mengundurkan diri dari PT. Bank Negara Indonesia (Persero) Tbk., dengan posisi terakhir sebagai {posisiTerakhir}
      </p>

      {/* Paragraph 2 */}
      <p style={{ textAlign: 'justify', marginTop: '15px', marginBottom: '35px', lineHeight: '1.45' }}>
        Demikianlah Surat Keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya, dengan tidak mengikat PT. Bank Negara Indonesia (Persero) Tbk.
      </p>

      {/* Signature Block */}
      <div style={{ marginTop: '14px', textAlign: 'left' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          {data.penandatangan?.unitHeader1 || 'PT. Bank Negara Indonesia (Persero) Tbk.'}
        </p>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          {data.penandatangan?.unitHeader2 || 'Pontianak Branch Office, Area III, Kalimantan Barat'}
        </p>

        {penandatanganNama ? (
          <>
            <p style={{ margin: 0, marginTop: '90px', fontWeight: 'bold', textDecoration: 'underline' }}>
              {penandatanganNama}
            </p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              {penandatanganJabatan}
            </p>
          </>
        ) : (
          <div style={{ height: '90px' }} />
        )}
      </div>
    </div>
  );
});

SuratKeteranganKerjaTemplate.displayName = 'SuratKeteranganKerjaTemplate';
