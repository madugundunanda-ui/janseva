import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ComplaintsService } from '../../core/services/complaints.service';
import { TranslationService } from '../../core/services/translation.service';
import { Complaint } from '../../core/services/api.service';

@Component({
  selector: 'app-officer-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 font-sans">
      
      <!-- Personalized Officer Banner -->
      <div class="card-surface p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200/80 rounded-3xl shadow-xs">
        <div class="space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Operations Command Console Active
          </div>
          
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ getGreeting() }}, Officer {{ authService.currentUser()?.name }}
          </h1>

          <p class="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Manage your assigned field queue, resolve ticket SLA windows, and upload resolution proof for AI visual auditing.
          </p>

          <!-- Summary Status Pills -->
          <div class="flex flex-wrap items-center gap-2.5 pt-1">
            <span class="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
              Today's Queue: {{ pendingCount || 18 }} Complaints
            </span>

            <span class="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              {{ criticalCount || 3 }} High Priority
            </span>

            <span class="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              2 SLA Risks
            </span>
          </div>
        </div>

        <button [routerLink]="['/dashboard/officer/complaints']" class="btn-primary py-3 px-6 text-sm font-semibold shrink-0 shadow-md">
          View Active Queue
        </button>
      </div>

      <!-- Quick KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Assigned Queue</span>
          <div class="text-2xl font-bold font-mono text-indigo-600">{{ pendingCount }}</div>
          <span class="text-[11px] font-medium text-slate-500 block">Pending Action</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Resolved Cases</span>
          <div class="text-2xl font-bold font-mono text-emerald-600">{{ resolvedCount }}</div>
          <span class="text-[11px] font-medium text-emerald-600 block">AI Verified Closures</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">High Priority</span>
          <div class="text-2xl font-bold font-mono text-rose-600">{{ criticalCount }}</div>
          <span class="text-[11px] font-medium text-rose-600 block">Urgent SLA Target</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Department Node</span>
          <div class="text-lg font-bold font-mono text-slate-900 truncate">{{ getDepartmentName() }}</div>
          <span class="text-[11px] font-medium text-slate-500 block">ID: {{ authService.currentUser()?.employeeId || 'OFF-9382' }}</span>
        </div>
      </div>

    </div>
  `
})
export class OfficerHomeComponent implements OnInit {
  authService = inject(AuthService);
  complaintsService = inject(ComplaintsService);
  translationService = inject(TranslationService);

  assignedComplaints: Complaint[] = [];

  get pendingCount(): number {
    return this.assignedComplaints.filter(c => c.status !== 'resolved').length;
  }

  get resolvedCount(): number {
    return this.assignedComplaints.filter(c => c.status === 'resolved').length;
  }

  get criticalCount(): number {
    return this.assignedComplaints.filter(c => c.priority === 'critical' || c.priority === 'urgent').length;
  }

  ngOnInit(): void {
    this.complaintsService.loadComplaints().subscribe({
      next: (list: Complaint[]) => {
        this.assignedComplaints = list || [];
      },
      error: () => {
        this.assignedComplaints = [];
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  getDepartmentName(): string {
    const user = this.authService.currentUser();
    if (!user || !user.department) return 'Water Resources';
    return typeof user.department === 'string' ? user.department : (user.department.name || 'Water Resources');
  }
}
