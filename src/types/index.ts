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
  role: 'user' | 'village_admin' | 'super_admin';
  village_id?: string;
}

export interface JwtPayload {
  sub: string;
  phone: string;
  role: 'village_admin' | 'super_admin';
  name: string;
  village_id?: string;
  iat: number;
  exp: number;
}

export interface Village {
  _id: string;
  name: string;
  createdAt?: string;
}

export interface VillageAdminInfo {
  _id: string;
  name: string;
  phone: string | null;
}

export interface VillageStats {
  village: Village;
  familyCount: number;
  userCount: number;
  villageAdmin: VillageAdminInfo | null;
}
