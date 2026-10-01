import { P } from '@/src/session/permissions';

export interface NavItem {
  href: string;
  icon: string;
  label: string;
  /** Shown when the user holds ANY of these. Empty means always shown. */
  anyOf?: string[];
  /** Super admin only — a user with no parish binding. */
  systemOnly?: boolean;
}

export interface NavSection {
  title: string | null;
  items: NavItem[];
}

/**
 * Navigation is derived from permissions, not from role names.
 *
 * A parish priest can create a role that did not exist when this file was
 * written. Branching on `account_type === 'parish_staff'` would make every such
 * role see an identical menu; branching on permissions means a Faculty user
 * automatically sees exactly the pages their permissions cover.
 */
export const NAVIGATION: NavSection[] = [
  {
    title: null,
    items: [{ href: '/', icon: 'dashboard', label: 'Dashboard' }],
  },
  {
    title: 'Parish',
    items: [
      { href: '/structure', icon: 'account_tree', label: 'Structure', anyOf: [P.structure.mandalam, P.structure.anbiyam, P.family.read] },
      { href: '/families', icon: 'home', label: 'Families', anyOf: [P.family.read] },
      { href: '/members', icon: 'groups', label: 'Members', anyOf: [P.member.read] },
      { href: '/visits', icon: 'directions_walk', label: 'Visits', anyOf: [P.visit.read] },
      { href: '/requests', icon: 'how_to_reg', label: 'Change Requests', anyOf: [P.request.read] },
    ],
  },
  {
    title: 'Communication',
    items: [
      { href: '/announcements', icon: 'campaign', label: 'Announcements', anyOf: [P.comms.announcement] },
      { href: '/events', icon: 'event', label: 'Events', anyOf: [P.comms.event] },
      { href: '/reports', icon: 'assessment', label: 'Reports', anyOf: [P.comms.report] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { href: '/staff', icon: 'badge', label: 'Staff', anyOf: [P.access.userManage, P.access.assignRole] },
      { href: '/roles', icon: 'shield_person', label: 'Roles', anyOf: [P.access.roleManage] },
      { href: '/parish-settings', icon: 'tune', label: 'Parish Settings', anyOf: [P.parish.settingsManage] },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/global-dashboard', icon: 'public', label: 'All Parishes', systemOnly: true },
      { href: '/parishes', icon: 'church', label: 'Manage Parishes', systemOnly: true, anyOf: [P.parish.update] },
      { href: '/system/users', icon: 'manage_accounts', label: 'All Users', systemOnly: true, anyOf: [P.access.userManage] },
      { href: '/system/audit', icon: 'history', label: 'Audit Log', systemOnly: true, anyOf: [P.access.userManage] },
    ],
  },
  {
    title: null,
    items: [{ href: '/profile', icon: 'person', label: 'Profile' }],
  },
];

export function visibleSections(
  can: (p: string) => boolean,
  isSuperAdmin: boolean,
): NavSection[] {
  return NAVIGATION.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.systemOnly && !isSuperAdmin) return false;
      if (!item.anyOf || item.anyOf.length === 0) return true;
      return item.anyOf.some(can);
    }),
  })).filter((section) => section.items.length > 0);
}
