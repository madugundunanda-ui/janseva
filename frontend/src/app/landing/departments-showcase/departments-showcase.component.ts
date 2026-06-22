import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, Inject, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DepartmentsService } from '../../core/services/departments.service';
import { Department } from '../../core/models/department.model';
import { TranslationService, LanguageCode } from '../../core/services/translation.service';

interface DepartmentItem extends Department {
  nameKey: string;
  key?: string;
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

          <!-- Services Provided -->
          <div class="space-y-3">
            <h4 class="font-mono text-xs text-[#6AA9FF] uppercase tracking-wider font-bold">
              {{ translationService.t('SERVICES_LABEL') || 'Services Provided' }}
            </h4>
            <ul class="space-y-2">
              @for (item of getDeptServices(selectedDept.id); track item) {
                <li class="flex items-start gap-2 text-xs text-primary-var font-mono uppercase">
                  <span class="text-emerald-400 mt-0.5">•</span>
                  <span>{{ item }}</span>
                </li>
              }
            </ul>
          </div>

          <!-- Core Responsibilities -->
          <div class="space-y-3">
            <h4 class="font-mono text-xs text-[#6AA9FF] uppercase tracking-wider font-bold">
              {{ translationService.t('RESPONSIBILITIES_LABEL') || 'Core Responsibilities' }}
            </h4>
            <ul class="space-y-2">
              @for (item of getDeptResponsibilities(selectedDept.id); track item) {
                <li class="flex items-start gap-2 text-xs text-primary-var font-mono uppercase">
                  <span class="text-amber-400 mt-0.5">•</span>
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

  private readonly DEPT_DETAILS: Record<LanguageCode, Record<string, { purpose: string; complaints: string[]; services: string[]; responsibilities: string[] }>> = {
    en: {
      roads: {
        purpose: 'Road maintenance, pothole repairs, street infrastructure, and road safety.',
        complaints: ['Potholes', 'Damaged roads', 'Missing road signs', 'Road obstructions'],
        services: ['Road surfacing', 'Pothole patching', 'Sign installation', 'Sidewalk repair'],
        responsibilities: ['Maintain safe road structures', 'Manage traffic signs', 'Upgrade pedestrian facilities', 'Inspect bridge safety']
      },
      water: {
        purpose: 'Distribution of clean drinking water, pipeline maintenance, and water quality control.',
        complaints: ['No water supply', 'Leakages', 'Contaminated water', 'Low water pressure'],
        services: ['Drinking water supply', 'Pipeline repairs', 'Water testing', 'Meter installation'],
        responsibilities: ['Ensure clean water delivery', 'Fix water pipeline leakages', 'Monitor water reservoir levels', 'Perform chemical quality checks']
      },
      electricity: {
        purpose: 'Power distribution, substation management, and street light electrical grids.',
        complaints: ['Power outages', 'Voltage fluctuation', 'Damaged transformers', 'Hanging wires'],
        services: ['Grid maintenance', 'Transformer servicing', 'Electrical safety inspection', 'Power line mapping'],
        responsibilities: ['Coordinate power supply grids', 'Address dangling or live wires', 'Prevent transformer failures', 'Maintain sub-station safety']
      },
      sanitation: {
        purpose: 'Public hygiene, street sweeping, garbage collections, and public toilets.',
        complaints: ['Uncleaned garbage', 'Public littering', 'Dirty public toilets', 'Pest control'],
        services: ['Public restroom cleaning', 'Street sweeping', 'Drain disinfecting', 'Community cleanliness drives'],
        responsibilities: ['Manage municipal hygiene', 'Maintain clean public restrooms', 'Coordinate health audits', 'Conduct vector control programs']
      },
      health: {
        purpose: 'Municipal clinics, disease control, safety audits of restaurants, and immunization.',
        complaints: ['Vector diseases', 'Unhygienic food stalls', 'Lack of medicines', 'Clinic maintenance'],
        services: ['Vaccination drives', 'Clinic maintenance', 'Restaurant safety audits', 'Outbreak monitoring'],
        responsibilities: ['Monitor local public health', 'Inspect food stall sanitation', 'Manage primary municipal health clinics', 'Distribute critical medicines']
      },
      revenue: {
        purpose: 'Property tax collection, land records, birth/death certificates, and commercial licensing.',
        complaints: ['Tax billing errors', 'Delayed certificates', 'Land record disputes', 'Property disputes'],
        services: ['Property tax billing', 'Land registry', 'Certificate issuance', 'Trade license collection'],
        responsibilities: ['Collect municipal tax', 'Maintain official land records', 'Issue birth/death certificates', 'Resolve commercial disputes']
      },
      transport: {
        purpose: 'Public transit scheduling, bus shelters, traffic signal management, and parking.',
        complaints: ['Late buses', 'Broken bus shelters', 'Traffic light malfunction', 'Illegal parking'],
        services: ['Bus scheduling', 'Transit terminal care', 'Traffic signal coordination', 'Public parking management'],
        responsibilities: ['Optimize public bus schedules', 'Repair terminal bus shelters', 'Manage traffic lights', 'Monitor public parking systems']
      },
      smart_city: {
        purpose: 'Wi-Fi zones, CCTV monitoring, smart environmental sensors, and civic apps.',
        complaints: ['Public Wi-Fi down', 'CCTV malfunction', 'Civic app bugs', 'Sensor errors'],
        services: ['Public Wi-Fi maintenance', 'CCTV feed monitoring', 'IoT sensor check', 'Digital civic portal support'],
        responsibilities: ['Maintain municipal Wi-Fi networks', 'Manage safety CCTV cameras', 'Monitor air/noise sensor inputs', 'Debug e-governance app portals']
      },
      rural_dev: {
        purpose: 'Gram panchayat support, rural roads, water harvesting, and agricultural aid.',
        complaints: ['Unpaved rural roads', 'Lack of irrigation', 'Panchayat office delay', 'Farm support issues'],
        services: ['Panchayat construction', 'Irrigation canal care', 'Agricultural seed subsidy', 'Rural road paving'],
        responsibilities: ['Support gram panchayat offices', 'Pave rural connector roads', 'Construct irrigation canals', 'Deliver farm welfare programs']
      },
      emergency: {
        purpose: 'Disaster relief, fire alerts, medical dispatch, and urgent civic hazards.',
        complaints: ['Fire hazards', 'Flood control issues', 'Structural collapses', 'Hazard rescue'],
        services: ['Hazard evacuation', 'Disaster rescue', 'Fire safety reviews', 'Flood relief camp setup'],
        responsibilities: ['Deploy immediate disaster relief', 'Rescue trapped citizens', 'Coordinate fire hazards', 'Bypass bureaucratic queues for safety']
      }
    },
    te: {
      roads: {
        purpose: 'రోడ్ల నిర్మాణం మరియు రహదారుల నిర్వహణ.',
        complaints: ['గుంతలు', 'దెబ్బతిన్న రోడ్లు', 'రహదారి అడ్డంకులు'],
        services: ['రోడ్ల ఉపరితల నిర్మాణం', 'గుంతలు పూడ్చడం', 'చిహ్నాల వ్యవస్థాపన', 'ఫుట్‌పాత్ మరమ్మత్తు'],
        responsibilities: ['సురక్షిత రోడ్ల నిర్మాణం నిర్వహించడం', 'ట్రాఫిక్ చిహ్నాలను నిర్వహించడం', 'పాదచారుల సౌకర్యాలను అప్‌గ్రేడ్ చేయడం', 'వంతెనల భద్రతను తనిఖీ చేయడం']
      },
      water: {
        purpose: 'త్రాగునీటి సరఫరా మరియు పైప్‌లైన్ నిర్వహణ.',
        complaints: ['నీటి లీకేజీలు', 'తక్కువ పీడనం', 'కలుషిత నీరు'],
        services: ['త్రాగునీటి సరఫరా', 'పైప్‌లైన్ మరమ్మతులు', 'నీటి నాణ్యత పరీక్ష', 'మీటర్ వ్యవస్థాపన'],
        responsibilities: ['స్వచ్ఛమైన నీటి పంపిణీని నిర్ధారించడం', 'నీటి పైప్‌లైన్ లీకేజీలను పరిష్కరించడం', 'నీటి నిల్వల స్థాయిలను పర్యవేక్షించడం', 'రసాయన నాణ్యత తనిఖీలను నిర్వహించడం']
      },
      electricity: {
        purpose: 'విద్యుత్ పంపిణీ మరియు భద్రత.',
        complaints: ['విద్యుత్ కోతలు', 'వేలాడే వైర్లు', 'వోల్టేజ్ హెచ్చుతగ్గులు'],
        services: ['గ్రిడ్ నిర్వహణ', 'ట్రాన్స్‌ఫార్మర్ సర్వీసింగ్', 'విద్యుత్ భద్రతా తనిఖీ', 'పవర్ లైన్ మ్యాపింగ్'],
        responsibilities: ['విద్యుత్ సరఫరా గ్రిడ్‌లను సమన్వయం చేయడం', 'వేలాడే లేదా సజీవ వైర్లను పరిష్కరించడం', 'ట్రాన్స్‌ఫార్మర్ వైఫల్యాలను నిరోధించడం', 'సబ్ స్టేషన్ భద్రతను నిర్వహించడం']
      },
      sanitation: {
        purpose: 'ప్రజా పరిశుభ్రత మరియు వీధుల సఫాయి.',
        complaints: ['మురికి వీధులు', 'చెత్త పేరుకుపోవడం', 'బహిరంగ మూత్రవిసర్జన'],
        services: ['ప్రజా మరుగుదొడ్ల శుభ్రత', 'వీధుల ఊడ్చివేత', 'డ్రైన్ల క్రిమిసంహారక చర్యలు', 'పరిశుభ్రత ప్రచారాలు'],
        responsibilities: ['మున్సిపల్ పరిశుభ్రతను నిర్వహించడం', 'ప్రజా శౌచాలయాలను శుభ్రంగా ఉంచడం', 'ఆరోగ్య ఆడిట్లను నిర్వహించడం', 'దోమల నివారణ చర్యలు చేపట్టడం']
      },
      health: {
        purpose: 'మున్సిపల్ క్లినిక్‌లు మరియు ప్రజారోగ్య రక్షణ.',
        complaints: ['దోమల పెరుగుదల', 'క్లినిక్ సదుపాయాల లేమి', 'ఆహార కల్తీ'],
        services: ['టీకా డ్రైవ్‌లు', 'క్లినిక్ నిర్వహణ', 'రెస్టారెంట్ భద్రతా ఆడిట్లు', 'వ్యాధుల వ్యాప్తి పర్యవేక్షణ'],
        responsibilities: ['స్థానిక ప్రజారోగ్యాన్ని పర్యవేక్షించడం', 'ఆహారశాలల పరిశుభ్రతను తనిఖీ చేయడం', 'మున్సిపల్ ప్రాథమిక ఆరోగ్య కేంద్రాల నిర్వహణ', 'ముఖ్యమైన ఔషధాల పంపిణీ']
      },
      revenue: {
        purpose: 'పన్ను వసూలు మరియు పౌర రికార్డుల నిర్వహణ.',
        complaints: ['పన్ను బిల్లింగ్ లోపాలు', 'సర్టిఫికెట్ల ఆలస్యం'],
        services: ['ఆస్తి పన్ను బిల్లింగ్', 'భూమి రిజిస్ట్రేషన్', 'ధృవీకరణ పత్రాల జారీ', 'వ్యాపార లైసెన్స్ రుసుము వసూలు'],
        responsibilities: ['మున్సిపల్ పన్ను వసూలు', 'భూ రికార్డుల నిర్వహణ', 'జనన/మరణ ధృవీకరణ పత్రాల జారీ', 'వాణిజ్య వివాదాల పరిష్కారం']
      },
      transport: {
        purpose: 'ప్రభుత్వ బస్సులు, ట్రాఫిక్ సిగ్నల్స్ మరియు పార్కింగ్.',
        complaints: ['రవాణా ఆలస్యం', 'సిగ్నల్ పనిచేయకపోవడం', 'అనధికార పార్కింగ్'],
        services: ['బస్సుల సమయ పట్టిక పర్యవేక్షణ', 'బస్సు షెల్టర్ల నిర్వహణ', 'ట్రాఫిక్ సిగ్నల్స్ సమన్వయం', 'పార్కింగ్ స్థలాల నిర్వహణ'],
        responsibilities: ['ప్రజా రవాణా సమయాలను ఆప్టిమైజ్ చేయడం', 'బస్సు షెల్టర్లను మరమ్మతు చేయడం', 'ట్రాఫిక్ సిగ్నల్స్ నిర్వహణ', 'పార్కింగ్ వ్యవస్థలను పర్యవేక్షించడం']
      },
      smart_city: {
        purpose: 'సీసీటీవీ నెట్‌వర్క్, వైఫై జోన్లు మరియు స్మార్ట్ యాప్స్.',
        complaints: ['పబ్లిక్ వైఫై వైఫల్యం', 'సీసీటీవీ పనిచేయకపోవడం'],
        services: ['ఉచిత వైఫై నిర్వహణ', 'సీసీటీవీ పర్యవేక్షణ', 'సెన్సార్ల తనిఖీ', 'డిజిటల్ పోర్టల్ సహాయం'],
        responsibilities: ['మున్సిపಲ್ వైఫై వ్యవస్థను నిర్వహించడం', 'భద్రతా సీసీటీవీల పర్యవేక్షణ', 'గాలి/శబ్ద కాలుష్య సెన్సార్ల పర్యవేక్షణ', 'ఈ-గవర్నెన్స్ యాప్స్ సమస్యల పరిష్కారం']
      },
      rural_dev: {
        purpose: 'గ్రామీణ వార్డుల అభివృద్ధి మరియు వ్యవసాయ సాయం.',
        complaints: ['మురికి గ్రామీణ రోడ్లు', 'సాగునీటి ఆలస్యం'],
        services: ['గ్రామ పంచాయతీల నిర్మాణం', 'సాగునీటి కాలువల నిర్వహణ', 'వ్యవసాయ రాయితీలు', 'గ్రామీణ రోడ్ల నిర్మాణం'],
        responsibilities: ['గ్రామ పంచాయతీ కార్యాలయాలకు మద్దతు', 'గ్రామీణ అనుసంధాన రోడ్ల నిర్మాణం', 'సాగునీటి కాలువల మరమ్మతులు', 'రైతు సంక్షేమ పథకాల పంపిణీ']
      },
      emergency: {
        purpose: 'అత్యవసర స్పందన మరియు విపత్తు నివారణ.',
        complaints: ['అగ్ని ప్రమాదాలు', 'ముంపు నివారణ లోపాలు'],
        services: ['సహాయక చర్యలు', 'విపత్తు రక్షణ', 'అగ్ని ప్రమాదాల తనిఖీలు', 'వరద సహాయ శిబిరాల ఏర్పాటు'],
        responsibilities: ['తక్షణ విపత్తు ఉపశమనం అందించడం', 'చిక్కుకున్న పౌరులను రక్షించడం', 'అగ్ని ప్రమాదాల సమన్వయం', 'భద్రత కోసం అత్యవసర చర్యలు చేపట్టడం']
      }
    },
    ta: {
      roads: {
        purpose: 'சாலை அமைத்தல் மற்றும் நெடுஞ்சாலை பராமரிப்பு.',
        complaints: ['சாலை பள்ளங்கள்', 'சேதமடைந்த சாலைகள்', 'சாலை அடைப்புகள்'],
        services: ['சாலை அமைத்தல்', 'பள்ளம் சரிசெய்தல்', 'சிக்னல் நிறுவுதல்', 'நடைபாதை பராமரிப்பு'],
        responsibilities: ['பாதுகாப்பான சாலை கட்டமைப்புகளை பராமரித்தல்', 'போக்குவரத்து சிக்னல்களை நிர்வகித்தல்', 'நடைபாதை வசதிகளை மேம்படுத்துதல்', 'பாலங்களின் பாதுகாப்பை ஆய்வு செய்தல்']
      },
      water: {
        purpose: 'குடிநீர் விநியோகம் மற்றும் குழாய் பராமரிப்பு.',
        complaints: ['குடிநீர் கசிவு', 'குறைந்த அழுத்தம்', 'அசுத்தமான நீர்'],
        services: ['குடிநீர் விநியோகம்', 'குழாய் பழுதுபார்ப்பு', 'நீர் தரம் சோதனை', 'மீட்டர் நிறுவுதல்'],
        responsibilities: ['சுத்தமான குடிநீர் விநியோகத்தை உறுதி செய்தல்', 'குடிநீர் குழாய் கசிவுகளை சரிசெய்தல்', 'நீர் தேக்க நிலைகளை கண்காணித்தல்', 'வேதியியல் தர சோதனைகளை மேற்கொள்வது']
      },
      electricity: {
        purpose: 'மின் விநியோகம் மற்றும் மின்சார பாதுகாப்பு.',
        complaints: ['மின் தடை', 'தொங்கும் கம்பிகள்', 'மின்னழுத்த மாறுபாடுகள்'],
        services: ['மின் கட்டமைப்பு பராமரிப்பு', 'மின்மாற்றி பழுதுபார்ப்பு', 'மின் பாதுகாப்பு தணிக்கை', 'மின் கம்பி வரைபடம்'],
        responsibilities: ['மின் விநியோகத்தை ஒருங்கிணைத்தல்', 'தொங்கும் அல்லது மின்சார கம்பிகளை சரிசெய்தல்', 'மின்மாற்றி பழுதடைவதைத் தடுத்தல்', 'துணை மின் நிலைய பாதுகாப்பை பராமரித்தல்']
      },
      sanitation: {
        purpose: 'பொது சுகாதாரம் மற்றும் வீதி துப்புரவு.',
        complaints: ['அழுக்கு வீதிகள்', 'குப்பை குவியல்கள்', 'பொது கழிப்பறை வசதியின்மை'],
        services: ['பொது கழிப்பறை சுத்தம் செய்தல்', 'வீதி துப்புரவு பணி', 'சாக்கடை கிருமிநாசினி தெளிப்பு', 'சமூக தூய்மை பிரச்சாரம்'],
        responsibilities: ['நகராட்சி சுகாதாரத்தை நிர்வகித்தல்', 'பொது கழிப்பறைகளை தூய்மையாக வைத்திருத்தல்', 'சுகாதார தணிக்கைகளை ஒருங்கிணைத்தல்', 'கொசு/பூச்சி கட்டுப்பாட்டு திட்டங்களை மேற்கொள்வது']
      },
      health: {
        purpose: 'நகராட்சி மருத்துவமனைகள் மற்றும் பொது சுகாதார சேவைகள்.',
        complaints: ['கொசு தொல்லை', 'மருத்துவமனை குறைபாடுகள்', 'உணவு கலம்படம்'],
        services: ['தடுப்பூசி முகாம்கள்', 'மருத்துவமனை பராமரிப்பு', 'உணவக பாதுகாப்பு தணிக்கை', 'நோய் கண்காணிப்பு'],
        responsibilities: ['உள்ளூர் பொது சுகாதாரத்தை கண்காணித்தல்', 'உணவக சுகாதாரத்தை ஆய்வு செய்தல்', 'நகராட்சி ஆரம்ப சுகாதார நிலையங்களை நிர்வகித்தல்', 'முக்கிய மருந்துகளை விநியோகித்தல்']
      },
      revenue: {
        purpose: 'வரி வசூல் மற்றும் நில ஆவணங்கள் பராமரிப்பு.',
        complaints: ['வரி விதிப்பு பிழைகள்', 'சான்றிதழ் தாமதங்கள்'],
        services: ['சொத்து வரி மதிப்பீடு', 'நில பதிவு', 'சான்றிதழ் வழங்குதல்', 'வர்த்தக உரிமம் வசூல்'],
        responsibilities: ['நகராட்சி வரி வசூல்', 'நில ஆவணங்களை பராமரித்தல்', 'பிறப்பு/இறப்பு சான்றிதழ்களை வழங்குதல்', 'வணிக ரீதியான தகராறுகளை தீர்ப்பது']
      },
      transport: {
        purpose: 'பொது போக்குவரத்து மற்றும் போக்குவரத்து சிக்னல்கள்.',
        complaints: ['பேருந்து தாமதங்கள்', 'சிக்னல் பழுது', 'சட்டவிரோத வாகன நிறுத்தம்'],
        services: ['பேருந்து கால அட்டவணை', 'பேருந்து நிறுத்த பராமரிப்பு', 'போக்குவரத்து சிக்னல் ஒருங்கிணைப்பு', 'வாகன நிறுத்த மேலாண்மை'],
        responsibilities: ['பேருந்து கால அட்டவணையை மேம்படுத்துதல்', 'பேருந்து நிறுத்தங்களை பழுதுபார்ப்பது', 'சிக்னல்களை நிர்வகித்தல்', 'வாகன நிறுத்தங்களை கண்காணித்தல்']
      },
      smart_city: {
        purpose: 'சிசிடிவி கண்காணிப்பு மற்றும் பொது வைஃபை மண்டலங்கள்.',
        complaints: ['வைஃபை பழுது', 'சிசிடிவி செயலிழப்பு'],
        services: ['பொது வைஃபை பராமரிப்பு', 'சிசிடிவி கண்காணிப்பு', 'சென்சார் சரிபார்ப்பு', 'இணைய போர்டல் ஆதரவு'],
        responsibilities: ['நகராட்சி வைஃபை நெட்வொர்க்குகளை பராமரித்தல்', 'பாதுகாப்பு கேமராக்களை நிர்வகித்தல்', 'காற்று/ஒலி சென்சார்களை கண்காணித்தல்', 'இணைய செயலிகளை சரிசெய்தல்']
      },
      rural_dev: {
        purpose: 'கிராமப்புற மேம்பாடு மற்றும் விவசாய உதவிகள்.',
        complaints: ['மண் சாலைகள்', 'நீர் பாசன குறைபாடுகள்'],
        services: ['பஞ்சாயத்து கட்டடங்கள்', 'நீர் பாசன கால்வாய்', 'விவசாய மானியம்', 'கிராமப்புற சாலை அமைத்தல்'],
        responsibilities: ['கிராம பஞ்சாயத்து அலுவலகங்களை ஆதரித்தல்', 'இணைப்பு சாலைகளை அமைத்தல்', 'பாசன கால்வாய்களை உருவாக்குதல்', 'விவசாயிகளுக்கான நலத்திட்டங்களை வழங்குதல்']
      },
      emergency: {
        purpose: 'அவசரக்கால உதவி மற்றும் பேரிடர் மீட்பு.',
        complaints: ['தீ விபத்து அபாயங்கள்', 'கட்டட இடிபாடுகள்'],
        services: ['தீயணைப்பு மீட்பு', 'அவசர சிகிச்சை முகாம்', 'வெள்ள நிவாரண முகாம்', 'அபாய மீட்பு பணி'],
        responsibilities: ['உடனடி பேரிடர் நிவாரணங்களை வழங்குதல்', 'மக்களை பாதுகாப்பாக மீட்பது', 'தீ விபத்துகளை ஒருங்கிணைத்தல்', 'பாதுகாப்பிற்கான அவசர முடிவுகளை எடுப்பது']
      }
    },
    kn: {
      roads: {
        purpose: 'ರಸ್ತೆಗಳ ನಿರ್ಮಾಣ ಮತ್ತು ಹೆದ್ದಾರಿಗಳ ನಿರ್ವಹಣೆ.',
        complaints: ['ರಸ್ತೆ ಗುಂಡಿಗಳು', 'ಹಾನಿಗೊಳಗಾದ ರಸ್ತೆಗಳು', 'ರಸ್ತೆ ತಡೆಗಳು'],
        services: ['ರಸ್ತೆ ಡಾಂಬರೀಕರಣ', 'ರಸ್ತೆ ಗುಂಡಿ ಮುಚ್ಚುವುದು', 'ರಸ್ತೆ ಚಿಹ್ನೆಗಳ ಅಳವಡಿಕೆ', 'ಫುಟ್‌ಪಾತ್ ದುರಸ್ತಿ'],
        responsibilities: ['ಸುರಕ್ಷಿತ ರಸ್ತೆ ಕಾಮಗಾರಿಗಳ ನಿರ್ವಹಣೆ', 'ಟ್ರಾಫಿಕ್ ಚಿಹ್ನೆಗಳ ನಿಯಂತ್ರಣ', 'ಪಾದಚಾರಿಗಳ ಸೌಲಭ್ಯಗಳನ್ನು ಉತ್ತಮಗೊಳಿಸುವುದು', 'ಸೇತುವೆಗಳ ಸುರಕ್ಷತೆ ಪರಿಶೀಲನೆ']
      },
      water: {
        purpose: 'ಕುಡಿಯುವ ನೀರು ಸರಬರಾಜು ಮತ್ತು ಪೈಪ್‌ಲೈನ್ ನಿರ್ವಹಣೆ.',
        complaints: ['ನೀರು ಸೋರಿಕೆ', 'ಕಡಿಮೆ ಒತ್ತಡ', 'ಕಲುಷಿತ ನೀರು'],
        services: ['ಕುಡಿಯುವ ನೀರು ಸರಬರಾಜು', 'ಪೈಪ್‌ಲೈನ್ ದುರಸ್ತಿ', 'ನೀರಿನ ಗುಣಮಟ್ಟ ಪರೀಕ್ಷೆ', 'ಮೀಟರ್ ಅಳವಡಿಕೆ'],
        responsibilities: ['ಸ್ವಚ್ಛ ನೀರಿನ ವಿತರಣೆಯನ್ನು ಖಚಿತಪಡಿಸುವುದು', 'ನೀರಿನ ಪೈಪ್‌ಲೈನ್ ಸೋರಿಕೆಗಳನ್ನು ಸರಿಪಡಿಸುವುದು', 'ಜಲಾಶಯಗಳ ಮಟ್ಟವನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡುವುದು', 'ರಾಸಾಯನಿಕ ಗುಣಮಟ್ಟ ಪರೀಕ್ಷೆಗಳನ್ನು ನಡೆಸುವುದು']
      },
      electricity: {
        purpose: 'ವಿದ್ಯುತ್ ವಿತರಣೆ ಮತ್ತು ವಿದ್ಯುತ್ ಸುರಕ್ಷತೆ.',
        complaints: ['ವಿದ್ಯುತ್ ಕಡಿತ', 'ನೇತಾಡುವ ವೈರ್‌ಗಳು', 'ವೋಲ್ಟೇಜ್ ಏರುಪೇರು'],
        services: ['ವಿದ್ಯುತ್ ಗ್ರಿಡ್ ನಿರ್ವಹಣೆ', 'ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ದುರಸ್ತಿ', 'ವಿದ್ಯುತ್ ಸುರಕ್ಷತೆ ತಪಾಸಣೆ', 'ವೈರಿಂಗ್ ನಕ್ಷೆ ತಯಾರಿಕೆ'],
        responsibilities: ['ವಿದ್ಯುತ್ ಸರಬರಾಜು ಜಾಲವನ್ನು ಸಮನ್ವಯಗೊಳಿಸುವುದು', 'ನೇತಾಡುವ ವಿದ್ಯುತ್ ತಂತಿಗಳನ್ನು ಸರಿಪಡಿಸುವುದು', 'ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ವೈಫಲ್ಯಗಳನ್ನು ತಡೆಯುವುದು', 'ಸಬ್ ಸ್ಟೇಷನ್ ಸುರಕ್ಷತೆಯನ್ನು ಕಾಪಾಡುವುದು']
      },
      sanitation: {
        purpose: 'ಸಾರ್ವಜನಿಕ ಸ್ವಚ್ಛತೆ ಮತ್ತು ಬೀದಿಗಳ ಗುಡಿಸುವಿಕೆ.',
        complaints: ['ಕೊಳಕು ಬೀದಿಗಳು', 'ಕಸದ ರಾಶಿ', 'ಸಾರ್ವಜನಿಕ ಮೂತ್ರ ವಿಸರ್ಜನೆ'],
        services: ['ಸಾರ್ವಜನಿಕ ಶೌಚಾಲಯಗಳ ಸ್ವಚ್ಛತೆ', 'ಬೀದಿಗಳ ಗುಡಿಸುವಿಕೆ', 'ಚರಂಡಿ ಕ್ರಿಮಿನಾಶಕ ಸಿಂಪಡಣೆ', 'ಸ್ವಚ್ಛತಾ ಅಭಿಯಾನಗಳು'],
        responsibilities: ['ನಗರ ಸ್ವಚ್ಛತೆಯನ್ನು ನಿರ್ವಹಿಸುವುದು', 'ಸಾರ್ವಜನಿಕ ಶೌಚಾಲಯಗಳನ್ನು ಸ್ವಚ್ಛವಾಗಿಡುವುದು', 'ಆರೋಗ್ಯ ತಪಾಸಣೆಗಳನ್ನು ಆಯೋಜಿಸುವುದು', 'ಸೊಳ್ಳೆ ನಿಯಂತ್ರಣ ಕ್ರಮಗಳನ್ನು ಕೈಗೊಳ್ಳುವುದು']
      },
      health: {
        purpose: 'ಮುನ್ಸಿಪಲ್ ಕ್ಲಿನಿಕ್‌ಗಳು ಮತ್ತು ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ ರಕ್ಷಣೆ.',
        complaints: ['ಸೊಳ್ಳೆಗಳ ಕಾಟ', 'ಕ್ಲಿನಿಕ್ ಸೌಲಭ್ಯಗಳ ಕೊರತೆ', 'ಆಹಾರ ಕಲಬೆರಕೆ'],
        services: ['ಲಸಿಕಾ ಅಭಿಯಾನಗಳು', 'ಕ್ಲಿನಿಕ್ ನಿರ್ವಹಣೆ', 'ಹೋಟೆಲ್‌ಗಳ ಸುರಕ್ಷತಾ ತಪಾಸಣೆ', 'ರೋಗ ಹರಡುವಿಕೆಯ ಮೇಲ್ವಿಚಾರಣೆ'],
        responsibilities: ['ಸ್ಥಳೀಯ ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯದ ಉಸ್ತುವಾರಿ', 'ಆಹಾರದ ಗುಣಮಟ್ಟ ಪರಿಶೀಲಿಸುವುದು', 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳ ನಿರ್ವಹಣೆ', 'ಅಗತ್ಯ ಔಷಧಗಳ ವಿತರಣೆ']
      },
      revenue: {
        purpose: 'ತೆರಿಗೆ ವಸೂಲಿ ಮತ್ತು ನಾಗರಿಕ ದಾಖಲೆಗಳ ನಿರ್ವಹಣೆ.',
        complaints: ['ತೆರಿಗೆ ಬಿಲ್ಲಿಂಗ್ ದೋಷಗಳು', 'ಪ್ರಮಾಣಪತ್ರಗಳ ವಿಳಂಬ'],
        services: ['ಆಸ್ತಿ ತೆರಿಗೆ ಸಂಗ್ರಹಣೆ', 'ಭೂ ನೋಂದಣಿ', 'ಪ್ರಮಾಣಪತ್ರಗಳ ವಿತರಣೆ', 'ವ್ಯಾಪಾರ ಪರವಾನಗಿ ಶುಲ್ಕ'],
        responsibilities: ['ಪುರಸಭೆಯ ತೆರಿಗೆ ಸಂಗ್ರಹಣೆ', 'ಭೂ ದಾಖಲೆಗಳ ನಿರ್ವಹಣೆ', 'ಜನನ/ಮರಣ ಪ್ರಮಾಣಪತ್ರಗಳ ವಿತರಣೆ', 'ವಾಣಿಜ್ಯ ವಿವಾದಗಳ ಇತ್ಯರ್ಥ']
      },
      transport: {
        purpose: 'ಸಾರ್ವಜನಿಕ ಬಸ್‌ಗಳು, ಟ್ರಾಫಿಕ್ ಸಿಗ್ನಲ್‌ಗಳು ಮತ್ತು ಪಾರ್ಕಿಂಗ್.',
        complaints: ['ಬಸ್ ವಿಳಂಬ', 'ಸಿಗ್ನಲ್ ದೋಷಗಳು', 'ಅನಧಿಕೃತ ಪಾರ್ಕಿಂಗ್'],
        services: ['ಬಸ್ ವೇಳಾಪಟ್ಟಿ ಪರಿಶೀಲನೆ', 'ಬಸ್ ನಿಲ್ದಾಣಗಳ ನಿರ್ವಹಣೆ', 'ಟ್ರಾಫಿಕ್ ಸಿಗ್ನಲ್ ಸಮನ್ವಯ', 'ಪಾರ್ಕಿಂಗ್ ನಿರ್ವಹಣೆ'],
        responsibilities: ['ಸಾರ್ವಜನಿಕ ಸಾರಿಗೆ ಸಮಯವನ್ನು ಉತ್ತಮಗೊಳಿಸುವುದು', 'ಬಸ್ ನಿಲ್ದಾಣಗಳನ್ನು ದುರಸ್ತಿ ಮಾಡುವುದು', 'ಟ್ರಾಫಿಕ್ ಸಿಗ್ನಲ್‌ಗಳನ್ನು ನಿಯಂತ್ರಿಸುವುದು', 'ಪಾರ್ಕಿಂಗ್ ವ್ಯವಸ್ಥೆಗಳನ್ನು ಗಮನಿಸುವುದು']
      },
      smart_city: {
        purpose: 'ಸಿಸಿಟಿವಿ ನೆಟ್‌ವರ್ಕ್, ವೈಫೈ ವಲಯಗಳು ಮತ್ತು ಸ್ಮಾರ್ಟ್ ಆ್ಯಪ್‌ಗಳು.',
        complaints: ['ಸಾರ್ವಜನಿಕ ವೈಫೈ ವೈಫಲ್ಯ', 'ಸಿಸಿಟಿವಿ ಆಫ್‌ಲೈನ್'],
        services: ['ಸಾರ್ವಜನಿಕ ವೈಫೈ ನಿರ್ವಹಣೆ', 'ಸಿಸಿಟಿವಿ ಕಣ್ಗಾವಲು', 'ಸೆನ್ಸಾರ್ ಪರಿಶೀಲನೆ', 'ಇಂಟರ್ನೆಟ್ ಪೋರ್ಟಲ್ ಬೆಂಬಲ'],
        responsibilities: ['ಪುರಸಭೆಯ ವೈಫೈ ನೆಟ್‌ವರ್ಕ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸುವುದು', 'ಸುರಕ್ಷತಾ ಕ್ಯಾಮೆರಾಗಳ ಮೇಲ್ವಿಚಾರಣೆ', 'ಗಾಳಿ/ಶಬ್ದ ಮಾಲಿನ್ಯ ಸೆನ್ಸಾರ್ ಮಾಹಿತಿ ಸಂಗ್ರಹಣೆ', 'ಇ-ಆಡಳಿತ ಆಪ್‌ಗಳನ್ನು ದುರಸ್ತಿ ಮಾಡುವುದು']
      },
      rural_dev: {
        purpose: 'ಗ್ರಾಮೀಣ ವಾರ್ಡ್‌ಗಳ ಅಭಿವೃದ್ಧಿ ಮತ್ತು ಕೃಷಿ ನೆರವು.',
        complaints: ['ಕಚ್ಚಾ ರಸ್ತೆಗಳು', 'ನೀರಾವರಿ ವಿಳಂಬ'],
        services: ['ಪಂಚಾಯತ್ ಕಟ್ಟಡ ನಿರ್ಮಾಣ', 'ನೀರಾವರಿ ಕಾಲುವೆಗಳ ನಿರ್ವಹಣೆ', 'ಕೃಷಿ ಸಹಾಯಧನ ವಿತರಣೆ', 'ಗ್ರಾಮೀಣ ರಸ್ತೆಗಳ ನಿರ್ಮಾಣ'],
        responsibilities: ['ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕಚೇರಿಗಳಿಗೆ ಸಹಾಯ ಮಾಡುವುದು', 'ಗ್ರಾಮೀಣ ಸಂಪರ್ಕ ರಸ್ತೆಗಳನ್ನು ನಿರ್ಮಿಸುವುದು', 'ನೀರಾವರಿ ಕಾಲುವೆಗಳ ದುರಸ್ತಿ', 'ರೈತ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳ ತಲುಪಿಸುವಿಕೆ']
      },
      emergency: {
        purpose: 'ತುರ್ತು ಸ್ಪಂದನೆ ಮತ್ತು ಅಪಾಯಗಳ ನಿರ್ವಹಣೆ.',
        complaints: ['ಬೆಂಕಿ ಆಕಸ್ಮಿಕಗಳು', 'ಕಟ್ಟಡ ಕುಸಿತದ ಅಪಾಯಗಳು'],
        services: ['ಅಗ್ನಿಶಾಮಕ ರಕ್ಷಣೆ', 'ತುರ್ತು ಚಿಕಿತ್ಸಾ ಶಿಬಿರ', 'ಪ್ರವಾಹ ಪರಿಹಾರ ಶಿಬಿರ', 'ತುರ್ತು ರಕ್ಷಣಾ ಕಾರ್ಯ'],
        responsibilities: ['ತಕ್ಷಣದ ವಿಪತ್ತು ಪರಿಹಾರ ಒದಗಿಸುವುದು', 'ಸಂಕಷ್ಟದಲ್ಲಿರುವ ನಾಗರಿಕರನ್ನು ರಕ್ಷಿಸುವುದು', 'ಬೆಂಕಿ ಅವಘಡಗಳ ಸಮನ್ವಯ', 'ಸುರಕ್ಷತೆಗಾಗಿ ತುರ್ತು ಕ್ರಮಗಳನ್ನು ಕೈಗೊಳ್ಳುವುದು']
      }
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
    @Inject(PLATFORM_ID) private platformId: object,
    private departmentsService: DepartmentsService
  ) {}

  ngOnInit(): void {
    this.departmentsService.loadDepartments().subscribe((items) => {
      // Merge live data with our static 20 departments list
      this.allDepartments = this.allDepartments.map(staticDept => {
        const key = staticDept.key || staticDept.id;
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
            key: key,
            id: liveDept.id, // Use database MongoDB ID so clicks work
            activeComplaints: liveDept.activeComplaints || staticDept.activeComplaints,
            resolutionRate: liveDept.resolutionRate || staticDept.resolutionRate,
            avgResponseTime: liveDept.avgResponseTime || staticDept.avgResponseTime,
            liveStatus: liveDept.liveStatus || staticDept.liveStatus
          };
        }
        return {
          ...staticDept,
          key: key
        };
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
    const dept = this.allDepartments.find(d => d.id === id);
    const key = dept?.key || id;
    const fallback = this.DEPT_DETAILS['en'][key]?.purpose || '';
    return this.DEPT_DETAILS[lang]?.[key]?.purpose || fallback;
  }

  getDeptComplaints(id: string): string[] {
    const lang = this.translationService.currentLang();
    const dept = this.allDepartments.find(d => d.id === id);
    const key = dept?.key || id;
    const fallback = this.DEPT_DETAILS['en'][key]?.complaints || [];
    return this.DEPT_DETAILS[lang]?.[key]?.complaints || fallback;
  }

  getDeptServices(id: string): string[] {
    const lang = this.translationService.currentLang();
    const dept = this.allDepartments.find(d => d.id === id);
    const key = dept?.key || id;
    const fallback = this.DEPT_DETAILS['en'][key]?.services || [];
    return this.DEPT_DETAILS[lang]?.[key]?.services || fallback;
  }

  getDeptResponsibilities(id: string): string[] {
    const lang = this.translationService.currentLang();
    const dept = this.allDepartments.find(d => d.id === id);
    const key = dept?.key || id;
    const fallback = this.DEPT_DETAILS['en'][key]?.responsibilities || [];
    return this.DEPT_DETAILS[lang]?.[key]?.responsibilities || fallback;
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
