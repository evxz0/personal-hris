import React from 'react';

export interface SkPgsData {
  nomorSurat: string;
  tanggalSurat: string;
  pegawai: {
    nama: string;
    npp: string;
    jabatanAsal: string;
    jenjangAsal?: string;
    gradeAsal: string;
    unitAsal: string;
  };
  penugasan: {
    jabatanPgs: string;
    jenjangPgs: string;
    gradePgs: string;
    unitPgs?: string;
    unitDiktum?: string;
    lokasiPgs: string;
    tanggalMulai: string;
    tanggalSelesai: string;
  };
  penandatangan?: {
    nama: string;
    jabatan: string;
  };
}

interface Props {
  data: SkPgsData;
}

export const SkPgsTemplate = React.forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const formatGrade = (jenjang?: string, grade?: string) => {
    const cleanJ = jenjang?.trim() || '';
    const cleanG = grade?.trim() || '';
    if (cleanJ && cleanG) {
      return `(${cleanJ} / ${cleanG})`;
    }
    if (cleanG) {
      return `(${cleanG})`;
    }
    if (cleanJ) {
      return `(${cleanJ})`;
    }
    return '';
  };

  // Helper to format name to Title Case (e.g. Tiara Tesalonika Pasaribu)
  const toTitleCase = (str: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper to get title without bolding the 'PGS' prefix
  const getPgsTitle = () => {
    const raw = data.penugasan.jabatanPgs || '';
    const cleanTitle = raw.replace(/^PGS\s+/i, '').trim();
    return cleanTitle;
  };

  const pejabatNama = data.penandatangan?.nama || 'NOVACHRISTO JOSEPH SILANGEN';
  const pejabatJabatan = data.penandatangan?.jabatan || 'AREA HEAD';

  return (
    <div ref={ref} className="sk-pgs-paper">
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
          .sk-pgs-paper, .sk-pgs-paper * {
            visibility: visible;
          }
          .sk-pgs-paper {
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 9.5pt !important;
            line-height: 1.35 !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }
        }
        .sk-pgs-paper {
          width: 210mm;
          min-height: 297mm;
          padding: 0.75in 0.5in 0.5in 0.75in;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9.5pt;
          line-height: 1.35;
          color: #000;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          margin: 0 auto;
          box-sizing: border-box;
        }
        .table-meta td, .table-diktum td { vertical-align: top; padding: 1px 0; }
      `}</style>

      {/* Header: Logo BNI on Top Right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <img
          src="/logo-kop-bni.jpg"
          alt="BNI Logo"
          style={{ height: '1.25cm', width: '4.09cm', objectFit: 'contain', display: 'inline-block' }}
        />
      </div>

      {/* Metadata Table */}
      <table className="table-meta" style={{ width: '58%', marginBottom: '12px' }}>
        <tbody>
          <tr>
            <td style={{ width: '85px' }}>Putusan</td>
            <td style={{ width: '15px' }}>:</td>
            <td>REGIONAL OFFICE 09</td>
          </tr>
          <tr>
            <td>Nomor</td>
            <td>:</td>
            <td>{data.nomorSurat || 'KP/.../...'}</td>
          </tr>
          <tr>
            <td>Tanggal</td>
            <td>:</td>
            <td>{data.tanggalSurat || '-'}</td>
          </tr>
          <tr>
            <td>Hal</td>
            <td>:</td>
            <td>Pengganti Sementara</td>
          </tr>
        </tbody>
      </table>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: 'bold' }}>SURAT KEPUTUSAN</h3>
        <h4 style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>REGIONAL OFFICE 09</h4>
        <h4 style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>PT. BANK NEGARA INDONESIA (PERSERO) Tbk</h4>
      </div>

      {/* Menimbang */}
      <table className="table-diktum" style={{ width: '100%', marginBottom: '5px' }}>
        <tbody>
          <tr>
            <td style={{ width: '110px' }}>Menimbang</td>
            <td style={{ width: '15px' }}>:</td>
            <td style={{ width: '20px' }}>1.</td>
            <td style={{ textAlign: 'justify' }}>
              Bahwa untuk kepentingan pengisian posisi kosong dikarenakan Pejabat Definitif berhalangan melaksanakan pekerjaan (cuti besar, cuti tahunan, izin, sakit, dll) maka perlu ditunjuk Pengganti Sementara (Pgs).
            </td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td>2.</td>
            <td style={{ textAlign: 'justify' }}>
              Bahwa penunjukkan Pgs tersebut merupakan bagian dari pengembangan pegawai untuk meningkatkan kompetensi dan kapabilitas pegawai.
            </td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td>3.</td>
            <td style={{ textAlign: 'justify' }}>
              Bahwa untuk maksud tersebut di atas, telah dilakukan pertimbangan secara seksama dan perlu diterbitkan Surat Keputusannya.
            </td>
          </tr>
        </tbody>
      </table>

      {/* Mengingat */}
      <table className="table-diktum" style={{ width: '100%', marginBottom: '5px' }}>
        <tbody>
          <tr>
            <td style={{ width: '110px' }}>Mengingat</td>
            <td style={{ width: '15px' }}>:</td>
            <td style={{ width: '20px' }}>1.</td>
            <td>Buku Pedoman Kepegawaian PT. Bank Negara Indonesia (Persero) Tbk.</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td>2.</td>
            <td>Peraturan yang berlaku di PT. Bank Negara Indonesia (Persero) Tbk.</td>
          </tr>
        </tbody>
      </table>

      {/* Memperhatikan */}
      <table className="table-diktum" style={{ width: '100%', marginBottom: '8px' }}>
        <tbody>
          <tr>
            <td style={{ width: '110px' }}>Memperhatikan</td>
            <td style={{ width: '15px' }}>:</td>
            <td colSpan={2}>Keputusan Area Head - W09.</td>
          </tr>
        </tbody>
      </table>

      {/* Memutuskan */}
      <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '8px 0' }}>MEMUTUSKAN</div>

      {/* Menetapkan & Diktum */}
      <table className="table-diktum" style={{ width: '100%', marginBottom: '8px' }}>
        <tbody>
          <tr>
            <td style={{ width: '110px' }}>Menetapkan</td>
            <td style={{ width: '15px' }}>:</td>
            <td></td>
          </tr>

          <tr>
            <td>Pertama</td>
            <td>:</td>
            <td>
              <div>Menunjuk :</div>
              {/* Centered Employee Details with Underlined Bold Name */}
              <div style={{ textAlign: 'center', marginTop: '4px', marginBottom: '6px' }}>
                <u><b>Sdr. {data.pegawai.nama || '[NAMA PEGAWAI]'} – NPP.{data.pegawai.npp || '[NPP]'}</b></u><br />
                <b>{data.pegawai.jabatanAsal} {formatGrade(data.pegawai.jenjangAsal, data.pegawai.gradeAsal)}</b><br />
                <b>{data.pegawai.unitAsal}</b>
              </div>
              
              <div style={{ marginTop: '4px' }}>
                <table className="table-diktum" style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '70px' }}>Sebagai</td>
                      <td style={{ width: '15px' }}>:</td>
                      <td>
                        PGS <b>{getPgsTitle()} {formatGrade(data.penugasan.jenjangPgs, data.penugasan.gradePgs)} {data.penugasan.unitPgs || data.penugasan.lokasiPgs}</b>
                      </td>
                    </tr>
                    <tr>
                      <td>Unit</td>
                      <td>:</td>
                      <td><b>{data.penugasan.unitDiktum ?? data.pegawai.unitAsal}</b></td>
                    </tr>
                    <tr>
                      <td>Lokasi</td>
                      <td>:</td>
                      <td><b>{data.penugasan.lokasiPgs}</b></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <tr>
            <td style={{ paddingTop: '5px' }}>Kedua</td>
            <td style={{ paddingTop: '5px' }}>:</td>
            <td style={{ paddingTop: '5px', textAlign: 'justify' }}>
              Penunjukkan pengganti sementara pada diktum Pertama berlaku tanggal {data.penugasan.tanggalMulai || '...'} – {data.penugasan.tanggalSelesai || '...'}.
            </td>
          </tr>

          <tr>
            <td style={{ paddingTop: '5px' }}>Ketiga</td>
            <td style={{ paddingTop: '5px' }}>:</td>
            <td style={{ paddingTop: '5px', textAlign: 'justify' }}>
              Selama penunjukkan pengganti sementara tersebut kepada Sdr. {toTitleCase(data.pegawai.nama || '[Nama]')} - NPP.{data.pegawai.npp || '[NPP]'} diberikan kewenangan untuk mengurus, melakukan pekerjaan dan menandatangani segala sesuatu yang berhubungan dengan pekerjaan pada posisi yang ditugaskan sementara tersebut dengan tetap memperhatikan ketentuan yang berlaku di BNI.
            </td>
          </tr>

          <tr>
            <td style={{ paddingTop: '5px' }}>Keempat</td>
            <td style={{ paddingTop: '5px' }}>:</td>
            <td style={{ paddingTop: '5px' }}>
              Surat Keputusan ini berlaku sejak tanggal efektif penunjukkan.
            </td>
          </tr>

          <tr>
            <td style={{ paddingTop: '5px' }}>Kelima</td>
            <td style={{ paddingTop: '5px' }}>:</td>
            <td style={{ paddingTop: '5px', textAlign: 'justify' }}>
              Apabila dikemudian hari dari Surat Keputusan ini terdapat kekeliruan, akan diadakan pembetulan sebagaimana mestinya.
            </td>
          </tr>
        </tbody>
      </table>

      {/* Penutup */}
      <p style={{ textAlign: 'justify', fontSize: '9pt', marginTop: '10px', lineHeight: '1.35' }}>
        Surat Keputusan ini disampaikan kepada yang bersangkutan melalui unitnya masing-masing untuk diketahui dan dilaksanakan sebagaimana mestinya, dengan tembusan kepada Unit Organisasi lain yang memerlukan.
      </p>

      {/* Signature Block */}
      <div style={{ marginTop: '20px', textAlign: 'left' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>PT. BANK NEGARA INDONESIA (PERSERO) Tbk.</p>
        <p style={{ margin: 0, fontWeight: 'bold' }}>REGIONAL OFFICE 09</p>

        <div style={{ height: '75px', width: '100%' }}></div>

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

SkPgsTemplate.displayName = 'SkPgsTemplate';
