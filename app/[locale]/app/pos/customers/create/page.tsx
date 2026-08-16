import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import CustomerForm from '../_components/CustomerForm';

export default function CreateCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/pos/customers"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Pelanggan</span>
        </Link>
      </div>
      <CustomerForm mode="create" />
    </div>
  );
}
