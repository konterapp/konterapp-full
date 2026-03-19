import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import BranchForm from '../_components/BranchForm';

export default function CreateBranchPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/pos/branches"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Cabang</span>
        </Link>
      </div>
      <BranchForm mode="create" />
    </div>
  );
}
