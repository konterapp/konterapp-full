import { LayoutDashboard, Users, Shield } from 'lucide-react';

export interface AdministratorMenuItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

export const administratorMenuItems: AdministratorMenuItem[] = [
    {
        label: 'Dashboard',
        href: '/administrator',
        icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
        label: 'User',
        href: '/administrator/users',
        icon: <Users className="w-5 h-5" />,
    },
    {
        label: 'Role',
        href: '/administrator/roles',
        icon: <Shield className="w-5 h-5" />,
    },
];
