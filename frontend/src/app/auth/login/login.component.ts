import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService, LanguageCode } from '../../core/services/translation.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule, CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 relative overflow-hidden tech-dots-bg">
      <!-- Glow ambient background (Dynamic based on selected role) -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all duration-500"
           [ngClass]="selectedRole === 'citizen' ? 'bg-[#A33F93]/15' : 'bg-[#06b6d4]/15'"></div>

      <!-- Login Card -->
      <div class="w-full max-w-md glass-panel glow-card rounded-2xl p-8 relative z-10 border transition-colors duration-500"
           [ngClass]="selectedRole === 'citizen' ? 'hover:border-[#A33F93]/35' : 'hover:border-[#06b6d4]/35'">
        
        <!-- Header with Language Switcher -->
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full animate-pulse transition-colors duration-500"
                  [ngClass]="selectedRole === 'citizen' ? 'bg-[#A33F93]' : 'bg-[#06b6d4]'"></span>
            <span class="font-mono text-[9px] tracking-widest uppercase transition-colors duration-500"
                  [ngClass]="selectedRole === 'citizen' ? 'text-[#A33F93]' : 'text-[#06b6d4]'">
              {{ selectedRole === 'citizen' ? translationService.t('SECURE_GATEWAY') : 'GOVERNMENT OPERATIONAL GATEWAY' }}
            </span>
          </div>
          <!-- Language Switcher -->
          <select [value]="translationService.currentLang()" (change)="onLanguageChange($event)" 
                  class="px-2.5 py-1 rounded-full border border-var bg-glass-var text-primary-var font-mono text-[9px] tracking-wider uppercase bg-transparent outline-none cursor-pointer transition-colors"
                  [ngClass]="selectedRole === 'citizen' ? 'hover:border-[#A33F93]/50' : 'hover:border-[#06b6d4]/50'">
            <option value="en" class="bg-black text-white">EN</option>
            <option value="te" class="bg-black text-white">TE (తెలుగు)</option>
            <option value="ta" class="bg-black text-white">TA (தமிழ்)</option>
            <option value="kn" class="bg-black text-white">KN (ಕನ್ನಡ)</option>
          </select>
        </div>

        <!-- Segmented Role Selector -->
        <div class="mb-6">
          <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2.5 block text-center font-bold">Continue as</label>
          <div class="grid grid-cols-4 gap-1.5 p-1 bg-white/5 border border-var rounded-xl">
            <button type="button" 
                    (click)="selectRole('citizen')" 
                    [class.active-role-citizen]="selectedRole === 'citizen'"
                    class="py-2 rounded-lg font-mono text-[9px] uppercase tracking-wider text-muted-var hover:text-primary-var transition-all duration-300 cursor-pointer">
              Citizen
            </button>
            <button type="button" 
                    (click)="selectRole('officer')" 
                    [class.active-role-gov]="selectedRole === 'officer'"
                    class="py-2 rounded-lg font-mono text-[9px] uppercase tracking-wider text-muted-var hover:text-primary-var transition-all duration-300 cursor-pointer">
              Officer
            </button>
            <button type="button" 
                    (click)="selectRole('supervisor')" 
                    [class.active-role-gov]="selectedRole === 'supervisor'"
                    class="py-2 rounded-lg font-mono text-[9px] uppercase tracking-wider text-muted-var hover:text-primary-var transition-all duration-300 cursor-pointer">
              Superv.
            </button>
            <button type="button" 
                    (click)="selectRole('admin')" 
                    [class.active-role-gov]="selectedRole === 'admin'"
                    class="py-2 rounded-lg font-mono text-[9px] uppercase tracking-wider text-muted-var hover:text-primary-var transition-all duration-300 cursor-pointer">
              Admin
            </button>
          </div>
        </div>

        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold tracking-tight uppercase font-mono text-glow transition-all duration-500">
            {{ selectedRole === 'citizen' ? translationService.t('CONSOLE_SIGN_IN') : 'STAFF AUTHENTICATION' }}
          </h2>
        </div>

        <!-- Elegant Highlight Card based on role -->
        @if (selectedRole === 'citizen') {
          <div class="mb-6 p-4 rounded-xl border border-amber-500/25 bg-amber-950/15 text-amber-200 font-mono text-[10px] uppercase tracking-wide leading-relaxed flex items-start gap-3 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              {{ translationService.t('ONLY_NEW_CITIZENS') }}
            </div>
          </div>
        } @else {
          <div class="mb-6 p-4 rounded-xl border border-blue-500/25 bg-blue-950/15 text-blue-200 font-mono text-[9.5px] uppercase tracking-wide leading-relaxed flex items-start gap-3 shadow-[0_0_15px_rgba(59,130,246,0.08)] animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-[#6AA9FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              Authorized Government Personnel Only. System Access Logs Active // Unauthorized Access Logged.
            </div>
          </div>
        }

        @if (errorMessage) {
          <div class="mb-6 p-4 rounded bg-red-100 border border-red-300 text-red-700 font-mono text-xs uppercase tracking-wide">
            {{ errorMessage }}
          </div>
        }

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <div class="flex flex-col">
            <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('EMAIL_ADDRESS') }}</label>
            <input type="email" name="email" [(ngModel)]="credentials.email" required 
                   class="glass-input transition-all duration-300" 
                   [ngClass]="selectedRole === 'citizen' ? '' : 'accent-gov-input'"
                   placeholder="e.g. citizen@gmail.com">
          </div>

          <div class="flex flex-col">
            <div class="flex justify-between items-center mb-2">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase">{{ translationService.t('PASSWORD') }}</label>
              <a href="#" class="font-mono text-[9px] uppercase transition-colors duration-300"
                 [ngClass]="selectedRole === 'citizen' ? 'text-[#A33F93] hover:opacity-80' : 'text-[#06b6d4] hover:opacity-80'">
                {{ translationService.t('FORGOT_SECRET') }}
              </a>
            </div>
            <input type="password" name="password" [(ngModel)]="credentials.password" required 
                   class="glass-input transition-all duration-300" 
                   [ngClass]="selectedRole === 'citizen' ? '' : 'accent-gov-input'"
                   placeholder="••••••••">
          </div>

          <button type="submit" [disabled]="loading" 
                  class="w-full py-3.5 rounded font-mono font-bold text-xs tracking-wider uppercase transition-all duration-500 disabled:opacity-50 cursor-pointer"
                  [ngClass]="selectedRole === 'citizen' ? 'bg-[#A33F93] hover:bg-[#8c357f] text-white shadow-[0_0_15px_rgba(163,63,147,0.25)]' : 'bg-[#06b6d4] hover:bg-[#0891b2] text-black shadow-[0_0_15px_rgba(6,182,212,0.25)]'">
            @if (loading) {
              DECODING AUTH...
            } @else {
              {{ translationService.t('AUTHENTICATE_GATEWAY') }}
            }
          </button>
        </form>

        <!-- Only show registration links for Citizen role -->
        @if (selectedRole === 'citizen') {
          <div class="mt-6 text-center text-xs font-mono text-muted-var">
            {{ translationService.t('NEW_NODE') }} 
            <a [routerLink]="['/auth/register']" class="text-[#A33F93] hover:opacity-80 uppercase ml-1 font-bold">{{ translationService.t('REGISTER_CORE') }}</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .active-role-citizen {
      background: #A33F93 !important;
      color: white !important;
      box-shadow: 0 0 10px rgba(163, 63, 147, 0.4);
      text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    }
    .active-role-gov {
      background: #06b6d4 !important;
      color: black !important;
      box-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
      font-weight: bold;
    }
    .accent-gov-input:focus {
      border-color: #06b6d4 !important;
      box-shadow: 0 0 14px rgba(6, 182, 212, 0.2) !important;
    }
  `]
})
export class LoginComponent implements OnInit {
  credentials = {
    email: '',
    password: '',
  };
  selectedRole: 'citizen' | 'officer' | 'supervisor' | 'admin' = 'citizen';
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    public translationService: TranslationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.redirectToDashboard();
    }
  }

  selectRole(role: 'citizen' | 'officer' | 'supervisor' | 'admin') {
    this.selectedRole = role;
    this.errorMessage = '';
    // Auto-fill template placeholders for quick testing of officer and supervisor
    if (role === 'admin') {
      this.credentials.email = 'admin@janseva.gov.in';
    } else if (role === 'supervisor') {
      this.credentials.email = 'supervisor@works.janseva.gov.in';
    } else if (role === 'officer') {
      this.credentials.email = 'officer@sanitation.janseva.gov.in';
    } else {
      this.credentials.email = '';
    }
  }

  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.translationService.setLang(select.value as LanguageCode);
  }

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';

    const payload = {
      email: this.credentials.email,
      password: this.credentials.password,
      role: this.selectedRole
    };

    this.authService.login(payload).subscribe({
      next: (res) => {
        this.redirectToDashboard(res?.user?.role);
      },
      error: (err) => {
        if (err.status === 401 && err.message?.toLowerCase().includes('role')) {
          this.errorMessage = "The requested role does not match this user's account role.";
        } else {
          this.errorMessage = err.message || 'Authentication Gateway Rejected Credentials';
        }
        this.loading = false;
      },
    });
  }

  redirectToDashboard(role?: string) {
    const userRole = role || this.authService.userRole();
    if (userRole === 'citizen') {
      this.router.navigate(['/dashboard/citizen']);
    } else if (userRole === 'officer') {
      this.router.navigate(['/dashboard/officer']);
    } else if (userRole === 'supervisor') {
      this.router.navigate(['/dashboard/supervisor']);
    } else if (userRole === 'admin') {
      this.router.navigate(['/dashboard/admin']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
