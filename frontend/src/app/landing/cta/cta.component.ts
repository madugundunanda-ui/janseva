import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cta',
  imports: [RouterLink],
  template: `
    <section class="py-40 px-6 bg-transparent relative w-full border-t border-var overflow-hidden">
      <!-- Glow ambient background -->
      <div class="absolute bottom-0 right-0 w-[600px] h-[300px] bg-[#6AA9FF]/10 rounded-full blur-[150px] pointer-events-none translate-x-1/3 translate-y-1/3"></div>
      <div class="absolute top-0 left-0 w-[600px] h-[300px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none -translate-x-1/3 -translate-y-1/3"></div>

      <div class="max-w-4xl mx-auto text-center relative z-10">
        <span class="font-mono text-xs tracking-[0.25em] text-[#6AA9FF] uppercase mb-8 block">
          COMMISSION DECISION GRID
        </span>
        <h2 class="text-4xl sm:text-6xl font-bold tracking-tight text-primary-var mb-8 uppercase text-glow leading-none font-mono">
          JOIN THE RESOLUTION NETWORK
        </h2>
        <p class="text-xs sm:text-sm text-muted-var leading-relaxed font-mono uppercase max-w-2xl mx-auto mb-16">
          System deployment active. Register as a citizen to submit issues, or sign in with your officer credentials to access your routing dashboard.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
          <a [routerLink]="['/auth/citizen/register']" class="w-full sm:w-auto px-10 py-5 rounded-full bg-[#6AA9FF] hover:bg-[#5998ee] text-black font-mono font-bold text-xs tracking-wider uppercase shadow-[0_0_30px_rgba(106,169,255,0.3)] hover:scale-105 transition-all duration-300">
            Submit First Grievance
          </a>
          <a [routerLink]="['/auth/citizen/login']" class="w-full sm:w-auto px-10 py-5 rounded-full border border-var bg-glass-var hover:bg-white/10 text-primary-var font-mono text-xs tracking-wider uppercase hover:scale-105 transition-all duration-300">
            Access Portal
          </a>
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
export class CtaComponent {}
