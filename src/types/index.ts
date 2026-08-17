// TypeScript Type Definitions for GreenGuard 2.0 Backend

export interface DetectionLog {
  regionId: string;
  changeType: string;
  forested: number;
  deforested: number;
  noForest: number;
  confidence: number;
  status: 'Critical' | 'Warning' | 'Stable';
}

export interface AnalysisResult {
  status: 'success' | 'error';
  name?: string;
  totalForestArea: number; // km2
  perimeter: number; // km
  deforestedArea: number; // km2
  deforestationPercent: number; // %
  forestPercentage: number; // %
  confidence: number; // 0.0 - 1.0
  message: string;
  image?: string; // base64 overlay image
  before_image: string; // base64 T1 baseline
  after_image: string; // base64 T2 current
  overlay_image: string; // base64 final delta
  deforestation_area_km2: number;
  total_area_km2: number;
  deforestation_percentage: number;
  deforestation_geojson?: Record<string, any> | null;
  logs: DetectionLog[];
  dateRange: {
    startYear: string;
    startPeriod: string;
    endYear: string;
    endPeriod: string;
  };
  summary: string;
}

export interface AnalyzeRequestBody {
  coordinates?: [number, number][] | { lat: number; lng: number }[];
  startYear?: string | number;
  startPeriod?: string; // e.g. "Jan-Mar" or "jan-jun"
  endYear?: string | number;
  endPeriod?: string;   // e.g. "Oct-Dec" or "jul-dec"
  range1?: string;
  range2?: string;
  aoiName?: string;
}

export interface AttachedReportPayload {
  name?: string;
  date?: string;
  regionId?: string;
  status?: string;
  areaMonitored?: string;
  forestPercentage?: number;
  deforestedPercentage?: number;
  summary?: string;
}

export interface SendComplaintRequestBody {
  senderName: string;
  senderEmail: string;
  complaintMessage: string;
  attachedReport?: AttachedReportPayload;
}

export interface NewsArticleItem {
  id: string;
  title: string;
  category: string;
  date: string;
  isoDate: string;
  pubDate: string;
  source: string;
  author: string;
  readTime: string;
  img: string;
  summary: string;
  content: string;
  url?: string;
}

export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role?: string;
  organization?: string;
  resetOTP?: string | null;
  resetOTPExpires?: Date | null;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
