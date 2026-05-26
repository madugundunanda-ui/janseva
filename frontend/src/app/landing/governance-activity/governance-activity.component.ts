import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { TimelineService } from '../../core/services/timeline.service';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexGrid,
  ApexFill,
  ApexTooltip,
  ApexLegend,
  ApexDataLabels
} from 'ng-apexcharts';

export type ActivityChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  grid: ApexGrid;
  fill: ApexFill;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  colors: string[];
  dataLabels: ApexDataLabels;
};

@Component({
  selector: 'app-governance-activity',
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <section class="py-32 px-6 bg-transparent relative w-full border-t border-var overflow-hidden">
      <!-- Glow ambient background decoration -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#6AA9FF]/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        <div class="mb-24 text-center">
          <span class="font-mono text-xs tracking-[0.25em] text-[#6AA9FF] uppercase mb-4 block">
            HISTORICAL TIMELINE INDEX
          </span>
          <h2 class="text-3xl md:text-5xl font-bold tracking-tight text-primary-var uppercase text-glow leading-none font-mono">
            Past 30 Days Governance Activity
          </h2>
          <p class="text-xs sm:text-sm text-muted-var font-mono mt-6 max-w-xl mx-auto uppercase tracking-wider">
            Trace systemic performance indices, citizen resolution counts, and throughput volumes over the past billing cycle.
          </p>
        </div>

        <!-- Activity layout grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <!-- Column Left: Chart Analytics Widget -->
          <div class="lg:col-span-8 glass-panel p-6 rounded-xl border border-var bg-glass-var">
            <h3 class="font-mono text-[9px] tracking-widest text-[#6AA9FF] uppercase mb-6">30D RESOLUTION MATRIX</h3>
            @if (chartOptions) {
              <apx-chart
                [series]="chartOptions.series"
                [chart]="chartOptions.chart"
                [xaxis]="chartOptions.xaxis"
                [yaxis]="chartOptions.yaxis"
                [stroke]="chartOptions.stroke"
                [grid]="chartOptions.grid"
                [fill]="chartOptions.fill"
                [tooltip]="chartOptions.tooltip"
                [legend]="chartOptions.legend"
                [colors]="chartOptions.colors"
                [dataLabels]="chartOptions.dataLabels">
              </apx-chart>
            }
          </div>

          <!-- Column Right: Scrolling Timeline Log Details -->
          <div class="lg:col-span-4 glass-panel p-6 rounded-xl border border-var bg-glass-var flex flex-col justify-between">
            <div class="space-y-6">
              <h3 class="font-mono text-[9px] tracking-widest text-muted-var uppercase pb-3 border-b border-var">GOVERNANCE INDEXES</h3>
              
              <!-- Indicator lists -->
              <div class="space-y-4 font-mono text-[10px] uppercase text-primary-var">
                <div class="flex justify-between border-b border-var pb-2">
                  <span>RESOLVED LEGISLATIVE GRIEVANCES</span>
                  <span class="text-emerald-400 font-bold">{{ resolved30d }} Cases</span>
                </div>

                <div class="flex justify-between border-b border-var pb-2">
                  <span>CITIZEN ENGAGEMENT MARGIN</span>
                  <span class="text-[#6AA9FF] font-bold">{{ engagementRate }}% Node Sync</span>
                </div>

                <div class="flex justify-between border-b border-var pb-2">
                  <span>SLA TARGET CLEARANCE RATE</span>
                  <span class="text-primary-var font-bold">{{ slaSuccessRate }}% Passed</span>
                </div>

                <div class="flex justify-between pb-2">
                  <span>DISTRICT ACTIVITY RATING</span>
                  <span class="text-primary-var font-bold">{{ averageResponseTime }}h Avg</span>
                </div>
              </div>
            </div>

            <!-- Footnote description -->
            <div class="pt-6 border-t border-var font-mono text-[8px] text-muted-var uppercase leading-relaxed">
              * DATA SOURCE COMBINES LEDGER TELEMETRY ACROSS ALL 24 DISPATCH WARDS AND IS SECURED WITH AN ACTIVE SHA-256 SYSTEM CHAIN KEY.
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
export class GovernanceActivityComponent implements OnInit {
  chartOptions!: ActivityChartOptions;

  resolved30d = 0;
  engagementRate = 0;
  slaSuccessRate = 0;
  averageResponseTime = 0;

  constructor(private timelineService: TimelineService) {}

  ngOnInit(): void {
    this.timelineService.getTimeline().subscribe((timeline) => {
      this.resolved30d = timeline.resolved30d;
      this.engagementRate = timeline.engagementRate;
      this.slaSuccessRate = timeline.slaSuccessRate;
      this.averageResponseTime = timeline.averageResponseTime;

      this.chartOptions = {
        series: [
          {
            name: 'Resolved Grievances',
            data: timeline.points.map((point) => point.resolvedGrievances)
          },
          {
            name: 'Incoming Tickets',
            data: timeline.points.map((point) => point.incomingTickets)
          }
        ],
        chart: {
          height: 280,
          type: 'area',
          background: 'transparent',
          toolbar: { show: false },
          foreColor: '#6B7280',
          fontFamily: 'monospace'
        },
        colors: ['#10b981', '#6AA9FF'],
        stroke: {
          curve: 'smooth',
          width: 1.5
        },
        grid: {
          borderColor: 'rgba(100, 110, 130, 0.1)',
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: true } }
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories: timeline.points.map((point) => point.date.slice(5)),
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: {
            formatter: (val) => `${val.toFixed(0)}`
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.15,
            opacityTo: 0.01,
            stops: [0, 90, 100]
          }
        },
        tooltip: {
          theme: 'dark',
          x: { show: true }
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          labels: { colors: '#6B7280' }
        }
      };
    });
  }
}
