'use client';

import { createContext, useContext, useMemo } from 'react';
import type { SessionUser } from '@/src/types';

interface SessionContextValue {
  user: SessionUser | null;
  /** Holds this permission. */
  can: (permission: string) => boolean;
  /** Holds at least one of these. */
  canAny: (...permissions: string[]) => boolean;
  /** Holds all of these. */
  canAll: (...permissions: string[]) => boolean;
  /** True when no assignment narrows the user to particular Mandalams/Anbiyams. */
  parishWide: boolean;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  can: () => false,
  canAny: () => false,
  canAll: () => false,
  parishWide: false,
});

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  const value = useMemo<SessionContextValue>(() => {
    const held = new Set(user?.permissions ?? []);
    return {
      user,
      can: (p) => held.has(p),
      canAny: (...ps) => ps.some((p) => held.has(p)),
      canAll: (...ps) => ps.every((p) => held.has(p)),
      parishWide: user?.scope?.parish_wide ?? false,
    };
  }, [user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
