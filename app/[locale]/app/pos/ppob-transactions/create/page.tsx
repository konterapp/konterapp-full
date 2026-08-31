import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import PpobTransactionForm from './_components/PpobTransactionForm';

export default function CreatePpobTransactionPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/pos/ppob-transactions"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Server Pulsa/PPOB</span>
        </Link>
      </div>
      <PpobTransactionForm />
    </div>
  );
}
