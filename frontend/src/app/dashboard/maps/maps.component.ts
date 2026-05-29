import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, PLATFORM_ID, Inject, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ApiService, Complaint } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';

interface WardScore {
  ward: string;
  score: number;
  color: string;
  activeCount: number;
  resolvedCount: number;
}

@Component({
  selector: 'app-maps',
  imports: [CommonModule],
  template: `
    <div class="glass-panel p-6 rounded-xl border border-var space-y-6 pb-12 relative overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-var pb-4">
        <div class="flex items-center gap-3">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <h2 class="font-mono text-xs tracking-widest text-cyan-400 uppercase font-bold">{{ translationService.t('HOTSPOT_MAP') }}</h2>
        </div>
        <span class="font-mono text-[9px] text-muted-var uppercase">PUBLIC CIVIC TRANSPARENCY COMMAND CENTER</span>
      </div>

      <!-- Public Transparency Stats Metrics Row -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-[10px] uppercase">
        <div class="p-3.5 rounded-xl border border-var bg-white/2">
          <span class="text-muted-var block mb-1">State Integrity Index</span>
          <span class="text-base font-bold text-emerald-400">92.4% SLA</span>
        </div>
        <div class="p-3.5 rounded-xl border border-var bg-white/2">
          <span class="text-muted-var block mb-1">Audit Transparency</span>
          <span class="text-base font-bold text-cyan-400">100% PUBLIC</span>
        </div>
        <div class="p-3.5 rounded-xl border border-var bg-white/2">
          <span class="text-muted-var block mb-1">Visual Resolved Audits</span>
          <span class="text-base font-bold text-primary-var">1,482 CLEARED</span>
        </div>
        <div class="p-3.5 rounded-xl border border-var bg-white/2">
          <span class="text-muted-var block mb-1">Citizen Trust Rating</span>
          <span class="text-base font-bold text-[#6AA9FF]">Excellent</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        <!-- Left: Map Visualization -->
        <div class="lg:col-span-8 relative border border-var bg-white/45 rounded-xl overflow-hidden cursor-crosshair min-h-[500px]">
          <canvas #mapCanvas class="w-full h-full object-cover"></canvas>
          
          <!-- Legend Overlay -->
          <div class="absolute bottom-5 left-5 p-4 rounded-xl bg-black/70 border border-var backdrop-blur-md font-mono text-[8.5px] text-muted-var space-y-2 uppercase pointer-events-none z-10">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span>CRITICAL CIVIC ZONE (HEALTH &lt; 50)</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse"></span>
              <span>MODERATE ISSUE DENSITY (HEALTH 50-80)</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>HEALTHY CIVIC ZONE (HEALTH &gt;= 80)</span>
            </div>
            <div class="pt-1.5 border-t border-white/5 flex items-center gap-2 text-[8px] text-cyan-400">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>Individual Complaint Node</span>
            </div>
          </div>

          <!-- Tooltip Overlay -->
          @if (hoveredNode) {
            <div [style.left.px]="tooltipX" [style.top.px]="tooltipY" class="absolute p-4 rounded-xl border border-var bg-black/90 backdrop-blur-md font-mono text-[9px] uppercase tracking-wider text-primary-var shadow-2xl pointer-events-none -translate-x-1/2 -translate-y-full mb-3 space-y-1.5 z-20">
              <div class="text-[8px] text-muted-var">{{ hoveredNode.id }} // WARD {{ hoveredNode.location.ward }}</div>
              <div class="font-bold text-primary-var max-w-[180px] truncate">{{ hoveredNode.title }}</div>
              <div class="flex justify-between gap-4">
                <span>PRIORITY: <span class="text-red-400 font-bold">{{ hoveredNode.priority }}</span></span>
                <span>STATUS: <span class="text-cyan-400">{{ hoveredNode.status }}</span></span>
              </div>
            </div>
          }
        </div>

        <!-- Right: Ward Civic Health Roster -->
        <div class="lg:col-span-4 glass-panel p-5 rounded-xl border border-var flex flex-col justify-between">
          <div class="space-y-4">
            <h3 class="font-mono text-[10px] tracking-widest text-[#6AA9FF] uppercase font-bold">WARD CIVIC HEALTH INDEX</h3>
            
            <div data-lenis-prevent class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              @for (w of wardScores; track w.ward) {
                <div class="p-3 rounded-lg border border-var bg-white/2 space-y-2">
                  <div class="flex justify-between items-center font-mono text-[9.5px]">
                    <span class="font-bold text-primary-var">WARD {{ w.ward }}</span>
                    <span [style.color]="w.color" class="font-bold">{{ w.score }}/100</span>
                  </div>

                  <!-- Mini progress bar -->
                  <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div class="h-full rounded-full" [style.background]="w.color" [style.width.%]="w.score"></div>
                  </div>

                  <!-- Details -->
                  <div class="flex justify-between font-mono text-[8px] text-muted-var uppercase">
                    <span>Active Cases: {{ w.activeCount }}</span>
                    <span>Resolved: {{ w.resolvedCount }}</span>
                  </div>
                </div>
              } @empty {
                <div class="text-center font-mono text-[10px] text-muted-var py-8 uppercase">No active ward telemetry available.</div>
              }
            </div>
          </div>

          <div class="pt-4 border-t border-var font-mono text-[8.5px] text-muted-var uppercase leading-relaxed">
            * Scores decrease based on unresolved complaints and increase with successful visual audit closures.
          </div>
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
export class MapsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  complaintsList: Complaint[] = [];
  hoveredNode: Complaint | null = null;
  tooltipX = 0;
  tooltipY = 0;

  wardScores: WardScore[] = [];

  private context!: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private nodes: Array<{ x: number; y: number; complaint: Complaint }> = [];

  public translationService = inject(TranslationService);

  constructor(
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.apiService.getComplaints().subscribe((data) => {
      this.complaintsList = data;
      this.calculateWardScores();
      if (isPlatformBrowser(this.platformId) && this.context) {
        this.buildMapNodes();
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = this.canvasRef.nativeElement;
    this.context = canvas.getContext('2d')!;

    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

    this.renderMap();
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    if (!canvas) return;
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    this.buildMapNodes();
  }

  private calculateWardScores() {
    const wardMap: Record<string, { active: number; resolved: number }> = {};
    
    this.complaintsList.forEach((c) => {
      const ward = c.location.ward || '12';
      if (!wardMap[ward]) {
        wardMap[ward] = { active: 0, resolved: 0 };
      }
      if (c.status === 'resolved') {
        wardMap[ward].resolved++;
      } else {
        wardMap[ward].active++;
      }
    });

    // Populate ward list
    const results: WardScore[] = [];
    for (const [ward, stats] of Object.entries(wardMap)) {
      // Score: 100 base, -12 per active complaint, +5 per resolved complaint
      let score = 100 - (stats.active * 12) + (stats.resolved * 5);
      score = Math.max(30, Math.min(100, score));

      let color = '#ef4444'; // Red
      if (score >= 80) color = '#10b981'; // Green
      else if (score >= 50) color = '#eab308'; // Yellow

      results.push({
        ward,
        score,
        color,
        activeCount: stats.active,
        resolvedCount: stats.resolved
      });
    }

    this.wardScores = results.sort((a, b) => b.score - a.score);
  }

  private buildMapNodes() {
    const canvas = this.canvasRef.nativeElement;
    if (!canvas) return;
    this.nodes = [];

    // Coordinates projecting to canvas
    this.complaintsList.forEach((c) => {
      const lat = c.location.latitude || c.location.lat || 19.0760;
      const lng = c.location.longitude || c.location.lng || 72.8777;

      const minLat = 19.05;
      const maxLat = 19.10;
      const minLng = 72.85;
      const maxLng = 72.90;

      const xNorm = (lng - minLng) / (maxLng - minLng);
      const yNorm = 1 - (lat - minLat) / (maxLat - minLat);

      this.nodes.push({
        x: xNorm * canvas.width,
        y: yNorm * canvas.height,
        complaint: c
      });
    });
  }

  private onMouseMove(event: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    let match: Complaint | null = null;
    const hitRadius = 15;

    for (const node of this.nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < hitRadius) {
        match = node.complaint;
        this.tooltipX = event.clientX - rect.left;
        this.tooltipY = event.clientY - rect.top;
        break;
      }
    }

    this.hoveredNode = match;
  }

  private renderMap() {
    const draw = () => {
      const canvas = this.canvasRef.nativeElement;
      const ctx = this.context;
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Grid Background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 2. Draw color-coded regional geofencing boundaries (Green, Yellow, Red zones)
      // We will project fictitious Ward Centers based on coordinates:
      const wardCoordinates: Record<string, { lat: number; lng: number }> = {
        '12': { lat: 19.0760, lng: 72.8777 },
        '03': { lat: 19.0550, lng: 72.8620 },
        '05': { lat: 19.0880, lng: 72.8890 },
      };

      const time = Date.now() * 0.002;

      this.wardScores.forEach((w) => {
        const coords = wardCoordinates[w.ward] || { lat: 19.0700, lng: 72.8700 };
        
        const minLat = 19.05;
        const maxLat = 19.10;
        const minLng = 72.85;
        const maxLng = 72.90;

        const xNorm = (coords.lng - minLng) / (maxLng - minLng);
        const yNorm = 1 - (coords.lat - minLat) / (maxLat - minLat);

        const xCanvas = xNorm * canvas.width;
        const yCanvas = yNorm * canvas.height;

        const pulseRadius = (90 + Math.sin(time + xCanvas) * 15);

        // Radial gradient for glowing ward zones
        const gradient = ctx.createRadialGradient(xCanvas, yCanvas, 10, xCanvas, yCanvas, pulseRadius);
        gradient.addColorStop(0, w.color + '33'); // glowing center
        gradient.addColorStop(0.5, w.color + '15');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // transparent boundary

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(xCanvas, yCanvas, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw Ward boundary stroke
        ctx.strokeStyle = w.color + '25';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw Ward name label on center
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = w.color;
        ctx.fillText(`WARD ${w.ward} (HEALTH: ${w.score})`, xCanvas - 45, yCanvas - 5);
      });

      // 3. Draw connection lines between complaints in the same ward
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          if (this.nodes[i].complaint.location.ward === this.nodes[j].complaint.location.ward) {
            ctx.beginPath();
            ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
            ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // 4. Draw Individual Complaint nodes
      this.nodes.forEach((node) => {
        const c = node.complaint;
        const pulse = 1 + Math.sin(time * 1.5 + node.x) * 0.2;

        let nodeColor = '#3b82f6';
        if (c.priority === 'critical' || c.priority === 'urgent') {
          nodeColor = '#ef4444';
        } else if (c.status === 'resolved') {
          nodeColor = '#10b981';
        } else if (c.status === 'in_progress') {
          nodeColor = '#06b6d4';
        }

        ctx.strokeStyle = nodeColor;
        ctx.fillStyle = nodeColor;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6 * pulse, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, 11 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = nodeColor + '15';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '7px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillText(c.id, node.x + 8, node.y + 3);
      });

      this.animationId = requestAnimationFrame(draw);
    };

    draw();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeCanvas.bind(this));
    }
  }
}
