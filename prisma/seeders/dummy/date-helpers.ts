/**
 * Helper tanggal RELATIF ke waktu seeder dijalankan (bukan tanggal statis
 * spt "2026-04-20") -- dipakai di seeder Penjualan/Pembelian/Shift Kasir
 * supaya data dummy selalu "baru" & otomatis kena filter tanggal default
 * di Laporan (umumnya "bulan berjalan"), berapa pun lama sejak seeder ini
 * ditulis/terakhir dijalankan.
 */

/** "YYYY-MM-DD" dari N hari yang lalu (dihitung dari waktu server saat ini). */
export function dateStringDaysAgo(daysAgo: number): string {
  const target = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Date objek pada jam:menit tertentu (WIB, +07:00) di N hari yang lalu. */
export function dateAtTimeDaysAgo(daysAgo: number, hhmmss: string): Date {
  return new Date(`${dateStringDaysAgo(daysAgo)}T${hhmmss}+07:00`);
}
