import { MenuItem, SubMenuItem, AdminScope } from '@/app/[locale]/app/_constants/menuItems';

interface MenuFilterOptions {
    permissions: string[];
    roles: string[];
    adminScope: AdminScope | null;
}

/**
 * Filter menu berdasarkan permission, role, dan scope user
 */
export function filterMenuByAccess(
    items: MenuItem[],
    options: MenuFilterOptions
): MenuItem[] {
    const { permissions, roles, adminScope } = options;

    return items
        .map(item => {
            // Check role requirement
            if (item.roleRequired && !hasRole(roles, item.roleRequired)) {
                return null;
            }

            // Check scope requirement
            if (item.scopeRequired && !hasScope(adminScope, item.scopeRequired)) {
                return null;
            }

            // Check permission
            if (item.permission && !hasPermission(permissions, item.permission)) {
                return null;
            }

            // Filter submenu jika ada
            if (item.submenu) {
                const filteredSubmenu = filterSubmenu(item.submenu, options);

                // Jika tidak ada submenu yang bisa ditampilkan, hide parent
                if (filteredSubmenu.length === 0) return null;

                return {
                    ...item,
                    submenu: filteredSubmenu
                };
            }

            return item;
        })
        .filter((item): item is MenuItem => item !== null);
}

function filterSubmenu(
    submenu: SubMenuItem[],
    options: MenuFilterOptions
): SubMenuItem[] {
    const { permissions, roles, adminScope } = options;

    return submenu.filter(sub => {
        if (sub.roleRequired && !hasRole(roles, sub.roleRequired)) return false;
        if (sub.excludeRole && hasRole(roles, sub.excludeRole)) return false;
        if (sub.scopeRequired && !hasScope(adminScope, sub.scopeRequired)) return false;
        if (sub.permission && !hasPermission(permissions, sub.permission)) return false;
        return true;
    });
}

function hasRole(userRoles: string[], requiredRole: string | string[]): boolean {
    if (Array.isArray(requiredRole)) {
        return requiredRole.some(role => userRoles.includes(role));
    }

    if (requiredRole.includes('*')) {
        const pattern = requiredRole.replace('*', '');
        return userRoles.some(role => role.startsWith(pattern));
    }

    return userRoles.includes(requiredRole);
}

function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    if (requiredPermission.includes('|')) {
        return requiredPermission.split('|').some(p => userPermissions.includes(p.trim()));
    }
    return userPermissions.includes(requiredPermission);
}

function hasScope(userScope: AdminScope | null, requiredScopes: AdminScope[]): boolean {
    if (!userScope) return false;
    return requiredScopes.includes(userScope);
}
