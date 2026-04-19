import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import UnitForm from '../_components/UnitForm';

export default function CreateUnitPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/pos/units"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Satuan</span>
        </Link>
      </div>
      <UnitForm mode="create" />
    </div>
  );
}
