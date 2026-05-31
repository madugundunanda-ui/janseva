import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ComplaintsService } from '../../core/services/complaints.service';
import { TranslationService } from '../../core/services/translation.service';
import { Complaint } from '../../core/services/api.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Admin Hero Banner -->
      <div class="glass-panel p-6 rounded-2xl border border-var flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden bg-gradient-to-r from-cyan-950/10 via-transparent to-transparent shadow-[0_0_30px_rgba(6,182,212,0.1)]">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-cyan-500/20 bg-cyan-950/20 font-mono text-[9px] text-cyan-400 uppercase tracking-widest animate-pulse">
            <span>🔴 STATE INTELLIGENCE CONTROL CENTER // SYSADMIN MAIN NODE ACTIVE</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-primary-var uppercase font-mono">
            STATE COMMAND CENTER // <span class="text-glow-cyan">{{ authService.currentUser()?.name }}</span>
          </h2>
          <p class="font-mono text-[10px] text-muted-var uppercase max-w-xl">
            Statewide governance infrastructure initialized. Direct access enabled to predictive model weighting parameters, full security event logs, geofence mapping clusters, and system configurations.
          </p>
        </div>

        <div class="flex gap-3">
          <button [routerLink]="['/dashboard/analytics']" class="px-5 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer">
            System Analytics
          </button>
          <button [routerLink]="['/dashboard/maps']" class="px-5 py-3 rounded-lg border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer">
            Hotspot Map
          </button>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Metric: Total Statewide complaints -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Statewide Tickets Load</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">{{ totalComplaints }}</div>
          <div class="font-mono text-[8px] text-cyan-400 mt-1 uppercase tracking-wide">ACTIVE SYSTEM ENTRIES</div>
        </div>

        <!-- Metric: AI Auto-route -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">AI Auto-Route Accuracy</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">96.8%</div>
          <div class="font-mono text-[8px] text-emerald-400 mt-1 uppercase tracking-wide">9.4% AUTO-OPTIMIZED DELTA</div>
        </div>

        <!-- Metric: Active Security Logs -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Security Audits</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-amber-500">42</div>
          <div class="font-mono text-[8px] text-amber-500 mt-1 uppercase tracking-wide">NO RECENT VIOLATIONS</div>
        </div>

        <!-- Metric: SLA Success Rate -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">SLA Clearance Compliance</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">98.4%</div>
          <div class="font-mono text-[8px] text-cyan-400 mt-1 uppercase tracking-wide">95% STABILITY THRESHOLD</div>
        </div>
      </div>

      <!-- Quick Shortcuts Console Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Shortcut: Administrative Control Panel -->
        <div class="glass-panel p-6 rounded-2xl border border-var space-y-4">
          <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">State Core Consoles</h3>
          <p class="font-mono text-[10px] text-muted-var uppercase">Access specialized modules to manage citizen directories and configure settings.</p>
          <div class="grid grid-cols-2 gap-3 pt-2 font-mono text-[10px] uppercase">
            <a [routerLink]="['/dashboard/citizens']" class="p-4 rounded-xl border border-var hover:border-cyan-500/40 hover:bg-white/2 text-center transition-colors">
              👥 Citizen Directory
            </a>
            <a [routerLink]="['/dashboard/officers']" class="p-4 rounded-xl border border-var hover:border-cyan-500/40 hover:bg-white/2 text-center transition-colors">
              💼 Officer Directory
            </a>
            <a [routerLink]="['/dashboard/reports']" class="p-4 rounded-xl border border-var hover:border-cyan-500/40 hover:bg-white/2 text-center transition-colors">
              📋 Core Reports
            </a>
            <a [routerLink]="['/dashboard/settings']" class="p-4 rounded-xl border border-var hover:border-cyan-500/40 hover:bg-white/2 text-center transition-colors">
              ⚙️ Console Settings
            </a>
            <a [routerLink]="['/dashboard/ai-diagnostics']" class="p-4 rounded-xl border border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-950/10 text-center transition-colors text-violet-400">
              🧠 AI Diagnostics
            </a>
          </div>
        </div>

        <!-- System Activity logs -->
        <div class="glass-panel p-6 rounded-2xl border border-var space-y-4">
          <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">System Health & Event Log</h3>
          <div class="space-y-2.5 font-mono text-[9px] uppercase tracking-wide">
            <div class="flex justify-between items-center p-2 rounded bg-white/2 border border-var">
              <span class="text-emerald-400">● MONGODB NODE-01 CONNECTED</span>
              <span class="text-muted-var">100% Uptime</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded bg-white/2 border border-var">
              <span class="text-emerald-400">● AI CLASSIFICATION PIPELINE ACTIVE</span>
              <span class="text-muted-var">Latency 14ms</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded bg-white/2 border border-var">
              <span class="text-emerald-400">● SOCKET CLIENT BRIDGE ENGAGED</span>
              <span class="text-muted-var">Port 5000</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded bg-white/2 border border-var">
              <span class="text-cyan-400">ℹ️ JWT COMPLIANCE VERIFICATION RUNNING</span>
              <span class="text-muted-var">Automatic</span>
            </div>
          </div>
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
export class AdminComponent implements OnInit {
  totalComplaints = 0;

  constructor(
    public authService: AuthService,
    private complaintsService: ComplaintsService,
    public translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.complaintsService.loadComplaints().subscribe((data) => {
      this.totalComplaints = data.length;
    });
  }
}
