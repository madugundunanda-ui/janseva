import { Injectable, signal, computed } from '@angular/core';

export interface DemoHighlight {
  title: string;
  description: string;
  targetSelector?: string;
  role: 'citizen' | 'officer' | 'supervisor' | 'admin' | 'all';
}

@Injectable({
  providedIn: 'root'
})
export class DemoModeService {
  demoActive = signal<boolean>(false);
  showTour = signal<boolean>(false);
  tourStep = signal<number>(0);

  // Simulated live metrics ticker for hackathon presentation
  private baseTotal = 142850;
  private baseResolved = 139420;
  
  totalGrievances = signal<number>(this.baseTotal);
  resolvedGrievances = signal<number>(this.baseResolved);
  avgSlaHours = signal<number>(3.2);
  slaCompliance = signal<number>(98.4);

  private tickerInterval: any;

  tourHighlights: DemoHighlight[] = [
    {
      title: 'Multilingual Voice AI Triage',
      description: 'Citizens submit complaints via speech in 4 Indian languages. Gemini AI extracts urgency, category, and GPS location in real time.',
      role: 'citizen'
    },
    {
      title: 'Automated Department Routing & Risk Scoring',
      description: 'AI calculates SLA risk metrics and dispatches complaints directly to field officers without manual bottlenecks.',
      role: 'officer'
    },
    {
      title: 'Supervisor SLA Workload Balance',
      description: 'Supervisors track ward bottlenecks, officer performance rosters, and automated SLA warnings.',
      role: 'supervisor'
    },
    {
      title: 'National Command & AI Diagnostics',
      description: 'Admin command center provides real-time audit ledger, model confidence tracking, and ward heatmaps.',
      role: 'admin'
    }
  ];

  currentHighlight = computed(() => this.tourHighlights[this.tourStep()]);

  toggleDemoMode(enable?: boolean) {
    const nextState = enable !== undefined ? enable : !this.demoActive();
    this.demoActive.set(nextState);

    if (nextState) {
      this.startLiveTicker();
    } else {
      this.stopLiveTicker();
    }
  }

  private startLiveTicker() {
    this.stopLiveTicker();
    this.tickerInterval = setInterval(() => {
      if (this.demoActive()) {
        this.totalGrievances.update(v => v + 1);
        if (Math.random() > 0.3) {
          this.resolvedGrievances.update(v => v + 1);
        }
      }
    }, 4000);
  }

  private stopLiveTicker() {
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
  }

  openTour() {
    this.tourStep.set(0);
    this.showTour.set(true);
  }

  closeTour() {
    this.showTour.set(false);
  }

  nextTourStep() {
    if (this.tourStep() < this.tourHighlights.length - 1) {
      this.tourStep.update(s => s + 1);
    } else {
      this.closeTour();
    }
  }

  prevTourStep() {
    if (this.tourStep() > 0) {
      this.tourStep.update(s => s - 1);
    }
  }
}
