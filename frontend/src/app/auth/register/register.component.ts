import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService, LanguageCode } from '../../core/services/translation.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 relative overflow-hidden tech-dots-bg">
      <!-- Glow backdrop -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#A33F93]/15 rounded-full blur-[120px] pointer-events-none"></div>

      <!-- Register Card -->
      <div class="w-full max-w-lg glass-panel glow-card rounded-2xl p-8 relative z-10">
        
        <!-- Header with Language Switcher -->
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#A33F93] animate-pulse"></span>
            <span class="font-mono text-[9px] tracking-widest text-[#A33F93] uppercase">{{ translationService.t('SECURE_GATEWAY') }}</span>
          </div>
          <!-- Language Switcher -->
          <select [value]="translationService.currentLang()" (change)="onLanguageChange($event)" class="px-2.5 py-1 rounded-full border border-var bg-glass-var text-primary-var font-mono text-[9px] tracking-wider uppercase bg-transparent outline-none cursor-pointer hover:border-[#A33F93]/50 transition-colors">
            <option value="en" class="bg-black text-white">EN</option>
            <option value="te" class="bg-black text-white">TE (తెలుగు)</option>
            <option value="ta" class="bg-black text-white">TA (தமிழ்)</option>
            <option value="kn" class="bg-black text-white">KN (ಕನ್ನಡ)</option>
          </select>
        </div>

        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold tracking-tight uppercase font-mono text-glow">{{ translationService.t('CREATE_NODE') }}</h2>
        </div>

        @if (errorMessage) {
        <div class="mb-6 p-4 rounded bg-red-100 border border-red-300 text-red-700 font-mono text-xs uppercase tracking-wide">
          {{ errorMessage }}
        </div>
        }

        <!-- Signup Form -->
        <form (ngSubmit)="onSubmit()" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('NAME') }}</label>
              <input type="text" name="name" [(ngModel)]="userData.name" required class="glass-input" [placeholder]="translationService.t('PH_NAME_EXAMPLE')">
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('EMAIL_ADDRESS') }}</label>
              <input type="email" name="email" [(ngModel)]="userData.email" (ngModelChange)="validateEmail()" required class="glass-input" [placeholder]="translationService.t('PH_EMAIL_EXAMPLE')">
              @if (emailError) {
                <span class="text-red-500 text-[10px] mt-1 font-mono">{{ emailError }}</span>
              }
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('PHONE_NUMBER') }}</label>
              <input type="text" name="phone" [(ngModel)]="userData.phone" required class="glass-input" [placeholder]="translationService.t('PH_PHONE_EXAMPLE')">
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('ADDRESS') }}</label>
              <input type="text" name="address" [(ngModel)]="userData.address" required class="glass-input" [placeholder]="translationService.t('PH_ADDRESS_MUMBAI')">
            </div>
          </div>

          <div class="flex flex-col">
            <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('PASSWORD') }}</label>
            <div class="relative">
              <input [type]="showPassword ? 'text' : 'password'" name="password" [(ngModel)]="userData.password" required class="glass-input w-full pr-10" [placeholder]="translationService.t('PH_PASSWORD')">
              <button type="button" (click)="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-var hover:text-primary-var transition-colors">
                <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                  <line x1="2" y1="2" x2="22" y2="22"></line>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" [disabled]="loading || !isFormValid" class="w-full mt-2 py-3.5 rounded bg-[#A33F93] hover:bg-[#8c357f] text-white font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 disabled:opacity-50">
            @if (loading) {
              <span>{{ translationService.t('REGISTERING') }}</span>
            } @else {
              <span>{{ translationService.t('INIT_REGISTER') }}</span>
            }
          </button>
        </form>

        <div class="mt-6 text-center text-[10px] font-mono text-muted-var">
          {{ translationService.t('ALREADY_ACTIVE') }} 
          <a [routerLink]="['/auth/citizen/login']" class="text-[#A33F93] hover:opacity-80 uppercase ml-1 font-bold">{{ translationService.t('CONSOLE_LOGIN') }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class RegisterComponent implements OnInit {
  userData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    role: 'citizen' as const,
  };
  loading = false;
  errorMessage = '';
  emailError = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    public translationService: TranslationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.translationService.setLang(select.value as LanguageCode);
  }

  validateEmail() {
    if (this.userData.role === 'citizen') {
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (this.userData.email && !gmailRegex.test(this.userData.email)) {
        this.emailError = 'Please enter a valid Gmail address. Only @gmail.com accounts are allowed.';
      } else {
        this.emailError = '';
      }
    }
  }

  get isFormValid() {
    if (!this.userData.name || !this.userData.email || !this.userData.phone || !this.userData.address || !this.userData.password) {
      return false;
    }
    if (this.userData.role === 'citizen') {
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!gmailRegex.test(this.userData.email)) {
        return false;
      }
    }
    return true;
  }

  onSubmit() {
    if (!this.isFormValid) return;
    this.loading = true;
    this.errorMessage = '';
    console.log('Registering user payload:', this.userData);
    this.authService.register(this.userData).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Registration error occurred:', err);
        const friendly = err?.friendlyMessage || err?.error?.message || err?.message || '';
        this.errorMessage = friendly || 'Registration rejected by authentication module.';
        this.loading = false;
      },
    });
  }
}

