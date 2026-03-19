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
  // Strip locale prefix (e.g. /en/admin/... -> /admin/...)
  const normalized = pathname.replace(/^\/[a-z]{2}(?=\/admin)/, '');

  // Cek exact match terlebih dahulu
  for (const [, routeInfo] of Object.entries(routes)) {
    if (routeInfo.path === normalized) {
      return routeInfo.permission;
    }
  }

  // Cek untuk routes dengan params (edit routes: /admin/{resource}/{id}/edit)
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
    path: '/admin/users',
    permission: 'admin.user.index',
  },
  'admin.user.create': {
    path: '/admin/users/create',
    permission: 'admin.user.create',
  },
  'admin.user.edit': {
    path: '/admin/users/:id/edit',
    permission: 'admin.user.update',
  },
  'admin.user.detail': {
    path: '/admin/users/:id',
    permission: 'admin.user.update',
  },
  'admin.role.index': {
    path: '/admin/roles',
    permission: 'admin.role.index',
  },
  'admin.role.create': {
    path: '/admin/roles/create',
    permission: 'admin.role.create',
  },
  'admin.role.edit': {
    path: '/admin/roles/:id/edit',
    permission: 'admin.role.update',
  },
  'admin.role.detail': {
    path: '/admin/roles/:id',
    permission: 'admin.role.index',
  },
  'admin.berita.index': {
    path: '/admin/berita',
    permission: 'admin.berita.index',
  },
  'admin.berita.create': {
    path: '/admin/berita/create',
    permission: 'admin.berita.create',
  },
  'admin.berita.detail': {
    path: '/admin/berita/:id',
    permission: 'admin.berita.index',
  },
  'admin.berita.edit': {
    path: '/admin/berita/:id/edit',
    permission: 'admin.berita.update',
  },
  'admin.pos.sale.create': {
    path: '/admin/pos',
    permission: 'admin.pos.sale.create',
  },
  'admin.pos.sale.index': {
    path: '/admin/pos/transactions',
    permission: 'admin.pos.sale.index',
  },
  'admin.pos.product.index': {
    path: '/admin/pos/products',
    permission: 'admin.pos.product.index',
  },
  'admin.pos.category.index': {
    path: '/admin/pos/categories',
    permission: 'admin.pos.category.index',
  },
  'admin.pos.supplier.index': {
    path: '/admin/pos/suppliers',
    permission: 'admin.pos.supplier.index',
  },
  'admin.pos.purchase.index': {
    path: '/admin/pos/purchases',
    permission: 'admin.pos.purchase.index',
  },
  'admin.pos.stock-movement.index': {
    path: '/admin/pos/stock-movements',
    permission: 'admin.pos.stock-movement.index',
  },
  'admin.pos.report.index': {
    path: '/admin/pos/reports',
    permission: 'admin.pos.report.index',
  },
  'admin.pos.payment-method.index': {
    path: '/admin/pos/payment-methods',
    permission: 'admin.pos.payment-method.index',
  },
  'admin.pos.payment-method.create': {
    path: '/admin/pos/payment-methods/create',
    permission: 'admin.pos.payment-method.create',
  },
  'admin.pos.payment-method.edit': {
    path: '/admin/pos/payment-methods/:id/edit',
    permission: 'admin.pos.payment-method.update',
  },
  'admin.pos.ppob.index': {
    path: '/admin/pos/ppob',
    permission: 'admin.pos.ppob.index',
  },
  'admin.pos.ppob.transactions': {
    path: '/admin/pos/ppob/transactions',
    permission: 'admin.pos.ppob.index',
  },
  'admin.pos.ppob.products': {
    path: '/admin/pos/ppob/products',
    permission: 'admin.pos.ppob.index',
  },
  'admin.pos.branch.index': {
    path: '/admin/pos/branches',
    permission: 'admin.pos.branch.index',
  },
  'admin.pos.branch.create': {
    path: '/admin/pos/branches/create',
    permission: 'admin.pos.branch.create',
  },
  'admin.pos.branch.edit': {
    path: '/admin/pos/branches/:id/edit',
    permission: 'admin.pos.branch.update',
  },
};
