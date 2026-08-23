import {
    LayoutDashboard,
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
    CircleDollarSign,
    Shield,
    Gift,
} from 'lucide-react';

export type MenuSection =
    | 'Operasional'
    | 'Produk'
    | 'Master Data'
    | 'Inventori & Keuangan'
    | 'Laporan'
    | 'Pengaturan'
    | 'Segera';

export interface SubMenuItem {
    key?: string;
    label: string;
    href: string;
    icon?: React.ReactNode;
    badge?: number | null;
    permission?: string;
    roleRequired?: string | string[];
    excludeRole?: string | string[];
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
    submenu?: SubMenuItem[];
}

const coreMenuItems: MenuItem[] = [
    // Operasional
    {
        section: 'Operasional',
        label: 'Dashboard',
        href: '/app',
        icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
        section: 'Operasional',
        label: 'Kasir',
        href: '/app/pos', 
        icon: <ShoppingCart className="w-5 h-5" />,
        permission: 'pos.sale.create'
    },
    {
        section: 'Operasional',
        label: 'Penjualan',
        href: '/app/pos/transactions', 
        icon: <Receipt className="w-5 h-5" />,
        permission: 'pos.sale.index'
    },
    {
        section: 'Operasional',
        label: 'Pembelian',
        href: '/app/pos/purchases',
        icon: <ClipboardList className="w-5 h-5" />,
        permission: 'pos.purchase.index'
    },
    {
        section: 'Operasional',
        label: 'Shift Kasir',
        href: '/app/pos/shifts',
        icon: <CircleDot className="w-5 h-5" />,
        permission: 'pos.sale.create'
    },
    // Produk
    {
        section: 'Produk',
        label: 'Produk',
        href: '/app/pos/products',
        icon: <Package className="w-5 h-5" />,
        permission: 'pos.product.index'
    },
    {
        section: 'Produk',
        label: 'Kategori',
        href: '/app/pos/categories',
        icon: <Tag className="w-5 h-5" />,
        permission: 'pos.category.index'
    },
    {
        section: 'Produk',
        label: 'Satuan',
        href: '/app/pos/units',
        icon: <Scale className="w-5 h-5" />,
        permission: 'pos.unit.index'
    },

    // Master Data
    {
        section: 'Master Data',
        label: 'Pelanggan',
        href: '/app/pos/customers',
        icon: <UserRound className="w-5 h-5" />,
        permission: 'pos.sale.create'
    },
    {
        section: 'Master Data',
        label: 'Supplier', 
        href: '/app/pos/suppliers', 
        icon: <Truck className="w-5 h-5" />,
        permission: 'pos.supplier.index'
    },
    {
        section: 'Master Data',
        label: 'Metode Pembayaran', 
        href: '/app/pos/payment-methods', 
        icon: <CreditCard className="w-5 h-5" />,
        permission: 'pos.payment-method.index'
    },
    {
        section: 'Master Data',
        label: 'Cabang/Lokasi', 
        href: '/app/pos/branches', 
        icon: <Building2 className="w-5 h-5" />,
        permission: 'pos.branch.index'
    },
    // Inventori & Keuangan
    {
        section: 'Inventori & Keuangan',
        label: 'Stok On-Hand',
        href: '/app/pos/stock-on-hand',
        icon: <History className="w-5 h-5" />,
        permission: 'pos.stock-movement.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Mutasi Stok',
        href: '/app/pos/stock-movements',
        icon: <ArrowLeftRight className="w-5 h-5" />,
        permission: 'pos.stock-movement.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Stok Opname',
        href: '/app/pos/stock-opname',
        icon: <ClipboardCheck className="w-5 h-5" />,
        permission: 'pos.stock-movement.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Piutang',
        href: '/app/pos/receivables',
        icon: <Wallet className="w-5 h-5" />,
        permission: 'pos.sale.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Hutang',
        href: '/app/pos/payables',
        icon: <Landmark className="w-5 h-5" />,
        permission: 'pos.purchase.index'
    },
    // Laporan
    {
        section: 'Laporan',
        label: 'Semua Laporan',
        href: '/app/pos/reports',
        icon: <TrendingUp className="w-5 h-5" />,
        permission: 'pos.report.index'
    },
    // Pengaturan
    {
        section: 'Pengaturan',
        label: 'Langganan',
        href: '/app/billing',
        icon: <CircleDollarSign className="w-5 h-5" />
    },
    {
        section: 'Pengaturan',
        label: 'Perusahaan',
        href: '/app/company',
        icon: <Building2 className="w-5 h-5" />,
        permission: 'company.update'
    },
    {
        section: 'Pengaturan',
        label: 'User',
        href: '/app/users',
        icon: <UserRound className="w-5 h-5" />,
        permission: 'user.index'
    },
    {
        section: 'Pengaturan',
        label: 'Role',
        href: '/app/roles',
        icon: <Shield className="w-5 h-5" />,
        permission: 'role.index'
    },
    {
        section: 'Pengaturan',
        label: 'Referral',
        href: '/app/referral',
        icon: <Gift className="w-5 h-5" />
    },
];

// Segera - fitur yang belum dilanjutkan. Cuma ditampilkan di development
// (lihat penggabungan di bawah) supaya tidak membingungkan user di production.
const comingSoonMenuItems: MenuItem[] = [
    {
        section: 'Segera',
        label: 'Cek Harga',
        icon: <ScanLine className="w-5 h-5" />,
        isPlaceholder: true
    },
    {
        section: 'Segera',
        label: 'Printer',
        icon: <Printer className="w-5 h-5" />,
        isPlaceholder: true
    },
    {
        section: 'Segera',
        label: 'Audit Log',
        icon: <FileSearch className="w-5 h-5" />,
        isPlaceholder: true
    },
    {
        section: 'Segera',
        label: 'PPOB',
        icon: <Zap className="w-5 h-5" />,
        isPlaceholder: true
    },
    {
        section: 'Segera',
        label: 'Riwayat PPOB',
        icon: <History className="w-5 h-5" />,
        isPlaceholder: true
    },
    {
        section: 'Segera',
        label: 'Produk PPOB',
        icon: <Package className="w-5 h-5" />,
        isPlaceholder: true
    },
];

export const allMenuItems: MenuItem[] = process.env.NODE_ENV === 'production'
    ? coreMenuItems
    : [...coreMenuItems, ...comingSoonMenuItems];
