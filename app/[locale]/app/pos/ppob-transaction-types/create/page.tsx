import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import PpobTransactionTypeForm from '../_components/PpobTransactionTypeForm';

export default function CreatePpobTransactionTypePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/pos/ppob-transaction-types"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Jenis Transaksi PPOB</span>
        </Link>
      </div>
      <PpobTransactionTypeForm mode="create" />
    </div>
  );
}
