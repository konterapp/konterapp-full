'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Smartphone,
  ShoppingCart,
  TrendingUp,
  ShieldCheck,
  Zap,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: <Smartphone className="w-8 h-8 text-[#EBC170]" />,
      title: "PPOB Terlengkap",
      description: "Jual pulsa, paket data, token PLN, bayar tagihan PDAM, BPJS, hingga topup e-wallet dengan harga termurah."
    },
    {
      icon: <ShoppingCart className="w-8 h-8 text-[#EBC170]" />,
      title: "Kasir Digital (POS)",
      description: "Kelola stok barang, catat penjualan, cetak struk via printer bluetooth, dan pantau omzet harian secara realtime."
    },
    {
      icon: <Users className="w-8 h-8 text-[#EBC170]" />,
      title: "Manajemen Pelanggan",
      description: "Simpan data pelanggan, catat hutang piutang, dan kirim struk pembelian via WhatsApp dengan mudah."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-[#EBC170]" />,
      title: "Laporan Keuangan",
      description: "Analisa keuntungan usaha Anda dengan laporan keuangan otomatis yang detail dan mudah dipahami."
    }
  ];

  const products = [
    { name: "Pulsa & Data", icon: "📱", desc: "All Operator" },
    { name: "Token PLN", icon: "⚡", desc: "Listrik Pintar" },
    { name: "E-Wallet", icon: "💳", desc: "DANA, OVO, GoPay" },
    { name: "Tagihan", icon: "📄", desc: "PDAM, BPJS, Telkom" },
    { name: "Voucher Game", icon: "🎮", desc: "FF, MLBB, PUBG" },
    { name: "Transfer Bank", icon: "🏦", desc: "Ke 100+ Bank" },
  ];

  const testimonials = [
    {
      name: "Budi Santoso",
      role: "Pemilik Konter di Surabaya",
      content: "Sejak pakai KonterApp, pembukuan jadi rapi banget. Nggak pusing lagi ngitung omzet manual. Produk PPOB-nya juga lengkap!",
      image: "https://i.pravatar.cc/150?img=11"
    },
    {
      name: "Siti Aminah",
      role: "Agen PPOB di Bandung",
      content: "Transaksi super cepat, detik-an langsung masuk. CS-nya juga fast response kalau ada kendala. Recommended banget buat usaha!",
      image: "https://i.pravatar.cc/150?img=5"
    },
    {
      name: "Rudi Hartono",
      role: "Toko Kelontong di Jakarta",
      content: "Fitur kasirnya ngebantu banget buat toko kelontong saya. Bisa scan barcode barang dan cetak struk langsung.",
      image: "https://i.pravatar.cc/150?img=13"
    }
  ];

  return (
    <div className="overflow-x-hidden bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#142D52]">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#EBC170]/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#EBC170]/10 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EBC170]/10 text-[#EBC170] text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                <span>Solusi Usaha #1 di Indonesia</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight font-poppins">
                Kelola Konter & <br />
                <span className="text-[#EBC170]">Bisnis PPOB</span> Jadi Lebih Mudah
              </h1>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-xl">
                Satu aplikasi untuk semua kebutuhan usaha Anda. Mulai dari jualan pulsa, bayar tagihan, hingga aplikasi kasir canggih untuk memantau perkembangan bisnis.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="px-8 py-4 bg-[#EBC170] hover:bg-[#d6af63] text-[#142D52] font-bold rounded-xl transition-all shadow-lg shadow-[#EBC170]/20 flex items-center justify-center gap-2">
                  Daftar Gratis Sekarang
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="#features" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-sm transition-all flex items-center justify-center">
                  Pelajari Fitur
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#EBC170]" />
                  <span>Gratis Pendaftaran</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#EBC170]" />
                  <span>Transaksi 24 Jam</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#EBC170]" />
                  <span>Aman & Terpercaya</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {/* Placeholder for App Screenshot */}
              <div className="relative z-10 mx-auto w-[280px] h-[580px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 rounded-b-xl z-20 w-40 mx-auto"></div>
                <div className="w-full h-full bg-white overflow-hidden flex flex-col">
                  {/* Mockup Screen Content */}
                  <div className="bg-[#142D52] p-6 pt-10 text-white">
                    <div className="flex justify-between items-center mb-6 mt-2">
                      <div>
                        <p className="text-xs opacity-80">Saldo Anda</p>
                        <p className="text-xl font-bold">Rp 2.500.000</p>
                      </div>
                      <div className="w-8 h-8 bg-[#EBC170] rounded-full flex items-center justify-center text-[#142D52] font-bold">K</div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
                          <div className="w-8 h-2 bg-white/10 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 flex-1">
                    <div className="w-full h-24 bg-white rounded-xl shadow-sm mb-4 p-3">
                      <div className="w-1/2 h-3 bg-gray-100 rounded mb-2"></div>
                      <div className="w-3/4 h-3 bg-gray-100 rounded"></div>
                    </div>
                    <div className="w-full h-24 bg-white rounded-xl shadow-sm mb-4 p-3">
                      <div className="w-1/2 h-3 bg-gray-100 rounded mb-2"></div>
                      <div className="w-3/4 h-3 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 -right-10 bg-white p-4 rounded-xl shadow-xl z-20 max-w-[180px]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Omzet Hari Ini</p>
                    <p className="text-sm font-bold text-gray-900 font-poppins">+Rp 1.250.000</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-32 -left-10 bg-white p-4 rounded-xl shadow-xl z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#142D52]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 font-poppins">Transaksi Sukses</p>
                    <p className="text-xs text-green-600 font-medium">Verified System</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#142D52] mb-4 font-poppins">
              Semua Fitur yang Anda Butuhkan
            </h2>
            <p className="text-gray-600 text-lg">
              Kami menyediakan alat lengkap untuk membantu operasional bisnis Anda berjalan lebih efisien dan menguntungkan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-xl bg-[#142D52]/5 flex items-center justify-center mb-6 group-hover:bg-[#142D52] transition-colors duration-300">
                  <div className="group-hover:text-white transition-colors duration-300">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#142D52] mb-3 font-poppins">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="advantages" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-[#142D52] rounded-3xl p-8 lg:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-[#EBC170]/10 blur-3xl"></div>

            <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 font-poppins">
                  Produk Digital Terlengkap & Termurah
                </h2>
                <p className="text-gray-300 mb-8 text-lg">
                  Nikmati akses ke ribuan produk digital dengan harga modal. Margin keuntungan lebih besar untuk usaha Anda.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="w-5 h-5 text-[#EBC170]" />
                    <span>Server stabil, transaksi hitungan detik</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="w-5 h-5 text-[#EBC170]" />
                    <span>Customer service standby 24 jam</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="w-5 h-5 text-[#EBC170]" />
                    <span>Bisa cetak struk dengan nama toko sendiri</span>
                  </li>
                </ul>
                <Link href="/register" className="inline-block px-8 py-3 bg-[#EBC170] hover:bg-[#d6af63] text-[#142D52] font-bold rounded-xl transition-all">
                  Lihat Daftar Harga
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer text-center"
                  >
                    <div className="text-3xl mb-2">{product.icon}</div>
                    <h4 className="text-white font-semibold text-sm mb-1">{product.name}</h4>
                    <p className="text-gray-400 text-xs">{product.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#142D52] mb-4 font-poppins">
              Harga yang Sederhana & Transparan
            </h2>
            <p className="text-gray-600 text-lg">
              Mulai gratis tanpa kartu kredit. Upgrade kapan saja saat usaha Anda berkembang.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Trial Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-8 lg:p-10 rounded-2xl shadow-sm border-2 border-gray-100 flex flex-col"
            >
              <h3 className="text-xl font-bold text-[#142D52] font-poppins mb-2">Free Trial</h3>
              <p className="text-gray-500 text-sm mb-6">Coba semua fitur tanpa risiko.</p>
              <div className="flex items-end gap-2 mb-8">
                <span className="text-4xl lg:text-5xl font-bold text-[#142D52] font-poppins">Rp0</span>
                <span className="text-gray-500 mb-1.5">/ 30 hari</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Semua fitur dasar KonterApp',
                  'Transaksi PPOB tanpa batas',
                  'Kasir digital (POS) lengkap',
                  'Laporan penjualan & stok',
                  'Maksimal 2 pengguna',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-600 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#EBC170] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="w-full px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-[#142D52] font-bold rounded-xl transition-all text-center cursor-pointer"
              >
                Mulai Gratis
              </Link>
            </motion.div>

            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              viewport={{ once: true }}
              className="bg-white p-8 lg:p-10 rounded-2xl shadow-sm border-2 border-gray-100 flex flex-col"
            >
              <h3 className="text-xl font-bold text-[#142D52] font-poppins mb-2">Bulanan</h3>
              <p className="text-gray-500 text-sm mb-6">Fleksibel, bayar per bulan.</p>
              <div className="flex items-end gap-2 mb-8">
                <span className="text-4xl lg:text-5xl font-bold text-[#142D52] font-poppins">Rp10.000</span>
                <span className="text-gray-500 mb-1.5">/ bulan</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Semua fitur Free Trial',
                  'Pengguna tanpa batas',
                  'Multi cabang & multi kasir',
                  'Laporan laba-rugi detail',
                  'Struk dengan nama toko sendiri',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-600 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#EBC170] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register?plan=monthly"
                className="w-full px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-[#142D52] font-bold rounded-xl transition-all text-center cursor-pointer"
              >
                Pilih Bulanan
              </Link>
              <p className="mt-4 text-center text-xs text-gray-400">
                Termasuk 30 hari free trial saat mendaftar
              </p>
            </motion.div>

            {/* Yearly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewport={{ once: true }}
              className="bg-[#142D52] p-8 lg:p-10 rounded-2xl shadow-xl border-2 border-[#EBC170] flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-5 right-5 px-3 py-1 bg-[#EBC170] text-[#142D52] text-xs font-bold rounded-full">
                Paling Hemat
              </div>
              <h3 className="text-xl font-bold text-white font-poppins mb-2">Tahunan</h3>
              <p className="text-gray-400 text-sm mb-6">Untuk usaha yang serius berkembang.</p>
              <div className="flex items-end gap-2 mb-8">
                <span className="text-4xl lg:text-5xl font-bold text-white font-poppins">Rp99.000</span>
                <span className="text-gray-400 mb-1.5">/ tahun</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Semua fitur Free Trial',
                  'Pengguna tanpa batas',
                  'Multi cabang & multi kasir',
                  'Laporan laba-rugi detail',
                  'Prioritas dukungan 24 jam',
                  'Struk dengan nama toko sendiri',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-200 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#EBC170] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register?plan=yearly"
                className="w-full px-6 py-3.5 bg-[#EBC170] hover:bg-[#d6af63] text-[#142D52] font-bold rounded-xl transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                Daftar Sekarang
              </Link>
              <p className="mt-4 text-center text-xs text-gray-400">
                Termasuk 30 hari free trial saat mendaftar
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#142D52] mb-4 font-poppins">
              Apa Kata Mitra Kami?
            </h2>
            <p className="text-gray-600 text-lg">
              Ribuan pengusaha konter dan toko kelontong telah mempercayakan bisnisnya pada KonterApp.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#142D52]">{testimonial.name}</h4>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-[#EBC170] fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed italic">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto bg-[#EBC170] rounded-3xl p-10 lg:p-16 text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-5xl font-bold text-[#142D52] mb-6 font-poppins">
              Siap Mengembangkan Usaha Anda?
            </h2>
            <p className="text-[#142D52]/80 text-lg mb-8 max-w-2xl mx-auto">
              Bergabunglah dengan ribuan mitra sukses lainnya. Pendaftaran gratis, tanpa biaya bulanan, dan langsung bisa transaksi.
            </p>
            <Link href="/register" className="inline-flex px-10 py-4 bg-[#142D52] hover:bg-[#0B1E3A] text-white font-bold rounded-xl transition-all shadow-lg items-center gap-2">
              <Zap className="w-5 h-5 text-[#EBC170]" />
              Daftar & Transaksi Sekarang
            </Link>
            <p className="mt-4 text-sm text-[#142D52]/70 font-medium">
              *Aplikasi mobile segera hadir. Saat ini transaksi dapat dilakukan melalui website.
            </p>
          </div>

          {/* Decorative shapes */}
          <div className="absolute top-0 left-0 -ml-16 -mt-16 w-64 h-64 rounded-full bg-white/20 blur-2xl"></div>
          <div className="absolute bottom-0 right-0 -mr-16 -mb-16 w-64 h-64 rounded-full bg-white/20 blur-2xl"></div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
