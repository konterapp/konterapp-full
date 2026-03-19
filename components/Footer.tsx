import { Link } from '@/i18n/navigation';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0B1E3A] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">

          <div className="lg:col-span-1">
            <Link href="/" className="text-2xl font-bold text-white mb-4 block">
              KonterApp
            </Link>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Solusi PPOB dan Kasir (POS) terlengkap untuk membantu mengembangkan usaha konter pulsa dan toko kelontong Anda.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#EBC170]">Produk</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Pulsa & Data</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Token PLN</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Tagihan PPOB</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Topup E-Wallet</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Kasir Digital</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#EBC170]">Perusahaan</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Tentang Kami</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Karir</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Kontak</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#EBC170]">Hubungi Kami</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>support@konterapp.id</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <Phone className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Jl. Teknologi No. 1, Jakarta Selatan</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
            Copyright &copy; {new Date().getFullYear()} KonterApp. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Syarat & Ketentuan</Link>
            <Link href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Kebijakan Privasi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
