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
    if (jenjang && grade) return `(${jenjang}/${grade})`;
    if (grade) return `(${grade})`;
    if (jenjang) return `(${jenjang})`;
    return '';
  };

  return (
    <div ref={ref} className="sk-pgs-paper">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm 20mm; }
          body { visibility: hidden; background: white; }
          .sk-pgs-paper, .sk-pgs-paper * { visibility: visible; }
          .sk-pgs-paper { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; padding: 0 !important; }
        }
        .sk-pgs-paper {
          width: 210mm;
          min-height: 297mm;
          padding: 15mm 20mm;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: #000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          margin: 0 auto;
          box-sizing: border-box;
        }
        .table-meta td, .table-diktum td { vertical-align: top; padding: 2px 0; }
      `}</style>

      {/* Header Kop Surat BNI Logo */}
      <div style={{ marginBottom: '15px', textAlign: 'center' }}>
        <img
          src="/logo-kop-bni.jpg"
          alt="BNI Kop Logo"
          style={{ width: '100%', maxHeight: '90px', objectFit: 'contain' }}
        />
      </div>

      <table className="table-meta" style={{ width: '100%', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '90px' }}>Putusan</td>
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

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: 'bold' }}>SURAT KEPUTUSAN</h3>
        <h4 style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>REGIONAL OFFICE 09</h4>
        <h4 style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>PT. BANK NEGARA INDONESIA (PERSERO) Tbk</h4>
      </div>

      <table className="table-diktum" style={{ width: '100%', marginBottom: '10px' }}>
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

      <table className="table-diktum" style={{ width: '100%', marginBottom: '10px' }}>
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

      <table className="table-diktum" style={{ width: '100%', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '110px' }}>Memperhatikan</td>
            <td style={{ width: '15px' }}>:</td>
            <td colSpan={2}>Keputusan Area Head - W09.</td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '15px 0' }}>MEMUTUSKAN</div>

      <table className="table-diktum" style={{ width: '100%', marginBottom: '15px' }}>
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
              <div style={{ paddingLeft: '15px', marginTop: '4px' }}>
                <b>Sdr. {data.pegawai.nama || '[NAMA PEGAWAI]'} – NPP. {data.pegawai.npp || '[NPP]'}</b><br />
                {data.pegawai.jabatanAsal} {formatGrade(data.pegawai.jenjangAsal, data.pegawai.gradeAsal)}<br />
                {data.pegawai.unitAsal}
              </div>
              
              <div style={{ paddingLeft: '15px', marginTop: '10px' }}>
                <table>
                  <tbody>
                    <tr>
                      <td style={{ width: '70px' }}>Sebagai</td>
                      <td style={{ width: '15px' }}>:</td>
                      <td><b>{data.penugasan.jabatanPgs} {formatGrade(data.penugasan.jenjangPgs, data.penugasan.gradePgs)} {data.penugasan.lokasiPgs}</b></td>
                    </tr>
                    <tr>
                      <td>Unit</td>
                      <td>:</td>
                      <td>{data.pegawai.unitAsal}</td>
                    </tr>
                    <tr>
                      <td>Lokasi</td>
                      <td>:</td>
                      <td>{data.penugasan.lokasiPgs}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <tr>
            <td style={{ paddingTop: '10px' }}>Kedua</td>
            <td style={{ paddingTop: '10px' }}>:</td>
            <td style={{ paddingTop: '10px', textAlign: 'justify' }}>
              Penunjukkan pengganti sementara pada diktum Pertama berlaku tanggal <b>{data.penugasan.tanggalMulai || '...'} – {data.penugasan.tanggalSelesai || '...'}</b>.
            </td>
          </tr>

          <tr>
            <td style={{ paddingTop: '10px' }}>Ketiga</td>
            <td style={{ paddingTop: '10px' }}>:</td>
            <td style={{ paddingTop: '10px', textAlign: 'justify' }}>
              Selama penunjukkan pengganti sementara tersebut kepada Sdr. {data.pegawai.nama || '[NAMA]'} - NPP. {data.pegawai.npp || '[NPP]'} diberikan kewenangan untuk mengurus, melakukan pekerjaan dan menandatangani segala sesuatu yang berhubungan dengan pekerjaan pada posisi yang ditugaskan sementara tersebut dengan tetap memperhatikan ketentuan yang berlaku di BNI.
            </td>
          </tr>

          <tr>
            <td style={{ paddingTop: '10px' }}>Keempat</td>
            <td style={{ paddingTop: '10px' }}>:</td>
            <td style={{ paddingTop: '10px' }}>
              Surat Keputusan ini berlaku sejak tanggal efektif penunjukkan.
            </td>
          </tr>

          <tr>
            <td style={{ paddingTop: '10px' }}>Kelima</td>
            <td style={{ paddingTop: '10px' }}>:</td>
            <td style={{ paddingTop: '10px', textAlign: 'justify' }}>
              Apabila dikemudian hari dari Surat Keputusan ini terdapat kekeliruan, akan diadakan pembetulan sebagaimana mestinya.
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ textAlign: 'justify', fontSize: '9.5pt', marginTop: '20px' }}>
        Surat Keputusan ini disampaikan kepada yang bersangkutan melalui unitnya masing-masing untuk diketahui dan dilaksanakan sebagaimana mestinya, dengan tembusan kepada Unit Organisasi lain yang memerlukan.
      </p>

      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '320px', textAlign: 'left' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>PT. BANK NEGARA INDONESIA (PERSERO) Tbk.</p>
          <p style={{ margin: 0, fontWeight: 'bold' }}>REGIONAL OFFICE 09</p>

          <div style={{ height: '85px', width: '100%' }}></div>

          <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>
            NOVACHRISTO JOSEPH SILANGEN
          </p>
          <p style={{ margin: 0, fontWeight: 'bold' }}>AREA HEAD</p>
        </div>
      </div>
    </div>
  );
});

SkPgsTemplate.displayName = 'SkPgsTemplate';
