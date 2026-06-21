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
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div data-lenis-prevent class="w-full max-w-2xl glass-panel glow-card rounded-2xl p-8 relative max-h-[90vh] overflow-y-auto bg-black border border-white/10">
        <button (click)="closeModal()" class="absolute top-4 right-4 text-muted-var hover:text-primary-var font-mono text-xs uppercase cursor-pointer">
          [CLOSE ESC]
        </button>

        <div class="flex justify-between items-center mb-2">
          <div class="inline-flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
            <span class="font-mono text-[9px] tracking-widest text-cyan-400 uppercase">{{ translationService.t('AI_ASSISTED_CIVIC_INTAKE') }}</span>
          </div>
          <span [ngClass]="aiService.classificationStatus() === 'VERIFIED' ? 'badge-green' : 'badge-amber'">
            AI CORE NETWORK: {{ aiService.classificationStatus() === 'VERIFIED' ? 'ONLINE' : 'PROCESSING' }}
          </span>
        </div>
        <h3 class="text-xl font-bold uppercase tracking-tight text-primary-var mb-6 font-mono text-white">{{ translationService.t('REGISTER_NEW_GRIEVANCE') }}</h3>

        <!-- Form elements -->
        <div class="space-y-4 mb-6">
          <!-- Image upload with AI analysis status -->
          <div (click)="fileInput.click()" class="p-5 rounded-xl border border-dashed border-white/10 bg-white/2 hover:bg-white/5 transition-colors duration-200 text-center relative flex flex-col items-center cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-muted-var mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            
            <input #fileInput type="file" (change)="onComplaintFileSelected($event)" (click)="$event.stopPropagation()" class="font-mono text-[10px] text-muted-var mb-2">
            <span class="text-[9px] font-mono text-muted-var uppercase text-gray-400">{{ translationService.t('AUTO_FILL_INFO') }}</span>
          </div>

          <!-- Progressive AI Analysis Steps -->
          @if (showAiStatusSteps) {
            <div class="p-5 rounded-xl border border-cyan-500/25 bg-cyan-950/10 space-y-3 font-mono text-[10px] uppercase text-left text-gray-300">
              <div class="flex justify-between items-center border-b border-white/5 pb-2">
                <span class="font-bold text-cyan-400">{{ translationService.t('AI_PIPELINE_STATUS') }}</span>
                <span class="text-[9px] text-cyan-400 font-bold">{{ aiProgress }}%</span>
              </div>
              
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span>✓ {{ translationService.t('AI_STEP_1_TITLE') }} ({{ translationService.t('IMAGE_UPLOADED_SUCCESS') }})</span>
                  <span class="text-cyan-400 font-bold">{{ translationService.t('DONE') }}</span>
                </div>
                
                <div class="flex items-center justify-between">
                  <span>{{ aiStepDetecting ? '● ' + translationService.t('AI_STEP_2_RUNNING') : (aiStepDetectingDone ? '✓ ' + translationService.t('AI_STEP_2_DONE') : '○ ' + translationService.t('AI_STEP_2_PENDING')) }}</span>
                  <span [ngClass]="{'text-yellow-400 animate-pulse font-bold': aiStepDetecting, 'text-cyan-400 font-bold': aiStepDetectingDone, 'text-muted-var': !aiStepDetecting && !aiStepDetectingDone}">
                    {{ aiStepDetecting ? translationService.t('RUNNING') : (aiStepDetectingDone ? translationService.t('DONE') : translationService.t('PENDING')) }}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <span>{{ aiStepSeverity ? '● ' + translationService.t('AI_STEP_3_RUNNING') : (aiStepSeverityDone ? '✓ ' + translationService.t('AI_STEP_3_DONE') : '○ ' + translationService.t('AI_STEP_3_PENDING')) }}</span>
                  <span [ngClass]="{'text-yellow-400 animate-pulse font-bold': aiStepSeverity, 'text-cyan-400 font-bold': aiStepSeverityDone, 'text-muted-var': !aiStepSeverity && !aiStepSeverityDone}">
                    {{ aiStepSeverity ? translationService.t('RUNNING') : (aiStepSeverityDone ? translationService.t('DONE') : translationService.t('PENDING')) }}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <span>{{ aiStepETA ? '● ' + translationService.t('AI_STEP_4_RUNNING') : (aiStepETADone ? '✓ ' + translationService.t('AI_STEP_4_DONE') : '○ ' + translationService.t('AI_STEP_4_PENDING')) }}</span>
                  <span [ngClass]="{'text-yellow-400 animate-pulse font-bold': aiStepETA, 'text-cyan-400 font-bold': aiStepETADone, 'text-muted-var': !aiStepETA && !aiStepETADone}">
                    {{ aiStepETA ? translationService.t('RUNNING') : (aiStepETADone ? translationService.t('DONE') : translationService.t('PENDING')) }}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <span>{{ aiStepDuplicate ? '● ' + translationService.t('AI_STEP_5_RUNNING') : (aiStepDuplicateDone ? '✓ ' + translationService.t('AI_STEP_5_DONE') : '○ ' + translationService.t('AI_STEP_5_PENDING')) }}</span>
                  <span [ngClass]="{'text-yellow-400 animate-pulse font-bold': aiStepDuplicate, 'text-cyan-400 font-bold': aiStepDuplicateDone, 'text-muted-var': !aiStepDuplicate && !aiStepDuplicateDone}">
                    {{ aiStepDuplicate ? translationService.t('RUNNING') : (aiStepDuplicateDone ? translationService.t('DONE') : translationService.t('PENDING')) }}
                  </span>
                </div>
              </div>

              @if (aiTimeoutMessage) {
                <div class="text-amber-400 font-bold border-t border-white/5 pt-2 flex items-center gap-1.5 animate-pulse">
                  ⚠️ {{ aiTimeoutMessage }}
                </div>
              }
            </div>
          }

          <!-- GPS Capture & Geofencing Proximity Landmark panel -->
          <div class="p-4 rounded-xl border border-white/10 bg-white/2 space-y-3 font-mono text-[10px] uppercase text-gray-300">
            <div class="flex justify-between items-center">
              <span>{{ translationService.t('GPS_LOCATION') }}</span>
              <button (click)="captureLocation()" [disabled]="gpsCapturing" class="px-3 py-1.5 rounded bg-[#06b6d4] text-black font-bold hover:bg-[#0891b2] transition-colors cursor-pointer">
                @if (gpsCapturing) { {{ translationService.t('CAPTURING') }} } @else { {{ translationService.t('CAPTURE_GPS') }} }
              </button>
            </div>

            @if (gpsCaptured) {
              <div class="space-y-1.5 text-primary-var bg-white/2 p-2.5 rounded border border-white/10">
                <div>LATITUDE: <span class="text-cyan-400 font-bold">{{ capturedCoordinates.lat.toFixed(6) }}</span></div>
                <div>LONGITUDE: <span class="text-cyan-400 font-bold">{{ capturedCoordinates.lng.toFixed(6) }}</span></div>
                @if (nearbyLandmark) {
                  <div class="text-[#6AA9FF] font-bold">LANDMARK: {{ nearbyLandmark }}</div>
                }
              </div>
            }
          </div>

          <!-- Voice Transcription panel -->
          <div class="p-4 rounded-xl border border-white/10 bg-white/2 space-y-3 font-mono text-[10px] uppercase text-gray-300">
            <div class="flex justify-between items-center gap-3">
              <span>{{ translationService.t('VOICE_INPUT') }}</span>
              
              <div class="flex items-center gap-2">
                <select [(ngModel)]="voiceLanguage" class="glass-input !py-1 !px-2 font-mono text-[9px] uppercase bg-black text-white border border-white/10">
                  <option value="en-IN">EN (IN)</option>
                  <option value="te-IN">TE (Telugu)</option>
                  <option value="ta-IN">TA (Tamil)</option>
                  <option value="kn-IN">KN (Kannada)</option>
                </select>

                <button (click)="toggleVoiceInput()" class="p-2 rounded-full border bg-red-950/20 border-red-500/30 text-red-400 hover:bg-red-900/30 transition-colors cursor-pointer" [class.animate-pulse]="voiceRecognizing">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
            </div>
            @if (voiceRecognizing) {
              <div class="text-red-400 font-bold animate-pulse text-[9px]">{{ translationService.t('SPEAK_NOW') }}</div>
            }
          </div>

          <!-- AI Confidence & Explainability Panel -->
          @if (showAiStatusSteps && aiStepDuplicateDone && newComplaintData.confidence > 0) {
            <div class="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/5 space-y-2.5 font-mono text-[10px] uppercase text-left text-gray-300">
              <div class="flex justify-between items-center">
                <span>AI CONFIDENCE LEVEL:</span>
                <span class="font-bold" [ngClass]="{
                  'text-emerald-400': newComplaintData.confidence >= 70,
                  'text-red-400 animate-pulse': newComplaintData.confidence < 70
                }">
                  {{ newComplaintData.confidence }}% ({{ newComplaintData.confidence >= 85 ? 'High Confidence' : (newComplaintData.confidence >= 70 ? 'Medium Confidence' : 'Low Confidence') }})
                </span>
              </div>
              
              @if (newComplaintData.confidence < 70) {
                <div class="p-2 bg-red-950/20 border border-red-500/30 text-red-400 font-bold rounded animate-pulse">
                  ⚠️ Please review department selection manually.
                </div>
              }

              @if (newComplaintData.severityReason && newComplaintData.severityReason.length > 0) {
                <div class="pt-2 border-t border-white/5 space-y-1">
                  <span class="text-muted-var block">AI EXPLAINABILITY REASONS:</span>
                  @for (reason of newComplaintData.severityReason; track reason) {
                    <div class="text-[9px] text-[#6AA9FF]">• {{ reason }}</div>
                  }
                </div>
              }
            </div>
          }

          <!-- Title & description -->
          <div class="flex flex-col text-gray-300">
            <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('GRIEVANCE_TITLE') }}</label>
            <input type="text" [(ngModel)]="newComplaintData.title" [disabled]="showAiStatusSteps && !aiStepDuplicateDone && !aiTimeoutMessage" class="glass-input bg-black/40 border border-white/10 px-3 py-2 rounded text-white" [placeholder]="translationService.t('DETECTED_TITLE_AUTOFILL')">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-300">
            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('TARGET_DEPARTMENT') }}</label>
              <select [(ngModel)]="newComplaintData.department" [disabled]="showAiStatusSteps && !aiStepDuplicateDone && !aiTimeoutMessage" class="glass-input font-mono text-[10px] bg-black/40 border border-white/10 px-3 py-2 rounded text-white">
                @for (d of departmentsList; track d.id) {
                  <option [value]="d.id">{{ d.name }}</option>
                }
              </select>
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('LOCATION_ADDRESS') }}</label>
              <input type="text" [(ngModel)]="newComplaintData.address" [disabled]="showAiStatusSteps && !aiStepDuplicateDone && !aiTimeoutMessage" class="glass-input bg-black/40 border border-white/10 px-3 py-2 rounded text-white" [placeholder]="translationService.t('PH_WARD_12')">
            </div>
          </div>

          <div class="flex flex-col text-gray-300">
            <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('DETAILED_NARRATIVE') }}</label>
            <textarea [(ngModel)]="newComplaintData.description" [disabled]="showAiStatusSteps && !aiStepDuplicateDone && !aiTimeoutMessage" rows="3" class="glass-input bg-black/40 border border-white/10 px-3 py-2 rounded text-white" [placeholder]="translationService.t('DETAIL_THE_ISSUE')"></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-4">
          <button (click)="closeModal()" class="px-5 py-2.5 rounded border border-white/10 hover:bg-white/5 text-primary-var font-mono text-[10px] uppercase text-white cursor-pointer">
            {{ translationService.t('CANCEL') }}
          </button>
          <button (click)="submitComplaint()" [disabled]="loadingSubmit || (showAiStatusSteps && !aiStepDuplicateDone && !aiTimeoutMessage)" class="px-6 py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-[10px] uppercase shadow-[0_0_20px_rgba(6,182,212,0.25)] cursor-pointer">
            {{ translationService.t('INITIALIZE_TICKET_DISPATCH') }}
          </button>
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

  // Progressive AI states
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
  aiHealthStatus = 'Offline';

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

    this.checkHealth();
  }

  ngOnDestroy(): void {
    if (this.aiStreamSub) {
      this.aiStreamSub.unsubscribe();
    }
    if (this.aiTimeoutTimer) {
      clearTimeout(this.aiTimeoutTimer);
    }
  }

  checkHealth() {
    this.aiHealthStatus = 'Checking...';
    this.aiService.getAiHealthStatus().subscribe({
      next: (health: any) => {
        this.aiHealthStatus = health.status || 'Online';
      },
      error: () => {
        this.aiHealthStatus = 'Offline';
      }
    });
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

      this.aiTimeoutTimer = setTimeout(() => {
        if (!this.aiStepDuplicateDone) {
          this.aiTimeoutMessage = this.translationService.t('AI_TIMEOUT_WARN');
          this.aiStepDetecting = false;
          this.aiStepSeverity = false;
          this.aiStepETA = false;
          this.aiStepDuplicate = false;
          if (this.aiStreamSub) this.aiStreamSub.unsubscribe();
          this.cdr.detectChanges();
        }
      }, 15000);

      let fileToUpload = file;
      try {
        fileToUpload = await this.imageCompressionService.compress(file, 1024, 1024, 0.75);
      } catch (err) {
        console.error('Image compression failed, using original file:', err);
      }
      this.newComplaintData.file = fileToUpload;

      const formData = new FormData();
      formData.append('image', fileToUpload);
      formData.append('location', this.newComplaintData.address);
      formData.append('lat', String(this.capturedCoordinates.lat));
      formData.append('lng', String(this.capturedCoordinates.lng));

      this.apiService.postForm<any>('/ai/analyze', formData).subscribe({
        next: (res) => {
          try {
            const jobId = res?.jobId || res?.data?.jobId || res?.job?.id || res?.analysisId;
            if (!jobId) {
              throw new Error('AI job ID missing from response');
            }

            this.tempImagePath = res.tempImagePath;
            if (this.aiProgress < 20) this.aiProgress = 20;

            this.aiStreamSub = this.aiService.analyzeImageStream(jobId).subscribe({
              next: (event: any) => {
                this.aiProgress = event.progress || this.aiProgress;
                
                if (event.status === 'upload_complete') {
                  this.aiStepDetecting = true;
                  this.aiStepDetectingDone = false;
                  this.aiStepSeverity = false;
                  this.aiStepSeverityDone = false;
                  this.aiStepETA = false;
                  this.aiStepETADone = false;
                  this.aiStepDuplicate = false;
                  this.aiStepDuplicateDone = false;
                  this.aiProgress = 10;
                }
                
                if (event.status === 'detecting_issue') {
                  setTimeout(() => {
                    this.aiStepDetecting = false;
                    this.aiStepDetectingDone = true;
                    this.aiStepSeverity = true;
                    
                    this.aiPredictedCategory = event.category || '';
                    this.aiPredictedDepartment = event.department || '';
                    this.newComplaintData.confidence = event.confidence || 0;

                    if (event.low_confidence) {
                      this.newComplaintData.title = '';
                      this.newComplaintData.description = 'Unable to confidently identify issue type. Please select the category and fill details manually.';
                      this.newComplaintData.department = '';
                      this.aiPredictedCategory = '';
                      this.aiPredictedDepartment = '';
                    } else {
                      this.newComplaintData.title = event.title || this.newComplaintData.title;
                      this.newComplaintData.description = event.description || this.newComplaintData.description;
                      
                      const normalizedDept = normalizeDepartment(event.department || '');
                      const matchedDept = this.departmentsList.find(d => d.name.toLowerCase() === normalizedDept.toLowerCase());
                      if (matchedDept) {
                        this.newComplaintData.department = matchedDept.id;
                      }
                    }
                    this.cdr.detectChanges();
                  }, 0);
                }
                
                if (event.status === 'estimating_severity') {
                  setTimeout(() => {
                    this.aiStepSeverity = false;
                    this.aiStepSeverityDone = true;
                    this.aiStepETA = true;
                    
                    this.newComplaintData.priority = event.priority || 'medium';
                    this.newComplaintData.severityScore = event.severityScore || 50;
                    this.newComplaintData.severityReason = event.reasons || [];
                    this.cdr.detectChanges();
                  }, 0);
                }

                if (event.status === 'generating_recommendations') {
                  setTimeout(() => {
                    this.aiStepETA = false;
                    this.aiStepETADone = true;
                    this.aiStepDuplicate = true;

                    this.newComplaintData.estimatedDays = event.estimatedDays || 3;
                    this.newComplaintData.delayRisk = event.delayRisk || 'Low';
                    this.cdr.detectChanges();
                  }, 0);
                }

                if (event.status === 'duplicate_checked') {
                  setTimeout(() => {
                    this.aiStepDuplicate = false;
                    this.aiStepDuplicateDone = true;
                    this.newComplaintData.duplicateDetected = !!event.duplicateDetected;
                    this.cdr.detectChanges();
                  }, 0);
                }

                if (event.status === 'completed') {
                  if (this.aiTimeoutTimer) clearTimeout(this.aiTimeoutTimer);
                  setTimeout(() => {
                    this.aiStepDetecting = false;
                    this.aiStepDetectingDone = true;
                    this.aiStepSeverity = false;
                    this.aiStepSeverityDone = true;
                    this.aiStepETA = false;
                    this.aiStepETADone = true;
                    this.aiStepDuplicate = false;
                    this.aiStepDuplicateDone = true;
                  
                    if (event.low_confidence) {
                      this.newComplaintData.title = '';
                      this.newComplaintData.description = 'Unable to confidently identify issue type. Please select the category and fill details manually.';
                      this.newComplaintData.department = '';
                      this.aiPredictedCategory = '';
                      this.aiPredictedDepartment = '';
                      this.newComplaintData.confidence = event.confidence || 0;
                    } else {
                      this.newComplaintData.title = event.title || this.newComplaintData.title;
                      this.newComplaintData.description = event.description || this.newComplaintData.description;
                      const normalizedDept = normalizeDepartment(event.department || '');
                      const matchedDept = this.departmentsList.find(d => d.name.toLowerCase() === normalizedDept.toLowerCase());
                      if (matchedDept) {
                        this.newComplaintData.department = matchedDept.id;
                      }
                      this.newComplaintData.priority = event.priority || this.newComplaintData.priority;
                      this.newComplaintData.severityScore = event.severityScore || this.newComplaintData.severityScore;
                      this.newComplaintData.severityReason = event.reasons || this.newComplaintData.severityReason;
                      this.newComplaintData.confidence = event.confidence || 0;
                      this.aiPredictedCategory = event.category || '';
                      this.aiPredictedDepartment = event.department || '';
                    }

                    this.aiService.pipelineProgress.set(100);
                    this.aiService.classificationStatus.set('DONE');
                    this.cdr.detectChanges();
                  }, 0);
                }
              },
              error: (err: any) => {
                console.error('AI streaming connection failed:', err);
                if (this.aiTimeoutTimer) clearTimeout(this.aiTimeoutTimer);
                this.aiStepDetecting = false;
                this.aiStepSeverity = false;
                this.aiStepETA = false;
                this.aiStepDuplicate = false;
                this.aiTimeoutMessage = 'AI processing unavailable. Please continue manually.';
              }
            });
          } catch (err) {
            console.error('Failed to map AI job response:', err);
            if (this.aiTimeoutTimer) clearTimeout(this.aiTimeoutTimer);
            this.aiStepDetecting = false;
            this.aiStepSeverity = false;
            this.aiStepETA = false;
            this.aiStepDuplicate = false;
            this.aiTimeoutMessage = 'AI processing unavailable. Please continue manually.';
          }
        },
        error: (err) => {
          console.error('Failed to initialize AI analysis job:', err);
          if (this.aiTimeoutTimer) clearTimeout(this.aiTimeoutTimer);
          this.aiTimeoutMessage = 'AI processing unavailable. Please continue manually.';
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

    const selectedDeptObj = this.departmentsList.find(d => d.id === this.newComplaintData.department);
    const selectedDeptName = selectedDeptObj ? selectedDeptObj.name : '';

    if (this.aiPredictedCategory && this.aiPredictedDepartment && selectedDeptName &&
        selectedDeptName.toLowerCase() !== normalizeDepartment(this.aiPredictedDepartment).toLowerCase()) {
      const feedbackPayload = {
        originalPrediction: this.aiPredictedCategory,
        correctedCategory: selectedDeptName,
        imagePath: this.tempImagePath
      };

      this.apiService.post('/ai/feedback', feedbackPayload).subscribe({
        next: (fbRes) => console.log('AI feedback loop: correction successfully logged', fbRes),
        error: (fbErr) => console.error('AI feedback loop: failed to log correction', fbErr)
      });
    }

    const formData = new FormData();
    formData.append('title', this.newComplaintData.title);
    formData.append('description', this.newComplaintData.description);
    formData.append('department', this.newComplaintData.department);
    formData.append('priority', this.newComplaintData.priority);
    formData.append('severityScore', String(this.newComplaintData.severityScore));
    formData.append('severityReason', JSON.stringify(this.newComplaintData.severityReason));
    formData.append('aiIssue', this.newComplaintData.title);
    
    const locationObj = {
      address: this.newComplaintData.address,
      ward: this.newComplaintData.ward,
      latitude: this.capturedCoordinates.lat,
      longitude: this.capturedCoordinates.lng,
      landmark: this.nearbyLandmark
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
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    this.gpsCapturing = true;

    const cachedLat = localStorage.getItem('cached_lat');
    const cachedLng = localStorage.getItem('cached_lng');
    const cachedLandmark = localStorage.getItem('cached_landmark');
    if (cachedLat && cachedLng) {
      this.capturedCoordinates.lat = parseFloat(cachedLat);
      this.capturedCoordinates.lng = parseFloat(cachedLng);
      this.gpsCaptured = true;
      if (cachedLandmark) {
        this.nearbyLandmark = cachedLandmark;
      }
    }

    const cacheCoords = (lat: number, lng: number, landmark: string) => {
      localStorage.setItem('cached_lat', String(lat));
      localStorage.setItem('cached_lng', String(lng));
      localStorage.setItem('cached_landmark', landmark);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.capturedCoordinates.lat = pos.coords.latitude;
        this.capturedCoordinates.lng = pos.coords.longitude;
        this.gpsCaptured = true;
        this.gpsCapturing = false;
        this.nearbyLandmark = this.detectNearbyLandmark(pos.coords.latitude, pos.coords.longitude);
        cacheCoords(pos.coords.latitude, pos.coords.longitude, this.nearbyLandmark);

        this.refineLocationBackground((lat, lng, landmark) => { cacheCoords(lat, lng, landmark); });
      },
      (err) => {
        this.refineLocationBackground(
          (lat, lng, landmark) => {
            this.capturedCoordinates.lat = lat;
            this.capturedCoordinates.lng = lng;
            this.gpsCaptured = true;
            this.nearbyLandmark = landmark;
            cacheCoords(lat, lng, landmark);
          },
          () => {
            this.gpsCapturing = false;
            if (!this.gpsCaptured) {
              alert('Failed to obtain GPS coordinates. Using standard municipal grid coordinates.');
            }
          }
        );
      },
      { timeout: 2000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  }

  refineLocationBackground(onSuccess: (lat: number, lng: number, landmark: string) => void, onError?: () => void) {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const landmark = this.detectNearbyLandmark(pos.coords.latitude, pos.coords.longitude);
        onSuccess(pos.coords.latitude, pos.coords.longitude, landmark);
        this.gpsCapturing = false;
      },
      (err) => {
        if (onError) onError();
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }

  detectNearbyLandmark(lat: number, lng: number): string {
    const val = Math.abs(lat + lng) % 1;
    if (val < 0.25) return 'Municipal Public School (140m)';
    if (val < 0.5) return 'District Civil Hospital (320m)';
    if (val < 0.75) return 'Central Bus Stand & Metro (250m)';
    return 'Vikas Market Complex (180m)';
  }

  toggleVoiceInput() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser.');
      return;
    }

    if (this.voiceRecognizing) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = this.voiceLanguage;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    this.voiceRecognizing = true;

    recognition.onstart = () => {
      console.log('Voice transcription active...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (this.newComplaintData.description) {
        this.newComplaintData.description += ' ' + transcript;
      } else {
        this.newComplaintData.description = transcript;
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error: ', event.error);
      this.voiceRecognizing = false;
    };

    recognition.onend = () => {
      this.voiceRecognizing = false;
      console.log('Voice transcription ended.');
    };

    recognition.start();
  }

  async saveOfflineDraft() {
    let fileBase64 = '';
    if (this.newComplaintData.file) {
      try {
        fileBase64 = await this.fileToBase64(this.newComplaintData.file);
      } catch (e) {
        console.error('Failed to convert file to base64', e);
      }
    }

    const draft = {
      title: this.newComplaintData.title,
      description: this.newComplaintData.description,
      department: this.newComplaintData.department,
      address: this.newComplaintData.address,
      ward: this.newComplaintData.ward,
      lat: this.capturedCoordinates.lat,
      lng: this.capturedCoordinates.lng,
      landmark: this.nearbyLandmark,
      fileBase64,
      fileName: this.newComplaintData.file ? this.newComplaintData.file.name : 'offline_image.jpg',
      createdAt: new Date().toISOString()
    };

    const draftsStr = localStorage.getItem('offline_complaints') || '[]';
    const drafts = JSON.parse(draftsStr);
    drafts.push(draft);
    localStorage.setItem('offline_complaints', JSON.stringify(drafts));

    this.loadingSubmit = false;
    this.closeModal();
    alert('Node Offline. Grievance saved locally as draft. It will automatically upload once network is restored.');
  }

  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}
