import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import BankAgentTransactionForm from './_components/BankAgentTransactionForm';

export default function CreateBankAgentTransactionPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/pos/bank-agent-transactions"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Agen Bank</span>
        </Link>
      </div>
      <BankAgentTransactionForm />
    </div>
  );
}
