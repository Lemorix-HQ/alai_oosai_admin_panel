import type { SessionUser } from '@/src/types';

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  parish_staff: 'Parish Staff',
  parishioner: 'Parishioner',
};

export function accountTypeLabel(accountType?: string | null): string {
  return ACCOUNT_TYPE_LABEL[accountType ?? ''] ?? 'Unknown';
}

/**
 * What to show as someone's title.
 *
 * Their roles are more informative than their account type — "Faculty" says
 * more than "Parish Staff", and labelling every non-super-admin "Parish Admin"
 * (as this used to) is simply wrong once faculty and Anbiyam heads log in.
 */
export function displayRole(user?: Pick<SessionUser, 'account_type' | 'roles'> | null): string {
  if (!user) return 'Unknown';
  if (user.roles?.length) return user.roles.map((r) => r.name).join(', ');
  return accountTypeLabel(user.account_type);
}
