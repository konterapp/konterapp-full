interface RouteInfo {
  path: string;
  permission: string;
}

// Route name helper dengan permission
export function route(name: string, params?: Record<string, string | number>): string {
  const routeInfo = routes[name];
  if (!routeInfo) {
    return '#';
  }

  let path = routeInfo.path;

  // Replace params
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, String(value));
    });
  }

  return path;
}

// Get permission by route name
export function getPermission(name: string): string | null {
  return routes[name]?.permission || null;
}

// Get permission by pathname
export function getPermissionByPath(pathname: string): string | null {
  // Strip locale prefix (e.g. /en/app/... -> /app/...)
  const normalized = pathname.replace(/^\/[a-z]{2}(?=\/app)/, '');

  // Cek exact match terlebih dahulu
  for (const [, routeInfo] of Object.entries(routes)) {
    if (routeInfo.path === normalized) {
      return routeInfo.permission;
    }
  }

  // Cek untuk routes dengan params (edit routes: /app/{resource}/{id}/edit)
  for (const [, routeInfo] of Object.entries(routes)) {
    const pattern = routeInfo.path.replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);

    if (regex.test(normalized)) {
      return routeInfo.permission;
    }
  }

  return null;
}

// Routes mapping dengan permission
const routes: Record<string, RouteInfo> = {
  'berita.index': {
    path: '/app/berita',
    permission: 'berita.index',
  },
  'berita.create': {
    path: '/app/berita/create',
    permission: 'berita.create',
  },
  'berita.detail': {
    path: '/app/berita/:id',
    permission: 'berita.index',
  },
  'berita.edit': {
    path: '/app/berita/:id/edit',
    permission: 'berita.update',
  },
  'pos.sale.create': {
    path: '/app/pos',
    permission: 'pos.sale.create',
  },
  'pos.sale.index': {
    path: '/app/pos/transactions',
    permission: 'pos.sale.index',
  },
  'pos.product.index': {
    path: '/app/pos/products',
    permission: 'pos.product.index',
  },
  'pos.category.index': {
    path: '/app/pos/categories',
    permission: 'pos.category.index',
  },
  'pos.unit.index': {
    path: '/app/pos/units',
    permission: 'pos.unit.index',
  },
  'pos.unit.create': {
    path: '/app/pos/units/create',
    permission: 'pos.unit.create',
  },
  'pos.unit.edit': {
    path: '/app/pos/units/:id/edit',
    permission: 'pos.unit.update',
  },
  'pos.customer.index': {
    path: '/app/pos/customers',
    permission: 'pos.sale.create',
  },
  'pos.customer.create': {
    path: '/app/pos/customers/create',
    permission: 'pos.sale.create',
  },
  'pos.customer.edit': {
    path: '/app/pos/customers/:id/edit',
    permission: 'pos.sale.create',
  },
  'pos.supplier.index': {
    path: '/app/pos/suppliers',
    permission: 'pos.supplier.index',
  },
  'pos.purchase.index': {
    path: '/app/pos/purchases',
    permission: 'pos.purchase.index',
  },
  'pos.purchase.create': {
    path: '/app/pos/purchases/create',
    permission: 'pos.purchase.create',
  },
  'pos.purchase.detail': {
    path: '/app/pos/purchases/:id',
    permission: 'pos.purchase.index',
  },
  'pos.purchase.edit-draft': {
    path: '/app/pos/purchases/:id/edit',
    permission: 'pos.purchase.create',
  },
  'pos.shift.index': {
    path: '/app/pos/shifts',
    permission: 'pos.sale.create',
  },
  'pos.price-check.index': {
    path: '/app/pos/price-check',
    permission: 'pos.sale.create',
  },
  'pos.stock-on-hand.index': {
    path: '/app/pos/stock-on-hand',
    permission: 'pos.stock-movement.index',
  },
  'pos.stock-movement.index': {
    path: '/app/pos/stock-movements',
    permission: 'pos.stock-movement.index',
  },
  'pos.stock-opname.index': {
    path: '/app/pos/stock-opname',
    permission: 'pos.stock-movement.index',
  },
  'pos.stock-opname.create': {
    path: '/app/pos/stock-opname/create',
    permission: 'pos.stock-movement.index',
  },
  'pos.receivable.index': {
    path: '/app/pos/receivables',
    permission: 'pos.sale.index',
  },
  'pos.payable.index': {
    path: '/app/pos/payables',
    permission: 'pos.purchase.index',
  },
  'pos.report.index': {
    path: '/app/pos/reports',
    permission: 'pos.report.index',
  },
  'pos.payment-method.index': {
    path: '/app/pos/payment-methods',
    permission: 'pos.payment-method.index',
  },
  'pos.payment-method.create': {
    path: '/app/pos/payment-methods/create',
    permission: 'pos.payment-method.create',
  },
  'pos.payment-method.edit': {
    path: '/app/pos/payment-methods/:id/edit',
    permission: 'pos.payment-method.update',
  },
  'pos.ppob.index': {
    path: '/app/pos/ppob',
    permission: 'pos.ppob.index',
  },
  'pos.ppob.transactions': {
    path: '/app/pos/ppob/transactions',
    permission: 'pos.ppob.index',
  },
  'pos.ppob.products': {
    path: '/app/pos/ppob/products',
    permission: 'pos.ppob.index',
  },
  'pos.branch.index': {
    path: '/app/pos/branches',
    permission: 'pos.branch.index',
  },
  'pos.branch.create': {
    path: '/app/pos/branches/create',
    permission: 'pos.branch.create',
  },
  'pos.branch.edit': {
    path: '/app/pos/branches/:id/edit',
    permission: 'pos.branch.update',
  },
};
