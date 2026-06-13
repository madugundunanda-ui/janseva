import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ComplaintsService } from '../../core/services/complaints.service';
import { TranslationService } from '../../core/services/translation.service';
import { Complaint } from '../../core/services/api.service';
import { AnalyticsService, DepartmentPerformance, SlaMetric, GovernanceInsight, OfficerPerformance } from '../../core/services/analytics.service';

@Component({
  selector: 'app-supervisor',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Supervisor Hero Banner -->
      <div class="glass-panel p-6 rounded-2xl border border-var flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden bg-gradient-to-r from-amber-950/5 via-transparent to-transparent">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-950/10 font-mono text-[9px] text-amber-400 uppercase tracking-widest">
            <span>📡 GOVERNANCE CONTROL NODE ACTIVE // JURISDICTION DEPT SUPERVISOR ACTIVE</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-primary-var uppercase font-mono">
            GOVERNANCE CONSOLE // <span class="text-glow">{{ authService.currentUser()?.name }}</span>
          </h2>
          <p class="font-mono text-[10px] text-muted-var uppercase max-w-xl">
            This workspace provides high-level jurisdiction oversight. Dispatch unassigned tickets, manage officer workloads, monitor SLA risk indicators, and audit resolution proofs.
          </p>
        </div>

        <button [routerLink]="['/dashboard/complaints']" class="px-5 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer">
          Dispatch Officer Panel
        </button>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Metric: Total Department Load -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Total Department Load</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">{{ deptComplaints.length }}</div>
          <div class="font-mono text-[8px] text-[#6AA9FF] mt-1 uppercase tracking-wide">ACTIVE TICKETS IN DEPT</div>
        </div>

        <!-- Metric: Unassigned -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Unassigned Tickets</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-amber-400">{{ unassignedCount }}</div>
          <div class="font-mono text-[8px] text-amber-400 mt-1 uppercase tracking-wide">NEEDS WARD OFFICER</div>
        </div>

        <!-- Metric: SLA Risks / Escalated -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Escalated SLA Risks</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-red-400">{{ escalatedCount }}</div>
          <div class="font-mono text-[8px] text-red-400 mt-1 uppercase tracking-wide">HIGH ESCALATION PROBABILITY</div>
        </div>

        <!-- Metric: Resolved -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Resolved Cleared</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">{{ resolvedCount }}</div>
          <div class="font-mono text-[8px] text-emerald-400 mt-1 uppercase tracking-wide">SUCCESS RESOLVED</div>
        </div>
      </div>

      <!-- Supervisor Bottleneck & Alert Engine -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Bottleneck Detection Panel -->
        <div class="glass-panel p-5 rounded-xl border border-var border-l-4 border-l-red-500 bg-red-950/5">
          <h3 class="font-mono text-[10px] tracking-widest text-red-400 uppercase font-bold border-b border-var pb-2 mb-3 flex items-center gap-2">
            ⚠️ Department Bottlenecks Detected
          </h3>
          <div class="space-y-3 font-mono text-[10px] uppercase">
            <div class="flex justify-between items-center bg-white/5 p-2 rounded">
              <span class="text-primary-var">Ward 12 Grid:</span>
              <span class="text-amber-400 font-bold">23 unresolved complaints</span>
            </div>
            <div class="flex justify-between items-center bg-white/5 p-2 rounded">
              <span class="text-primary-var">SLA Risk Index:</span>
              <span class="text-red-400 font-bold">14 High-Risk Tickets</span>
            </div>
            <div class="flex justify-between items-center bg-white/5 p-2 rounded">
              <span class="text-primary-var">Workload Trend:</span>
              <span class="text-amber-400 font-bold">Volume increased 18%</span>
            </div>
          </div>
        </div>

        <!-- SLA Breach Forecast Panel -->
        <div class="glass-panel p-5 rounded-xl border border-var border-l-4 border-l-amber-500 bg-amber-950/5">
          <h3 class="font-mono text-[10px] tracking-widest text-amber-400 uppercase font-bold border-b border-var pb-2 mb-3">
            SLA Breach Forecast (Next 48H)
          </h3>
          <div class="flex items-center justify-center gap-8 h-[100px]">
            <div class="text-center">
              <div class="text-3xl font-bold text-red-400 font-mono">7</div>
              <div class="text-[8px] text-muted-var font-mono uppercase tracking-widest">Critical Breaches</div>
            </div>
            <div class="w-px h-12 bg-white/10"></div>
            <div class="text-center">
              <div class="text-3xl font-bold text-amber-400 font-mono">12</div>
              <div class="text-[8px] text-muted-var font-mono uppercase tracking-widest">At-Risk Tickets</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Supervisor Intelligence Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Department Performance -->
        <div class="glass-panel p-5 rounded-xl border border-var flex flex-col justify-between bg-amber-950/5">
          <div>
            <div class="font-mono text-[9px] text-amber-400 uppercase tracking-widest mb-4">Department AI Score</div>
            <div class="text-4xl font-bold font-mono tracking-tight text-white">{{ deptPerformance?.metrics?.performanceScore || '--' }}</div>
            <div class="font-mono text-[9px] mt-2 uppercase text-muted-var">Based on SLA & Backlog</div>
          </div>
          <div class="mt-4 pt-4 border-t border-var space-y-2">
            <div class="flex justify-between font-mono text-[9px] uppercase">
              <span class="text-muted-var">Total Assigned:</span>
              <span class="text-primary-var">{{ deptPerformance?.metrics?.totalAssigned || 0 }}</span>
            </div>
            <div class="flex justify-between font-mono text-[9px] uppercase">
              <span class="text-muted-var">Avg Resolution:</span>
              <span class="text-primary-var">{{ deptPerformance?.metrics?.averageResolutionTimeHours || 0 | number:'1.0-1' }} hrs</span>
            </div>
          </div>
        </div>

        <!-- Top Officers Ranking -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-4">Officer Rankings</div>
          @if(topOfficers.length > 0) {
            <div class="space-y-3">
              @for (officer of topOfficers; track officer._id; let i = $index) {
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-[9px] font-mono text-muted-var">#{{ i + 1 }}</span>
                    <span class="font-mono text-[10px] uppercase text-primary-var">{{ officer.officerName }}</span>
                  </div>
                  <span class="text-[10px] font-mono font-bold text-emerald-400">{{ officer.performanceScore }}</span>
                </div>
              }
            </div>
          } @else {
            <p class="font-mono text-xs text-muted-var uppercase text-center mt-4">No ranked officers.</p>
          }
        </div>

        <!-- Governance Insights Feed -->
        <div class="glass-panel p-5 rounded-xl border border-var overflow-hidden flex flex-col">
          <div class="font-mono text-[9px] text-amber-400 uppercase tracking-widest mb-4">Jurisdiction Insights</div>
          <div class="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            @for (update of govInsights; track update._id) {
              <div class="p-3 bg-white/2 rounded-lg border border-white/5 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[9px] text-amber-400 uppercase">{{ update.title }}</span>
                  <span class="text-[8px] font-mono text-muted-var">{{ update.severity }}</span>
                </div>
                <p class="font-mono text-[10px] text-primary-var leading-snug">{{ update.description }}</p>
                @if(update.actionableRecommendation) {
                  <p class="font-mono text-[8px] text-emerald-400/80 mt-1 uppercase tracking-wide">Action: {{ update.actionableRecommendation }}</p>
                }
              </div>
            } @empty {
              <p class="font-mono text-xs text-muted-var uppercase text-center mt-4">No recent insights.</p>
            }
          </div>
        </div>

      </div>

      <!-- Action items: Unassigned tickets queue -->
      <div class="glass-panel rounded-2xl border border-var overflow-hidden">
        <div class="p-5 border-b border-var flex items-center justify-between">
          <h3 class="font-mono text-[10px] tracking-widest text-amber-400 uppercase font-bold">Unassigned Tickets Waiting Dispatch</h3>
          <span class="font-mono text-[9px] text-muted-var uppercase">Immediate Dispatch Action Required</span>
        </div>

        <div class="divide-y divide-white/5">
          @for (complaint of unassignedComplaints; track complaint.id) {
            <div class="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/2 transition-colors">
              <div class="space-y-1">
                <div class="flex items-center gap-3 font-mono text-[9px] uppercase">
                  <span class="text-amber-400">{{ complaint.id }}</span>
                  <span class="text-muted-var">• WARD {{ complaint.location.ward }}</span>
                  <span class="text-red-400 font-bold">• AI Severity: {{ complaint.severityScore ?? 75 }}/100</span>
                </div>
                <h4 class="text-sm font-semibold text-primary-var uppercase">{{ complaint.title }}</h4>
                <p class="text-xs text-muted-var line-clamp-1 font-mono uppercase">{{ complaint.description }}</p>
              </div>

              <div class="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
                <span class="px-2 py-0.5 rounded text-[8px] font-mono border border-purple-500/30 text-purple-400 bg-purple-950/15 uppercase tracking-wider">
                  Submitted
                </span>
                
                <button [routerLink]="['/dashboard/complaints']" class="px-3 py-1.5 rounded bg-white text-black text-[9px] font-mono uppercase font-bold cursor-pointer">
                  Assign Officer
                </button>
              </div>
            </div>
          } @empty {
            <div class="p-12 text-center">
              <p class="font-mono text-xs text-muted-var uppercase">All incoming departmental grievances are assigned.</p>
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
export class SupervisorComponent implements OnInit {
  deptComplaints: Complaint[] = [];
  unassignedComplaints: Complaint[] = [];
  unassignedCount = 0;
  escalatedCount = 0;
  resolvedCount = 0;
  
  deptPerformance: DepartmentPerformance | null = null;
  topOfficers: OfficerPerformance[] = [];
  govInsights: GovernanceInsight[] = [];

  constructor(
    public authService: AuthService,
    private complaintsService: ComplaintsService,
    public translationService: TranslationService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    const userDeptId = this.getDepartmentId();

    if (user) {
      this.complaintsService.loadComplaints().subscribe((data) => {
        // Filter complaints belonging to the supervisor's department
        this.deptComplaints = data.filter(c => {
          const compDeptId = typeof c.department === 'object' && c.department !== null ? (c.department as any).id || (c.department as any)._id : c.department;
          return compDeptId === userDeptId;
        });

        this.unassignedComplaints = this.deptComplaints.filter(c => c.status === 'submitted');
        this.unassignedCount = this.unassignedComplaints.length;
        this.escalatedCount = this.deptComplaints.filter(c => c.status === 'escalated').length;
        this.resolvedCount = this.deptComplaints.filter(c => c.status === 'resolved').length;
      });

      this.analyticsService.getDepartments().subscribe(res => {
        // Find this supervisor's department
        this.deptPerformance = res.departments.find(d => {
          return d.departmentName === (user.department as any)?.name;
        }) || res.departments[0] || null;
      });

      this.analyticsService.getOfficers().subscribe(res => {
        this.topOfficers = res.officers
          .filter(o => o.departmentName === (user.department as any)?.name)
          .sort((a, b) => b.performanceScore - a.performanceScore)
          .slice(0, 5);
      });

      this.analyticsService.getGovernanceInsights().subscribe(res => {
        // Filter insights relevant to this department if possible, or just show global for now
        this.govInsights = res.insights.slice(0, 5);
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
