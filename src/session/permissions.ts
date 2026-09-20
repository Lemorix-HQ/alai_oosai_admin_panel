/**
 * Mirrors src/modules/access/constants/permissions.ts in the backend.
 *
 * Kept as a const object so a typo is a compile error rather than a permission
 * that silently never matches. If you add one here, add it there too — the
 * backend is the authority; this is for autocomplete and typo safety.
 */
export const P = {
  parish: {
    read: 'parish.read',
    update: 'parish.update',
    settingsManage: 'parish.settings.manage',
  },
  structure: {
    mandalam: 'mandalam.manage',
    anbiyam: 'anbiyam.manage',
    substation: 'substation.manage',
  },
  family: {
    read: 'family.read',
    readOwn: 'family.read.own',
    create: 'family.create',
    update: 'family.update',
    transfer: 'family.transfer',
    close: 'family.close',
  },
  member: {
    read: 'member.read',
    create: 'member.create',
    update: 'member.update',
    delete: 'member.delete',
  },
  visit: { read: 'visit.read', record: 'visit.record', roundManage: 'visit.round.manage' },
  request: { raise: 'request.raise', verify: 'request.verify', approve: 'request.approve' },
  register: {
    read: 'register.read',
    create: 'register.create',
    update: 'register.update',
    correct: 'register.correct',
  },
  certificate: { issue: 'certificate.issue', read: 'certificate.read' },
  finance: {
    fundManage: 'fund.manage',
    offeringRecord: 'offering.record',
    offeringRead: 'offering.read',
    offeringReadOwn: 'offering.read.own',
    report: 'finance.report',
  },
  liturgy: { manage: 'mass_intention.manage', read: 'mass_intention.read' },
  comms: {
    announcement: 'announcement.manage',
    event: 'event.manage',
    report: 'report.manage',
  },
  access: { roleManage: 'role.manage', userManage: 'user.manage', assignRole: 'user.assign_role' },
} as const;
