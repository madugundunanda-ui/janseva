import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';

export interface GovUpdateCard {
  id: string;
  title: string;
  summary: string;
  aiSummary: string;
  department: string;
  state: string;
  district: string;
  category: 'Scheme' | 'Emergency' | 'Notice' | 'Policy';
  severity: 'Info' | 'Advisory' | 'Warning' | 'Emergency';
  officialSource: string;
  publishedTime: string;
  publishedTimestamp: number;
  timeline: 'live' | 'today' | 'yesterday' | '7days' | '30days';
  isVerified: boolean;
  isEmergency: boolean;
  language: string;
  saved?: boolean;
}

@Component({
  selector: 'app-government-updates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section id="updates" class="py-20 bg-white border-t border-slate-200/80 font-sans">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 uppercase tracking-wider">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Governance Intelligence Feed
            </div>
            <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Government Updates & Intelligence
            </h2>
            <p class="text-xs sm:text-sm text-slate-600">
              Verified state policy directives, emergency municipal alerts, and civic welfare schemes.
            </p>
          </div>

          <!-- Search Input & Sort Selector -->
          <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div class="w-full sm:w-64 relative">
              <input type="text"
                     [(ngModel)]="searchQuery"
                     (ngModelChange)="applyFilters()"
                     placeholder="Search directives, schemes..."
                     class="w-full py-2.5 pl-10 pr-4 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>

            <!-- Sorting Selector -->
            <select [(ngModel)]="sortBy" (change)="applyFilters()" class="w-full sm:w-auto py-2.5 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none">
              <option value="latest">Sort: Latest</option>
              <option value="emergency">Sort: Emergency First</option>
              <option value="department">Sort: Department</option>
              <option value="state">Sort: State</option>
            </select>
          </div>
        </div>

        <!-- Newspaper Timeline Filter Bar -->
        <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          
          <!-- Timeline Tabs -->
          <div class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <button *ngFor="let t of timelineTabs"
                    (click)="selectTimeline(t.id)"
                    class="px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
                    [ngClass]="{
                      'bg-indigo-600 text-white shadow-xs': selectedTimeline === t.id,
                      'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60': selectedTimeline !== t.id
                    }">
              {{ t.label }}
            </button>
          </div>

          <!-- Quick Filters: State, Category & Emergency Toggle -->
          <div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto text-xs">
            
            <select [(ngModel)]="selectedState" (change)="applyFilters()" class="py-1.5 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium focus:outline-none">
              <option value="ALL">All States</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Telangana">Telangana</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>

            <select [(ngModel)]="selectedCategory" (change)="applyFilters()" class="py-1.5 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium focus:outline-none">
              <option value="ALL">All Categories</option>
              <option value="Scheme">Welfare Schemes</option>
              <option value="Emergency">Emergency Alerts</option>
              <option value="Notice">Municipal Notices</option>
              <option value="Policy">State Policy</option>
            </select>

            <button (click)="toggleEmergencyOnly()"
                    class="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    [ngClass]="{
                      'bg-rose-50 border-rose-300 text-rose-700 font-bold': emergencyOnly,
                      'bg-white border-slate-200 text-slate-600 hover:bg-slate-100': !emergencyOnly
                    }">
              <span>🚨 Emergency Only</span>
            </button>

          </div>

        </div>

        <!-- Error State Banner (If error occurs) -->
        <div *ngIf="hasError" class="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-xl">⚠️</span>
            <span>Government updates are temporarily unavailable. Please try again later.</span>
          </div>
          <button (click)="hasError = false; applyFilters()" class="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700">Retry</button>
        </div>

        <!-- Updates Cards Grid -->
        <div *ngIf="!hasError && filteredUpdates.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let card of displayedUpdates"
               class="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5 relative overflow-hidden group">
            
            <!-- Card Top Header -->
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-2">
                <!-- Severity & Category Badge -->
                <div class="flex items-center gap-1.5">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                        [ngClass]="{
                          'bg-rose-100 text-rose-700 border border-rose-200': card.severity === 'Emergency',
                          'bg-amber-100 text-amber-800 border border-amber-200': card.severity === 'Warning' || card.severity === 'Advisory',
                          'bg-sky-100 text-sky-800 border border-sky-200': card.severity === 'Info'
                        }">
                    {{ card.severity }}
                  </span>

                  <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    • {{ card.department }}
                  </span>
                </div>

                <!-- Verified & Language Indicators -->
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ card.language }}</span>

                  <span *ngIf="card.isVerified" class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600" title="Verified Official Source">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    Official
                  </span>
                </div>
              </div>

              <h3 class="text-base font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                {{ card.title }}
              </h3>

              <p class="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {{ card.summary }}
              </p>

              <!-- AI Executive Summary Snippet -->
              <div class="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                <div class="flex items-center gap-1.5 text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">
                  <span>✨ AI Summary</span>
                </div>
                <p class="text-[11px] text-indigo-950 font-medium leading-relaxed">
                  {{ card.aiSummary }}
                </p>
              </div>
            </div>

            <!-- Card Bottom Meta & Actions -->
            <div class="pt-4 border-t border-slate-100 space-y-3">
              <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{{ card.state }} • {{ card.officialSource }}</span>
                <span>{{ card.publishedTime }}</span>
              </div>

              <div class="flex items-center justify-between gap-2 pt-1">
                <a [href]="card.officialSource" target="_blank" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
                  <span>Official Source</span> →
                </a>

                <div class="flex items-center gap-2">
                  <button (click)="toggleSave(card)" class="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 transition-colors cursor-pointer" [title]="card.saved ? 'Unsave' : 'Save Update'">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" [attr.fill]="card.saved ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  </button>

                  <button (click)="shareUpdate(card)" class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer" title="Share Update">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- No Results Empty State -->
        <div *ngIf="!hasError && filteredUpdates.length === 0" class="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
          <div class="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xl mx-auto">🔍</div>
          <p class="text-sm font-bold text-slate-700">No government updates match your current filter parameters.</p>
          <button (click)="resetFilters()" class="text-xs font-bold text-indigo-600 hover:underline">Clear Filters & Search</button>
        </div>

        <!-- Infinite Scroll Load More Button -->
        <div *ngIf="!hasError && displayedUpdates.length < filteredUpdates.length" class="text-center pt-4">
          <button (click)="loadMore()" class="px-6 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 text-xs font-bold transition-all shadow-xs cursor-pointer">
            Load More Government Directives
          </button>
        </div>

      </div>
    </section>
  `
})
export class GovernmentUpdatesComponent implements OnInit {
  translationService = inject(TranslationService);

  searchQuery = '';
  sortBy = 'latest';
  selectedTimeline = 'live';
  selectedState = 'ALL';
  selectedCategory = 'ALL';
  emergencyOnly = false;
  hasError = false;

  pageSize = 6;
  currentPage = 1;

  timelineTabs = [
    { id: 'live', label: '🔴 Live Feed' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' }
  ];

  allUpdates: GovUpdateCard[] = [
    {
      id: '1',
      title: 'State Jal Jeevan Mission Expansion & Pipeline Renewal',
      summary: 'State Water Resources Ministry issues Rs 450 Cr allocation for urban pipeline inspection and automated leak detection.',
      aiSummary: 'Rs 450 Cr sanctioned for instant pipeline repairs and automated monitoring across 14 municipal corporations.',
      department: 'Water Supply',
      state: 'Andhra Pradesh',
      district: 'Visakhapatnam',
      category: 'Scheme',
      severity: 'Info',
      officialSource: 'Water Dept Directive #402',
      publishedTime: '10 mins ago',
      publishedTimestamp: Date.now() - 10 * 60 * 1000,
      timeline: 'live',
      isVerified: true,
      isEmergency: false,
      language: 'EN'
    },
    {
      id: '2',
      title: 'Heavy Rainfall Warning & Emergency Drainage Hotline',
      summary: 'Municipal Disaster Response dispatches storm pumps across coastal zones. Emergency protocol activated for low-lying wards.',
      aiSummary: 'Coastal wards put on alert. 24x7 emergency dispatch units deployed for waterlogging removal.',
      department: 'Emergency Response',
      state: 'Telangana',
      district: 'Hyderabad',
      category: 'Emergency',
      severity: 'Emergency',
      officialSource: 'State Disaster Cell',
      publishedTime: '35 mins ago',
      publishedTimestamp: Date.now() - 35 * 60 * 1000,
      timeline: 'live',
      isVerified: true,
      isEmergency: true,
      language: 'EN'
    },
    {
      id: '3',
      title: 'Smart Solar Streetlight Installation Scheme Phase 3',
      summary: 'Urban Development Ministry releases 15,000 smart LED units with remote failure sensors across municipal arterial roads.',
      aiSummary: '15,000 IoT streetlights to automatically trigger officer maintenance alerts upon bulb failure.',
      department: 'Street Lighting',
      state: 'Karnataka',
      district: 'Bengaluru',
      category: 'Scheme',
      severity: 'Info',
      officialSource: 'Smart City Urban Infra Board',
      publishedTime: '2 hours ago',
      publishedTimestamp: Date.now() - 2 * 60 * 60 * 1000,
      timeline: 'today',
      isVerified: true,
      isEmergency: false,
      language: 'EN'
    },
    {
      id: '4',
      title: 'Monsoon Sanitation & Waste Disposal Directive',
      summary: 'Health Ministry mandates daily garbage clearing in residential wards to prevent seasonal vector-borne diseases.',
      aiSummary: 'Daily ward sanitization squads assigned to audit wet waste disposal sites every morning.',
      department: 'Sanitation',
      state: 'Tamil Nadu',
      district: 'Chennai',
      category: 'Notice',
      severity: 'Advisory',
      officialSource: 'Public Health Department',
      publishedTime: '1 day ago',
      publishedTimestamp: Date.now() - 24 * 60 * 60 * 1000,
      timeline: 'yesterday',
      isVerified: true,
      isEmergency: false,
      language: 'EN'
    },
    {
      id: '5',
      title: 'State Highways Pothole Patching Fast-Track Policy',
      summary: 'Roads & Highways Department launches AI photo auditing mandate. All pothole repairs must be verified via visual delta match within 48 hours.',
      aiSummary: 'Road contractors must submit high-res photo proof before invoice approval under new SLA rules.',
      department: 'Roads & Highways',
      state: 'Maharashtra',
      district: 'Mumbai',
      category: 'Policy',
      severity: 'Warning',
      officialSource: 'Ministry of Road Transport',
      publishedTime: '3 days ago',
      publishedTimestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
      timeline: '7days',
      isVerified: true,
      isEmergency: false,
      language: 'EN'
    }
  ];

  filteredUpdates: GovUpdateCard[] = [];
  displayedUpdates: GovUpdateCard[] = [];

  ngOnInit(): void {
    this.applyFilters();
  }

  selectTimeline(tabId: string): void {
    this.selectedTimeline = tabId;
    this.applyFilters();
  }

  toggleEmergencyOnly(): void {
    this.emergencyOnly = !this.emergencyOnly;
    this.applyFilters();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.filteredUpdates = this.allUpdates.filter(item => {
      if (this.emergencyOnly && !item.isEmergency) return false;
      if (this.selectedState !== 'ALL' && item.state !== this.selectedState) return false;
      if (this.selectedCategory !== 'ALL' && item.category !== this.selectedCategory) return false;
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSummary = item.summary.toLowerCase().includes(q);
        const matchDept = item.department.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchDept) return false;
      }
      return true;
    });

    // Apply Sorting
    this.filteredUpdates.sort((a, b) => {
      if (this.sortBy === 'latest') {
        return b.publishedTimestamp - a.publishedTimestamp;
      } else if (this.sortBy === 'emergency') {
        return (b.isEmergency ? 1 : 0) - (a.isEmergency ? 1 : 0);
      } else if (this.sortBy === 'department') {
        return a.department.localeCompare(b.department);
      } else if (this.sortBy === 'state') {
        return a.state.localeCompare(b.state);
      }
      return 0;
    });

    this.updateDisplayedList();
  }

  updateDisplayedList(): void {
    this.displayedUpdates = this.filteredUpdates.slice(0, this.pageSize * this.currentPage);
  }

  loadMore(): void {
    this.currentPage++;
    this.updateDisplayedList();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.sortBy = 'latest';
    this.selectedTimeline = 'live';
    this.selectedState = 'ALL';
    this.selectedCategory = 'ALL';
    this.emergencyOnly = false;
    this.hasError = false;
    this.applyFilters();
  }

  toggleSave(card: GovUpdateCard): void {
    card.saved = !card.saved;
  }

  shareUpdate(card: GovUpdateCard): void {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: card.title,
        text: card.summary,
        url: window.location.href
      }).catch(() => {});
    } else {
      alert(`Share Link Copied: ${card.title} - ${card.officialSource}`);
    }
  }
}
