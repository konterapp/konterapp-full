import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import StockOpnameCreateForm from '../_components/StockOpnameCreateForm';

export default function CreateStockOpnamePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/pos/stock-opname"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Riwayat Stok Opname</span>
        </Link>
      </div>

      <StockOpnameCreateForm />
    </div>
  );
}
