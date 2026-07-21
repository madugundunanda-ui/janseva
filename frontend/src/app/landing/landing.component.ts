import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { TranslationService, LanguageCode } from '../core/services/translation.service';
import { DemoModeService } from '../core/services/demo-mode.service';

import { WelcomeComponent } from '../core/components/welcome/welcome.component';
import { WhyJansevaComponent } from './why-janseva/why-janseva.component';
import { GovernmentUpdatesComponent } from './government-updates/government-updates.component';
import { HowToUseComponent } from './how-to-use/how-to-use.component';
import { GlobeFooterComponent } from './globe-footer/globe-footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    WelcomeComponent,
    WhyJansevaComponent,
    GovernmentUpdatesComponent,
    HowToUseComponent,
    GlobeFooterComponent
  ],
  template: `
    <!-- JANSEVA Initialization Splash Experience (Shown only on first visit) -->
    <app-welcome *ngIf="showWelcome" (completed)="onWelcomeCompleted()"></app-welcome>

    <div class="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      <!-- Top Fixed Enterprise Glass Header -->
      <header class="fixed top-0 left-0 right-0 z-50 h-16 glass-header border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
        <!-- Logo & System Status Indicator -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              J
            </div>
            <div>
              <span class="font-bold text-base tracking-tight text-slate-900 leading-none block">JANSEVA</span>
              <span class="text-[10px] text-indigo-600 font-semibold tracking-wider uppercase block">National AI Governance Platform</span>
            </div>
          </div>

          <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All Services Operational
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600">
          <a href="#overview" class="hover:text-indigo-600 transition-colors">Platform Overview</a>
          <a href="#why-janseva" class="hover:text-indigo-600 transition-colors">Why JANSEVA</a>
          <a href="#updates" class="hover:text-indigo-600 transition-colors">Government Updates</a>
          <a href="#how-to-use" class="hover:text-indigo-600 transition-colors">How to Use</a>
        </nav>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <!-- Language Selector -->
          <select [value]="translationService.currentLang()" (change)="onLanguageChange($event)" class="select-field text-xs py-1.5 px-2.5 w-auto bg-white border border-slate-200">
            <option value="en">English (EN)</option>
            <option value="te">తెలుగు (TE)</option>
            <option value="ta">தமிழ் (TA)</option>
            <option value="kn">ಕನ್ನಡ (KN)</option>
            <option value="hi">हिंदी (HI)</option>
          </select>

          <a [routerLink]="['/auth/citizen/login']" class="btn-secondary text-xs py-2 px-4 font-semibold">Sign In</a>
          
          <div class="flex flex-col items-end">
            <a [routerLink]="['/auth/citizen/register']" class="btn-primary text-xs py-2 px-4 font-semibold">
              Register
            </a>
            <span class="text-[10px] text-slate-500 font-medium hidden sm:inline-block">
              Already registered? <a [routerLink]="['/auth/citizen/login']" class="text-indigo-600 font-bold hover:underline">Sign In</a>
            </span>
          </div>
        </div>
      </header>

      <main class="pt-16">
        
        <!-- SECTION 1: HERO OVERVIEW -->
        <section id="overview" class="py-16 md:py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-6">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              National AI Governance Infrastructure
            </div>

            <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              AI Governance Platform <br>
              <span class="text-indigo-600">Transforming Citizen Services through Artificial Intelligence.</span>
            </h1>

            <p class="text-sm md:text-base text-slate-600 font-normal leading-relaxed">
              Fast. Transparent. Accountable. JANSEVA connects Citizens, Government Departments, Field Officers, Supervisors, and AI into one intelligent governance ecosystem that eliminates delays, guarantees transparency, and optimizes public service delivery.
            </p>

            <!-- Hero Buttons -->
            <div class="flex items-center gap-4 pt-2">
              <a [routerLink]="['/auth/citizen/register']" class="btn-primary py-3.5 px-8 text-sm font-semibold">
                Register Now
              </a>
              <a [routerLink]="['/auth/citizen/login']" class="btn-secondary py-3.5 px-8 text-sm font-semibold">
                Sign In
              </a>
            </div>

            <!-- Ticker Stats -->
            <div class="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
              <div>
                <span class="text-2xl font-extrabold text-slate-900 font-mono">{{ demoService.totalGrievances() | number }}</span>
                <span class="text-xs text-slate-500 font-medium block">Total Grievances</span>
              </div>
              <div>
                <span class="text-2xl font-extrabold text-emerald-600 font-mono">{{ demoService.resolvedGrievances() | number }}</span>
                <span class="text-xs text-slate-500 font-medium block">Verified Resolutions</span>
              </div>
              <div>
                <span class="text-2xl font-extrabold text-indigo-600 font-mono">{{ demoService.slaCompliance() }}%</span>
                <span class="text-xs text-slate-500 font-medium block">SLA Target Index</span>
              </div>
            </div>
          </div>

          <!-- Right Live Governance Command Center Preview -->
          <div class="card-surface p-6 space-y-4 shadow-xl border-slate-200 bg-white relative overflow-hidden rounded-3xl">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-rose-500"></span>
                <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span class="text-xs font-mono font-semibold text-slate-600 ml-2">Live Governance Stream</span>
              </div>
              <span class="badge-status badge-progress">Live Telemetry</span>
            </div>

            <div class="space-y-3 font-sans text-xs">
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-900 block">AI Triage Stream</span>
                  <span class="text-slate-500">Gemini Vision & NLP Model Active</span>
                </div>
                <span class="font-mono text-indigo-600 font-bold">96.8% Accuracy</span>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-900 block">Smart Officer Dispatch</span>
                  <span class="text-slate-500">Ward 12 Main Line • Assigned to Water Works</span>
                </div>
                <span class="font-mono text-emerald-600 font-bold">Auto-Routed</span>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-900 block">Visual Proof Match</span>
                  <span class="text-slate-500">Before / After Photo Delta Verification</span>
                </div>
                <span class="font-mono text-emerald-600 font-bold">Passed (0.94 Delta)</span>
              </div>
            </div>
          </div>
        </section>

        <!-- SECTION 2: WHY JANSEVA (QUALITATIVE CAPABILITY MATRIX) -->
        <app-why-janseva></app-why-janseva>

        <!-- SECTION 3: GOVERNMENT UPDATES (TIMELINE & SEARCH) -->
        <app-government-updates></app-government-updates>

        <!-- SECTION 4: HOW TO USE (SYNCHRONIZED VOICE GUIDE) -->
        <app-how-to-use></app-how-to-use>

      </main>

      <!-- GLOBAL FOOTER -->
      <app-globe-footer></app-globe-footer>

    </div>
  `
})
export class LandingComponent implements OnInit {
  authService = inject(AuthService);
  translationService = inject(TranslationService);
  demoService = inject(DemoModeService);
  private router = inject(Router);

  showWelcome = false;

  ngOnInit(): void {
    // Returning User Auto-Redirect: Send authenticated users directly to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Check if initialization welcome screen has been seen before
    if (typeof window !== 'undefined') {
      const welcomeSeen = window.localStorage.getItem('welcomeSeen');
      if (welcomeSeen !== 'true') {
        this.showWelcome = true;
      }
    }
  }

  onWelcomeCompleted(): void {
    this.showWelcome = false;
  }

  onLanguageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.translationService.setLang(select.value as LanguageCode);
  }
}
