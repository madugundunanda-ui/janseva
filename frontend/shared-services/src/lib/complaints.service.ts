import { Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Complaint, ComplaintAssignmentOptions, ComplaintUploadResponse } from '../models/complaint.model';

@Injectable({
  providedIn: 'root',
})
export class ComplaintsService {
  readonly complaints = signal<Complaint[]>([]);
  readonly selectedComplaint = signal<Complaint | null>(null);

  constructor(private apiService: ApiService) {}

  loadComplaints(params?: Record<string, string | number | boolean | null | undefined>): Observable<Complaint[]> {
    return this.apiService.getComplaints(params).pipe(
      tap((complaints) => this.complaints.set(complaints))
    );
  }

  getComplaint(id: string): Observable<Complaint> {
    return this.apiService.getComplaintById(id).pipe(
      tap((complaint) => this.selectedComplaint.set(complaint))
    );
  }

  createComplaint(formData: FormData): Observable<Complaint> {
    return this.apiService.createComplaint(formData).pipe(
      tap((complaint) => {
        this.complaints.update((items) => [complaint, ...items.filter((item) => item.id !== complaint.id)]);
        this.selectedComplaint.set(complaint);
      })
    );
  }

  uploadComplaintImages(formData: FormData): Observable<ComplaintUploadResponse> {
    return this.apiService.uploadComplaintImages(formData);
  }

  assignOfficer(complaintId: string, officerId: string): Observable<Complaint> {
    return this.apiService.assignOfficer(complaintId, officerId).pipe(
      tap((complaint) => this.patchLocalComplaint(complaint))
    );
  }

  escalateComplaint(complaintId: string, supervisorId: string, note: string): Observable<Complaint> {
    return this.apiService.escalateComplaint(complaintId, supervisorId, note).pipe(
      tap((complaint) => this.patchLocalComplaint(complaint))
    );
  }

  updateComplaint(complaintId: string, formData: FormData): Observable<Complaint> {
    return this.apiService.patch<Complaint>(`/complaints/${complaintId}`, formData).pipe(
      tap((complaint) => this.patchLocalComplaint(complaint))
    );
  }

  verifyResolution(complaintId: string, formData: FormData): Observable<unknown> {
    return this.apiService.postForm<unknown>(`/complaints/${complaintId}/validate`, formData);
  }

  getAssignmentOptions(complaintId: string): Observable<ComplaintAssignmentOptions> {
    return this.apiService.getAssignmentOptions(complaintId);
  }

  private patchLocalComplaint(complaint: Complaint): void {
    this.selectedComplaint.set(complaint);
    this.complaints.update((items) => items.map((item) => (item.id === complaint.id ? complaint : item)));
  }
}
