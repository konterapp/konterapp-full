import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '../_components/ProductForm';

export default function CreateProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/pos/products"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Produk</span>
        </Link>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
