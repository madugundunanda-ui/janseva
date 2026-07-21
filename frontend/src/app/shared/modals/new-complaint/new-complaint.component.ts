import { Component, OnInit, OnDestroy, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ComplaintsService } from '../../../core/services/complaints.service';
import { DepartmentsService } from '../../../core/services/departments.service';
import { AiService } from '../../../core/services/ai.service';
import { TranslationService } from '../../../core/services/translation.service';
import { ImageCompressionService } from '../../../core/services/image-compression.service';
import { normalizeDepartment } from '../../../core/utils/department-normalizer';
import { Department } from '../../../core/models/department.model';

@Component({
  selector: 'app-new-complaint-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div class="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto font-sans">
        
        <button (click)="closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg">
          ✕
        </button>

        <div class="flex justify-between items-center mb-1">
          <span class="text-xs font-semibold uppercase tracking-wider text-indigo-600">AI-Assisted Grievance Intake</span>
          <span class="badge-status badge-progress">Gemini 1.5 Auto-Triage</span>
        </div>

        <h2 class="text-xl font-bold text-slate-900 mb-6">File New Municipal Grievance</h2>

        <div class="space-y-4 mb-6">
          
          <!-- Image Upload Dropzone -->
          <div (click)="fileInput.click()" 
               class="p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/50 transition-all text-center flex flex-col items-center cursor-pointer">
            
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>

            <span class="text-xs font-semibold text-slate-700 mb-1">Click to Upload Evidence Image</span>
            <span class="text-[11px] text-slate-500">AI will automatically analyze issue, urgency, and target department</span>
            
            <input #fileInput type="file" (change)="onComplaintFileSelected($event)" (click)="$event.stopPropagation()" class="hidden">
          </div>

          <!-- Progressive AI Pipeline Steps -->
          @if (showAiStatusSteps) {
            <div class="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 space-y-2.5 text-xs text-slate-800">
              <div class="flex justify-between items-center font-semibold text-indigo-900 pb-2 border-b border-indigo-200/60">
                <span>AI Triaging Stream Status</span>
                <span>{{ aiProgress }}%</span>
              </div>

              <div class="space-y-1.5 text-xs">
                <div class="flex items-center justify-between">
                  <span>1. Image Upload & Pre-processing</span>
                  <span class="text-emerald-700 font-bold">✓ Done</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>2. Category & Department Detection</span>
                  <span [ngClass]="aiStepDetectingDone ? 'text-emerald-700 font-bold' : 'text-indigo-600 font-semibold animate-pulse'">
                    {{ aiStepDetectingDone ? '✓ Done' : (aiStepDetecting ? 'Running...' : 'Pending') }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span>3. Severity & SLA Duration Scoring</span>
                  <span [ngClass]="aiStepSeverityDone ? 'text-emerald-700 font-bold' : 'text-indigo-600 font-semibold'">
                    {{ aiStepSeverityDone ? '✓ Done' : (aiStepSeverity ? 'Running...' : 'Pending') }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span>4. Geo-Cluster & Duplicate Check</span>
                  <span [ngClass]="aiStepDuplicateDone ? 'text-emerald-700 font-bold' : 'text-indigo-600 font-semibold'">
                    {{ aiStepDuplicateDone ? '✓ Done' : (aiStepDuplicate ? 'Running...' : 'Pending') }}
                  </span>
                </div>
              </div>

              @if (aiTimeoutMessage) {
                <div class="text-amber-800 font-medium text-xs pt-1 border-t border-amber-200">
                  ⚠️ {{ aiTimeoutMessage }}
                </div>
              }
            </div>
          }

          <!-- GPS Coordinates Capture -->
          <div class="p-4 rounded-xl card-surface space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-700">GPS Geolocation Tag</span>
              <button (click)="captureLocation()" [disabled]="gpsCapturing" class="btn-secondary text-xs py-1 px-3">
                {{ gpsCapturing ? 'Capturing...' : 'Capture GPS' }}
              </button>
            </div>
            @if (gpsCaptured) {
              <div class="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded border border-slate-200 flex justify-between">
                <span>LAT: <strong class="text-slate-900">{{ capturedCoordinates.lat.toFixed(6) }}</strong></span>
                <span>LNG: <strong class="text-slate-900">{{ capturedCoordinates.lng.toFixed(6) }}</strong></span>
                @if (nearbyLandmark) {
                  <span class="text-indigo-600 font-bold">{{ nearbyLandmark }}</span>
                }
              </div>
            }
          </div>

          <!-- Form Fields -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700 block">Grievance Title</label>
            <input type="text" [(ngModel)]="newComplaintData.title" class="input-field" placeholder="Brief headline of the issue...">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700 block">Target Department</label>
              <select [(ngModel)]="newComplaintData.department" class="select-field text-xs">
                @for (d of departmentsList; track d.id) {
                  <option [value]="d.id">{{ d.name }}</option>
                }
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700 block">Location Address</label>
              <input type="text" [(ngModel)]="newComplaintData.address" class="input-field" placeholder="Street name / Ward no.">
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="text-xs font-semibold text-slate-700 block">Detailed Description</label>
              <button (click)="toggleVoiceInput()" class="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                <span>🎙️</span>
                <span>{{ voiceRecognizing ? 'Listening...' : 'Voice Dictate' }}</span>
              </button>
            </div>
            <textarea [(ngModel)]="newComplaintData.description" rows="3" class="input-field" placeholder="Provide additional details or context..."></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button (click)="closeModal()" class="btn-secondary text-xs">Cancel</button>
          <button (click)="submitComplaint()" [disabled]="loadingSubmit" class="btn-primary text-xs py-2 px-5 font-semibold">
            {{ loadingSubmit ? 'Submitting...' : 'Submit Grievance' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class NewComplaintModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  departmentsList: Department[] = [];
  loadingSubmit = false;
  gpsCapturing = false;
  gpsCaptured = false;
  voiceRecognizing = false;
  voiceLanguage = 'en-IN';
  nearbyLandmark = '';
  capturedCoordinates = { lat: 12.9716, lng: 77.5946 };
  tempImagePath = '';
  aiPredictedCategory = '';
  aiPredictedDepartment = '';

  showAiStatusSteps = false;
  aiProgress = 0;
  aiStepDetecting = false;
  aiStepDetectingDone = false;
  aiStepSeverity = false;
  aiStepSeverityDone = false;
  aiStepETA = false;
  aiStepETADone = false;
  aiStepDuplicate = false;
  aiStepDuplicateDone = false;
  aiTimeoutMessage = '';

  private aiStreamSub: any = null;
  private aiTimeoutTimer: any = null;

  newComplaintData = {
    title: '',
    description: '',
    department: '',
    address: 'Ward 12 Main Road',
    ward: '12',
    file: null as File | null,
    priority: 'medium',
    severityScore: 0,
    severityReason: [] as string[],
    confidence: 0,
    estimatedDays: 0,
    delayRisk: 'Low',
    duplicateDetected: false
  };

  public translationService = inject(TranslationService);
  private imageCompressionService = inject(ImageCompressionService);
  private apiService = inject(ApiService);
  private complaintsService = inject(ComplaintsService);
  private departmentsService = inject(DepartmentsService);
  public aiService = inject(AiService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.departmentsService.loadDepartments().subscribe(data => {
      this.departmentsList = data;
      if (data.length > 0) {
        this.newComplaintData.department = data[0].id;
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.aiStreamSub) {
      this.aiStreamSub.unsubscribe();
    }
    if (this.aiTimeoutTimer) {
      clearTimeout(this.aiTimeoutTimer);
    }
  }

  closeModal() {
    this.close.emit();
  }

  async onComplaintFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (this.aiStreamSub) this.aiStreamSub.unsubscribe();
      if (this.aiTimeoutTimer) clearTimeout(this.aiTimeoutTimer);

      this.showAiStatusSteps = true;
      this.aiProgress = 10;
      this.aiStepDetecting = true;
      this.aiStepDetectingDone = false;
      this.aiStepSeverity = false;
      this.aiStepSeverityDone = false;
      this.aiStepETA = false;
      this.aiStepETADone = false;
      this.aiStepDuplicate = false;
      this.aiStepDuplicateDone = false;
      this.aiTimeoutMessage = '';

      let fileToUpload = file;
      try {
        fileToUpload = await this.imageCompressionService.compress(file, 1024, 1024, 0.75);
      } catch (err) {
        console.error('Image compression failed:', err);
      }
      this.newComplaintData.file = fileToUpload;

      const formData = new FormData();
      formData.append('image', fileToUpload);
      formData.append('location', this.newComplaintData.address);

      this.apiService.postForm<any>('/ai/analyze', formData).subscribe({
        next: (res) => {
          const jobId = res?.jobId || res?.data?.jobId || res?.job?.id || res?.analysisId;
          if (jobId) {
            this.aiStreamSub = this.aiService.analyzeImageStream(jobId).subscribe({
              next: (event: any) => {
                this.aiProgress = event.progress || this.aiProgress;
                if (event.status === 'completed') {
                  this.aiStepDetectingDone = true;
                  this.aiStepSeverityDone = true;
                  this.aiStepDuplicateDone = true;
                  this.newComplaintData.title = event.title || this.newComplaintData.title;
                  this.newComplaintData.description = event.description || this.newComplaintData.description;
                  this.cdr.detectChanges();
                }
              }
            });
          }
        },
        error: () => {
          this.aiTimeoutMessage = 'AI processing unavailable. Proceeding with manual input.';
        }
      });
    }
  }

  submitComplaint() {
    this.loadingSubmit = true;

    if (typeof window !== 'undefined' && !navigator.onLine) {
      this.saveOfflineDraft();
      return;
    }

    const formData = new FormData();
    formData.append('title', this.newComplaintData.title);
    formData.append('description', this.newComplaintData.description);
    formData.append('department', this.newComplaintData.department);
    formData.append('priority', this.newComplaintData.priority);

    const locationObj = {
      address: this.newComplaintData.address,
      ward: this.newComplaintData.ward,
      latitude: this.capturedCoordinates.lat,
      longitude: this.capturedCoordinates.lng
    };
    formData.append('location', JSON.stringify(locationObj));

    if (this.newComplaintData.file) {
      formData.append('image', this.newComplaintData.file);
    }

    this.complaintsService.createComplaint(formData).subscribe({
      next: () => {
        this.loadingSubmit = false;
        this.success.emit();
      },
      error: () => {
        this.loadingSubmit = false;
      }
    });
  }

  captureLocation() {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    this.gpsCapturing = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.capturedCoordinates.lat = pos.coords.latitude;
        this.capturedCoordinates.lng = pos.coords.longitude;
        this.gpsCaptured = true;
        this.gpsCapturing = false;
        this.nearbyLandmark = 'Captured Ward Center (120m)';
      },
      () => {
        this.gpsCapturing = false;
        this.gpsCaptured = true;
      }
    );
  }

  toggleVoiceInput() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (this.voiceRecognizing) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = this.voiceLanguage;

    this.voiceRecognizing = true;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.newComplaintData.description = (this.newComplaintData.description + ' ' + transcript).trim();
    };
    recognition.onend = () => {
      this.voiceRecognizing = false;
    };
    recognition.start();
  }

  saveOfflineDraft() {
    const draft = {
      title: this.newComplaintData.title,
      description: this.newComplaintData.description,
      department: this.newComplaintData.department,
      address: this.newComplaintData.address,
      ward: this.newComplaintData.ward,
      lat: this.capturedCoordinates.lat,
      lng: this.capturedCoordinates.lng,
      createdAt: new Date().toISOString()
    };

    const draftsStr = localStorage.getItem('offline_complaints') || '[]';
    const drafts = JSON.parse(draftsStr);
    drafts.push(draft);
    localStorage.setItem('offline_complaints', JSON.stringify(drafts));

    this.loadingSubmit = false;
    this.closeModal();
    alert('Node Offline. Saved locally as offline draft.');
  }
}
