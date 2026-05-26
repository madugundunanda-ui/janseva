import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { DashboardService } from '../../core/services/dashboard.service';
import { TimelineService } from '../../core/services/timeline.service';
import { UpdatesService } from '../../core/services/updates.service';
import { GovernanceUpdate } from '../../core/models/update.model';

type Priority = 'normal' | 'elevated' | 'critical';
type Verification = 'verified' | 'in-review';

interface LiveOperation {
  id: string;
  label: string;
  district: string;
  tag: string;
  priority: Priority;
  verification: Verification;
  timestamp: string;
}

@Component({
  selector: 'app-governance-intelligence-center',
  imports: [CommonModule],
  template: `
    <section id="intelligence" class="relative w-full overflow-hidden border-t border-var py-28 px-6">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(145,173,132,0.2),transparent_44%),radial-gradient(circle_at_90%_10%,rgba(163,63,147,0.15),transparent_42%),radial-gradient(circle_at_50%_110%,rgba(127,122,141,0.14),transparent_50%)]"></div>
      <div class="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(127,122,141,0.12)_1px,transparent_1px)] [background-size:26px_26px]"></div>

      <div class="relative mx-auto max-w-7xl">
        <div class="mb-12 rounded-2xl border border-var bg-glass-var p-5 backdrop-blur-md">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div class="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-600">
                <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>State Status: Operational</span>
              </div>
              <h2 class="font-mono text-2xl font-bold uppercase tracking-wide text-primary-var sm:text-3xl text-glow-bright">
                Real-Time Governance Intelligence Center
              </h2>
              <p class="mt-2 max-w-3xl font-mono text-[11px] uppercase tracking-wider text-muted-var">
                Live civic operations, verified district actions, and 30-day governance performance in one operational command view.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 text-[10px] font-mono uppercase tracking-wide sm:grid-cols-4">
              <div class="rounded-xl border border-var bg-white/50 px-3 py-2">
                <div class="text-muted-var">Active Departments</div>
                <div class="mt-1 text-lg font-bold text-primary-var">{{ activeDepartments }}</div>
              </div>
              <div class="rounded-xl border border-var bg-white/50 px-3 py-2">
                <div class="text-muted-var">Active Grievances</div>
                <div class="mt-1 text-lg font-bold text-amber-700">{{ activeGrievances }}</div>
              </div>
              <div class="rounded-xl border border-var bg-white/50 px-3 py-2">
                <div class="text-muted-var">Emergency Alerts</div>
                <div class="mt-1 text-lg font-bold text-rose-700">{{ emergencyAlerts }}</div>
              </div>
              <div class="rounded-xl border border-var bg-white/50 px-3 py-2">
                <div class="text-muted-var">SLA Compliance</div>
                <div class="mt-1 text-lg font-bold text-emerald-700">{{ slaCompliance }}%</div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div class="lg:col-span-7 rounded-2xl border border-var bg-glass-var p-6 backdrop-blur-md">
            <div class="mb-5 flex items-center justify-between">
              <h3 class="font-mono text-xs uppercase tracking-[0.2em] text-[#A33F93]">Live GOV Updates Feed</h3>
              <span class="font-mono text-[10px] uppercase tracking-wider text-muted-var">Stream refresh every 4s</span>
            </div>

            <div class="space-y-3">
              @for (item of liveFeed; track item.id) {
                <article class="relative rounded-xl border border-var bg-white/55 p-4 transition-colors duration-300 hover:border-[#A33F93]/35">
                  <div class="absolute left-0 top-3 bottom-3 w-[3px] rounded-r"
                    [class.bg-emerald-400]="item.priority === 'normal'"
                    [class.bg-amber-400]="item.priority === 'elevated'"
                    [class.bg-red-400]="item.priority === 'critical'"></div>

                  <div class="ml-2">
                    <div class="mb-2 flex flex-wrap items-center gap-2">
                      <span class="inline-flex items-center gap-1 rounded-full border border-[#A33F93]/30 bg-[#A33F93]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#A33F93]">
                        <span class="h-1.5 w-1.5 rounded-full bg-[#A33F93] animate-pulse"></span>
                        LIVE
                      </span>
                      <span class="rounded-full border border-var bg-white/65 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-var">{{ item.district }}</span>
                      <span class="rounded-full border border-var bg-white/65 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-var">{{ item.tag }}</span>
                      <span class="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                        [class.bg-emerald-400/15]="item.verification === 'verified'"
                        [class.text-emerald-200]="item.verification === 'verified'"
                        [class.bg-amber-400/15]="item.verification === 'in-review'"
                        [class.text-amber-200]="item.verification === 'in-review'">
                        {{ item.verification }}
                      </span>
                      <span class="ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-var">{{ item.timestamp }}</span>
                    </div>

                    <p class="font-mono text-sm uppercase tracking-wide text-primary-var">{{ item.label }} - {{ item.district }}</p>
                  </div>
                </article>
              }
            </div>
          </div>

          <div class="lg:col-span-5 rounded-2xl border border-var bg-glass-var p-6 backdrop-blur-md">
            <h3 class="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-[#A33F93]">30-Day Governance Activity Timeline</h3>

            <div class="mb-5 rounded-xl border border-var bg-white/55 p-4">
              <div class="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-var">
                <span>Operational Activity Curve</span>
                <span>Past 30 Days -> Live</span>
              </div>
              <svg viewBox="0 0 320 120" class="h-24 w-full">
                <defs>
                  <linearGradient id="activityLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#A33F93"></stop>
                    <stop offset="100%" stop-color="#8AA47F"></stop>
                  </linearGradient>
                </defs>
                <path d="M10,95 C40,80 65,83 95,62 C130,38 160,50 190,44 C220,40 248,52 275,28 C292,14 304,14 310,12" fill="none" stroke="url(#activityLine)" stroke-width="3" stroke-linecap="round" class="activity-curve"></path>
                <circle cx="310" cy="12" r="4" fill="#10b981" class="animate-pulse"></circle>
              </svg>
            </div>

            <div class="mb-5 grid grid-cols-3 gap-2">
              @for (cell of heatmap; track $index) {
                <div class="h-7 rounded-sm border border-var/30"
                  [style.background]="cell"></div>
              }
            </div>

            <div class="space-y-3 text-[10px] font-mono uppercase tracking-wide">
              <div class="flex items-center justify-between border-b border-var pb-2">
                <span class="text-muted-var">Resolved Grievances (30D)</span>
                <span class="font-bold text-emerald-700">{{ resolved30d }}</span>
              </div>
              <div class="flex items-center justify-between border-b border-var pb-2">
                <span class="text-muted-var">Average Response Time</span>
                <span class="font-bold text-primary-var">{{ responseHours }}h</span>
              </div>
              <div class="flex items-center justify-between border-b border-var pb-2">
                <span class="text-muted-var">Citizen Engagement</span>
                <span class="font-bold text-primary-var">{{ engagementRate }}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-var">District Performance Index</span>
                <span class="font-bold text-emerald-700">{{ districtIndex }}</span>
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

    .activity-curve {
      stroke-dasharray: 420;
      stroke-dashoffset: 420;
      animation: drawCurve 3.2s ease forwards infinite;
    }

    @keyframes drawCurve {
      0% { stroke-dashoffset: 420; opacity: 0.5; }
      65% { stroke-dashoffset: 0; opacity: 1; }
      100% { stroke-dashoffset: 0; opacity: 1; }
    }
  `]
})
export class GovernanceIntelligenceCenterComponent implements OnInit, OnDestroy {
  activeDepartments = 0;
  activeGrievances = 0;
  emergencyAlerts = 0;
  slaCompliance = 0;
  resolved30d = 0;
  responseHours = 0;
  engagementRate = 0;
  districtIndex = 'A+';

  liveFeed: LiveOperation[] = [];

  heatmap = this.buildHeatmap();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private dashboardService: DashboardService,
    private timelineService: TimelineService,
    private updatesService: UpdatesService
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.dashboardService.loadStats().subscribe((stats) => {
      this.activeGrievances = stats.totalComplaints;
      this.activeDepartments = stats.activeDepartments;
      this.emergencyAlerts = stats.liveAlerts ?? stats.statusBreakdown.escalated;
      this.slaCompliance = stats.slaSuccessRate;
    });

    this.timelineService.getTimeline().subscribe((timeline) => {
      this.resolved30d = timeline.resolved30d;
      this.responseHours = timeline.averageResponseTime;
      this.engagementRate = timeline.engagementRate;
      this.districtIndex = this.buildDistrictIndex(timeline.engagementRate, timeline.slaSuccessRate);
    });

    this.timer = setInterval(() => {
      this.heatmap = this.buildHeatmap();
    }, 4000);

    this.updatesService.watchLiveUpdates(4000).subscribe((updates) => {
      this.liveFeed = updates.slice(0, 7).map((update) => this.toLiveOperation(update));
    });
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private buildHeatmap(): string[] {
    const palette = ['#a7b89c', '#becdb4', '#d7dfc8', '#d9dceb', '#cfd2e3', '#d8c9de'];
    return Array.from({ length: 30 }, () => {
      const color = palette[this.randomBetween(0, palette.length - 1)];
      const alpha = 0.22 + this.randomBetween(0, 52) / 100;
      return `rgba(${this.hexToRgb(color)}, ${alpha.toFixed(2)})`;
    });
  }

  private createOperation(
    label: string,
    district: string,
    tag: string,
    priority: Priority,
    verification: Verification
  ): LiveOperation {
    return {
      id: 'op-' + Math.random().toString(36).substring(2, 11),
      label,
      district,
      tag,
      priority,
      verification,
      timestamp: this.currentTime()
    };
  }

  private toLiveOperation(update: GovernanceUpdate): LiveOperation {
    return {
      id: update.id,
      label: update.message,
      district: update.ward ?? update.department,
      tag: update.source ?? update.department.toLowerCase().replace(/\s+/g, '-'),
      priority: this.mapPriority(update.severity),
      verification: update.severity === 'critical' ? 'in-review' : 'verified',
      timestamp: this.currentTime()
    };
  }

  private mapPriority(severity: GovernanceUpdate['severity']): Priority {
    if (severity === 'critical') {
      return 'critical';
    }
    if (severity === 'warning') {
      return 'elevated';
    }
    return 'normal';
  }

  private buildDistrictIndex(engagementRate: number, slaSuccessRate: number): string {
    const score = (engagementRate + slaSuccessRate) / 2;
    if (score >= 97) return 'A+';
    if (score >= 92) return 'A';
    if (score >= 86) return 'B+';
    return 'B';
  }

  private currentTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private hexToRgb(hex: string): string {
    const value = hex.replace('#', '');
    const bigint = Number.parseInt(value, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  }
}
