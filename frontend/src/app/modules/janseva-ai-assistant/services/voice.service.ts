/**
 * Voice Service
 * Handles microphone input, audio recording, playback, and WebRTC
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

interface AudioConstraints {
  audio: {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    sampleRate: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  // Audio recording state
  private recordingSubject = new BehaviorSubject<boolean>(false);
  public recording$ = this.recordingSubject.asObservable();

  // Audio playback state
  private playingSubject = new BehaviorSubject<boolean>(false);
  public playing$ = this.playingSubject.asObservable();

  // Volume level (0-100)
  private volumeLevelSubject = new BehaviorSubject<number>(0);
  public volumeLevel$ = this.volumeLevelSubject.asObservable();

  // Transcript from recognition
  private transcriptSubject = new BehaviorSubject<string>('');
  public transcript$ = this.transcriptSubject.asObservable();

  // Errors
  private errorSubject = new Subject<any>();
  public error$ = this.errorSubject.asObservable();

  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recognitionStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private audioElement: HTMLAudioElement | null = null;

  // Speech recognition
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    this.initializeAudioContext();
    this.initializeSpeechRecognition();
  }

  /**
   * Initialize Web Audio API
   */
  private initializeAudioContext(): void {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Initialize Speech Recognition API
   */
  private initializeSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
    }
  }

  /**
   * Start recording audio from microphone
   */
  async startRecording(language: string = 'en-IN'): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.requestMicrophoneAccess().then(stream => {
        this.recognitionStream = stream;

        // Setup audio analysis
        if (this.audioContext) {
          const source = this.audioContext.createMediaStreamSource(stream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 256;
          source.connect(this.analyser);

          this.startVolumeMonitoring();
        }

        // Setup media recorder
        const options = { mimeType: 'audio/webm;codecs=opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'audio/wav';
        }

        this.mediaRecorder = new MediaRecorder(stream, options);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder!.mimeType });
          this.stopVolumeMonitoring();
          this.stopMicrophoneAccess();
          resolve(audioBlob);
        };

        this.mediaRecorder.onerror = (event) => {
          this.stopVolumeMonitoring();
          this.stopMicrophoneAccess();
          reject(new Error(`Recording error: ${event.error}`));
        };

        this.mediaRecorder.start();
        this.recordingSubject.next(true);
      }).catch(error => {
        reject(error);
      });
    });
  }

  /**
   * Stop recording audio
   */
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      // Wait for onstop to be called
      const originalOndatavailable = this.mediaRecorder.ondataavailable;
      const originalOnstop = this.mediaRecorder.onstop;

      this.mediaRecorder.onstop = (event: Event) => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder!.mimeType });
        this.recordingSubject.next(false);
        resolve(audioBlob);
        if (originalOnstop) originalOnstop.call(this.mediaRecorder!, event);
      };

      this.mediaRecorder.onerror = (event) => {
        this.recordingSubject.next(false);
        reject(new Error(`Recording error: ${event.error}`));
      };
    });
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Play audio blob
   */
  playAudio(audioBlob: Blob): Observable<any> {
    return new Observable(observer => {
      if (!this.audioElement) {
        this.audioElement = new Audio();
      }

      const url = URL.createObjectURL(audioBlob);

      this.audioElement.src = url;
      this.audioElement.onplay = () => {
        this.playingSubject.next(true);
      };

      this.audioElement.onended = () => {
        this.playingSubject.next(false);
        URL.revokeObjectURL(url);
        observer.next({ status: 'completed' });
        observer.complete();
      };

      this.audioElement.onerror = (error) => {
        this.playingSubject.next(false);
        URL.revokeObjectURL(url);
        this.errorSubject.next(error);
        observer.error(error);
      };

      this.audioElement.play().catch(error => {
        this.playingSubject.next(false);
        URL.revokeObjectURL(url);
        this.errorSubject.next(error);
        observer.error(error);
      });
    });
  }

  /**
   * Stop audio playback
   */
  stopAudioPlayback(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.playingSubject.next(false);
    }
  }

  /**
   * Stop audio playback immediately (for voice interruption)
   */
  stopAudioImmediately(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.playingSubject.next(false);
    }
    this.stopListening();
  }

  /**
   * Start listening with speech recognition
   */
  startListening(language: string = 'en-IN'): Observable<string> {
    return new Observable(observer => {
      if (!this.recognition) {
        observer.error(new Error('Speech Recognition not supported'));
        return;
      }

      this.recognition.lang = language;
      this.isListening = true;

      let fullTranscript = '';

      this.recognition.onstart = () => {
        fullTranscript = '';
        this.transcriptSubject.next('');
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            fullTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        this.transcriptSubject.next(fullTranscript || interimTranscript);
        observer.next(fullTranscript || interimTranscript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech Recognition error:', event.error);
        this.errorSubject.next({
          type: 'speech_recognition_error',
          error: event.error
        });
        observer.error(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        observer.complete();
      };

      this.recognition.start();
    });
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Start volume monitoring (real-time frequency analysis)
   */
  private startVolumeMonitoring(): void {
    if (!this.analyser) return;

    const monitor = () => {
      const dataArray = new Uint8Array(this.analyser!.frequencyBinCount);
      this.analyser!.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const volumeLevel = Math.round((average / 256) * 100);

      this.volumeLevelSubject.next(volumeLevel);

      if (this.recordingSubject.value) {
        requestAnimationFrame(monitor);
      }
    };

    monitor();
  }

  /**
   * Stop volume monitoring
   */
  private stopVolumeMonitoring(): void {
    this.volumeLevelSubject.next(0);
  }

  /**
   * Request microphone access
   */
  private requestMicrophoneAccess(): Promise<MediaStream> {
    const audioConstraints: AudioConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    };

    return navigator.mediaDevices.getUserMedia(audioConstraints).catch(error => {
      this.errorSubject.next({
        type: 'microphone_access_denied',
        error: error
      });
      throw new Error(`Microphone access denied: ${error.message}`);
    });
  }

  /**
   * Stop microphone access
   */
  private stopMicrophoneAccess(): void {
    if (this.recognitionStream) {
      this.recognitionStream.getTracks().forEach(track => track.stop());
      this.recognitionStream = null;
    }
  }

  /**
   * Check browser support
   */
  isSupported(): { recording: boolean; playback: boolean; recognition: boolean } {
    return {
      recording: !!navigator.mediaDevices?.getUserMedia,
      playback: !!HTMLAudioElement,
      recognition: !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
    };
  }

  /**
   * Get current volume level
   */
  getCurrentVolumeLevel(): number {
    return this.volumeLevelSubject.value;
  }

  /**
   * Check if recording
   */
  isRecording(): boolean {
    return this.recordingSubject.value;
  }

  /**
   * Check if playing
   */
  isPlaying(): boolean {
    return this.playingSubject.value;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopRecording().catch(() => {});
    this.stopAudioPlayback();
    this.stopListening();
    this.stopMicrophoneAccess();
  }
}
