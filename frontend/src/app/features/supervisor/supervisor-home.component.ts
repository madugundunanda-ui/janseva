import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ComplaintsService } from '../../core/services/complaints.service';
import { TranslationService } from '../../core/services/translation.service';
import { Complaint } from '../../core/services/api.service';

@Component({
  selector: 'app-supervisor-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 pb-12 text-white">
      <!-- Supervisor Hero Banner -->
      <div class="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden bg-gradient-to-r from-amber-950/20 via-transparent to-transparent">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-950/10 font-mono text-[9px] text-amber-400 uppercase tracking-widest text-white">
            <span>📡 {{ translationService.t('NODE_LIVE') }} // JURISDICTION DEPT SUPERVISOR ACTIVE</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-primary-var uppercase font-mono text-white">
            {{ translationService.t('CONSOLE') }} // <span class="text-glow">{{ authService.currentUser()?.name }}</span>
          </h2>
          <p class="font-mono text-[10px] text-muted-var uppercase max-w-xl text-gray-400">
            This workspace provides high-level jurisdiction oversight. Dispatch unassigned tickets, manage officer workloads, monitor SLA risk indicators, and audit resolution proofs.
          </p>
        </div>

        <button [routerLink]="['/dashboard/supervisor/complaints']" class="px-5 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer">
          {{ translationService.t('SELECT_OFFICER') }}
        </button>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Metric: Total Department Load -->
        <div class="glass-panel p-5 rounded-xl border border-white/10 bg-black/30">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2 text-gray-400">{{ translationService.t('TRANS_TOTAL') }}</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var text-white">{{ deptComplaints.length }}</div>
          <div class="font-mono text-[8px] text-[#6AA9FF] mt-1 uppercase tracking-wide">{{ translationService.t('FILED') }}</div>
        </div>

        <!-- Metric: Unassigned -->
        <div class="glass-panel p-5 rounded-xl border border-white/10 bg-black/30">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2 text-gray-400">{{ translationService.t('TRANS_PENDING') }}</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-amber-400">{{ unassignedCount }}</div>
          <div class="font-mono text-[8px] text-amber-400 mt-1 uppercase tracking-wide">{{ translationService.t('WARD_OFFICER') }}</div>
        </div>

        <!-- Metric: SLA Risks / Escalated -->
        <div class="glass-panel p-5 rounded-xl border border-white/10 bg-black/30">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2 text-gray-400">{{ translationService.t('SLA_RISK') }}</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-red-400">{{ escalatedCount }}</div>
          <div class="font-mono text-[8px] text-red-400 mt-1 uppercase tracking-wide">{{ translationService.t('DELAY_RISK') }}</div>
        </div>

        <!-- Metric: Resolved -->
        <div class="glass-panel p-5 rounded-xl border border-white/10 bg-black/30">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2 text-gray-400">{{ translationService.t('TRANS_RESOLVED') }}</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var text-white">{{ resolvedCount }}</div>
          <div class="font-mono text-[8px] text-emerald-400 mt-1 uppercase tracking-wide">{{ translationService.t('VERIFIED_BY_AI') }}</div>
        </div>
      </div>

      <!-- Action items: Unassigned tickets queue -->
      <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden bg-black/30">
        <div class="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 class="font-mono text-[10px] tracking-widest text-amber-400 uppercase font-bold">{{ translationService.t('GRIEVANCE_STACK') }}</h3>
          <span class="font-mono text-[9px] text-muted-var uppercase text-gray-400">{{ translationService.t('EMERGENCY_REPORTING') }}</span>
        </div>

        <div class="divide-y divide-white/5">
          @for (complaint of unassignedComplaints; track complaint.id) {
            <div class="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/2 transition-colors">
              <div class="space-y-1">
                <div class="flex items-center gap-3 font-mono text-[9px] uppercase text-gray-400">
                  <span class="text-amber-400">{{ complaint.id }}</span>
                  <span>• {{ translationService.t('WARD') }} {{ complaint.location.ward }}</span>
                  <span class="text-red-400 font-bold">• {{ translationService.t('AI_SEVERITY') }}: {{ complaint.severityScore ?? 75 }}/100</span>
                </div>
                <h4 class="text-sm font-semibold text-primary-var uppercase text-white">{{ complaint.title }}</h4>
                <p class="text-xs text-muted-var line-clamp-1 font-mono uppercase text-gray-400">{{ complaint.description }}</p>
              </div>

              <div class="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
                <span class="px-2 py-0.5 rounded text-[8px] font-mono border border-purple-500/30 text-purple-400 bg-purple-950/15 uppercase tracking-wider">
                  {{ translationService.t('SUBMITTED') }}
                </span>
                
                <button [routerLink]="['/dashboard/supervisor/complaints']" class="px-3 py-1.5 rounded bg-white text-black text-[9px] font-mono uppercase font-bold cursor-pointer">
                  {{ translationService.t('WARD_OFFICER') }}
                </button>
              </div>
            </div>
          } @empty {
            <div class="p-12 text-center text-gray-500">
              <p class="font-mono text-xs uppercase">{{ translationService.t('NO_TICKETS_ALIGN') }}</p>
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
export class SupervisorHomeComponent implements OnInit {
  deptComplaints: Complaint[] = [];
  unassignedComplaints: Complaint[] = [];
  unassignedCount = 0;
  escalatedCount = 0;
  resolvedCount = 0;

  public authService = inject(AuthService);
  private complaintsService = inject(ComplaintsService);
  public translationService = inject(TranslationService);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    const userDeptId = this.getDepartmentId();

    if (user) {
      this.complaintsService.loadComplaints().subscribe((data) => {
        this.deptComplaints = data.filter(c => {
          const compDeptId = typeof c.department === 'object' && c.department !== null ? (c.department as any).id || (c.department as any)._id : c.department;
          return compDeptId === userDeptId;
        });

        this.unassignedComplaints = this.deptComplaints.filter(c => c.status === 'submitted');
        this.unassignedCount = this.unassignedComplaints.length;
        this.escalatedCount = this.deptComplaints.filter(c => c.status === 'escalated').length;
        this.resolvedCount = this.deptComplaints.filter(c => c.status === 'resolved').length;
      });
    }
  }

  getDepartmentId(): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    if (typeof user.department === 'object' && user.department !== null) {
      return (user.department as any).id || (user.department as any)._id || '';
    }
    return String(user.department || '');
  }
}
