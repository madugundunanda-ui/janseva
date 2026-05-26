import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationsService } from '../core/services/notifications.service';
import { TranslationService, LanguageCode } from '../core/services/translation.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-transparent text-primary-var flex relative overflow-hidden tech-dots-bg">
      
      <!-- Glow ambient backdrops -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <!-- Floating Sidebar Navigation -->
      <aside class="w-64 glass-panel border-r border-var flex flex-col justify-between p-6 m-4 mr-0 rounded-2xl relative z-10">
        <div>
          <!-- Console Logo -->
          <div class="flex items-center gap-3 mb-10 pb-6 border-b border-var">
            <div class="w-7 h-7 rounded-full border border-cyan-500/40 flex items-center justify-center bg-cyan-950/20">
              <div class="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
            </div>
            <span class="font-mono text-xs tracking-[0.15em] uppercase font-bold text-glow">
              JANSEVA <span class="text-cyan-400">AI</span>
            </span>
          </div>

          <!-- User Card -->
          <div class="mb-8 p-3.5 rounded-xl bg-white/2 border border-var flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-bold font-mono text-black text-sm uppercase">
              {{ (authService.currentUser()?.name || 'C')[0] }}
            </div>
            <div class="overflow-hidden">
              <div class="font-semibold text-xs tracking-wide truncate text-primary-var uppercase">{{ authService.currentUser()?.name }}</div>
              <div class="font-mono text-[9px] tracking-wider text-cyan-400 uppercase mt-0.5">{{ authService.currentUser()?.role }}</div>
            </div>
          </div>

          <!-- Nav List -->
          <nav class="space-y-1.5 font-mono text-[11px] uppercase tracking-wider">
            <!-- Role-Specific Dashboard Link -->
            @if (authService.userRole() === 'citizen') {
              <a [routerLink]="['/dashboard/citizen']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-muted-var hover:text-primary-var hover:bg-white/3 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                CITIZEN PANEL
              </a>
            } @else if (authService.userRole() === 'officer') {
              <a [routerLink]="['/dashboard/officer']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-muted-var hover:text-primary-var hover:bg-white/3 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                OFFICER OPERATIONS
              </a>
            } @else if (authService.userRole() === 'supervisor') {
              <a [routerLink]="['/dashboard/supervisor']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-muted-var hover:text-primary-var hover:bg-white/3 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                GOVERNANCE CONTROL
              </a>
            } @else if (authService.userRole() === 'admin') {
              <a [routerLink]="['/dashboard/admin']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-muted-var hover:text-primary-var hover:bg-white/3 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                SYSADMIN CONTROL
              </a>
            }

            <!-- Universal Complaints -->
            <a [routerLink]="['/dashboard/complaints']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-muted-var hover:text-primary-var hover:bg-white/3 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {{ translationService.t('GRIEVANCE_FEED') }}
            </a>

            <!-- Admin/Supervisor Analytics -->
            @if (canAccess(['admin', 'supervisor', 'officer'])) {
              <a [routerLink]="['/dashboard/analytics']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-muted-var hover:text-primary-var hover:bg-white/3 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                {{ translationService.t('CORE_ANALYTICS') }}
              </a>
            }

            <!-- AI Insights -->
            <a [routerLink]="['/dashboard/ai-insights']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-muted-var hover:text-primary-var hover:bg-white/3 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {{ translationService.t('AI_PREDICTIONS') }}
            </a>

            <!-- Officers Workload -->
            @if (canAccess(['admin', 'supervisor', 'officer'])) {
              <a [routerLink]="['/dashboard/officers']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-muted-var hover:text-primary-var hover:bg-white/3 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {{ translationService.t('OFFICER_GRID') }}
              </a>
            }

            <!-- Citizens Roster -->
            @if (canAccess(['admin', 'supervisor'])) {
              <a [routerLink]="['/dashboard/citizens']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-muted-var hover:text-primary-var hover:bg-white/3 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {{ translationService.t('CITIZEN_NODES') }}
              </a>

              <!-- Intelligence Reports -->
              <a [routerLink]="['/dashboard/reports']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-muted-var hover:text-primary-var hover:bg-white/3 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {{ translationService.t('CORE_REPORTS') }}
              </a>
            }

            <!-- Hotspot Node Map -->
            <a [routerLink]="['/dashboard/maps']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-muted-var hover:text-primary-var hover:bg-white/3 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ translationService.t('HOTSPOT_MAP') }}
            </a>

            <!-- System Settings -->
            <a [routerLink]="['/dashboard/settings']" routerLinkActive="active-nav" class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent text-muted-var hover:text-primary-var hover:bg-white/3 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ translationService.t('CONSOLE_SETTINGS') }}
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
        <header class="h-16 glass-panel rounded-xl px-6 flex items-center justify-between mb-4 border border-var">
          <div class="flex items-center gap-4">
            <h1 class="font-mono text-xs tracking-widest text-muted-var uppercase">{{ getConsoleTitle() }}</h1>
          </div>
          <div class="flex items-center gap-4">
            <!-- Language Switcher in Dashboard -->
            <select [value]="translationService.currentLang()" (change)="onLanguageChange($event)" class="px-2.5 py-1 rounded-full border border-var bg-glass-var text-primary-var font-mono text-[9px] tracking-wider uppercase bg-transparent outline-none cursor-pointer hover:border-[#06b6d4]/50 transition-colors">
              <option value="en" class="bg-black text-white">EN</option>
              <option value="te" class="bg-black text-white">TE (తెలుగు)</option>
              <option value="ta" class="bg-black text-white">TA (தமிழ்)</option>
              <option value="kn" class="bg-black text-white">KN (ಕನ್ನಡ)</option>
            </select>

            <div class="flex items-center gap-2 px-3 py-1 rounded bg-emerald-950/20 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 uppercase tracking-widest animate-pulse">
              <span>● {{ translationService.t('NODE_LIVE') }}</span>
            </div>
            <a href="/" class="text-[10px] font-mono text-muted-var hover:text-primary-var uppercase tracking-wider transition-colors duration-200">{{ translationService.t('RETURN_HOME') }}</a>
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
      border-color: rgba(6, 182, 212, 0.3) !important;
      color: white !important;
      text-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  constructor(
    public authService: AuthService,
    private notificationsService: NotificationsService,
    public translationService: TranslationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notificationsService.connect();
    if (this.router.url === '/dashboard' || this.router.url === '/dashboard/') {
      this.redirectToRoleDashboard();
    }
  }

  redirectToRoleDashboard() {
    const role = this.authService.userRole();
    if (role === 'citizen') {
      this.router.navigate(['/dashboard/citizen']);
    } else if (role === 'officer') {
      this.router.navigate(['/dashboard/officer']);
    } else if (role === 'supervisor') {
      this.router.navigate(['/dashboard/supervisor']);
    } else if (role === 'admin') {
      this.router.navigate(['/dashboard/admin']);
    } else {
      this.router.navigate(['/dashboard/complaints']);
    }
  }

  getConsoleTitle(): string {
    const role = this.authService.userRole();
    if (role === 'citizen') {
      return 'JANSEVA CITIZEN PORTAL // WARD INTAKE CONSOLE';
    } else if (role === 'officer') {
      return 'JANSEVA OFFICER OPERATIONS // SERVICE DISPATCH CENTER';
    } else if (role === 'supervisor') {
      return 'JANSEVA GOVERNANCE MANAGEMENT // ADMINISTRATIVE CONTROL';
    } else if (role === 'admin') {
      return 'JANSEVA STATE INTELLIGENCE CONTROL CENTER // MAIN CONSOLE';
    }
    return this.translationService.t('ACTIVE_CONSOLE');
  }

  ngOnDestroy(): void {
    this.notificationsService.disconnect();
  }

  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.translationService.setLang(select.value as LanguageCode);
  }

  canAccess(roles: string[]): boolean {
    const userRole = this.authService.userRole();
    return userRole ? roles.includes(userRole) : false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

