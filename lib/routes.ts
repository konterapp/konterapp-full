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
  'admin.user.index': {
    path: '/app/users',
    permission: 'admin.user.index',
  },
  'admin.user.create': {
    path: '/app/users/create',
    permission: 'admin.user.create',
  },
  'admin.user.edit': {
    path: '/app/users/:id/edit',
    permission: 'admin.user.update',
  },
  'admin.user.detail': {
    path: '/app/users/:id',
    permission: 'admin.user.update',
  },
  'admin.role.index': {
    path: '/app/roles',
    permission: 'admin.role.index',
  },
  'admin.role.create': {
    path: '/app/roles/create',
    permission: 'admin.role.create',
  },
  'admin.role.edit': {
    path: '/app/roles/:id/edit',
    permission: 'admin.role.update',
  },
  'admin.role.detail': {
    path: '/app/roles/:id',
    permission: 'admin.role.index',
  },
  'admin.berita.index': {
    path: '/app/berita',
    permission: 'admin.berita.index',
  },
  'admin.berita.create': {
    path: '/app/berita/create',
    permission: 'admin.berita.create',
  },
  'admin.berita.detail': {
    path: '/app/berita/:id',
    permission: 'admin.berita.index',
  },
  'admin.berita.edit': {
    path: '/app/berita/:id/edit',
    permission: 'admin.berita.update',
  },
  'admin.pos.sale.create': {
    path: '/app/pos',
    permission: 'admin.pos.sale.create',
  },
  'admin.pos.sale.index': {
    path: '/app/pos/transactions',
    permission: 'admin.pos.sale.index',
  },
  'admin.pos.product.index': {
    path: '/app/pos/products',
    permission: 'admin.pos.product.index',
  },
  'admin.pos.category.index': {
    path: '/app/pos/categories',
    permission: 'admin.pos.category.index',
  },
  'admin.pos.unit.index': {
    path: '/app/pos/units',
    permission: 'admin.pos.unit.index',
  },
  'admin.pos.unit.create': {
    path: '/app/pos/units/create',
    permission: 'admin.pos.unit.create',
  },
  'admin.pos.unit.edit': {
    path: '/app/pos/units/:id/edit',
    permission: 'admin.pos.unit.update',
  },
  'admin.pos.customer.index': {
    path: '/app/pos/customers',
    permission: 'admin.pos.sale.create',
  },
  'admin.pos.customer.create': {
    path: '/app/pos/customers/create',
    permission: 'admin.pos.sale.create',
  },
  'admin.pos.customer.edit': {
    path: '/app/pos/customers/:id/edit',
    permission: 'admin.pos.sale.create',
  },
  'admin.pos.supplier.index': {
    path: '/app/pos/suppliers',
    permission: 'admin.pos.supplier.index',
  },
  'admin.pos.purchase.index': {
    path: '/app/pos/purchases',
    permission: 'admin.pos.purchase.index',
  },
  'admin.pos.purchase.create': {
    path: '/app/pos/purchases/create',
    permission: 'admin.pos.purchase.create',
  },
  'admin.pos.purchase.detail': {
    path: '/app/pos/purchases/:id',
    permission: 'admin.pos.purchase.index',
  },
  'admin.pos.purchase.edit-draft': {
    path: '/app/pos/purchases/:id/edit',
    permission: 'admin.pos.purchase.create',
  },
  'admin.pos.shift.index': {
    path: '/app/pos/shifts',
    permission: 'admin.pos.sale.create',
  },
  'admin.pos.price-check.index': {
    path: '/app/pos/price-check',
    permission: 'admin.pos.sale.create',
  },
  'admin.pos.stock-on-hand.index': {
    path: '/app/pos/stock-on-hand',
    permission: 'admin.pos.stock-movement.index',
  },
  'admin.pos.stock-movement.index': {
    path: '/app/pos/stock-movements',
    permission: 'admin.pos.stock-movement.index',
  },
  'admin.pos.stock-opname.index': {
    path: '/app/pos/stock-opname',
    permission: 'admin.pos.stock-movement.index',
  },
  'admin.pos.stock-opname.create': {
    path: '/app/pos/stock-opname/create',
    permission: 'admin.pos.stock-movement.index',
  },
  'admin.pos.receivable.index': {
    path: '/app/pos/receivables',
    permission: 'admin.pos.sale.index',
  },
  'admin.pos.payable.index': {
    path: '/app/pos/payables',
    permission: 'admin.pos.purchase.index',
  },
  'admin.pos.report.index': {
    path: '/app/pos/reports',
    permission: 'admin.pos.report.index',
  },
  'admin.pos.payment-method.index': {
    path: '/app/pos/payment-methods',
    permission: 'admin.pos.payment-method.index',
  },
  'admin.pos.payment-method.create': {
    path: '/app/pos/payment-methods/create',
    permission: 'admin.pos.payment-method.create',
  },
  'admin.pos.payment-method.edit': {
    path: '/app/pos/payment-methods/:id/edit',
    permission: 'admin.pos.payment-method.update',
  },
  'admin.pos.ppob.index': {
    path: '/app/pos/ppob',
    permission: 'admin.pos.ppob.index',
  },
  'admin.pos.ppob.transactions': {
    path: '/app/pos/ppob/transactions',
    permission: 'admin.pos.ppob.index',
  },
  'admin.pos.ppob.products': {
    path: '/app/pos/ppob/products',
    permission: 'admin.pos.ppob.index',
  },
  'admin.pos.branch.index': {
    path: '/app/pos/branches',
    permission: 'admin.pos.branch.index',
  },
  'admin.pos.branch.create': {
    path: '/app/pos/branches/create',
    permission: 'admin.pos.branch.create',
  },
  'admin.pos.branch.edit': {
    path: '/app/pos/branches/:id/edit',
    permission: 'admin.pos.branch.update',
  },
};
