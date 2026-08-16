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
} from 'lucide-react';

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

export const allMenuItems: MenuItem[] = [
    // Operasional
    {
        section: 'Operasional',
        label: 'Dashboard',
        href: '/app',
        icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
        section: 'Operasional',
        label: 'Langganan',
        href: '/app/billing',
        icon: <CircleDollarSign className="w-5 h-5" />
    },
    {
        section: 'Operasional',
        label: 'Point of Sales',
        href: '/app/pos', 
        icon: <ShoppingCart className="w-5 h-5" />,
        permission: 'admin.pos.sale.create'
    },
    {
        section: 'Operasional',
        label: 'Penjualan',
        href: '/app/pos/transactions', 
        icon: <Receipt className="w-5 h-5" />,
        permission: 'admin.pos.sale.index'
    },
    {
        section: 'Operasional',
        label: 'Pembelian',
        href: '/app/pos/purchases',
        icon: <ClipboardList className="w-5 h-5" />,
        permission: 'admin.pos.purchase.index'
    },
    {
        section: 'Operasional',
        label: 'Shift Kasir',
        href: '/app/pos/shifts',
        icon: <CircleDot className="w-5 h-5" />,
        permission: 'admin.pos.sale.create'
    },
    {
        section: 'Operasional',
        label: 'Cek Harga',
        href: '/app/pos/price-check',
        icon: <ScanLine className="w-5 h-5" />,
        permission: 'admin.pos.sale.create'
    },

    // Master Data
    {
        section: 'Master Data',
        label: 'Produk', 
        href: '/app/pos/products', 
        icon: <Package className="w-5 h-5" />,
        permission: 'admin.pos.product.index'
    },
    {
        section: 'Master Data',
        label: 'Kategori',
        href: '/app/pos/categories', 
        icon: <Tag className="w-5 h-5" />,
        permission: 'admin.pos.category.index'
    },
    {
        section: 'Master Data',
        label: 'Satuan',
        href: '/app/pos/units',
        icon: <Scale className="w-5 h-5" />,
        permission: 'admin.pos.unit.index'
    },
    {
        section: 'Master Data',
        label: 'Pelanggan',
        href: '/app/pos/customers',
        icon: <UserRound className="w-5 h-5" />,
        permission: 'admin.pos.sale.create'
    },
    {
        section: 'Master Data',
        label: 'Supplier', 
        href: '/app/pos/suppliers', 
        icon: <Truck className="w-5 h-5" />,
        permission: 'admin.pos.supplier.index'
    },
    {
        section: 'Master Data',
        label: 'Metode Pembayaran', 
        href: '/app/pos/payment-methods', 
        icon: <CreditCard className="w-5 h-5" />,
        permission: 'admin.pos.payment-method.index'
    },
    {
        section: 'Master Data',
        label: 'Cabang/Lokasi', 
        href: '/app/pos/branches', 
        icon: <Building2 className="w-5 h-5" />,
        permission: 'admin.pos.branch.index'
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
        href: '/app/pos/stock-on-hand',
        icon: <History className="w-5 h-5" />,
        permission: 'admin.pos.stock-movement.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Mutasi Stok',
        href: '/app/pos/stock-movements',
        icon: <ArrowLeftRight className="w-5 h-5" />,
        permission: 'admin.pos.stock-movement.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Stok Opname',
        href: '/app/pos/stock-opname',
        icon: <ClipboardCheck className="w-5 h-5" />,
        permission: 'admin.pos.stock-movement.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Piutang',
        href: '/app/pos/receivables',
        icon: <Wallet className="w-5 h-5" />,
        permission: 'admin.pos.sale.index'
    },
    {
        section: 'Inventori & Keuangan',
        label: 'Hutang',
        href: '/app/pos/payables',
        icon: <Landmark className="w-5 h-5" />,
        permission: 'admin.pos.purchase.index'
    },
    // Laporan
    {
        section: 'Laporan',
        label: 'Semua Laporan',
        href: '/app/pos/reports',
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
        href: '/app/pos/ppob',
        icon: <Zap className="w-5 h-5" />,
        permission: 'admin.pos.ppob.index'
    },
    {
        section: 'PPOB',
        label: 'Riwayat PPOB',
        href: '/app/pos/ppob/transactions',
        icon: <History className="w-5 h-5" />,
        permission: 'admin.pos.ppob.index'
    },
    {
        section: 'PPOB',
        label: 'Produk PPOB',
        href: '/app/pos/ppob/products',
        icon: <Package className="w-5 h-5" />,
        permission: 'admin.pos.ppob.index'
    },
];
