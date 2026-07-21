import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { TranslationService, LanguageCode } from '../../../core/services/translation.service';
import { DemoModeService } from '../../../core/services/demo-mode.service';
import { NotificationCenterComponent } from '../../components/notification-center/notification-center.component';
import { VoiceAssistantWidgetComponent } from '../../components/voice-assistant-widget/voice-assistant-widget.component';

@Component({
  selector: 'app-officer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NotificationCenterComponent, VoiceAssistantWidgetComponent],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row w-full h-screen overflow-hidden font-sans">
      
      <!-- Collapsible / Adaptive Sidebar -->
      <aside class="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 z-20">
        <div class="space-y-6">
          
          <!-- Logo -->
          <div class="flex items-center gap-3 px-2 py-1">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              J
            </div>
            <div>
              <span class="font-bold text-base tracking-tight text-slate-900 leading-none block">JANSEVA</span>
              <span class="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider block">Officer Portal</span>
            </div>
          </div>

          <!-- User Info Badge -->
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {{ (authService.currentUser()?.name || 'O')[0] }}
            </div>
            <div class="overflow-hidden">
              <div class="font-semibold text-xs text-slate-900 truncate">{{ authService.currentUser()?.name || 'Field Officer' }}</div>
              <div class="text-[10px] text-indigo-600 font-medium uppercase">Field Operations</div>
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="space-y-1 text-xs font-medium">
            <a [routerLink]="['/dashboard/officer']" 
               [routerLinkActiveOptions]="{exact: true}" 
               routerLinkActive="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold" 
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
              <span>🏠</span>
              <span>Overview</span>
            </a>

            <a [routerLink]="['/dashboard/officer/complaints']" 
               routerLinkActive="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold" 
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
              <span>⚡</span>
              <span>Active Queue</span>
            </a>

            <a [routerLink]="['/dashboard/officer/maps']" 
               routerLinkActive="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold" 
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
              <span>📍</span>
              <span>Hotspot Map</span>
            </a>

            <a [routerLink]="['/dashboard/officer/settings']" 
               routerLinkActive="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold" 
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
              <span>⚙️</span>
              <span>Console Settings</span>
            </a>
          </nav>
        </div>

        <!-- Logout Trigger -->
        <button (click)="logout()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent text-rose-600 hover:bg-rose-50 font-medium text-xs transition-all">
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </aside>

      <!-- Main Portal Container -->
      <main class="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-50">
        
        <!-- Portal Header -->
        <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <div class="flex items-center gap-3">
            <h1 class="text-sm font-semibold text-slate-800">Field Officer Operations Console</h1>
          </div>

          <div class="flex items-center gap-3">
            <!-- Hackathon Demo Mode Toggle -->
            <button (click)="demoService.toggleDemoMode()" 
                    class="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
                    [class.border-indigo-500]="demoService.demoActive()">
              <span class="w-2 h-2 rounded-full" [ngClass]="demoService.demoActive() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></span>
              <span class="hidden sm:inline">Demo Mode</span>
            </button>

            <!-- Notifications -->
            <app-notification-center></app-notification-center>

            <!-- Language Switcher -->
            <select [value]="translationService.currentLang()" (change)="onLanguageChange($event)" class="select-field text-xs py-1 px-2.5 w-auto">
              <option value="en">EN</option>
              <option value="te">TE</option>
              <option value="ta">TA</option>
              <option value="kn">KN</option>
            </select>

            <a href="/" class="text-xs text-slate-500 hover:text-slate-900 font-medium">Home</a>
          </div>
        </header>

        <!-- Viewport Content -->
        <div class="flex-1 p-6">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>

    <!-- Copilot Assistant Slide-Over Drawer -->
    <app-voice-assistant-widget></app-voice-assistant-widget>
  `
})
export class OfficerLayoutComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  public translationService = inject(TranslationService);
  public demoService = inject(DemoModeService);
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
    this.router.navigate(['/officer/login']);
  }
}
