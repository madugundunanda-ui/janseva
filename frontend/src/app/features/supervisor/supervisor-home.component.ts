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
    <div class="space-y-6 font-sans">
      
      <div class="card-surface p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Ward Supervisor Jurisdiction Active
          </div>
          
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Supervisor Overview: {{ authService.currentUser()?.name }}
          </h1>

          <p class="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Monitor ward workload, assign unallocated grievances to field officers, and prevent SLA bottleneck escalations.
          </p>
        </div>

        <button [routerLink]="['/dashboard/supervisor/complaints']" class="btn-primary py-3 px-6 text-sm font-semibold shrink-0">
          Manage Ward Workload
        </button>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Department Load</span>
          <div class="text-2xl font-bold font-mono text-slate-900">{{ deptComplaints.length }}</div>
          <span class="text-[11px] font-medium text-slate-500 block">Total Active Tickets</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Unassigned</span>
          <div class="text-2xl font-bold font-mono text-amber-600">{{ unassignedCount }}</div>
          <span class="text-[11px] font-medium text-amber-600 block">Requires Officer Dispatch</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Escalations</span>
          <div class="text-2xl font-bold font-mono text-rose-600">{{ escalatedCount }}</div>
          <span class="text-[11px] font-medium text-rose-600 block">SLA Overdue Warning</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Resolved Cases</span>
          <div class="text-2xl font-bold font-mono text-emerald-600">{{ resolvedCount }}</div>
          <span class="text-[11px] font-medium text-emerald-600 block">Verified Closures</span>
        </div>
      </div>

      <div class="card-surface space-y-4">
        <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Unassigned Grievance Queue</h3>
          <a [routerLink]="['/dashboard/supervisor/complaints']" class="text-xs font-semibold text-indigo-600 hover:underline">Assign All</a>
        </div>

        <div class="divide-y divide-slate-100">
          @for (complaint of unassignedComplaints; track complaint.id) {
            <div class="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div class="space-y-1">
                <div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span class="font-mono text-slate-700 font-semibold">{{ complaint.id }}</span>
                  <span>•</span>
                  <span>Ward {{ complaint.location.ward || '12' }}</span>
                  <span>•</span>
                  <span class="font-semibold text-amber-600">AI Severity: {{ complaint.severityScore ?? 75 }}/100</span>
                </div>
                <h4 class="text-sm font-semibold text-slate-900">{{ complaint.title }}</h4>
                <p class="text-xs text-slate-600 line-clamp-1">{{ complaint.description }}</p>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <span class="badge-status badge-pending">Unassigned</span>
                <button [routerLink]="['/dashboard/supervisor/complaints']" class="btn-primary text-xs py-1 px-3">
                  Assign Officer
                </button>
              </div>
            </div>
          } @empty {
            <div class="p-12 text-center text-xs font-medium text-slate-500">
              No unassigned tickets pending officer dispatch.
            </div>
          }
        </div>
      </div>
    </div>
  `
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
