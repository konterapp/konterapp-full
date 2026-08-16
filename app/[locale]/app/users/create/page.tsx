import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import UserForm from '../_components/UserForm';

export default function CreateUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/users"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar User</span>
        </Link>
      </div>
      <UserForm mode="create" />
    </div>
  );
}
