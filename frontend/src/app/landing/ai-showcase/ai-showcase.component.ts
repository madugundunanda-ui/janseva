import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-ai-showcase',
  template: `
    <section #showcaseSection class="py-32 px-6 bg-transparent relative w-full border-t border-var">
      <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        <div class="mb-24 text-center md:text-left">
          <h2 #sectionSubtitle class="font-mono text-xs tracking-[0.25em] text-[#6AA9FF] uppercase mb-4">
            INTELLIGENCE LAYER
          </h2>
          <h3 #sectionTitle class="text-3xl md:text-5xl font-bold tracking-tight text-primary-var uppercase text-glow leading-none font-mono">
            Automated Civic Governance
          </h3>
          <p #sectionDesc class="text-sm md:text-base text-muted-var font-mono mt-6 max-w-xl uppercase tracking-wider">
            Three proprietary neural engines process, predict, and verify citizen grievances in real-time, completely bypassing municipal gridlock.
          </p>
        </div>

        <!-- AI Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Card 1 -->
          <div #card1 class="glass-panel bg-glass-var border-var glow-card rounded-2xl p-8 flex flex-col justify-between min-h-[380px] group transition-all duration-500 hover:-translate-y-2">
            <div>
              <div class="w-12 h-12 rounded-lg border border-[#6AA9FF]/20 bg-[#6AA9FF]/5 flex items-center justify-center text-[#6AA9FF] mb-8 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2m0 0l-3-3m3 3l-3 3M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 12 10z" />
                </svg>
              </div>
              <h4 class="text-xl font-semibold text-primary-var mb-4 uppercase tracking-wide">
                Neural Auto-Routing
              </h4>
              <p class="text-xs text-muted-var leading-relaxed font-mono uppercase">
                Citizen uploads an image of a grievance. Our computer vision models analyze visual tokens, identify the issue, map coordinates, and instantly route the ticket to the exact ward officer.
              </p>
            </div>
            <div class="mt-8 pt-6 border-t border-var flex items-center justify-between text-[10px] font-mono tracking-widest text-[#6AA9FF] uppercase">
              <span>EST. LATENCY: &lt; 850ms</span>
              <span class="group-hover:translate-x-2 transition-transform duration-300">→</span>
            </div>
          </div>

          <!-- Card 2 -->
          <div #card2 class="glass-panel bg-glass-var border-var glow-card rounded-2xl p-8 flex flex-col justify-between min-h-[380px] group transition-all duration-500 hover:-translate-y-2">
            <div>
              <div class="w-12 h-12 rounded-lg border border-[#6AA9FF]/20 bg-[#6AA9FF]/5 flex items-center justify-center text-[#6AA9FF] mb-8 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
              <h4 class="text-xl font-semibold text-primary-var mb-4 uppercase tracking-wide">
                Resolution Forecasting
              </h4>
              <p class="text-xs text-muted-var leading-relaxed font-mono uppercase">
                Predictive Random Forest models analyze department backlog, priority urgency, local ward congestion, and historical SLA data to output resolution timeframes with 95% confidence accuracy.
              </p>
            </div>
            <div class="mt-8 pt-6 border-t border-var flex items-center justify-between text-[10px] font-mono tracking-widest text-[#6AA9FF] uppercase">
              <span>SLA THRESHOLD: 94.2%</span>
              <span class="group-hover:translate-x-2 transition-transform duration-300">→</span>
            </div>
          </div>

          <!-- Card 3 -->
          <div #card3 class="glass-panel bg-glass-var border-var glow-card rounded-2xl p-8 flex flex-col justify-between min-h-[380px] group transition-all duration-500 hover:-translate-y-2">
            <div>
              <div class="w-12 h-12 rounded-lg border border-[#6AA9FF]/20 bg-[#6AA9FF]/5 flex items-center justify-center text-[#6AA9FF] mb-8 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 class="text-xl font-semibold text-primary-var mb-4 uppercase tracking-wide">
                Visual Delta Audit
              </h4>
              <p class="text-xs text-muted-var leading-relaxed font-mono uppercase">
                When an officer marks an issue resolved, the platform performs a dual-image delta audit via CLIP embeddings, comparing the pre-incident state with the post-cleanup scene to verify completion.
              </p>
            </div>
            <div class="mt-8 pt-6 border-t border-var flex items-center justify-between text-[10px] font-mono tracking-widest text-[#6AA9FF] uppercase">
              <span>PROOF OF WORK: GUARANTEED</span>
              <span class="group-hover:translate-x-2 transition-transform duration-300">→</span>
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
export class AiShowcaseComponent implements OnInit, AfterViewInit {
  @ViewChild('showcaseSection') sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('sectionSubtitle') subtitleRef!: ElementRef<HTMLElement>;
  @ViewChild('sectionTitle') titleRef!: ElementRef<HTMLElement>;
  @ViewChild('sectionDesc') descRef!: ElementRef<HTMLElement>;

  @ViewChild('card1') card1Ref!: ElementRef<HTMLElement>;
  @ViewChild('card2') card2Ref!: ElementRef<HTMLElement>;
  @ViewChild('card3') card3Ref!: ElementRef<HTMLElement>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        const trigger = {
          trigger: this.sectionRef.nativeElement,
          start: 'top 75%',
          end: 'bottom 25%',
          toggleActions: 'play none none none',
        };

        // Text reveal animations
        gsap.from(this.subtitleRef.nativeElement, {
          opacity: 0,
          y: 20,
          duration: 0.8,
          scrollTrigger: trigger,
        });

        gsap.from(this.titleRef.nativeElement, {
          opacity: 0,
          y: 30,
          duration: 1.0,
          delay: 0.2,
          scrollTrigger: trigger,
        });

        gsap.from(this.descRef.nativeElement, {
          opacity: 0,
          y: 20,
          duration: 1.0,
          delay: 0.4,
          scrollTrigger: trigger,
        });

        // Cards staggered entrance animation
        gsap.from([this.card1Ref.nativeElement, this.card2Ref.nativeElement, this.card3Ref.nativeElement], {
          opacity: 0,
          y: 60,
          duration: 1.2,
          stagger: 0.2,
          delay: 0.6,
          ease: 'power3.out',
          scrollTrigger: trigger,
        });
      });
    });
  }
}
