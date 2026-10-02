export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus = 'Reported' | 'Assigned' | 'In Progress' | 'Resolved';

export type ComplaintCategory =
  | 'Electrical'
  | 'Plumbing'
  | 'Furniture'
  | 'HVAC'
  | 'Civil / Infrastructure'
  | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Worker {
  id: number;
  name: string;
  specialization: string;
  email: string;
  license?: string;
  duty_id?: string;
  active_jobs?: number;
}

export interface Location {
  building: string;
  floor: string;
  room: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  detected_building?: string;
  detected_floor?: string;
  detected_room?: string;
  detected_name?: string;
  verified: boolean;
}

export interface ComplaintTimelineItem {
  status: ComplaintStatus;
  timestamp: string;
  note: string;
  actor?: string;
}

export interface PriorityAssessment {
  priority: PriorityLevel;
  reason: string;
  detected_keywords: string[];
  source: 'Safety Rule Engine' | 'AI / Safety Rule Engine';
}

export interface Complaint {
  complaint_id: string;
  category: ComplaintCategory | string;
  description: string;
  photo_url?: string;
  photo_filename?: string;
  photo_size?: string;

  user: User;
  location: Location;

  priority: PriorityLevel;
  priority_reason?: string;
  detected_keywords?: string[];
  priority_source?: 'Safety Rule Engine' | 'AI / Safety Rule Engine';

  is_recurring: boolean;
  previous_complaint_count: number;
  cluster_id?: string;
  advisory?: string;

  assigned_worker?: Worker;
  email_sent?: boolean;

  status: ComplaintStatus;
  timeline: ComplaintTimelineItem[];

  created_at: string;
  updated_at: string;
}

export interface RecurringClusterItem {
  cluster_id: string;
  complaint_id: string;
  location_label: string;
  building: string;
  room: string;
  category: string;
  count: number;
  summary: string;
  severity: PriorityLevel;
}

export interface DashboardStats {
  total: number;
  priority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  status: {
    reported: number;
    assigned: number;
    in_progress: number;
    resolved: number;
  };
  recurring: number;
  recurring_clusters?: RecurringClusterItem[];
  last_updated?: string;
}

export interface CreateComplaintResponse {
  success: boolean;
  complaint_id: string;
  priority: PriorityLevel;
  priority_reason: string;
  detected_keywords?: string[];
  location: {
    name: string;
    building: string;
    floor: string;
    room: string;
    detected_name?: string;
    latitude?: number;
    longitude?: number;
    verified: boolean;
  };
  is_recurring: boolean;
  previous_complaint_count: number;
  status: ComplaintStatus;
  user_email_sent?: boolean;
  user_email_recipient?: string;
  email_sent_at?: string;
  email_subject?: string;
}

export interface TrackComplaintResponse {
  complaint_id: string;
  category: string;
  description?: string;
  photo_url?: string;
  location: string;
  location_details?: Location;
  priority: PriorityLevel;
  priority_reason?: string;
  status: ComplaintStatus;
  is_recurring?: boolean;
  previous_complaint_count?: number;
  assigned_worker?: Worker;
  timeline: ComplaintTimelineItem[];
  created_at?: string;
}
