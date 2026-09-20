'use client';

import { useSession } from './SessionProvider';

/**
 * Renders children only when the user holds the permission(s).
 *
 * Presentation only. The backend PermissionsGuard is what actually enforces
 * access, and it is opt-in per route — a route without @RequirePermissions is
 * open however this component behaves.
 */
export function PermissionGate({
  permission,
  anyOf,
  fallback = null,
  children,
}: {
  permission?: string;
  anyOf?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { can, canAny } = useSession();
  const allowed = permission ? can(permission) : anyOf ? canAny(...anyOf) : true;
  return <>{allowed ? children : fallback}</>;
}
