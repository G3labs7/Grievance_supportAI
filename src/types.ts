export type GrievanceCategory = 'Water' | 'Roads' | 'Healthcare' | 'Education' | 'Environment' | 'Infrastructure' | 'Other';
export type UrgencyLevel = 'High' | 'Medium' | 'Low';
export type GrievanceSentiment = 'Frustrated' | 'Neutral' | 'Distressed';
export type GrievanceStatus = 'Pending' | 'Acknowledged' | 'Resolved';
export type GrievanceLanguage = 'English' | 'Hindi' | 'Other';

export interface Grievance {
  id: string;
  text: string;
  state: string;
  district: string;
  category: GrievanceCategory;
  urgency: UrgencyLevel;
  summary: string;
  suggested_action: string;
  sentiment: GrievanceSentiment;
  affected_group: string;
  status: GrievanceStatus;
  language: GrievanceLanguage;
  submitted_at: string; // ISO String
  week_number: number; // ISO Week number
}

export interface Digest {
  id: string;
  generated_at: string; // ISO String
  week_range: string;
  total_grievances: number;
  top_categories: string[];
  high_priority_count: number;
  digest_text: string;
  generated_by: string;
}

export interface StaffUser {
  uid: string;
  name: string;
  role: 'admin' | 'viewer';
  constituency: string;
  created_at: string; // ISO String
}

export interface DashboardStats {
  totalGrievancesThisWeek: number;
  highPriorityCount: number;
  statesCovered: number;
  resolvedThisWeek: number;
  trendAlert: {
    triggered: boolean;
    category?: string;
    state?: string;
    percentIncrease?: number;
    text?: string;
  };
  categoryVolume: { name: string; count: number }[];
  urgencyBreakdown: { name: string; value: number }[];
}
