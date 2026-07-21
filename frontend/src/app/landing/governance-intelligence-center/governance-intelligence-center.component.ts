import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { DashboardService } from '../../core/services/dashboard.service';
import { TimelineService } from '../../core/services/timeline.service';
import { TranslationService, LanguageCode } from '../../core/services/translation.service';

interface UpdateItem {
  id: string;
  titleKey: string;
  summaryKey: string;
  departmentKey: string;
  publishedDate: string;
  link: string;
  isLive: boolean;
  priority: 'normal' | 'elevated' | 'critical';
  state: 'AP' | 'TS' | 'TN' | 'KA';
}

@Component({
  selector: 'app-governance-intelligence-center',
  imports: [CommonModule],
  template: `
    <section id="intelligence" class="relative w-full overflow-hidden border-t border-var py-28 px-6">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(145,173,132,0.2),transparent_44%),radial-gradient(circle_at_90%_10%,rgba(163,63,147,0.15),transparent_42%),radial-gradient(circle_at_50%_110%,rgba(127,122,141,0.14),transparent_50%)]"></div>
      <div class="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(127,122,141,0.12)_1px,transparent_1px)] [background-size:26px_26px]"></div>

      <div class="relative mx-auto max-w-7xl">
        <!-- Top Statistics Panel -->
        <div class="mb-12 rounded-2xl border border-var bg-glass-var p-5 backdrop-blur-md">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div class="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-400">
                <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{{ getLabel('STATE_STATUS') }}</span>
              </div>
              <h2 class="font-mono text-2xl font-bold uppercase tracking-wide text-primary-var sm:text-3xl text-glow-bright">
                {{ translationService.t('GOV_UPDATES_CENTER') }}
              </h2>
              <p class="mt-2 max-w-3xl font-mono text-[11px] uppercase tracking-wider text-muted-var">
                {{ getLabel('SUBTITLE_DESC') }}
              </p>
            </div>

            <!-- Stats grid -->
            <div class="grid grid-cols-2 gap-3 text-[10px] font-mono uppercase tracking-wide sm:grid-cols-4">
              <div class="rounded-xl border border-var bg-white/5 px-3 py-2">
                <div class="text-muted-var">{{ getLabel('ACTIVE_DEPTS') }}</div>
                <div class="mt-1 text-lg font-bold text-primary-var">{{ activeDepartments }}</div>
              </div>
              <div class="rounded-xl border border-var bg-white/5 px-3 py-2">
                <div class="text-muted-var">{{ getLabel('ACTIVE_GRIEVANCES') }}</div>
                <div class="mt-1 text-lg font-bold text-amber-500">{{ activeGrievances }}</div>
              </div>
              <div class="rounded-xl border border-var bg-white/5 px-3 py-2">
                <div class="text-muted-var">{{ getLabel('EMERGENCY_ALERTS') }}</div>
                <div class="mt-1 text-lg font-bold text-red-500">{{ emergencyAlerts }}</div>
              </div>
              <div class="rounded-xl border border-var bg-white/5 px-3 py-2">
                <div class="text-muted-var">{{ getLabel('SLA_COMPLIANCE') }}</div>
                <div class="mt-1 text-lg font-bold text-emerald-400">{{ slaCompliance }}%</div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <!-- Left Column: Updates Feed Center -->
          <div class="lg:col-span-7 rounded-2xl border border-var bg-glass-var p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 class="font-mono text-xs uppercase tracking-[0.2em] text-[#A33F93] font-bold">
                  {{ translationService.t('GOV_UPDATES_CENTER') }}
                </h3>
                
                <!-- Timeline selectors / Tabs -->
                <div class="flex items-center bg-white/5 p-1 rounded-lg border border-white/10 font-mono text-[9px] uppercase tracking-wider">
                  <button (click)="setActiveTab(true)" [class.bg-white/10]="showLive" [class.text-[#6AA9FF]]="showLive" class="px-3 py-1 rounded transition-colors duration-200 cursor-pointer">
                    {{ translationService.t('LIVE_UPDATES') }}
                  </button>
                  <button (click)="setActiveTab(false)" [class.bg-white/10]="!showLive" [class.text-[#6AA9FF]]="!showLive" class="px-3 py-1 rounded transition-colors duration-200 cursor-pointer">
                    {{ translationService.t('PAST_30_DAYS') }}
                  </button>
                </div>
              </div>

              <!-- State Filter Tabs -->
              <div class="mb-6 flex flex-wrap gap-2 items-center font-mono text-[9px] uppercase tracking-wider">
                <span class="text-muted-var mr-2">STATE FILTER:</span>
                <button (click)="setSelectedState('ALL')" [class.bg-[#6AA9FF]/20]="selectedState === 'ALL'" [class.text-[#6AA9FF]]="selectedState === 'ALL'" [class.border-[#6AA9FF]/30]="selectedState === 'ALL'" class="px-2.5 py-1 rounded border border-white/10 bg-white/5 transition-all duration-200 cursor-pointer hover:border-[#6AA9FF]/30">
                  ALL
                </button>
                <button (click)="setSelectedState('AP')" [class.bg-[#6AA9FF]/20]="selectedState === 'AP'" [class.text-[#6AA9FF]]="selectedState === 'AP'" [class.border-[#6AA9FF]/30]="selectedState === 'AP'" class="px-2.5 py-1 rounded border border-white/10 bg-white/5 transition-all duration-200 cursor-pointer hover:border-[#6AA9FF]/30">
                  AP (Andhra Pradesh)
                </button>
                <button (click)="setSelectedState('TS')" [class.bg-[#6AA9FF]/20]="selectedState === 'TS'" [class.text-[#6AA9FF]]="selectedState === 'TS'" [class.border-[#6AA9FF]/30]="selectedState === 'TS'" class="px-2.5 py-1 rounded border border-white/10 bg-white/5 transition-all duration-200 cursor-pointer hover:border-[#6AA9FF]/30">
                  TS (Telangana)
                </button>
                <button (click)="setSelectedState('TN')" [class.bg-[#6AA9FF]/20]="selectedState === 'TN'" [class.text-[#6AA9FF]]="selectedState === 'TN'" [class.border-[#6AA9FF]/30]="selectedState === 'TN'" class="px-2.5 py-1 rounded border border-white/10 bg-white/5 transition-all duration-200 cursor-pointer hover:border-[#6AA9FF]/30">
                  TN (Tamil Nadu)
                </button>
                <button (click)="setSelectedState('KA')" [class.bg-[#6AA9FF]/20]="selectedState === 'KA'" [class.text-[#6AA9FF]]="selectedState === 'KA'" [class.border-[#6AA9FF]/30]="selectedState === 'KA'" class="px-2.5 py-1 rounded border border-white/10 bg-white/5 transition-all duration-200 cursor-pointer hover:border-[#6AA9FF]/30">
                  KA (Karnataka)
                </button>
              </div>

              <!-- List of news items -->
              <div class="space-y-4">
                @for (item of filteredUpdates; track item.id) {
                  <article class="relative rounded-xl border border-var bg-white/2 p-4 transition-all duration-300 hover:border-[#6AA9FF]/30">
                    <!-- Left color priority bar -->
                    <div class="absolute left-0 top-3 bottom-3 w-[3px] rounded-r animate-pulse"
                       [class.bg-emerald-500]="item.priority === 'normal'"
                       [class.bg-amber-500]="item.priority === 'elevated'"
                       [class.bg-red-500]="item.priority === 'critical'"></div>

                    <div class="ml-2">
                      <!-- Badge Row -->
                      <div class="mb-2 flex flex-wrap items-center gap-2">
                        @if (item.isLive) {
                          <span class="inline-flex items-center gap-1 rounded bg-red-950/30 border border-red-500/30 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-red-400 font-bold animate-pulse">
                            LIVE
                          </span>
                        }
                        <span class="rounded bg-[#6AA9FF]/10 border border-[#6AA9FF]/30 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#6AA9FF] font-bold">
                          {{ item.state }}
                        </span>
                        <span class="rounded bg-white/5 border border-white/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-muted-var">
                          {{ translationService.t(item.departmentKey) }}
                        </span>
                        <span class="rounded px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider font-bold"
                          [class.bg-emerald-950/20]="item.priority === 'normal'"
                          [class.text-emerald-400]="item.priority === 'normal'"
                          [class.bg-amber-950/20]="item.priority === 'elevated'"
                          [class.text-amber-400]="item.priority === 'elevated'"
                          [class.bg-red-950/20]="item.priority === 'critical'"
                          [class.text-red-400]="item.priority === 'critical'">
                          {{ item.priority.toUpperCase() }}
                        </span>
                        <span class="ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-var">
                          {{ item.publishedDate }}
                        </span>
                      </div>

                      <h4 class="font-mono text-xs font-bold uppercase tracking-wide text-primary-var mb-1.5">
                        {{ getTranslatedText(item.titleKey) }}
                      </h4>
                      <p class="font-mono text-[10px] uppercase tracking-wide text-muted-var leading-relaxed mb-3">
                        {{ getTranslatedText(item.summaryKey) }}
                      </p>

                      <!-- Read More External Link -->
                      <div class="text-right">
                        <a [href]="item.link" target="_blank" class="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-[#6AA9FF] hover:text-[#88b7ff] hover:underline transition-all">
                          {{ translationService.t('READ_MORE') }} ↗
                        </a>
                      </div>
                    </div>
                  </article>
                } @empty {
                  <div class="py-12 text-center font-mono text-xs text-muted-var uppercase">
                    {{ translationService.t('NO_UPDATES') }}
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Right Column: 30-Day Governance Timeline -->
          <div class="lg:col-span-5 rounded-2xl border border-var bg-glass-var p-6 backdrop-blur-md">
            <h3 class="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-[#A33F93] font-bold">
              {{ getTimelineLabel('TIMELINE_TITLE') }}
            </h3>

            <!-- Curve Chart -->
            <div class="mb-5 rounded-xl border border-var bg-white/2 p-4">
              <div class="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-var">
                <span>{{ getTimelineLabel('CURVE_LABEL') }}</span>
                <span>{{ getTimelineLabel('CURVE_SUB') }}</span>
              </div>
              <svg viewBox="0 0 320 120" class="h-24 w-full">
                <defs>
                  <linearGradient id="activityLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#A33F93"></stop>
                    <stop offset="100%" stop-color="#6AA9FF"></stop>
                  </linearGradient>
                </defs>
                <path d="M10,95 C40,80 65,83 95,62 C130,38 160,50 190,44 C220,40 248,52 275,28 C292,14 304,14 310,12" fill="none" stroke="url(#activityLine)" stroke-width="3" stroke-linecap="round" class="activity-curve"></path>
                <circle cx="310" cy="12" r="4" fill="#10b981" class="animate-pulse"></circle>
              </svg>
            </div>

            <!-- Heatmap Grid -->
            <div class="mb-5 grid grid-cols-6 gap-2">
              @for (cell of heatmap; track $index) {
                <div class="h-6 rounded border border-white/5" [style.background]="cell"></div>
              }
            </div>

            <!-- Bottom Stats -->
            <div class="space-y-3.5 text-[10px] font-mono uppercase tracking-wide">
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                <span class="text-muted-var">{{ getTimelineLabel('RESOLVED_30D') }}</span>
                <span class="font-bold text-emerald-400">{{ resolved30d }}</span>
              </div>
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                <span class="text-muted-var">{{ getTimelineLabel('AVG_RESPONSE') }}</span>
                <span class="font-bold text-primary-var">{{ responseHours }}h</span>
              </div>
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                <span class="text-muted-var">{{ getTimelineLabel('CITIZEN_ENGAGEMENT') }}</span>
                <span class="font-bold text-primary-var">{{ engagementRate }}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-var">{{ getTimelineLabel('DISTRICT_INDEX') }}</span>
                <span class="font-bold text-emerald-400">{{ districtIndex }}</span>
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

    .activity-curve {
      stroke-dasharray: 420;
      stroke-dashoffset: 420;
      animation: drawCurve 3.2s ease forwards infinite;
    }

    @keyframes drawCurve {
      0% { stroke-dashoffset: 420; opacity: 0.5; }
      65% { stroke-dashoffset: 0; opacity: 1; }
      100% { stroke-dashoffset: 0; opacity: 1; }
    }
  `]
})
export class GovernanceIntelligenceCenterComponent implements OnInit, OnDestroy {
  activeDepartments = 0;
  activeGrievances = 0;
  emergencyAlerts = 0;
  slaCompliance = 0;
  resolved30d = 0;
  responseHours = 0;
  engagementRate = 0;
  districtIndex = 'A+';

  showLive = true;
  selectedState: 'AP' | 'TS' | 'TN' | 'KA' | 'ALL' = 'ALL';
  heatmap = this.buildHeatmap();
  private timer: ReturnType<typeof setInterval> | null = null;

  public translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);

  // Strictly unique list of news updates (7 unique items representing the requested categories)
  allUpdates: UpdateItem[] = [
    {
      id: 'upd-1',
      titleKey: 'ALERT_TITLE',
      summaryKey: 'ALERT_SUM',
      departmentKey: 'DEPT_EMERGENCY',
      publishedDate: 'Live Update',
      link: 'https://janseva.gov.in/news/upd-1',
      isLive: true,
      priority: 'critical',
      state: 'AP'
    },
    {
      id: 'upd-2',
      titleKey: 'SANITATION_TITLE',
      summaryKey: 'SANITATION_SUM',
      departmentKey: 'DEPT_SANITATION',
      publishedDate: 'Live Update',
      link: 'https://janseva.gov.in/news/upd-2',
      isLive: true,
      priority: 'normal',
      state: 'TS'
    },
    {
      id: 'upd-3',
      titleKey: 'ROAD_TITLE',
      summaryKey: 'ROAD_SUM',
      departmentKey: 'DEPT_ROADS',
      publishedDate: 'Live Update',
      link: 'https://janseva.gov.in/news/upd-3',
      isLive: true,
      priority: 'elevated',
      state: 'TN'
    },
    {
      id: 'upd-4',
      titleKey: 'HEALTH_TITLE',
      summaryKey: 'HEALTH_SUM',
      departmentKey: 'DEPT_HEALTH',
      publishedDate: '15 Days Ago',
      link: 'https://janseva.gov.in/news/upd-4',
      isLive: false,
      priority: 'normal',
      state: 'KA'
    },
    {
      id: 'upd-5',
      titleKey: 'TAX_TITLE',
      summaryKey: 'TAX_SUM',
      departmentKey: 'DEPT_REVENUE',
      publishedDate: '20 Days Ago',
      link: 'https://janseva.gov.in/news/upd-5',
      isLive: false,
      priority: 'normal',
      state: 'AP'
    },
    {
      id: 'upd-6',
      titleKey: 'POLICY_TITLE',
      summaryKey: 'POLICY_SUM',
      departmentKey: 'DEPT_TRANSPORT',
      publishedDate: '25 Days Ago',
      link: 'https://janseva.gov.in/news/upd-6',
      isLive: false,
      priority: 'normal',
      state: 'TS'
    },
    {
      id: 'upd-7',
      titleKey: 'WI_FI_TITLE',
      summaryKey: 'WI_FI_SUM',
      departmentKey: 'DEPT_SMART_CITY',
      publishedDate: '30 Days Ago',
      link: 'https://janseva.gov.in/news/upd-7',
      isLive: false,
      priority: 'normal',
      state: 'KA'
    }
  ];

  filteredUpdates: UpdateItem[] = [];

  // Localized dictionaries for News Content
  private readonly NEWS_CONTENT: Record<LanguageCode, Record<string, string>> = {
    en: {
      ALERT_TITLE: 'Critical Flood Warning & Evacuation Routes Active',
      ALERT_SUM: 'Heavy rainfall expected in low-lying wards. Relief camps are established at municipal high schools. Evacuation teams are deployed.',
      SANITATION_TITLE: 'Mega Civic Sanitation Drive & Cleanliness Week',
      SANITATION_SUM: 'Municipal sweepers and waste collection trucks will cover Wards 10 to 15. Citizens are encouraged to segregate plastic waste.',
      ROAD_TITLE: 'Ward 12 Main Flyover Repair & Traffic Diversion',
      ROAD_SUM: 'Pothole repairs and structural reinforcement underway. Alternate routes via Sector B link road are active. Expect delays.',
      HEALTH_TITLE: 'Vector-Borne Disease Prevention Campaign',
      HEALTH_SUM: 'Free fogging services and medical health camps set up in Ward 4. Contact municipal health center for free consultations.',
      TAX_TITLE: 'Property Tax Filing Rebate Extended to June 15',
      TAX_SUM: 'File property tax online through the Janseva Secure Portal to receive an additional 5% green municipal rebate.',
      POLICY_TITLE: 'State Green Transport & Public Transit Subsidy',
      POLICY_SUM: 'Introduction of 50 new electric buses on high-traffic routes. Monthly transit pass prices reduced by 15% for citizens.',
      WI_FI_TITLE: 'Smart City Wi-Fi Installation Completed in Ward 8',
      WI_FI_SUM: '12 new public high-speed Wi-Fi hotspots are active in public parks and marketplaces.',
      
      STATE_STATUS: 'State Status: Operational',
      SUBTITLE_DESC: 'Live civic operations, verified district actions, and 30-day governance performance in one operational command view.',
      ACTIVE_DEPTS: 'Active Departments',
      ACTIVE_GRIEVANCES: 'Active Grievances',
      EMERGENCY_ALERTS: 'Emergency Alerts',
      SLA_COMPLIANCE: 'SLA Compliance'
    },
    te: {
      ALERT_TITLE: 'అత్యవసర వరద హెచ్చరిక & సహాయ మార్గాలు క్రియాశీలం',
      ALERT_SUM: 'లోతట్టు వార్డులలో భారీ వర్ష సూచన. మున్సిపల్ ఉన్నత పాఠశాలల్లో సహాయ శిబిరాలు ఏర్పాటు చేయబడ్డాయి. సహాయక బృందాలు రంగంలోకి దిగాయి.',
      SANITATION_TITLE: 'మెగా పౌర పరిశుభ్రత డ్రైవ్ & పారిశుధ్య వారోత్సవాలు',
      SANITATION_SUM: 'వార్డు 10 నుండి 15 వరకు మున్సిపల్ సేవలు విస్తరిస్తాయి. తడి, పొడి చెత్తను వేరు చేయాలని పౌరులకు విజ్ఞప్తి.',
      ROAD_TITLE: 'వార్డు 12 ప్రధాన ఫ్లైఓవర్ మరమ్మతులు & ట్రాఫిక్ మళ్లింపు',
      ROAD_SUM: 'రోడ్డు మరమ్మతులు మరియు పిల్లర్ల బలోపేత పనులు జరుగుతున్నాయి. ప్రత్యామ్నాయ మార్గాలను ఉపయోగించవలసిందిగా కోరుతున్నాము.',
      HEALTH_TITLE: 'దోమల నివారణ మరియు ఉచిత వైద్య శిబిరాలు',
      HEALTH_SUM: 'వార్డు 4లో ఫాగింగ్ సేవలు మరియు ఉచిత వైద్య శిబిరాలు ప్రారంభం. ఉచిత సంప్రదింపుల కోసం మున్సిపల్ హెల్త్ సెంటర్ ను సంప్రదించండి.',
      TAX_TITLE: 'ఆస్తి పన్ను చెల్లింపు గడువు జూన్ 15 వరకు పెంపు',
      TAX_SUM: 'జనసేవ ఆన్‌లైన్ పోర్టల్ ద్వారా ఆస్తి పన్ను చెల్లించి 5% అదనపు మున్సిపల్ రిబేట్ పొందండి.',
      POLICY_TITLE: 'రాష్ట్ర పర్యావరణ రవాణా & ప్రజా రవాణా రాయితీలు',
      POLICY_SUM: 'ప్రధాన మార్గాల్లో 50 కొత్త ఎలక్ట్రిక్ బస్సుల ప్రవేశం. పౌరుల కోసం బస్సు పాస్ ధరలు 15% తగ్గించబడ్డాయి.',
      WI_FI_TITLE: 'వార్డు 8లో స్మార్ట్ సిటీ ఉచిత వైఫై సదుపాయం పూర్తి',
      WI_FI_SUM: 'బహిరంగ పార్కులు మరియు మార్కెట్ ప్రాంతాలలో 12 కొత్త హై-స్పీడ్ వైఫై హాట్‌స్పాట్‌లు అందుబాటులోకి వచ్చాయి.',
      
      STATE_STATUS: 'రాష్ట్ర స్థితి: సాధారణం',
      SUBTITLE_DESC: 'నిజ-సమయ పౌర కార్యకలాపాలు, ధృవీకరించబడిన జిల్లా చర్యలు మరియు 30 రోజుల పాలన పనితీరు.',
      ACTIVE_DEPTS: 'క్రియాశీల శాఖలు',
      ACTIVE_GRIEVANCES: 'యాక్టివ్ ఫిర్యాదులు',
      EMERGENCY_ALERTS: 'అత్యవసర హెచ్చరికలు',
      SLA_COMPLIANCE: 'SLA నిబద్ధత'
    },
    ta: {
      ALERT_TITLE: 'அவசரகால வெள்ள எச்சரிக்கை & மீட்பு வழிகள் இயக்கம்',
      ALERT_SUM: 'தாழ்வான வார்டுகளில் கனமழை எச்சரிக்கை. நகராட்சி பள்ளிகளில் நிவாரண முகாம்கள் அமைக்கப்பட்டுள்ளன. மீட்புக் குழுவினர் தயார் நிலையில் உள்ளனர்.',
      SANITATION_TITLE: 'మెగా పౌర పరిశుభ్రత డ్రైవ్ & పారిశుధ్య వారోత్సవాలు',
      SANITATION_SUM: 'வார்டு 10 முதல் 15 வரை நகராட்சி குப்பை வண்டிகள் இயக்கப்படும். குப்பைகளை மக்கும், மக்காதவை என பிரித்து வழங்க கோரிக்கை.',
      ROAD_TITLE: 'வார்டு 12 மேம்பால பழுதுபார்ப்பு & போக்குவரத்து மாற்றம்',
      ROAD_SUM: 'சாலை பழுதுபார்ப்பு பணிகள் நடைபெறுகின்றன. மாற்றுப் பாதையாக செக்டார் பி இணைப்பு சாலையைப் பயன்படுத்தவும்.',
      HEALTH_TITLE: 'கொசு ஒழிப்பு மற்றும் இலவச மருத்துவ முகாம் பிரச்சாரம்',
      HEALTH_SUM: 'வார்டு 4-ல் கொசு ஒழிப்பு மருந்து தெளிப்பு மற்றும் மருத்துவ முகாம்கள். இலவச ஆலோசனைக்கு நகராட்சி மையத்தை அணுகவும்.',
      TAX_TITLE: 'சொத்து வரி செலுத்துவதற்கான சலுகை ஜூன் 15 வரை நீட்டிப்பு',
      TAX_SUM: 'ஜனசேவா ஆன்லைன் போர்டல் மூலம் சொத்து வரி செலுத்தி 5% கூடுதல் நகராட்சி தள்ளுபடி பெறலாம்.',
      POLICY_TITLE: 'பசுமை போக்குவரத்து மற்றும் பொது பேருந்து கட்டண சலுகை',
      POLICY_SUM: 'முக்கிய வழித்தடங்களில் 50 புதிய மின்சார பேருந்துகள் இயக்கம். மாத பேருந்து அட்டை கட்டணம் 15% குறைக்கப்பட்டுள்ளது.',
      WI_FI_TITLE: 'வார்டு 8-ல் ஸ்மார்ட் சிட்டி பொது வைஃபை வசதி நிறைவு',
      WI_FI_SUM: 'பூங்காக்கள் மற்றும் வணிகப் பகுதிகளில் 12 புதிய அதிவேக வைஃபை இணைய மையங்கள் பயன்பாட்டுக்கு வந்துள்ளன.',
      
      STATE_STATUS: 'மாநில நிலை: வழக்கம்',
      SUBTITLE_DESC: 'நிகழ்நேர நகராட்சி செயல்பாடுகள், சரிபார்க்கப்பட்ட மாவட்ட நடவடிக்கைகள் மற்றும் 30 நாள் ஆட்சி செயல்பாடு.',
      ACTIVE_DEPTS: 'செயலில் உள்ள துறைகள்',
      ACTIVE_GRIEVANCES: 'செயலில் உள்ள குறைகள்',
      EMERGENCY_ALERTS: 'அவசரக்கால எச்சரிக்கைகள்',
      SLA_COMPLIANCE: 'SLA இணக்கம்'
    },
    kn: {
      ALERT_TITLE: 'ಪ್ರವಾಹ ಮುನ್ನೆಚ್ಚರಿಕೆ & ತುರ್ತು ತೆರವು ಮಾರ್ಗಗಳು ಸಕ್ರಿಯ',
      ALERT_SUM: 'ತಗ್ಗು ಪ್ರದೇಶದ ವಾರ್ಡ್‌ಗಳಲ್ಲಿ ಭಾರಿ ಮಳೆ ನಿರೀಕ್ಷೆ. ಮುನ್ಸಿಪಲ್ ಪ್ರೌಢಶಾಲೆಗಳಲ್ಲಿ ಪರಿಹಾರ ಶಿಬಿರ ಸ್ಥಾಪಿಸಲಾಗಿದೆ. ತೆರವು ಕಾರ್ಯಪಡೆಗಳು ನಿಯೋಜನೆಗೊಂಡಿವೆ.',
      SANITATION_TITLE: 'ಬೃಹತ್ ನಾಗರಿಕ ಸ್ವಚ್ಛತಾ ಆಂದೋಲನ & ನೈರ್ಮಲ್ಯ ಸಪ್ತಾಹ',
      SANITATION_SUM: 'ವಾರ್ಡ್ 10 ರಿಂದ 15 ರವರೆಗೆ ಮುನ್ಸಿಪಲ್ ಸ್ವಚ್ಛತಾ ವಾಹನಗಳು ಸಂಚರಿಸಲಿವೆ. ಒಣ ಮತ್ತು ಹಸಿ ಕಸ ವಿಂಗಡಿಸಲು ಕೋರಲಾಗಿದೆ.',
      ROAD_TITLE: 'ವಾರ್ಡ್ 12 ಫ್ಲೈಓವರ್ ದುರಸ್ತಿ ಕಾರ್ಯ & ಸಂಚಾರ ಮಾರ್ಗ ಬದಲಿ',
      ROAD_SUM: 'ರಸ್ತೆ ದುರಸ್ತಿ ಮತ್ತು ಕಂಬಗಳ ಬಲವರ್ಧನೆ ಕಾರ್ಯ ಪ್ರಗತಿಯಲ್ಲಿದೆ. ಪರ್ಯಾಯ ರಸ್ತೆ ಬಳಸಲು ನಾಗರಿಕರಿಗೆ ವಿನಂತಿ.',
      HEALTH_TITLE: 'ಸಾಂಕ್ರಾಮಿಕ ರೋಗ ತಡೆಗಟ್ಟುವಿಕೆ & ಉಚಿತ ಆರೋಗ್ಯ ಶಿಬಿರ',
      HEALTH_SUM: 'ವಾರ್ಡ್ 4 ರಲ್ಲಿ ಫಾಗಿಂಗ್ ಸೇವೆಗಳು ಮತ್ತು ಉಚಿತ ಆರೋಗ್ಯ ತಪಾಸಣೆ ಶಿಬಿರ. ಉಚಿತ ಚಿಕಿತ್ಸೆಗಾಗಿ ಮುನ್ಸಿಪಲ್ ಹೆಲ್ತ್ ಸೆಂಟರ್ ಸಂಪರ್ಕಿಸಿ.',
      TAX_TITLE: 'ಆಸ್ತಿ ತೆರಿಗೆ ಪಾವತಿ ರಿಯಾಯಿತಿ ಅವಧಿ ಜೂನ್ 15 ರವರೆಗೆ ವಿಸ್ತರಣೆ',
      TAX_SUM: 'ಜನಸೇವ ಆನ್‌ಲೈನ್ ಪೋರ್ಟಲ್ ಮೂಲಕ ಆಸ್ತಿ ತೆರಿಗೆ ಪಾವತಿಸಿ ಶೇ. 5 ರಷ್ಟು ಹೆಚ್ಚುವರಿ ರಿಯಾಯಿತಿ ಪಡೆಯಿರಿ.',
      POLICY_TITLE: 'ಪರಿಸರ ಸ್ನೇಹಿ ಸಾರಿಗೆ ಯೋಜನೆ & ಸಾರ್ವಜನಿಕ ಬಸ್ ರಿಯಾಯಿತಿ',
      POLICY_SUM: 'ಪ್ರಮುಖ ಮಾರ್ಗಗಳಲ್ಲಿ 50 ಹೊಸ ಎಲೆಕ್ಟ್ರಿಕ್ ಬಸ್‌ಗಳ ಸಂಚಾರ. ಮಾಸಿಕ ಬಸ್ ಪಾಸ್ ದರಗಳಲ್ಲಿ ಶೇ. 15 ಕಡಿತ.',
      WI_FI_TITLE: 'ವಾರ್ಡ್ 8 ರಲ್ಲಿ ಸ್ಮಾರ್ಟ್ ಸಿಟಿ ಉಚಿತ ವೈಫೈ ಅಳವಡಿಕೆ ಪೂರ್ಣ',
      WI_FI_SUM: 'ಸಾರ್ವಜನಿಕ ಉದ್ಯಾನವನಗಳು ಮತ್ತು ಮಾರುಕಟ್ಟೆಗಳಲ್ಲಿ 12 ಹೊಸ ಹೈ-ಸ್ಪೀಡ್ ವೈಫೈ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು ಸಕ್ರಿಯವಾಗಿವೆ.',
      
      STATE_STATUS: 'ರಾಜ್ಯ ಸ್ಥಿತಿ: ಸಾಮಾನ್ಯ',
      SUBTITLE_DESC: 'ನೈಜ-ಸಮಯದ ಕಾರ್ಯಾಚರಣೆಗಳು, ಧೃವೀಕೃತ ಜಿಲ್ಲಾ ಕ್ರಮಗಳು ಮತ್ತು 30 ದಿನಗಳ ಆಡಳಿತ ಪ್ರಗತಿ.',
      ACTIVE_DEPTS: 'ಸಕ್ರಿಯ ಇಲಾಖೆಗಳು',
      ACTIVE_GRIEVANCES: 'ಸಕ್ರಿಯ ದೂರುಗಳು',
      EMERGENCY_ALERTS: 'ತುರ್ತು ಎಚ್ಚರಿಕೆಗಳು',
      SLA_COMPLIANCE: 'SLA ಅನುಸರಣೆ'
    },
    hi: {
      ALERT_TITLE: 'मानसून आपातकालीन जल निकासी अलर्ट',
      ALERT_SUM: 'सक्रिय जल निकासी दल भारी बारिश वाले वार्डों में तैनात।',
      STATE_STATUS: 'राज्य स्थिति: सामान्य',
      SUBTITLE_DESC: 'वास्तविक समय के संचालन और 30-दिवसीय शासन प्रगति।',
      ACTIVE_DEPTS: 'सक्रिय विभाग',
      ACTIVE_GRIEVANCES: 'सक्रिय शिकायतें',
      EMERGENCY_ALERTS: 'आपातकालीन अलर्ट',
      SLA_COMPLIANCE: 'एसएलए अनुपालन'
    }
  };

  private readonly TIMELINE_LABELS: Record<LanguageCode, Record<string, string>> = {
    en: {
      TIMELINE_TITLE: '30-Day Governance Activity Timeline',
      CURVE_LABEL: 'Operational Activity Curve',
      CURVE_SUB: 'Past 30 Days -> Live',
      RESOLVED_30D: 'Resolved Grievances (30D)',
      AVG_RESPONSE: 'Average Response Time',
      CITIZEN_ENGAGEMENT: 'Citizen Engagement',
      DISTRICT_INDEX: 'District Performance Index'
    },
    te: {
      TIMELINE_TITLE: '30 రోజుల పాలన కార్యాచరణ కాలక్రమం',
      CURVE_LABEL: 'కార్యాచరణ కార్యాచరణ వక్రత',
      CURVE_SUB: 'గత 30 రోజులు -> ప్రత్యక్ష ప్రసారం',
      RESOLVED_30D: 'పరిష్కరించబడిన ఫిర్యాదులు (30 రోజులు)',
      AVG_RESPONSE: 'సగటు స్పందన సమయం',
      CITIZEN_ENGAGEMENT: 'పౌర భాగస్వామ్యం',
      DISTRICT_INDEX: 'జిల్లాల పనితీరు సూచీ'
    },
    ta: {
      TIMELINE_TITLE: '30 நாள் ஆட்சிமுறை செயல்பாட்டு காலவரிசை',
      CURVE_LABEL: 'செயல்பாட்டு வளைவு',
      CURVE_SUB: 'கடந்த 30 நாட்கள் -> நேரலை',
      RESOLVED_30D: 'தீர்க்கப்பட்ட புகார்கள் (30 நாட்கள்)',
      AVG_RESPONSE: 'சராசரி பதில் நேரம்',
      CITIZEN_ENGAGEMENT: 'குடிமக்கள் பங்களிப்பு',
      DISTRICT_INDEX: 'மாவட்ட செயல்பாட்டுக் குறியீடு'
    },
    kn: {
      TIMELINE_TITLE: '30 ದಿನಗಳ ಆಡಳಿತ ಚಟುವಟಿಕೆ ಕಾಲಗತಿ',
      CURVE_LABEL: 'ಕಾರ್ಯಾಚರಣೆಯ ಚಟುವಟಿಕೆ ರೇಖೆ',
      CURVE_SUB: 'ಕಳೆದ 30 ದಿನಗಳು -> ಲೈವ್',
      RESOLVED_30D: 'ಬಗೆಹರಿಸಲಾದ ದೂರುಗಳು (30 ದಿನ)',
      AVG_RESPONSE: 'ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯೆ ಸಮಯ',
      CITIZEN_ENGAGEMENT: 'ನಾಗರಿಕ ತೊಡಗಿಸಿಕೊಳ್ಳುವಿಕೆ',
      DISTRICT_INDEX: 'ಜಿಲ್ಲಾ ಕಾರ್ಯಾಚರಣೆ ಸೂಚ್ಯಂಕ'
    },
    hi: {
      TIMELINE_TITLE: '30-दिवसीय शासन गतिविधि समयरेखा',
      CURVE_LABEL: 'परिचालन गतिविधि वक्र',
      CURVE_SUB: 'पिछले 30 दिन -> लाइव',
      RESOLVED_30D: 'हल की गई शिकायतें (30 दिन)',
      AVG_RESPONSE: 'औसत प्रतिक्रिया समय',
      CITIZEN_ENGAGEMENT: 'नागरिक सहभागिता',
      DISTRICT_INDEX: 'जिला प्रदर्शन सूचकांक'
    }
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private dashboardService: DashboardService,
    private timelineService: TimelineService
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.dashboardService.loadStats().subscribe((stats) => {
      setTimeout(() => {
        this.activeGrievances = stats.totalComplaints;
        this.activeDepartments = stats.activeDepartments;
        this.emergencyAlerts = stats.liveAlerts ?? stats.statusBreakdown.escalated;
        this.slaCompliance = stats.slaSuccessRate;
        this.cdr.detectChanges();
      });
    });

    this.timelineService.getTimeline().subscribe((timeline) => {
      setTimeout(() => {
        this.resolved30d = timeline.resolved30d;
        this.responseHours = timeline.averageResponseTime;
        this.engagementRate = timeline.engagementRate;
        this.districtIndex = this.buildDistrictIndex(timeline.engagementRate, timeline.slaSuccessRate);
        this.cdr.detectChanges();
      });
    });

    this.timer = setInterval(() => {
      this.heatmap = this.buildHeatmap();
    }, 4000);

    this.applyTabFilter();
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  setActiveTab(isLive: boolean) {
    this.showLive = isLive;
    this.applyTabFilter();
  }

  setSelectedState(state: 'AP' | 'TS' | 'TN' | 'KA' | 'ALL') {
    this.selectedState = state;
    this.applyTabFilter();
  }

  applyTabFilter() {
    this.filteredUpdates = this.allUpdates.filter(u => {
      const matchesTab = u.isLive === this.showLive;
      const matchesState = this.selectedState === 'ALL' || u.state === this.selectedState;
      return matchesTab && matchesState;
    });
  }

  getTranslatedText(key: string): string {
    const lang = this.translationService.currentLang();
    const fallback = this.NEWS_CONTENT['en'][key] || '';
    return this.NEWS_CONTENT[lang]?.[key] || fallback;
  }

  getLabel(key: string): string {
    const lang = this.translationService.currentLang();
    const fallback = this.NEWS_CONTENT['en'][key] || '';
    return this.NEWS_CONTENT[lang]?.[key] || fallback;
  }

  getTimelineLabel(key: string): string {
    const lang = this.translationService.currentLang();
    const fallback = this.TIMELINE_LABELS['en'][key] || '';
    return this.TIMELINE_LABELS[lang]?.[key] || fallback;
  }

  private buildHeatmap(): string[] {
    const palette = ['#a7b89c', '#becdb4', '#d7dfc8', '#d9dceb', '#cfd2e3', '#d8c9de'];
    return Array.from({ length: 30 }, () => {
      const color = palette[this.randomBetween(0, palette.length - 1)];
      const alpha = 0.22 + this.randomBetween(0, 52) / 100;
      return `rgba(${this.hexToRgb(color)}, ${alpha.toFixed(2)})`;
    });
  }

  private buildDistrictIndex(engagementRate: number, slaSuccessRate: number): string {
    const score = (engagementRate + slaSuccessRate) / 2;
    if (score >= 97) return 'A+';
    if (score >= 92) return 'A';
    if (score >= 86) return 'B+';
    return 'B';
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private hexToRgb(hex: string): string {
    const value = hex.replace('#', '');
    const bigint = Number.parseInt(value, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  }
}
