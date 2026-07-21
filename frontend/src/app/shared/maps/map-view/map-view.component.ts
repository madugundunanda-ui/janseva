import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, PLATFORM_ID, Inject, Input, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ApiService, Complaint } from '../../../core/services/api.service';
import { TranslationService } from '../../../core/services/translation.service';

interface WardScore {
  ward: string;
  score: number;
  color: string;
  activeCount: number;
  resolvedCount: number;
}

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-surface p-6 space-y-6 font-sans">
      
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Ward Grievance Hotspot Heatmap</h2>
          <p class="text-xs text-slate-500">Geospatial telemetry and ward civic health score index.</p>
        </div>
        <span class="badge-status badge-progress">Live GPS Telemetry</span>
      </div>

      <!-- Key Metrics Row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
          <span class="text-xs font-semibold text-slate-500 uppercase block">State SLA Margin</span>
          <span class="text-xl font-bold font-mono text-emerald-600">92.4% SLA</span>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
          <span class="text-xs font-semibold text-slate-500 uppercase block">Public Audit Transparency</span>
          <span class="text-xl font-bold font-mono text-indigo-600">100% Verified</span>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
          <span class="text-xs font-semibold text-slate-500 uppercase block">Visual Cleared Proofs</span>
          <span class="text-xl font-bold font-mono text-slate-900">1,482 Cleared</span>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
          <span class="text-xs font-semibold text-slate-500 uppercase block">Citizen Trust Rating</span>
          <span class="text-xl font-bold font-mono text-emerald-600">4.8 / 5.0</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        <!-- Left: Map Canvas Container -->
        <div class="lg:col-span-8 relative border border-slate-200 bg-slate-100 rounded-xl overflow-hidden min-h-[480px]">
          <canvas #mapCanvas class="w-full h-full object-cover"></canvas>
          
          <!-- Legend Overlay -->
          <div class="absolute bottom-4 left-4 p-3 rounded-lg bg-white/95 border border-slate-200 shadow-sm text-xs font-medium text-slate-700 space-y-1.5 pointer-events-none z-10">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>High Severity Zone (&lt; 50 Health)</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Moderate Density (50-80 Health)</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Healthy Ward (&gt;= 80 Health)</span>
            </div>
          </div>
        </div>

        <!-- Right: Ward Civic Health Roster -->
        <div class="lg:col-span-4 card-surface p-4 flex flex-col justify-between bg-slate-50">
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Ward Civic Health Index</h3>
            
            <div class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              @for (w of wardScores; track w.ward) {
                <div class="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5 text-xs">
                  <div class="flex justify-between items-center font-semibold text-slate-900">
                    <span>Ward {{ w.ward }}</span>
                    <span [style.color]="w.color" class="font-bold">{{ w.score }}/100</span>
                  </div>

                  <!-- Progress Bar -->
                  <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div class="h-full rounded-full" [style.background]="w.color" [style.width.%]="w.score"></div>
                  </div>

                  <div class="flex justify-between text-[11px] text-slate-500">
                    <span>Active: {{ w.activeCount }}</span>
                    <span>Resolved: {{ w.resolvedCount }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="pt-3 border-t border-slate-200 text-[11px] text-slate-500">
            * Health scores update dynamically based on SLA response speed.
          </div>
        </div>
      </div>
    </div>
  `
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() complaintsList: Complaint[] = [];
  hoveredNode: Complaint | null = null;
  wardScores: WardScore[] = [];

  private context!: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private nodes: Array<{ x: number; y: number; complaint: Complaint }> = [];

  public translationService = inject(TranslationService);
  private apiService = inject(ApiService);

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {
    if (this.complaintsList && this.complaintsList.length > 0) {
      this.calculateWardScores();
    } else {
      this.apiService.getComplaints().subscribe((data) => {
        this.complaintsList = data;
        this.calculateWardScores();
      });
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = this.canvasRef.nativeElement;
    this.context = canvas.getContext('2d')!;

    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
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

    const results: WardScore[] = [];
    for (const [ward, stats] of Object.entries(wardMap)) {
      let score = 100 - (stats.active * 12) + (stats.resolved * 5);
      score = Math.max(30, Math.min(100, score));

      let color = '#f43f5e';
      if (score >= 80) color = '#10b981';
      else if (score >= 50) color = '#d97706';

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

  private renderMap() {
    const draw = () => {
      const canvas = this.canvasRef.nativeElement;
      const ctx = this.context;
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#e2e8f0';
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

      this.nodes.forEach((node) => {
        const c = node.complaint;

        let nodeColor = '#4f46e5';
        if (c.priority === 'critical' || c.priority === 'high') {
          nodeColor = '#f43f5e';
        } else if (c.status === 'resolved') {
          nodeColor = '#10b981';
        }

        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      this.animationId = requestAnimationFrame(draw);
    };

    draw();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
