/**
 * Floating Assistant Component
 * Main persistent floating assistant visible on every citizen page
 * Location: Bottom-right corner
 */

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { VoiceService } from '../../services/voice.service';
import { TranslationService } from '../../services/translation.service';
import { StateManagementService } from '../../services/state-management.service';
import { LocalStorageService } from '../../services/local-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  standalone: false,
  selector: 'app-floating-assistant',
  standalone: false,
  template: `
    <div class="floating-assistant" [ngClass]="{ expanded: isExpanded }">
      <!-- Floating Button -->
      <div class="floating-button" *ngIf="!isExpanded" (click)="toggleAssistant()">
        <mat-icon>support_agent</mat-icon>
        <span class="badge" *ngIf="unreadMessages > 0">{{ unreadMessages }}</span>
      </div>

      <!-- Chat Panel -->
      <div class="chat-panel" *ngIf="isExpanded">
        <!-- Header -->
        <div class="panel-header">
          <h3>{{ 'JANSEVA_ASSISTANT' | translate }}</h3>
          <div class="header-actions">
            <button mat-icon-button (click)="showSettings()">
              <mat-icon>settings</mat-icon>
            </button>
            <button mat-icon-button (click)="toggleAssistant()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="messages-container" #messagesContainer>
          <div class="message" *ngFor="let message of conversationHistory"
               [ngClass]="{ 'user': message.type === 'user', 'assistant': message.type === 'assistant' }">
            <span [ngClass]="{ 'voice': message.inputType === 'voice' }">
              {{ message.content }}
            </span>
            <small class="timestamp">{{ message.timestamp | date: 'short' }}</small>
          </div>
          <div class="typing-indicator" *ngIf="isProcessing">
            <span></span><span></span><span></span>
          </div>
        </div>

        <!-- Input Area -->
        <div class="input-area">
          <!-- Text Input -->
          <form [formGroup]="inputForm" (ngSubmit)="sendMessage()">
            <mat-form-field appearance="fill" class="full-width">
              <input matInput placeholder="{{ 'TYPE_OR_SPEAK' | translate }}"
                     formControlName="message"
                     (keyup.enter)="sendMessage()">
              <button mat-icon-button matSuffix (click)="sendMessage()">
                <mat-icon>send</mat-icon>
              </button>
            </mat-form-field>
          </form>

          <!-- Voice Input Button -->
          <button mat-fab color="primary" (click)="toggleVoiceInput()" 
                  [disabled]="!voiceSupported.recording"
                  class="voice-button"
                  [ngClass]="{ 'recording': isRecording }">
            <mat-icon>{{ isRecording ? 'stop' : 'mic' }}</mat-icon>
          </button>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions" *ngIf="!currentIntent">
          <button *ngFor="let action of quickActions" mat-raised-button
                  (click)="handleQuickAction(action)">
            <mat-icon>{{ action.icon }}</mat-icon>
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .floating-assistant {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      font-family: 'Roboto', sans-serif;
    }

    .floating-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    }

    .floating-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }

    .floating-button mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ff6b6b;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }

    .chat-panel {
      width: 400px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .panel-header {
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .header-actions button {
      color: white;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .message {
      display: flex;
      flex-direction: column;
      gap: 4px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .message.user {
      align-items: flex-end;
    }

    .message.user span {
      background: #667eea;
      color: white;
      padding: 8px 12px;
      border-radius: 12px;
      max-width: 80%;
      word-wrap: break-word;
    }

    .message.assistant span {
      background: #f0f0f0;
      color: #333;
      padding: 8px 12px;
      border-radius: 12px;
      max-width: 80%;
      word-wrap: break-word;
    }

    .message.assistant span.voice {
      background: #e8f5e9;
    }

    .timestamp {
      color: #999;
      font-size: 12px;
      padding: 0 12px;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 8px 12px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #999;
      border-radius: 50%;
      animation: bounce 1.4s infinite;
    }

    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
      40% { transform: translateY(-10px); opacity: 1; }
    }

    .input-area {
      padding: 12px;
      border-top: 1px solid #eee;
      display: flex;
      gap: 8px;
    }

    .full-width {
      flex: 1;
    }

    .voice-button {
      transition: all 0.3s ease;
    }

    .voice-button.recording {
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
      100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
    }

    .quick-actions {
      padding: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      border-top: 1px solid #eee;
    }

    .quick-actions button {
      flex: 1;
      min-width: 100px;
      font-size: 12px;
    }

    @media (max-width: 768px) {
      .chat-panel {
        width: 100vw;
        height: 100vh;
        border-radius: 0;
        max-width: 100%;
      }

      .message.user span,
      .message.assistant span {
        max-width: 100%;
      }
    }
  `]
})
export class FloatingAssistantComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isExpanded = false;
  isRecording = false;
  isProcessing = false;
  unreadMessages = 0;
  currentIntent: string | null = null;

  conversationHistory: any[] = [];
  inputForm: FormGroup;
  voiceSupported = { recording: true, playback: true, recognition: true };

  quickActions = [
    { label: 'RAISE_COMPLAINT', icon: 'report', intent: 'RAISE_COMPLAINT' },
    { label: 'TRACK_COMPLAINT', icon: 'track_changes', intent: 'TRACK_COMPLAINT' },
    { label: 'GOVERNMENT_UPDATES', icon: 'notifications', intent: 'GOVERNMENT_UPDATES' },
    { label: 'EMERGENCY_HELP', icon: 'emergency', intent: 'EMERGENCY_HELP' }
  ];

  private destroy$ = new Subject<void>();
  private sessionId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private aiAssistantService: AiAssistantService,
    private voiceService: VoiceService,
    private translationService: TranslationService,
    private stateService: StateManagementService,
    private storageService: LocalStorageService,
    private snackBar: MatSnackBar
  ) {
    this.inputForm = this.fb.group({
      message: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.checkVoiceSupport();
    this.loadUserPreferences();
    this.subscribeToState();
    this.initializeSession();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize voice session
   */
  private initializeSession(): void {
    const language = this.translationService.getCurrentLanguage();
    const userId = this.stateService.getState().userId;

    this.aiAssistantService.initializeSession(language, userId || undefined).pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      session => {
        this.sessionId = session.sessionId;
        this.stateService.setSession(session.sessionId, userId || null);
      },
      error => {
        console.error('Failed to initialize session:', error);
        this.showError('Failed to initialize assistant');
      }
    );
  }

  /**
   * Toggle assistant expansion
   */
  toggleAssistant(): void {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      setTimeout(() => this.scrollToBottom(), 300);
    }
  }

  /**
   * Toggle voice input
   */
  async toggleVoiceInput(): Promise<void> {
    if (!this.isRecording) {
      this.startVoiceRecording();
    } else {
      this.stopVoiceRecording();
    }
  }

  /**
   * Start voice recording
   */
  private async startVoiceRecording(): Promise<void> {
    try {
      this.isRecording = true;
      this.stateService.setListening(true);
      const audioBlob = await this.voiceService.startRecording();
      // Recording continues until stopped
    } catch (error) {
      console.error('Recording error:', error);
      this.showError('Unable to access microphone');
      this.isRecording = false;
      this.stateService.setListening(false);
    }
  }

  /**
   * Stop voice recording
   */
  private async stopVoiceRecording(): Promise<void> {
    try {
      const audioBlob = await this.voiceService.stopRecording();
      this.isRecording = false;
      this.stateService.setListening(false);

      // Send to server
      if (this.sessionId) {
        this.isProcessing = true;
        const language = this.translationService.getCurrentLanguage();

        this.aiAssistantService.processVoiceInput(this.sessionId, audioBlob, language).pipe(
          takeUntil(this.destroy$)
        ).subscribe(
          result => {
            this.addMessage(result.text, 'user', 'voice');
            if (result.intent) {
              this.currentIntent = result.intent;
              this.handleIntent(result.intent);
            }
            this.isProcessing = false;
          },
          error => {
            console.error('Voice processing error:', error);
            this.showError('Unable to process voice input');
            this.isProcessing = false;
          }
        );
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      this.isRecording = false;
      this.stateService.setListening(false);
    }
  }

  /**
   * Send text message
   */
  sendMessage(): void {
    const message = this.inputForm.get('message')?.value;
    if (!message) return;

    this.addMessage(message, 'user', 'text');
    this.inputForm.reset();
    this.isProcessing = true;

    if (this.sessionId) {
      const language = this.translationService.getCurrentLanguage();

      this.aiAssistantService.classifyIntent(this.sessionId, message, language).pipe(
        takeUntil(this.destroy$)
      ).subscribe(
        result => {
          if (result.intent && !result.fallback) {
            this.currentIntent = result.intent;
            this.handleIntent(result.intent);
          } else if (result.fallback) {
            this.addMessage(result.message, 'assistant', 'text');
          }
          this.isProcessing = false;
        },
        error => {
          console.error('Intent classification error:', error);
          this.showError('Unable to process message');
          this.isProcessing = false;
        }
      );
    }
  }

  /**
   * Handle quick action
   */
  handleQuickAction(action: any): void {
    this.currentIntent = action.intent;
    this.handleIntent(action.intent);
  }

  /**
   * Handle intent routing
   */
  private handleIntent(intent: string): void {
    const intentMessages: { [key: string]: string } = {
      'RAISE_COMPLAINT': 'I can help you raise a complaint. Please describe the issue.',
      'TRACK_COMPLAINT': 'I can help you track your complaint. Please provide the complaint number.',
      'GOVERNMENT_UPDATES': 'I can help you find government updates and schemes. What would you like to know?',
      'EMERGENCY_HELP': 'I can help you with emergency services. What do you need?'
    };

    const message = intentMessages[intent] || 'How can I assist you?';
    this.addMessage(message, 'assistant', 'text');

    // Generate speech
    const language = this.translationService.getCurrentLanguage();
    if (this.sessionId) {
      this.aiAssistantService.generateSpeech(this.sessionId, message, language).pipe(
        takeUntil(this.destroy$)
      ).subscribe(
        audioBlob => {
          this.voiceService.playAudio(audioBlob).pipe(
            takeUntil(this.destroy$)
          ).subscribe(() => {
            this.stateService.setSpeaking(false);
          });
          this.stateService.setSpeaking(true);
        },
        error => {
          console.error('TTS error:', error);
        }
      );
    }
  }

  /**
   * Add message to conversation
   */
  private addMessage(content: string, type: 'user' | 'assistant', inputType: 'text' | 'voice' = 'text'): void {
    const message = {
      id: Math.random().toString(36),
      type,
      inputType,
      content,
      language: this.translationService.getCurrentLanguage(),
      timestamp: new Date()
    };

    this.conversationHistory.push(message);
    this.stateService.addMessage(message);
    this.scrollToBottom();
  }

  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  /**
   * Show settings
   */
  showSettings(): void {
    // Open settings dialog
  }

  /**
   * Check voice support
   */
  private checkVoiceSupport(): void {
    this.voiceSupported = this.voiceService.isSupported();
  }

  /**
   * Load user preferences
   */
  private loadUserPreferences(): void {
    const preferences = this.storageService.getUserPreferences();
    if (preferences?.language) {
      this.translationService.switchLanguage(preferences.language);
    }
  }

  /**
   * Subscribe to state changes
   */
  private subscribeToState(): void {
    this.stateService.conversationHistory$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(history => {
      this.conversationHistory = history;
    });

    this.stateService.currentIntent$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(intent => {
      this.currentIntent = intent;
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000 });
    this.stateService.setError({ message });
  }
}
