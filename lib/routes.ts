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
};
