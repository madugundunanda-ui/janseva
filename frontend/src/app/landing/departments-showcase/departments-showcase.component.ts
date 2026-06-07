import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, Inject, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DepartmentsService } from '../../core/services/departments.service';
import { Department } from '../../core/models/department.model';
import { TranslationService, LanguageCode } from '../../core/services/translation.service';

interface DepartmentItem extends Department {
  nameKey: string;
}

@Component({
  selector: 'app-departments-showcase',
  imports: [CommonModule],
  template: `
    <section #deptSection class="py-32 px-6 bg-transparent relative w-full border-t border-var overflow-hidden">
      <!-- Glow ambient overlay -->
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#6AA9FF]/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        <div class="mb-24 text-center">
          <span class="font-mono text-xs tracking-[0.25em] text-[#6AA9FF] uppercase mb-4 block animate-pulse">
            {{ translationService.t('STATE_SCALE_INFRA') }}
          </span>
          <h2 class="text-3xl md:text-5xl font-bold tracking-tight text-primary-var uppercase text-glow leading-none font-mono">
            {{ translationService.t('DEPT_ECOSYSTEM_TITLE') }}
          </h2>
          <p class="text-xs sm:text-sm text-muted-var font-mono mt-6 max-w-xl mx-auto uppercase tracking-wider">
            {{ translationService.t('DEPT_ECOSYSTEM_DESC') }}
          </p>
        </div>

        <!-- Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          @for (dept of displayedDepartments; track dept.id; let idx = $index) {
            <div (click)="openDetailPanel(dept)" [attr.data-card]="idx" class="dept-card glass-panel bg-glass-var border-var glow-card rounded-xl p-5 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:border-[#6AA9FF]/30 cursor-pointer">
              
              <!-- Top Row Info -->
              <div>
                <div class="flex justify-between items-start mb-4">
                  <span class="font-mono text-[9px] text-[#6AA9FF] uppercase tracking-wider font-bold">NODE 0{{ idx + 1 }}</span>
                  <!-- Pulse Indicator -->
                  <div class="flex items-center gap-1.5 font-mono text-[8px]">
                    <span class="w-1.5 h-1.5 rounded-full animate-pulse" [ngClass]="{
                      'bg-emerald-500': dept.liveStatus === 'operational',
                      'bg-amber-500': dept.liveStatus === 'congested',
                      'bg-red-500': dept.liveStatus === 'alert',
                      'bg-blue-500': dept.liveStatus === 'maintenance'
                    }"></span>
                    <span class="text-muted-var">{{ dept.liveStatus.toUpperCase() }}</span>
                  </div>
                </div>

                <h3 class="text-sm font-semibold text-primary-var font-mono uppercase tracking-wide mb-6">
                  {{ translationService.t(dept.nameKey) }}
                </h3>
              </div>

              <!-- Metrics -->
              <div class="space-y-2.5 pt-4 border-t border-var font-mono text-[9px] uppercase text-muted-var">
                <div class="flex justify-between">
                  <span>{{ translationService.t('DEPT_ACTIVE_LOAD') }}:</span>
                  <span class="text-primary-var font-bold">{{ dept.activeComplaints }} Tickets</span>
                </div>
                <div class="flex justify-between">
                  <span>{{ translationService.t('DEPT_SLA_CLEARED') }}:</span>
                  <span class="text-emerald-400 font-bold">{{ dept.resolutionRate }}%</span>
                </div>
                <div class="flex justify-between">
                  <span>{{ translationService.t('DEPT_AVG_RESPONSE') }}:</span>
                  <span class="text-primary-var">{{ dept.avgResponseTime }}h</span>
                </div>
              </div>

            </div>
          }
        </div>

        <!-- Show More/Less Button -->
        <div class="mt-12 text-center">
          <button (click)="toggleShowAll()" class="py-2.5 px-6 rounded-full border border-[#6AA9FF]/30 hover:border-[#6AA9FF] bg-[#6AA9FF]/5 hover:bg-[#6AA9FF]/10 text-[#6AA9FF] font-mono text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer">
            {{ showAll ? translationService.t('SHOW_LESS_DEPTS') : translationService.t('SHOW_MORE_DEPTS') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Detail Drawer Overlay -->
    @if (selectedDept) {
      <div (click)="closeDetailPanel()" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300"></div>
      <div class="fixed right-0 top-0 h-full w-[450px] max-w-full bg-[#0d1527]/95 backdrop-blur-md shadow-2xl z-50 border-l border-white/10 flex flex-col transition-transform duration-300 p-8 overflow-y-auto">
        <div class="flex justify-between items-center mb-8">
          <span class="font-mono text-[9px] text-[#6AA9FF] uppercase tracking-wider font-bold">DEPARTMENT OVERVIEW</span>
          <button (click)="closeDetailPanel()" class="text-muted-var hover:text-primary-var font-mono text-xs uppercase cursor-pointer">
            [CLOSE]
          </button>
        </div>

        <div class="space-y-8">
          <!-- Title and Stats -->
          <div>
            <h3 class="text-2xl font-bold font-mono uppercase tracking-tight text-primary-var mb-2">
              {{ translationService.t(selectedDept.nameKey) }}
            </h3>
            <div class="flex items-center gap-2 font-mono text-[9px]">
              <span class="w-2 h-2 rounded-full animate-pulse" [ngClass]="{
                'bg-emerald-500': selectedDept.liveStatus === 'operational',
                'bg-amber-500': selectedDept.liveStatus === 'congested',
                'bg-red-500': selectedDept.liveStatus === 'alert',
                'bg-blue-500': selectedDept.liveStatus === 'maintenance'
              }"></span>
              <span class="text-primary-var font-bold">{{ selectedDept.liveStatus.toUpperCase() }}</span>
              <span class="text-muted-var">|</span>
              <span class="text-muted-var">NODE {{ selectedDept.id.substring(0, 8).toUpperCase() }}</span>
            </div>
          </div>

          <!-- Metrics Grid -->
          <div class="grid grid-cols-3 gap-4 p-4 rounded-xl border border-white/5 bg-white/2 font-mono text-[10px] uppercase">
            <div>
              <span class="text-muted-var block mb-1">{{ translationService.t('DEPT_ACTIVE_LOAD') }}</span>
              <span class="text-base font-bold text-primary-var">{{ selectedDept.activeComplaints }} Tickets</span>
            </div>
            <div>
              <span class="text-muted-var block mb-1">{{ translationService.t('DEPT_SLA_CLEARED') }}</span>
              <span class="text-base font-bold text-emerald-400">{{ selectedDept.resolutionRate }}%</span>
            </div>
            <div>
              <span class="text-muted-var block mb-1">{{ translationService.t('DEPT_AVG_RESPONSE') }}</span>
              <span class="text-base font-bold text-primary-var">{{ selectedDept.avgResponseTime }}h</span>
            </div>
          </div>

          <!-- Purpose -->
          <div class="space-y-2">
            <h4 class="font-mono text-xs text-[#6AA9FF] uppercase tracking-wider font-bold">
              {{ translationService.t('DEPT_PURPOSE_LABEL') }}
            </h4>
            <p class="text-xs text-primary-var leading-relaxed font-mono uppercase">
              {{ getDeptPurpose(selectedDept.id) }}
            </p>
          </div>

          <!-- Handles Complaints -->
          <div class="space-y-3">
            <h4 class="font-mono text-xs text-[#6AA9FF] uppercase tracking-wider font-bold">
              {{ translationService.t('DEPT_HANDLES_LABEL') }}
            </h4>
            <ul class="space-y-2">
              @for (item of getDeptComplaints(selectedDept.id); track item) {
                <li class="flex items-start gap-2 text-xs text-primary-var font-mono uppercase">
                  <span class="text-cyan-400 mt-0.5">•</span>
                  <span>{{ item }}</span>
                </li>
              }
            </ul>
          </div>

          <!-- Resolution Process Flow -->
          <div class="space-y-4">
            <h4 class="font-mono text-xs text-[#6AA9FF] uppercase tracking-wider font-bold">
              {{ translationService.t('DEPT_RESOLUTION_PROCESS_LABEL') }}
            </h4>
            
            <div class="space-y-3 font-mono text-[10px] uppercase">
              @for (step of getWorkflowSteps(); track step; let last = $last; let stepIdx = $index) {
                <div class="flex items-center gap-4">
                  <div class="w-6 h-6 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-cyan-400 font-bold">
                    {{ stepIdx + 1 }}
                  </div>
                  <div class="text-primary-var font-semibold tracking-wide">
                    {{ step }}
                  </div>
                </div>
                @if (!last) {
                  <div class="pl-3 h-4 border-l border-white/10 my-0.5 ml-2.5"></div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class DepartmentsShowcaseComponent implements OnInit, AfterViewInit {
  @ViewChild('deptSection') sectionRef!: ElementRef<HTMLElement>;

  allDepartments: DepartmentItem[] = [
    { id: 'roads', name: 'Roads & Highways', nameKey: 'DEPT_ROADS', description: '', activeComplaints: 14, resolvedComplaints: 120, resolutionRate: 92, avgResponseTime: 4.2, liveStatus: 'operational' },
    { id: 'water', name: 'Water Supply', nameKey: 'DEPT_WATER', description: '', activeComplaints: 8, resolvedComplaints: 85, resolutionRate: 95, avgResponseTime: 3.5, liveStatus: 'operational' },
    { id: 'electricity', name: 'Electricity', nameKey: 'DEPT_ELECTRICITY', description: '', activeComplaints: 19, resolvedComplaints: 140, resolutionRate: 88, avgResponseTime: 2.8, liveStatus: 'congested' },
    { id: 'sanitation', name: 'Sanitation', nameKey: 'DEPT_SANITATION', description: '', activeComplaints: 26, resolvedComplaints: 90, resolutionRate: 82, avgResponseTime: 6.5, liveStatus: 'alert' },
    { id: 'health', name: 'Public Health', nameKey: 'DEPT_HEALTH', description: '', activeComplaints: 5, resolvedComplaints: 45, resolutionRate: 96, avgResponseTime: 12.0, liveStatus: 'operational' },
    { id: 'revenue', name: 'Revenue', nameKey: 'DEPT_REVENUE', description: '', activeComplaints: 11, resolvedComplaints: 60, resolutionRate: 85, avgResponseTime: 24.5, liveStatus: 'maintenance' },
    { id: 'transport', name: 'Transport', nameKey: 'DEPT_TRANSPORT', description: '', activeComplaints: 7, resolvedComplaints: 70, resolutionRate: 94, avgResponseTime: 8.0, liveStatus: 'operational' },
    { id: 'smart_city', name: 'Smart City Operations', nameKey: 'DEPT_SMART_CITY', description: '', activeComplaints: 4, resolvedComplaints: 50, resolutionRate: 98, avgResponseTime: 1.5, liveStatus: 'operational' },
    { id: 'rural_dev', name: 'Rural Development', nameKey: 'DEPT_RURAL_DEV', description: '', activeComplaints: 15, resolvedComplaints: 75, resolutionRate: 84, avgResponseTime: 16.2, liveStatus: 'congested' },
    { id: 'emergency', name: 'Emergency Response', nameKey: 'DEPT_EMERGENCY', description: '', activeComplaints: 2, resolvedComplaints: 190, resolutionRate: 99, avgResponseTime: 0.5, liveStatus: 'operational' },
    { id: 'parks', name: 'Public Parks & Gardens', nameKey: 'DEPT_PARKS', description: '', activeComplaints: 6, resolvedComplaints: 35, resolutionRate: 90, avgResponseTime: 18.0, liveStatus: 'operational' },
    { id: 'street_lights', name: 'Street Lighting', nameKey: 'DEPT_STREET_LIGHTS', description: '', activeComplaints: 21, resolvedComplaints: 110, resolutionRate: 86, avgResponseTime: 5.0, liveStatus: 'congested' },
    { id: 'waste', name: 'Waste Management', nameKey: 'DEPT_WASTE', description: '', activeComplaints: 18, resolvedComplaints: 125, resolutionRate: 89, avgResponseTime: 7.2, liveStatus: 'operational' },
    { id: 'drainage', name: 'Drainage & Sewerage', nameKey: 'DEPT_DRAINAGE', description: '', activeComplaints: 28, resolvedComplaints: 80, resolutionRate: 78, avgResponseTime: 10.5, liveStatus: 'alert' },
    { id: 'animal', name: 'Animal Control', nameKey: 'DEPT_ANIMAL', description: '', activeComplaints: 12, resolvedComplaints: 40, resolutionRate: 83, avgResponseTime: 14.0, liveStatus: 'maintenance' },
    { id: 'licensing', name: 'Municipal Licensing', nameKey: 'DEPT_LICENSING', description: '', activeComplaints: 9, resolvedComplaints: 65, resolutionRate: 91, avgResponseTime: 32.0, liveStatus: 'operational' },
    { id: 'housing', name: 'Public Housing & Urban Planning', nameKey: 'DEPT_HOUSING', description: '', activeComplaints: 13, resolvedComplaints: 55, resolutionRate: 87, avgResponseTime: 48.0, liveStatus: 'operational' },
    { id: 'pollution', name: 'Pollution Control & Environment', nameKey: 'DEPT_POLLUTION', description: '', activeComplaints: 10, resolvedComplaints: 48, resolutionRate: 89, avgResponseTime: 9.0, liveStatus: 'operational' },
    { id: 'welfare', name: 'Citizen Welfare & Social Services', nameKey: 'DEPT_WELFARE', description: '', activeComplaints: 16, resolvedComplaints: 95, resolutionRate: 85, avgResponseTime: 22.0, liveStatus: 'congested' },
    { id: 'disaster', name: 'Disaster Management & Relief', nameKey: 'DEPT_DISASTER', description: '', activeComplaints: 1, resolvedComplaints: 200, resolutionRate: 100, avgResponseTime: 1.0, liveStatus: 'operational' }
  ];

  displayedDepartments: DepartmentItem[] = this.allDepartments.slice(0, 10);
  showAll = false;
  selectedDept: DepartmentItem | null = null;

  private readonly DEPT_DETAILS: Record<LanguageCode, Record<string, { purpose: string; complaints: string[] }>> = {
    en: {
      roads: { purpose: 'Road maintenance, pothole repairs, street infrastructure, and road safety.', complaints: ['Potholes', 'Damaged roads', 'Missing road signs', 'Road obstructions'] },
      water: { purpose: 'Distribution of clean drinking water, pipeline maintenance, and water quality control.', complaints: ['No water supply', 'Leakages', 'Contaminated water', 'Low water pressure'] },
      electricity: { purpose: 'Power distribution, substation management, and street light electrical grids.', complaints: ['Power outages', 'Voltage fluctuation', 'Damaged transformers', 'Hanging wires'] },
      sanitation: { purpose: 'Public hygiene, street sweeping, garbage collections, and public toilets.', complaints: ['Uncleaned garbage', 'Public littering', 'Dirty public toilets', 'Pest control'] },
      health: { purpose: 'Municipal clinics, disease control, safety audits of restaurants, and immunization.', complaints: ['Vector diseases', 'Unhygienic food stalls', 'Lack of medicines', 'Clinic maintenance'] },
      revenue: { purpose: 'Property tax collection, land records, birth/death certificates, and commercial licensing.', complaints: ['Tax billing errors', 'Delayed certificates', 'Land record disputes', 'Property disputes'] },
      transport: { purpose: 'Public transit scheduling, bus shelters, traffic signal management, and parking.', complaints: ['Late buses', 'Broken bus shelters', 'Traffic light malfunction', 'Illegal parking'] },
      smart_city: { purpose: 'Wi-Fi zones, CCTV monitoring, smart environmental sensors, and civic apps.', complaints: ['Public Wi-Fi down', 'CCTV malfunction', 'Civic app bugs', 'Sensor errors'] },
      rural_dev: { purpose: 'Gram panchayat support, rural roads, water harvesting, and agricultural aid.', complaints: ['Unpaved rural roads', 'Lack of irrigation', 'Panchayat office delay', 'Farm support issues'] },
      emergency: { purpose: 'Disaster relief, fire alerts, medical dispatch, and urgent civic hazards.', complaints: ['Fire hazards', 'Flood control issues', 'Structural collapses', 'Hazard rescue'] },
      parks: { purpose: 'Maintenance of children playgrounds, public gardens, and open green spaces.', complaints: ['Overgrown grass', 'Broken playground equipment', 'Damaged benches', 'Poor lighting'] },
      street_lights: { purpose: 'Installation and maintenance of public street lights and solar lighting.', complaints: ['Non-functioning street lights', 'Dark streets', 'Exposed wiring', 'Damaged poles'] },
      waste: { purpose: 'Household waste collection, waste segregation, recycling, and composting plants.', complaints: ['Missed waste collection', 'Overflowing dumpsters', 'Open burning of waste', 'Lack of bins'] },
      drainage: { purpose: 'Underground drainage system, sewage treatment, and clearing of storm drains.', complaints: ['Overflowing sewage', 'Blocked drains', 'Damaged manholes', 'Wastewater flooding'] },
      animal: { purpose: 'Stray animal population control, rabies vaccination, and animal rescue.', complaints: ['Stray dog threats', 'Animal cruelty', 'Rabid animal sightings', 'Dead animal removal'] },
      licensing: { purpose: 'Trade licenses, vendor permits, restaurant health licenses, and construction permits.', complaints: ['Illegal vending', 'Unlicensed businesses', 'Building permit violations', 'Corruption'] },
      housing: { purpose: 'Low-income housing schemes, zoning laws, urban zoning, and building regulations.', complaints: ['Unauthorized construction', 'Encroachments', 'Slum redevelopment delays', 'Zoning violations'] },
      pollution: { purpose: 'Monitoring air and water quality, noise pollution regulations, and tree planting.', complaints: ['Industrial smoke', 'Noise pollution', 'Dumping in water bodies', 'Illegal tree cutting'] },
      welfare: { purpose: 'Pensions for seniors, support for disabled, women empowerment, and child care.', complaints: ['Pension delay', 'Disability support issues', 'Welfare center maintenance', 'Funding delays'] },
      disaster: { purpose: 'Pre-disaster planning, emergency alerts, cyclone/earthquake relief centers.', complaints: ['Relief camp poor conditions', 'Blocked evacuation routes', 'Delayed emergency alerts'] }
    },
    te: {
      roads: { purpose: 'రోడ్ల నిర్మాణం మరియు రహదారుల నిర్వహణ.', complaints: ['గుంతలు', 'దెబ్బతిన్న రోడ్లు', 'రహదారి అడ్డంకులు'] },
      water: { purpose: 'త్రాగునీటి సరఫరా మరియు పైప్‌లైన్ నిర్వహణ.', complaints: ['నీటి లీకేజీలు', 'తక్కువ పీడనం', 'కలుషిత నీరు'] },
      electricity: { purpose: 'విద్యుత్ పంపిణీ మరియు భద్రత.', complaints: ['విద్యుత్ కోతలు', 'వేలాడే వైర్లు', 'వోల్టేజ్ హెచ్చుతగ్గులు'] },
      sanitation: { purpose: 'ప్రజా పరిశుభ్రత మరియు వీధుల సఫాయి.', complaints: ['మురికి వీధులు', 'చెత్త పేరుకుపోవడం', 'బహిరంగ మూత్రవిసర్జన'] },
      health: { purpose: 'మున్సిపల్ క్లినిక్‌లు మరియు ప్రజారోగ్య రక్షణ.', complaints: ['దోమల పెరుగుదల', 'క్లినిక్ సదుపాయాల లేమి', 'ఆహార కల్తీ'] },
      revenue: { purpose: 'పన్ను వసూలు మరియు పౌర రికార్డుల నిర్వహణ.', complaints: ['పన్ను బిల్లింగ్ లోపాలు', 'సర్టిఫికెట్ల ఆలస్యం'] },
      transport: { purpose: 'ప్రభుత్వ బస్సులు, ట్రాఫిక్ సిగ్నల్స్ మరియు పార్కింగ్.', complaints: ['రవాణా ఆలస్యం', 'సిగ్నల్ పనిచేయకపోవడం', 'అనధికార పార్కింగ్'] },
      smart_city: { purpose: 'సీసీటీవీ నెట్‌వర్క్, వైఫై జోన్లు మరియు స్మార్ట్ యాప్స్.', complaints: ['పబ్లిక్ వైఫై వైఫల్యం', 'సీసీటీవీ పనిచేయకపోవడం'] },
      rural_dev: { purpose: 'గ్రామీణ వార్డుల అభివృద్ధి మరియు వ్యవసాయ సాయం.', complaints: ['మురికి గ్రామీణ రోడ్లు', 'సాగునీటి ఆలస్యం'] },
      emergency: { purpose: 'అత్యవసర స్పందన మరియు విపత్తు నివారణ.', complaints: ['అగ్ని ప్రమాదాలు', 'ముంపు నివారణ లోపాలు'] },
      parks: { purpose: 'పార్కులు, తోటలు మరియు పిల్లల ఆట స్థలాల నిర్వహణ.', complaints: ['పెరిగిన పిచ్చి మొక్కలు', 'విరిగిన ఆట సామాగ్రి'] },
      street_lights: { purpose: 'వీధి దీపాలు మరియు సోలార్ లైట్ల ఏర్పాటు.', complaints: ['పనిచేయని వీధి దీపాలు', 'చీకటి వీధులు'] },
      waste: { purpose: 'ఘన వ్యర్థాల సేకరింపు మరియు రీసైక్లింగ్.', complaints: ['చెత్త సేకరించకపోవడం', 'ఓవర్‌ఫ్లో డబ్బాలు'] },
      drainage: { purpose: 'భూగర్భ డ్రైనేజీ మరియు మురుగునీటి శుద్ధి.', complaints: ['మురుగు పొంగడం', 'మూసుకుపోయిన మ్యాన్‌హోల్స్'] },
      animal: { purpose: 'వీధి జంతువుల నియంత్రణ మరియు జంతు సంరక్షణ.', complaints: ['వీధి కుక్కల గుంపులు', 'చనిపోయిన జంతువుల తొలగింపు'] },
      licensing: { purpose: 'మున్సిపల్ లైసెన్సులు మరియు నిర్మాణ అనుమతులు.', complaints: ['అనుమతి లేని వ్యాపారాలు', 'అనధికార నిర్మాణాలు'] },
      housing: { purpose: 'బలహీన వర్గాల గృహనిర్మాణం మరియు పట్టణ ప్రణాళిక.', complaints: ['అనధికార జోనింగ్', 'స్థలాల ఆక్రమణలు'] },
      pollution: { purpose: 'గాలి, నీరు, మరియు శబ్ద కాలుష్య నియంత్రణ.', complaints: ['పారిశ్రామిక పొగ', 'విపరీతమైన శబ్దం', 'చెట్లు నరకడం'] },
      welfare: { purpose: 'వృద్ధాప్య పింఛన్లు మరియు సామాజిక సంక్షేమ పథకాలు.', complaints: ['పింఛన్ల ఆలస్యం', 'సహాయ నిధుల నిలిపివేత'] },
      disaster: { purpose: 'వరద రక్షణ మరియు తుఫాను సహాయ కేంద్రాలు.', complaints: ['విపత్తు హెచ్చరికల ఆలస్యం', 'సహాయ శిబిరాల సమస్యలు'] }
    },
    ta: {
      roads: { purpose: 'சாலை அமைத்தல் மற்றும் நெடுஞ்சாலை பராமரிப்பு.', complaints: ['சாலை பள்ளங்கள்', 'சேதமடைந்த சாலைகள்', 'சாலை அடைப்புகள்'] },
      water: { purpose: 'குடிநீர் விநியோகம் மற்றும் குழாய் பராமரிப்பு.', complaints: ['குடிநீர் கசிவு', 'குறைந்த அழுத்தம்', 'அசுத்தமான நீர்'] },
      electricity: { purpose: 'மின் விநியோகம் மற்றும் மின்சார பாதுகாப்பு.', complaints: ['மின் தடை', 'தொங்கும் கம்பிகள்', 'மின்னழுத்த மாறுபாடுகள்'] },
      sanitation: { purpose: 'பொது சுகாதாரம் மற்றும் வீதி துப்புரவு.', complaints: ['அழுக்கு வீதிகள்', 'குப்பை குவியல்கள்', 'பொது கழிப்பறை வசதியின்மை'] },
      health: { purpose: 'நகராட்சி மருத்துவமனைகள் மற்றும் பொது சுகாதார சேவைகள்.', complaints: ['கொசு தொல்லை', 'மருத்துவமனை குறைபாடுகள்', 'உணவு கலம்படம்'] },
      revenue: { purpose: 'வரி வசூல் மற்றும் நில ஆவணங்கள் பராமரிப்பு.', complaints: ['வரி விதிப்பு பிழைகள்', 'சான்றிதழ் தாமதங்கள்'] },
      transport: { purpose: 'பொது போக்குவரத்து மற்றும் போக்குவரத்து சிக்னல்கள்.', complaints: ['பேருந்து தாமதங்கள்', 'சிக்னல் பழுது', 'சட்டவிரோத வாகன நிறுத்தம்'] },
      smart_city: { purpose: 'சிசிடிவி கண்காணிப்பு மற்றும் பொது வைஃபை மண்டலங்கள்.', complaints: ['வைஃபை பழுது', 'சிசிடிவி செயலிழப்பு'] },
      rural_dev: { purpose: 'கிராமப்புற மேம்பாடு மற்றும் விவசாய உதவிகள்.', complaints: ['மண் சாலைகள்', 'நீர் பாசன குறைபாடுகள்'] },
      emergency: { purpose: 'அவசரக்கால உதவி மற்றும் பேரிடர் மீட்பு.', complaints: ['தீ விபத்து அபாயங்கள்', 'கட்டட இடிபாடுகள்'] },
      parks: { purpose: 'பூங்காக்கள் மற்றும் விளையாட்டு மைதானங்கள் பராமரிப்பு.', complaints: ['பூங்கா புதர் மண்டுதல்', 'உடைந்த விளையாட்டு உபகரணங்கள்'] },
      street_lights: { purpose: 'தெரு விளக்குகள் மற்றும் சோலார் விளக்குகள் பராமரிப்பு.', complaints: ['எரியாத தெரு விளக்குகள்', 'இருண்ட பகுதிகள்'] },
      waste: { purpose: 'குப்பை சேகரிப்பு மற்றும் கழிவு மேலாண்மை.', complaints: ['குப்பை எடுக்காமை', 'குப்பை தொட்டி நிரம்புதல்'] },
      drainage: { purpose: 'கழிவுநீர் வடிகால் மற்றும் பாதாள சாக்கடை பராமரிப்பு.', complaints: ['கழிவுநீர் பெருக்கெடுத்தல்', 'வடிகால் அடைப்பு'] },
      animal: { purpose: 'தெரு விலங்குகள் கட்டுப்பாடு மற்றும் விலங்கு மீட்பு.', complaints: ['தெரு நாய் தொல்லை', 'இறந்த விலங்கு அகற்றம்'] },
      licensing: { purpose: 'வர்த்தக உரிமங்கள் மற்றும் கட்டுமான அனுமதி.', complaints: ['அனுமதியற்ற கடைகள்', 'ஆக்கிரமிப்புகள்'] },
      housing: { purpose: 'ஏழை எளியோர் வீட்டுவசதி மற்றும் நகர திட்டமிடல்.', complaints: ['அனுமதியற்ற கட்டுமானங்கள்', 'இட ஆக்கிரமிப்பு'] },
      pollution: { purpose: 'காற்று, நீர் மற்றும் ஒலி மாசு கட்டுப்பாடு.', complaints: ['தொழிற்சாலை புகை', 'அதிக ஒலி மாசு', 'மரம் வெட்டுதல்'] },
      welfare: { purpose: 'முதியோர் ஓய்வೂதியம் மற்றும் நலத்திட்டங்கள்.', complaints: ['ஒய்வூதிய தாமதம்', 'நல நிதி உதவி பெறாமை'] },
      disaster: { purpose: 'வெள்ள மீட்பு மற்றும் பேரிடர் உதவி முகாம்கள்.', complaints: ['எச்சரிக்கை தாமதம்', 'முகாம் குறைபாடுகள்'] }
    },
    kn: {
      roads: { purpose: 'ರಸ್ತೆಗಳ ನಿರ್ಮಾಣ ಮತ್ತು ಹೆದ್ದಾರಿಗಳ ನಿರ್ವಹಣೆ.', complaints: ['ರಸ್ತೆ ಗುಂಡಿಗಳು', 'ಹಾನಿಗೊಳಗಾದ ರಸ್ತೆಗಳು', 'ರಸ್ತೆ ತಡೆಗಳು'] },
      water: { purpose: 'ಕುಡಿಯುವ ನೀರು ಸರಬರಾಜು ಮತ್ತು ಪೈಪ್‌ಲೈನ್ ನಿರ್ವಹಣೆ.', complaints: ['ನೀರು ಸೋರಿಕೆ', 'ಕಡಿಮೆ ಒತ್ತಡ', 'ಕಲುಷಿತ ನೀರು'] },
      electricity: { purpose: 'ವಿದ್ಯುತ್ ವಿತರಣೆ ಮತ್ತು ವಿದ್ಯುತ್ ಸುರಕ್ಷತೆ.', complaints: ['ವಿದ್ಯುತ್ ಕಡಿತ', 'ನೇತಾಡುವ ವೈರ್‌ಗಳು', 'ವೋಲ್ಟೇಜ್ ಏರುಪೇರು'] },
      sanitation: { purpose: 'ಸಾರ್ವಜನಿಕ ಸ್ವಚ್ಛತೆ ಮತ್ತು ಬೀದಿಗಳ ಗುಡಿಸುವಿಕೆ.', complaints: ['ಕೊಳಕು ಬೀದಿಗಳು', 'ಕಸದ ರಾಶಿ', 'ಸಾರ್ವಜನಿಕ ಮೂತ್ರ ವಿಸರ್ಜನೆ'] },
      health: { purpose: 'ಮುನ್ಸಿಪಲ್ ಕ್ಲಿನಿಕ್‌ಗಳು ಮತ್ತು ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ ರಕ್ಷಣೆ.', complaints: ['ಸೊಳ್ಳೆಗಳ ಕಾಟ', 'ಕ್ಲಿನಿಕ್ ಸೌಲಭ್ಯಗಳ ಕೊರತೆ', 'ಆಹಾರ ಕಲಬೆರಕೆ'] },
      revenue: { purpose: 'ತೆರಿಗೆ ವಸೂಲಿ ಮತ್ತು ನಾಗರಿಕ ದಾಖಲೆಗಳ ನಿರ್ವಹಣೆ.', complaints: ['ತೆರಿಗೆ ಬಿಲ್ಲಿಂಗ್ ದೋಷಗಳು', 'ಪ್ರಮಾಣಪತ್ರಗಳ ವಿಳಂಬ'] },
      transport: { purpose: 'ಸಾರ್ವಜನಿಕ ಬಸ್‌ಗಳು, ಟ್ರಾಫಿಕ್ ಸಿಗ್ನಲ್‌ಗಳು ಮತ್ತು ಪಾರ್ಕಿಂಗ್.', complaints: ['ಬಸ್ ವಿಳಂಬ', 'ಸಿಗ್ನಲ್ ದೋಷಗಳು', 'ಅನಧಿಕೃತ ಪಾರ್ಕಿಂಗ್'] },
      smart_city: { purpose: 'ಸಿಸಿಟಿವಿ ನೆಟ್‌ವರ್ಕ್, ವೈಫೈ ವಲಯಗಳು ಮತ್ತು ಸ್ಮಾರ್ಟ್ ಆ್ಯಪ್‌ಗಳು.', complaints: ['ಸಾರ್ವಜನಿಕ ವೈಫೈ ವೈಫಲ್ಯ', 'ಸಿಸಿಟಿವಿ ಆಫ್‌ಲೈನ್'] },
      rural_dev: { purpose: 'ಗ್ರಾಮೀಣ ವಾರ್ಡ್‌ಗಳ ಅಭಿವೃದ್ಧಿ ಮತ್ತು ಕೃಷಿ ನೆರವು.', complaints: ['ಕಚ್ಚಾ ರಸ್ತೆಗಳು', 'ನೀರಾವರಿ ವಿಳಂಬ'] },
      emergency: { purpose: 'ತುರ್ತು ಸ್ಪಂದನೆ ಮತ್ತು ಅಪಾಯಗಳ ನಿರ್ವಹಣೆ.', complaints: ['ಬೆಂಕಿ ಆಕಸ್ಮಿಕಗಳು', 'ಕಟ್ಟಡ ಕುಸಿತದ ಅಪಾಯಗಳು'] },
      parks: { purpose: 'ಉದ್ಯಾನವನಗಳು ಮತ್ತು ಮಕ್ಕಳ ಆಟದ ಮೈದಾನಗಳ ನಿರ್ವಹಣೆ.', complaints: ['ಬೆಳೆದ ಕಳೆಗಳು', 'ಮುರಿದ ಆಟದ ಸಾಮಗ್ರಿಗಳು'] },
      street_lights: { purpose: 'ಬೀದಿ ದೀಪಗಳು ಮತ್ತು ಸೋಲಾರ್ ದೀಪಗಳ ನಿರ್ವಹಣೆ.', complaints: ['ಬೀದಿ ದೀಪಗಳು ಆಫ್ ಆಗಿರುವುದು', 'ಕತ್ತಲೆ ರಸ್ತೆಗಳು'] },
      waste: { purpose: 'ಘನತ್ಯಾಜ್ಯ ಸಂಗ್ರಹಣೆ ಮತ್ತು ಮರುಬಳಕೆ.', complaints: ['ಕಸ ಸಂಗ್ರಹಿಸದಿರುವುದು', 'ತುಂಬಿ ಹರಿಯುವ ತೊಟ್ಟಿಗಳು'] },
      drainage: { purpose: 'ಒಳಚರಂಡಿ ಮತ್ತು ಮಳೆನೀರು ಚರಂಡಿಗಳ ನಿರ್ವಹಣೆ.', complaints: ['ಚರಂಡಿ ಉಕ್ಕಿ ಹರಿಯುವುದು', 'ಮ್ಯಾನ್‌ಹೋಲ್ ಬ್ಲಾಕ್'] },
      animal: { purpose: 'ಬೀದಿ ಪ್ರಾಣಿಗಳ ನಿಯಂತ್ರಣ ಮತ್ತು ಪ್ರಾಣಿಗಳ ರಕ್ಷಣೆ.', complaints: ['ಬೀದಿ ನಾಯಿಗಳ ಹಾವಳಿ', 'ಸತ್ತ ಪ್ರಾಣಿಗಳ ತೆರವು'] },
      licensing: { purpose: 'ವ್ಯಾಪಾರ ಪರವಾನಗಿಗಳು ಮತ್ತು ಕಟ್ಟಡ ಅನುಮತಿಗಳು.', complaints: ['ಪರವಾನಗಿ ಇಲ್ಲದ ವ್ಯಾಪಾರ', 'ಒತ್ತುವರಿ'] },
      housing: { purpose: 'ವಸತಿ ಯೋಜನೆಗಳು ಮತ್ತು ನಗರ ಯೋಜನೆ.', complaints: ['ವಲಯ ನಿಯಮಗಳ ಉಲ್ಲಂಘನೆ', 'ಜಾಗದ ಒತ್ತುವರಿ'] },
      pollution: { purpose: 'ವಾಯು, ಜಲ ಮತ್ತು ಶಬ್ದ ಮಾಲಿನ್ಯ ನಿಯಂತ್ರಣ.', complaints: ['ಕೈಗಾರಿಕಾ ಹೊಗೆ', 'ಅತಿಯಾದ ಶಬ್ದ', 'ಅಕ್ರಮ ಮರ ಕಡಿಯುವುದು'] },
      welfare: { purpose: 'ವೃದ್ಧಾಪ್ಯ ವೇತನ ಮತ್ತು ಸಾಮಾಜಿಕ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳು.', complaints: ['ಪಿಂಚಣಿ ವಿಳಂಬ', 'ಸಹಾಯಧನ ತಡೆಹಿಡಿಯುವಿಕೆ'] },
      disaster: { purpose: 'ಪ್ರವಾಹ ರಕ್ಷಣೆ ಮತ್ತು ಚಂಡಮಾರುತ ಪರಿಹಾರ ಕೇಂದ್ರಗಳು.', complaints: ['ವಿಪತ್ತು ಎಚ್ಚರಿಕೆಗಳ ವಿಳಂಬ', 'ಪರಿಹಾರ ಶಿಬಿರಗಳ ಕೊರತೆ'] }
    }
  };

  private readonly WORKFLOW_STEPS: Record<LanguageCode, string[]> = {
    en: ['Citizen Report', 'AI Classification', 'Officer Assignment', 'Field Verification', 'Resolution', 'Citizen Feedback'],
    te: ['పౌరుడి నివేదిక', 'AI వర్గీకరణ', 'అధికారి కేటాయింపు', 'క్షేత్ర స్థాయి పరిశీలన', 'పరిష్కారం', 'పౌరుడి అభిప్రాయం'],
    ta: ['குடிமகன் அறிக்கை', 'AI வகைப்பாடு', 'அதிகாரி நியமனம்', 'கள சரிபார்ப்பு', 'தீர்வு', 'குடிமக்கள் பின்னூட்டம்'],
    kn: ['ನಾಗರಿಕ ವರದಿ', 'AI ವರ್ಗೀಕರಣ', 'ಅಧಿಕಾರಿ ನಿಯೋಜನೆ', 'ಕ್ಷೇತ್ರ ಪರಿಶೀಲನೆ', 'ಪರಿಹಾರ', 'ನಾಗರಿಕ ಪ್ರತಿಕ್ರಿಯೆ']
  };

  public translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private departmentsService: DepartmentsService
  ) {}

  ngOnInit(): void {
    this.departmentsService.loadDepartments().subscribe((items) => {
      // Merge live data with our static 20 departments list
      this.allDepartments = this.allDepartments.map(staticDept => {
        // Find matching dept from database by matching either ID or normalized name
        const liveDept = items.find(d => 
          d.name.toLowerCase() === staticDept.name.toLowerCase() ||
          d.id === staticDept.id ||
          (staticDept.id === 'roads' && d.name.toLowerCase() === 'roads') ||
          (staticDept.id === 'drainage' && d.name.toLowerCase() === 'drainage') ||
          (staticDept.id === 'waste' && d.name.toLowerCase() === 'waste management') ||
          (staticDept.id === 'street_lights' && d.name.toLowerCase() === 'street lighting')
        );
        if (liveDept) {
          return {
            ...staticDept,
            id: liveDept.id, // Use database MongoDB ID so clicks work
            activeComplaints: liveDept.activeComplaints || staticDept.activeComplaints,
            resolutionRate: liveDept.resolutionRate || staticDept.resolutionRate,
            avgResponseTime: liveDept.avgResponseTime || staticDept.avgResponseTime,
            liveStatus: liveDept.liveStatus || staticDept.liveStatus
          };
        }
        return staticDept;
      });

      this.updateDisplayedDepartments();
      this.cdr.detectChanges();

      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
          this.animateCards();
        }, 50);
      }
    });
  }

  ngAfterViewInit(): void {}

  toggleShowAll() {
    this.showAll = !this.showAll;
    this.updateDisplayedDepartments();
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.animateCards();
      }, 50);
    }
  }

  updateDisplayedDepartments() {
    this.displayedDepartments = this.showAll ? this.allDepartments : this.allDepartments.slice(0, 10);
  }

  openDetailPanel(dept: DepartmentItem) {
    this.selectedDept = dept;
  }

  closeDetailPanel() {
    this.selectedDept = null;
  }

  getDeptPurpose(id: string): string {
    const lang = this.translationService.currentLang();
    const fallback = this.DEPT_DETAILS['en'][id]?.purpose || '';
    return this.DEPT_DETAILS[lang]?.[id]?.purpose || fallback;
  }

  getDeptComplaints(id: string): string[] {
    const lang = this.translationService.currentLang();
    const fallback = this.DEPT_DETAILS['en'][id]?.complaints || [];
    return this.DEPT_DETAILS[lang]?.[id]?.complaints || fallback;
  }

  getWorkflowSteps(): string[] {
    const lang = this.translationService.currentLang();
    return this.WORKFLOW_STEPS[lang] || this.WORKFLOW_STEPS['en'];
  }

  private animateCards() {
    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        const cards = this.sectionRef.nativeElement.querySelectorAll('.dept-card');
        if (cards.length === 0) return;

        gsap.fromTo(cards, 
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.05,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: this.sectionRef.nativeElement,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
    });
  }
}
