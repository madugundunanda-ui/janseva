import { Component, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-globe-footer',
  template: `
    <footer class="relative bg-transparent border-t border-var pt-32 pb-16 overflow-hidden w-full">
      
      <!-- Flowing Vector Terrain Backdrop -->
      <div class="absolute inset-0 z-0 pointer-events-none opacity-20 flex items-end justify-center">
        <svg class="w-full h-[80%] min-h-[300px]" viewBox="0 0 1440 400" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="footer-hill-1" x1="720" y1="100" x2="720" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#6AA9FF" stop-opacity="0.15"/>
              <stop offset="100%" stop-color="#6AA9FF" stop-opacity="0.01"/>
            </linearGradient>
            <linearGradient id="footer-hill-2" x1="720" y1="150" x2="720" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#6AA9FF" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#6AA9FF" stop-opacity="0.01"/>
            </linearGradient>
          </defs>

          <!-- Topography Wave Layers -->
          <path d="M0,180 C360,100 720,240 1080,140 C1260,90 1350,150 1440,120 L1440,400 L0,400 Z" fill="url(#footer-hill-1)" />
          <path d="M0,240 C240,190 480,280 720,210 C960,140 1200,260 1440,190 L1440,400 L0,400 Z" fill="url(#footer-hill-2)" />

          <!-- Network Data Lines & Connections -->
          <path d="M 100,150 C 300,90 500,220 720,210" stroke="#6AA9FF" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.3" />
          <path d="M 720,210 C 900,200 1100,120 1340,170" stroke="#6AA9FF" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.3" />
          <path d="M 300,120 C 500,180 800,90 1080,140" stroke="#6AA9FF" stroke-width="1" stroke-dasharray="3 3" opacity="0.2" />

          <!-- District Node Indicators -->
          <circle cx="720" cy="210" r="4" fill="#6AA9FF" class="animate-pulse" />
          <circle cx="720" cy="210" r="10" stroke="#6AA9FF" stroke-width="1" class="animate-ping" style="transform-origin: 720px 210px;" />

          <circle cx="300" cy="120" r="3.5" fill="#6AA9FF" class="animate-pulse" />
          <circle cx="300" cy="120" r="8" stroke="#6AA9FF" stroke-width="1" class="animate-ping" style="transform-origin: 300px 120px;" />

          <circle cx="1080" cy="140" r="3.5" fill="#6AA9FF" class="animate-pulse" />
          <circle cx="1080" cy="140" r="8" stroke="#6AA9FF" stroke-width="1" class="animate-ping" style="transform-origin: 1080px 140px;" />
        </svg>
      </div>

      <!-- Footer Content Overlays -->
      <div class="max-w-7xl mx-auto px-6 relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          
          <!-- Column 1: Platform identity (Branding & Description) -->
          <div class="md:col-span-5">
            <span class="font-mono text-xs tracking-[0.2em] text-[#6AA9FF] uppercase mb-6 block animate-pulse">
              JANSEVA // PLATFORM GATEWAY
            </span>
            <h4 class="text-2xl md:text-3xl font-bold tracking-tight text-primary-var mb-6 uppercase tracking-wider font-mono">
              JANSEVA <span class="text-[#6AA9FF]">AI</span>
            </h4>
            <p class="text-xs text-muted-var leading-relaxed font-mono uppercase max-w-sm">
              {{ translationService.t('FOOTER_PLATFORM_DESC') }}
            </p>
          </div>

          <!-- Column 2: Quick Links -->
          <div class="md:col-span-4 grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <span class="font-mono text-xs tracking-widest text-muted-var uppercase mb-4 block">
                {{ translationService.t('QUICK_LINKS') }}
              </span>
            </div>
            <div>
              <ul class="space-y-3 font-mono text-[11px] text-muted-var uppercase">
                <li><a href="#" class="hover:text-[#6AA9FF] transition-colors duration-200">{{ translationService.t('HOME') }}</a></li>
                <li><a href="#departments" class="hover:text-[#6AA9FF] transition-colors duration-200">{{ translationService.t('DEPARTMENTS') }}</a></li>
                <li><a href="/dashboard/complaints" class="hover:text-[#6AA9FF] transition-colors duration-200">{{ translationService.t('FILE_GRIEVANCE') }}</a></li>
                <li><a href="/dashboard/complaints" class="hover:text-[#6AA9FF] transition-colors duration-200">{{ translationService.t('TRACK_COMPLAINT') }}</a></li>
                <li><a href="#transparency" class="hover:text-[#6AA9FF] transition-colors duration-200">{{ translationService.t('TRANSPARENCY_PORTAL') }}</a></li>
              </ul>
            </div>
            <div>
              <ul class="space-y-3 font-mono text-[11px] text-muted-var uppercase">
                <li><a href="#" class="hover:text-[#6AA9FF] transition-colors duration-200">{{ translationService.t('GOV_SERVICES') }}</a></li>
                <li><a href="/dashboard" class="hover:text-[#6AA9FF] transition-colors duration-200">{{ translationService.t('PUBLIC_DASHBOARD') }}</a></li>
                <li><a href="/dashboard/complaints" class="hover:text-[#6AA9FF] transition-colors duration-200">{{ translationService.t('EMERGENCY_REPORTING') }}</a></li>
                <li><a href="#" class="hover:text-[#6AA9FF] transition-colors duration-200">{{ translationService.t('CITIZEN_SUPPORT') }}</a></li>
                <li><a href="#empowerment" class="hover:text-[#6AA9FF] transition-colors duration-200">{{ translationService.t('GOVERNANCE_ANALYTICS') }}</a></li>
              </ul>
            </div>
          </div>

          <!-- Column 3: Contact Details & Hotline -->
          <div class="md:col-span-3">
            <span class="font-mono text-xs tracking-widest text-muted-var uppercase mb-6 block">
              {{ translationService.t('CONTACT_US') }}
            </span>
            <ul class="space-y-3 font-mono text-[11px] text-muted-var uppercase">
              <li class="text-primary-var font-bold">
                {{ translationService.t('SUPPORT_EMAIL') }}: <a href="mailto:support@janseva.gov.in" class="text-[#6AA9FF] hover:underline">support&#64;janseva.gov.in</a>
              </li>
              <li>{{ translationService.t('HELPDESK') }}: +1800-425-1111</li>
              <li class="text-red-400 font-bold border border-red-500/35 bg-red-950/20 px-3 py-2 rounded-lg inline-block tracking-wider animate-pulse">
                🚨 {{ translationService.t('EMERGENCY_HOTLINE') }}: 112
              </li>
            </ul>
          </div>
        </div>

        <!-- Footer Bottom Bar -->
        <div class="pt-8 border-t border-var flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-muted-var uppercase tracking-widest">
          <div>© 2026 JANSEVA Civic Intelligence Platform. All rights reserved.</div>
          <div class="flex items-center gap-6">
            <a href="#" class="hover:text-primary-var transition-colors duration-200">Terms of Grid</a>
            <a href="#" class="hover:text-primary-var transition-colors duration-200">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class GlobeFooterComponent {
  public translationService = inject(TranslationService);
}
