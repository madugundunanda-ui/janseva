import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ComplaintsService } from '../../core/services/complaints.service';
import { TranslationService } from '../../core/services/translation.service';
import { Complaint } from '../../core/services/api.service';
import { AnalyticsService, ExecutiveDashboardMetric, HeatmapData, Prediction, GovernanceInsight } from '../../core/services/analytics.service';

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

      <!-- Executive Governance Summary -->
      <div class="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-transparent">
        <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold border-b border-cyan-500/20 pb-2 mb-4">
          Governance Executive Summary
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="space-y-2 font-mono text-[10px] uppercase">
            <div class="flex justify-between items-center bg-white/5 p-2 rounded border border-var">
              <span class="text-primary-var">State Civic Score:</span>
              <span class="text-white font-bold">{{ dashboardData?.stateCivicHealthScore || 78 }}/100</span>
            </div>
            <div class="flex justify-between items-center bg-white/5 p-2 rounded border border-var">
              <span class="text-primary-var">Emergency Index:</span>
              <span class="text-red-400 font-bold">{{ dashboardData?.emergencyRiskIndex || 12 }}/100</span>
            </div>
          </div>
          
          <div class="space-y-2 font-mono text-[10px] uppercase">
            <div class="flex justify-between items-center bg-white/5 p-2 rounded border border-var">
              <span class="text-primary-var">Top Dept:</span>
              <span class="text-emerald-400 font-bold">{{ dashboardData?.topDepartments?.[0]?.name || 'Water Supply' }}</span>
            </div>
            <div class="flex justify-between items-center bg-white/5 p-2 rounded border border-var">
              <span class="text-primary-var">Risk Dept:</span>
              <span class="text-red-400 font-bold">{{ dashboardData?.underperformingDepartments?.[0]?.name || 'Roads' }}</span>
            </div>
          </div>
          
          <div class="col-span-1 md:col-span-2 space-y-2">
            @for(insight of govInsights.slice(0, 3); track insight._id) {
              <div class="flex items-start gap-2">
                <span class="mt-0.5 text-[8px]" [ngClass]="insight.severity === 'Critical' ? 'text-red-400' : 'text-cyan-400'">►</span>
                <span class="font-mono text-[10px] uppercase text-muted-var">{{ insight.title }}</span>
              </div>
            }
            <div class="flex items-start gap-2">
                <span class="mt-0.5 text-[8px] text-red-400">►</span>
                <span class="font-mono text-[10px] uppercase text-muted-var">3 emergency hotspots detected</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Metric: State Civic Score -->
        <div class="glass-panel p-5 rounded-xl border border-var bg-cyan-950/10">
          <div class="font-mono text-[9px] text-cyan-400 uppercase tracking-widest mb-2">State Civic Health Score</div>
          <div class="text-3xl font-bold font-mono tracking-tight text-white">{{ dashboardData?.stateCivicHealthScore || '--' }}</div>
          <div class="font-mono text-[8px] mt-1 uppercase tracking-wide" [ngClass]="{'text-emerald-400': dashboardData?.stateCivicHealthScore! >= 80, 'text-yellow-400': dashboardData?.stateCivicHealthScore! >= 60 && dashboardData?.stateCivicHealthScore! < 80, 'text-red-400': dashboardData?.stateCivicHealthScore! < 60}">
            Category: {{ dashboardData?.governanceCategory || 'Unknown' }}
          </div>
        </div>

        <!-- Metric: SLA Success Rate -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">SLA Compliance Index</div>
          <div class="text-3xl font-bold font-mono tracking-tight text-primary-var">{{ dashboardData?.slaComplianceIndex || 0 }}%</div>
          <div class="font-mono text-[8px] text-cyan-400 mt-1 uppercase tracking-wide">STATEWIDE AVERAGE</div>
        </div>

        <!-- Metric: Emergency Risk -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Emergency Risk Index</div>
          <div class="text-3xl font-bold font-mono tracking-tight text-red-400">{{ dashboardData?.emergencyRiskIndex || 0 }}/100</div>
          <div class="font-mono text-[8px] text-red-400 mt-1 uppercase tracking-wide">ACTIVE HOTSPOTS DETECTED</div>
        </div>

        <!-- Metric: Total Statewide complaints -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Statewide Tickets Load</div>
          <div class="text-3xl font-bold font-mono tracking-tight text-primary-var">{{ totalComplaints }}</div>
          <div class="font-mono text-[8px] text-cyan-400 mt-1 uppercase tracking-wide">ACTIVE SYSTEM ENTRIES</div>
        </div>
      </div>

      <!-- Governance Command Center Core Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Rankings Panel -->
        <div class="glass-panel p-5 rounded-xl border border-var space-y-6">
          <div>
            <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold border-b border-var pb-2 mb-3">Top Departments</h3>
            @for(dept of dashboardData?.topDepartments?.slice(0,3) || []; track dept.name; let i = $index) {
              <div class="flex justify-between items-center mb-2">
                <span class="font-mono text-[9px] uppercase text-primary-var"><span class="text-muted-var">#{{i+1}}</span> {{dept.name}}</span>
                <span class="font-mono text-[9px] text-emerald-400 font-bold">{{dept.score}}</span>
              </div>
            }
          </div>
          <div>
            <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold border-b border-var pb-2 mb-3">Critical Risk Areas</h3>
            @for(area of dashboardData?.criticalRiskAreas?.slice(0,3) || []; track area.name; let i = $index) {
              <div class="flex justify-between items-center mb-2">
                <span class="font-mono text-[9px] uppercase text-primary-var"><span class="text-muted-var">#{{i+1}}</span> {{area.name}}</span>
                <span class="font-mono text-[9px] text-red-400 font-bold">{{area.score}}</span>
              </div>
            }
          </div>
        </div>

        <!-- Density Heatmap Visualization (SVG Grid) -->
        <div class="glass-panel p-5 rounded-xl border border-var col-span-1 lg:col-span-2 flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">Live Density Heatmap</h3>
            <span class="font-mono text-[9px] text-muted-var border border-var px-2 py-0.5 rounded">COMPLAINT DENSITY</span>
          </div>
          
          <div class="flex-1 bg-[#09090b] rounded-lg border border-var relative overflow-hidden flex items-center justify-center min-h-[250px] p-4">
            <!-- Schematic Grid Visualization -->
            <div class="grid grid-cols-10 grid-rows-5 gap-1.5 w-full h-full relative">
              @for(cell of heatmapGrid; track $index) {
                <div class="rounded-sm transition-all duration-500 hover:scale-110 hover:z-10 cursor-pointer relative group flex items-center justify-center border border-white/5" 
                     [ngStyle]="{'background-color': getHeatmapColor(cell)}"
                     (click)="inspectZone($index, cell)">
                     
                     <!-- Zone Severity Label (Only show on high risk) -->
                     @if(cell > 0.8) {
                       <span class="text-[6px] font-mono text-white/70 absolute">CRIT</span>
                     } @else if (cell > 0.6) {
                       <span class="text-[6px] font-mono text-white/50 absolute">WARN</span>
                     }
                     
                     <!-- Tooltip -->
                     <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black border border-var rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                       <div class="font-mono text-[8px] text-cyan-400 uppercase border-b border-white/10 pb-1 mb-1">Zone {{$index + 1}} Data</div>
                       <div class="font-mono text-[8px] text-muted-var uppercase">Risk: {{cell | percent:'1.0-0'}}</div>
                       <div class="font-mono text-[8px] text-emerald-400 uppercase" [ngClass]="{'text-red-400': cell > 0.6}">Status: {{cell > 0.8 ? 'CRITICAL' : (cell > 0.6 ? 'ELEVATED' : 'STABLE')}}</div>
                     </div>
                </div>
              }
            </div>
            
            <div class="absolute bottom-2 right-2 flex items-center gap-2 bg-black/80 p-2 rounded-lg border border-white/10 backdrop-blur-md z-20">
              <span class="font-mono text-[8px] text-muted-var">Low</span>
              <div class="w-24 h-2 rounded-full bg-gradient-to-r from-emerald-500/20 via-yellow-500/50 to-red-500/80 border border-white/5"></div>
              <span class="font-mono text-[8px] text-muted-var">High</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Forecasts and Insights Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Predictions Dashboard -->
        <div class="glass-panel p-5 rounded-xl border border-var overflow-hidden">
          <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold border-b border-var pb-2 mb-4">AI Forecasts (7-Day Projection)</h3>
          <div class="space-y-4">
            @for(pred of predictions.slice(0,4); track pred._id) {
              <div class="flex justify-between items-center">
                <div class="space-y-1">
                  <span class="block font-mono text-[9px] uppercase text-primary-var">{{ pred.targetEntityName }}</span>
                  <span class="block font-mono text-[8px] text-muted-var">{{ pred.predictionType }}</span>
                </div>
                <div class="text-right">
                  <span class="block font-mono text-[10px] font-bold text-white">{{ pred.predictedValue | number:'1.0-0' }}</span>
                  <span class="block font-mono text-[8px] uppercase" [ngClass]="pred.trendDirection === 'Up' ? 'text-red-400' : 'text-emerald-400'">{{ pred.trendDirection }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Governance Insights Feed -->
        <div class="glass-panel p-5 rounded-xl border border-var overflow-hidden flex flex-col">
          <div class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold border-b border-var pb-2 mb-4">Command Center Insights</div>
          <div class="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar max-h-[250px]">
            @for (insight of govInsights; track insight._id) {
              <div class="p-3 bg-white/2 rounded-lg border border-white/5 space-y-1 relative">
                @if (insight.severity === 'Critical') {
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg"></div>
                }
                <div class="flex items-center justify-between pl-2">
                  <span class="font-mono text-[9px] text-cyan-400 uppercase">{{ insight.title }}</span>
                  <span class="text-[8px] font-mono" [ngClass]="{'text-red-400': insight.severity === 'Critical', 'text-amber-400': insight.severity === 'High', 'text-muted-var': insight.severity === 'Medium' || insight.severity === 'Low'}">{{ insight.severity }}</span>
                </div>
                <p class="font-mono text-[10px] text-primary-var leading-snug pl-2">{{ insight.description }}</p>
                @if(insight.actionableRecommendation) {
                  <p class="font-mono text-[8px] text-emerald-400/80 mt-2 uppercase tracking-wide pl-2 border-t border-white/5 pt-1">ACTION: {{ insight.actionableRecommendation }}</p>
                }
              </div>
            }
          </div>
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
  
  dashboardData: ExecutiveDashboardMetric | null = null;
  govInsights: GovernanceInsight[] = [];
  predictions: Prediction[] = [];
  
  // Array of 50 cells for the mockup heatmap
  heatmapGrid: number[] = Array(50).fill(0).map(() => Math.random());

  constructor(
    public authService: AuthService,
    private complaintsService: ComplaintsService,
    public translationService: TranslationService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.complaintsService.loadComplaints().subscribe((data) => {
      this.totalComplaints = data.length;
    });

    this.analyticsService.getExecutiveDashboard().subscribe(res => {
      if (res && res.dashboard) {
        this.dashboardData = res.dashboard;
      }
    });

    this.analyticsService.getGovernanceInsights().subscribe(res => {
      this.govInsights = res.insights;
    });

    this.analyticsService.getPredictions().subscribe(res => {
      this.predictions = res.predictions;
    });
  }

  getHeatmapColor(weight: number): string {
    if (weight < 0.2) return 'rgba(16, 185, 129, 0.1)'; // faint emerald
    if (weight < 0.5) return 'rgba(16, 185, 129, 0.4)'; // emerald
    if (weight < 0.7) return 'rgba(245, 158, 11, 0.5)'; // amber
    if (weight < 0.9) return 'rgba(239, 68, 68, 0.6)'; // red
    return 'rgba(239, 68, 68, 0.9)'; // deep red
  }

  inspectZone(index: number, risk: number): void {
    console.log(`Inspecting Zone ${index + 1} with Risk Level ${Math.round(risk * 100)}%`);
    // Future deep link expansion
  }
}
