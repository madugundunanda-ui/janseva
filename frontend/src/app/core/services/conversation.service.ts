import { Injectable, inject, signal, effect } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import { Message } from '../models/ai-assistant.model';
import { ConversationPersistenceService } from './conversation-persistence.service';
import { AIProviderService } from './ai-provider.service';
import { SpeechService } from './speech.service';
import { AI_ASSISTANT_MESSAGES } from '../constants/ai-assistant-messages.constants';

export interface ConversationState {
  isActive: boolean;
  isThinking: boolean;
  awaitingImageUpload: boolean;
  hasError: boolean;
  language: string | null;
  workflowName: string;
  systemMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private persistenceService = inject(ConversationPersistenceService);
  private aiProviderService = inject(AIProviderService);
  private speechService = inject(SpeechService);

  private sessionId = `session-${Date.now()}`;

  private initialState: ConversationState = {
    isActive: false,
    isThinking: false,
    awaitingImageUpload: false,
    hasError: false,
    language: null,
    workflowName: 'IDLE',
    systemMessage: ''
  };

  // State Signals
  private _state = signal<ConversationState>(this.initialState);
  public readonly state = this._state.asReadonly();

  public readonly messages = signal<Message[]>([]);

  // Analytics Event hooks
  public readonly analyticsEvents = new Subject<{ event: string; data?: any }>();

  constructor() {
    // Restore messages from storage
    const saved = this.persistenceService.loadConversation();
    if (saved.length > 0) {
      this.messages.set(saved);
    }

    // Effect to persist messages on change
    effect(() => {
      this.persistenceService.saveConversation(this.messages());
    });

    // Connect SpeechService callbacks
    this.speechService.onTranscriptProcessed = (text: string) => {
      this.emitAnalyticsEvent('voice_recognition_completed', { text });
      this.processUserInput(text);
    };

    this.speechService.onRecognitionError = (err: string) => {
      this.emitAnalyticsEvent('voice_recognition_error', { error: err });
      this.handleRecognitionError(err);
    };
  }

  private updateState(partialState: Partial<ConversationState>) {
    this._state.update(s => ({ ...s, ...partialState }));
  }

  private emitAnalyticsEvent(event: string, data?: any) {
    this.analyticsEvents.next({ event, data });
  }

  public activate() {
    this.updateState({ isActive: true });
    this.emitAnalyticsEvent('conversation_started', { sessionId: this.sessionId });

    // Check for offline drafts
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('janseva_voice_draft');
      if (draft && navigator.onLine) {
        const lang = this.state().language || 'en-IN';
        const msg = AI_ASSISTANT_MESSAGES['DRAFT_FOUND'][lang] || AI_ASSISTANT_MESSAGES['DRAFT_FOUND']['en-IN'];
        this.addSystemMessage(msg);
        this.speechService.speak(msg, lang, () => {
          const termsMsg = AI_ASSISTANT_MESSAGES['TERMS_CONFIRM'][lang] || AI_ASSISTANT_MESSAGES['TERMS_CONFIRM']['en-IN'];
          this.updateState({ workflowName: 'RAISE_COMPLAINT_CONFIRMATION', systemMessage: termsMsg });
          this.addSystemMessage(termsMsg);
          this.speechService.speak(termsMsg, lang, () => this.startListening());
          localStorage.removeItem('janseva_voice_draft');
        });
        return;
      }
    }

    // Preserve and resume if conversation context is already active
    if (this.state().language) {
      if (['MAIN_MENU', 'TRACK_COMPLAINT', 'RAISE_COMPLAINT_CONFIRMATION', 'RAISE_COMPLAINT_DESCRIPTION'].includes(this.state().workflowName)) {
        this.startListening();
      }
      return;
    }

    this.updateState({ workflowName: 'LANGUAGE_SELECTION' });
    this.askForLanguage();
  }

  public deactivate() {
    this.speechService.stopListening();
    this.speechService.cancelSpeech();
    this.updateState({
      isActive: false,
      isThinking: false
    });
    this.emitAnalyticsEvent('conversation_ended', { sessionId: this.sessionId });
  }

  private askForLanguage() {
    const lang = 'en-IN';
    const msg = AI_ASSISTANT_MESSAGES['WELCOME'][lang];
    this.updateState({ systemMessage: msg });
    this.addSystemMessage(msg);
    this.speechService.speak(msg, lang, () => {
      this.speechService.startListening(lang);
      this.emitAnalyticsEvent('voice_recognition_started', { lang });
    });
  }

  public setLanguage(lang: string) {
    this.updateState({ language: lang });
    
    const welcomeMsgs: Record<string, string> = {
      'en-IN': "Language set to English. Please choose: 1. Raise Complaint 2. Track Complaint 3. Government Updates 4. Emergency Help",
      'te-IN': "భాష తెలుగుకు మార్చబడింది. దయచేసి ఎంచుకోండి: 1. ఫిర్యాదు నమోదు 2. ట్రాక్ 3. ప్రభుత్వ అప్‌డేట్స్ 4. అత్యవసర సహాయం",
      'ta-IN': "மொழி தமிழுக்கு மாற்றப்பட்டது. தயவுசெய்து தேர்ந்தெடுக்கவும்: 1. புகார் பதிவு 2. கண்காணி 3. அரசு செய்திகள் 4. அவசர உதவி",
      'kn-IN': "ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಆಯ್ಕೆಮಾಡಿ: 1. ದೂರು ದಾಖಲಿಸಿ 2. ಟ್ರ್ಯಾಕ್ 3. ಸರ್ಕಾರದ ನವೀಕರಣಗಳು 4. ತುರ್ತು ಸಹಾಯ"
    };

    const msg = welcomeMsgs[lang] || welcomeMsgs['en-IN'];
    this.updateState({ systemMessage: msg, workflowName: 'MAIN_MENU' });
    this.addSystemMessage(msg);
    this.speechService.speak(msg, lang, () => {
      this.startListening();
    });
  }

  public startListening() {
    const state = this.state();
    if (this.speechService.isSpeaking() || state.awaitingImageUpload) return;
    const lang = state.language || 'en-IN';
    this.speechService.startListening(lang);
    this.emitAnalyticsEvent('voice_recognition_started', { lang });
  }

  public stopListening() {
    this.speechService.stopListening();
  }

  private generateMsgId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private addSystemMessage(content: string, type: 'text' | 'card' = 'text', metadata?: any) {
    const msg: Message = {
      id: this.generateMsgId('system'),
      conversationId: this.sessionId,
      sender: 'assistant',
      type,
      content,
      timestamp: new Date(),
      status: 'success',
      language: this.state().language || undefined,
      metadata
    };
    this.messages.update(msgs => [...msgs, msg]);
  }

  public async sendMessage(text: string) {
    const state = this.state();
    if (!text || state.isThinking) return;

    // 1. Add user message
    const userMsg: Message = {
      id: this.generateMsgId('user'),
      conversationId: this.sessionId,
      sender: 'user',
      type: 'text',
      content: text,
      timestamp: new Date(),
      status: 'success',
      language: state.language || undefined
    };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.emitAnalyticsEvent('message_sent', { message: userMsg });

    // Clear speech service transcript
    this.speechService.clearTranscript();

    // 2. Process message
    await this.processUserInput(text);
  }

  public async processUserInput(text: string) {
    const state = this.state();
    const textLower = text.toLowerCase();

    // 1. Language Selection Check
    if (!state.language) {
      if (textLower.includes('english') || text.includes('1')) this.setLanguage('en-IN');
      else if (textLower.includes('telugu') || textLower.includes('తెలుగు') || text.includes('2')) this.setLanguage('te-IN');
      else if (textLower.includes('tamil') || textLower.includes('தமிழ்') || text.includes('3')) this.setLanguage('ta-IN');
      else if (textLower.includes('kannada') || textLower.includes('ಕನ್ನಡ') || text.includes('4')) this.setLanguage('kn-IN');
      else {
        const fallbackMsg = AI_ASSISTANT_MESSAGES['LANG_NOT_RECOGNIZED']['en-IN'];
        this.addSystemMessage(fallbackMsg);
        this.speechService.speak(fallbackMsg, 'en-IN', () => this.startListening());
      }
      return;
    }

    const lang = state.language;

    // 2. Offline Check
    if (typeof window !== 'undefined' && !navigator.onLine) {
      if (state.workflowName === 'RAISE_COMPLAINT_DESCRIPTION' || state.workflowName === 'RAISE_COMPLAINT_CONFIRMATION') {
        localStorage.setItem('janseva_voice_draft', JSON.stringify({ text, workflowName: state.workflowName, language: state.language }));
        const offlineMsg = AI_ASSISTANT_MESSAGES['OFFLINE_DRAFT'][lang] || AI_ASSISTANT_MESSAGES['OFFLINE_DRAFT']['en-IN'];
        this.addSystemMessage(offlineMsg);
        this.speechService.speak(offlineMsg, lang);
      } else {
        const offlineNotice = AI_ASSISTANT_MESSAGES['OFFLINE_NOTICE'][lang] || AI_ASSISTANT_MESSAGES['OFFLINE_NOTICE']['en-IN'];
        this.addSystemMessage(offlineNotice);
        this.speechService.speak(offlineNotice, lang);
      }
      return;
    }

    // 3. Streaming-ready Setup (Add pending placeholder response)
    const assistantMsgId = this.generateMsgId('assistant');
    const placeholderMsg: Message = {
      id: assistantMsgId,
      conversationId: this.sessionId,
      sender: 'assistant',
      type: 'text',
      content: '',
      timestamp: new Date(),
      status: 'pending',
      language: lang
    };
    this.messages.update(msgs => [...msgs, placeholderMsg]);

    try {
      this.updateState({ isThinking: true, hasError: false });

      // Call backend
      const response = await firstValueFrom(this.aiProviderService.send({
        text,
        language: lang,
        sessionId: this.sessionId,
        workflowName: state.workflowName,
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        browser: navigator.userAgent
      }));

      const data = response.data;

      // Update response content
      this.messages.update(msgs =>
        msgs.map(m => m.id === assistantMsgId ? { ...m, content: data.systemResponse, status: 'success' } : m)
      );
      this.updateState({ systemMessage: data.systemResponse, isThinking: false });
      this.emitAnalyticsEvent('response_received', { response: data });

      // Speak and navigate action
      this.speechService.speak(data.systemResponse, lang, () => {
        this.handleBackendAction(data.nextAction, data.intent);
      });

    } catch (error) {
      console.error('Voice interaction failed', error);

      const errText = AI_ASSISTANT_MESSAGES['NETWORK_ERROR'][lang] || AI_ASSISTANT_MESSAGES['NETWORK_ERROR']['en-IN'];
      
      // Update placeholder with error state
      this.messages.update(msgs =>
        msgs.map(m => m.id === assistantMsgId ? { ...m, content: errText, status: 'error' } : m)
      );

      this.updateState({ isThinking: false, hasError: true });
      this.emitAnalyticsEvent('error_occurred', { error });

      this.speechService.speak(errText, lang, () => {
        this.updateState({ hasError: false });
        this.startListening();
      });
    }
  }

  private handleBackendAction(action: string | null, intent: string) {
    switch(action) {
      case 'RAISE_COMPLAINT_IMAGE':
        this.updateState({
          workflowName: 'RAISE_COMPLAINT_DESCRIPTION',
          awaitingImageUpload: true
        });
        this.emitAnalyticsEvent('image_upload_requested');
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
        if (intent === 'UNKNOWN') {
           this.updateState({ workflowName: 'MAIN_MENU' });
        }
        this.startListening();
        break;
    }
  }

  public resumeAfterImageUpload() {
    const state = this.state();
    if (state.awaitingImageUpload) {
      this.updateState({ awaitingImageUpload: false });
      this.emitAnalyticsEvent('image_uploaded');

      const lang = state.language || 'en-IN';
      const msg = AI_ASSISTANT_MESSAGES['IMAGE_RECEIVED'][lang] || AI_ASSISTANT_MESSAGES['IMAGE_RECEIVED']['en-IN'];

      this.updateState({ systemMessage: msg });
      this.addSystemMessage(msg);
      this.speechService.speak(msg, lang, () => {
        this.startListening();
      });
    }
  }

  private handleRecognitionError(error: string) {
    const lang = this.state().language || 'en-IN';
    let msg = '';
    if (error === 'not-allowed') {
      msg = AI_ASSISTANT_MESSAGES['MIC_TROUBLE'][lang] || AI_ASSISTANT_MESSAGES['MIC_TROUBLE']['en-IN'];
    } else {
      msg = AI_ASSISTANT_MESSAGES['MIC_RETRY'][lang] || AI_ASSISTANT_MESSAGES['MIC_RETRY']['en-IN'];
    }

    this.addSystemMessage(msg);
    this.speechService.speak(msg, lang);
  }

  public clearConversation() {
    this.messages.set([]);
    this.persistenceService.clearConversation();
    this.updateState(this.initialState);
    this.speechService.clearTranscript();
  }
}
