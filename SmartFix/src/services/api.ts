import axios from 'axios';
import type {
  Complaint,
  ComplaintStatus,
  CreateComplaintResponse,
  DashboardStats,
  TrackComplaintResponse,
  Worker,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Request interceptor to attach Admin Auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartfix_admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to redirect to /admin/login on 401 expiry
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname.startsWith('/admin') &&
      window.location.pathname !== '/admin/login'
    ) {
      localStorage.removeItem('smartfix_admin_token');
      localStorage.removeItem('smartfix_admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export interface CreateComplaintPayload {
  user_id: string;
  name: string;
  email: string;
  category: string;
  building: string;
  floor: string;
  room: string;
  description: string;
  photo?: File | null;
  photo_data_url?: string;
  photo_filename?: string;
  photo_size?: string;
  gps_mode?: 'verified' | 'mismatch' | 'none';
}

export async function detectPhotoLocation(params: {
  building: string;
  floor: string;
  room: string;
  gps_mode: 'verified' | 'mismatch' | 'none';
}): Promise<{
  has_gps: boolean;
  latitude?: number;
  longitude?: number;
  user_selected: string;
  detected_building?: string;
  detected_floor?: string;
  detected_room?: string;
  detected_name?: string | null;
  verified: boolean;
}> {
  const { data } = await apiClient.post('/complaints/detect-location', params);
  return data;
}

export async function createComplaint(
  payload: CreateComplaintPayload
): Promise<CreateComplaintResponse> {
  // If pointing to an external backend expecting multipart/form-data, send FormData;
  // for our built-in Express endpoint, JSON with base64 preview also works seamlessly.
  const isExternal =
    API_BASE_URL.startsWith('http') && !API_BASE_URL.includes(window.location.host);

  if (isExternal && payload.photo) {
    const formData = new FormData();
    formData.append('user_id', payload.user_id);
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    formData.append('category', payload.category);
    formData.append('building', payload.building);
    formData.append('floor', payload.floor);
    formData.append('room', payload.room);
    formData.append('description', payload.description);
    formData.append('photo', payload.photo);

    const { data } = await apiClient.post<CreateComplaintResponse>('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  const { data } = await apiClient.post<CreateComplaintResponse>('/complaints', {
    user_id: payload.user_id,
    name: payload.name,
    email: payload.email,
    category: payload.category,
    building: payload.building,
    floor: payload.floor,
    room: payload.room,
    description: payload.description,
    photo_data_url: payload.photo_data_url,
    photo_filename: payload.photo_filename,
    photo_size: payload.photo_size,
    gps_mode: payload.gps_mode || 'verified',
  });
  return data;
}

export async function trackComplaint(
  complaint_id: string,
  email: string
): Promise<TrackComplaintResponse> {
  const { data } = await apiClient.post<TrackComplaintResponse>('/complaints/track', {
    complaint_id: complaint_id.trim(),
    email: email.trim(),
  });
  return data;
}

export async function adminLogin(
  username: string,
  password: string
): Promise<{
  success: boolean;
  token: string;
  admin: { username: string; name: string; node?: string };
}> {
  const { data } = await apiClient.post('/admin/login', { username, password });
  return data;
}

export async function getAdminDashboard(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/admin/dashboard');
  return data;
}

export async function getAdminComplaints(filters?: {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}): Promise<Complaint[]> {
  const params: Record<string, string> = {};
  if (filters?.status && filters.status !== 'All') params.status = filters.status;
  if (filters?.priority && filters.priority !== 'All') params.priority = filters.priority;
  if (filters?.category && filters.category !== 'All') params.category = filters.category;
  if (filters?.search && filters.search.trim() !== '') params.search = filters.search.trim();

  const { data } = await apiClient.get<Complaint[]>('/admin/complaints', { params });
  return data;
}

export async function getComplaintDetails(complaintId: string): Promise<Complaint> {
  const { data } = await apiClient.get<Complaint>(
    `/admin/complaints/${encodeURIComponent(complaintId)}`
  );
  return data;
}

export async function getWorkers(): Promise<Worker[]> {
  const { data } = await apiClient.get<Worker[]>('/admin/workers');
  return data;
}

export async function assignWorkerToComplaint(
  complaintId: string,
  workerId: number
): Promise<{
  success: boolean;
  status: ComplaintStatus;
  worker: Worker;
  email_sent: boolean;
  complaint?: Complaint;
}> {
  const { data } = await apiClient.post(
    `/admin/complaints/${encodeURIComponent(complaintId)}/assign`,
    { worker_id: workerId }
  );
  return data;
}

export async function updateComplaintStatus(
  complaintId: string,
  status: ComplaintStatus
): Promise<{
  success: boolean;
  status: ComplaintStatus;
  complaint?: Complaint;
}> {
  const { data } = await apiClient.patch(
    `/admin/complaints/${encodeURIComponent(complaintId)}/status`,
    { status }
  );
  return data;
}

export async function resendComplaintEmail(
  complaintId: string,
  email: string
): Promise<{
  success: boolean;
  complaint_id: string;
  user_email_sent: boolean;
  user_email_recipient: string;
  email_sent_at: string;
  email_subject: string;
}> {
  const { data } = await apiClient.post(
    `/complaints/${encodeURIComponent(complaintId)}/resend-email`,
    { email }
  );
  return data;
}

