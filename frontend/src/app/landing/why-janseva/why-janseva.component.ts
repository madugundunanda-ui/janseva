import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';

interface CapabilityRow {
  capability: string;
  traditional: string;
  digitalPortal: string;
  janseva: string;
  highlight?: boolean;
}

@Component({
  selector: 'app-why-janseva',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="why-janseva" class="py-20 bg-slate-50 border-t border-slate-200/80 font-sans">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        
        <!-- Header -->
        <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 uppercase tracking-wider">
            <span>Governance Excellence Matrix</span>
          </div>
          <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Why JANSEVA is the Future of Public Redressal
          </h2>
          <p class="text-slate-600 text-sm sm:text-base leading-relaxed">
            See how JANSEVA transforms state civic administration compared to legacy manual paperwork and standard digital form portals.
          </p>
        </div>

        <!-- Capability Comparison Table Card -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden mb-16">
          <div class="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div>
              <h3 class="text-lg font-bold tracking-tight">Platform Capability Matrix</h3>
              <p class="text-xs text-slate-400">Qualitative comparison of civic governance architectures</p>
            </div>
            <span class="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
              ✓ Production Standard
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr class="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                  <th class="py-4 px-6">Core Capability</th>
                  <th class="py-4 px-6 text-slate-500">Traditional System</th>
                  <th class="py-4 px-6 text-slate-500">Typical Digital Portal</th>
                  <th class="py-4 px-6 text-indigo-700 bg-indigo-50/60 font-extrabold">JANSEVA Platform</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let row of capabilities" class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    {{ row.capability }}
                  </td>
                  <td class="py-4 px-6 text-slate-500 font-medium">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                      <span class="text-rose-500 font-bold">✕</span> {{ row.traditional }}
                    </span>
                  </td>
                  <td class="py-4 px-6 text-slate-500 font-medium">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                      <span class="text-amber-500 font-bold">⚠</span> {{ row.digitalPortal }}
                    </span>
                  </td>
                  <td class="py-4 px-6 font-bold text-slate-900 bg-indigo-50/30">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs font-bold">
                      <span class="text-emerald-600 font-bold">✓</span> {{ row.janseva }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Demonstration Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <!-- Card 1: Instant AI Classification -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
              ⚡
            </div>
            <h4 class="text-base font-bold text-slate-900">AI Triage & Department Auto-Route</h4>
            <p class="text-xs text-slate-600 leading-relaxed">
              No manual sorting delays. Gemini AI processes photo evidence and text narrative to assign department, ward, priority, and SLA targets instantly.
            </p>
            <div class="pt-2 text-xs font-semibold text-indigo-600 flex items-center gap-1">
              <span>Automated Dispatch</span> →
            </div>
          </div>

          <!-- Card 2: Multilingual Voice Assistant -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-lg">
              🎙️
            </div>
            <h4 class="text-base font-bold text-slate-900">Multilingual Voice Input (5 Languages)</h4>
            <p class="text-xs text-slate-600 leading-relaxed">
              Citizens can speak grievances in English, Telugu, Tamil, Kannada, or Hindi. The platform transcribes, translates, and formats intake details seamlessly.
            </p>
            <div class="pt-2 text-xs font-semibold text-sky-600 flex items-center gap-1">
              <span>Universal Accessibility</span> →
            </div>
          </div>

          <!-- Card 3: Visual Delta Proof of Work -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
              📸
            </div>
            <h4 class="text-base font-bold text-slate-900">Visual Delta Verification</h4>
            <p class="text-xs text-slate-600 leading-relaxed">
              Field officers must upload resolution proof photos. AI vision compares before-and-after photo matching to guarantee authentic completion before closure.
            </p>
            <div class="pt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>Verified Proof</span> →
            </div>
          </div>

        </div>

      </div>
    </section>
  `
})
export class WhyJansevaComponent {
  translationService = inject(TranslationService);

  capabilities: CapabilityRow[] = [
    {
      capability: 'Complaint Tracking',
      traditional: 'Limited (Paper records)',
      digitalPortal: 'Basic Status Only',
      janseva: 'Live Real-Time Telemetry'
    },
    {
      capability: 'AI Category Classification',
      traditional: 'No (Manual sorting)',
      digitalPortal: 'No (User select only)',
      janseva: 'Yes (Vision + Gemini NLP)'
    },
    {
      capability: 'Voice Assistance',
      traditional: 'No',
      digitalPortal: 'Limited / Text-only',
      janseva: 'Yes (Multilingual Voice Intake)'
    },
    {
      capability: 'Language Support',
      traditional: 'Single Regional Language',
      digitalPortal: 'Limited Translation',
      janseva: 'Full Global (EN, TE, TA, KN, HI)'
    },
    {
      capability: 'SLA Escalation Monitoring',
      traditional: 'Manual File Review',
      digitalPortal: 'Partial Static Deadlines',
      janseva: 'Automated Risk Alerts & Escalation'
    },
    {
      capability: 'Duplicate Detection',
      traditional: 'No',
      digitalPortal: 'No',
      janseva: 'AI Enabled (GPS + Vision Match)'
    }
  ];
}
