'use client';

import { useCallback } from 'react';
import { useUser } from '@/app/[locale]/app/_context/UserContext';

interface UsePermissionsReturn {
    permissions: string[];
    roles: string[];
    adminScope: 'daerah' | 'nasional' | 'internasional' | 'mice' | null;
    isLoading: boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
    const { permissions, roles, adminScope, isLoading } = useUser();

    const hasPermission = useCallback((permission: string): boolean => {
        return permissions.includes(permission);
    }, [permissions]);

    const hasAnyPermission = useCallback((permsToCheck: string[]): boolean => {
        return permsToCheck.some((perm) => permissions.includes(perm));
    }, [permissions]);

    const hasAllPermissions = useCallback((permsToCheck: string[]): boolean => {
        return permsToCheck.every((perm) => permissions.includes(perm));
    }, [permissions]);

    return {
        permissions,
        roles,
        adminScope,
        isLoading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
    };
}
