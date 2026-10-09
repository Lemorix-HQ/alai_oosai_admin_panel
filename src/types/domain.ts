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

// -------------------------------------------------------------------- lookups

/**
 * The four parish-owned lists a member's schooling, college and work are
 * chosen from. Seeded for occupation and place; school and college start
 * empty and grow as faculty record families.
 */
export interface LookupBase {
  _id: string;
  parish_id: string;
  name: string;
  name_ta?: string;
  status: 'active' | 'inactive';
}
export interface School extends LookupBase { type?: string; board?: string }
export interface College extends LookupBase { type?: string }
export interface Occupation extends LookupBase { industry: string }
export interface Place extends LookupBase {
  kind: string;
  country: string;
  state?: string;
  district?: string;
}

type PlaceRef = Ref<Pick<Place, '_id' | 'name' | 'name_ta' | 'country'>> | null;

/** Each block carries the year it was true; a standard without one is not a fact. */
export interface MemberSchooling {
  school_id: Ref<Pick<School, '_id' | 'name' | 'name_ta'>>;
  standard?: string;
  place_id?: PlaceRef;
  as_of_year: number;
}
export interface MemberCollege {
  college_id: Ref<Pick<College, '_id' | 'name' | 'name_ta'>>;
  course_year?: number;
  degree?: string;
  place_id?: PlaceRef;
  as_of_year: number;
}
export interface MemberWork {
  occupation_id: Ref<Pick<Occupation, '_id' | 'name' | 'name_ta' | 'industry'>>;
  place_id?: PlaceRef;
  as_of_year: number;
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
  schooling?: MemberSchooling | null;
  college?: MemberCollege | null;
  work?: MemberWork | null;
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

/** A person, named just enough for a timeline to show and link to. */
export interface TimelineMember {
  _id: string;
  name?: string;
  name_ta?: string;
}

/**
 * One thing that happened to a household.
 *
 * `recorded` is the honest bit: true where the event was written down as it
 * happened, false where the server reconstructed it afterwards from what the
 * documents still carry. A reconstruction has no actor, because nothing kept
 * one at the time.
 */
export interface FamilyEvent {
  at: string;
  action:
    | 'family.open'
    | 'family.transfer'
    | 'family.close'
    | 'family.merge'
    | 'member.add'
    | 'member.remove';
  recorded: boolean;
  actor: { _id: string; name?: string } | null;
  members: TimelineMember[];
  reason?: string;
  status?: string;
  family_code?: string;
  old_family_code?: string;
  new_family_code?: string;
  to_family?: { _id: string; family_code: string };
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
  residence: Residence;
  pastoral_flags: PastoralFlag[];
  notes?: string;
  completeness: RecordCompleteness;
  verification_status: 'not_visited' | 'verified' | 'partially_verified';
  last_verified_on?: string | null;
  status: 'active' | 'transferred_out' | 'closed' | 'merged';
  /** Set only on a merged family: the household it became part of. */
  merged_into?: Ref<Pick<Family, '_id' | 'family_code'>> | null;
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
  /** Derived from scope_anbiyam_ids on save, not chosen. */
  scope_level: 'system' | 'parish' | 'mandalam' | 'anbiyam';
  /** The Anbiyams this role covers. Empty means the whole parish. */
  scope_anbiyam_ids: string[];
  derived_from_role_id?: string | null;
  status: 'active' | 'inactive';
  /** Attached by the list endpoint. */
  assigned_count?: number;
  /** Also attached by the list endpoint. Null for the seeded roles, which
   *  nobody created in the panel. */
  created_by_name?: string | null;
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
  role_id: Ref<Pick<Role, '_id' | 'key' | 'name' | 'permissions' | 'scope_level' | 'scope_anbiyam_ids'>>;
  scope_mandalam_ids: string[];
  scope_anbiyam_ids: string[];
  valid_from: string;
  valid_to?: string | null;
  note?: string;
  status: 'active' | 'revoked' | 'expired';
  revoked_on?: string | null;
}

/** BaseUser.status, as the schema enumerates it. */
export type UserStatus =
  | 'active'
  | 'inactive'
  | 'banned'
  | 'verification_pending'
  | 'not_registered';

export interface StaffUser {
  _id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  account_type: 'super_admin' | 'parish_staff' | 'parishioner';
  status: UserStatus;
  parish_id?: string | null;
  member_id?: string | null;
  last_login_at?: string | null;
  /** When the most recent invitation went out. Absent means never invited. */
  invited_at?: string | null;
  /** Set the moment they accept an invitation or reset. Absent means they cannot sign in yet. */
  password_set_at?: string | null;
  createdAt?: string;
  assignments: RoleAssignment[];
  /** Attached by the list endpoint, read out of the audit trail — BaseUser
   *  itself records no creator. Null for an account created outside the panel. */
  created_by_name?: string | null;
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
  family_id: Ref<Pick<Family, '_id' | 'family_code' | 'primary_phone'>>;
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
  /**
   * `pending_submissions` is on both lists: how many sittings at the public
   * form this household has waiting. The whole point of the self-service work
   * is that a faculty member knows before knocking.
   */
  visits: Array<FamilyVisit & { pending_submissions?: number }>;
  outstanding: Array<
    Pick<Family, '_id' | 'family_code' | 'primary_phone' | 'verification_status'> & {
      pending_submissions?: number;
    }
  >;
  /** How many households in this round have sent something in. */
  pending_submission_families?: number;
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
  family_id?: Ref<Pick<Family, '_id' | 'family_code' | 'primary_phone'>> | null;
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

// ------------------------------------------- self-service family access codes

/**
 * `never` also covers a code whose row the TTL index has already swept, so
 * `expired` is only visible in the minute or so before Mongo removes it.
 */
export type AccessCodeState = 'never' | 'active' | 'expired' | 'revoked';

export interface AccessCodeStatus {
  state: AccessCodeState;
  issued_at: string | null;
  issued_by: string | null;
  expires_at: string | null;
  /** Set only while a lockout is still running. */
  locked_until: string | null;
}

/**
 * The response to issuing, and the only place the plaintext code appears.
 * Nothing stores it and no other endpoint returns it — a lost code is replaced,
 * not looked up.
 */
export interface IssuedAccessCode {
  family_code: string;
  code: string;
  expires_at: string;
  replaced_a_live_code: boolean;
}

export interface RevokedAccessCode {
  revoked: boolean;
}

// ----------------------------------------- the household's self-service form

/** The public parish picker: id and name only, before anyone has a session. */
export interface SelfServiceParish {
  id: string;
  name: string;
  name_ta: string | null;
}

/**
 * A person as the household sees them.
 *
 * Flatter than `Member` on purpose: this comes from `/self-service/*`, which
 * returns only what the form renders, with ids as strings and no populated
 * references.
 */
export interface HouseholdMember {
  id: string;
  name: string;
  name_ta: string | null;
  baptismal_name: string | null;
  initial: string | null;
  gender: string;
  date_of_birth: string | null;
  dob_is_estimated: boolean;
  relationship_to_head: string;
  marital_status: string;
  phone: string | null;
  email: string | null;
  blood_group: string | null;
  /**
   * Populated, unlike everything else on this type.
   *
   * The form has to print the school a child is already at, and a bare
   * ObjectId would make a block that exists look empty — which invites the
   * household to add a second row for the same school.
   */
  schooling: MemberSchooling | null;
  college: MemberCollege | null;
  work: MemberWork | null;
}

export interface HouseholdSnapshot {
  family: {
    id: string;
    family_code: string;
    card_year: number | null;
    primary_phone: string | null;
    address?: Address | null;
    residence?: Residence | null;
  };
  members: HouseholdMember[];
  /** From what age the parish asks for a phone number. */
  rules: { min_age_for_phone: number };
  /** What the household was shown, for whoever verifies at the door. */
  based_on: {
    family_updated_at: string | null;
    members_updated_at: string | null;
  };
}

/**
 * What opening a sitting returns to the PAGE.
 *
 * The API also returns the sitting token; the action strips it and keeps it in
 * an httpOnly cookie, so it never reaches client JavaScript.
 */
export type OpenedSitting = HouseholdSnapshot & { expires_in_minutes: number };

export interface SubmittedSitting {
  submission_id: string;
  family_code: string;
  change_count: number;
  status: string;
  what_happens_next: string;
}

/**
 * An activity block as the household sends it: ids, not populated rows.
 *
 * `as_of_year` is required for the reason an age is never stored — "10th
 * standard" without a year is wrong within twelve months and nothing
 * downstream can tell it has gone stale. The public form does not ask for it;
 * it sends the current year, because a household filling this in is describing
 * now.
 */
export interface HouseholdSchoolingInput {
  school_id: string;
  standard?: string;
  place_id?: string;
  as_of_year: number;
}
export interface HouseholdCollegeInput {
  college_id: string;
  course_year?: number;
  degree?: string;
  place_id?: string;
  as_of_year: number;
}
export interface HouseholdWorkInput {
  occupation_id: string;
  place_id?: string;
  as_of_year: number;
}

/** What the form sends back. Mirrors the backend's SubmitSittingDto. */
export interface HouseholdMemberChanges {
  name?: string;
  name_ta?: string;
  baptismal_name?: string;
  initial?: string;
  gender?: string;
  date_of_birth?: string;
  relationship_to_head?: string;
  marital_status?: string;
  phone?: string;
  email?: string;
  blood_group?: string;
  /**
   * An explicit `null` removes a block. `undefined` would be dropped by
   * `JSON.stringify` and the old block would survive — the same rule
   * `valuesToPayload` follows on the staff form.
   */
  schooling?: HouseholdSchoolingInput | null;
  college?: HouseholdCollegeInput | null;
  work?: HouseholdWorkInput | null;
}

export interface SubmitSittingPayload {
  submitter_name: string;
  submitter_phone?: string;
  submitter_relationship?: string;
  note?: string;
  family?: {
    primary_phone?: string;
  };
  members?: {
    member_id: string;
    changes: HouseholdMemberChanges;
    shares_household_phone?: boolean;
  }[];
  new_members?: (HouseholdMemberChanges & {
    name: string;
    gender: string;
    relationship_to_head: string;
    shares_household_phone?: boolean;
  })[];
  deceased?: { member_id: string; reason?: string }[];
}

// --------------------------------------- self-service submissions, for staff

export type SubmissionStatus =
  | 'pending'
  | 'under_verification'
  | 'approved'
  | 'applied'
  | 'partially_applied'
  | 'rejected';

/**
 * One household's sitting at the public form, as the faculty see it.
 *
 * The row they open at a front door. Its individual changes are ordinary
 * `ChangeRequest`s carrying this row's id in `submission_id`.
 */
export interface SelfServiceSubmission {
  _id: string;
  family_id?: Ref<Pick<Family, '_id' | 'family_code' | 'primary_phone'>> | null;
  anbiyam_id?: Ref<Pick<Anbiyam, '_id' | 'code' | 'name' | 'name_ta'>> | null;
  submitted_at: string;
  submitter_name: string;
  submitter_phone?: string | null;
  submitter_relationship?: string | null;
  note?: string | null;
  /** Adults who said they use the household's number rather than their own. */
  shares_household_phone: string[];
  based_on_family_updated_at?: string | null;
  based_on_members_updated_at?: string | null;
  change_count: number;
  status: SubmissionStatus;
  decided_by?: string | null;
  decided_on?: string | null;
  createdAt?: string;
}

/** The submission with everything in it, for the decision screen. */
export type SubmissionDetail = SelfServiceSubmission & {
  requests: ChangeRequest[];
  /**
   * `{ id: name }` for the schools, colleges, occupations and places named
   * inside the payloads.
   *
   * Beside the payload rather than in it: a payload is what `apply()` reads,
   * and `populate()` cannot reach into a Mixed path, so the server does this
   * join by hand for display only.
   */
  lookup_names?: Record<string, string>;
};

/** What one change's turn through a group decision produced. */
export interface SubmissionOutcome {
  id: string;
  type: string;
  ok: boolean;
  reason?: string;
}

export interface SubmissionDecisionResult {
  submission_id: string;
  status: SubmissionStatus;
  outcomes: SubmissionOutcome[];
}
