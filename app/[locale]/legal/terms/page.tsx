import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan - KonterApp',
  description:
    'Syarat dan ketentuan penggunaan layanan KonterApp, aplikasi kasir (POS) dan PPOB untuk usaha konter.',
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: '1. Definisi',
    content: [
      '"KonterApp" adalah platform perangkat lunak sebagai layanan (SaaS) yang menyediakan aplikasi kasir (POS), manajemen stok, dan layanan PPOB untuk usaha konter dan toko.',
      '"Pengguna" adalah individu atau badan usaha yang mendaftar dan menggunakan layanan KonterApp.',
      '"Perusahaan" adalah entitas yang didaftarkan Pengguna di dalam KonterApp dan menjadi cakupan langganan.',
      '"Layanan" adalah seluruh fitur, aplikasi, dan dokumentasi yang disediakan KonterApp kepada Pengguna.',
    ],
  },
  {
    title: '2. Penerimaan Ketentuan',
    content: [
      'Dengan mendaftar akun atau menggunakan Layanan, Pengguna dianggap telah membaca, memahami, dan menyetujui Syarat & Ketentuan ini beserta Kebijakan Privasi.',
      'Jika Pengguna tidak menyetujui ketentuan ini, Pengguna tidak diperkenankan menggunakan Layanan.',
    ],
  },
  {
    title: '3. Akun & Keamanan',
    content: [
      'Pengguna wajib memberikan data pendaftaran yang akurat, lengkap, dan terkini.',
      'Pengguna bertanggung jawab penuh atas kerahasiaan kata sandi dan seluruh aktivitas yang terjadi di dalam akunnya.',
      'Pengguna wajib segera melaporkan dugaan penyalahgunaan akun kepada tim KonterApp.',
      'Pengguna berusia di bawah 18 tahun hanya boleh menggunakan Layanan di bawah pengawasan orang tua atau wali.',
    ],
  },
  {
    title: '4. Langganan & Pembayaran',
    content: [
      'Akses penuh ke Layanan memerlukan langganan berbayar sesuai paket (plan) yang dipilih Pengguna.',
      'Pembayaran dilakukan melalui payment gateway resmi yang bekerja sama dengan KonterApp.',
      'Biaya langganan ditagihkan di muka sesuai periode paket dan tidak dapat di-refund untuk periode yang sudah berjalan, kecuali diatur lain oleh hukum yang berlaku.',
      'KonterApp berhak mengubah harga paket dengan pemberitahuan terlebih dahulu kepada Pengguna sebelum periode tagihan berikutnya.',
      'Apabila langganan berakhir atau tidak aktif, akses Pengguna kepada Layanan akan dibatasi sampai pembayaran diterima.',
    ],
  },
  {
    title: '5. Masa Uji Coba (Free Trial)',
    content: [
      'KonterApp dapat menyediakan masa uji coba gratis dengan jangka waktu tertentu.',
      'Data yang dimasukkan Pengguna selama masa uji coba tetap menjadi milik Pengguna dan dapat digunakan kembali apabila Pengguna melanjutkan ke paket berbayar.',
      'KonterApp berhak menentukan syarat dan batasan masa uji coba dari waktu ke waktu.',
    ],
  },
  {
    title: '6. Kewajiban Pengguna',
    content: [
      'Pengguna setuju untuk tidak: (a) menyalahgunakan Layanan untuk aktivitas yang melanggar hukum; (b) menjual kembali atau mensublisensikan Layanan tanpa izin tertulis; (c) mengganggu, merusak, atau mencoba mengakses sistem KonterApp secara tidak sah; (d) menggunakan Layanan untuk memproses transaksi penipuan atau pencucian uang.',
      'Pengguna bertanggung jawab atas keabsahan seluruh transaksi penjualan dan PPOB yang dilakukan di dalam Layanan.',
    ],
  },
  {
    title: '7. Hak Kekayaan Intelektual',
    content: [
      'Seluruh hak kekayaan intelektual atas Layanan, termasuk perangkat lunak, desain, merek dagang, dan konten, adalah milik KonterApp atau pemberi lisensinya.',
      'Data operasional yang dimasukkan Pengguna (produk, transaksi, pelanggan, dan sejenisnya) tetap menjadi milik Pengguna.',
    ],
  },
  {
    title: '8. Batasan Tanggung Jawab',
    content: [
      'Layanan disediakan "sebagaimana adanya" (as is) tanpa jaminan bahwa Layanan akan bebas dari gangguan atau cacat.',
      'KonterApp tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan, atau kehilangan data yang disebabkan oleh penyalahgunaan akun oleh pihak ketiga.',
      'Total tanggung jawab KonterApp atas klaim apa pun dibatasi maksimal sebesar biaya langganan yang telah dibayarkan Pengguna dalam 3 (tiga) bulan terakhir sebelum klaim terjadi.',
    ],
  },
  {
    title: '9. Pengakhiran',
    content: [
      'Pengguna dapat berhenti berlangganan kapan pun melalui pengaturan akun atau dengan menghubungi tim KonterApp.',
      'KonterApp berhak menangguhkan atau mengakhiri akun Pengguna yang melanggar ketentuan ini, tunggakan pembayaran, atau berdasarkan permintaan otoritas berwenang.',
      'Sebelum pengakhiran permanen, Pengguna diberi kesempatan untuk mengekspor datanya selama akun masih aktif.',
    ],
  },
  {
    title: '10. Perubahan Ketentuan',
    content: [
      'KonterApp dapat memperbarui Syarat & Ketentuan ini dari waktu ke waktu. Versi terbaru akan dipublikasikan di halaman ini beserta tanggal pembaruannya.',
      'Penggunaan Layanan secara berkelanjutan setelah pembaruan dianggap sebagai persetujuan atas versi terbaru.',
    ],
  },
  {
    title: '11. Hukum yang Berlaku',
    content: [
      'Syarat & Ketentuan ini tunduk pada hukum Republik Indonesia.',
      'Setiap perselisihan akan diselesaikan secara musyawarah terlebih dahulu, dan apabila tidak tercapai, melalui pengadilan yang berwenang di Jakarta Selatan.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <p className="text-sm text-gray-500 mb-2">Terakhir diperbarui: 16 Agustus 2026</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#142D52] mb-8">
            Syarat & Ketentuan
          </h1>
          <div className="space-y-8">
            <p className="text-gray-700 leading-relaxed">
              Selamat datang di KonterApp. Mohon dibaca Syarat & Ketentuan penggunaan layanan
              kami dengan saksama sebelum menggunakan aplikasi. Dengan menggunakan KonterApp,
              Anda setuju untuk terikat pada ketentuan-ketentuan berikut. Jika Anda memiliki
              pertanyaan, silakan hubungi kami di{' '}
              <a href="mailto:support@konterapp.id" className="text-[#142D52] font-medium underline">
                support@konterapp.id
              </a>.
            </p>
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold text-[#142D52] mb-3">{section.title}</h2>
                <div className="space-y-3">
                  {section.content.map((paragraph, index) => (
                    <p key={index} className="text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
            <p className="text-gray-600 text-sm border-t border-gray-200 pt-6">
              Lihat juga{' '}
              <Link href="/legal/privacy" className="text-[#142D52] font-medium underline">
                Kebijakan Privasi
              </Link>{' '}
              kami.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
