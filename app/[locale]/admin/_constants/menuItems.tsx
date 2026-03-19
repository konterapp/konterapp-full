import {
    LayoutDashboard,
    Users,
    Shield,
    ShoppingCart,
    Package,
    Receipt,
    Tag,
    Building2,
    Truck,
    ClipboardList,
    History,
    CreditCard,
    TrendingUp,
    Zap,
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
    
    // POS Section
    { 
        label: 'Kasir', 
        href: '/admin/pos', 
        icon: <ShoppingCart className="w-5 h-5" />,
        permission: 'admin.pos.sale.create'
    },
    { 
        label: 'Riwayat Transaksi', 
        href: '/admin/pos/transactions', 
        icon: <Receipt className="w-5 h-5" />,
        permission: 'admin.pos.sale.index'
    },
    { 
        label: 'PPOB', 
        href: '/admin/pos/ppob', 
        icon: <Zap className="w-5 h-5" />,
        permission: 'admin.pos.ppob.index'
    },
    { 
        label: 'Riwayat PPOB', 
        href: '/admin/pos/ppob/transactions', 
        icon: <History className="w-5 h-5" />,
        permission: 'admin.pos.ppob.index'
    },
    { 
        label: 'Produk PPOB', 
        href: '/admin/pos/ppob/products', 
        icon: <Package className="w-5 h-5" />,
        permission: 'admin.pos.ppob.index'
    },
    { 
        label: 'Produk', 
        href: '/admin/pos/products', 
        icon: <Package className="w-5 h-5" />,
        permission: 'admin.pos.product.index'
    },
    { 
        label: 'Kategori Produk', 
        href: '/admin/pos/categories', 
        icon: <Tag className="w-5 h-5" />,
        permission: 'admin.pos.category.index'
    },
    { 
        label: 'Supplier', 
        href: '/admin/pos/suppliers', 
        icon: <Truck className="w-5 h-5" />,
        permission: 'admin.pos.supplier.index'
    },
    { 
        label: 'Pembelian', 
        href: '/admin/pos/purchases', 
        icon: <ClipboardList className="w-5 h-5" />,
        permission: 'admin.pos.purchase.index'
    },
    { 
        label: 'Riwayat Stok', 
        href: '/admin/pos/stock-movements', 
        icon: <History className="w-5 h-5" />,
        permission: 'admin.pos.stock-movement.index'
    },
    { 
        label: 'Laporan Laba/Rugi', 
        href: '/admin/pos/reports', 
        icon: <TrendingUp className="w-5 h-5" />,
        permission: 'admin.pos.report.index'
    },
    { 
        label: 'Metode Pembayaran', 
        href: '/admin/pos/payment-methods', 
        icon: <CreditCard className="w-5 h-5" />,
        permission: 'admin.pos.payment-method.index'
    },
    { 
        label: 'Cabang/Lokasi', 
        href: '/admin/pos/branches', 
        icon: <Building2 className="w-5 h-5" />,
        permission: 'admin.pos.branch.index'
    },
    
    // System Management
    { 
        label: 'Manajemen User', 
        href: '/admin/users', 
        icon: <Users className="w-5 h-5" />,
        permission: 'admin.user.index'
    },
    { 
        label: 'Manajemen Role', 
        href: '/admin/roles', 
        icon: <Shield className="w-5 h-5" />,
        permission: 'admin.role.index'
    },
];
