import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { TranslationService, LanguageCode } from '../../../core/services/translation.service';

@Component({
  selector: 'app-supervisor-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-transparent text-primary-var flex relative overflow-hidden tech-dots-bg w-screen h-screen">
      
      <!-- Glow ambient backdrops -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <!-- Floating Sidebar Navigation -->
      <aside class="w-64 glass-panel border-r border-var flex flex-col justify-between p-6 m-4 mr-0 rounded-2xl relative z-10 bg-black/40 border border-white/10">
        <div>
          <!-- Console Logo -->
          <div class="flex items-center gap-3 mb-10 pb-6 border-b border-white/10">
            <div class="w-7 h-7 rounded-full border border-amber-500/40 flex items-center justify-center bg-amber-950/20">
              <div class="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            </div>
            <span class="font-mono text-xs tracking-[0.15em] uppercase font-bold text-glow text-white">
              JANSEVA <span class="text-amber-400">GOVERN</span>
            </span>
          </div>

          <!-- User Card -->
          <div class="mb-8 p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold font-mono text-black text-sm uppercase shrink-0 text-white">
              {{ (authService.currentUser()?.name || 'S')[0] }}
            </div>
            <div class="overflow-hidden">
              <div class="font-semibold text-xs tracking-wide truncate text-white uppercase">{{ authService.currentUser()?.name }}</div>
              <div class="font-mono text-[9px] tracking-wider text-amber-400 uppercase mt-0.5">{{ authService.currentUser()?.role }}</div>
            </div>
          </div>

          <!-- Nav List -->
          <nav class="space-y-1.5 font-mono text-[11px] uppercase tracking-wider">
            <!-- Home -->
            <a [routerLink]="['/dashboard/supervisor']" [routerLinkActiveOptions]="{exact: true}" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              SUPERVISOR HOME
            </a>

            <!-- Workload Complaints -->
            <a [routerLink]="['/dashboard/supervisor/complaints']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              WARD WORKLOAD
            </a>

            <!-- Core Analytics -->
            <a [routerLink]="['/dashboard/supervisor/analytics']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
              PERFORMANCE
            </a>

            <!-- Officers Workload -->
            <a [routerLink]="['/dashboard/supervisor/officers']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              OFFICERS ROSTER
            </a>

            <!-- Hotspot Node Map -->
            <a [routerLink]="['/dashboard/supervisor/maps']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              HOTSPOT MAP
            </a>

            <!-- Settings -->
            <a [routerLink]="['/dashboard/supervisor/settings']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              CONSOLE SETTINGS
            </a>
          </nav>
        </div>

        <!-- Logout Trigger -->
        <button (click)="logout()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-red-400/50 hover:text-red-400 hover:bg-red-950/10 font-mono text-[11px] uppercase tracking-wider transition-all duration-200 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {{ translationService.t('DE_AUTHENTICATE') }}
        </button>
      </aside>

      <!-- Main Section Container -->
      <main class="flex-1 flex flex-col p-4 overflow-y-auto h-screen relative z-10">
        <!-- Dashboard Top Header Bar -->
        <header class="h-16 glass-panel rounded-xl px-6 flex items-center justify-between mb-4 border border-white/10 bg-black/45">
          <div class="flex items-center gap-4">
            <h1 class="font-mono text-xs tracking-widest text-muted-var uppercase text-gray-300">JANSEVA GOVERNANCE MANAGEMENT // ADMINISTRATIVE CONTROL</h1>
          </div>
          <div class="flex items-center gap-4">
            <!-- Language Switcher -->
            <select [value]="translationService.currentLang()" (change)="onLanguageChange($event)" class="px-2.5 py-1 rounded-full border border-white/10 bg-black text-white font-mono text-[9px] tracking-wider uppercase bg-transparent outline-none cursor-pointer hover:border-amber-500/50 transition-colors">
              <option value="en" class="bg-black text-white">EN</option>
              <option value="te" class="bg-black text-white">TE (తెలుగు)</option>
              <option value="ta" class="bg-black text-white">TA (தமிழ்)</option>
              <option value="kn" class="bg-black text-white">KN (ಕನ್ನಡ)</option>
            </select>

            <div class="flex items-center gap-2 px-3 py-1 rounded bg-emerald-950/20 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 uppercase tracking-widest animate-pulse">
              <span>● {{ translationService.t('NODE_LIVE') }}</span>
            </div>
            <a href="/" class="text-[10px] font-mono text-muted-var hover:text-white uppercase tracking-wider transition-colors duration-200 text-gray-400">{{ translationService.t('RETURN_HOME') }}</a>
          </div>
        </header>

        <!-- Viewport outlet wrapper -->
        <div class="flex-1 overflow-y-auto">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    ::ng-deep .active-nav {
      background: rgba(255, 255, 255, 0.05) !important;
      border-color: rgba(245, 158, 11, 0.3) !important;
      color: white !important;
      text-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
    }
  `]
})
export class SupervisorLayoutComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  public translationService = inject(TranslationService);
  private router = inject(Router);

  ngOnInit(): void {
    this.notificationsService.connect();
  }

  ngOnDestroy(): void {
    this.notificationsService.disconnect();
  }

  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.translationService.setLang(select.value as LanguageCode);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
