import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { UpdatesService } from '../../core/services/updates.service';
import { GovernanceUpdate } from '../../core/models/update.model';

@Component({
  selector: 'app-governance-alerts',
  imports: [CommonModule],
  template: `
    <section class="py-32 px-6 bg-transparent relative w-full border-t border-var overflow-hidden">
      <!-- Ambient light decorative circle -->
      <div class="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#6AA9FF]/3 rounded-full blur-[140px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        <div class="mb-20 text-center lg:text-left flex flex-col lg:flex-row justify-between lg:items-end gap-6">
          <div>
            <span class="font-mono text-xs tracking-[0.25em] text-[#6AA9FF] uppercase mb-4 block">
              LIVE SYSTEM STATE
            </span>
            <h2 class="text-3xl md:text-5xl font-bold tracking-tight text-primary-var uppercase text-glow leading-none font-mono">
              Real-Time Governance Intelligence
            </h2>
          </div>
          <div class="flex items-center gap-6 self-center font-mono text-[10px] uppercase tracking-wider">
            <!-- Flashing global state -->
            <div class="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-400">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>GRID LIVE // FEED ACTIVE</span>
            </div>
            <!-- Telemetry counters -->
            <div class="text-muted-var">
              TOTAL_RECORDS: <span class="text-primary-var font-bold">{{ counter }}</span>
            </div>
          </div>
        </div>

        <!-- Live Ticker Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <!-- Left Column: Active Alert Feed (Simulated live adding items) -->
          <div class="lg:col-span-8 space-y-4">
            @for (alert of alerts; track alert.id) {
              <div class="p-4 rounded-xl border border-var bg-glass-var backdrop-blur-md flex gap-4 items-start relative overflow-hidden transition-all duration-300 hover:border-[#6AA9FF]/30">
                <!-- Glowing indicator stripe -->
                <div class="absolute left-0 top-0 bottom-0 w-[3px]" [ngClass]="{
                    'bg-blue-400': alert.severity === 'info',
                    'bg-amber-400': alert.severity === 'warning',
                    'bg-red-400': alert.severity === 'critical',
                    'bg-emerald-400': alert.severity === 'success'
                }"></div>

                <!-- Content -->
                <div class="flex-1 font-mono text-[10px] uppercase tracking-wide">
                  <div class="flex justify-between items-center text-muted-var mb-2">
                    <span class="text-[#6AA9FF] font-semibold">{{ alert.department }}</span>
                    <span>{{ alert.timestamp }}</span>
                  </div>
                  <p class="text-primary-var leading-relaxed text-xs">{{ alert.message }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Right Column: Operations Telemetry Widgets -->
          <div class="lg:col-span-4 space-y-6">
            <!-- Active Hotspot widget -->
            <div class="p-6 rounded-xl border border-var bg-glass-var space-y-4">
              <span class="font-mono text-[9px] tracking-widest text-[#6AA9FF] uppercase">AI HOTSPOT CRITIQUE</span>
              
              <div class="space-y-4">
                @for (hotspot of hotspots; track hotspot.id) {
                  <div class="flex justify-between items-center font-mono text-[10px] uppercase">
                    <span class="text-muted-var">{{ hotspot.label }}</span>
                    <span class="px-2 py-0.5 rounded border" [ngClass]="hotspotClass(hotspot.risk)">{{ hotspot.risk }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Auto-Dispatch Efficiency -->
            <div class="p-6 rounded-xl border border-var bg-glass-var space-y-4">
              <span class="font-mono text-[9px] tracking-widest text-muted-var uppercase">AUTO-DISPATCH SPEED (7D)</span>
              
              <div class="flex items-end gap-3 h-24 pb-2 relative font-mono text-[8px] text-muted-var uppercase">
                <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div class="w-full bg-[#6AA9FF]/10 border-t border-[#6AA9FF]/30 rounded-t h-[65%]"></div>
                  <span>R1</span>
                </div>
                <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div class="w-full bg-[#6AA9FF]/10 border-t border-[#6AA9FF]/30 rounded-t h-[80%]"></div>
                  <span>R2</span>
                </div>
                <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div class="w-full bg-[#6AA9FF]/20 border-t border-[#6AA9FF] rounded-t h-[95%] shadow-[0_0_15px_rgba(106,169,255,0.25)]"></div>
                  <span class="text-[#6AA9FF]">AI_R3</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class GovernanceAlertsComponent implements OnInit, OnDestroy {
  counter = 0;
  alerts: GovernanceUpdate[] = [];
  hotspots: Array<{ id: string; label: string; risk: 'HIGH RISK' | 'MED RISK' | 'LOW RISK' }> = [];

  private timerId: Subscription | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private updatesService: UpdatesService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.dashboardService.loadStats().subscribe((stats) => {
      this.counter = (stats.totalComplaints * 100) + stats.pendingComplaints;
      this.cdr.detectChanges();
    });

    this.timerId = this.updatesService.watchLiveUpdates(4500).subscribe((items) => {
      this.alerts = items.slice(0, 4);
      this.hotspots = items.slice(0, 3).map((item, index) => ({
        id: item.id || `hotspot-${index}`,
        label: `${item.department} // ${item.ward ?? `NODE ${index + 1}`}`,
        risk: item.severity === 'critical' ? 'HIGH RISK' : item.severity === 'warning' ? 'MED RISK' : 'LOW RISK'
      }));
      this.counter += Math.max(1, items.length);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      this.timerId.unsubscribe();
    }
  }

  hotspotClass(risk: 'HIGH RISK' | 'MED RISK' | 'LOW RISK'): Record<string, boolean> {
    return {
      'bg-red-950/20': risk === 'HIGH RISK',
      'border-red-500/30': risk === 'HIGH RISK',
      'text-red-400': risk === 'HIGH RISK',
      'bg-amber-950/20': risk === 'MED RISK',
      'border-amber-500/30': risk === 'MED RISK',
      'text-amber-400': risk === 'MED RISK',
      'bg-blue-950/20': risk === 'LOW RISK',
      'border-blue-500/30': risk === 'LOW RISK',
      'text-blue-400': risk === 'LOW RISK',
    };
  }
}
