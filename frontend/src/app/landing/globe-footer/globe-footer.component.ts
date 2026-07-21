import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-globe-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12 w-full font-sans">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        <div class="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          <!-- Column 1: Platform & Development Credits -->
          <div class="md:col-span-5 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">J</div>
              <div>
                <span class="font-bold text-lg text-white tracking-tight block leading-none">JANSEVA</span>
                <span class="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">AI Governance Platform</span>
              </div>
            </div>

            <p class="text-xs text-slate-400 leading-relaxed max-w-sm">
              National AI-powered civic intelligence platform transforming municipal grievance redressal, enforcing SLA compliance, and guaranteeing public governance transparency.
            </p>

            <!-- System Status Indicator Badge -->
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-400">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>🟢 All Services Operational</span>
            </div>

            <!-- Balanced Developer Credits -->
            <div class="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs">
              <span class="font-bold text-indigo-300 uppercase tracking-wider text-[10px] block">Project Developed By:</span>
              <ul class="space-y-1 text-slate-200 font-medium">
                <li class="flex items-center gap-2"><span class="text-emerald-400">✦</span> M. Nanda Kishore</li>
                <li class="flex items-center gap-2"><span class="text-emerald-400">✦</span> Shaik Mohammad Bilal</li>
                <li class="flex items-center gap-2"><span class="text-emerald-400">✦</span> V. Jaya Krishna Zinudu</li>
              </ul>
            </div>
          </div>

          <!-- Column 2: Platform Links -->
          <div class="md:col-span-4 grid grid-cols-2 gap-4 text-xs">
            <div class="space-y-3">
              <span class="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">Navigation</span>
              <ul class="space-y-2 text-slate-400">
                <li><a href="#overview" class="hover:text-indigo-400 transition-colors">Platform Overview</a></li>
                <li><a href="#why-janseva" class="hover:text-indigo-400 transition-colors">Why JANSEVA</a></li>
                <li><a href="#updates" class="hover:text-indigo-400 transition-colors">Government Updates</a></li>
                <li><a href="#how-to-use" class="hover:text-indigo-400 transition-colors">How to Use</a></li>
              </ul>
            </div>

            <div class="space-y-3">
              <span class="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">Legal & Security</span>
              <ul class="space-y-2 text-slate-400">
                <li><a href="#" class="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" class="hover:text-indigo-400 transition-colors">Terms of Use</a></li>
                <li><a href="#" class="hover:text-indigo-400 transition-colors">Accessibility Statement (WCAG 2.1 AA)</a></li>
                <li><a href="#" class="hover:text-indigo-400 transition-colors">Security Audit Certificate</a></li>
              </ul>
            </div>
          </div>

          <!-- Column 3: System Information & Emergency -->
          <div class="md:col-span-3 space-y-4 text-xs">
            <span class="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">System Metadata</span>
            
            <div class="space-y-2 text-slate-400 font-mono text-[11px]">
              <div>Version: <span class="text-indigo-400 font-bold">v2.4.0 Enterprise</span></div>
              <div>Build: <span class="text-slate-300">#8492</span></div>
              <div>Last Deployed: <span class="text-slate-200">July 2026</span></div>
              <div>Contact: <a href="mailto:support@janseva.gov.in" class="text-indigo-400 hover:underline">support@janseva.gov.in</a></div>
              <div class="pt-1 text-slate-300 font-sans font-bold">Made in India 🇮🇳</div>
            </div>

            <div class="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-[11px] font-bold space-y-1">
              <span>🚨 Emergency Hotline: 112</span>
              <p class="text-[10px] font-normal text-rose-400">For immediate life safety or disaster assistance.</p>
            </div>
          </div>

        </div>

        <!-- Footer Bottom Bar -->
        <div class="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© 2026 JANSEVA National AI Governance Platform. All rights reserved.</div>
          <div class="flex items-center gap-4">
            <a href="https://github.com/janseva-platform" target="_blank" class="hover:text-indigo-400 transition-colors">GitHub</a>
            <span>•</span>
            <a href="mailto:support@janseva.gov.in" class="hover:text-indigo-400 transition-colors">support@janseva.gov.in</a>
          </div>
        </div>

      </div>
    </footer>
  `
})
export class GlobeFooterComponent {
  translationService = inject(TranslationService);
}
