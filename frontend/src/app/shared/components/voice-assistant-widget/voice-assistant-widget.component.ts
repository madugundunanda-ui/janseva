import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
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

  toggleAssistant() {
    if (this.state.isActive) {
      this.voiceService.deactivate();
    } else {
      this.voiceService.activate();
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

  // Magnetic Attraction Micro-Interaction
  onMouseMove(event: MouseEvent) {
    if (this.state?.isActive) return;
    const card = this.widgetCard?.nativeElement;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const cardX = rect.left + rect.width / 2;
    const cardY = rect.top + rect.height / 2;

    const distX = event.clientX - cardX;
    const distY = event.clientY - cardY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    // Magnetic pull activation within 120px range
    if (distance < 120) {
      const pullX = (distX / distance) * 15; // pull up to 15px
      const pullY = (distY / distance) * 15;
      card.style.transform = `translate(${pullX}px, ${pullY}px) scale(1.05)`;
    } else {
      card.style.transform = '';
    }
  }

  onMouseLeave() {
    const card = this.widgetCard?.nativeElement;
    if (card) {
      card.style.transform = '';
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
