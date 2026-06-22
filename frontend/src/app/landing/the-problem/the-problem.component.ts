import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-the-problem',
  template: `
    <section #problemSection class="py-40 px-6 bg-transparent relative w-full border-t border-var overflow-hidden">
      <!-- Glow ambient backdrops -->
      <div class="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        <!-- Left Column: Emotional text narrative -->
        <div class="lg:col-span-6 space-y-8">
          <span class="font-mono text-xs tracking-[0.25em] text-red-500 uppercase font-bold block animate-pulse">
            THE SYSTEM FAILURE
          </span>
          <h2 #headline class="text-3xl sm:text-5xl font-bold tracking-tight text-primary-var uppercase text-glow leading-none font-mono">
            Gridlock. Delay.<br>
            <span class="text-red-500">Silence.</span>
          </h2>
          <p #desc class="text-xs sm:text-sm text-muted-var leading-relaxed font-mono uppercase">
            Municipal grievances get lost in paper stacks. Citizens report issues into empty voids. Ward officers are blind to coordinate overlaps, and resolution takes weeks—if it happens at all. The grid is broken.
          </p>

          <div class="space-y-4 font-mono text-[10px] text-muted-var uppercase">
            <div class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              <span>88% OF GRIEVANCES GET NO RESPONSE</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>18.4 DAYS AVERAGE RESOLUTION DELAY</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>ZERO MUNICIPAL DATA TRANSPARENCY</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Visual Stage (Floating Gridlock Alerts) -->
        <div class="lg:col-span-6 h-[400px] relative flex items-center justify-center border border-var bg-glass-var rounded-2xl p-6 overflow-hidden">
          
          <div class="absolute inset-0 bg-gradient-to-br from-red-950/10 to-transparent pointer-events-none"></div>
          <div class="absolute inset-0 bg-cyan-500/0 tech-dots-bg"></div>

          <!-- Floating Alerts -->
          <div #alert1 class="absolute w-[280px] p-4 glass-panel rounded-xl border border-red-500/20 bg-glass-var flex flex-col gap-1.5 font-mono text-[9px] uppercase tracking-wide" style="top: 15%; left: 10%;">
            <div class="flex justify-between text-red-500 font-bold">
              <span>ALERT: LOST TICKET</span>
              <span>#8419</span>
            </div>
            <div class="text-primary-var">Grievance: garbage overflow at Ward 12.</div>
            <div class="text-muted-var text-[8px]">Status: UNRESOLVED for 18 days</div>
          </div>

          <div #alert2 class="absolute w-[280px] p-4 glass-panel rounded-xl border-var bg-glass-var flex flex-col gap-1.5 font-mono text-[9px] uppercase tracking-wide" style="top: 45%; right: 10%;">
            <div class="flex justify-between text-muted-var">
              <span>OVERLAP CONFLICT</span>
              <span>SYS_WARN</span>
            </div>
            <div class="text-primary-var">4 duplicate complaints registered on same link coordinate.</div>
            <div class="text-red-400 font-bold">No officer assigned.</div>
          </div>

          <div #alert3 class="absolute w-[280px] p-4 glass-panel rounded-xl border border-red-500/20 bg-glass-var flex flex-col gap-1.5 font-mono text-[9px] uppercase tracking-wide" style="bottom: 12%; left: 20%;">
            <div class="flex justify-between text-red-500 font-bold">
              <span>SLA RISK WARNING</span>
              <span>#2401</span>
            </div>
            <div class="text-primary-var">Pipeline leakage. Link coordinate unmapped.</div>
            <div class="text-red-400">Escalation queue failed</div>
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
export class TheProblemComponent implements OnInit, AfterViewInit {
  @ViewChild('problemSection') sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('headline') headlineRef!: ElementRef<HTMLElement>;
  @ViewChild('desc') descRef!: ElementRef<HTMLElement>;

  @ViewChild('alert1') alert1Ref!: ElementRef<HTMLElement>;
  @ViewChild('alert2') alert2Ref!: ElementRef<HTMLElement>;
  @ViewChild('alert3') alert3Ref!: ElementRef<HTMLElement>;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        const trigger = {
          trigger: this.sectionRef.nativeElement,
          start: 'top 75%',
          toggleActions: 'play none none none'
        };

        // Standard reveal
        gsap.from(this.headlineRef.nativeElement, {
          opacity: 0,
          y: 40,
          duration: 1.2,
          scrollTrigger: trigger
        });

        gsap.from(this.descRef.nativeElement, {
          opacity: 0,
          y: 20,
          duration: 1.2,
          delay: 0.2,
          scrollTrigger: trigger
        });

        // Floating alerts entry + slow constant drift
        const alerts = [
          this.alert1Ref.nativeElement,
          this.alert2Ref.nativeElement,
          this.alert3Ref.nativeElement
        ];

        gsap.from(alerts, {
          opacity: 0,
          x: (i) => [ -40, 40, -30 ][i],
          y: 40,
          duration: 1.5,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: trigger,
          onComplete: () => {
            // Apply infinite slow drift
            alerts.forEach((alert, i) => {
              gsap.to(alert, {
                y: '+=12',
                x: '+=8',
                duration: 4 + i,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
              });
            });
          }
        });
      });
    });
  }
}
