import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Complaint, Department, User } from '../../core/services/api.service';
import { UserDepartmentRef } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { ComplaintsService } from '../../core/services/complaints.service';
import { DepartmentsService } from '../../core/services/departments.service';
import { AiService } from '../../core/services/ai.service';
import { TranslationService, LanguageCode } from '../../core/services/translation.service';
import { ImageCompressionService } from '../../core/services/image-compression.service';

@Component({
  selector: 'app-complaints',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-12">
      <!-- Grid Panel Left: Grievance List and Filters -->
      <div class="xl:col-span-5 space-y-6">
        
        <!-- Filters panel -->
        <div class="glass-panel p-5 rounded-xl border border-var flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <h2 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">{{ translationService.t('FILTERS') }}</h2>
          </div>

          <div class="flex items-center gap-3">
            <select [(ngModel)]="filterStatus" (change)="applyFilters()" class="glass-input !py-1.5 !px-2.5 font-mono text-[10px] uppercase">
              <option value="all">{{ translationService.t('ALL_STATES') }}</option>
              <option value="submitted">{{ translationService.t('SUBMITTED') }}</option>
              <option value="assigned">{{ translationService.t('ASSIGNED') }}</option>
              <option value="in_progress">{{ translationService.t('IN_PROGRESS') }}</option>
              <option value="resolved">{{ translationService.t('RESOLVED') }}</option>
              <option value="escalated">{{ translationService.t('ESCALATED') }}</option>
            </select>
          </div>
        </div>

        <!-- Offline Drafts Status bar -->
        @if (offlineDraftsCount > 0) {
          <div class="p-4 rounded-xl border border-cyan-500/35 bg-cyan-950/20 text-cyan-300 font-mono text-[10px] uppercase tracking-wide flex justify-between items-center shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>{{ offlineDraftsCount }} Offline drafts cached in local node</span>
            </div>
            <button (click)="syncOfflineDrafts()" class="px-2.5 py-1 rounded bg-cyan-500 text-black font-bold text-[9px] hover:bg-cyan-400 transition-colors uppercase">
              Sync Node
            </button>
          </div>
        }

        <!-- Grievances Feed List -->
        <div data-lenis-prevent class="glass-panel rounded-xl border border-var overflow-hidden max-h-[600px] overflow-y-auto">
          <div class="p-5 border-b border-var flex items-center justify-between">
            <span class="font-mono text-[10px] tracking-widest text-muted-var uppercase">{{ translationService.t('GRIEVANCE_STACK') }} ({{ filteredComplaints.length }})</span>
            
            @if (authService.userRole() === 'citizen') {
              <button (click)="openNewComplaintModal()" class="py-1.5 px-3 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-[9px] uppercase tracking-wider transition-all duration-300">
                {{ translationService.t('REGISTER_TICKET') }}
              </button>
            }
          </div>

          <div class="divide-y divide-white/5">
            @for (complaint of filteredComplaints; track trackById($index, complaint)) {
              <div (click)="selectComplaint(complaint)" [class.bg-white/3]="selectedComplaint?.id === complaint.id" class="p-5 hover:bg-white/2 transition-colors duration-200 cursor-pointer relative">
                <!-- Glowing active tag border -->
                @if (selectedComplaint?.id === complaint.id) {
                  <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan-500"></div>
                }

                <div class="flex justify-between items-start mb-2 font-mono text-[9px] tracking-wider uppercase text-muted-var">
                  <span>{{ complaint.id }} // WARD {{ complaint.location.ward }}</span>
                  <span class="px-2 py-0.5 rounded text-[8px] border" [ngClass]="{
                    'border-purple-500/30 text-purple-400 bg-purple-950/15': complaint.status === 'submitted',
                    'border-blue-500/30 text-blue-400 bg-blue-950/15': complaint.status === 'assigned',
                    'border-cyan-500/30 text-cyan-400 bg-cyan-950/15': complaint.status === 'in_progress',
                    'border-emerald-500/30 text-emerald-400 bg-emerald-950/15': complaint.status === 'resolved',
                    'border-red-500/30 text-red-400 bg-red-950/15': complaint.status === 'escalated'
                  }">{{ translationService.t(complaint.status.toUpperCase()) }}</span>
                </div>

                <h4 class="text-sm font-semibold text-primary-var tracking-wide mb-2 truncate uppercase">{{ complaint.title }}</h4>
                <p class="text-xs text-muted-var line-clamp-2 uppercase font-mono tracking-wide">{{ complaint.description }}</p>

                <div class="mt-4 flex items-center justify-between font-mono text-[9px] text-muted-var uppercase">
                  <span>DEPT: {{ departmentName(complaint.department) }}</span>
                  <span class="text-red-400 font-semibold">{{ complaint.priority }}</span>
                </div>
              </div>
            } @empty {
              <div class="p-10 text-center font-mono text-xs text-muted-var uppercase">
                No tickets align with filters.
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Grid Panel Right: Ticket Details View -->
      <div class="xl:col-span-7">
        @if (selectedComplaint) {
          <div class="glass-panel p-6 rounded-xl border border-var space-y-6">
            
            <!-- Emotional UX celebration overlay when resolved grievance is loaded -->
            @if (selectedComplaint.status === 'resolved') {
              <div class="relative overflow-hidden p-6 rounded-xl border border-cyan-500/35 bg-gradient-to-r from-cyan-950/20 to-blue-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col md:flex-row items-center gap-6 animate-float">
                <!-- Glowing ring animation -->
                <div class="w-16 h-16 rounded-full border-2 border-cyan-400 flex items-center justify-center bg-cyan-950/40 relative shrink-0">
                  <div class="w-10 h-10 rounded-full bg-cyan-400 animate-ping absolute opacity-25"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div class="space-y-2">
                  <h4 class="font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider">YOUR GRIEVANCE HELPED {{ impactResidents }} RESIDENTS</h4>
                  <p class="font-mono text-[9px] text-muted-var uppercase leading-relaxed">
                    By reporting this issue, you successfully initiated visual audit workflows that repaired municipal assets. You have earned +15 Civic Trust Points. Thank you for building a safer, more responsive state!
                  </p>
                </div>
              </div>
            }

            <!-- Flashing emergency escalation bypass alert banner -->
            @if (selectedComplaint.priority === 'critical' || (selectedComplaint.severityScore && selectedComplaint.severityScore >= 81)) {
              <div class="p-4 rounded-xl border border-red-500/35 bg-red-950/25 text-red-400 font-mono text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span>EMERGENCY PROTOCOL BYPASS ACTIVE // MUNICIPAL LEAD NODE NOTIFIED FOR IMMEDIATE DISPATCH</span>
              </div>
            }

            <!-- Ticket Top Header -->
            <div class="flex justify-between items-start border-b border-var pb-6">
              <div>
                <span class="font-mono text-[9px] tracking-widest text-cyan-400 uppercase">{{ selectedComplaint.id }}</span>
                <h3 class="text-xl font-bold uppercase tracking-tight text-primary-var mt-1">{{ selectedComplaint.title }}</h3>
                <p class="text-xs text-muted-var font-mono uppercase mt-2">
                  COORDS: [{{ selectedComplaint.location.latitude?.toFixed(4) || selectedComplaint.location.lat?.toFixed(4) || '12.9716' }}, {{ selectedComplaint.location.longitude?.toFixed(4) || selectedComplaint.location.lng?.toFixed(4) || '77.5946' }}] | {{ selectedComplaint.location.address }}
                </p>
                @if (selectedComplaint.location.landmark) {
                  <p class="text-[9px] text-[#6AA9FF] font-mono uppercase mt-1">Nearby: {{ selectedComplaint.location.landmark }}</p>
                }
              </div>

              <div class="flex flex-col items-end gap-2 font-mono text-[9px] uppercase">
                <span class="px-3 py-1 rounded bg-white/2 border border-var text-primary-var">{{ selectedComplaint.priority }} {{ translationService.t('PRIORITY') }}</span>
                <span class="text-muted-var">{{ translationService.t('FILED') }}: {{ selectedComplaint.createdAt | date:'short' }}</span>
              </div>
            </div>

            <!-- AI Analytics Card -->
            @if (selectedComplaint.aiAnalysis) {
              <div class="p-5 rounded-xl border border-cyan-500/10 bg-cyan-950/5 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[10px] uppercase">
                <div>
                  <span class="text-muted-var block mb-1">{{ translationService.t('AI_SEVERITY') }}</span>
                  <span class="text-lg font-bold text-primary-var">{{ (selectedComplaint.severityScore || selectedComplaint.aiAnalysis.severityScore) ?? 0 }}/100</span>
                  <span class="block text-[8px] text-cyan-400 mt-1">94% Confidence</span>
                </div>

                <div>
                  <span class="text-muted-var block mb-1">{{ translationService.t('ETA_RESOLUTION') }}</span>
                  <span class="text-lg font-bold text-primary-var">{{ selectedComplaint.aiAnalysis.estimatedDays ?? 0 }} Days</span>
                  <span class="block text-[8px] text-emerald-400 mt-1">Delay Risk: {{ selectedComplaint.aiAnalysis.delayRisk ?? 'Low' }}</span>
                </div>

                <div>
                  <span class="text-muted-var block mb-1">{{ translationService.t('SLA_RISK') }}</span>
                  <span class="text-lg font-bold text-primary-var">{{ selectedComplaint.aiAnalysis.escalationProbability ?? 0 }}%</span>
                  <span class="block text-[8px] text-muted-var mt-1">Auto-Route Validated</span>
                </div>
              </div>
            }

            <!-- AI Explainability Reasons tags -->
            @if (selectedComplaint.severityReason && selectedComplaint.severityReason.length > 0) {
              <div class="p-4 rounded-xl border border-[#6AA9FF]/15 bg-[#6AA9FF]/3 space-y-2">
                <span class="font-mono text-[9px] tracking-widest text-[#6AA9FF] uppercase font-bold">{{ translationService.t('AI_EXPLAINABILITY') }}</span>
                <div class="flex flex-wrap gap-2">
                  @for (reason of selectedComplaint.severityReason; track trackByIndex($index, reason)) {
                    <span class="px-2.5 py-1 rounded bg-[#6AA9FF]/10 border border-[#6AA9FF]/20 font-mono text-[9px] text-[#6AA9FF] uppercase tracking-wide">
                      ⚡ {{ reason }}
                    </span>
                  }
                </div>
              </div>
            }

            <!-- Main Narrative -->
            <div>
              <h4 class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('TICKET_NARRATIVE') }}</h4>
              <p class="text-xs sm:text-sm text-primary-var leading-relaxed font-mono uppercase">{{ selectedComplaint.description }}</p>
            </div>

            <!-- Grievance Image before -->
            <div>
              <h4 class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-3">{{ translationService.t('VISUAL_BEFORE') }}</h4>
              <div class="flex gap-4">
                @if (selectedComplaint.imageUrl || (selectedComplaint.images && selectedComplaint.images.length > 0)) {
                  <img [src]="selectedComplaint.imageUrl || selectedComplaint.images[0]?.url" class="w-32 h-20 object-cover rounded-lg border border-var hover:border-white/30 transition-colors duration-200">
                } @else {
                  <div class="w-32 h-20 rounded-lg border border-dashed border-var flex items-center justify-center font-mono text-[9px] text-muted-var">NO IMAGE</div>
                }
              </div>
            </div>

            <!-- Resolution Verification Section (CLIP comparison) -->
            @if (selectedComplaint.status === 'resolved') {
              <div class="p-5 rounded-xl border border-emerald-500/20 bg-emerald-950/5 space-y-4">
                <div class="flex justify-between items-center">
                  <span class="font-mono text-[10px] tracking-widest text-emerald-400 uppercase font-bold">{{ translationService.t('VISUAL_AFTER') }}</span>
                  <span class="text-[9px] font-mono text-muted-var">VERIFIED BY JANSEVA AI</span>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <span class="text-[8px] font-mono text-muted-var block mb-1">BEFORE (REPORTED)</span>
                    <img [src]="selectedComplaint.beforeImageUrl || selectedComplaint.imageUrl || (selectedComplaint.images && selectedComplaint.images[0]?.url)" class="w-full h-32 object-cover rounded-lg border border-var">
                  </div>
                  <div>
                    <span class="text-[8px] font-mono text-muted-var block mb-1">AFTER (RESOLVED)</span>
                    <img [src]="selectedComplaint.afterImageUrl || (selectedComplaint.resolutionProof && selectedComplaint.resolutionProof.afterImage)" class="w-full h-32 object-cover rounded-lg border border-emerald-500/30">
                  </div>
                </div>

                @if (selectedComplaint.verification) {
                  <div class="p-3.5 rounded bg-white/2 border border-var font-mono text-[10px] space-y-1.5 uppercase text-primary-var">
                    <div class="flex justify-between">
                      <span>Verification Status:</span>
                      <span class="font-bold" [ngClass]="{
                        'text-emerald-400': selectedComplaint.verification.status === 'Verified',
                        'text-amber-400': selectedComplaint.verification.status === 'Partially Resolved',
                        'text-red-400': selectedComplaint.verification.status === 'Not Resolved'
                      }">{{ selectedComplaint.verification.status }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>CLIP Model Confidence:</span>
                      <span class="text-cyan-400 font-bold">{{ selectedComplaint.verification.confidence }}%</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Visual Difference Index:</span>
                      <span class="text-primary-var font-bold">{{ selectedComplaint.verification.differenceScore }}% Delta</span>
                    </div>
                    @if (selectedComplaint.verification.reasons && selectedComplaint.verification.reasons.length > 0) {
                      <div class="pt-2 border-t border-white/5 space-y-1">
                        <span class="text-[9px] text-muted-var block">AI Reasoning Notes:</span>
                        @for (r of selectedComplaint.verification.reasons; track trackByIndex($index, r)) {
                          <div class="text-[9px] text-muted-var">• {{ r }}</div>
                        }
                      </div>
                    }
                  </div>
                } @else if (selectedComplaint.resolutionProof) {
                  <div class="p-3.5 rounded bg-white/2 border border-var font-mono text-[10px] space-y-1.5 uppercase text-primary-var">
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
            <div class="pt-6 border-t border-var">
              
              <!-- 1. Citizen View Operations (Add Feedback if resolved) -->
              @if (authService.userRole() === 'citizen' && selectedComplaint.status === 'resolved') {
                <div class="space-y-4">
                  <h4 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">{{ translationService.t('SUBMIT_FEEDBACK') }}</h4>
                  <div class="flex items-center gap-3">
                    <span class="font-mono text-[10px] text-muted-var uppercase">{{ translationService.t('RATING') }}:</span>
                    <select [(ngModel)]="feedbackRating" class="glass-input !py-1 !px-2 font-mono text-[10px]">
                      <option [value]="5">5 - Excellent (Instant Action)</option>
                      <option [value]="4">4 - Very Good</option>
                      <option [value]="3">3 - Satisfactory</option>
                      <option [value]="2">2 - Poor Delay</option>
                      <option [value]="1">1 - Defective Resolution</option>
                    </select>
                  </div>
                  <textarea [(ngModel)]="feedbackComment" class="glass-input w-full font-mono text-xs uppercase" rows="2" placeholder="Provide final remarks..."></textarea>
                  <button (click)="submitFeedback()" class="px-5 py-2.5 rounded bg-white text-black font-mono font-bold text-[10px] uppercase tracking-wider">
                    {{ translationService.t('SUBMIT') }}
                  </button>
                </div>
              }

              <!-- 2. Officer Operations (Upload Resolution proof afterImage) -->
              @if (authService.userRole() === 'officer' && selectedComplaint.status !== 'resolved') {
                <div class="space-y-4">
                  <h4 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">{{ translationService.t('UPLOAD_RESOLUTION_PROOF') || 'UPLOAD RESOLUTION PROOF (AFTER IMAGE)' }}</h4>
                  <p class="text-[9px] font-mono text-muted-var uppercase">Upload proof to trigger visual delta verification. AI will compute pixel matching coordinates before closing.</p>
                  
                  <div class="flex items-center gap-4">
                    <input type="file" (change)="onResolutionFileSelected($event)" class="font-mono text-[10px]">
                    <button (click)="uploadResolution()" [disabled]="loadingUpload" class="px-5 py-2.5 rounded bg-white text-black font-mono font-bold text-[10px] uppercase tracking-wider disabled:opacity-50">
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
                      <select [(ngModel)]="assignedOfficerId" class="glass-input font-mono text-[10px] uppercase">
                        <option value="">SELECT OFFICER</option>
                        @for (off of officersList; track off.id) {
                          <option [value]="off.id">{{ off.name }} ({{ departmentName(off.department) }})</option>
                        }
                      </select>
                      <button (click)="assignOfficer()" class="px-5 py-2.5 rounded bg-white text-black font-mono font-bold text-[10px] uppercase tracking-wider">
                        UPDATE ASSIGNMENT
                      </button>
                    </div>
                  </div>

                  <!-- Escalation Form -->
                  @if (selectedComplaint.status !== 'resolved') {
                    <div class="space-y-4 pt-6 border-t border-var">
                      <h4 class="font-mono text-[10px] tracking-widest text-red-400 uppercase font-bold">{{ translationService.t('ESCALATE_SUP') }}</h4>
                      <div class="space-y-3">
                        <div class="flex items-center gap-4">
                          <select [(ngModel)]="assignedSupervisorId" class="glass-input font-mono text-[10px] uppercase">
                            <option value="">SELECT SUPERVISOR</option>
                            @for (sup of supervisorsList; track sup.id) {
                              <option [value]="sup.id">{{ sup.name }}</option>
                            }
                          </select>
                        </div>
                        <textarea [(ngModel)]="escalationNote" class="glass-input w-full font-mono text-xs uppercase" rows="2" placeholder="Provide SLA escalation note..."></textarea>
                        <button (click)="escalateComplaint()" class="px-5 py-2.5 rounded bg-red-950/20 border border-red-500/30 text-red-400 font-mono font-bold text-[10px] uppercase tracking-wider">
                          TRIGGER SLA ESCALATION
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Chronological Timeline Logs -->
            <div class="pt-6 border-t border-var space-y-4">
              <h4 class="font-mono text-[9px] tracking-widest text-muted-var uppercase font-bold">{{ translationService.t('TRANSCRIPT') }}</h4>
              <div class="space-y-3 font-mono text-[10px] uppercase">
                @for (log of selectedComplaint.logs; track trackByIndex($index, log)) {
                  <div class="flex gap-4 p-3 rounded bg-white/2 border border-var">
                    <span class="text-muted-var w-32 shrink-0">{{ log.timestamp | date:'short' }}</span>
                    <div class="space-y-1">
                      <div class="text-primary-var font-semibold">{{ log.action }}</div>
                      <div class="text-muted-var text-[9px]">BY: {{ log.performedBy }}</div>
                      @if (log.note) {
                        <div class="text-cyan-400 text-[9px] mt-1">{{ log.note }}</div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        } @else {
          <div class="glass-panel p-16 rounded-xl border border-var flex flex-col items-center justify-center text-center h-[500px]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-muted-var mb-6 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <h3 class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">TICKET VIEWER ACTIVE</h3>
            <p class="text-xs font-mono text-muted-var uppercase max-w-xs leading-relaxed">SELECT A TICKET NODE FROM THE FEED STACK TO RUN DETAILED SEVERITY MODELS AND WORKFLOW DISPATCHERS.</p>
          </div>
        }
      </div>
    </div>

    <!-- Modal: Register New Complaint -->
    @if (showNewComplaintModal) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-white/65 backdrop-blur-md p-6">
        <div data-lenis-prevent class="w-full max-w-2xl glass-panel glow-card rounded-2xl p-8 relative max-h-[90vh] overflow-y-auto">
          <button (click)="closeNewComplaintModal()" class="absolute top-4 right-4 text-muted-var hover:text-primary-var font-mono text-xs uppercase cursor-pointer">
            [CLOSE ESC]
          </button>

          <div class="flex justify-between items-center mb-2">
            <div class="inline-flex items-center gap-2">
              <span class="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
              <span class="font-mono text-[9px] tracking-widest text-cyan-400 uppercase">{{ translationService.t('AI_ASSISTED_CIVIC_INTAKE') }}</span>
            </div>
            <div class="font-mono text-[9px] uppercase flex items-center gap-1.5">
              <span class="text-muted-var">{{ translationService.t('AI_CORE_NETWORK') }}:</span>
              <span class="font-bold" [ngClass]="{
                'text-emerald-400': aiHealthStatus === 'Online',
                'text-amber-400': aiHealthStatus === 'Busy',
                'text-red-400 animate-pulse': aiHealthStatus === 'Offline'
              }">{{ aiHealthStatus }}</span>
            </div>
          </div>
          <h3 class="text-xl font-bold uppercase tracking-tight text-primary-var mb-6 font-mono">{{ translationService.t('REGISTER_NEW_GRIEVANCE') }}</h3>

          <!-- Form elements -->
          <div class="space-y-4 mb-6">
            <!-- Image upload with AI analysis status -->
            <div (click)="fileInput.click()" class="p-5 rounded-xl border border-dashed border-var bg-white/2 hover:bg-white/5 transition-colors duration-200 text-center relative flex flex-col items-center cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-muted-var mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              
              <input #fileInput type="file" (change)="onComplaintFileSelected($event)" (click)="$event.stopPropagation()" class="font-mono text-[10px] text-muted-var mb-2">
              <span class="text-[9px] font-mono text-muted-var uppercase">{{ translationService.t('AUTO_FILL_INFO') }}</span>
            </div>

            <!-- Progressive AI Analysis Steps -->
            @if (showAiStatusSteps) {
              <div class="p-5 rounded-xl border border-cyan-500/25 bg-cyan-950/10 space-y-3 font-mono text-[10px] uppercase text-left">
                <div class="flex justify-between items-center border-b border-white/5 pb-2">
                  <span class="font-bold text-cyan-400">{{ translationService.t('AI_PIPELINE_STATUS') }}</span>
                  <span class="text-[9px] text-cyan-400 font-bold">{{ aiProgress }}%</span>
                </div>
                
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span>✓ {{ translationService.t('AI_STEP_1_TITLE') }} ({{ translationService.t('IMAGE_UPLOADED_SUCCESS') }})</span>
                    <span class="text-cyan-400 font-bold">{{ translationService.t('DONE') }}</span>
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <span>{{ aiStepDetecting ? '● ' + translationService.t('AI_STEP_2_RUNNING') : (aiStepDetectingDone ? '✓ ' + translationService.t('AI_STEP_2_DONE') : '○ ' + translationService.t('AI_STEP_2_PENDING')) }}</span>
                    <span [ngClass]="{'text-yellow-400 animate-pulse font-bold': aiStepDetecting, 'text-cyan-400 font-bold': aiStepDetectingDone, 'text-muted-var': !aiStepDetecting && !aiStepDetectingDone}">
                      {{ aiStepDetecting ? translationService.t('RUNNING') : (aiStepDetectingDone ? translationService.t('DONE') : translationService.t('PENDING')) }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span>{{ aiStepSeverity ? '● ' + translationService.t('AI_STEP_3_RUNNING') : (aiStepSeverityDone ? '✓ ' + translationService.t('AI_STEP_3_DONE') : '○ ' + translationService.t('AI_STEP_3_PENDING')) }}</span>
                    <span [ngClass]="{'text-yellow-400 animate-pulse font-bold': aiStepSeverity, 'text-cyan-400 font-bold': aiStepSeverityDone, 'text-muted-var': !aiStepSeverity && !aiStepSeverityDone}">
                      {{ aiStepSeverity ? translationService.t('RUNNING') : (aiStepSeverityDone ? translationService.t('DONE') : translationService.t('PENDING')) }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span>{{ aiStepETA ? '● ' + translationService.t('AI_STEP_4_RUNNING') : (aiStepETADone ? '✓ ' + translationService.t('AI_STEP_4_DONE') : '○ ' + translationService.t('AI_STEP_4_PENDING')) }}</span>
                    <span [ngClass]="{'text-yellow-400 animate-pulse font-bold': aiStepETA, 'text-cyan-400 font-bold': aiStepETADone, 'text-muted-var': !aiStepETA && !aiStepETADone}">
                      {{ aiStepETA ? translationService.t('RUNNING') : (aiStepETADone ? translationService.t('DONE') : translationService.t('PENDING')) }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span>{{ aiStepDuplicate ? '● ' + translationService.t('AI_STEP_5_RUNNING') : (aiStepDuplicateDone ? '✓ ' + translationService.t('AI_STEP_5_DONE') : '○ ' + translationService.t('AI_STEP_5_PENDING')) }}</span>
                    <span [ngClass]="{'text-yellow-400 animate-pulse font-bold': aiStepDuplicate, 'text-cyan-400 font-bold': aiStepDuplicateDone, 'text-muted-var': !aiStepDuplicate && !aiStepDuplicateDone}">
                      {{ aiStepDuplicate ? translationService.t('RUNNING') : (aiStepDuplicateDone ? translationService.t('DONE') : translationService.t('PENDING')) }}
                    </span>
                  </div>
                </div>

                @if (aiTimeoutMessage) {
                  <div class="text-amber-400 font-bold border-t border-white/5 pt-2 flex items-center gap-1.5 animate-pulse">
                    ⚠️ {{ aiTimeoutMessage }}
                  </div>
                }
              </div>
            }

            <!-- GPS Capture & Geofencing Proximity Landmark panel -->
            <div class="p-4 rounded-xl border border-var bg-white/2 space-y-3 font-mono text-[10px] uppercase">
              <div class="flex justify-between items-center">
                <span>{{ translationService.t('GPS_LOCATION') }}</span>
                <button (click)="captureLocation()" [disabled]="gpsCapturing" class="px-3 py-1.5 rounded bg-[#06b6d4] text-black font-bold hover:bg-[#0891b2] transition-colors">
                  @if (gpsCapturing) { {{ translationService.t('CAPTURING') }} } @else { {{ translationService.t('CAPTURE_GPS') }} }
                </button>
              </div>

              @if (gpsCaptured) {
                <div class="space-y-1.5 text-primary-var bg-white/2 p-2.5 rounded border border-var">
                  <div>LATITUDE: <span class="text-cyan-400 font-bold">{{ capturedCoordinates.lat.toFixed(6) }}</span></div>
                  <div>LONGITUDE: <span class="text-cyan-400 font-bold">{{ capturedCoordinates.lng.toFixed(6) }}</span></div>
                  @if (nearbyLandmark) {
                    <div class="text-[#6AA9FF] font-bold">LANDMARK: {{ nearbyLandmark }}</div>
                  }
                </div>
              }
            </div>

            <!-- Voice Transcription panel -->
            <div class="p-4 rounded-xl border border-var bg-white/2 space-y-3 font-mono text-[10px] uppercase">
              <div class="flex justify-between items-center gap-3">
                <span>{{ translationService.t('VOICE_INPUT') }}</span>
                
                <div class="flex items-center gap-2">
                  <select [(ngModel)]="voiceLanguage" class="glass-input !py-1 !px-2 font-mono text-[9px] uppercase">
                    <option value="en-IN">EN (IN)</option>
                    <option value="te-IN">TE (Telugu)</option>
                    <option value="ta-IN">TA (Tamil)</option>
                    <option value="kn-IN">KN (Kannada)</option>
                  </select>

                  <button (click)="toggleVoiceInput()" class="p-2 rounded-full border bg-red-950/20 border-red-500/30 text-red-400 hover:bg-red-900/30 transition-colors" [class.animate-pulse]="voiceRecognizing">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>
              </div>
              @if (voiceRecognizing) {
                <div class="text-red-400 font-bold animate-pulse text-[9px]">{{ translationService.t('SPEAK_NOW') }}</div>
              }
            </div>

            <!-- Title & description -->
            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('GRIEVANCE_TITLE') }}</label>
              <input type="text" [(ngModel)]="newComplaintData.title" [disabled]="showAiStatusSteps && !aiStepDuplicateDone && !aiTimeoutMessage" class="glass-input" placeholder="Detected Title auto-fills...">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col">
                <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('TARGET_DEPARTMENT') }}</label>
                <select [(ngModel)]="newComplaintData.department" [disabled]="showAiStatusSteps && !aiStepDuplicateDone && !aiTimeoutMessage" class="glass-input font-mono text-[10px]">
                  @for (d of departmentsList; track d.id) {
                    <option [value]="d.id">{{ d.name }}</option>
                  }
                </select>
              </div>

              <div class="flex flex-col">
                <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('LOCATION_ADDRESS') }}</label>
                <input type="text" [(ngModel)]="newComplaintData.address" [disabled]="showAiStatusSteps && !aiStepDuplicateDone && !aiTimeoutMessage" class="glass-input" placeholder="Ward 12 Main St">
              </div>
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('DETAILED_NARRATIVE') }}</label>
              <textarea [(ngModel)]="newComplaintData.description" [disabled]="showAiStatusSteps && !aiStepDuplicateDone && !aiTimeoutMessage" rows="3" class="glass-input" placeholder="Detail the issue..."></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-4">
            <button (click)="closeNewComplaintModal()" class="px-5 py-2.5 rounded border border-var hover:bg-white/5 text-primary-var font-mono text-[10px] uppercase">
              {{ translationService.t('CANCEL') }}
            </button>
            <button (click)="submitComplaint()" [disabled]="loadingSubmit || (showAiStatusSteps && !aiStepDuplicateDone && !aiTimeoutMessage)" class="px-6 py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-[10px] uppercase shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              {{ translationService.t('INITIALIZE_TICKET_DISPATCH') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ComplaintsComponent implements OnInit {
  complaintsList: Complaint[] = [];
  filteredComplaints: Complaint[] = [];
  selectedComplaint: Complaint | null = null;
  departmentsList: Department[] = [];
  
  officersList: User[] = [];
  supervisorsList: User[] = [];

  // Filter
  filterStatus = 'all';

  // Modal State
  showNewComplaintModal = false;
  analyzingImage = false;
  loadingSubmit = false;

  // Progressive AI states
  showAiStatusSteps = false;
  aiProgress = 0;
  aiStepDetecting = false;
  aiStepDetectingDone = false;
  aiStepSeverity = false;
  aiStepSeverityDone = false;
  aiStepETA = false;
  aiStepETADone = false;
  aiStepDuplicate = false;
  aiStepDuplicateDone = false;
  aiTimeoutMessage = '';
  aiHealthStatus = 'Offline';
  private aiStreamSub: any = null;
  private aiTimeoutTimer: any = null;

  // Geolocation & Voice states
  gpsCapturing = false;
  gpsCaptured = false;
  voiceRecognizing = false;
  voiceLanguage = 'en-IN';
  nearbyLandmark = '';
  capturedCoordinates = { lat: 12.9716, lng: 77.5946 };
  offlineDraftsCount = 0;
  impactResidents = 126;
  tempImagePath = '';
  aiPredictedCategory = '';
  aiPredictedDepartment = '';

  // New Complaint fields
  newComplaintData = {
    title: '',
    description: '',
    department: '',
    address: 'Ward 12 Main Road',
    ward: '12',
    file: null as File | null,
    priority: 'medium',
    severityScore: 0,
    severityReason: [] as string[],
    estimatedDays: 0,
    delayRisk: 'Low',
    duplicateDetected: false
  };

  // Operations fields
  feedbackRating = 5;
  feedbackComment = '';
  assignedOfficerId = '';
  assignedSupervisorId = '';
  escalationNote = '';
  resolutionFile: File | null = null;
  loadingUpload = false;

  // Services
  public translationService = inject(TranslationService);
  private imageCompressionService = inject(ImageCompressionService);

  constructor(
    public apiService: ApiService,
    public authService: AuthService,
    private complaintsService: ComplaintsService,
    private departmentsService: DepartmentsService,
    private aiService: AiService
  ) {}

  ngOnInit(): void {
    this.loadComplaints();
    this.departmentsService.loadDepartments().subscribe(data => {
      this.departmentsList = data;
      if (data.length > 0) {
        this.newComplaintData.department = data[0].id;
      }
    });

    if (this.canSupervisorEdit()) {
      this.apiService.getUsers('officer').subscribe(data => this.officersList = data);
      this.apiService.getUsers('supervisor').subscribe(data => this.supervisorsList = data);
    }

    // Setup offline detection and local sync
    this.setupOfflineListeners();
  }

  trackById(index: number, item: Complaint) {
    return item.id;
  }

  // Generic trackBy function for index-based tracking
  trackByIndex(index: number, item: any) {
    return index;
  }

  loadComplaints() {
    this.complaintsService.loadComplaints().subscribe((data) => {
      const user = this.authService.currentUser();
      if (user && user.role === 'citizen') {
        this.complaintsList = data.filter(c => c.citizen?.id === user.id || c.citizen?.name === user.name);
      } else if (user && user.role === 'officer') {
        this.complaintsList = data.filter(c => c.assignedOfficer?.id === user.id || c.assignedOfficer?.name === user.name);
      } else {
        this.complaintsList = data;
      }
      this.applyFilters();
      if (this.filteredComplaints.length > 0 && !this.selectedComplaint) {
        this.selectComplaint(this.filteredComplaints[0]);
      }
    });
  }

  applyFilters() {
    if (this.filterStatus === 'all') {
      this.filteredComplaints = [...this.complaintsList];
    } else {
      this.filteredComplaints = this.complaintsList.filter(c => c.status === this.filterStatus);
    }
  }

  selectComplaint(complaint: Complaint) {
    this.selectedComplaint = complaint;
    this.assignedOfficerId = complaint.assignedOfficer?.id || '';
    this.assignedSupervisorId = complaint.assignedSupervisor?.id || '';
    this.escalationNote = '';
    this.feedbackComment = '';

    // Calculate emotional residents impact dynamically
    const idSum = (complaint.id || '').split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    this.impactResidents = 80 + (idSum % 140);
  }

  canSupervisorEdit(): boolean {
    const role = this.authService.userRole();
    return role === 'admin' || role === 'supervisor';
  }

  // --- Register New Complaint Form Handlers ---
  openNewComplaintModal() {
    this.showNewComplaintModal = true;
    this.newComplaintData.title = '';
    this.newComplaintData.description = '';
    this.newComplaintData.file = null;
    this.newComplaintData.priority = 'medium';
    this.newComplaintData.severityScore = 0;
    this.newComplaintData.severityReason = [];
    this.newComplaintData.estimatedDays = 0;
    this.newComplaintData.delayRisk = 'Low';
    this.newComplaintData.duplicateDetected = false;
    this.gpsCaptured = false;
    this.nearbyLandmark = '';
    
    // Reset steps
    this.showAiStatusSteps = false;
    this.aiProgress = 0;
    this.aiTimeoutMessage = '';
    this.tempImagePath = '';
    this.aiPredictedCategory = '';
    this.aiPredictedDepartment = '';

    // Check health
    this.aiHealthStatus = 'Checking...';
    this.aiService.getAiHealthStatus().subscribe({
      next: (health: any) => {
        this.aiHealthStatus = health.status || 'Online';
      },
      error: () => {
        this.aiHealthStatus = 'Offline';
      }
    });
  }

  closeNewComplaintModal() {
    this.showNewComplaintModal = false;
    if (this.aiStreamSub) {
      this.aiStreamSub.unsubscribe();
    }
    if (this.aiTimeoutTimer) {
      clearTimeout(this.aiTimeoutTimer);
    }
  }

  async onComplaintFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Clear any old subscriptions and timers
      if (this.aiStreamSub) this.aiStreamSub.unsubscribe();
      if (this.aiTimeoutTimer) clearTimeout(this.aiTimeoutTimer);

      this.showAiStatusSteps = true;
      this.aiProgress = 10;
      this.aiStepDetecting = true;
      this.aiStepDetectingDone = false;
      this.aiStepSeverity = false;
      this.aiStepSeverityDone = false;
      this.aiStepETA = false;
      this.aiStepETADone = false;
      this.aiStepDuplicate = false;
      this.aiStepDuplicateDone = false;
      this.aiTimeoutMessage = '';

      // Start fallback timeout timer (exactly 8 seconds)
      this.aiTimeoutTimer = setTimeout(() => {
        if (!this.aiStepDuplicateDone) {
          this.aiTimeoutMessage = this.translationService.t('AI_TIMEOUT_WARN');
        }
      }, 8000);

      let fileToUpload = file;
      try {
        fileToUpload = await this.imageCompressionService.compress(file, 1280, 1024, 0.72);
      } catch (err) {
        console.error('Image compression failed, using original file:', err);
      }
      this.newComplaintData.file = fileToUpload;

      // 1. Post to initiate job
      const formData = new FormData();
      formData.append('image', fileToUpload);
      formData.append('location', this.newComplaintData.address);
      formData.append('lat', String(this.capturedCoordinates.lat));
      formData.append('lng', String(this.capturedCoordinates.lng));

      this.apiService.postForm<{ success: boolean; analysisId: string; tempImagePath: string }>('/ai/analyze', formData).subscribe({
        next: (res) => {
          const analysisId = res.analysisId;
          this.tempImagePath = res.tempImagePath;
          if (this.aiProgress < 20) this.aiProgress = 20;

          // 2. Connect to SSE stream
          this.aiStreamSub = this.aiService.analyzeImageStream(analysisId).subscribe({
            next: (event: any) => {
              this.aiProgress = event.progress || this.aiProgress;
              
              if (event.status === 'detecting_issue') {
                this.aiStepDetecting = false;
                this.aiStepDetectingDone = true;
                this.aiStepSeverity = true;
                
                this.aiPredictedCategory = event.category || '';
                this.aiPredictedDepartment = event.department || '';

                if (event.low_confidence) {
                  this.newComplaintData.title = '';
                  this.newComplaintData.description = 'Unable to confidently identify issue type. Please select the category and fill details manually.';
                  this.newComplaintData.department = '';
                  this.aiPredictedCategory = '';
                  this.aiPredictedDepartment = '';
                } else {
                  this.newComplaintData.title = event.title || this.newComplaintData.title;
                  this.newComplaintData.description = event.description || this.newComplaintData.description;
                  
                  const matchedDept = this.departmentsList.find(d => d.name.toLowerCase() === (event.department || '').toLowerCase());
                  if (matchedDept) {
                    this.newComplaintData.department = matchedDept.id;
                  }
                }
              }
              
              if (event.status === 'estimating_severity') {
                this.aiStepSeverity = false;
                this.aiStepSeverityDone = true;
                this.aiStepETA = true;
                
                this.newComplaintData.priority = event.priority || 'medium';
                this.newComplaintData.severityScore = event.severityScore || 50;
                this.newComplaintData.severityReason = event.reasons || [];
              }

              if (event.status === 'generating_recommendations') {
                this.aiStepETA = false;
                this.aiStepETADone = true;
                this.aiStepDuplicate = true;

                this.newComplaintData.estimatedDays = event.estimatedDays || 3;
                this.newComplaintData.delayRisk = event.delayRisk || 'Low';
              }

              if (event.status === 'duplicate_checked') {
                this.aiStepDuplicate = false;
                this.aiStepDuplicateDone = true;
                this.newComplaintData.duplicateDetected = !!event.duplicateDetected;
              }

              if (event.status === 'completed') {
                if (this.aiTimeoutTimer) clearTimeout(this.aiTimeoutTimer);
                this.aiStepDetecting = false;
                this.aiStepDetectingDone = true;
                this.aiStepSeverity = false;
                this.aiStepSeverityDone = true;
                this.aiStepETA = false;
                this.aiStepETADone = true;
                this.aiStepDuplicate = false;
                this.aiStepDuplicateDone = true;
                
                if (event.low_confidence) {
                  this.newComplaintData.title = '';
                  this.newComplaintData.description = 'Unable to confidently identify issue type. Please select the category and fill details manually.';
                  this.newComplaintData.department = '';
                  this.aiPredictedCategory = '';
                  this.aiPredictedDepartment = '';
                } else {
                  this.newComplaintData.title = event.title || this.newComplaintData.title;
                  this.newComplaintData.description = event.description || this.newComplaintData.description;
                  const matchedDept = this.departmentsList.find(d => d.name.toLowerCase() === (event.department || '').toLowerCase());
                  if (matchedDept) {
                    this.newComplaintData.department = matchedDept.id;
                  }
                  this.newComplaintData.priority = event.priority || this.newComplaintData.priority;
                  this.newComplaintData.severityScore = event.severityScore || this.newComplaintData.severityScore;
                  this.newComplaintData.severityReason = event.reasons || this.newComplaintData.severityReason;
                  this.aiPredictedCategory = event.category || '';
                  this.aiPredictedDepartment = event.department || '';
                }
              }
            },
            error: (err) => {
              console.error('AI streaming connection failed:', err);
              if (this.aiTimeoutTimer) clearTimeout(this.aiTimeoutTimer);
              this.aiTimeoutMessage = 'AI suggestions offline/taking longer than expected.';
            }
          });
        },
        error: (err) => {
          console.error('Failed to initialize AI analysis job:', err);
          if (this.aiTimeoutTimer) clearTimeout(this.aiTimeoutTimer);
          this.aiTimeoutMessage = 'Failed to initiate AI suggestions.';
        }
      });
    }
  }

  submitComplaint() {
    this.loadingSubmit = true;

    // Check if offline, save locally
    if (typeof window !== 'undefined' && !navigator.onLine) {
      this.saveOfflineDraft();
      return;
    }

    // Call AI feedback loop if category/department was corrected by citizen
    const selectedDeptObj = this.departmentsList.find(d => d.id === this.newComplaintData.department);
    const selectedDeptName = selectedDeptObj ? selectedDeptObj.name : '';

    if (this.aiPredictedCategory && this.aiPredictedDepartment && selectedDeptName &&
        selectedDeptName.toLowerCase() !== this.aiPredictedDepartment.toLowerCase()) {
      const feedbackPayload = {
        originalPrediction: this.aiPredictedCategory,
        correctedCategory: selectedDeptName,
        imagePath: this.tempImagePath
      };

      this.apiService.post('/ai/feedback', feedbackPayload).subscribe({
        next: (fbRes) => console.log('AI feedback loop: correction successfully logged', fbRes),
        error: (fbErr) => console.error('AI feedback loop: failed to log correction', fbErr)
      });
    }

    const formData = new FormData();
    formData.append('title', this.newComplaintData.title);
    formData.append('description', this.newComplaintData.description);
    formData.append('department', this.newComplaintData.department);
    formData.append('priority', this.newComplaintData.priority);
    formData.append('severityScore', String(this.newComplaintData.severityScore));
    formData.append('severityReason', JSON.stringify(this.newComplaintData.severityReason));
    formData.append('aiIssue', this.newComplaintData.title);
    
    const locationObj = {
      address: this.newComplaintData.address,
      ward: this.newComplaintData.ward,
      latitude: this.capturedCoordinates.lat,
      longitude: this.capturedCoordinates.lng,
      landmark: this.nearbyLandmark
    };
    formData.append('location', JSON.stringify(locationObj));

    if (this.newComplaintData.file) {
      formData.append('image', this.newComplaintData.file);
    }

    this.complaintsService.createComplaint(formData).subscribe({
      next: () => {
        this.loadComplaints();
        this.closeNewComplaintModal();
        this.loadingSubmit = false;
      },
      error: () => {
        this.loadingSubmit = false;
      }
    });
  }

  // --- Geolocation & Geofencing ---
  captureLocation() {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    this.gpsCapturing = true;

    // Load cached coordinates if available
    const cachedLat = localStorage.getItem('cached_lat');
    const cachedLng = localStorage.getItem('cached_lng');
    const cachedLandmark = localStorage.getItem('cached_landmark');
    if (cachedLat && cachedLng) {
      this.capturedCoordinates.lat = parseFloat(cachedLat);
      this.capturedCoordinates.lng = parseFloat(cachedLng);
      this.gpsCaptured = true;
      if (cachedLandmark) {
        this.nearbyLandmark = cachedLandmark;
      }
    }

    const cacheCoords = (lat: number, lng: number, landmark: string) => {
      localStorage.setItem('cached_lat', String(lat));
      localStorage.setItem('cached_lng', String(lng));
      localStorage.setItem('cached_landmark', landmark);
    };

    // Step 1: Low accuracy quick capture (timeout: 2000, enableHighAccuracy: false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.capturedCoordinates.lat = pos.coords.latitude;
        this.capturedCoordinates.lng = pos.coords.longitude;
        this.gpsCaptured = true;
        this.gpsCapturing = false;
        this.nearbyLandmark = this.detectNearbyLandmark(pos.coords.latitude, pos.coords.longitude);
        cacheCoords(pos.coords.latitude, pos.coords.longitude, this.nearbyLandmark);

        // Start background high accuracy refinement
        this.refineLocationBackground((lat, lng, landmark) => { cacheCoords(lat, lng, landmark); });
      },
      (err) => {
        // Fallback: If low-accuracy fails, attempt high-accuracy immediately in background
        this.refineLocationBackground(
          (lat, lng, landmark) => {
            this.capturedCoordinates.lat = lat;
            this.capturedCoordinates.lng = lng;
            this.gpsCaptured = true;
            this.nearbyLandmark = landmark;
            cacheCoords(lat, lng, landmark);
          },
          () => {
            this.gpsCapturing = false;
            if (!this.gpsCaptured) {
              alert('Failed to obtain GPS coordinates. Using standard municipal grid coordinates.');
            }
          }
        );
      },
      { timeout: 2000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  }

  refineLocationBackground(onSuccess: (lat: number, lng: number, landmark: string) => void, onError?: () => void) {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const landmark = this.detectNearbyLandmark(pos.coords.latitude, pos.coords.longitude);
        onSuccess(pos.coords.latitude, pos.coords.longitude, landmark);
        this.gpsCapturing = false;
      },
      (err) => {
        if (onError) onError();
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }

  detectNearbyLandmark(lat: number, lng: number): string {
    const val = Math.abs(lat + lng) % 1;
    if (val < 0.25) return 'Municipal Public School (140m)';
    if (val < 0.5) return 'District Civil Hospital (320m)';
    if (val < 0.75) return 'Central Bus Stand & Metro (250m)';
    return 'Vikas Market Complex (180m)';
  }

  // --- Voice Input System (Web Speech API) ---
  toggleVoiceInput() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser.');
      return;
    }

    if (this.voiceRecognizing) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = this.voiceLanguage;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    this.voiceRecognizing = true;

    recognition.onstart = () => {
      console.log('Voice transcription active...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (this.newComplaintData.description) {
        this.newComplaintData.description += ' ' + transcript;
      } else {
        this.newComplaintData.description = transcript;
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error: ', event.error);
      this.voiceRecognizing = false;
    };

    recognition.onend = () => {
      this.voiceRecognizing = false;
      console.log('Voice transcription ended.');
    };

    recognition.start();
  }

  // --- Offline/Low Internet Mode Caching & Sync ---
  setupOfflineListeners() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      console.log('Node online. Synchronizing cached grievances...');
      this.syncOfflineDrafts();
    });

    this.checkOfflineDrafts();
    if (navigator.onLine) {
      this.syncOfflineDrafts();
    }
  }

  checkOfflineDrafts() {
    if (typeof window === 'undefined') return;
    const draftsStr = localStorage.getItem('offline_complaints');
    if (draftsStr) {
      try {
        const drafts = JSON.parse(draftsStr);
        this.offlineDraftsCount = Array.isArray(drafts) ? drafts.length : 0;
      } catch (e) {
        this.offlineDraftsCount = 0;
      }
    } else {
      this.offlineDraftsCount = 0;
    }
  }

  async saveOfflineDraft() {
    let fileBase64 = '';
    if (this.newComplaintData.file) {
      try {
        fileBase64 = await this.fileToBase64(this.newComplaintData.file);
      } catch (e) {
        console.error('Failed to convert file to base64', e);
      }
    }

    const draft = {
      title: this.newComplaintData.title,
      description: this.newComplaintData.description,
      department: this.newComplaintData.department,
      address: this.newComplaintData.address,
      ward: this.newComplaintData.ward,
      lat: this.capturedCoordinates.lat,
      lng: this.capturedCoordinates.lng,
      landmark: this.nearbyLandmark,
      fileBase64,
      fileName: this.newComplaintData.file ? this.newComplaintData.file.name : 'offline_image.jpg',
      createdAt: new Date().toISOString()
    };

    const draftsStr = localStorage.getItem('offline_complaints') || '[]';
    const drafts = JSON.parse(draftsStr);
    drafts.push(draft);
    localStorage.setItem('offline_complaints', JSON.stringify(drafts));

    this.checkOfflineDrafts();
    this.closeNewComplaintModal();
    this.loadingSubmit = false;
    alert('Node Offline. Grievance saved locally as draft. It will automatically upload once network is restored.');
  }

  syncOfflineDrafts() {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const draftsStr = localStorage.getItem('offline_complaints');
    if (!draftsStr) return;

    try {
      const drafts = JSON.parse(draftsStr);
      if (Array.isArray(drafts) && drafts.length > 0) {
        const draft = drafts[0];
        const formData = new FormData();
        formData.append('title', draft.title);
        formData.append('description', draft.description);
        formData.append('department', draft.department);
        
        const locationObj = {
          address: draft.address,
          ward: draft.ward,
          latitude: draft.lat,
          longitude: draft.lng,
          landmark: draft.landmark
        };
        formData.append('location', JSON.stringify(locationObj));

        if (draft.fileBase64) {
          const file = this.base64ToFile(draft.fileBase64, draft.fileName);
          formData.append('image', file);
        }

        this.complaintsService.createComplaint(formData).subscribe({
          next: () => {
            console.log('Offline draft synced successfully!');
            drafts.shift();
            localStorage.setItem('offline_complaints', JSON.stringify(drafts));
            this.checkOfflineDrafts();
            this.loadComplaints();
            this.syncOfflineDrafts(); // recursive call for remaining
          },
          error: (err) => {
            console.error('Failed to sync offline draft, keeping in queue', err);
          }
        });
      }
    } catch (e) {
      console.error('Error during offline sync parsing', e);
    }
  }

  // File serialization helpers
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  // --- Assign Officer Operation ---
  assignOfficer() {
    if (!this.selectedComplaint || !this.assignedOfficerId) return;

    this.complaintsService.assignOfficer(this.selectedComplaint.id, this.assignedOfficerId).subscribe({
      next: () => {
        this.loadComplaints();
      }
    });
  }

  // --- Escalate Operation ---
  escalateComplaint() {
    if (!this.selectedComplaint || !this.assignedSupervisorId) return;

    this.complaintsService.escalateComplaint(this.selectedComplaint.id, this.assignedSupervisorId, this.escalationNote).subscribe({
      next: () => {
        this.loadComplaints();
      }
    });
  }

  // --- Resolution Proof Operations (Officer Upload afterImage) ---
  onResolutionFileSelected(event: any) {
    this.resolutionFile = event.target.files[0];
  }

  uploadResolution() {
    if (!this.selectedComplaint || !this.resolutionFile) return;

    this.loadingUpload = true;
    const formData = new FormData();
    formData.append('afterImage', this.resolutionFile);
    formData.append('status', 'resolved');

    this.complaintsService.updateComplaint(this.selectedComplaint.id, formData).subscribe({
      next: (res) => {
        this.loadComplaints();
        this.loadingUpload = false;
        this.resolutionFile = null;
      },
      error: () => {
        this.loadingUpload = false;
      }
    });
  }

  // --- Citizen Feedback submission ---
  submitFeedback() {
    if (!this.selectedComplaint) return;
    
    const user = this.authService.currentUser();
    this.selectedComplaint.logs?.push({
      action: 'Citizen Feedback Registered',
      performedBy: user?.name || 'Citizen',
      timestamp: new Date().toISOString(),
      note: `Rating: ${this.feedbackRating}/5 - Feedback: "${this.feedbackComment}"`
    });
    
    this.feedbackComment = '';
    alert('Resolution feedback registered on municipal grid ledger.');
  }

  departmentName(dept: Department | UserDepartmentRef | string | undefined): string {
    if (!dept) {
      return 'General Operations';
    }
    if (typeof dept === 'string') {
      const match = this.departmentsList.find((item) => item.id === dept || item.name.toLowerCase() === dept.toLowerCase());
      return match?.name ?? dept;
    }
    return dept && typeof dept !== 'string' ? (dept.name ?? 'General Operations') : 'General Operations';
  }
}
