import {
    LayoutDashboard,
    Users,
    Shield,
} from 'lucide-react';

export type AdminScope = 'daerah' | 'nasional' | 'internasional' | 'mice';

export interface SubMenuItem {
    key?: string;
    label: string;
    href: string;
    icon?: React.ReactNode;
    badge?: number | null;
    permission?: string;
    roleRequired?: string | string[];
    excludeRole?: string | string[];
    scopeRequired?: AdminScope[];
}

export interface MenuItem {
    key?: string;
    label: string;
    href?: string;
    icon: React.ReactNode;
    badge?: number | null;
    permission?: string;
    roleRequired?: string | string[];
    scopeRequired?: AdminScope[];
    submenu?: SubMenuItem[];
}

export const allMenuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'User Management', href: '/admin/users', icon: <Users className="w-5 h-5" />, permission: 'admin.user.index' },
    { label: 'Role Management', href: '/admin/roles', icon: <Shield className="w-5 h-5" />, permission: 'admin.role.index' },
];
