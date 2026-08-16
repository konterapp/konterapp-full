import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import SupplierForm from '../_components/SupplierForm';

export default function CreateSupplierPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/pos/suppliers"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Supplier</span>
        </Link>
      </div>
      <SupplierForm mode="create" />
    </div>
  );
}
