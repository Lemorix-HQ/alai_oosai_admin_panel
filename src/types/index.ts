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

export interface User {
  _id: string;
  name: string;
  phone: string;
  role: 'user' | 'parish_admin' | 'super_admin';
  parish_id?: string;
}

export interface JwtPayload {
  sub: string;
  phone: string;
  role: 'parish_admin' | 'super_admin';
  name: string;
  parish_id?: string;
  iat: number;
  exp: number;
}

export interface Parish {
  _id: string;
  name: string;
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
