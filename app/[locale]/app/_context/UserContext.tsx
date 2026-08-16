'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getUser, User } from '@/lib/api/auth';

interface UserContextType {
  user: User | null;
  roles: string[];
  permissions: string[];
  activeCompanyUuid: string | null;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [activeCompanyUuid, setActiveCompanyUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getUser();
      if (response.status === 'success' && response.data) {
        const userData = response.data;
        setUser(userData);
        setRoles(userData.roles || []);
        setPermissions(userData.permissions || []);
        setActiveCompanyUuid(userData.active_company_uuid || null);
      } else {
        setUser(null);
        setRoles([]);
        setPermissions([]);
        setActiveCompanyUuid(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setActiveCompanyUuid(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, roles, permissions, activeCompanyUuid, isLoading, refetchUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
