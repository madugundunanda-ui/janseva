import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ComplaintsService } from '../../core/services/complaints.service';
import { TranslationService } from '../../core/services/translation.service';
import { Complaint } from '../../core/services/api.service';

@Component({
  selector: 'app-officer',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Officer Hero Banner -->
      <div class="glass-panel p-6 rounded-2xl border border-var flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden bg-gradient-to-r from-blue-950/5 via-transparent to-transparent">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-blue-500/20 bg-blue-950/10 font-mono text-[9px] text-[#6AA9FF] uppercase tracking-widest">
            <span>🛡️ SECURE OPERATIONS NODE ACTIVE // AUTHORIZED GOVERNMENT PERSONNEL ONLY</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-primary-var uppercase font-mono">
            OPERATIONS CONSOLE // <span class="text-glow">{{ authService.currentUser()?.name }}</span>
          </h2>
          <p class="font-mono text-[10px] text-muted-var uppercase max-w-xl">
            You are logged into the government service node. This interface is configured for active grievance dispatch, visual proof audit validation, and SLA resolution tracking.
          </p>
        </div>

        <button [routerLink]="['/dashboard/complaints']" class="px-5 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.2)] cursor-pointer">
          Resolve Tickets Queue
        </button>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Metric: Assigned/Active -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">My Active Queue</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">{{ pendingCount }}</div>
          <div class="font-mono text-[8px] text-amber-500 mt-1 uppercase tracking-wide">PENDING SLA RESOLUTION</div>
        </div>

        <!-- Metric: Resolved -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Resolved By Me</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">{{ resolvedCount }}</div>
          <div class="font-mono text-[8px] text-emerald-400 mt-1 uppercase tracking-wide">VERIFIED CLOSED</div>
        </div>

        <!-- Metric: Priority Count -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Critical Priority</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-red-400">{{ criticalCount }}</div>
          <div class="font-mono text-[8px] text-red-400 mt-1 uppercase tracking-wide">IMMEDIATE ACTION REQUIRED</div>
        </div>

        <!-- Metric: Department info -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Assigned Department</div>
          <div class="text-base font-bold font-mono tracking-tight text-primary-var truncate mt-1">
            {{ getDepartmentName() }}
          </div>
          <div class="font-mono text-[8px] text-muted-var mt-1.5 uppercase tracking-wide">ID: {{ authService.currentUser()?.employeeId || 'OFF-9382' }}</div>
        </div>
      </div>

      <!-- Grievance Stack Assigned -->
      <div class="glass-panel rounded-2xl border border-var overflow-hidden">
        <div class="p-5 border-b border-var flex items-center justify-between">
          <h3 class="font-mono text-[10px] tracking-widest text-[#6AA9FF] uppercase font-bold">Assigned Grievance Queue</h3>
          <span class="font-mono text-[9px] text-muted-var uppercase">Operational Tasks</span>
        </div>

        <div class="divide-y divide-white/5">
          @for (complaint of myComplaints; track complaint.id) {
            <div class="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/2 transition-colors">
              <div class="space-y-1">
                <div class="flex items-center gap-3 font-mono text-[9px] uppercase">
                  <span class="text-[#6AA9FF]">{{ complaint.id }}</span>
                  <span class="text-muted-var">• WARD {{ complaint.location.ward }}</span>
                  <span class="px-1.5 py-0.5 rounded text-[8px] border" [ngClass]="{
                    'border-red-500/30 text-red-400 bg-red-950/15': complaint.priority === 'critical',
                    'border-amber-500/30 text-amber-400 bg-amber-950/15': complaint.priority === 'high',
                    'border-blue-500/30 text-blue-400 bg-blue-950/15': complaint.priority === 'medium',
                    'border-white/10 text-muted-var bg-white/5': complaint.priority === 'low'
                  }">{{ complaint.priority }}</span>
                </div>
                <h4 class="text-sm font-semibold text-primary-var uppercase">{{ complaint.title }}</h4>
                <p class="text-xs text-muted-var line-clamp-1 font-mono uppercase">{{ complaint.description }}</p>
              </div>

              <div class="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
                <span class="px-2 py-0.5 rounded text-[8px] font-mono border uppercase tracking-wider" [ngClass]="{
                  'border-purple-500/30 text-purple-400 bg-purple-950/15': complaint.status === 'submitted',
                  'border-blue-500/30 text-blue-400 bg-blue-950/15': complaint.status === 'assigned',
                  'border-cyan-500/30 text-cyan-400 bg-cyan-950/15': complaint.status === 'in_progress',
                  'border-emerald-500/30 text-emerald-400 bg-emerald-950/15': complaint.status === 'resolved',
                  'border-red-500/30 text-red-400 bg-red-950/15': complaint.status === 'escalated'
                }">{{ translationService.t(complaint.status.toUpperCase()) }}</span>
                
                <button [routerLink]="['/dashboard/complaints']" class="px-3 py-1.5 rounded border border-var hover:border-[#6AA9FF]/40 text-[9px] font-mono uppercase text-primary-var cursor-pointer">
                  Action Console
                </button>
              </div>
            </div>
          } @empty {
            <div class="p-12 text-center">
              <p class="font-mono text-xs text-muted-var uppercase">No pending grievances in your assigned queue node.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class OfficerComponent implements OnInit {
  myComplaints: Complaint[] = [];
  pendingCount = 0;
  resolvedCount = 0;
  criticalCount = 0;

  constructor(
    public authService: AuthService,
    private complaintsService: ComplaintsService,
    public translationService: TranslationService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.complaintsService.loadComplaints().subscribe((data) => {
        this.myComplaints = data.filter(c => c.assignedOfficer?.id === user.id || c.assignedOfficer?.name === user.name);
        this.pendingCount = this.myComplaints.filter(c => c.status !== 'resolved').length;
        this.resolvedCount = this.myComplaints.filter(c => c.status === 'resolved').length;
        this.criticalCount = this.myComplaints.filter(c => c.priority === 'critical' && c.status !== 'resolved').length;
      });
    }
  }

  getDepartmentName(): string {
    const user = this.authService.currentUser();
    if (!user) return 'N/A';
    
    if (typeof user.department === 'object' && user.department !== null) {
      return (user.department as any).name || 'Public Works';
    }
    
    return 'Public Works';
  }
}
