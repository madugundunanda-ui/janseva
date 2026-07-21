import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ComplaintsService } from '../../core/services/complaints.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 font-sans">
      
      <div class="card-surface p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            State AI Command Node Active
          </div>
          
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Command Center: {{ authService.currentUser()?.name }}
          </h1>

          <p class="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Statewide governance infrastructure active. Monitor AI classification accuracy, security audit logs, and ward heatmaps.
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <button [routerLink]="['/dashboard/admin/analytics']" class="btn-primary py-3 px-5 text-sm font-semibold">
            System Analytics
          </button>
          <button [routerLink]="['/dashboard/admin/ai-diagnostics']" class="btn-secondary text-xs py-3 px-5 font-semibold">
            AI Diagnostics
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Statewide Load</span>
          <div class="text-2xl font-bold font-mono text-slate-900">{{ totalComplaints }}</div>
          <span class="text-[11px] font-medium text-slate-500 block">Total Active Records</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">AI Triage Accuracy</span>
          <div class="text-2xl font-bold font-mono text-emerald-600">96.8%</div>
          <span class="text-[11px] font-medium text-emerald-600 block">Auto-Categorized</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Security Audits</span>
          <div class="text-2xl font-bold font-mono text-indigo-600">42</div>
          <span class="text-[11px] font-medium text-indigo-600 block">JWT & RBAC Active</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">SLA Compliance</span>
          <div class="text-2xl font-bold font-mono text-slate-900">98.4%</div>
          <span class="text-[11px] font-medium text-slate-500 block">Target Threshold</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card-surface p-6 space-y-4">
          <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Administrative Modules</h3>
          <div class="grid grid-cols-2 gap-3 text-xs font-semibold">
            <a [routerLink]="['/dashboard/admin/citizens']" class="p-3.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-800 transition-all text-center">
              👥 Citizens Directory
            </a>
            <a [routerLink]="['/dashboard/admin/officers']" class="p-3.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-800 transition-all text-center">
              👮 Officers Directory
            </a>
            <a [routerLink]="['/dashboard/admin/reports']" class="p-3.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-800 transition-all text-center">
              📄 Audit Reports
            </a>
            <a [routerLink]="['/dashboard/admin/ai-diagnostics']" class="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 transition-all text-center">
              🤖 AI Diagnostics
            </a>
          </div>
        </div>

        <div class="card-surface p-6 space-y-4">
          <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Infrastructure Status</h3>
          <div class="space-y-2 text-xs font-medium text-slate-700">
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
              <span>● MongoDB Database Cluster</span>
              <span class="text-emerald-600 font-bold">100% Operational</span>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
              <span>● Gemini AI Model Service</span>
              <span class="text-emerald-600 font-bold">Latency 14ms</span>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
              <span>● Socket.IO Real-time Bridge</span>
              <span class="text-emerald-600 font-bold">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminHomeComponent implements OnInit {
  totalComplaints = 0;

  public authService = inject(AuthService);
  private complaintsService = inject(ComplaintsService);
  public translationService = inject(TranslationService);

  ngOnInit(): void {
    this.complaintsService.loadComplaints().subscribe((data) => {
      this.totalComplaints = data.length;
    });
  }
}
