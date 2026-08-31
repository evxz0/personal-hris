export function terbilang(angka: number): string {
  if (angka === 0) return "Nol";
  const bilangan = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ];
  let hasil = "";
  if (angka < 12) {
    hasil = bilangan[angka];
  } else if (angka < 20) {
    hasil = terbilang(angka - 10) + " Belas";
  } else if (angka < 100) {
    hasil = terbilang(Math.floor(angka / 10)) + " Puluh" + (angka % 10 !== 0 ? " " + terbilang(angka % 10) : "");
  } else if (angka < 200) {
    hasil = "Seratus" + (angka - 100 !== 0 ? " " + terbilang(angka - 100) : "");
  } else if (angka < 1000) {
    hasil = terbilang(Math.floor(angka / 100)) + " Ratus" + (angka % 100 !== 0 ? " " + terbilang(angka % 100) : "");
  } else if (angka < 2000) {
    hasil = "Seribu" + (angka - 1000 !== 0 ? " " + terbilang(angka - 1000) : "");
  } else if (angka < 1000000) {
    hasil = terbilang(Math.floor(angka / 1000)) + " Ribu" + (angka % 1000 !== 0 ? " " + terbilang(angka % 1000) : "");
  } else if (angka < 1000000000) {
    hasil = terbilang(Math.floor(angka / 1000000)) + " Juta" + (angka % 1000000 !== 0 ? " " + terbilang(angka % 1000000) : "");
  } else if (angka < 1000000000000) {
    hasil = terbilang(Math.floor(angka / 1000000000)) + " Miliar" + (angka % 1000000000 !== 0 ? " " + terbilang(angka % 1000000000) : "");
  }
  return hasil.trim();
}

export function terbilangEn(angka: number): string {
  if (angka === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  let hasil = "";
  if (angka < 20) {
    hasil = ones[angka];
  } else if (angka < 100) {
    hasil = tens[Math.floor(angka / 10)] + (angka % 10 !== 0 ? " " + ones[angka % 10] : "");
  } else if (angka < 1000) {
    hasil = ones[Math.floor(angka / 100)] + " Hundred" + (angka % 100 !== 0 ? " and " + terbilangEn(angka % 100) : "");
  } else if (angka < 1000000) {
    hasil = terbilangEn(Math.floor(angka / 1000)) + " Thousand" + (angka % 1000 !== 0 ? " " + terbilangEn(angka % 1000) : "");
  }
  return hasil.trim();
}

export function formatTanggalTerbilang(tanggalStr: string) {
  if (!tanggalStr) return { hari: "", tgl: "", bln: "", thn: "", raw: "" };
  const dateObj = new Date(tanggalStr);
  const hariArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulanArr = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  return {
    hari: hariArr[dateObj.getDay()],
    tgl: terbilang(dateObj.getDate()),
    bln: bulanArr[dateObj.getMonth()],
    thn: terbilang(dateObj.getFullYear()),
    raw: `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`
  };
}
