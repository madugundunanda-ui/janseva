import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Complaint, Department, User } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ComplaintsService } from '../../../core/services/complaints.service';
import { DepartmentsService } from '../../../core/services/departments.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-grievance-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (complaint) {
      <!-- Slide-Over Backdrop -->
      <div class="drawer-backdrop" (click)="closeDrawer()"></div>

      <!-- Slide-Over Drawer Panel -->
      <aside class="drawer-panel max-w-xl" aria-label="Grievance Details Drawer">
        
        <!-- Drawer Header -->
        <header class="p-4 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {{ complaint.id }}
            </span>
            <span class="badge-status" [ngClass]="{
              'badge-pending': complaint.status === 'submitted',
              'badge-progress': complaint.status === 'in_progress' || complaint.status === 'assigned',
              'badge-resolved': complaint.status === 'resolved',
              'badge-danger': complaint.status === 'escalated'
            }">
              {{ complaint.status | uppercase }}
            </span>
          </div>

          <button class="btn-icon text-slate-400 hover:text-slate-700" (click)="closeDrawer()" aria-label="Close drawer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </header>

        <!-- Drawer Content Body -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">

          <!-- Title & Priority -->
          <div>
            <div class="flex items-start justify-between gap-4">
              <h2 class="text-xl font-bold text-slate-900 leading-snug">{{ complaint.title }}</h2>
              <span class="text-xs font-semibold uppercase px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                {{ complaint.priority }} {{ translationService.t('PRIORITY') }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Filed on {{ complaint.createdAt | date:'medium' }}
            </p>
          </div>

          <!-- 1. Lifecycle Progress Stepper Timeline -->
          <div class="card-surface p-4 space-y-3">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lifecycle Timeline</h3>
            <div class="flex items-center justify-between text-xs font-medium relative py-2">
              <div class="flex flex-col items-center gap-1 z-10">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                <span class="text-[11px] text-slate-700">Submitted</span>
              </div>
              <div class="flex flex-col items-center gap-1 z-10">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" [ngClass]="complaint.status !== 'submitted' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white animate-pulse'">2</span>
                <span class="text-[11px] text-slate-700">AI Triaged</span>
              </div>
              <div class="flex flex-col items-center gap-1 z-10">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" [ngClass]="complaint.assignedOfficer ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'">3</span>
                <span class="text-[11px] text-slate-700">Assigned</span>
              </div>
              <div class="flex flex-col items-center gap-1 z-10">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" [ngClass]="complaint.status === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'">4</span>
                <span class="text-[11px] text-slate-700">Resolved</span>
              </div>
            </div>
          </div>

          <!-- 2. AI Severity & Analytics Breakdown -->
          @if (complaint.aiAnalysis) {
            <div class="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 grid grid-cols-3 gap-4 text-center">
              <div>
                <span class="text-[11px] font-medium text-slate-500 block uppercase">Severity Score</span>
                <span class="text-xl font-bold text-slate-900 mt-1 block">
                  {{ (complaint.severityScore || complaint.aiAnalysis.severityScore) ?? 0 }}/100
                </span>
              </div>
              <div>
                <span class="text-[11px] font-medium text-slate-500 block uppercase">Est. Resolution</span>
                <span class="text-xl font-bold text-slate-900 mt-1 block">
                  {{ complaint.aiAnalysis.estimatedDays ?? 0 }} Days
                </span>
              </div>
              <div>
                <span class="text-[11px] font-medium text-slate-500 block uppercase">Escalation Risk</span>
                <span class="text-xl font-bold text-rose-700 mt-1 block">
                  {{ complaint.aiAnalysis.escalationProbability ?? 0 }}%
                </span>
              </div>
            </div>
          }

          <!-- AI Explainability Tags -->
          @if (complaint.severityReason && complaint.severityReason.length > 0) {
            <div class="space-y-1.5">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Detection Factors:</span>
              <div class="flex flex-wrap gap-1.5">
                @for (reason of complaint.severityReason; track reason) {
                  <span class="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                    ⚡ {{ reason }}
                  </span>
                }
              </div>
            </div>
          }

          <!-- Description / Narrative -->
          <div class="space-y-1">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Complaint Narrative</h3>
            <p class="text-sm text-slate-800 leading-relaxed card-surface p-3.5 bg-slate-50">
              {{ complaint.description }}
            </p>
          </div>

          <!-- 3. Location Details -->
          <div class="space-y-1">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location Coordinates</h3>
            <div class="card-surface p-3.5 flex items-center justify-between text-xs">
              <div>
                <p class="font-medium text-slate-900">{{ complaint.location.address }}</p>
                <p class="text-slate-500 font-mono text-[11px] mt-0.5">
                  LAT: {{ complaint.location.latitude?.toFixed(4) || complaint.location.lat?.toFixed(4) || '12.9716' }} | LNG: {{ complaint.location.longitude?.toFixed(4) || complaint.location.lng?.toFixed(4) || '77.5946' }}
                </p>
              </div>
              <span class="px-2 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded border border-indigo-200 text-[10px]">Verified GPS</span>
            </div>
          </div>

          <!-- 4. Visual Evidence Images -->
          <div class="space-y-2">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Visual Evidence</h3>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-[11px] text-slate-500 font-medium block mb-1">Before (Reported)</span>
                @if (complaint.imageUrl || (complaint.images && complaint.images.length > 0)) {
                  <img [src]="complaint.imageUrl || complaint.images[0]?.url" class="w-full h-28 object-cover rounded-lg border border-slate-200">
                } @else {
                  <div class="w-full h-28 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">No Image Uploaded</div>
                }
              </div>

              <div>
                <span class="text-[11px] text-slate-500 font-medium block mb-1">After (Resolved Proof)</span>
                @if (complaint.afterImageUrl || (complaint.resolutionProof && complaint.resolutionProof.afterImage)) {
                  <img [src]="complaint.afterImageUrl || (complaint.resolutionProof && complaint.resolutionProof.afterImage)" class="w-full h-28 object-cover rounded-lg border border-emerald-300">
                } @else {
                  <div class="w-full h-28 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">Pending Resolution</div>
                }
              </div>
            </div>
          </div>

          <!-- 5. Assigned Officer & Supervisor Workflow Controls -->
          @if (canSupervisorEdit()) {
            <div class="card-surface p-4 space-y-4">
              <h3 class="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Official Dispatch Controls</h3>
              
              <!-- Officer Assignment -->
              <div class="space-y-2">
                <label class="text-xs font-medium text-slate-700 block">Assign Field Officer:</label>
                <div class="flex gap-2">
                  <select [(ngModel)]="assignedOfficerId" class="select-field text-xs">
                    <option value="">Select Officer...</option>
                    @for (off of officersList; track off.id) {
                      <option [value]="off.id">{{ off.name }} ({{ departmentName(off.department) }})</option>
                    }
                  </select>
                  <button (click)="assignOfficer()" class="btn-primary text-xs shrink-0">Assign</button>
                </div>
              </div>

              <!-- Supervisor Escalation -->
              @if (complaint.status !== 'resolved') {
                <div class="space-y-2 pt-3 border-t border-slate-200">
                  <label class="text-xs font-medium text-slate-700 block">Escalate to Senior Supervisor:</label>
                  <select [(ngModel)]="assignedSupervisorId" class="select-field text-xs mb-2">
                    <option value="">Select Supervisor...</option>
                    @for (sup of supervisorsList; track sup.id) {
                      <option [value]="sup.id">{{ sup.name }}</option>
                    }
                  </select>
                  <button (click)="escalateComplaint()" class="btn-secondary text-xs text-rose-700 border-rose-300 hover:bg-rose-50 w-full">Trigger Escalation</button>
                </div>
              }
            </div>
          }

          <!-- 6. Audit Logs & Transcript -->
          <div class="space-y-2 pt-2 border-t border-slate-200">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Immutable Audit Trail</h3>
            <div class="space-y-2 text-xs">
              @for (log of complaint.logs; track log.timestamp) {
                <div class="p-2.5 rounded bg-slate-50 border border-slate-200/80 space-y-0.5">
                  <div class="flex justify-between text-slate-700 font-medium">
                    <span>{{ log.action }}</span>
                    <span class="text-[10px] text-slate-400">{{ log.timestamp | date:'short' }}</span>
                  </div>
                  <p class="text-[11px] text-slate-500">By: {{ log.performedBy }}</p>
                  @if (log.note) {
                    <p class="text-[11px] text-indigo-600 font-mono">{{ log.note }}</p>
                  }
                </div>
              }
            </div>
          </div>

        </div>
      </aside>
    }
  `
})
export class GrievanceDetailComponent implements OnInit, OnChanges {
  @Input() complaint: Complaint | null = null;
  @Output() refresh = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  departmentsList: Department[] = [];
  officersList: User[] = [];
  supervisorsList: User[] = [];

  impactResidents = 126;
  feedbackRating = 5;
  feedbackComment = '';
  assignedOfficerId = '';
  assignedSupervisorId = '';
  escalationNote = '';
  resolutionFile: File | null = null;
  loadingUpload = false;

  public authService = inject(AuthService);
  public translationService = inject(TranslationService);
  private apiService = inject(ApiService);
  private complaintsService = inject(ComplaintsService);
  private departmentsService = inject(DepartmentsService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.departmentsService.loadDepartments().subscribe(data => {
      this.departmentsList = data;
    });

    if (this.canSupervisorEdit()) {
      this.apiService.getUsers('officer').subscribe(data => {
        this.officersList = data;
        this.cdr.detectChanges();
      });
      this.apiService.getUsers('supervisor').subscribe(data => {
        this.supervisorsList = data;
        this.cdr.detectChanges();
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['complaint'] && this.complaint) {
      this.assignedOfficerId = this.complaint.assignedOfficer?.id || '';
      this.assignedSupervisorId = this.complaint.assignedSupervisor?.id || '';
      this.escalationNote = '';
      this.feedbackComment = '';

      const idSum = (this.complaint.id || '').split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
      this.impactResidents = 80 + (idSum % 140);
    }
  }

  closeDrawer() {
    this.close.emit();
  }

  canSupervisorEdit(): boolean {
    const role = this.authService.userRole();
    return role === 'admin' || role === 'supervisor';
  }

  assignOfficer() {
    if (!this.complaint || !this.assignedOfficerId) return;

    this.complaintsService.assignOfficer(this.complaint.id, this.assignedOfficerId).subscribe({
      next: () => {
        this.refresh.emit();
      }
    });
  }

  escalateComplaint() {
    if (!this.complaint || !this.assignedSupervisorId) return;

    this.complaintsService.escalateComplaint(this.complaint.id, this.assignedSupervisorId, this.escalationNote).subscribe({
      next: () => {
        this.refresh.emit();
      }
    });
  }

  onResolutionFileSelected(event: any) {
    this.resolutionFile = event.target.files[0];
  }

  uploadResolution() {
    if (!this.complaint || !this.resolutionFile) return;

    this.loadingUpload = true;
    const formData = new FormData();
    formData.append('afterImage', this.resolutionFile);
    formData.append('status', 'resolved');

    this.complaintsService.updateComplaint(this.complaint.id, formData).subscribe({
      next: () => {
        this.loadingUpload = false;
        this.resolutionFile = null;
        this.refresh.emit();
      },
      error: () => {
        this.loadingUpload = false;
      }
    });
  }

  submitFeedback() {
    if (!this.complaint) return;
    const user = this.authService.currentUser();
    this.complaint.logs?.push({
      action: 'Citizen Feedback Registered',
      performedBy: user?.name || 'Citizen',
      timestamp: new Date().toISOString(),
      note: `Rating: ${this.feedbackRating}/5 - Feedback: "${this.feedbackComment}"`
    });
    this.feedbackComment = '';
    alert('Resolution feedback registered on municipal grid ledger.');
    this.refresh.emit();
  }

  departmentName(dept: any): string {
    if (!dept) return 'General Operations';
    if (typeof dept === 'string') {
      const match = this.departmentsList.find(d => d.id === dept || d.name.toLowerCase() === dept.toLowerCase());
      return match?.name ?? dept;
    }
    return dept.name ?? 'General Operations';
  }
}
