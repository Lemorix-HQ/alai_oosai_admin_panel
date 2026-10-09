/**
 * Display labels for the domain's enum values.
 *
 * The stored values are Tamil kinship terms transliterated (`thunaivi`,
 * `marumagan`) because that is the vocabulary of the parish passbook's குடும்ப
 * உறவு column. English glosses belong in the UI, not in the data.
 */
export const RELATIONSHIP_LABEL: Record<string, string> = {
  head: "Head",
  thunaivar: "Husband (துணைவர்)",
  thunaivi: "Wife (துணைவி)",
  magan: "Son (மகன்)",
  magal: "Daughter (மகள்)",
  marumagan: "Son-in-law (மருமகன்)",
  marumagal: "Daughter-in-law (மருமகள்)",
  peran: "Grandson (பேரன்)",
  petti: "Granddaughter (பேத்தி)",
  father: "Father",
  mother: "Mother",
  brother: "Brother",
  sister: "Sister",
  relative: "Relative",
  other: "Other",
};

export const PASTORAL_FLAG_LABEL: Record<string, string> = {
  do_not_visit: "Do not visit",
  marriage_not_in_church: "Marriage not in church",
  needs_verification: "Needs verification",
  inactive_practice: "Not practising",
  requires_support: "Requires support",
};

export const VERIFICATION_LABEL: Record<string, string> = {
  not_visited: "Not visited",
  partially_verified: "Partly verified",
  verified: "Verified",
};

export const RESIDENCE_LABEL: Record<string, string> = {
  resident: "Resident",
  migrated: "Migrated",
  outstation: "Outstation",
  unknown: "Unknown",
};

export const MARITAL_LABEL: Record<string, string> = {
  single: "Single",
  married: "Married",
  widowed: "Widowed",
  separated: "Separated",
  religious: "Religious",
  unknown: "Unknown",
};

export const MEMBER_STATUS_LABEL: Record<string, string> = {
  active: "Active",
  deceased: "Deceased",
  transferred_out: "Transferred out",
  religious_vocation: "Religious vocation",
};

/**
 * What became of a household. Everything but `active` is history: the family
 * kept its code as a record while the slot it vacated went to whoever came
 * next, so these records are read-only.
 *
 * Distinct from `residence.status` (resident / migrated / outstation), which
 * says where a family that is still on the census lives.
 */
export const FAMILY_STATUS_LABEL: Record<string, string> = {
  active: "Active",
  transferred_out: "Transferred out",
  closed: "Closed",
  merged: "Merged",
};

export function familyStatusTone(status: string): "success" | "warning" | "neutral" {
  if (status === "active") return "success";
  if (status === "merged") return "warning";
  return "neutral";
}

/**
 * How a user account's status reads.
 *
 * Only `active` means "this account can be used". The other four are not
 * interchangeable, so they do not share a colour: not being able to sign in
 * YET is amber, having been shut out is red.
 *
 * This was written inline on four screens, each mapping everything past
 * not_registered to grey — so a banned account looked exactly like one that had
 * simply never been invited. The profile page had it worse: a hard-coded
 * "Active" pill that read nothing at all.
 */
export function userStatusTone(
  status?: string | null,
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "active":
      return "success";
    case "not_registered":
    case "verification_pending":
      return "warning";
    case "inactive":
    case "banned":
      return "danger";
    // The enum is closed, so anything else is a data error rather than a state.
    default:
      return "neutral";
  }
}

export function verificationTone(status: string): "success" | "warning" | "neutral" {
  if (status === "verified") return "success";
  if (status === "partially_verified") return "warning";
  return "neutral";
}

/** "ASS-17/2024" — the code plus the year of the last priest visit. */
export function cardNumber(familyCode: string, cardYear?: number | null) {
  return cardYear ? `${familyCode}/${cardYear}` : familyCode;
}

export function ageFrom(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export const VISIT_OUTCOME_LABEL: Record<string, string> = {
  verified: "Verified",
  visited: "Visited, not settled",
  not_available: "Nobody home",
  refused: "Refused",
  locked: "House locked",
  moved: "Moved away",
};

export function visitOutcomeTone(outcome: string): "success" | "warning" | "danger" | "neutral" {
  if (outcome === "verified") return "success";
  if (outcome === "visited") return "warning";
  if (outcome === "refused" || outcome === "moved") return "danger";
  return "neutral";
}

export const CHANGE_REQUEST_TYPE_LABEL: Record<string, string> = {
  add_member: "Add a member",
  split_family: "Split a family",
  join_family: "Join a family",
  transfer_family: "Transfer a family",
  update_details: "Correct details",
  mark_deceased: "Record a death",
};

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting verification",
  under_verification: "Verified, awaiting approval",
  approved: "Approved, not yet applied",
  applied: "Applied",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/**
 * A whole sitting's status, rolled up from its own requests.
 *
 * `partially_applied` has no per-request equivalent: it means some changes went
 * in and some could not, which is a state the group apply records rather than
 * rolls back.
 */
export const SUBMISSION_STATUS_LABEL: Record<string, string> = {
  pending: "Sent in, awaiting the door step",
  under_verification: "Seen at the door, awaiting approval",
  approved: "Approved, not yet applied",
  applied: "Applied",
  partially_applied: "Partly applied — some changes could not go in",
  rejected: "Rejected",
};

export function submissionStatusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "applied") return "success";
  if (status === "approved") return "info";
  if (status === "partially_applied") return "danger";
  if (status === "pending" || status === "under_verification") return "warning";
  if (status === "rejected") return "danger";
  return "neutral";
}

export function requestStatusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "applied") return "success";
  if (status === "approved") return "info";
  if (status === "pending" || status === "under_verification") return "warning";
  if (status === "rejected") return "danger";
  return "neutral";
}

/** "37 / 46" — verified families over the Anbiyam's total, as the passbook writes it. */
export function roundProgress(verified: number, total?: number | null) {
  return total ? `${verified} / ${total}` : String(verified);
}

/**
 * The closed industry list, mirroring OCCUPATION_INDUSTRIES in
 * `occupation.schema.ts`. A free-text industry cannot be grouped by, and
 * grouping is the only reason the field exists.
 */
export const OCCUPATION_INDUSTRY_LABEL: Record<string, string> = {
  fishing: "Fishing",
  agriculture: "Agriculture",
  construction: "Construction",
  healthcare: "Healthcare",
  education: "Education",
  government: "Government",
  transport: "Transport",
  retail: "Retail",
  hospitality: "Hospitality",
  it_services: "IT and services",
  manufacturing: "Manufacturing",
  domestic: "Domestic",
  religious: "Religious",
  other: "Other",
};

/** Where people from this parish actually go. `country` is a free string on
 *  Place, so this is a convenience list, not an enum. */
export const COMMON_COUNTRIES = [
  "India", "UAE", "Saudi Arabia", "Qatar", "Kuwait", "Oman", "Bahrain",
  "Singapore", "Malaysia", "Italy", "Ireland", "United Kingdom",
  "United States", "Canada", "Australia",
];
