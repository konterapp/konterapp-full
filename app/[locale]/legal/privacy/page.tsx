import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi - KonterApp',
  description:
    'Kebijakan privasi KonterApp: bagaimana kami mengumpulkan, menggunakan, dan melindungi data pengguna aplikasi kasir dan PPOB.',
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: '1. Pendahuluan',
    content: [
      'Kebijakan Privasi ini menjelaskan bagaimana KonterApp ("kami") mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi Anda saat menggunakan aplikasi dan layanan kami.',
      'Dengan menggunakan layanan KonterApp, Anda menyetujui praktik yang dijelaskan dalam kebijakan ini.',
    ],
  },
  {
    title: '2. Data yang Kami Kumpulkan',
    content: [
      'Data akun: nama lengkap, alamat email, dan kata sandi (tersimpan dalam bentuk terenkripsi/hash).',
      'Data perusahaan: nama perusahaan, alamat, logo, dan informasi cabang yang Anda masukkan sendiri.',
      'Data operasional: produk, transaksi penjualan, pembelian, stok, pelanggan, dan data usaha lainnya yang Anda kelola di dalam aplikasi.',
      'Data teknis: alamat IP, jenis peramban (browser), dan log aktivitas sistem untuk keperluan keamanan dan peningkatan layanan.',
      'Data pembayaran: informasi tagihan langganan. Data kartu/kredensial pembayaran TIDAK kami simpan karena diproses langsung oleh payment gateway resmi.',
    ],
  },
  {
    title: '3. Cara Kami Menggunakan Data',
    content: [
      'Menyediakan dan memelihara layanan kasir (POS), PPOB, dan fitur langganan.',
      'Mengautentikasi akun serta memverifikasi transaksi penting.',
      'Mengirim notifikasi terkait akun, tagihan langganan, dan pembaruan layanan.',
      'Menganalisis penggunaan layanan secara agregat untuk memperbaiki produk.',
      'Memenuhi kewajiban hukum dan melindungi keamanan sistem serta pengguna.',
    ],
  },
  {
    title: '4. Dasar Pemrosesan & Kepemilikan Data',
    content: [
      'Pemrosesan data dilakukan berdasarkan persetujuan Anda, pelaksanaan kontrak langganan, dan/atau kepentingan sah kami dalam menjalankan layanan.',
      'Data operasional perusahaan Anda (produk, transaksi, pelanggan) tetap menjadi milik Anda selaku Pengguna. Kami memprosesnya semata-mata untuk menjalankan Layanan.',
    ],
  },
  {
    title: '5. Pembagian Data kepada Pihak Ketiga',
    content: [
      'Kami TIDAK menjual data pribadi Anda kepada pihak mana pun.',
      'Data hanya dibagikan kepada: (a) penyedia payment gateway untuk memproses pembayaran langganan; (b) penyedia infrastruktur cloud untuk hosting aplikasi dan basis data; (c) aparat penegak hukum apabila diwajibkan oleh peraturan perundang-undangan.',
      'Setiap pihak ketiga tersebut terikat perjanjian kerahasiaan dan perlindungan data.',
    ],
  },
  {
    title: '6. Keamanan Data',
    content: [
      'Kami menerapkan langkah teknis dan organisasi yang wajar untuk melindungi data Anda, termasuk enkripsi kata sandi, pembatasan akses berbasis peran (RBAC), pemantauan error, dan komunikasi terenkripsi (HTTPS).',
      'Meskipun demikian, tidak ada metode transmisi atau penyimpanan data yang sepenuhnya aman; kami tidak dapat menjamin keamanan absolut.',
      'Apabila terjadi insiden kebocoran data, kami akan memberitahukan Anda dan otoritas terkait sesuai ketentuan peraturan perundang-undangan yang berlaku.',
    ],
  },
  {
    title: '7. Retensi & Penghapusan Data',
    content: [
      'Data akun dan data operasional disimpan selama akun dan langganan Anda aktif.',
      'Apabila akun dihapus atau langganan berakhir secara permanen, data akan dihapus atau dianonimkan dalam jangka waktu maksimal 90 (sembilan puluh) hari, kecuali data yang wajib disimpan menurut hukum.',
    ],
  },
  {
    title: '8. Cookie & Teknologi Serupa',
    content: [
      'Kami menggunakan cookie esensial untuk menjaga sesi login dan keamanan aplikasi.',
      'Kami dapat menggunakan cookie analitik untuk memahami penggunaan layanan secara agregat.',
      'Anda dapat mengatur atau menonaktifkan cookie melalui pengaturan peramban Anda, meskipun sebagian fitur mungkin tidak berfungsi dengan baik tanpa cookie esensial.',
    ],
  },
  {
    title: '9. Hak Anda',
    content: [
      'Anda berhak mengakses, memperbaiki, atau menghapus data pribadi Anda melalui aplikasi atau dengan menghubungi kami.',
      'Anda berhak menarik persetujuan pemrosesan data atau meminta salinan data Anda.',
      'Untuk exercise hak tersebut, kirim email ke support@konterapp.id dan kami akan merespons dalam waktu maksimal 14 hari kerja.',
    ],
  },
  {
    title: '10. Privasi Anak',
    content: [
      'Layanan KonterApp tidak ditujukan bagi anak di bawah 13 tahun, dan kami tidak dengan sengaja mengumpulkan data anak-anak.',
    ],
  },
  {
    title: '11. Perubahan Kebijakan',
    content: [
      'Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Versi terbaru akan dipublikasikan di halaman ini beserta tanggal pembaruannya.',
      'Perubahan material akan diberitahukan kepada Anda melalui aplikasi atau email sebelum berlaku.',
    ],
  },
  {
    title: '12. Hubungi Kami',
    content: [
      'Apabila ada pertanyaan mengenai Kebijakan Privasi ini, silakan hubungi:',
      'Email: support@konterapp.id',
      'Alamat: Jl. Teknologi No. 1, Jakarta Selatan, Indonesia.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <p className="text-sm text-gray-500 mb-2">Terakhir diperbarui: 16 Agustus 2026</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#142D52] mb-8">
            Kebijakan Privasi
          </h1>
          <div className="space-y-8">
            <p className="text-gray-700 leading-relaxed">
              Privasi Anda penting bagi kami. Dokumen ini menjelaskan bagaimana KonterApp
              menangani data Anda. Dengan menggunakan layanan kami, Anda menyetujui praktik
              yang dijelaskan di bawah ini.
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
              <Link href="/legal/terms" className="text-[#142D52] font-medium underline">
                Syarat & Ketentuan
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
