import { Injectable, NgZone, inject, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private zone = inject(NgZone);

  private recognition: any;
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private listeningTimeout: any = null;

  // Signals for speech state
  private _isListening = signal<boolean>(false);
  public readonly isListening = this._isListening.asReadonly();

  private _isSpeaking = signal<boolean>(false);
  public readonly isSpeaking = this._isSpeaking.asReadonly();

  private _transcript = signal<string>('');
  public readonly transcript = this._transcript.asReadonly();

  // Callback to notify SpeechService consumers (like ConversationService) when text is transcripted
  public onTranscriptProcessed?: (text: string) => void;
  public onRecognitionError?: (error: string) => void;

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.zone.run(() => {
          this._isListening.set(true);
        });
      };

      this.recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        this.zone.run(() => {
          this._transcript.set(resultText);
          this._isListening.set(false);
          if (this.onTranscriptProcessed) {
            this.onTranscriptProcessed(resultText);
          }
        });
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        this.zone.run(() => {
          this._isListening.set(false);
          if (this.onRecognitionError) {
            this.onRecognitionError(event.error);
          }
        });
      };

      this.recognition.onend = () => {
        this.zone.run(() => {
          this._isListening.set(false);
        });
      };
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }
  }

  public startListening(lang: string) {
    if (this._isSpeaking() || !this.recognition) return;

    try {
      this.recognition.lang = lang;
      this.recognition.start();

      if (this.listeningTimeout) clearTimeout(this.listeningTimeout);
      this.listeningTimeout = setTimeout(() => {
        this.stopListening();
        this.speak("Listening time limit reached.", lang);
      }, 60000);
    } catch (e) {
      // recognition already running
    }
  }

  public stopListening() {
    if (this.listeningTimeout) clearTimeout(this.listeningTimeout);
    this.recognition?.stop();
  }

  public speak(text: string, lang: string, onEnd?: () => void) {
    this.synth?.cancel(); // Cancel any ongoing speech

    if (!text || !this.synth || typeof SpeechSynthesisUtterance === 'undefined') {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;

    utterance.onstart = () => {
      this.zone.run(() => {
        this._isSpeaking.set(true);
      });
    };

    utterance.onend = () => {
      this.zone.run(() => {
        this._isSpeaking.set(false);
        if (onEnd) onEnd();
      });
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error', e);
      this.zone.run(() => {
        this._isSpeaking.set(false);
        if (onEnd) onEnd();
      });
    };

    this.synth.speak(utterance);
  }

  public cancelSpeech() {
    this.synth?.cancel();
    this._isSpeaking.set(false);
  }

  public clearTranscript() {
    this._transcript.set('');
  }

  public updateTranscript(text: string) {
    this._transcript.set(text);
  }
}
