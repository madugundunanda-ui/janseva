import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-citizen-empowerment',
  imports: [CommonModule],
  template: `
    <section id="empowerment" class="py-32 px-6 bg-transparent relative w-full border-t border-var overflow-hidden">
      <!-- Glow ambient overlay -->
      <div class="absolute top-0 left-1/4 w-[500px] h-[300px] bg-[#6AA9FF]/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <!-- Left side: Stories Flow (8 columns) -->
          <div class="lg:col-span-8 space-y-12">
            <div>
              <span class="font-mono text-xs tracking-[0.25em] text-[#6AA9FF] uppercase mb-4 block animate-pulse">
                CIVIC TRANSACTION STAGES
              </span>
              <h2 class="text-3xl md:text-5xl font-bold tracking-tight text-primary-var uppercase text-glow leading-none font-mono">
                {{ translationService.t('CITIZEN_EMPOWERMENT_TITLE') }}
              </h2>
              <p class="text-xs sm:text-sm text-muted-var font-mono mt-6 max-w-xl uppercase tracking-wider leading-relaxed">
                {{ translationService.t('CITIZEN_EMPOWERMENT_DESC') }}
              </p>
            </div>

            <!-- Horizontal / Vertical Story Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              
              <!-- Step 1 -->
              <div class="glass-panel p-6 border-var rounded-xl hover:border-[#6AA9FF]/30 transition-all duration-300 flex gap-4">
                <div class="w-10 h-10 rounded-lg bg-[#6AA9FF]/10 flex items-center justify-center font-mono text-[#6AA9FF] font-bold shrink-0">01</div>
                <div class="space-y-1">
                  <h4 class="font-mono text-xs font-bold text-primary-var uppercase">{{ translationService.t('STORY_STEP_1_TITLE') }}</h4>
                  <p class="font-mono text-[9px] uppercase text-muted-var leading-relaxed">{{ translationService.t('STORY_STEP_1_DESC') }}</p>
                </div>
              </div>

              <!-- Step 2 -->
              <div class="glass-panel p-6 border-var rounded-xl hover:border-[#6AA9FF]/30 transition-all duration-300 flex gap-4">
                <div class="w-10 h-10 rounded-lg bg-[#6AA9FF]/10 flex items-center justify-center font-mono text-[#6AA9FF] font-bold shrink-0">02</div>
                <div class="space-y-1">
                  <h4 class="font-mono text-xs font-bold text-primary-var uppercase">{{ translationService.t('STORY_STEP_2_TITLE') }}</h4>
                  <p class="font-mono text-[9px] uppercase text-muted-var leading-relaxed">{{ translationService.t('STORY_STEP_2_DESC') }}</p>
                </div>
              </div>

              <!-- Step 3 -->
              <div class="glass-panel p-6 border-var rounded-xl hover:border-[#6AA9FF]/30 transition-all duration-300 flex gap-4">
                <div class="w-10 h-10 rounded-lg bg-[#6AA9FF]/10 flex items-center justify-center font-mono text-[#6AA9FF] font-bold shrink-0">03</div>
                <div class="space-y-1">
                  <h4 class="font-mono text-xs font-bold text-primary-var uppercase">{{ translationService.t('STORY_STEP_3_TITLE') }}</h4>
                  <p class="font-mono text-[9px] uppercase text-muted-var leading-relaxed">{{ translationService.t('STORY_STEP_3_DESC') }}</p>
                </div>
              </div>

              <!-- Step 4 -->
              <div class="glass-panel p-6 border-var rounded-xl hover:border-[#6AA9FF]/30 transition-all duration-300 flex gap-4">
                <div class="w-10 h-10 rounded-lg bg-[#6AA9FF]/10 flex items-center justify-center font-mono text-[#6AA9FF] font-bold shrink-0">04</div>
                <div class="space-y-1">
                  <h4 class="font-mono text-xs font-bold text-primary-var uppercase">{{ translationService.t('STORY_STEP_4_TITLE') }}</h4>
                  <p class="font-mono text-[9px] uppercase text-muted-var leading-relaxed">{{ translationService.t('STORY_STEP_4_DESC') }}</p>
                </div>
              </div>

              <!-- Step 5 -->
              <div class="glass-panel p-6 border-var rounded-xl hover:border-[#6AA9FF]/30 transition-all duration-300 flex gap-4">
                <div class="w-10 h-10 rounded-lg bg-[#6AA9FF]/10 flex items-center justify-center font-mono text-[#6AA9FF] font-bold shrink-0">05</div>
                <div class="space-y-1">
                  <h4 class="font-mono text-xs font-bold text-primary-var uppercase">{{ translationService.t('STORY_STEP_5_TITLE') }}</h4>
                  <p class="font-mono text-[9px] uppercase text-muted-var leading-relaxed">{{ translationService.t('STORY_STEP_5_DESC') }}</p>
                </div>
              </div>

              <!-- Step 6 -->
              <div class="glass-panel p-6 border-var rounded-xl hover:border-[#6AA9FF]/30 transition-all duration-300 flex gap-4">
                <div class="w-10 h-10 rounded-lg bg-[#6AA9FF]/10 flex items-center justify-center font-mono text-[#6AA9FF] font-bold shrink-0">06</div>
                <div class="space-y-1">
                  <h4 class="font-mono text-xs font-bold text-primary-var uppercase">{{ translationService.t('STORY_STEP_6_TITLE') }}</h4>
                  <p class="font-mono text-[9px] uppercase text-muted-var leading-relaxed">{{ translationService.t('STORY_STEP_6_DESC') }}</p>
                </div>
              </div>

            </div>
          </div>

          <!-- Right side: Impact Metrics Dashboard (4 columns) -->
          <div class="lg:col-span-4 glass-panel glow-card rounded-2xl p-8 border-var bg-[#0b1424]/40 backdrop-blur-md space-y-8 flex flex-col justify-between">
            <div class="border-b border-var pb-6">
              <span class="font-mono text-[9px] text-[#6AA9FF] uppercase tracking-wider font-bold">LIVE STATE IMPACT AUDIT</span>
              <h3 class="text-xl font-bold font-mono uppercase tracking-tight text-primary-var mt-2">Impact Metrics</h3>
            </div>

            <div class="space-y-6">
              <!-- Metric 1 -->
              <div>
                <span class="font-mono text-[10px] text-muted-var uppercase block mb-1">{{ translationService.t('METRIC_RESOLVED') }}</span>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-primary-var font-mono">14,820</span>
                  <span class="text-[9px] text-emerald-400 font-mono font-bold">▲ 12% MONTHLY</span>
                </div>
              </div>

              <!-- Metric 2 -->
              <div>
                <span class="font-mono text-[10px] text-muted-var uppercase block mb-1">{{ translationService.t('METRIC_HELPED') }}</span>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-[#6AA9FF] font-mono">52,400</span>
                  <span class="text-[9px] text-muted-var font-mono">CITIZENS HELPED</span>
                </div>
              </div>

              <!-- Metric 3 -->
              <div>
                <span class="font-mono text-[10px] text-muted-var uppercase block mb-1">{{ translationService.t('METRIC_RESPONSE') }}</span>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-primary-var font-mono">4.2 Hours</span>
                  <span class="text-[9px] text-emerald-400 font-mono font-bold">▼ 35% SLA DELAY</span>
                </div>
              </div>

              <!-- Metric 4 -->
              <div>
                <span class="font-mono text-[10px] text-muted-var uppercase block mb-1">{{ translationService.t('METRIC_CIVIC_HEALTH') }}</span>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-emerald-400 font-mono">+38.5%</span>
                  <span class="text-[9px] text-emerald-400 font-mono font-bold">CIVIC TRUST IMPROVED</span>
                </div>
              </div>
            </div>
          </div>

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
export class CitizenEmpowermentComponent {
  public translationService = inject(TranslationService);
}
