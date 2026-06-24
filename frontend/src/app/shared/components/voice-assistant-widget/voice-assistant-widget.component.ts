import { Component, ElementRef, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceAssistantService, VoiceState } from '../../../core/services/voice-assistant.service';

@Component({
  selector: 'app-voice-assistant-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-assistant-widget.component.html',
  styleUrls: ['./voice-assistant-widget.component.css']
})
export class VoiceAssistantWidgetComponent implements OnInit, OnDestroy {
  state!: VoiceState;
  accessibilityMode = false;

  // Contextual hints for the AI presence layer
  hints = [
    "Need help filing a complaint?",
    "Ask about government updates.",
    "Track grievance status.",
    "Report an issue using voice."
  ];
  currentHintIndex = 0;
  currentHint = this.hints[0];
  showHint = true;
  hintInterval: any;

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('widgetCard') widgetCard!: ElementRef;

  constructor(public voiceService: VoiceAssistantService) {}

  ngOnInit(): void {
    this.voiceService.state$.subscribe(s => {
      this.state = s;
      if (s.awaitingImageUpload && this.fileInput) {
        setTimeout(() => {
          this.fileInput.nativeElement.click();
        }, 100);
      }
    });

    this.startHintRotation();
  }

  ngOnDestroy(): void {
    this.stopHintRotation();
  }

  // Configurable behavior for clicking outside
  clickOutsideBehavior: 'close' | 'minimize' = 'minimize';

  toggleAssistant() {
    if (this.state.isActive) {
      this.minimize();
    } else {
      this.voiceService.activate();
    }
  }

  minimize() {
    this.voiceService.deactivate();
  }

  close() {
    this.voiceService.deactivate();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.state?.isActive) return;

    const card = this.widgetCard?.nativeElement;
    const isClickedOutside = card && !card.contains(event.target);

    if (isClickedOutside) {
      if (this.clickOutsideBehavior === 'close') {
        this.close();
      } else {
        this.minimize();
      }
    }
  }

  @HostListener('document:keydown', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.state?.isActive) {
      this.minimize();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.voiceService.resumeAfterImageUpload();
    } else {
      this.voiceService.resumeAfterImageUpload();
    }
  }

  toggleAccessibilityMode() {
    this.accessibilityMode = !this.accessibilityMode;
  }

  // AI Presence Layer Hint Rotation
  startHintRotation() {
    this.hintInterval = setInterval(() => {
      this.showHint = false;
      setTimeout(() => {
        this.currentHintIndex = (this.currentHintIndex + 1) % this.hints.length;
        this.currentHint = this.hints[this.currentHintIndex];
        this.showHint = true;
      }, 500); // fade duration offset
    }, 6000);
  }

  stopHintRotation() {
    if (this.hintInterval) {
      clearInterval(this.hintInterval);
    }
  }



  // Utility labels for UI
  getLanguageLabel(code: string | null): string {
    if (!code) return '';
    const labels: Record<string, string> = {
      'en-IN': 'English',
      'te-IN': 'తెలుగు',
      'ta-IN': 'தமிழ்',
      'kn-IN': 'ಕನ್ನಡ'
    };
    return labels[code] || code;
  }

  getStatusText(): string {
    if (this.state?.hasError) return 'System Error';
    if (this.state?.isThinking) return 'Thinking...';
    if (this.state?.isListening) return 'Listening...';
    if (this.state?.isSpeaking) return 'Speaking...';
    return 'Online';
  }
}
