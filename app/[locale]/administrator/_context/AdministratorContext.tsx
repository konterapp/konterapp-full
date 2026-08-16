'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getAdministrator, Administrator } from '@/lib/api/administrator/auth';

interface AdministratorContextType {
  administrator: Administrator | null;
  isLoading: boolean;
  refetchAdministrator: () => Promise<void>;
}

const AdministratorContext = createContext<AdministratorContextType | undefined>(undefined);

export function AdministratorProvider({ children }: { children: ReactNode }) {
  const [administrator, setAdministrator] = useState<Administrator | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdministrator = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAdministrator();
      if (response.status === 'success' && response.data) {
        setAdministrator(response.data.administrator);
      } else {
        setAdministrator(null);
      }
    } catch (error) {
      console.error('Error fetching administrator:', error);
      setAdministrator(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdministrator();
  }, [fetchAdministrator]);

  return (
    <AdministratorContext.Provider value={{ administrator, isLoading, refetchAdministrator: fetchAdministrator }}>
      {children}
    </AdministratorContext.Provider>
  );
}

export function useAdministrator() {
  const context = useContext(AdministratorContext);
  if (context === undefined) {
    throw new Error('useAdministrator must be used within an AdministratorProvider');
  }
  return context;
}
