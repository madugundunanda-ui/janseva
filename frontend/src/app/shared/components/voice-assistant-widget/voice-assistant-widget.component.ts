import { Component, ElementRef, OnInit, OnDestroy, ViewChild, HostListener, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { AIAssistantPlatformService } from '../../../core/services/ai-assistant-platform.service';

@Component({
  selector: 'app-voice-assistant-widget',
  standalone: true,
  imports: [CommonModule, A11yModule],
  templateUrl: './voice-assistant-widget.component.html',
  styleUrls: ['./voice-assistant-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoiceAssistantWidgetComponent implements OnInit, OnDestroy {
  public aiPlatform = inject(AIAssistantPlatformService);
  private announcer = inject(LiveAnnouncer);

  // Local UI-specific state signals
  accessibilityMode = signal(false);
  showHint = signal(true);
  currentHintIndex = signal(0);
  typedText = signal('');

  // Contextual hints for the AI presence layer
  hints = [
    "Need help filing a complaint?",
    "Ask about government updates.",
    "Track grievance status.",
    "Report an issue using voice."
  ];

  // Derived current hint
  currentHint = computed(() => this.hints[this.currentHintIndex()]);
  hintInterval: ReturnType<typeof setInterval> | undefined;

  private lastAnnouncedId = '';

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('widgetCard') widgetCard!: ElementRef;
  @ViewChild('chatTextarea') chatTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  constructor() {
    // 1. Auto-scroll effect on new message or thinking status
    effect(() => {
      // Registers dependency on messages and thinking state
      const messages = this.aiPlatform.conversation.messages();
      const isThinking = this.aiPlatform.conversation.state().isThinking;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _unused = { messages, isThinking };
      
      setTimeout(() => this.scrollToBottom(), 50);
    });

    // 2. Speech recognition transcript auto-fill effect
    effect(() => {
      const speechTranscript = this.aiPlatform.speech.transcript();
      if (speechTranscript) {
        this.typedText.set(speechTranscript);
      }
    });

    // 3. Screen Reader Live Announcement effect
    effect(() => {
      const messages = this.aiPlatform.conversation.messages();
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.sender === 'assistant' && lastMsg.id !== this.lastAnnouncedId) {
          this.lastAnnouncedId = lastMsg.id;
          this.announcer.announce(`New response from AI assistant: ${lastMsg.content}`);
        }
      }
    });
  }

  ngOnInit(): void {
    this.startHintRotation();
  }

  ngOnDestroy(): void {
    this.stopHintRotation();
  }

  // Configurable behavior for clicking outside
  clickOutsideBehavior: 'close' | 'minimize' = 'minimize';

  toggleAssistant() {
    if (this.aiPlatform.conversation.state().isActive) {
      this.minimize();
    } else {
      this.aiPlatform.conversation.activate();
    }
  }

  minimize() {
    this.aiPlatform.conversation.deactivate();
  }

  close() {
    this.aiPlatform.conversation.deactivate();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.aiPlatform.conversation.state().isActive) return;

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
    if (event.key === 'Escape' && this.aiPlatform.conversation.state().isActive) {
      this.minimize();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.aiPlatform.conversation.resumeAfterImageUpload();
    }
  }

  toggleAccessibilityMode() {
    this.accessibilityMode.update(val => !val);
  }

  // AI Presence Layer Hint Rotation
  startHintRotation() {
    this.hintInterval = setInterval(() => {
      this.showHint.set(false);
      
      setTimeout(() => {
        this.currentHintIndex.update(idx => (idx + 1) % this.hints.length);
        this.showHint.set(true);
      }, 500); // fade duration offset
    }, 6000);
  }

  stopHintRotation() {
    if (this.hintInterval) {
      clearInterval(this.hintInterval);
    }
  }

  // Chat Actions
  onTextInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.typedText.set(target.value);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (!event.shiftKey) {
        event.preventDefault();
        this.sendMessage();
      }
    }
  }

  recordAgain() {
    this.typedText.set('');
    this.aiPlatform.speech.clearTranscript();
    this.aiPlatform.conversation.startListening();
  }

  clearTranscript() {
    this.typedText.set('');
    this.aiPlatform.speech.clearTranscript();
  }

  sendMessage() {
    const text = this.typedText().trim();
    if (!text || this.aiPlatform.conversation.state().isThinking) return;

    this.typedText.set('');
    this.aiPlatform.speech.clearTranscript();

    this.aiPlatform.conversation.sendMessage(text).then(() => {
      setTimeout(() => this.focusTextarea(), 100);
    });
  }

  focusTextarea() {
    const el = this.chatTextarea?.nativeElement;
    if (el) {
      el.focus();
    }
  }

  scrollToBottom() {
    const el = this.messagesContainer?.nativeElement;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  // Derived computed state properties for higher performance (avoids layout/render calculations inside view)
  statusText = computed(() => {
    const state = this.aiPlatform.conversation.state();
    const isListening = this.aiPlatform.speech.isListening();
    const isSpeaking = this.aiPlatform.speech.isSpeaking();
    
    if (state.hasError) return 'System Error';
    if (state.isThinking) return 'Thinking...';
    if (isListening) return 'Listening...';
    if (isSpeaking) return 'Speaking...';
    return 'Online';
  });

  languageLabel = computed(() => {
    const code = this.aiPlatform.conversation.state().language;
    if (!code) return '';
    const labels: Record<string, string> = {
      'en-IN': 'English',
      'te-IN': 'తెలుగు',
      'ta-IN': 'தமிழ்',
      'kn-IN': 'ಕನ್ನಡ'
    };
    return labels[code] || code;
  });
}
