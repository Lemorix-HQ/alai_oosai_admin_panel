export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  place: string;
  time: string;
  conductorName: string;
  type: 'event' | 'poster' | 'promotion';
  tags: string[];
  ctaText?: string;
  image?: string;
  joinedCount?: number;
  isWishlisted?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  time: string;
  createdAt: string;
  image?: string;
  video?: string;
  voiceNote?: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  createdAt: string;
}

export type AccountType = 'super_admin' | 'parish_staff' | 'parishioner';

export interface User {
  _id: string;
  name: string;
  phone: string;
  account_type: AccountType;
  parish_id?: string;
}

/**
 * Claims the backend signs. `account_type` says what CLASS of account this is;
 * it is NOT what the user may do — that comes from `permissions` on the session
 * (see useSession). Never branch UI on account_type where a permission exists.
 */
export interface JwtPayload {
  sub: string;
  phone: string;
  account_type: AccountType;
  name: string;
  parish_id?: string;
  iat: number;
  exp: number;
}

/** Shape of GET /auth/me. */
export interface SessionUser {
  id: string;
  name: string;
  phone: string | null;
  account_type: AccountType;
  parish_id: string | null;
  member_id: string | null;
  /** Roles actually held, for display. Permissions are what gate the UI. */
  roles: Array<{ key: string; name: string }>;
  permissions: string[];
  scope: {
    parish_wide: boolean;
    mandalam_ids: string[];
    anbiyam_ids: string[];
  };
}

export interface Address {
  line1?: string;
  street?: string;
  locality?: string;
  town?: string;
  taluk?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface ParishSettings {
  min_age_for_head: number;
  allow_head_change_to_son: boolean;
  currency: string;
  default_offering_minimum: number | null;
}

export interface Parish {
  _id: string;
  name: string;
  name_ta?: string | null;
  code: string;
  patron_saint?: string | null;
  diocese?: string | null;
  deanery?: string | null;
  address?: Address | null;
  phone?: string | null;
  alt_phone?: string | null;
  email?: string | null;
  logo?: string | null;
  settings?: ParishSettings;
  status?: 'active' | 'inactive';
  createdAt?: string;
}

export interface ParishAdminInfo {
  _id: string;
  name: string;
  phone: string | null;
}

export interface ParishStats {
  parish: Parish;
  familyCount: number;
  userCount: number;
  parishAdmin: ParishAdminInfo | null;
}
