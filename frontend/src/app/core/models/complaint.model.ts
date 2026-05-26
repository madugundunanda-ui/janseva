import { Department } from './department.model';
import { User } from './user.model';
import { AiResult } from './ai-result.model';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical' | 'urgent';
export type ComplaintStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'escalated';

export interface ComplaintLocation {
  address: string;
  ward: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  landmark?: string;
}

export interface ComplaintImage {
  url: string;
  filename: string;
}

export interface ComplaintLog {
  action: string;
  performedBy: string;
  timestamp: string;
  note?: string;
}

export interface ResolutionProof {
  afterImage: string;
  verifiedAt?: string;
  confidence?: number;
  status?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  location: ComplaintLocation;
  department: Department | string;
  severity?: ComplaintPriority;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  createdAt: string;
  resolvedAt?: string;
  citizen?: User;
  assignedOfficer?: User;
  assignedSupervisor?: User;
  images: ComplaintImage[];
  resolutionProof?: ResolutionProof;
  peopleAffected?: number;
  aiAnalysis?: AiResult;
  logs?: ComplaintLog[];
  severityScore?: number;
  severityReason?: string[];
  imageUrl?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  verification?: any;
}

export interface ComplaintAssignmentOptions {
  officers: User[];
  supervisors: User[];
}

export interface ComplaintUploadResponse {
  count: number;
  images: ComplaintImage[];
}
