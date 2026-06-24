import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export interface VoiceState {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  language: string | null;
  transcript: string;
  systemMessage: string;
  workflowName: string;
  awaitingImageUpload: boolean;
  isThinking: boolean;
  hasError: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceAssistantService {
  private apiUrl = `${environment.apiUrl}/voice/interact`;
  private recognition: any;
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private listeningTimeout: any = null;
  
  private initialState: VoiceState = {
    isActive: false,
    isListening: false,
    isSpeaking: false,
    language: null,
    transcript: '',
    systemMessage: '',
    workflowName: 'IDLE',
    awaitingImageUpload: false,
    isThinking: false,
    hasError: false
  };

  private state = new BehaviorSubject<VoiceState>(this.initialState);
  state$ = this.state.asObservable();

  private sessionId = `session-${Date.now()}`;

  constructor(private http: HttpClient, private zone: NgZone) {
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
        this.zone.run(() => this.updateState({ isListening: true }));
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.zone.run(() => {
          this.updateState({ transcript, isListening: false });
          this.processUserInput(transcript);
        });
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        this.zone.run(() => this.updateState({ isListening: false }));
      };

      this.recognition.onend = () => {
        this.zone.run(() => this.updateState({ isListening: false }));
      };
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }
  }

  private updateState(partialState: Partial<VoiceState>) {
    this.state.next({ ...this.state.value, ...partialState });
  }

  public activate() {
    this.updateState({ isActive: true });
    
    // Check for offline drafts
    const draft = localStorage.getItem('janseva_voice_draft');
    if (draft && navigator.onLine) {
      this.speak("I found a pending complaint draft. Resuming now.", 'en-IN', () => {
         this.updateState({ workflowName: 'RAISE_COMPLAINT_CONFIRMATION', systemMessage: "Do you accept Terms and Conditions?" });
         this.speak("Do you accept Terms and Conditions?", 'en-IN', () => this.startListening());
         localStorage.removeItem('janseva_voice_draft');
      });
      return;
    }

    // Preserve and resume if conversation context is already active
    if (this.state.value.language) {
      if (['MAIN_MENU', 'TRACK_COMPLAINT', 'RAISE_COMPLAINT_CONFIRMATION', 'RAISE_COMPLAINT_DESCRIPTION'].includes(this.state.value.workflowName)) {
        this.startListening();
      }
      return;
    }

    this.updateState({ workflowName: 'LANGUAGE_SELECTION' });
    this.askForLanguage();
  }

  public deactivate() {
    this.recognition?.stop();
    this.synth?.cancel();
    this.updateState({
      isActive: false,
      isListening: false,
      isSpeaking: false,
      isThinking: false
    });
  }

  private askForLanguage() {
    const msg = "Please select your preferred language. English, Telugu, Tamil, or Kannada.";
    this.updateState({ systemMessage: msg });
    this.speak(msg, 'en-IN', () => {
      // Temporarily set to english to catch the language choice
      if (this.recognition) {
        this.recognition.lang = 'en-IN';
        this.startListening();
      }
    });
  }

  public setLanguage(lang: string) {
    this.updateState({ language: lang });
    if (this.recognition) {
      this.recognition.lang = lang;
    }
    const welcomeMsgs: Record<string, string> = {
      'en-IN': "Language set to English. Please choose: 1. Raise Complaint 2. Track Complaint 3. Government Updates 4. Emergency Help",
      'te-IN': "భాష తెలుగుకు మార్చబడింది. దయచేసి ఎంచుకోండి: 1. ఫిర్యాదు నమోదు 2. ట్రాక్ 3. ప్రభుత్వ అప్‌డేట్స్ 4. అత్యవసర సహాయం",
      'ta-IN': "மொழி தமிழுக்கு மாற்றப்பட்டது. தயவுசெய்து தேர்ந்தெடுக்கவும்: 1. புகார் பதிவு 2. கண்காணி 3. அரசு செய்திகள் 4. அவசர உதவி",
      'kn-IN': "ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಆಯ್ಕೆಮಾಡಿ: 1. ದೂರು ದಾಖಲಿಸಿ 2. ಟ್ರ್ಯಾಕ್ 3. ಸರ್ಕಾರದ ನವೀಕರಣಗಳು 4. ತುರ್ತು ಸಹಾಯ"
    };
    
    const msg = welcomeMsgs[lang] || welcomeMsgs['en-IN'];
    this.updateState({ systemMessage: msg, workflowName: 'MAIN_MENU' });
    this.speak(msg, lang, () => {
      this.startListening();
    });
  }

  public startListening() {
    const state = this.state.value;
    if (state.isSpeaking || state.awaitingImageUpload) return;
    
    try {
      this.recognition?.start();
      
      // Limit to 60 seconds
      if (this.listeningTimeout) clearTimeout(this.listeningTimeout);
      this.listeningTimeout = setTimeout(() => {
        this.stopListening();
        this.speak("Listening time limit reached.", this.state.value.language || 'en-IN');
      }, 60000);

    } catch (e) {
      // already started
    }
  }

  public stopListening() {
    if (this.listeningTimeout) clearTimeout(this.listeningTimeout);
    this.recognition?.stop();
  }

  private speak(text: string, lang: string, onEnd?: () => void) {
    this.synth?.cancel(); // Stop any ongoing speech
    
    if (!text || !this.synth || typeof SpeechSynthesisUtterance === 'undefined') {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    
    utterance.onstart = () => this.zone.run(() => this.updateState({ isSpeaking: true }));
    utterance.onend = () => {
      this.zone.run(() => {
        this.updateState({ isSpeaking: false });
        if (onEnd) onEnd();
      });
    };
    utterance.onerror = () => this.zone.run(() => this.updateState({ isSpeaking: false }));

    this.synth.speak(utterance);
  }

  private async processUserInput(text: string) {
    const state = this.state.value;
    const textLower = text.toLowerCase();
    
    // Check if we are still selecting language
    if (!state.language) {
      if (textLower.includes('english') || text.includes('1')) this.setLanguage('en-IN');
      else if (textLower.includes('telugu') || textLower.includes('తెలుగు') || text.includes('2')) this.setLanguage('te-IN');
      else if (textLower.includes('tamil') || textLower.includes('தமிழ்') || text.includes('3')) this.setLanguage('ta-IN');
      else if (textLower.includes('kannada') || textLower.includes('ಕನ್ನಡ') || text.includes('4')) this.setLanguage('kn-IN');
      else {
        this.speak("Language not recognized. Please say English, Telugu, Tamil, or Kannada.", 'en-IN', () => this.startListening());
      }
      return;
    }

    // Check offline
    if (!navigator.onLine) {
      if (state.workflowName === 'RAISE_COMPLAINT_DESCRIPTION' || state.workflowName === 'RAISE_COMPLAINT_CONFIRMATION') {
        localStorage.setItem('janseva_voice_draft', JSON.stringify({ text, workflowName: state.workflowName, language: state.language }));
        this.speak("You are offline. Your complaint draft has been saved and will resume when you reconnect.", state.language || 'en-IN');
      } else {
        this.speak("You are offline. Please reconnect to use the voice assistant.", state.language || 'en-IN');
      }
      return;
    }

    try {
      this.updateState({ isThinking: true, hasError: false });
      // Send to backend intent router
      const response = await firstValueFrom(this.http.post<any>(this.apiUrl, {
        text,
        language: state.language,
        sessionId: this.sessionId,
        workflowName: state.workflowName,
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        browser: navigator.userAgent
      }));

      const data = response.data;
      this.updateState({ systemMessage: data.systemResponse, isThinking: false });

      this.speak(data.systemResponse, state.language, () => {
        this.handleBackendAction(data.nextAction, data.intent);
      });

    } catch (error) {
      console.error('Voice interaction failed', error);
      this.updateState({ isThinking: false, hasError: true });
      this.speak("A network error occurred.", state.language, () => {
        this.updateState({ hasError: false });
        this.startListening();
      });
    }
  }

  private handleBackendAction(action: string | null, intent: string) {
    const lang = this.state.value.language || 'en-IN';
    
    switch(action) {
      case 'RAISE_COMPLAINT_IMAGE':
        this.updateState({ 
          workflowName: 'RAISE_COMPLAINT_DESCRIPTION',
          awaitingImageUpload: true 
        });
        // We will wait for the component to trigger image upload complete
        break;
      case 'TRACK_COMPLAINT':
        this.updateState({ 
          workflowName: 'TRACK_COMPLAINT'
        });
        this.startListening();
        break;
      case 'RAISE_COMPLAINT_CONFIRMATION':
        this.updateState({
          workflowName: 'RAISE_COMPLAINT_CONFIRMATION'
        });
        this.startListening();
        break;
      case 'COMPLETED':
      case 'MAIN_MENU':
        this.updateState({
          workflowName: 'MAIN_MENU'
        });
        if (action === 'MAIN_MENU') this.startListening();
        break;
      default:
        // Unknown or error
        if (intent === 'UNKNOWN') {
           this.updateState({ workflowName: 'MAIN_MENU' });
        }
        this.startListening();
        break;
    }
  }

  // Called by the UI after an image is selected
  public resumeAfterImageUpload() {
    const state = this.state.value;
    if (state.awaitingImageUpload) {
      this.updateState({ awaitingImageUpload: false });
      
      const descMsgs: Record<string, string> = {
        'en-IN': "Image received. Please describe the issue.",
        'te-IN': "చిత్రం అప్‌లోడ్ చేయబడింది. దయచేసి సమస్యను వివరించండి.",
        'ta-IN': "படம் பதிவேற்றப்பட்டது. தயவுசெய்து பிரச்சினையை விவரிக்கவும்.",
        'kn-IN': "ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಆಗಿದೆ. ದಯವಿಟ್ಟು ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ."
      };
      
      const msg = descMsgs[state.language!] || descMsgs['en-IN'];
      this.updateState({ systemMessage: msg });
      this.speak(msg, state.language!, () => {
        this.startListening();
      });
    }
  }
}
