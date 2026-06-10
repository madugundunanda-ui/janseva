import { Component, OnDestroy, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { ComplaintsService } from '../../../../core/services/complaints.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LocalStorageService } from '../../services/local-storage.service';

enum ComplaintWizardState {
  Idle = 'Idle',
  LanguageSelection = 'Language Selection',
  MainMenu = 'Main Menu',
  RaiseComplaint = 'Raise Complaint',
  UploadImage = 'Upload Image',
  AIAnalysis = 'AI Analysis',
  LocationCapture = 'Location Capture',
  Review = 'Review',
  Submit = 'Submit',
  Confirmation = 'Confirmation'
}

enum OfflineQueueState {
  ComplaintCreated = 'Complaint Created',
  NoNetwork = 'No Network',
  StoreLocally = 'Store Locally',
  AutoSync = 'Auto Sync',
  ServerSubmission = 'Server Submission'
}

interface ComplaintDraft {
  id: string;
  title: string;
  description: string;
  department: string;
  priority: string;
  voiceTranscription: string;
  aiIssue: string;
  severityScore: number | null;
  severityReason: string[];
  location: string | null;
  imagePath: string | null;
  language: string;
  createdAt: string;
}

interface OfflineComplaintQueueEntry extends ComplaintDraft {
  queueState: OfflineQueueState;
  attempts: number;
  lastError: string | null;
}

interface ReverseGeocodeResponse {
  address: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
}

interface DistrictContext {
  detectedDistrict: string;
  source: 'profile' | 'consent' | 'location' | 'manual';
  schemes: string[];
  updates: string[];
  departments: string[];
}

@Component({
  selector: 'app-complaint-assistant',
  standalone: false,
  template: `
    <section class="complaint-wizard">
      <header>
        <h2>Complaint Wizard</h2>
        <p>{{ currentState }}</p>
      </header>

      <div class="district-banner">
        <strong>{{ districtBadge }}</strong>
        @if (districtContext) {
          <span>Auto-filtering schemes, updates, and departments for {{ districtDetected }}</span>
        }
      </div>

      @if (districtContext) {
        <div class="district-grid">
          <div>
            <h3>Schemes</h3>
            <ul>
              @for (scheme of districtContext.schemes; track scheme) {
                <li>{{ scheme }}</li>
              }
            </ul>
          </div>
          <div>
            <h3>Updates</h3>
            <ul>
              @for (update of districtContext.updates; track update) {
                <li>{{ update }}</li>
              }
            </ul>
          </div>
          <div>
            <h3>Suggested Departments</h3>
            <ul>
              @for (departmentItem of districtContext.departments; track departmentItem) {
                <li>{{ departmentItem }}</li>
              }
            </ul>
          </div>
        </div>
      }

      <div class="step-list">
        <button type="button" (click)="start()" [disabled]="!canTransitionTo(ComplaintWizardState.LanguageSelection)">Start</button>
        <button type="button" (click)="selectLanguage('en-IN')" [disabled]="!canTransitionTo(ComplaintWizardState.MainMenu)">Language</button>
        <button type="button" (click)="openMainMenu()" [disabled]="!canTransitionTo(ComplaintWizardState.RaiseComplaint)">Menu</button>
        <button type="button" (click)="beginRaiseComplaint()" [disabled]="!canTransitionTo(ComplaintWizardState.UploadImage)">Raise Complaint</button>
        <button type="button" (click)="uploadImage('sample-image')" [disabled]="!canTransitionTo(ComplaintWizardState.AIAnalysis)">Upload Image</button>
        <button type="button" (click)="runAnalysis()" [disabled]="!canTransitionTo(ComplaintWizardState.LocationCapture)">AI Analysis</button>
        <button type="button" (click)="captureLocation('12.9716,77.5946')" [disabled]="!canTransitionTo(ComplaintWizardState.Review)">Location</button>
        <button type="button" (click)="reviewComplaint()" [disabled]="!canTransitionTo(ComplaintWizardState.Submit)">Review</button>
        <button type="button" (click)="submitComplaint()" [disabled]="!canTransitionTo(ComplaintWizardState.Confirmation)">Submit</button>
        <button type="button" (click)="confirmSubmission()" [disabled]="!canTransitionTo(ComplaintWizardState.Idle)">Confirm</button>
      </div>

      <p class="error" [style.display]="errorMessage ? 'block' : 'none'">{{ errorMessage }}</p>
    </section>
  `,
  styles: [
    `
      .complaint-wizard { padding: 16px; border: 1px solid #d9dce3; border-radius: 16px; background: #fff; }
      .district-banner { margin-top: 12px; padding: 12px 14px; border-radius: 12px; background: #f1f7ff; border: 1px solid #cfe3ff; display: flex; flex-direction: column; gap: 4px; }
      .district-banner strong { color: #0f4c81; }
      .district-banner span { color: #35506b; font-size: 13px; }
      .district-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 12px; }
      .district-grid h3 { margin: 0 0 8px; font-size: 13px; color: #1f2937; }
      .district-grid ul { margin: 0; padding-left: 18px; color: #4b5563; font-size: 13px; }
      .step-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-top: 16px; }
      button { padding: 10px 12px; border: 0; border-radius: 10px; background: #1f6feb; color: #fff; cursor: pointer; }
      button:disabled { opacity: 0.35; cursor: not-allowed; }
      .error { margin-top: 12px; color: #b42318; }
    `
  ]
})
export class ComplaintAssistantComponent {
  readonly ComplaintWizardState = ComplaintWizardState;
  readonly OfflineQueueState = OfflineQueueState;

  currentState: ComplaintWizardState = ComplaintWizardState.Idle;
  errorMessage = '';
  selectedLanguage = 'en-IN';
  imagePath: string | null = null;
  locationValue: string | null = null;
  description = '';
  title = '';
  department = 'general';
  priority = 'medium';
  voiceTranscription = '';
  aiIssue = '';
  severityScore: number | null = null;
  severityReason: string[] = [];
  offlineComplaintQueue: OfflineComplaintQueueEntry[] = [];
  currentQueueState: OfflineQueueState | null = null;
  isSyncingQueue = false;
  districtContext: DistrictContext | null = null;
  districtBadge = 'District not detected';
  districtConsentGranted = false;

  private readonly allowedTransitions: Record<ComplaintWizardState, ComplaintWizardState[]> = {
    [ComplaintWizardState.Idle]: [ComplaintWizardState.LanguageSelection],
    [ComplaintWizardState.LanguageSelection]: [ComplaintWizardState.MainMenu],
    [ComplaintWizardState.MainMenu]: [ComplaintWizardState.RaiseComplaint],
    [ComplaintWizardState.RaiseComplaint]: [ComplaintWizardState.UploadImage],
    [ComplaintWizardState.UploadImage]: [ComplaintWizardState.AIAnalysis],
    [ComplaintWizardState.AIAnalysis]: [ComplaintWizardState.LocationCapture],
    [ComplaintWizardState.LocationCapture]: [ComplaintWizardState.Review],
    [ComplaintWizardState.Review]: [ComplaintWizardState.Submit],
    [ComplaintWizardState.Submit]: [ComplaintWizardState.Confirmation],
    [ComplaintWizardState.Confirmation]: [ComplaintWizardState.Idle]
  };

  private readonly queueTransitions: Record<OfflineQueueState, OfflineQueueState[]> = {
    [OfflineQueueState.ComplaintCreated]: [OfflineQueueState.NoNetwork],
    [OfflineQueueState.NoNetwork]: [OfflineQueueState.StoreLocally],
    [OfflineQueueState.StoreLocally]: [OfflineQueueState.AutoSync],
    [OfflineQueueState.AutoSync]: [OfflineQueueState.ServerSubmission],
    [OfflineQueueState.ServerSubmission]: []
  };

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private complaintsService: ComplaintsService,
    private storageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.offlineComplaintQueue = this.storageService.getOfflineComplaintQueue() as OfflineComplaintQueueEntry[];
    this.currentQueueState = this.offlineComplaintQueue[0]?.queueState || null;
    this.districtConsentGranted = this.storageService.hasConsent('location');

    const savedDistrict = this.storageService.getDistrictPreference();
    const profileDistrict = this.authService.currentUser()?.district?.trim();

    if (profileDistrict) {
      this.applyDistrictContext(profileDistrict, 'profile');
    } else if (savedDistrict) {
      this.applyDistrictContext(savedDistrict, 'manual');
    }

    if (this.districtConsentGranted) {
      void this.detectDistrictAutomatically();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
    }

    if (this.isOnline()) {
      void this.syncOfflineQueue();
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
    }
  }

  private handleOnline = (): void => {
    void this.syncOfflineQueue();
  };

  private async detectDistrictAutomatically(): Promise<void> {
    if (!this.districtConsentGranted || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 600000
        });
      });

      const reverseGeocode = await firstValueFrom(
        this.apiService.post<ReverseGeocodeResponse>('/geo/reverse', {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      );

      const detectedDistrict = this.extractDistrictLabel(reverseGeocode);
      this.applyDistrictContext(detectedDistrict, 'consent');
    } catch {
      // Keep the existing district from profile or saved preference.
    }
  }

  private applyDistrictContext(districtValue: string, source: DistrictContext['source']): void {
    const detectedDistrict = this.normalizeDistrictName(districtValue);

    this.districtContext = {
      detectedDistrict,
      source,
      schemes: this.getDistrictSchemes(detectedDistrict),
      updates: this.getDistrictUpdates(detectedDistrict),
      departments: this.getDistrictDepartments(detectedDistrict)
    };
    this.districtBadge = `Detected: ${detectedDistrict}`;
    this.storageService.saveDistrictPreference(detectedDistrict);
  }

  private extractDistrictLabel(location: ReverseGeocodeResponse): string {
    return location.area || location.city || location.state || 'Unknown District';
  }

  private normalizeDistrictName(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Unknown District';
    }

    if (/district|zone|municipality|corporation/i.test(trimmed)) {
      return trimmed;
    }

    return `${trimmed} District`;
  }

  private getDistrictSchemes(district: string): string[] {
    return [
      `${district} civic service schemes`,
      `${district} sanitation assistance`,
      `${district} water and drainage support`
    ];
  }

  private getDistrictUpdates(district: string): string[] {
    return [
      `${district} local government updates`,
      `${district} public works notices`,
      `${district} emergency and service alerts`
    ];
  }

  private getDistrictDepartments(district: string): string[] {
    return [
      `${district} Water Supply`,
      `${district} Roads & Drains`,
      `${district} Sanitation`,
      `${district} Electrical Services`
    ];
  }

  canTransitionTo(nextState: ComplaintWizardState): boolean {
    return this.allowedTransitions[this.currentState].includes(nextState);
  }

  transitionTo(nextState: ComplaintWizardState): boolean {
    if (!this.canTransitionTo(nextState)) {
      this.errorMessage = `Invalid transition from ${this.currentState} to ${nextState}`;
      return false;
    }

    this.errorMessage = '';
    this.currentState = nextState;
    return true;
  }

  canTransitionQueueTo(currentState: OfflineQueueState | null, nextState: OfflineQueueState): boolean {
    if (!currentState) {
      return nextState === OfflineQueueState.ComplaintCreated;
    }

    return this.queueTransitions[currentState].includes(nextState);
  }

  transitionQueueTo(currentState: OfflineQueueState | null, nextState: OfflineQueueState): boolean {
    if (!this.canTransitionQueueTo(currentState, nextState)) {
      this.errorMessage = `Invalid queue transition from ${currentState} to ${nextState}`;
      return false;
    }

    this.currentQueueState = nextState;
    return true;
  }

  start(): void {
    this.transitionTo(ComplaintWizardState.LanguageSelection);
  }

  selectLanguage(language: string): void {
    if (!this.transitionTo(ComplaintWizardState.MainMenu)) {
      return;
    }

    this.selectedLanguage = language;
  }

  openMainMenu(): void {
    this.transitionTo(ComplaintWizardState.RaiseComplaint);
  }

  beginRaiseComplaint(): void {
    this.description = '';
    this.imagePath = null;
    this.locationValue = null;
    this.transitionTo(ComplaintWizardState.UploadImage);
  }

  uploadImage(imagePath: string): void {
    this.imagePath = imagePath;
    this.transitionTo(ComplaintWizardState.AIAnalysis);
  }

  runAnalysis(): void {
    this.transitionTo(ComplaintWizardState.LocationCapture);
  }

  captureLocation(locationValue: string): void {
    this.locationValue = locationValue;
    this.transitionTo(ComplaintWizardState.Review);
  }

  reviewComplaint(): void {
    this.transitionTo(ComplaintWizardState.Submit);
  }

  submitComplaint(): void {
    const draft = this.buildComplaintDraft();

    if (!this.isOnline()) {
      this.queueOfflineComplaint(draft);
      this.transitionTo(ComplaintWizardState.Confirmation);
      return;
    }

    void this.submitComplaintToServer(draft);
  }

  confirmSubmission(): void {
    this.transitionTo(ComplaintWizardState.Idle);
  }

  get districtDetected(): string {
    return this.districtContext?.detectedDistrict || 'District not detected';
  }

  private buildComplaintDraft(): ComplaintDraft {
    return {
      id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: this.title || 'Untitled complaint',
      description: this.description || 'No description provided',
      department: this.department,
      priority: this.priority,
      voiceTranscription: this.voiceTranscription,
      aiIssue: this.aiIssue,
      severityScore: this.severityScore,
      severityReason: this.severityReason,
      location: this.locationValue,
      imagePath: this.imagePath,
      language: this.selectedLanguage,
      createdAt: new Date().toISOString()
    };
  }

  private queueOfflineComplaint(draft: ComplaintDraft): void {
    const queueEntry: OfflineComplaintQueueEntry = {
      ...draft,
      queueState: OfflineQueueState.ComplaintCreated,
      attempts: 0,
      lastError: null
    };

    if (!this.transitionQueueTo(queueEntry.queueState, OfflineQueueState.NoNetwork)) {
      return;
    }

    queueEntry.queueState = OfflineQueueState.NoNetwork;

    if (!this.transitionQueueTo(queueEntry.queueState, OfflineQueueState.StoreLocally)) {
      return;
    }

    queueEntry.queueState = OfflineQueueState.StoreLocally;
    this.offlineComplaintQueue = [queueEntry, ...this.offlineComplaintQueue];
    this.storageService.saveOfflineComplaintQueue(this.offlineComplaintQueue);
    this.errorMessage = 'No network. Complaint stored locally and will sync automatically.';
  }

  private async syncOfflineQueue(): Promise<void> {
    if (this.isSyncingQueue || !this.isOnline() || this.offlineComplaintQueue.length === 0) {
      return;
    }

    this.isSyncingQueue = true;

    try {
      const remainingQueue: OfflineComplaintQueueEntry[] = [];

      for (const entry of this.offlineComplaintQueue) {
        const autoSyncReady = this.transitionQueueTo(entry.queueState, OfflineQueueState.AutoSync);
        if (!autoSyncReady) {
          entry.lastError = `Invalid queue transition from ${entry.queueState} to ${OfflineQueueState.AutoSync}`;
          remainingQueue.push(entry);
          continue;
        }

        entry.queueState = OfflineQueueState.AutoSync;
        entry.attempts += 1;

        const serverSubmissionReady = this.transitionQueueTo(entry.queueState, OfflineQueueState.ServerSubmission);
        if (!serverSubmissionReady) {
          entry.lastError = `Invalid queue transition from ${entry.queueState} to ${OfflineQueueState.ServerSubmission}`;
          entry.queueState = OfflineQueueState.StoreLocally;
          remainingQueue.push(entry);
          continue;
        }

        entry.queueState = OfflineQueueState.ServerSubmission;

        try {
          const complaint = await this.submitComplaintToServer(entry);
          if (complaint) {
            this.errorMessage = '';
          }
        } catch (error: any) {
          entry.lastError = error?.message || 'Failed to sync complaint';
          entry.queueState = OfflineQueueState.StoreLocally;
          remainingQueue.push(entry);
        }
      }

      this.offlineComplaintQueue = remainingQueue;
      this.storageService.saveOfflineComplaintQueue(this.offlineComplaintQueue);
      this.currentQueueState = this.offlineComplaintQueue[0]?.queueState || null;
    } finally {
      this.isSyncingQueue = false;
    }
  }

  private async submitComplaintToServer(payload: ComplaintDraft): Promise<unknown> {
    const formData = this.buildComplaintFormData(payload);
    const complaint = await firstValueFrom(this.complaintsService.createComplaint(formData));

    this.transitionTo(ComplaintWizardState.Confirmation);
    this.currentQueueState = null;
    return complaint;
  }

  private buildComplaintFormData(payload: ComplaintDraft): FormData {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('department', payload.department);
    formData.append('priority', payload.priority);
    formData.append('voiceTranscription', payload.voiceTranscription || '');
    formData.append('aiIssue', payload.aiIssue || '');
    formData.append('language', payload.language);
    formData.append('clientDraftId', payload.id);
    formData.append('createdAt', payload.createdAt);

    if (payload.severityScore !== null) {
      formData.append('severityScore', String(payload.severityScore));
    }

    if (payload.severityReason.length > 0) {
      formData.append('severityReason', JSON.stringify(payload.severityReason));
    }

    if (payload.location) {
      formData.append('location', payload.location);
    }

    if (payload.imagePath) {
      formData.append('imagePath', payload.imagePath);
    }

    return formData;
  }

  private isOnline(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }
}
