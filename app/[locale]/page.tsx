'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Calendar, MapPin, Users, ArrowRight, Mail, Phone, Newspaper, ChevronRight, LayoutDashboard } from 'lucide-react';
import { apiRequest, PaginatedData } from '@/lib/api/api';
import { getUser } from '@/lib/api/auth';

interface Berita {
  uuid: string;
  title: string;
  slug: string;
  content: string;
  image_url: string | null;
  tags: string[];
  news_type?: string;
  category?: string;
  author?: string;
  published_at: string;
}

export default function LandingPage() {
  const [beritas, setBeritas] = useState<Berita[]>([]);
  const [isLoadingBerita, setIsLoadingBerita] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchBeritas();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await getUser();
      if (response.status === 'success' && response.data) {
        setIsLoggedIn(true);
      }
    } catch {
      // not logged in
    }
  };

  const fetchBeritas = async () => {
    try {
      const response = await apiRequest<PaginatedData<Berita>>('/api/berita?per_page=3');
      if (response.status === 'success' && response.data) {
        setBeritas(response.data.data);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingBerita(false);
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image src="/images/logo_eventbyid.png" alt="EBI" width={40} height={40} />
              <span className="font-bold text-lg text-[#142D52]">Event By Indonesia</span>
            </div>
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#142D52] rounded-lg hover:bg-[#1e3a5f] transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#142D52] rounded-lg hover:bg-[#1e3a5f] transition-colors"
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#142D52] via-[#1e3a5f] to-[#2a4a6b]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#EBC170] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#EBC170] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                Platform Event
                <span className="text-[#EBC170]"> Terintegrasi</span> untuk Indonesia
              </h1>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Kelola, promosikan, dan temukan event terbaik di seluruh Indonesia.
                Satu platform untuk semua kebutuhan industri event nasional.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#EBC170] text-[#142D52] font-bold rounded-lg hover:bg-[#d4ab5f] transition-colors"
                >
                  Mulai Sekarang
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <Image
                src="/images/logo_eventbyid.png"
                alt="Event By Indonesia"
                width={400}
                height={400}
                className="w-80 h-auto opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Calendar, label: 'Event Terdaftar', value: '500+' },
              { icon: MapPin, label: 'Kota', value: '34 Provinsi' },
              { icon: Users, label: 'Pengguna', value: '10.000+' },
              { icon: Newspaper, label: 'Berita & Artikel', value: '100+' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#EBC170]/10 rounded-xl mb-3">
                  <stat.icon className="w-6 h-6 text-[#EBC170]" />
                </div>
                <div className="text-2xl font-bold text-[#142D52]">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-sm font-semibold text-[#EBC170] uppercase tracking-wider">Tentang Kami</span>
              <h2 className="text-3xl font-bold text-[#142D52] mt-2 mb-6">
                Event By Indonesia (EBI)
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Event By Indonesia (EBI) adalah platform terintegrasi yang dirancang untuk mendukung
                ekosistem industri event di Indonesia. EBI mempermudah pengelolaan, promosi, dan
                penemuan event di seluruh wilayah Indonesia.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Dengan fitur-fitur seperti manajemen event, direktori venue & hotel, sistem proposal,
                dan pelaporan digital, EBI menjadi solusi satu pintu untuk semua kebutuhan
                penyelenggaraan event nasional.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Manajemen Event',
                  'Direktori Venue & Hotel',
                  'Sistem Proposal',
                  'Berita & Informasi',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#EBC170] rounded-full" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md aspect-square bg-gradient-to-br from-[#142D52] to-[#2a4a6b] rounded-2xl p-8 flex items-center justify-center">
                <Image
                  src="/images/logo_eventbyid.png"
                  alt="EBI"
                  width={300}
                  height={300}
                  className="w-48 h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Berita Section */}
      <section id="berita" className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-[#EBC170] uppercase tracking-wider">Berita Terbaru</span>
            <h2 className="text-3xl font-bold text-[#142D52] mt-2">
              Informasi & Artikel
            </h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              Ikuti perkembangan terbaru seputar industri event di Indonesia
            </p>
          </div>

          {isLoadingBerita ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#142D52]" />
            </div>
          ) : beritas.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {beritas.map((berita) => (
                <article key={berita.uuid} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {berita.image_url ? (
                      <img
                        src={berita.image_url}
                        alt={berita.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {berita.category && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-[#EBC170]/10 text-[#b8904f] rounded-full">
                          {berita.category}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatDate(berita.published_at)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#142D52] mb-2 line-clamp-2 group-hover:text-[#EBC170] transition-colors">
                      {berita.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {stripHtml(berita.content)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              Belum ada berita
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <span className="text-sm font-semibold text-[#EBC170] uppercase tracking-wider">Hubungi Kami</span>
              <h2 className="text-3xl font-bold text-[#142D52] mt-2 mb-6">
                Ada Pertanyaan?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                Jangan ragu untuk menghubungi kami jika Anda memiliki pertanyaan
                atau membutuhkan informasi lebih lanjut tentang Event By Indonesia.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#142D52] rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#EBC170]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium text-[#142D52]">info@eventbyindonesia.id</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#142D52] rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#EBC170]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Telepon</div>
                    <div className="font-medium text-[#142D52]">+62 21 1234 5678</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#142D52] rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#EBC170]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Alamat</div>
                    <div className="font-medium text-[#142D52]">Jakarta, Indonesia</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-[#142D52] mb-6">Kirim Pesan</h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-transparent"
                    placeholder="Nama Anda"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-transparent"
                    placeholder="email@anda.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pesan</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-transparent resize-none"
                    placeholder="Tulis pesan Anda..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#142D52] text-white font-semibold rounded-lg hover:bg-[#1e3a5f] transition-colors flex items-center justify-center gap-2"
                >
                  Kirim Pesan
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#142D52] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/images/logo_eventbyid.png" alt="EBI" width={36} height={36} />
                <span className="font-bold text-lg">Event By Indonesia</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Platform terintegrasi untuk mendukung ekosistem industri event di Indonesia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Navigasi</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#about" className="hover:text-[#EBC170] transition-colors">Tentang Kami</a></li>
                <li><a href="#berita" className="hover:text-[#EBC170] transition-colors">Berita</a></li>
                <li><a href="#contact" className="hover:text-[#EBC170] transition-colors">Hubungi Kami</a></li>
                <li><Link href="/login" className="hover:text-[#EBC170] transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>info@eventbyindonesia.id</li>
                <li>+62 21 1234 5678</li>
                <li>Jakarta, Indonesia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Event By Indonesia. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
