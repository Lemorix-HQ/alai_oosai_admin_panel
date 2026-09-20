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
