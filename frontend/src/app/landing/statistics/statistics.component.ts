import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-statistics',
  template: `
    <section #statsSection class="py-40 px-6 bg-[#050505] relative w-full border-t border-white/5 tech-dots-bg">
      <!-- Glow ambient backdrop -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto relative z-10">
        <!-- Section Header -->
        <div class="mb-24 text-center">
          <h2 class="font-mono text-xs tracking-[0.25em] text-cyan-400 uppercase mb-4">
            PERFORMANCE TELEMETRY
          </h2>
          <h3 class="text-3xl md:text-5xl font-bold tracking-tight text-white uppercase text-glow leading-none">
            Empirical Platform Metrics
          </h3>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <!-- Metric 1 -->
          <div class="text-center flex flex-col items-center">
            <span class="font-mono text-[10px] tracking-widest text-white/40 uppercase mb-4">
              THROUGHPUT VOLUME
            </span>
            <div class="text-6xl md:text-8xl font-bold tracking-tighter text-white text-glow mb-6 font-mono flex items-center">
              <span #num1>0</span><span class="text-cyan-400 text-5xl md:text-6xl">+</span>
            </div>
            <p class="text-xs text-white/50 leading-relaxed font-mono uppercase max-w-xs">
              Daily active transactions filed, analyzed, and routed to ward supervisors.
            </p>
          </div>

          <!-- Metric 2 -->
          <div class="text-center flex flex-col items-center">
            <span class="font-mono text-[10px] tracking-widest text-white/40 uppercase mb-4">
              SLA SPEED INDEX
            </span>
            <div class="text-6xl md:text-8xl font-bold tracking-tighter text-white text-glow mb-6 font-mono flex items-center">
              <span #num2>0.0</span><span class="text-cyan-400 text-5xl md:text-6xl">h</span>
            </div>
            <p class="text-xs text-white/50 leading-relaxed font-mono uppercase max-w-xs">
              Average response time from initial citizen scan to active resolution dispatch.
            </p>
          </div>

          <!-- Metric 3 -->
          <div class="text-center flex flex-col items-center">
            <span class="font-mono text-[10px] tracking-widest text-white/40 uppercase mb-4">
              SORTING EFFICACY
            </span>
            <div class="text-6xl md:text-8xl font-bold tracking-tighter text-white text-glow mb-6 font-mono flex items-center">
              <span #num3>0.0</span><span class="text-cyan-400 text-5xl md:text-6xl">%</span>
            </div>
            <p class="text-xs text-white/50 leading-relaxed font-mono uppercase max-w-xs">
              Algorithmic classification and auto-route alignment accuracy.
            </p>
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
export class StatisticsComponent implements OnInit, AfterViewInit {
  @ViewChild('statsSection') sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('num1') num1Ref!: ElementRef<HTMLElement>;
  @ViewChild('num2') num2Ref!: ElementRef<HTMLElement>;
  @ViewChild('num3') num3Ref!: ElementRef<HTMLElement>;

  stats: DashboardStats | null = null;
  private viewReady = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.dashboardService.loadStats().subscribe((stats) => {
      this.stats = stats;
      if (this.viewReady) {
        this.animateCounters();
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.viewReady = true;

    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        this.animateCounters(gsap, ScrollTrigger);
      });
    });
  }

  private animateCounters(gsap?: any, ScrollTrigger?: any): void {
    const targets = [
      { ref: this.num1Ref.nativeElement, endVal: this.stats?.totalComplaints ?? 0, decimals: 0 },
      { ref: this.num2Ref.nativeElement, endVal: this.stats?.averageResolutionTime ?? 0, decimals: 1 },
      { ref: this.num3Ref.nativeElement, endVal: this.stats?.slaSuccessRate ?? 0, decimals: 1 }
    ];

    if (!gsap || !ScrollTrigger) {
      targets.forEach((item) => {
        item.ref.innerText = item.endVal.toFixed(item.decimals);
      });
      return;
    }

    targets.forEach((item) => {
      const counterObj = { value: 0 };
      gsap.to(counterObj, {
        value: item.endVal,
        duration: 2.5,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: this.sectionRef.nativeElement,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        onUpdate: () => {
          item.ref.innerText = counterObj.value.toFixed(item.decimals);
        }
      });
    });
  }
}
