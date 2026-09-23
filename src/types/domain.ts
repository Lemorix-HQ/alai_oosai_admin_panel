/**
 * Shapes returned by the parish-structure, household and access endpoints.
 *
 * Mongoose `populate` replaces an ObjectId string with the referenced document,
 * so every populated field is typed as `string | <Ref>` — the list endpoints
 * populate, the detail endpoints sometimes do not, and narrowing at the call
 * site is cheaper than two parallel types.
 */

import type { Address } from './index';

export type Ref<T> = string | T;

export interface Residence {
  status?: 'resident' | 'migrated' | 'outstation' | 'unknown';
  current_place?: string;
  current_state?: string;
  current_country?: string;
  since?: string;
}

export interface RecordCompleteness {
  source: 'seed' | 'visit_form' | 'admin_entry' | 'self_service';
  members_complete: boolean;
  expected_member_count?: number | null;
  children_under_18?: number | null;
  children_over_18?: number | null;
  children_married?: number | null;
  elderly?: number | null;
  last_verified_on?: string | null;
  source_ref?: string;
}

export interface CodeHistoryEntry {
  code: string;
  anbiyam_id?: string | null;
  from?: string;
  to?: string;
}

// ------------------------------------------------------------------ structure

export interface Substation {
  _id: string;
  parish_id: string;
  name: string;
  name_ta?: string;
  code: string;
  patron_saint?: string;
  address?: Address;
  status: 'active' | 'inactive';
}

export interface Mandalam {
  _id: string;
  parish_id: string;
  substation_id?: string | null;
  name: string;
  name_ta?: string;
  code: string;
  sequence?: number | null;
  patron_saint?: string;
  status: 'active' | 'inactive' | 'merged';
  /** Present when the list is asked for counts. */
  anbiyam_count?: number;
}

export interface Anbiyam {
  _id: string;
  parish_id: string;
  mandalam_id?: string | null;
  substation_id?: string | null;
  name: string;
  name_ta?: string;
  code: string;
  sequence?: number | null;
  patron_saint?: string;
  meeting_day?: string;
  meeting_place?: string;
  status: 'active' | 'inactive' | 'merged';
  family_count?: number;
}

export interface StructureTree {
  mandalams: Array<Mandalam & { anbiyams: Anbiyam[] }>;
  /** A parish may run Anbiyams with no zone level at all. */
  unassigned_anbiyams: Anbiyam[];
  totals: { mandalams: number; anbiyams: number; families: number };
}

export interface NextSerial {
  anbiyam_id: string;
  anbiyam_code: string;
  serial: number;
  family_code: string;
  /** True when this fills a slot released by a family that left. */
  reused_vacant_slot: boolean;
  active_families: number;
}

// ------------------------------------------------------------------ household

export const PASTORAL_FLAGS = [
  'do_not_visit',
  'marriage_not_in_church',
  'needs_verification',
  'inactive_practice',
  'requires_support',
] as const;
export type PastoralFlag = (typeof PASTORAL_FLAGS)[number];

export const MEMBER_RELATIONSHIPS = [
  'head', 'thunaivar', 'thunaivi', 'magan', 'magal', 'marumagan', 'marumagal',
  'peran', 'petti', 'father', 'mother', 'brother', 'sister', 'relative', 'other',
] as const;
export type MemberRelationship = (typeof MEMBER_RELATIONSHIPS)[number];

export interface Member {
  _id: string;
  parish_id: string;
  family_id: Ref<{ _id: string; family_code: string }>;
  origin_family_id?: string | null;
  transferred_to_parish_name?: string | null;
  name: string;
  name_ta?: string;
  baptismal_name?: string;
  initial?: string;
  gender: 'male' | 'female';
  date_of_birth?: string | null;
  dob_is_estimated: boolean;
  relationship_to_head: MemberRelationship;
  marital_status: 'single' | 'married' | 'widowed' | 'separated' | 'religious' | 'unknown';
  occupation?: string;
  education?: string;
  phone?: string;
  email?: string;
  photo?: string;
  blood_group?: string;
  notes?: string;
  user_id?: string | null;
  status: 'active' | 'deceased' | 'transferred_out' | 'religious_vocation';
  is_deleted: boolean;
}

export interface MemberBrief {
  _id: string;
  name: string;
  name_ta?: string;
}

export interface FamilyTransfer {
  _id: string;
  family_id: string;
  from_anbiyam_id?: string | null;
  to_anbiyam_id?: string | null;
  from_parish_name?: string | null;
  to_parish_name?: string | null;
  type: 'internal' | 'inbound' | 'outbound';
  old_family_code?: string | null;
  new_family_code?: string | null;
  assignment_method: 'vacant_slot' | 'appended';
  effective_on: string;
  reason?: string;
  createdAt?: string;
}

export interface Family {
  _id: string;
  parish_id: string;
  anbiyam_id: Ref<Pick<Anbiyam, '_id' | 'code' | 'name' | 'name_ta'>>;
  mandalam_id?: Ref<Pick<Mandalam, '_id' | 'code' | 'name'>> | null;
  serial_in_anbiyam: number;
  /** "ASS-17". Anbiyam code plus serial. `card_year` is NOT part of it. */
  family_code: string;
  card_year?: number | null;
  code_history: CodeHistoryEntry[];
  head_member_id?: Ref<MemberBrief> | null;
  spouse_member_id?: Ref<MemberBrief> | null;
  primary_phone?: string;
  address?: Address;
  locality?: string;
  house_note?: string;
  residence: Residence;
  pastoral_flags: PastoralFlag[];
  notes?: string;
  completeness: RecordCompleteness;
  verification_status: 'not_visited' | 'verified' | 'partially_verified';
  last_verified_on?: string | null;
  status: 'active' | 'transferred_out' | 'closed' | 'merged';
  is_deleted: boolean;
}

/** GET /families/:id — the family with everything shown on its card. */
export interface FamilyDetail extends Family {
  members: Member[];
  /** Born here, belonging elsewhere. Still listed on the parents' card. */
  married_out: Array<
    Pick<Member, '_id' | 'name' | 'name_ta' | 'relationship_to_head' | 'status'> & {
      transferred_to_parish_name?: string | null;
      family_id: string;
    }
  >;
  transfers: FamilyTransfer[];
}

export interface Paged<T> {
  rows: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// --------------------------------------------------------------------- access

export interface Role {
  _id: string;
  parish_id?: string | null;
  key: string;
  name: string;
  name_ta?: string;
  description?: string;
  kind: 'system' | 'parish';
  is_template: boolean;
  is_immutable: boolean;
  permissions: string[];
  scope_level: 'system' | 'parish' | 'mandalam' | 'anbiyam';
  derived_from_role_id?: string | null;
  status: 'active' | 'inactive';
  /** Attached by the list endpoint. */
  assigned_count?: number;
}

export interface PermissionCatalogue {
  groups: Array<{
    area: string;
    /** `grantable` is false for a permission the current user does not hold. */
    permissions: Array<{ key: string; grantable: boolean }>;
  }>;
}

export interface RoleAssignment {
  _id: string;
  parish_id?: string | null;
  user_id: string;
  role_id: Ref<Pick<Role, '_id' | 'key' | 'name' | 'permissions' | 'scope_level'>>;
  scope_mandalam_ids: string[];
  scope_anbiyam_ids: string[];
  valid_from: string;
  valid_to?: string | null;
  note?: string;
  status: 'active' | 'revoked' | 'expired';
  revoked_on?: string | null;
}

export interface StaffUser {
  _id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  account_type: 'super_admin' | 'parish_staff' | 'parishioner';
  status: 'active' | 'inactive' | 'banned' | 'verification_pending' | 'not_registered';
  parish_id?: string | null;
  member_id?: string | null;
  last_login_at?: string | null;
  createdAt?: string;
  assignments: RoleAssignment[];
}

export interface StaffDetail extends StaffUser {
  /** The union of every active assignment, resolved server-side. */
  effective_permissions: string[];
}

// ---------------------------------------------------------------------- audit

export interface AuditEntry {
  _id: string;
  parish_id?: Ref<{ _id: string; name: string; code: string }> | null;
  actor_user_id: Ref<{ _id: string; name: string; phone?: string; account_type: string }>;
  action: string;
  entity: string;
  entity_id?: string | null;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
}

// -------------------------------------------------------------------- parish+

/** Parish list rows carry counts the global dashboard shows. */
export interface ParishWithCounts {
  _id: string;
  name: string;
  name_ta?: string | null;
  code: string;
  diocese?: string | null;
  deanery?: string | null;
  patron_saint?: string | null;
  status?: 'active' | 'inactive';
  createdAt?: string;
  family_count: number;
  member_count: number;
  staff_count: number;
}

export interface ParishStatsDetail {
  parish: import('./index').Parish;
  familyCount: number;
  memberCount: number;
  unverifiedCount: number;
  incompleteCount: number;
  mandalamCount: number;
  anbiyamCount: number;
  staffCount: number;
  parishionerCount: number;
  legacyCardCount: number;
  eventCount: number;
  announcementCount: number;
  reportCount: number;
  parishAdmin: {
    _id: string;
    name: string;
    phone: string | null;
    status: string;
    assignment_id: string;
  } | null;
  /** Retained for the existing cards; equals memberCount. */
  userCount: number;
}

// -------------------------------------------------------------------- visits

/** One visit the priest makes to one Anbiyam. */
export interface VisitRound {
  _id: string;
  parish_id: string;
  anbiyam_id: Ref<Pick<Anbiyam, '_id' | 'code' | 'name' | 'name_ta'>>;
  label?: string | null;
  round_date: string;
  completed_on?: string | null;
  /**
   * Stored, not counted live: it describes the Anbiyam as it stood in this
   * round. Recomputing it would rewrite the parish's own record every time a
   * family is added.
   */
  total_families?: number | null;
  verified_count: number;
  led_by?: string | null;
  status: 'open' | 'complete';
  notes?: string;
  createdAt?: string;
}

export const VISIT_OUTCOMES = [
  'verified',
  'visited',
  'not_available',
  'refused',
  'locked',
  'moved',
] as const;
export type VisitOutcome = (typeof VISIT_OUTCOMES)[number];

export interface FamilyVisit {
  _id: string;
  parish_id: string;
  anbiyam_id: Ref<Pick<Anbiyam, '_id' | 'code' | 'name_ta'>>;
  family_id: Ref<Pick<Family, '_id' | 'family_code' | 'locality' | 'primary_phone'>>;
  round_id?: string | null;
  visit_date: string;
  visited_by_user_id?: string | null;
  visited_by_name?: string;
  outcome: VisitOutcome;
  notes?: string;
  follow_up_flags: string[];
  acknowledged_by_member_id?: string | null;
  acknowledgement?: string;
  createdAt?: string;
}

/** GET /visit-rounds/:id — the round, what was done, and what is left. */
export interface VisitRoundDetail extends VisitRound {
  visits: FamilyVisit[];
  outstanding: Array<
    Pick<Family, '_id' | 'family_code' | 'locality' | 'primary_phone' | 'verification_status'>
  >;
}

// ----------------------------------------------------------- change requests

export const CHANGE_REQUEST_TYPES = [
  'add_member',
  'split_family',
  'join_family',
  'transfer_family',
  'update_details',
  'mark_deceased',
] as const;
export type ChangeRequestType = (typeof CHANGE_REQUEST_TYPES)[number];

export type ChangeRequestStatus =
  | 'pending'
  | 'under_verification'
  | 'approved'
  | 'rejected'
  | 'applied'
  | 'cancelled';

export interface ChangeRequest {
  _id: string;
  parish_id: string;
  family_id?: Ref<Pick<Family, '_id' | 'family_code' | 'locality' | 'primary_phone'>> | null;
  anbiyam_id?: Ref<Pick<Anbiyam, '_id' | 'code' | 'name' | 'name_ta'>> | null;
  type: ChangeRequestType;
  requested_by_user_id?: string | null;
  requested_by_member_id?: string | null;
  requester_name?: string;
  requester_phone?: string;
  payload: Record<string, unknown>;
  reason?: string;
  attachments: string[];
  status: ChangeRequestStatus;
  verified_by?: string | null;
  verified_on?: string | null;
  approved_by?: string | null;
  approved_on?: string | null;
  decision_note?: string;
  resulting_family_id?: string | null;
  resulting_member_id?: string | null;
  createdAt?: string;
}
