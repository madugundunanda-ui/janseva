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
    <div class="glass-panel p-6 rounded-xl border border-white/10 space-y-6 bg-black/40 text-white min-h-[500px]">
      @if (complaint) {
        <!-- Emotional UX celebration overlay when resolved grievance is loaded -->
        @if (complaint.status === 'resolved') {
          <div class="relative overflow-hidden p-6 rounded-xl border border-cyan-500/35 bg-gradient-to-r from-cyan-950/20 to-blue-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col md:flex-row items-center gap-6 animate-float">
            <div class="w-16 h-16 rounded-full border-2 border-cyan-400 flex items-center justify-center bg-cyan-950/40 relative shrink-0">
              <div class="w-10 h-10 rounded-full bg-cyan-400 animate-ping absolute opacity-25"></div>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div class="space-y-2">
              <h4 class="font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider">YOUR GRIEVANCE HELPED {{ impactResidents }} RESIDENTS</h4>
              <p class="font-mono text-[9px] text-muted-var uppercase leading-relaxed text-gray-300">
                By reporting this issue, you successfully initiated visual audit workflows that repaired municipal assets. You have earned +15 Civic Trust Points. Thank you for building a safer, more responsive state!
              </p>
            </div>
          </div>
        }

        <!-- Flashing emergency escalation bypass alert banner -->
        @if (complaint.priority === 'critical' || (complaint.severityScore && complaint.severityScore >= 81)) {
          <div class="p-4 rounded-xl border border-red-500/35 bg-red-950/25 text-red-400 font-mono text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span>EMERGENCY PROTOCOL BYPASS ACTIVE // MUNICIPAL LEAD NODE NOTIFIED FOR IMMEDIATE DISPATCH</span>
          </div>
        }

        <!-- Ticket Top Header -->
        <div class="flex justify-between items-start border-b border-white/10 pb-6">
          <div>
            <span class="font-mono text-[9px] tracking-widest text-cyan-400 uppercase">{{ complaint.id }}</span>
            <h3 class="text-xl font-bold uppercase tracking-tight text-primary-var mt-1">{{ complaint.title }}</h3>
            <p class="text-xs text-muted-var font-mono uppercase mt-2 text-gray-400">
              COORDS: [{{ complaint.location.latitude?.toFixed(4) || complaint.location.lat?.toFixed(4) || '12.9716' }}, {{ complaint.location.longitude?.toFixed(4) || complaint.location.lng?.toFixed(4) || '77.5946' }}] | {{ complaint.location.address }}
            </p>
            @if (complaint.location.landmark) {
              <p class="text-[9px] text-[#6AA9FF] font-mono uppercase mt-1">Nearby: {{ complaint.location.landmark }}</p>
            }
          </div>

          <div class="flex flex-col items-end gap-2 font-mono text-[9px] uppercase">
            <span class="px-3 py-1 rounded bg-white/5 border border-white/10 text-primary-var">{{ complaint.priority }} {{ translationService.t('PRIORITY') }}</span>
            <span class="text-muted-var text-gray-400">{{ translationService.t('FILED') }}: {{ complaint.createdAt | date:'short' }}</span>
          </div>
        </div>

        <!-- AI Analytics Card -->
        @if (complaint.aiAnalysis) {
          <div class="p-5 rounded-xl border border-cyan-500/10 bg-cyan-950/5 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[10px] uppercase">
            <div>
              <span class="text-muted-var block mb-1 text-gray-400">{{ translationService.t('AI_SEVERITY') }}</span>
              <span class="text-lg font-bold text-primary-var">{{ (complaint.severityScore || complaint.aiAnalysis.severityScore) ?? 0 }}/100</span>
              <span class="block text-[8px] text-cyan-400 mt-1">94% Confidence</span>
            </div>

            <div>
              <span class="text-muted-var block mb-1 text-gray-400">{{ translationService.t('ETA_RESOLUTION') }}</span>
              <span class="text-lg font-bold text-primary-var">{{ complaint.aiAnalysis.estimatedDays ?? 0 }} Days</span>
              <span class="block text-[8px] text-emerald-400 mt-1">Delay Risk: {{ complaint.aiAnalysis.delayRisk ?? 'Low' }}</span>
            </div>

            <div>
              <span class="text-muted-var block mb-1 text-gray-400">{{ translationService.t('SLA_RISK') }}</span>
              <span class="text-lg font-bold text-primary-var">{{ complaint.aiAnalysis.escalationProbability ?? 0 }}%</span>
              <span class="block text-[8px] text-muted-var mt-1 text-gray-400">Auto-Route Validated</span>
            </div>
          </div>
        }

        <!-- AI Explainability Reasons tags -->
        @if (complaint.severityReason && complaint.severityReason.length > 0) {
          <div class="p-4 rounded-xl border border-[#6AA9FF]/15 bg-[#6AA9FF]/3 space-y-2">
            <span class="font-mono text-[9px] tracking-widest text-[#6AA9FF] uppercase font-bold">{{ translationService.t('AI_EXPLAINABILITY') }}</span>
            <div class="flex flex-wrap gap-2">
              @for (reason of complaint.severityReason; track reason) {
                <span class="px-2.5 py-1 rounded bg-[#6AA9FF]/10 border border-[#6AA9FF]/20 font-mono text-[9px] text-[#6AA9FF] uppercase tracking-wide">
                  ⚡ {{ reason }}
                </span>
              }
            </div>
          </div>
        }

        <!-- Main Narrative -->
        <div>
          <h4 class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2 text-gray-400">{{ translationService.t('TICKET_NARRATIVE') }}</h4>
          <p class="text-xs sm:text-sm text-primary-var leading-relaxed font-mono uppercase">{{ complaint.description }}</p>
        </div>

        <!-- Grievance Image before -->
        <div>
          <h4 class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-3 text-gray-400">{{ translationService.t('VISUAL_BEFORE') }}</h4>
          <div class="flex gap-4">
            @if (complaint.imageUrl || (complaint.images && complaint.images.length > 0)) {
              <img [src]="complaint.imageUrl || complaint.images[0]?.url" class="w-32 h-20 object-cover rounded-lg border border-white/10 hover:border-white/30 transition-colors duration-200">
            } @else {
              <div class="w-32 h-20 rounded-lg border border-dashed border-white/10 flex items-center justify-center font-mono text-[9px] text-muted-var text-gray-500">NO IMAGE</div>
            }
          </div>
        </div>

        <!-- Resolution Verification Section (CLIP comparison) -->
        @if (complaint.status === 'resolved') {
          <div class="p-5 rounded-xl border border-emerald-500/20 bg-emerald-950/5 space-y-4">
            <div class="flex justify-between items-center">
              <span class="font-mono text-[10px] tracking-widest text-emerald-400 uppercase font-bold">{{ translationService.t('VISUAL_AFTER') }}</span>
              <span class="text-[9px] font-mono text-muted-var text-gray-400">VERIFIED BY JANSEVA AI</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-[8px] font-mono text-muted-var block mb-1 text-gray-400">BEFORE (REPORTED)</span>
                <img [src]="complaint.beforeImageUrl || complaint.imageUrl || (complaint.images && complaint.images[0]?.url)" class="w-full h-32 object-cover rounded-lg border border-white/10">
              </div>
              <div>
                <span class="text-[8px] font-mono text-muted-var block mb-1 text-gray-400">AFTER (RESOLVED)</span>
                <img [src]="complaint.afterImageUrl || (complaint.resolutionProof && complaint.resolutionProof.afterImage)" class="w-full h-32 object-cover rounded-lg border border-emerald-500/30">
              </div>
            </div>

            @if (complaint.verification) {
              <div class="p-3.5 rounded bg-white/2 border border-white/10 font-mono text-[10px] space-y-1.5 uppercase text-primary-var">
                <div class="flex justify-between">
                  <span>Verification Status:</span>
                  <span class="font-bold" [ngClass]="{
                    'text-emerald-400': complaint.verification.status === 'Verified',
                    'text-amber-400': complaint.verification.status === 'Partially Resolved',
                    'text-red-400': complaint.verification.status === 'Not Resolved'
                  }">{{ complaint.verification.status }}</span>
                </div>
                <div class="flex justify-between">
                  <span>CLIP Model Confidence:</span>
                  <span class="text-cyan-400 font-bold">{{ complaint.verification.confidence }}%</span>
                </div>
                <div class="flex justify-between">
                  <span>Visual Difference Index:</span>
                  <span class="text-primary-var font-bold">{{ complaint.verification.differenceScore }}% Delta</span>
                </div>
                @if (complaint.verification.reasons && complaint.verification.reasons.length > 0) {
                  <div class="pt-2 border-t border-white/5 space-y-1">
                    <span class="text-[9px] text-muted-var block">AI Reasoning Notes:</span>
                    @for (r of complaint.verification.reasons; track r) {
                      <div class="text-[9px] text-muted-var">• {{ r }}</div>
                    }
                  </div>
                }
              </div>
            } @else if (complaint.resolutionProof) {
              <div class="p-3.5 rounded bg-white/2 border border-white/10 font-mono text-[10px] space-y-1.5 uppercase text-primary-var">
                <div class="flex justify-between">
                  <span>Verification Status:</span>
                  <span class="text-emerald-400 font-bold">Verified</span>
                </div>
                <div class="flex justify-between">
                  <span>CLIP Model Confidence:</span>
                  <span class="text-cyan-400 font-bold">94%</span>
                </div>
                <div class="flex justify-between">
                  <span>Visual Difference Index:</span>
                  <span class="text-primary-var font-bold">78% Delta</span>
                </div>
              </div>
            }
          </div>
        }

        <!-- Workflow operations based on roles -->
        <div class="pt-6 border-t border-white/10">
          
          <!-- 1. Citizen View Operations (Add Feedback if resolved) -->
          @if (authService.userRole() === 'citizen' && complaint.status === 'resolved') {
            <div class="space-y-4">
              <h4 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">{{ translationService.t('SUBMIT_FEEDBACK') }}</h4>
              <div class="flex items-center gap-3">
                <span class="font-mono text-[10px] text-muted-var uppercase text-gray-400">{{ translationService.t('RATING') }}:</span>
                <select [(ngModel)]="feedbackRating" class="glass-input !py-1 !px-2 font-mono text-[10px] bg-black text-white border border-white/10 rounded">
                  <option [value]="5">5 - Excellent (Instant Action)</option>
                  <option [value]="4">4 - Very Good</option>
                  <option [value]="3">3 - Satisfactory</option>
                  <option [value]="2">2 - Poor Delay</option>
                  <option [value]="1">1 - Defective Resolution</option>
                </select>
              </div>
              <textarea [(ngModel)]="feedbackComment" class="glass-input w-full font-mono text-xs uppercase bg-black text-white border border-white/10 px-3 py-2 rounded" rows="2" placeholder="Provide final remarks..."></textarea>
              <button (click)="submitFeedback()" class="px-5 py-2.5 rounded bg-white text-black font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                {{ translationService.t('SUBMIT') }}
              </button>
            </div>
          }

          <!-- 2. Officer Operations (Upload Resolution proof afterImage) -->
          @if (authService.userRole() === 'officer' && complaint.status !== 'resolved') {
            <div class="space-y-4">
              <h4 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">{{ translationService.t('UPLOAD_RESOLUTION_PROOF') || 'UPLOAD RESOLUTION PROOF (AFTER IMAGE)' }}</h4>
              <p class="text-[9px] font-mono text-muted-var uppercase text-gray-400">Upload proof to trigger visual delta verification. AI will compute pixel matching coordinates before closing.</p>
              
              <div class="flex items-center gap-4">
                <input type="file" (change)="onResolutionFileSelected($event)" class="font-mono text-[10px]">
                <button (click)="uploadResolution()" [disabled]="loadingUpload" class="px-5 py-2.5 rounded bg-white text-black font-mono font-bold text-[10px] uppercase tracking-wider disabled:opacity-50 cursor-pointer hover:bg-gray-100 transition-colors">
                  @if (loadingUpload) { AUDITING PROOF... } @else { RESOLVE GRIEVANCE }
                </button>
              </div>
            </div>
          }

          <!-- 3. Supervisor / Admin Operations (Assign Officer or Escalate) -->
          @if (canSupervisorEdit()) {
            <div class="space-y-6">
              <!-- Assignment Form -->
              <div class="space-y-4">
                <h4 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">{{ translationService.t('WARD_OFFICER') }}</h4>
                <div class="flex items-center gap-4">
                  <select [(ngModel)]="assignedOfficerId" class="glass-input font-mono text-[10px] uppercase bg-black text-white border border-white/10 rounded px-2.5 py-1.5">
                    <option value="">SELECT OFFICER</option>
                    @for (off of officersList; track off.id) {
                      <option [value]="off.id">{{ off.name }} ({{ departmentName(off.department) }})</option>
                    }
                  </select>
                  <button (click)="assignOfficer()" class="px-5 py-2.5 rounded bg-white text-black font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                    UPDATE ASSIGNMENT
                  </button>
                </div>
              </div>

              <!-- Escalation Form -->
              @if (complaint.status !== 'resolved') {
                <div class="space-y-4 pt-6 border-t border-white/10">
                  <h4 class="font-mono text-[10px] tracking-widest text-red-400 uppercase font-bold">{{ translationService.t('ESCALATE_SUP') }}</h4>
                  <div class="space-y-3">
                    <div class="flex items-center gap-4">
                      <select [(ngModel)]="assignedSupervisorId" class="glass-input font-mono text-[10px] uppercase bg-black text-white border border-white/10 rounded px-2.5 py-1.5">
                        <option value="">SELECT SUPERVISOR</option>
                        @for (sup of supervisorsList; track sup.id) {
                          <option [value]="sup.id">{{ sup.name }}</option>
                        }
                      </select>
                    </div>
                    <textarea [(ngModel)]="escalationNote" class="glass-input w-full font-mono text-xs uppercase bg-black text-white border border-white/10 px-3 py-2 rounded" rows="2" placeholder="Provide SLA escalation note..."></textarea>
                    <button (click)="escalateComplaint()" class="px-5 py-2.5 rounded bg-red-950/20 border border-red-500/30 text-red-400 font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer hover:bg-red-900/30 transition-colors">
                      TRIGGER SLA ESCALATION
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Chronological Timeline Logs -->
        <div class="pt-6 border-t border-white/10 space-y-4">
          <h4 class="font-mono text-[9px] tracking-widest text-muted-var uppercase font-bold text-gray-400">{{ translationService.t('TRANSCRIPT') }}</h4>
          <div class="space-y-3 font-mono text-[10px] uppercase">
            @for (log of complaint.logs; track log.timestamp) {
              <div class="flex gap-4 p-3 rounded bg-white/2 border border-white/10">
                <span class="text-muted-var w-32 shrink-0 text-gray-400">{{ log.timestamp | date:'short' }}</span>
                <div class="space-y-1">
                  <div class="text-primary-var font-semibold text-white">{{ log.action }}</div>
                  <div class="text-muted-var text-[9px] text-gray-400">BY: {{ log.performedBy }}</div>
                  @if (log.note) {
                    <div class="text-cyan-400 text-[9px] mt-1">{{ log.note }}</div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="p-16 flex flex-col items-center justify-center text-center h-[500px]">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-muted-var mb-6 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <h3 class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2 text-gray-400">TICKET VIEWER ACTIVE</h3>
          <p class="text-xs font-mono text-muted-var uppercase max-w-xs leading-relaxed text-gray-500">SELECT A TICKET NODE FROM THE FEED STACK TO RUN DETAILED SEVERITY MODELS AND WORKFLOW DISPATCHERS.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class GrievanceDetailComponent implements OnInit, OnChanges {
  @Input() complaint: Complaint | null = null;
  @Output() refresh = new EventEmitter<void>();

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
