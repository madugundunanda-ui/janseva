import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { DashboardService } from '../../core/services/dashboard.service';
import { DepartmentsService } from '../../core/services/departments.service';
import { TimelineService } from '../../core/services/timeline.service';
import { DashboardStats } from '../../core/models/dashboard.model';
import { Department } from '../../core/models/department.model';

import {
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexGrid,
  ApexDataLabels,
  ApexPlotOptions,
  ApexTooltip,
  ApexFill,
  ApexLegend
} from 'ng-apexcharts';

export type AreaChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  grid: ApexGrid;
  dataLabels: ApexDataLabels;
  colors: string[];
  tooltip: ApexTooltip;
  fill: ApexFill;
  legend: ApexLegend;
};

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  colors: string[];
  grid: ApexGrid;
  tooltip: ApexTooltip;
};

export type DonutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  stroke: ApexStroke;
};

@Component({
  selector: 'app-analytics',
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Mini stats banner -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Total System Load</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">{{ stats.totalComplaints }}</div>
          <div class="font-mono text-[8px] text-cyan-400 mt-1 uppercase tracking-wide">ACTIVE NODES</div>
        </div>

        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Verified Cleared</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">{{ stats.complaintsResolved }}</div>
          <div class="font-mono text-[8px] text-emerald-400 mt-1 uppercase tracking-wide">SUCCESS RESOLUTION</div>
        </div>

        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Backlog Stack</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">{{ stats.pendingComplaints }}</div>
          <div class="font-mono text-[8px] text-amber-500 mt-1 uppercase tracking-wide">ASSIGNED / ESCALATED</div>
        </div>

        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">SLA Compliance</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">{{ stats.slaSuccessRate }}%</div>
          <div class="font-mono text-[8px] text-cyan-400 mt-1 uppercase tracking-wide">95% TRUST MARGIN</div>
        </div>
      </div>

      <!-- Main Charts grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Area Timeline Chart -->
        <div class="lg:col-span-2 glass-panel p-6 rounded-xl border border-var">
          <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase mb-6">RESOLUTION THROUGHPUT INDEX</h3>
          @if (timelineChartOptions) {
            <apx-chart
              [series]="timelineChartOptions.series"
              [chart]="timelineChartOptions.chart"
              [xaxis]="timelineChartOptions.xaxis"
              [yaxis]="timelineChartOptions.yaxis"
              [stroke]="timelineChartOptions.stroke"
              [grid]="timelineChartOptions.grid"
              [dataLabels]="timelineChartOptions.dataLabels"
              [colors]="timelineChartOptions.colors"
              [tooltip]="timelineChartOptions.tooltip"
              [fill]="timelineChartOptions.fill"
              [legend]="timelineChartOptions.legend">
            </apx-chart>
          }
        </div>

        <!-- Donut Status Chart -->
        <div class="glass-panel p-6 rounded-xl border border-var">
          <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase mb-6">GRIEVANCE DISPOSITION STATE</h3>
          <div class="h-[250px] flex items-center justify-center">
            @if (donutChartOptions) {
              <apx-chart
                [series]="donutChartOptions.series"
                [chart]="donutChartOptions.chart"
                [labels]="donutChartOptions.labels"
                [colors]="donutChartOptions.colors"
                [legend]="donutChartOptions.legend"
                [dataLabels]="donutChartOptions.dataLabels"
                [stroke]="donutChartOptions.stroke"
                [plotOptions]="donutChartOptions.plotOptions">
              </apx-chart>
            }
          </div>
        </div>
      </div>

      <!-- Secondary Chart Grid -->
      <div class="grid grid-cols-1 gap-6">
        <!-- Bar Chart per department -->
        <div class="glass-panel p-6 rounded-xl border border-var">
          <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase mb-6">AVERAGE SLA SPEED INDEX PER DEPT (HOURS)</h3>
          @if (speedChartOptions) {
            <apx-chart
              [series]="speedChartOptions.series"
              [chart]="speedChartOptions.chart"
              [xaxis]="speedChartOptions.xaxis"
              [yaxis]="speedChartOptions.yaxis"
              [plotOptions]="speedChartOptions.plotOptions"
              [dataLabels]="speedChartOptions.dataLabels"
              [colors]="speedChartOptions.colors"
              [grid]="speedChartOptions.grid"
              [tooltip]="speedChartOptions.tooltip">
            </apx-chart>
          }
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
export class AnalyticsComponent implements OnInit {
  stats: DashboardStats = {
    totalComplaints: 0,
    complaintsResolved: 0,
    pendingComplaints: 0,
    activeDepartments: 0,
    slaSuccessRate: 0,
    statusBreakdown: {
      submitted: 0,
      assigned: 0,
      in_progress: 0,
      resolved: 0,
      escalated: 0
    }
  };

  timelineChartOptions!: AreaChartOptions;
  donutChartOptions!: DonutChartOptions;
  speedChartOptions!: BarChartOptions;

  constructor(
    private dashboardService: DashboardService,
    private departmentsService: DepartmentsService,
    private timelineService: TimelineService
  ) {}

  ngOnInit(): void {
    this.dashboardService.loadStats().subscribe((stats) => {
      this.stats = stats;
      this.initCharts();
    });
  }

  private initCharts() {
    this.timelineService.getTimeline().subscribe((timeline) => {
      this.timelineChartOptions = {
        series: [
          {
            name: 'Grievances Filed',
            data: timeline.points.map((point) => point.incomingTickets)
          },
          {
            name: 'Verified Resolved',
            data: timeline.points.map((point) => point.resolvedGrievances)
          }
        ],
        chart: {
          height: 250,
          type: 'area',
          background: 'transparent',
          toolbar: { show: false },
          foreColor: 'rgba(255,255,255,0.4)',
          fontFamily: 'monospace'
        },
        colors: ['#3b82f6', '#06b6d4'],
        stroke: {
          curve: 'smooth',
          width: 2
        },
        grid: {
          borderColor: 'rgba(255, 255, 255, 0.04)',
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
            opacityFrom: 0.25,
            opacityTo: 0.02,
            stops: [0, 90, 100]
          }
        },
        tooltip: {
          theme: 'light',
          x: { show: true }
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          labels: { colors: 'white' }
        }
      };
    });

    const breakdown = this.stats.statusBreakdown;
    this.donutChartOptions = {
      series: [breakdown.submitted, breakdown.assigned, breakdown.in_progress, breakdown.resolved, breakdown.escalated],
      chart: {
        height: 220,
        type: 'donut',
        background: 'transparent',
        foreColor: 'rgba(255,255,255,0.4)',
        fontFamily: 'monospace'
      },
      labels: ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Escalated'],
      colors: ['#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#ef4444'],
      legend: {
        show: true,
        position: 'bottom',
        labels: { colors: 'white' }
      },
      stroke: {
        show: true,
        colors: ['#A33F93'],
        width: 2
      },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            background: 'transparent',
            labels: {
              show: true,
              name: { show: true, fontSize: '9px', color: 'rgba(255,255,255,0.4)' },
              value: { show: true, fontSize: '16px', color: 'white', fontWeight: 'bold' },
              total: {
                show: true,
                label: 'TOTAL',
                formatter: () => `${this.stats.totalComplaints}`
              }
            }
          }
        }
      }
    };

    this.departmentsService.loadDepartments().subscribe((departments) => {
      const topDepartments = departments.slice(0, 5);
      this.speedChartOptions = {
        series: [
          {
            name: 'Avg SLA (Hours)',
            data: topDepartments.map((department) => Number(department.avgResponseTime.toFixed(1)))
          }
        ],
        chart: {
          height: 250,
          type: 'bar',
          background: 'transparent',
          toolbar: { show: false },
          foreColor: 'rgba(255,255,255,0.4)',
          fontFamily: 'monospace'
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '25%',
            borderRadius: 4
          }
        },
        colors: ['#06b6d4'],
        dataLabels: { enabled: false },
        xaxis: {
          categories: topDepartments.map((department) => department.name),
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: {
            formatter: (val) => `${val.toFixed(1)}h`
          }
        },
        grid: {
          borderColor: 'rgba(255, 255, 255, 0.04)'
        },
        tooltip: {
          theme: 'light'
        }
      };
    });
  }
}
