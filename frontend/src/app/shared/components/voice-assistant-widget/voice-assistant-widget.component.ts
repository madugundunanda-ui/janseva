import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceAssistantService, VoiceState } from '../../core/services/voice-assistant.service';

@Component({
  selector: 'app-voice-assistant-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-assistant-widget.component.html',
  styleUrls: ['./voice-assistant-widget.component.css']
})
export class VoiceAssistantWidgetComponent implements OnInit {
  state!: VoiceState;
  accessibilityMode: boolean = false;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(public voiceService: VoiceAssistantService) {}

  ngOnInit(): void {
    this.voiceService.state$.subscribe(s => {
      this.state = s;
      if (s.awaitingImageUpload && this.fileInput) {
        // Automatically trigger file picker when backend requests it
        // Adding a slight timeout to ensure UI is ready
        setTimeout(() => {
          this.fileInput.nativeElement.click();
        }, 100);
      }
    });
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
      // In a real flow, we'd upload the file here
      // For now, we simulate success and resume the voice flow
      this.voiceService.resumeAfterImageUpload();
    } else {
      // If user cancelled the picker
      this.voiceService.resumeAfterImageUpload();
    }
  }

  toggleAccessibilityMode() {
    this.accessibilityMode = !this.accessibilityMode;
  }
}
