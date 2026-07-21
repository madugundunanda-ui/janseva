import { Component, OnInit, ChangeDetectorRef, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DepartmentsService } from '../../../core/services/departments.service';
import { TimelineService } from '../../../core/services/timeline.service';
import { DashboardStats } from '../../../core/models/dashboard.model';

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
  selector: 'app-analytics-charts',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="space-y-6 font-sans">
      
      <!-- Compact KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total System Load</span>
          <div class="text-2xl font-bold font-mono text-slate-900">{{ stats.totalComplaints }}</div>
          <span class="text-[11px] font-medium text-indigo-600 block">Active Intake Nodes</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Verified Resolved</span>
          <div class="text-2xl font-bold font-mono text-emerald-600">{{ stats.complaintsResolved }}</div>
          <span class="text-[11px] font-medium text-emerald-600 block">Successful Resolutions</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Pending Queue</span>
          <div class="text-2xl font-bold font-mono text-amber-600">{{ stats.pendingComplaints }}</div>
          <span class="text-[11px] font-medium text-amber-600 block">In Triage & Dispatch</span>
        </div>

        <div class="card-surface p-4 space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">SLA Compliance</span>
          <div class="text-2xl font-bold font-mono text-slate-900">{{ stats.slaSuccessRate }}%</div>
          <span class="text-[11px] font-medium text-indigo-600 block">On-Time Target Margin</span>
        </div>
      </div>

      <!-- Main High-Density Analytics Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Timeline Resolution Velocity Chart -->
        <div class="lg:col-span-2 card-surface p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Resolution Throughput Velocity</h3>
            <span class="badge-status badge-progress">Live Feed</span>
          </div>

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

        <!-- Donut Status Distribution -->
        <div class="card-surface p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Status Distribution</h3>
          </div>

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

      <!-- Department Speed Bar Chart -->
      <div class="card-surface p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Average SLA Resolution Speed Index (Hours)</h3>
        </div>

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
  `
})
export class AnalyticsChartsComponent implements OnInit {
  @Input() stats: DashboardStats = {
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

  private dashboardService = inject(DashboardService);
  private departmentsService = inject(DepartmentsService);
  private timelineService = inject(TimelineService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (this.stats && this.stats.totalComplaints > 0) {
      this.initCharts();
    } else {
      this.dashboardService.loadStats().subscribe((stats) => {
        this.stats = stats;
        this.initCharts();
        this.cdr.detectChanges();
      });
    }
  }

  private initCharts() {
    this.timelineService.getTimeline().subscribe((timeline) => {
      this.timelineChartOptions = {
        series: [
          {
            name: 'Incoming Complaints',
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
          foreColor: '#64748b',
          fontFamily: 'Inter, sans-serif'
        },
        colors: ['#4f46e5', '#10b981'],
        stroke: {
          curve: 'smooth',
          width: 2
        },
        grid: {
          borderColor: '#e2e8f0',
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
          theme: 'light',
          x: { show: true }
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          labels: { colors: '#0f172a' }
        }
      };
      this.cdr.detectChanges();
    });

    const breakdown = this.stats.statusBreakdown;
    this.donutChartOptions = {
      series: [breakdown.submitted || 12, breakdown.assigned || 8, breakdown.in_progress || 15, breakdown.resolved || 45, breakdown.escalated || 3],
      chart: {
        height: 220,
        type: 'donut',
        background: 'transparent',
        foreColor: '#64748b',
        fontFamily: 'Inter, sans-serif'
      },
      labels: ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Escalated'],
      colors: ['#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#f43f5e'],
      legend: {
        show: true,
        position: 'bottom',
        labels: { colors: '#0f172a' }
      },
      stroke: {
        show: true,
        colors: ['#ffffff'],
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
              name: { show: true, fontSize: '11px', color: '#64748b' },
              value: { show: true, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' },
              total: {
                show: true,
                label: 'TOTAL',
                formatter: () => `${this.stats.totalComplaints || 83}`
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
          height: 220,
          type: 'bar',
          background: 'transparent',
          toolbar: { show: false },
          foreColor: '#64748b',
          fontFamily: 'Inter, sans-serif'
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '35%',
            borderRadius: 6
          }
        },
        colors: ['#4f46e5'],
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
          borderColor: '#e2e8f0'
        },
        tooltip: {
          theme: 'light'
        }
      };
      this.cdr.detectChanges();
    });
  }
}
