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
    lokasiPgs: string;
    tanggalMulai: string;
    tanggalSelesai: string;
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

  return (
    <div ref={ref} className="sk-pgs-paper">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 20mm 12mm 20mm;
          }
          html, body {
            height: 100%;
            overflow: hidden;
            visibility: hidden;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sk-pgs-paper, .sk-pgs-paper * {
            visibility: visible;
          }
          .sk-pgs-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-height: 270mm !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 10pt !important;
            line-height: 1.4 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
        .sk-pgs-paper {
          width: 210mm;
          min-height: 297mm;
          padding: 15mm 20mm 12mm 20mm;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: #000;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          margin: 0 auto;
          box-sizing: border-box;
        }
        .table-meta td, .table-diktum td { vertical-align: top; padding: 1.5px 0; }
      `}</style>

      {/* Header: Meta Table on Left, BNI Logo on Right (Aligned to Top-Right Header) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <table className="table-meta" style={{ width: '60%' }}>
          <tbody>
            <tr>
              <td style={{ width: '85px' }}>Putusan</td>
              <td style={{ width: '15px' }}>:</td>
              <td><b>REGIONAL OFFICE 09</b></td>
            </tr>
            <tr>
              <td>Nomor</td>
              <td>:</td>
              <td><b>{data.nomorSurat || 'KP/.../...'}</b></td>
            </tr>
            <tr>
              <td>Tanggal</td>
              <td>:</td>
              <td><b>{data.tanggalSurat || '-'}</b></td>
            </tr>
            <tr>
              <td>Hal</td>
              <td>:</td>
              <td><b>Pengganti Sementara</b></td>
            </tr>
          </tbody>
        </table>

        <div style={{ width: '38%', textAlign: 'right' }}>
          <img
            src="/logo-kop-bni.jpg"
            alt="BNI Logo"
            style={{ height: '42px', width: 'auto', objectFit: 'contain', display: 'inline-block' }}
          />
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: 'bold' }}>SURAT KEPUTUSAN</h3>
        <h4 style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>REGIONAL OFFICE 09</h4>
        <h4 style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>PT. BANK NEGARA INDONESIA (PERSERO) Tbk</h4>
      </div>

      {/* Menimbang */}
      <table className="table-diktum" style={{ width: '100%', marginBottom: '6px' }}>
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
      <table className="table-diktum" style={{ width: '100%', marginBottom: '6px' }}>
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
      <table className="table-diktum" style={{ width: '100%', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '110px' }}>Memperhatikan</td>
            <td style={{ width: '15px' }}>:</td>
            <td colSpan={2}>Keputusan Area Head - W09.</td>
          </tr>
        </tbody>
      </table>

      {/* Memutuskan */}
      <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '10px 0' }}>MEMUTUSKAN</div>

      {/* Menetapkan & Diktum */}
      <table className="table-diktum" style={{ width: '100%', marginBottom: '10px' }}>
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
              <div style={{ textAlign: 'center', marginTop: '4px', marginBottom: '8px' }}>
                <u><b>Sdr. {data.pegawai.nama || '[NAMA PEGAWAI]'} – NPP.{data.pegawai.npp || '[NPP]'}</b></u><br />
                <b>{data.pegawai.jabatanAsal} {formatGrade(data.pegawai.jenjangAsal, data.pegawai.gradeAsal)}</b><br />
                <b>{data.pegawai.unitAsal}</b>
              </div>
              
              <div style={{ marginTop: '6px' }}>
                <table className="table-diktum" style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '70px' }}>Sebagai</td>
                      <td style={{ width: '15px' }}>:</td>
                      <td><b>{data.penugasan.jabatanPgs} {formatGrade(data.penugasan.jenjangPgs, data.penugasan.gradePgs)} {data.penugasan.lokasiPgs}</b></td>
                    </tr>
                    <tr>
                      <td>Unit</td>
                      <td>:</td>
                      <td><b>{data.pegawai.unitAsal}</b></td>
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
            <td style={{ paddingTop: '6px' }}>Kedua</td>
            <td style={{ paddingTop: '6px' }}>:</td>
            <td style={{ paddingTop: '6px', textAlign: 'justify' }}>
              Penunjukkan pengganti sementara pada diktum Pertama berlaku tanggal <b>{data.penugasan.tanggalMulai || '...'} – {data.penugasan.tanggalSelesai || '...'}</b>.
            </td>
          </tr>

          <tr>
            <td style={{ paddingTop: '6px' }}>Ketiga</td>
            <td style={{ paddingTop: '6px' }}>:</td>
            <td style={{ paddingTop: '6px', textAlign: 'justify' }}>
              Selama penunjukkan pengganti sementara tersebut kepada Sdr. <u><b>{data.pegawai.nama || '[NAMA]'} - NPP.{data.pegawai.npp || '[NPP]'}</b></u> diberikan kewenangan untuk mengurus, melakukan pekerjaan dan menandatangani segala sesuatu yang berhubungan dengan pekerjaan pada posisi yang ditugaskan sementara tersebut dengan tetap memperhatikan ketentuan yang berlaku di BNI.
            </td>
          </tr>

          <tr>
            <td style={{ paddingTop: '6px' }}>Keempat</td>
            <td style={{ paddingTop: '6px' }}>:</td>
            <td style={{ paddingTop: '6px' }}>
              Surat Keputusan ini berlaku sejak tanggal efektif penunjukkan.
            </td>
          </tr>

          <tr>
            <td style={{ paddingTop: '6px' }}>Kelima</td>
            <td style={{ paddingTop: '6px' }}>:</td>
            <td style={{ paddingTop: '6px', textAlign: 'justify' }}>
              Apabila dikemudian hari dari Surat Keputusan ini terdapat kekeliruan, akan diadakan pembetulan sebagaimana mestinya.
            </td>
          </tr>
        </tbody>
      </table>

      {/* Penutup */}
      <p style={{ textAlign: 'justify', fontSize: '9.5pt', marginTop: '12px', lineHeight: '1.4' }}>
        Surat Keputusan ini disampaikan kepada yang bersangkutan melalui unitnya masing-masing untuk diketahui dan dilaksanakan sebagaimana mestinya, dengan tembusan kepada Unit Organisasi lain yang memerlukan.
      </p>

      {/* Signature Block (Left-Aligned as in physical BNI SK) */}
      <div style={{ marginTop: '15px', textAlign: 'left' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>PT. BANK NEGARA INDONESIA (PERSERO) Tbk.</p>
        <p style={{ margin: 0, fontWeight: 'bold' }}>REGIONAL OFFICE 09</p>

        <div style={{ height: '55px', width: '100%' }}></div>

        <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>
          NOVACHRISTO JOSEPH SILANGEN
        </p>
        <p style={{ margin: 0, fontWeight: 'bold' }}>AREA HEAD</p>
      </div>
    </div>
  );
});

SkPgsTemplate.displayName = 'SkPgsTemplate';
