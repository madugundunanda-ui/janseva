/**
 * State Management Service
 * Manages application state for AI Assistant using RxJS
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface AssistantState {
  sessionId: string | null;
  userId: number | null;
  language: string;
  isListening: boolean;
  isSpeaking: boolean;
  currentIntent: string | null;
  currentWorkflow: string | null;
  workflowId: number | null;
  conversationHistory: ConversationMessage[];
  isAccessibilityEnabled: boolean;
  largeTextMode: boolean;
  highContrastMode: boolean;
  screenReaderEnabled: boolean;
  voiceOnlyMode: boolean;
  lastError: any | null;
  isLoading: boolean;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  inputType: 'text' | 'voice' | 'button';
  content: string;
  language: string;
  timestamp: Date;
  confidence?: number;
  intent?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StateManagementService {
  // Initial state
  private initialState: AssistantState = {
    sessionId: null,
    userId: null,
    language: 'en-IN',
    isListening: false,
    isSpeaking: false,
    currentIntent: null,
    currentWorkflow: null,
    workflowId: null,
    conversationHistory: [],
    isAccessibilityEnabled: false,
    largeTextMode: false,
    highContrastMode: false,
    screenReaderEnabled: false,
    voiceOnlyMode: false,
    lastError: null,
    isLoading: false
  };

  // State subject
  private stateSubject = new BehaviorSubject<AssistantState>(this.initialState);
  public state$ = this.stateSubject.asObservable();

  // Selectors
  public sessionId$ = this.selectState(state => state.sessionId);
  public userId$ = this.selectState(state => state.userId);
  public language$ = this.selectState(state => state.language);
  public isListening$ = this.selectState(state => state.isListening);
  public isSpeaking$ = this.selectState(state => state.isSpeaking);
  public currentIntent$ = this.selectState(state => state.currentIntent);
  public currentWorkflow$ = this.selectState(state => state.currentWorkflow);
  public workflowId$ = this.selectState(state => state.workflowId);
  public conversationHistory$ = this.selectState(state => state.conversationHistory);
  public isAccessibilityEnabled$ = this.selectState(state => state.isAccessibilityEnabled);
  public largeTextMode$ = this.selectState(state => state.largeTextMode);
  public highContrastMode$ = this.selectState(state => state.highContrastMode);
  public screenReaderEnabled$ = this.selectState(state => state.screenReaderEnabled);
  public voiceOnlyMode$ = this.selectState(state => state.voiceOnlyMode);
  public lastError$ = this.selectState(state => state.lastError);
  public isLoading$ = this.selectState(state => state.isLoading);

  constructor() {
    this.loadStateFromStorage();
  }

  /**
   * Get current state
   */
  getState(): AssistantState {
    return this.stateSubject.value;
  }

  /**
   * Update state
   */
  setState(updates: Partial<AssistantState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...updates };
    this.stateSubject.next(newState);
    this.saveStateToStorage();
  }

  /**
   * Set session
   */
  setSession(sessionId: string, userId: number | null = null): void {
    this.setState({
      sessionId,
      userId,
      conversationHistory: []
    });
  }

  /**
   * Set language
   */
  setLanguage(language: string): void {
    this.setState({ language });
  }

  /**
   * Set listening state
   */
  setListening(isListening: boolean): void {
    this.setState({ isListening });
  }

  /**
   * Set speaking state
   */
  setSpeaking(isSpeaking: boolean): void {
    this.setState({ isSpeaking });
  }

  /**
   * Set loading state
   */
  setLoading(isLoading: boolean): void {
    this.setState({ isLoading });
  }

  /**
   * Set current intent
   */
  setCurrentIntent(intent: string | null): void {
    this.setState({ currentIntent: intent });
  }

  /**
   * Set workflow
   */
  setWorkflow(workflowType: string, workflowId: number): void {
    this.setState({
      currentWorkflow: workflowType,
      workflowId: workflowId
    });
  }

  /**
   * Add message to conversation history
   */
  addMessage(message: ConversationMessage): void {
    const history = this.stateSubject.value.conversationHistory;
    history.push(message);
    this.setState({ conversationHistory: [...history] });
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(): void {
    this.setState({ conversationHistory: [] });
  }

  /**
   * Set accessibility options
   */
  setAccessibilityOptions(options: {
    isAccessibilityEnabled?: boolean;
    largeTextMode?: boolean;
    highContrastMode?: boolean;
    screenReaderEnabled?: boolean;
    voiceOnlyMode?: boolean;
  }): void {
    this.setState(options);
  }

  /**
   * Set error
   */
  setError(error: any): void {
    this.setState({ lastError: error });
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.setState({ lastError: null });
  }

  /**
   * Reset state
   */
  resetState(): void {
    this.stateSubject.next(this.initialState);
    localStorage.removeItem('aiAssistantState');
  }

  /**
   * Create selector
   */
  private selectState<T>(selector: (state: AssistantState) => T): Observable<T> {
    return new Observable(observer => {
      const subscription = this.state$.subscribe(state => {
        observer.next(selector(state));
      });
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Save state to local storage
   */
  private saveStateToStorage(): void {
    try {
      const state = this.stateSubject.value;
      // Don't persist large conversation history
      const stateToPersist = {
        ...state,
        conversationHistory: []
      };
      localStorage.setItem('aiAssistantState', JSON.stringify(stateToPersist));
    } catch (error) {
      console.warn('Failed to save state to storage:', error);
    }
  }

  /**
   * Load state from local storage
   */
  private loadStateFromStorage(): void {
    try {
      const savedState = localStorage.getItem('aiAssistantState');
      if (savedState) {
        const state = JSON.parse(savedState);
        // Merge with initial state to ensure all properties exist
        const mergedState = { ...this.initialState, ...state };
        this.stateSubject.next(mergedState);
      }
    } catch (error) {
      console.warn('Failed to load state from storage:', error);
    }
  }
}
