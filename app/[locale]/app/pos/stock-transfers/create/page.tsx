import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import StockTransferCreateForm from '../_components/StockTransferCreateForm';

export default function CreateStockTransferPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/pos/stock-transfers"
          className="inline-flex min-h-11 items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Riwayat Transfer Stok</span>
        </Link>
      </div>

      <StockTransferCreateForm />
    </div>
  );
}
