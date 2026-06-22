import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard-showcase',
  template: `
    <section #showcaseSection class="py-40 px-6 bg-transparent relative w-full border-t border-var overflow-hidden">
      <!-- Glow ambient background -->
      <div class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#6AA9FF]/5 rounded-full blur-[140px] pointer-events-none translate-x-1/4 translate-y-1/4"></div>

      <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        <div class="mb-24 text-center">
          <span class="font-mono text-xs tracking-[0.25em] text-[#6AA9FF] uppercase mb-4 block">
            THE PLATFORM CONSOLE
          </span>
          <h2 class="text-3xl md:text-5xl font-bold tracking-tight text-primary-var uppercase text-glow leading-none font-mono">
            Vercel-Grade Operations Console
          </h2>
          <p class="text-xs sm:text-sm text-muted-var font-mono mt-6 max-w-xl mx-auto uppercase tracking-wider">
            A luxury minimalist control center built for admins, supervisors, and officers to manage real-time city parameters.
          </p>
        </div>

        <!-- Dashboard Preview Graphic Mock -->
        <div #dashboardPreview class="glass-panel rounded-2xl border border-var bg-glass-var p-6 shadow-2xl relative max-w-5xl mx-auto overflow-hidden animate-float">
          
          <div class="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#6AA9FF]/30 to-transparent"></div>
          
          <!-- Inner Mock Layout -->
          <div class="grid grid-cols-12 gap-6">
            
            <!-- Mock Sidebar -->
            <div class="col-span-3 border-r border-var pr-4 hidden md:block font-mono text-[9px] uppercase space-y-6">
              <div class="flex items-center gap-2 pb-4 border-b border-var">
                <div class="w-3 h-3 rounded-full bg-[#6AA9FF]"></div>
                <span class="font-bold text-primary-var">JANSEVA CONSOLE</span>
              </div>

              <div class="space-y-3 text-muted-var">
                <div class="text-primary-var font-semibold">● Grievance Feed</div>
                <div>○ SLA Analytics</div>
                <div>○ Officer Registry</div>
                <div>○ Hotspot Nodes</div>
                <div>○ Console Settings</div>
              </div>
            </div>

            <!-- Mock Console Content -->
            <div class="col-span-12 md:col-span-9 space-y-6">
              
              <!-- Mock Header bar -->
              <div class="flex justify-between items-center border-b border-var pb-4 font-mono text-[8px] uppercase text-muted-var">
                <span>SYSTEM_NODE: ACTIVE_WARD_12</span>
                <span class="text-emerald-400">● LEDGER_SYNCED</span>
              </div>

              <!-- Mini cards -->
              @if (stats) {
                <div class="grid grid-cols-3 gap-4">
                  <div class="p-4 rounded-xl border border-var bg-glass-var">
                    <div class="font-mono text-[7px] text-muted-var uppercase mb-1">TOTAL RESOLVED</div>
                    <div class="text-xl font-bold font-mono text-primary-var">{{ stats.complaintsResolved }}</div>
                  </div>

                  <div class="p-4 rounded-xl border border-var bg-glass-var">
                    <div class="font-mono text-[7px] text-muted-var uppercase mb-1">BACKLOG STACK</div>
                    <div class="text-xl font-bold font-mono text-[#6AA9FF]">{{ stats.pendingComplaints }} Tickets</div>
                  </div>

                  <div class="p-4 rounded-xl border border-var bg-glass-var">
                    <div class="font-mono text-[7px] text-muted-var uppercase mb-1">SLA RESPONSE</div>
                    <div class="text-xl font-bold font-mono text-emerald-400">{{ stats.slaSuccessRate }}%</div>
                  </div>
                </div>
              } @else {
                <div class="grid grid-cols-3 gap-4">
                  <div class="p-4 rounded-xl border border-var bg-glass-var animate-pulse h-20"></div>
                  <div class="p-4 rounded-xl border border-var bg-glass-var animate-pulse h-20"></div>
                  <div class="p-4 rounded-xl border border-var bg-glass-var animate-pulse h-20"></div>
                </div>
              }

              <!-- Main metric block -->
              <div class="p-5 rounded-xl border border-var bg-glass-var relative">
                <div class="flex justify-between font-mono text-[8px] uppercase text-muted-var mb-6">
                  <span>RESOLUTION TIMELINE TREND</span>
                  <span>7_DAY_CYCLE</span>
                </div>
                <!-- Dynamic Waveform Grid lines -->
                @if (stats) {
                  <div class="h-20 flex items-end gap-1.5 pb-2 relative">
                    <div class="w-full bg-[#6AA9FF]/10 border-t border-[#6AA9FF]/30 rounded-t" [style.height.%]="barHeight(stats.pendingComplaints, 3)"></div>
                    <div class="w-full bg-[#6AA9FF]/10 border-t border-[#6AA9FF]/30 rounded-t" [style.height.%]="barHeight(stats.totalComplaints, 2)"></div>
                    <div class="w-full bg-[#6AA9FF]/10 border-t border-[#6AA9FF]/30 rounded-t" [style.height.%]="barHeight(stats.complaintsResolved, 2)"></div>
                    <div class="w-full bg-[#6AA9FF]/10 border-t border-[#6AA9FF]/30 rounded-t" [style.height.%]="barHeight(stats.slaSuccessRate, 1)"></div>
                    <div class="w-full bg-[#6AA9FF]/10 border-t border-[#6AA9FF]/30 rounded-t" [style.height.%]="barHeight(stats.activeDepartments, 10)"></div>
                  </div>
                }
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
export class DashboardShowcaseComponent implements OnInit, AfterViewInit {
  @ViewChild('showcaseSection') sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('dashboardPreview') previewRef!: ElementRef<HTMLElement>;

  stats: DashboardStats | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.dashboardService.loadStats().subscribe((stats) => {
      this.stats = stats;
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        gsap.from(this.previewRef.nativeElement, {
          opacity: 0,
          scale: 0.95,
          y: 40,
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: this.sectionRef.nativeElement,
            start: 'top 70%',
            toggleActions: 'play none none none'
          }
        });
      });
    });
  }

  barHeight(value: number, multiplier: number): number {
    return Math.max(25, value * multiplier);
  }
}
