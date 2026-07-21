import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ComplaintsService } from '../../core/services/complaints.service';
import { TranslationService } from '../../core/services/translation.service';
import { UserTourComponent } from '../../shared/components/user-tour/user-tour.component';
import { Complaint } from '../../core/services/api.service';

@Component({
  selector: 'app-citizen-home',
  standalone: true,
  imports: [CommonModule, RouterLink, UserTourComponent],
  template: `
    <!-- Optional First-Time Citizen Guided Tour Modal -->
    <app-user-tour></app-user-tour>

    <div class="space-y-6 font-sans">
      
      <!-- Personalized Welcome Banner -->
      <div class="card-surface p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200/80 rounded-3xl shadow-xs">
        <div class="space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Citizen Node Active
          </div>
          
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ getGreeting() }}, {{ authService.currentUser()?.name || 'Citizen' }}
          </h1>

          <p class="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Welcome back to JANSEVA AI Governance Platform.
          </p>

          <!-- Summary Status Pills -->
          <div class="flex flex-wrap items-center gap-2.5 pt-1">
            <span class="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              {{ activeCount }} Active Complaints
            </span>

            <span class="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              1 Government Update
            </span>

            <span class="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              No Pending Actions
            </span>
          </div>
        </div>

        <button [routerLink]="['/dashboard/citizen/complaints']" class="btn-primary py-3 px-6 text-sm font-semibold shrink-0 shadow-md">
          + File New Grievance
        </button>
      </div>

      <!-- Quick Action Panel Grid -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Quick Actions</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <a [routerLink]="['/dashboard/citizen/complaints']" class="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-indigo-500 hover:shadow-md transition-all space-y-2 group">
            <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
              📝
            </div>
            <span class="font-bold text-slate-900 text-xs block">Raise Complaint</span>
            <span class="text-[11px] text-slate-500 block">Voice/Photo intake</span>
          </a>

          <a [routerLink]="['/dashboard/citizen/complaints']" class="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-sky-500 hover:shadow-md transition-all space-y-2 group">
            <div class="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
              ⏱️
            </div>
            <span class="font-bold text-slate-900 text-xs block">Track Complaint</span>
            <span class="text-[11px] text-slate-500 block">SLA & Officer status</span>
          </a>

          <a href="/#updates" class="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-emerald-500 hover:shadow-md transition-all space-y-2 group">
            <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
              📰
            </div>
            <span class="font-bold text-slate-900 text-xs block">Government Updates</span>
            <span class="text-[11px] text-slate-500 block">Verified directives</span>
          </a>

          <a href="tel:112" class="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl shadow-xs hover:border-rose-400 hover:shadow-md transition-all space-y-2 group">
            <div class="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
              🚨
            </div>
            <span class="font-bold text-rose-900 text-xs block">Emergency 112</span>
            <span class="text-[11px] text-rose-700 block">24x7 Hotline</span>
          </a>

        </div>
      </div>

      <!-- Quick KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Filed</span>
          <div class="text-2xl font-bold font-mono text-slate-900">{{ myComplaints.length }}</div>
          <span class="text-[11px] font-medium text-indigo-600 block">Municipal Tickets</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Resolved</span>
          <div class="text-2xl font-bold font-mono text-emerald-600">{{ resolvedCount }}</div>
          <span class="text-[11px] font-medium text-emerald-600 block">AI Visual Audited</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Trust Score</span>
          <div class="text-2xl font-bold font-mono text-slate-900">{{ authService.currentUser()?.trustScore ?? 100 }}/100</div>
          <span class="text-[11px] font-medium text-indigo-600 block">Level: Verified Citizen</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Assigned Ward</span>
          <div class="text-2xl font-bold font-mono text-slate-900">Ward {{ authService.currentUser()?.ward ?? '12' }}</div>
          <span class="text-[11px] font-medium text-slate-500 block">Municipal Division</span>
        </div>
      </div>

    </div>
  `
})
export class CitizenHomeComponent implements OnInit {
  authService = inject(AuthService);
  complaintsService = inject(ComplaintsService);
  translationService = inject(TranslationService);

  myComplaints: Complaint[] = [];

  get resolvedCount(): number {
    return this.myComplaints.filter(c => c.status === 'resolved').length;
  }

  get activeCount(): number {
    return this.myComplaints.filter(c => c.status !== 'resolved').length;
  }

  ngOnInit(): void {
    this.complaintsService.loadComplaints().subscribe({
      next: (list: Complaint[]) => {
        this.myComplaints = list || [];
      },
      error: () => {
        this.myComplaints = [];
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }
}
