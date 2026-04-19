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
    CircleDot,
    UserRound,
    Printer,
    ArrowLeftRight,
    ClipboardCheck,
    Wallet,
    Landmark,
    Scale,
    ScanLine,
    FileSearch,
} from 'lucide-react';

export type AdminScope = 'daerah' | 'nasional' | 'internasional' | 'mice';
export type MenuSection =
    | 'Operasional'
    | 'Master Data'
    | 'Inventori & Keuangan'
    | 'Laporan'
    | 'PPOB';

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
    section: MenuSection;
    label: string;
    href?: string;
    isPlaceholder?: boolean;
    icon: React.ReactNode;
    badge?: number | null;
    permission?: string;
    roleRequired?: string | string[];
    scopeRequired?: AdminScope[];
    submenu?: SubMenuItem[];
}

export const allMenuItems: MenuItem[] = [
    // Operasional
    {
        section: 'Operasional',
        label: 'Dashboard',
        href: '/admin',
        icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
        section: 'Operasional',
        label: 'Point of Sales',
        href: '/admin/pos', 
        icon: <ShoppingCart className="w-5 h-5" />,
        permission: 'admin.pos.sale.create'
    },
    {
        section: 'Operasional',
        label: 'Penjualan',
        href: '/admin/pos/transactions', 
        icon: <Receipt className="w-5 h-5" />,
        permission: 'admin.pos.sale.index'
    },
    {
        section: 'Operasional',
        label: 'Pembelian',
        href: '/admin/pos/purchases',
        icon: <ClipboardList className="w-5 h-5" />,
        permission: 'admin.pos.purchase.index'
    },
    {
        section: 'Operasional',
        label: 'Shift Kasir',
        href: '/admin/pos/shifts',
        icon: <CircleDot className="w-5 h-5" />,
        permission: 'admin.pos.sale.create'
    },
    {
        section: 'Operasional',
        label: 'Cek Harga',
        href: '/admin/pos/price-check',
        icon: <ScanLine className="w-5 h-5" />,
        permission: 'admin.pos.sale.create'
    },

    // Master Data
    {
        section: 'Master Data',
        label: 'Produk', 
        href: '/admin/pos/products', 
        icon: <Package className="w-5 h-5" />,
        permission: 'admin.pos.product.index'
    },
    {
        section: 'Master Data',
        label: 'Kategori',
        href: '/admin/pos/categories', 
        icon: <Tag className="w-5 h-5" />,
        permission: 'admin.pos.category.index'
    },
    {
        section: 'Master Data',
        label: 'Satuan',
        href: '/admin/pos/units',
        icon: <Scale className="w-5 h-5" />,
        permission: 'admin.pos.unit.index'
    },
    {
        section: 'Master Data',
        label: 'Pelanggan',
        href: '/admin/pos/customers',
        icon: <UserRound className="w-5 h-5" />,
        permission: 'admin.pos.sale.create'
    },
    {
        section: 'Master Data',
        label: 'Supplier', 
        href: '/admin/pos/suppliers', 
        icon: <Truck className="w-5 h-5" />,
        permission: 'admin.pos.supplier.index'
    },
    {
        section: 'Master Data',
        label: 'Metode Pembayaran', 
        href: '/admin/pos/payment-methods', 
        icon: <CreditCard className="w-5 h-5" />,
        permission: 'admin.pos.payment-method.index'
    },
    {
        section: 'Master Data',
        label: 'Cabang/Lokasi', 
        href: '/admin/pos/branches', 
        icon: <Building2 className="w-5 h-5" />,
        permission: 'admin.pos.branch.index'
    },
    {
        section: 'Master Data',
        label: 'User',
        href: '/admin/users', 
        icon: <Users className="w-5 h-5" />,
        permission: 'admin.user.index'
    },
    {
        section: 'Master Data',
        label: 'Role',
        href: '/admin/roles',
        icon: <Shield className="w-5 h-5" />,
        permission: 'admin.role.index'
    },
    {
        section: 'Master Data',
        label: 'Printer',
        icon: <Printer className="w-5 h-5" />,
        isPlaceholder: true
    },

    // Inventori & Keuangan
    {
        section: 'Inventori & Keuangan',
        label: 'Stok On-Hand',
        href: '/admin/pos/stock-on-hand',
        icon: <History className="w-5 h-5" />,
        permission: 'admin.pos.stock-movement.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Mutasi Stok',
        href: '/admin/pos/stock-movements',
        icon: <ArrowLeftRight className="w-5 h-5" />,
        permission: 'admin.pos.stock-movement.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Stok Opname',
        href: '/admin/pos/stock-opname',
        icon: <ClipboardCheck className="w-5 h-5" />,
        permission: 'admin.pos.stock-movement.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Piutang',
        href: '/admin/pos/receivables',
        icon: <Wallet className="w-5 h-5" />,
        permission: 'admin.pos.sale.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Hutang',
        href: '/admin/pos/payables',
        icon: <Landmark className="w-5 h-5" />,
        permission: 'admin.pos.purchase.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Accounting',
        icon: <Landmark className="w-5 h-5" />,
        isPlaceholder: true
    },

    // Laporan
    {
        section: 'Laporan',
        label: 'Semua Laporan',
        href: '/admin/pos/reports',
        icon: <TrendingUp className="w-5 h-5" />,
        permission: 'admin.pos.report.index'
    },
    {
        section: 'Laporan',
        label: 'Audit Log',
        icon: <FileSearch className="w-5 h-5" />,
        isPlaceholder: true
    },

    // PPOB
    {
        section: 'PPOB',
        label: 'PPOB',
        href: '/admin/pos/ppob',
        icon: <Zap className="w-5 h-5" />,
        permission: 'admin.pos.ppob.index'
    },
    {
        section: 'PPOB',
        label: 'Riwayat PPOB',
        href: '/admin/pos/ppob/transactions',
        icon: <History className="w-5 h-5" />,
        permission: 'admin.pos.ppob.index'
    },
    {
        section: 'PPOB',
        label: 'Produk PPOB',
        href: '/admin/pos/ppob/products',
        icon: <Package className="w-5 h-5" />,
        permission: 'admin.pos.ppob.index'
    },
];
