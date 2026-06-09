import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-voice-input',
  template: `
    <div class="voice-input">
      <button type="button" (click)="toggleRecording()">{{ recording ? 'Stop' : 'Record' }}</button>
    </div>
  `,
  styles: [
    `
      .voice-input { display: flex; align-items: center; }
      button { padding: 10px 12px; border-radius: 999px; border: 0; background: #111827; color: #fff; }
    `
  ]
})
export class VoiceInputComponent {
  @Output() recordingChanged = new EventEmitter<boolean>();

  recording = false;

  toggleRecording(): void {
    this.recording = !this.recording;
    this.recordingChanged.emit(this.recording);
  }
}
