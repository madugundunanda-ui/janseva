import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, Inject, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface StoryStep {
  title: string;
  sub: string;
  desc: string;
  visualState: string;
}

@Component({
  selector: 'app-how-it-works',
  imports: [CommonModule],
  template: `
    <section #howItWorksSection class="relative w-full border-t border-var overflow-hidden bg-transparent" style="height: 900vh;">
      
      <!-- Ambient environmental glows -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#6AA9FF]/3 rounded-full blur-[160px] pointer-events-none z-0"></div>
      
      <!-- Pinned Fullscreen Film Stage Wrapper -->
      <div #stickyWrapper class="sticky-wrapper relative w-full h-screen overflow-hidden flex flex-col justify-between p-6 lg:p-12 z-10">
        
        <!-- HUD Header (Goverment scale indicators) -->
        <div class="flex justify-between font-mono text-[9px] text-[#6AA9FF] uppercase relative z-20 tracking-[0.2em] w-full">
          <span>CIVIC_PIPELINE: ACTIVE_RUN</span>
          <span>SCENE_INDEX: 0{{ activeStep + 1 }} / 09</span>
        </div>

        <!-- Fullscreen Centered SVG Film Stage -->
        <div class="absolute inset-0 z-0 w-full h-full flex items-center justify-center p-8 lg:p-16 pointer-events-none">
          <svg class="w-full h-full max-w-5xl max-h-[75vh] relative" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="roadGrad" x1="0" y1="0" x2="800" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#4B5663" />
                <stop offset="100%" stop-color="#374151" />
              </linearGradient>
              
              <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6AA9FF" stop-opacity="0.5" />
                <stop offset="100%" stop-color="#6AA9FF" stop-opacity="0.0" />
              </linearGradient>
              
              <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#6AA9FF" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#6AA9FF" stop-opacity="0" />
              </radialGradient>
              
              <radialGradient id="redGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#EF4444" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#EF4444" stop-opacity="0" />
              </radialGradient>

              <filter id="cinematicGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <!-- 1. DETAILED ROAD & LANDSCAPE (Shared across Scenes 1, 2, 3, 8) -->
            <g id="group-environment">
              <!-- Curved asphalt road -->
              <path id="road-base" d="M -100,480 C 200,450 600,510 900,480" stroke="url(#roadGrad)" stroke-width="56" stroke-linecap="round" fill="none" />
              <path id="road-line" d="M -100,480 C 200,450 600,510 900,480" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="1.8" stroke-dasharray="14 16" fill="none" />
              
              <!-- Pothole crack in the road (Scene 1) -->
              <g id="pothole-crack">
                <!-- Outer crack shapes -->
                <path d="M 445,482 L 452,476 L 458,484 L 468,478 L 475,483 L 482,475 L 470,489 L 454,486 Z" fill="#111827" />
                <!-- Depressed puddle shadow -->
                <path d="M 450,480 C 455,477 464,477 474,479 C 470,485 456,485 450,480 Z" fill="#030712" opacity="0.9" />
                <!-- Warning halo -->
                <circle cx="462" cy="481" r="22" fill="url(#redGlow)" />
              </g>
              
              <!-- Resolved Road Asphalt Patch overlay (Scene 8) -->
              <path id="road-patch" d="M 438,476 C 453,474 470,474 487,476 C 480,488 442,488 438,476 Z" fill="#4B5663" opacity="0" />

              <!-- Landscape Pines (Swaying motion) -->
              <g transform="translate(640, 340)">
                <g id="env-pine-1" class="swaying-pine">
                  <rect x="18" y="44" width="4" height="28" fill="#4B5563" rx="2" />
                  <polygon points="20,10 4,44 36,44" fill="#6B7280" />
                  <polygon points="20,2 8,30 32,30" fill="#4B5563" />
                </g>
              </g>
              <g transform="translate(140, 360)">
                <g id="env-pine-2" class="swaying-pine-slow">
                  <rect x="14" y="34" width="3" height="22" fill="#4B5563" rx="1.5" />
                  <polygon points="15.5,8 2,34 29,34" fill="#6B7280" opacity="0.8" />
                </g>
              </g>
            </g>

            <!-- 2. LARGE ILLUSTRATED CITIZEN CHARACTER (Scene 1) -->
            <g transform="translate(260, 290)">
              <g id="group-citizen" opacity="1">
                <!-- Citizen Head -->
                <circle cx="30" cy="30" r="12" fill="#4B5663" />
                <!-- Hair -->
                <path d="M 18,28 Q 30,12 42,28" stroke="#374151" stroke-width="4" stroke-linecap="round" fill="none" />
                <!-- Torso / Jacket -->
                <path d="M 12,50 C 12,42 16,42 30,42 C 44,42 48,42 48,50 L 44,98 L 16,98 Z" fill="#4B5663" />
                <!-- Pants -->
                <rect x="18" y="98" width="8" height="34" fill="#374151" rx="1" />
                <rect x="34" y="98" width="8" height="34" fill="#374151" rx="1" />
                <!-- Arm pointing to the pothole -->
                <path id="citizen-arm" d="M 44,56 Q 70,68 96,70" stroke="#4B5663" stroke-width="5" stroke-linecap="round" fill="none" />
              </g>
            </g>

            <!-- 3. LARGE SMARTPHONE DEVICE (Scenes 2, 3, 9) -->
            <g transform="translate(280, 100)">
              <g id="group-phone" opacity="0">
                <!-- Phone drop shadow -->
                <rect x="-3" y="-3" width="246" height="406" rx="26" fill="#000000" fill-opacity="0.15" filter="url(#cinematicGlow)" />
                <!-- Outer frame -->
                <rect x="0" y="0" width="240" height="400" rx="24" fill="#1F2937" stroke="#6AA9FF" stroke-width="1.8" stroke-opacity="0.35" />
                <!-- Screen area -->
                <rect x="6" y="6" width="228" height="388" rx="18" fill="#0B0F19" />
                <!-- Camera island notch -->
                <rect x="90" y="14" width="60" height="11" rx="5.5" fill="#1F2937" />

                <!-- Camera Viewfinder alignment marks -->
                <g id="phone-viewfinder" opacity="0">
                  <path d="M 24,44 L 24,28 L 40,28" stroke="#6AA9FF" stroke-width="1.5" fill="none" />
                  <path d="M 216,44 L 216,28 L 200,28" stroke="#6AA9FF" stroke-width="1.5" fill="none" />
                  <path d="M 24,344 L 24,360 L 40,360" stroke="#6AA9FF" stroke-width="1.5" fill="none" />
                  <path d="M 216,344 L 216,360 L 200,360" stroke="#6AA9FF" stroke-width="1.5" fill="none" />
                </g>

                <!-- Scanning grid beam overlay -->
                <g id="phone-scanner" opacity="0">
                  <line x1="8" y1="36" x2="232" y2="36" stroke="#6AA9FF" stroke-width="2.5" filter="url(#cinematicGlow)" />
                  <rect x="8" y="36" width="224" height="60" fill="url(#beamGrad)" />
                </g>

                <!-- Uploading pulse arrow -->
                <g transform="translate(90, 140)">
                  <g id="phone-upload" opacity="0">
                    <path d="M 30,70 L 30,30 M 30,30 L 15,44 M 30,30 L 45,44" stroke="#6AA9FF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    <path d="M 10,90 C 10,90 20,80 30,80 C 40,80 50,90 50,90" stroke="#6AA9FF" stroke-width="2.5" stroke-linecap="round" fill="none" class="animate-pulse" />
                  </g>
                </g>

                <!-- Completion Ticket Resolved display -->
                <g transform="translate(24, 80)">
                  <g id="phone-resolved" opacity="0">
                    <rect x="0" y="0" width="192" height="212" rx="16" fill="#10B981" fill-opacity="0.06" stroke="#10B981" stroke-width="1.5" stroke-opacity="0.35" />
                    <circle cx="96" cy="80" r="32" fill="#10B981" fill-opacity="0.08" />
                    <!-- Big checkmark -->
                    <path d="M 80,80 L 92,92 L 114,66" stroke="#10B981" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    <text x="96" y="150" fill="#10B981" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle" letter-spacing="1.5">TICKET_CLOSED</text>
                    <text x="96" y="172" fill="rgba(230, 236, 242, 0.4)" font-family="monospace" font-size="8" text-anchor="middle">JANSEVA NET CONFIRM</text>
                  </g>
                </g>
              </g>
            </g>

            <!-- 4. MASSIVE ENTITY EXTRACTION PANEL (Scene 4) -->
            <g transform="translate(420, 100)">
              <g id="group-entity-card" opacity="0">
                <rect x="0" y="0" width="240" height="340" rx="18" fill="#111827" fill-opacity="0.95" stroke="rgba(106, 169, 255, 0.25)" stroke-width="1.2" />
                <text x="24" y="36" fill="#6AA9FF" font-family="monospace" font-size="12" font-weight="bold" letter-spacing="1.5">INTEL_EXTRACT</text>
                <line x1="24" y1="48" x2="216" y2="48" stroke="rgba(230, 236, 242, 0.08)" stroke-width="1" />

                <!-- Staggered fields -->
                <g class="field-item-large" opacity="0">
                  <text x="24" y="80" fill="rgba(230, 236, 242, 0.35)" font-family="monospace" font-size="8">CLASSIFICATION</text>
                  <text x="24" y="96" fill="#E6ECF2" font-family="monospace" font-size="12" font-weight="bold">POTHOLE_DECAY</text>
                </g>
                <g class="field-item-large" opacity="0">
                  <text x="24" y="140" fill="rgba(230, 236, 242, 0.35)" font-family="monospace" font-size="8">SEVERITY_LEVEL</text>
                  <text x="24" y="156" fill="#EF4444" font-family="monospace" font-size="12" font-weight="bold">CRITICAL_ALERT (9.2)</text>
                </g>
                <g class="field-item-large" opacity="0">
                  <text x="24" y="200" fill="rgba(230, 236, 242, 0.35)" font-family="monospace" font-size="8">COORDINATE_GRID</text>
                  <text x="24" y="216" fill="#E6ECF2" font-family="monospace" font-size="11">18.9754 , 72.8258</text>
                </g>
                <g class="field-item-large" opacity="0">
                  <text x="24" y="260" fill="rgba(230, 236, 242, 0.35)" font-family="monospace" font-size="8">ROUTED_DIVISION</text>
                  <text x="24" y="276" fill="#10B981" font-family="monospace" font-size="11" font-weight="bold">ROADS & PUBLIC WORKS</text>
                </g>
              </g>
            </g>

            <!-- 5. REGIONAL WARD DATA ROUTING MAP (Scene 5) -->
            <g id="group-routing" opacity="0">
              <!-- Administrative boundaries mapping overlay -->
              <path d="M 60,60 L 740,60 M 60,300 L 740,300 M 60,540 L 740,540 M 60,60 L 60,540 M 400,60 L 400,540 M 740,60 L 740,540" stroke="rgba(230, 236, 242, 0.02)" stroke-width="1.2" />
              
              <!-- Routing data pipeline tracks -->
              <path id="route-path-1" d="M 220,380 C 300,280 340,240 400,220" stroke="#6AA9FF" stroke-width="2" stroke-dasharray="5 5" fill="none" opacity="0.3" />
              <path id="route-path-2" d="M 400,220 C 480,200 520,280 580,360" stroke="#6AA9FF" stroke-width="2" stroke-dasharray="5 5" fill="none" opacity="0.3" />

              <!-- central intelligence engine node -->
              <circle cx="400" cy="220" r="24" fill="#1F2937" stroke="#6AA9FF" stroke-width="1.8" />
              <circle cx="400" cy="220" r="8" fill="#6AA9FF" />
              <circle cx="400" cy="220" r="20" stroke="#6AA9FF" stroke-width="1.2" stroke-opacity="0.35" class="animate-ping" style="transform-origin: 400px 220px;" />
              <text x="400" y="185" fill="#6AA9FF" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle" letter-spacing="2">JANSEVA_CORE</text>

              <!-- Ward Node -->
              <circle cx="220" cy="380" r="16" fill="#1F2937" stroke="rgba(230, 236, 242, 0.2)" stroke-width="1.2" />
              <circle cx="220" cy="380" r="5" fill="rgba(230, 236, 242, 0.5)" />
              <text x="220" y="408" fill="rgba(230, 236, 242, 0.4)" font-family="monospace" font-size="8" text-anchor="middle">WARD_NODE_03</text>

              <!-- Department endpoint node -->
              <circle cx="580" cy="360" r="18" fill="#1F2937" stroke="#10B981" stroke-width="1.5" />
              <circle cx="580" cy="360" r="6" fill="#10B981" />
              <text x="580" y="388" fill="#10B981" font-family="monospace" font-size="8" font-weight="bold" text-anchor="middle">ROADS_ENG_HQ</text>

              <!-- Traveling packet signal -->
              <circle id="routing-pulse" cx="220" cy="380" r="8" fill="#6AA9FF" filter="url(#cinematicGlow)" opacity="0" />
            </g>

            <!-- 6. PUBLIC WORKS DEPT BUILDING (Scene 6) -->
            <g transform="translate(280, 200)">
              <g id="group-dept-building" opacity="0">
                <!-- Building background shadow -->
                <rect x="-10" y="-10" width="260" height="200" rx="10" fill="#000000" fill-opacity="0.05" />
                
                <!-- Columns -->
                <rect x="20" y="50" width="12" height="110" fill="#4B5563" />
                <rect x="70" y="50" width="12" height="110" fill="#4B5563" />
                <rect x="120" y="50" width="12" height="110" fill="#4B5563" />
                <rect x="170" y="50" width="12" height="110" fill="#4B5563" />
                <rect x="210" y="50" width="12" height="110" fill="#4B5563" />

                <!-- Pediment Roof (with pulsing status glow) -->
                <polygon points="-10,50 120,2 250,50" fill="#1F2937" stroke="#6AA9FF" stroke-width="1.5" stroke-opacity="0.4" />
                <!-- Building central crest -->
                <circle cx="120" cy="30" r="6" fill="#6AA9FF" class="animate-pulse" />

                <!-- Base block -->
                <rect x="-20" y="160" width="280" height="24" fill="#374151" rx="2" />
                <text x="120" y="176" fill="rgba(230, 236, 242, 0.4)" font-family="monospace" font-size="8" font-weight="bold" text-anchor="middle">MUNICIPAL INFRASTRUCTURE DIVISION</text>
              </g>
            </g>

            <!-- 7. SLA URGENCY DIAL FORECAST (Scene 7 SLA prediction) -->
            <g transform="translate(400, 260)">
              <g id="group-sla" opacity="0">
                <!-- Outer indicator ring -->
                <path d="M -90,30 A 96,96 0 1,1 90,30" stroke="rgba(230, 236, 242, 0.04)" stroke-width="12" stroke-linecap="round" fill="none" />
                <!-- Gauge filler -->
                <path id="sla-gauge" d="M -90,30 A 96,96 0 1,1 90,30" stroke="#EF4444" stroke-width="12" stroke-linecap="round" fill="none" stroke-dasharray="301" stroke-dashoffset="301" filter="url(#cinematicGlow)" opacity="0" />
                
                <!-- Dial center details -->
                <text x="0" y="-16" fill="#E6ECF2" font-family="monospace" font-size="30" font-weight="bold" text-anchor="middle">0.4d</text>
                <text x="0" y="12" fill="#EF4444" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle" letter-spacing="2">SLA PRIORITY: RED</text>
                <text x="0" y="30" fill="rgba(230, 236, 242, 0.35)" font-family="monospace" font-size="7.5" text-anchor="middle">ESTIMATED RESPONSE SLA</text>
              </g>
            </g>

            <!-- 8. OFFICER DISPATCH TELEMETRY (Scene 8) -->
            <g transform="translate(170, 160)">
              <g id="group-officer" opacity="0">
                <rect x="0" y="0" width="460" height="210" rx="16" fill="#0B0F19" fill-opacity="0.95" stroke="#10B981" stroke-width="1.5" stroke-opacity="0.25" />
                
                <text x="24" y="32" fill="#10B981" font-family="monospace" font-size="11" font-weight="bold" letter-spacing="2">FIELD_TELEMETRY</text>
                <rect x="360" y="18" width="76" height="18" rx="5" fill="#10B981" fill-opacity="0.08" />
                <text x="398" y="30" fill="#10B981" font-family="monospace" font-size="7.5" font-weight="bold" text-anchor="middle">DISPATCHED</text>
                
                <line x1="24" y1="46" x2="436" y2="46" stroke="rgba(230, 236, 242, 0.05)" stroke-width="1" />

                <!-- Avatar -->
                <circle cx="56" cy="116" r="24" fill="rgba(230, 236, 242, 0.03)" stroke="rgba(230, 236, 242, 0.08)" stroke-width="1.2" />
                <path d="M 44,131 C 44,121 50,116 56,116 C 62,116 68,121 68,131 Z" fill="rgba(230, 236, 242, 0.35)" />
                <circle cx="56" cy="104" r="7" fill="rgba(230, 236, 242, 0.35)" />

                <!-- Details -->
                <g transform="translate(98, 92)">
                  <text x="0" y="8" fill="rgba(230, 236, 242, 0.3)" font-family="monospace" font-size="8">ASSIGNED OFFICER</text>
                  <text x="0" y="24" fill="#E6ECF2" font-family="monospace" font-size="12" font-weight="bold" letter-spacing="1">KUMAR RAJESH</text>
                  <text x="0" y="40" fill="rgba(230, 236, 242, 0.4)" font-family="monospace" font-size="9">COLABA MUNICIPAL FORCE // UNIT #12</text>
                </g>

                <!-- GPS Map -->
                <g transform="translate(290, 68)">
                  <rect x="0" y="0" width="146" height="110" rx="10" fill="#111827" stroke="rgba(230, 236, 242, 0.05)" />
                  <path d="M 18,92 C 50,84 65,36 128,30" stroke="rgba(230, 236, 242, 0.06)" stroke-width="3" fill="none" />
                  <path id="dispatch-gps-line" d="M 18,92 C 50,84 65,36 128,30" stroke="#10B981" stroke-width="3" fill="none" stroke-dasharray="140" stroke-dashoffset="140" />
                  <circle cx="128" cy="30" r="5" fill="#EF4444" filter="url(#cinematicGlow)" />
                  <circle id="officer-marker" cx="18" cy="92" r="5" fill="#10B981" filter="url(#cinematicGlow)" />
                </g>
              </g>
            </g>

            <!-- 9. ROAD REPAIR cones/barriers (Scene 9) -->
            <g transform="translate(340, 420)">
              <g id="group-repair" opacity="0">
                <!-- Cone 1 -->
                <g>
                  <polygon points="10,60 22,10 32,10 44,60" fill="#EF4444" />
                  <polygon points="14,40 40,40 37,25 17,25" fill="#FFFFFF" />
                  <rect x="4" y="60" width="46" height="4" fill="#1F2937" rx="1" />
                </g>
                <!-- Cone 2 -->
                <g transform="translate(90, 10)">
                  <polygon points="8,50 18,10 26,10 36,50" fill="#EF4444" />
                  <polygon points="11,34 33,34 30,22 14,22" fill="#FFFFFF" />
                  <rect x="2" y="50" width="38" height="3.5" fill="#1F2937" rx="1" />
                </g>
              </g>
            </g>
          </svg>
        </div>

        <!-- Floating Narrative Caption Overlay (Cinema Subtitles Style) -->
        <div class="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl text-center z-20 glass-panel p-6 lg:p-8 rounded-2xl border-var bg-glass-var backdrop-blur-xl transition-all duration-300">
          <div class="story-caption-content opacity-100">
            <span class="font-mono text-[9px] tracking-[0.25em] text-[#6AA9FF] uppercase mb-3 block font-bold">
              {{ steps[activeStep].sub }}
            </span>
            <h3 class="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-var mb-4 uppercase tracking-wider font-mono">
              {{ steps[activeStep].title }}
            </h3>
            <p class="text-[11px] sm:text-xs text-muted-var leading-relaxed font-mono uppercase">
              {{ steps[activeStep].desc }}
            </p>
          </div>
        </div>

        <!-- Minimal Cinematic Progress indicators -->
        <div class="flex justify-between items-center z-20 w-full relative pt-4 border-t border-var font-mono text-[8px] text-white/30 uppercase tracking-[0.25em]">
          <span>COORD_REF: MUMBAI_GRID_SYSTEM</span>
          <div class="flex items-center gap-3">
            @for (step of steps; track step.title; let idx = $index) {
              <div class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                   [class.bg-[#6AA9FF]]="activeStep === idx"
                   [class.scale-125]="activeStep === idx"
                   [class.bg-white/10]="activeStep !== idx"></div>
            }
          </div>
          <span>EST_PROCESSING_TIME: 1.2 SEC</span>
        </div>

      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .sticky-wrapper {
      background-color: transparent;
    }
    @keyframes swaying-pine {
      0%, 100% { transform: rotate(-1.5deg); }
      50% { transform: rotate(1.5deg); }
    }
    @keyframes swaying-pine-slow {
      0%, 100% { transform: rotate(-1deg); }
      50% { transform: rotate(1deg); }
    }
    .swaying-pine {
      transform-origin: bottom center;
      animation: swaying-pine 7s ease-in-out infinite;
    }
    .swaying-pine-slow {
      transform-origin: bottom center;
      animation: swaying-pine-slow 10s ease-in-out infinite;
    }
  `]
})
export class HowItWorksComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('howItWorksSection') sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('stickyWrapper') stickyWrapperRef!: ElementRef<HTMLElement>;
  
  activeStep = 0;
  private scrollTriggers: any[] = [];

  steps: StoryStep[] = [
    {
      title: 'Citizen Notices Civic Issue',
      sub: 'PHASE 01 // CIVIC OBSERVATION',
      desc: 'A citizen spots a public hazard in their community—such as a deep pothole, illegal dumping, or a broken streetlight—and initiates the reporting grid.',
      visualState: 'observe'
    },
    {
      title: 'Mobile Capture & Upload',
      sub: 'PHASE 02 // MOBILE CAPTURE',
      desc: 'Using the JanSeva secure portal, the user captures a high-resolution photo. Integrated geofencing and metadata systems bundle location coordinates automatically.',
      visualState: 'capture'
    },
    {
      title: 'Neural Vision Classification',
      sub: 'PHASE 03 // VISION SCANNING',
      desc: 'JanSeva neural networks scan the upload. Computer vision models isolate the hazard, segment pixel structures, and run visual validation scans.',
      visualState: 'scan'
    },
    {
      title: 'Intelligent Entity Extraction',
      sub: 'PHASE 04 // ENTITY EXTRACTION',
      desc: 'The AI parses location metadata, identifies hazard type and severity, and extracts context to determine the responsible state department.',
      visualState: 'extraction'
    },
    {
      title: 'Autonomous Pathway Routing',
      sub: 'PHASE 05 // SYSTEM PATHWAYS',
      desc: 'The verified ticket routes instantly through regional governance grids, mapping directly to the specific local ward node without administrative lag.',
      visualState: 'routing'
    },
    {
      title: 'Department HQ Alerted',
      sub: 'PHASE 06 // REGULATORY ENGAGEMENT',
      desc: 'The responsible municipal department branch receives the ticket directly, changing status from standby to active coordination mode.',
      visualState: 'dept'
    },
    {
      title: 'SLA Priority Forecasting',
      sub: 'PHASE 07 // URGENCY ENGINES',
      desc: 'Machine learning priority engines analyze hazard severity, community impact, and officer capacity to estimate exact resolution speeds and enforce SLAs.',
      visualState: 'priority'
    },
    {
      title: 'Tactical Officer Dispatch',
      sub: 'PHASE 08 // MOBILE COMMAND',
      desc: 'The nearest field crew receives the dispatched ticket on their console, complete with GPS route optimization and neural scanning tags.',
      visualState: 'dispatch'
    },
    {
      title: 'Verification & Resolution',
      sub: 'PHASE 09 // FIELD WORK & CLOSURE',
      desc: 'The municipal team repairs the issue on-site. Visual confirmation scans audit the before-and-after state to confirm resolution quality and close the case.',
      visualState: 'resolution'
    }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        this.initStoryTimeline(gsap);
      });
    });
  }

  private initStoryTimeline(gsap: any) {
    const section = this.sectionRef.nativeElement;
    
    // Set initial structural visibility and positions relative to outer translated groups
    gsap.set('#group-citizen', { opacity: 1, x: 0 });
    gsap.set('#group-phone', { y: 180, opacity: 0, scale: 0.8 });
    gsap.set('#group-entity-card', { x: 50, opacity: 0 });
    gsap.set('#group-routing', { opacity: 0 });
    gsap.set('#group-dept-building', { y: 40, opacity: 0 });
    gsap.set('#group-sla', { opacity: 0 });
    gsap.set('#sla-gauge', { opacity: 1 }); // keep static path opaque inside the group
    gsap.set('#group-officer', { opacity: 0 });
    gsap.set('#group-repair', { opacity: 0 });
    gsap.set('#road-patch', { opacity: 0 });
    gsap.set('#phone-resolved', { opacity: 0 });
    gsap.set('#phone-upload', { opacity: 0 });
    gsap.set('#phone-scanner', { opacity: 0 });
    gsap.set('#phone-viewfinder', { opacity: 0 });
    
    // Master scroll timeline (ends at 8 scroll units)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
        pin: this.stickyWrapperRef.nativeElement,
      }
    });

    // 1. Active step calculator (rounds timeline progress dynamically to index 0-8)
    const stateObj = { step: 0 };
    tl.to(stateObj, {
      step: 8,
      ease: 'none',
      duration: 8,
      onUpdate: () => {
        const currentStep = Math.round(stateObj.step);
        if (this.activeStep !== currentStep) {
          this.ngZone.run(() => {
            queueMicrotask(() => {
              this.activeStep = currentStep;
              this.cdr.detectChanges();
            });
          });
          // Trigger a quick cross-fade reveal on the floating captions
          gsap.fromTo('.story-caption-content', 
            { opacity: 0, y: 8 }, 
            { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
          );
        }
      }
    }, 0);

    // 2. Scene transitions
    // --- SCENE 1 -> 2 (time 0 -> 1)
    // Citizen points at pothole, phone rises, camera focuses
    tl.to('#citizen-arm', { rotation: -10, transformOrigin: 'left center', duration: 0.4 }, 0)
      .to('#group-citizen', { opacity: 0, x: -80, scale: 0.9, duration: 0.8 }, 0)
      .to('#group-phone', { opacity: 1, y: 0, scale: 1, duration: 0.8 }, 0.2)
      .to('#phone-viewfinder', { opacity: 1, duration: 0.3 }, 0.5)
      .to('#phone-upload', { opacity: 1, duration: 0.3 }, 0.7);

    // --- SCENE 2 -> 3 (time 1 -> 2)
    // Scanner sweeps down the viewport
    tl.to('#phone-upload', { opacity: 0, duration: 0.2 }, 1.0)
      .to('#phone-scanner', { opacity: 1, duration: 0.3 }, 1.0)
      .to('#phone-scanner line', { attr: { y1: 344, y2: 344 }, duration: 0.8, ease: 'power1.inOut' }, 1.2)
      .to('#phone-scanner rect', { attr: { height: 320 }, duration: 0.8, ease: 'power1.inOut' }, 1.2);

    // --- SCENE 3 -> 4 (time 2 -> 3)
    // Phone slides left, entity data panel rises on right (opacity stagger on items prevents translate conflicts)
    tl.to('#phone-scanner', { opacity: 0, duration: 0.2 }, 2.0)
      .to('#phone-viewfinder', { opacity: 0.1, duration: 0.2 }, 2.0)
      .to('#group-phone', { x: -140, scale: 0.85, duration: 0.8 }, 2.0)
      .to('#group-entity-card', { opacity: 1, x: 0, duration: 0.8 }, 2.0)
      .to('.field-item-large', { opacity: 1, stagger: 0.1, duration: 0.6 }, 2.2);

    // --- SCENE 4 -> 5 (time 3 -> 4)
    // Morph panels into regional node network grid map
    tl.to('#group-phone', { opacity: 0, duration: 0.4 }, 3.0)
      .to('#group-entity-card', { opacity: 0, duration: 0.4 }, 3.0)
      .to('#group-environment', { opacity: 0, duration: 0.4 }, 3.0)
      .to('#group-routing', { opacity: 1, duration: 0.8 }, 3.0)
      .to('#routing-pulse', { opacity: 1, duration: 0.1 }, 3.2)
      .to('#routing-pulse', { attr: { cx: 400, cy: 220 }, duration: 0.35, ease: 'power2.inOut' }, 3.3)
      .to('#routing-pulse', { attr: { cx: 580, cy: 360 }, duration: 0.35, ease: 'power2.inOut' }, 3.65);

    // --- SCENE 5 -> 6 (time 4 -> 5)
    // Route reaches Department Node -> Department Headquarters rises
    tl.to('#group-routing', { opacity: 0, duration: 0.4 }, 4.0)
      .to('#group-dept-building', { opacity: 1, y: 0, duration: 0.8 }, 4.0);

    // --- SCENE 6 -> 7 (time 5 -> 6)
    // Dept building fades -> SLA forecasting dial spins
    tl.to('#group-dept-building', { opacity: 0, y: -20, duration: 0.4 }, 5.0)
      .to('#group-sla', { opacity: 1, duration: 0.8 }, 5.0)
      .to('#sla-gauge', { opacity: 1, duration: 0.1 }, 5.0)
      .fromTo('#sla-gauge', { strokeDashoffset: 301 }, { strokeDashoffset: 90, duration: 0.9, ease: 'power2.out' }, 5.1);

    // --- SCENE 7 -> 8 (time 6 -> 7)
    // Dial fades -> Dispatch telemetry card overlay appears
    tl.to('#group-sla', { opacity: 0, duration: 0.4 }, 6.0)
      .to('#group-officer', { opacity: 1, duration: 0.8 }, 6.0)
      .to('#dispatch-gps-line', { strokeDashoffset: 0, duration: 0.8, ease: 'none' }, 6.2)
      .to('#officer-marker', { attr: { cx: 50, cy: 84 }, duration: 0.4, ease: 'none' }, 6.2)
      .to('#officer-marker', { attr: { cx: 128, cy: 30 }, duration: 0.4, ease: 'none' }, 6.6);

    // --- SCENE 8 -> 9 (time 7 -> 8)
    // Officer arrives -> Environment repairs on-site (road patch cones)
    tl.to('#group-officer', { opacity: 0, duration: 0.4 }, 7.0)
      .to('#group-environment', { opacity: 1, scale: 1, y: 0, duration: 0.8 }, 7.0)
      .to('#group-repair', { opacity: 1, duration: 0.5 }, 7.2)
      .to('#pothole-crack', { opacity: 0, duration: 0.5 }, 7.4)
      .to('#road-patch', { opacity: 1, duration: 0.5 }, 7.4)
      .to('#group-repair', { opacity: 0, duration: 0.3 }, 7.7)
      .to('#group-environment', { opacity: 0.25, duration: 0.3 }, 7.7)
      .to('#group-phone', { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.3 }, 7.7)
      .to('#phone-resolved', { opacity: 1, duration: 0.3 }, 7.7);

    this.scrollTriggers.push(tl.scrollTrigger);
  }

  ngOnDestroy(): void {
    this.scrollTriggers.forEach((st) => st.kill());
  }
}
