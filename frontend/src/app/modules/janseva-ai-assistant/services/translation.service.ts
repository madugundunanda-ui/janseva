/**
 * Translation Service
 * Handles multilingual support for JanSeva AI Assistant
 */

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  locale: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  // Supported languages
  private readonly SUPPORTED_LANGUAGES: { [key: string]: LanguageConfig } = {
    'en-IN': {
      code: 'en-IN',
      name: 'English',
      nativeName: 'English (India)',
      direction: 'ltr',
      locale: 'en-IN'
    },
    'te-IN': {
      code: 'te-IN',
      name: 'Telugu',
      nativeName: 'తెలుగు',
      direction: 'ltr',
      locale: 'te-IN'
    },
    'ta-IN': {
      code: 'ta-IN',
      name: 'Tamil',
      nativeName: 'தமிழ்',
      direction: 'ltr',
      locale: 'ta-IN'
    },
    'kn-IN': {
      code: 'kn-IN',
      name: 'Kannada',
      nativeName: 'ಕನ್ನಡ',
      direction: 'ltr',
      locale: 'kn-IN'
    }
  };

  // Current language
  private currentLanguageSubject = new BehaviorSubject<string>('en-IN');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  // Language locked state (no mixing)
  private languageLockedSubject = new BehaviorSubject<boolean>(false);
  public languageLocked$ = this.languageLockedSubject.asObservable();

  constructor(private translateService: TranslateService) {
    this.initializeTranslations();
  }

  /**
   * Initialize translation configuration
   */
  private initializeTranslations(): void {
    // Add languages to ngx-translate
    const languages = Object.keys(this.SUPPORTED_LANGUAGES);
    this.translateService.addLangs(languages);
    this.translateService.setDefaultLang('en-IN');
    this.translateService.use('en-IN');
  }

  /**
   * Switch language
   */
  switchLanguage(languageCode: string): void {
    if (!this.isLanguageSupported(languageCode)) {
      console.warn(`Language ${languageCode} not supported`);
      return;
    }

    this.currentLanguageSubject.next(languageCode);
    this.translateService.use(languageCode);

    // Update document language
    document.documentElement.lang = languageCode;

    // Update text direction
    const config = this.SUPPORTED_LANGUAGES[languageCode];
    document.documentElement.dir = config.direction;

    // Store preference
    localStorage.setItem('preferredLanguage', languageCode);
  }

  /**
   * Lock language (prevent switching)
   */
  lockLanguage(languageCode: string): void {
    this.switchLanguage(languageCode);
    this.languageLockedSubject.next(true);
    localStorage.setItem('languageLocked', 'true');
    localStorage.setItem('lockedLanguage', languageCode);
  }

  /**
   * Unlock language
   */
  unlockLanguage(): void {
    this.languageLockedSubject.next(false);
    localStorage.removeItem('languageLocked');
  }

  /**
   * Check if language is locked
   */
  isLanguageLocked(): boolean {
    return this.languageLockedSubject.value;
  }

  /**
   * Get locked language
   */
  getLockedLanguage(): string | null {
    return localStorage.getItem('lockedLanguage');
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  /**
   * Get language configuration
   */
  getLanguageConfig(languageCode: string): LanguageConfig | null {
    return this.SUPPORTED_LANGUAGES[languageCode] || null;
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return Object.values(this.SUPPORTED_LANGUAGES);
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return !!this.SUPPORTED_LANGUAGES[languageCode];
  }

  /**
   * Translate key
   */
  translate(key: string, params?: any): Observable<string> {
    return new Observable(observer => {
      this.translateService.get(key, params).subscribe(
        (translation: string) => {
          observer.next(translation);
          observer.complete();
        },
        (error: any) => {
          console.error(`Translation error for key: ${key}`, error);
          observer.next(key); // Fallback to key if translation fails
          observer.complete();
        }
      );
    });
  }

  /**
   * Instant translate (synchronous)
   */
  instant(key: string, params?: any): string {
    return this.translateService.instant(key, params);
  }

  /**
   * Get translation value for display
   */
  get(key: string, params?: any): Observable<string> {
    return this.translateService.get(key, params);
  }

  /**
   * Load language translations
   */
  loadLanguageTranslations(languageCode: string): Observable<any> {
    return this.translateService.get(languageCode);
  }

  /**
   * Validate language doesn't mix with current language
   * Throws error if language mismatch detected
   */
  validateLanguageConsistency(detectedLanguage: string, confidence: number): boolean {
    if (this.languageLockedSubject.value) {
      const currentLang = this.currentLanguageSubject.value;
      
      // Allow some tolerance for confidence
      if (detectedLanguage !== currentLang && confidence > 0.8) {
        console.warn(`Language mismatch: Detected ${detectedLanguage}, but locked to ${currentLang}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get localized message
   */
  getLocalizedMessage(messageKey: string, language?: string): string {
    const lang = language || this.currentLanguageSubject.value;
    const messages = this.getLanguageMessages(lang);
    return messages[messageKey] || messageKey;
  }

  /**
   * Get language-specific messages
   */
  private getLanguageMessages(language: string): { [key: string]: string } {
    const messages: { [key: string]: { [key: string]: string } } = {
      'en-IN': {
        'no_voice_detected': 'No voice detected. Please speak clearly.',
        'speech_recognition_error': 'Unable to understand. Please try again.',
        'microphone_denied': 'Microphone access denied. Please allow access to use voice input.',
        'language_mismatch': 'Language mismatch detected. Please speak in the selected language.',
        'similar_complaints_found': 'Similar complaints found. Consider joining existing complaint.',
        'ai_analysis_timeout': 'AI analysis taking longer than expected. You can proceed manually.',
        'switching_to_text': 'Switching to text input mode.',
        'please_speak': 'Please speak now...',
        'listening': 'Listening...',
        'processing': 'Processing your request...',
        'fallback_message': 'Sorry, I can only assist with government-related services.'
      },
      'te-IN': {
        'no_voice_detected': 'వాయిస్ కనబడలేదు. దయచేసి స్పష్టంగా మాట్లాడండి.',
        'speech_recognition_error': 'అర్థం చేసుకోలేనేను. దయచేసి మళ్లీ ప్రయత్నించండి.',
        'microphone_denied': 'మైక్రోఫోన్ ప్రాప్తి నిరాకరించబడింది. వాయిస్ ఇన్‌పుట్ ఉపయోగించటానికి అనుమతిని ఇవ్వండి.',
        'language_mismatch': 'భాష సరిపోలలేదు. దయచేసి ఎంచుకున్న భాషలో మాట్లాడండి.',
        'similar_complaints_found': 'సారూప్య ఫిర్యాదులు కనుగొనబడ్డాయి. ఇప్పటికే ఉన్న ఫిర్యాదుకు చేరటానికి పరిగణించండి.',
        'ai_analysis_timeout': 'AI విశ్లేషణ ఆశించిన కంటే ఎక్కువ సమయం పడుతోంది. మీరు మానవీయంగా ముందుకు సాగవచ్చు.',
        'switching_to_text': 'టెక్స్ట్ ఇన్‌పుట్ మోడ్‌కు మార్పు చేయుతోంది.',
        'please_speak': 'దయచేసి ఇప్పుడు మాట్లాడండి...',
        'listening': 'వింటోంది...',
        'processing': 'మీ అభ్యర్థనను ప్రక్రియ చేస్తోంది...',
        'fallback_message': 'క్షమించండి, నేను ప్రభుత్వ సంబంధిత సేవలకు మాత్రమే సహాయం చేయగలను.'
      },
      'ta-IN': {
        'no_voice_detected': 'ஒலி கண்டறியப்படவில்லை. தயவுசெய்து தெளிவாக பேசுங்கள்.',
        'speech_recognition_error': 'புரிந்துகொள்ள முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
        'microphone_denied': 'மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டுள்ளது. ஒலி உள்ளீட்டைப் பயன்படுத்த அனுமதி கொடுக்கவும்.',
        'language_mismatch': 'மொழி பொருத்தம் கண்டறியப்பட்டது. தயவுசெய்து தேர்ந்தெடுக்கப்பட்ட மொழியில் பேசுங்கள்.',
        'similar_complaints_found': 'ஒத்த புகார்கள் கண்டறியப்பட்டுள்ளன. বিদ்யமான புகாரில் சேரவும் பரிசீலிக்கவும்.',
        'ai_analysis_timeout': 'AI பகுப்பாய்வு எதிர்பார்த்ததை விட அதிக நேரம் எடுத்துக்கொண்டிருக்கிறது. நீங்கள் கையால் முன்னேறலாம்.',
        'switching_to_text': 'உரை உள்ளீட்டு பயன்முறைக்கு மாறுதல்.',
        'please_speak': 'தயவுசெய்து இப்போது பேசுங்கள்...',
        'listening': 'கேட்டுக்கொண்டிருக்கிறது...',
        'processing': 'உங்கள் கோரிக்கையை செயல்படுத்துகிறது...',
        'fallback_message': 'மன்னிக்கவும், நான் அரசு சார்ந்த சேவைகளுக்கு மட்டுமே உதவ முடியும்.'
      },
      'kn-IN': {
        'no_voice_detected': 'ವಾಯ್ಸ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ.',
        'speech_recognition_error': 'ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.',
        'microphone_denied': 'ಮೈಕ್ರೋಫೋನ್ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ. ವಾಯ್ಸ್ ಇನ್‌ಪುಟ್ ಬಳಸಲು ಅನುಮತಿ ನೀಡಿ.',
        'language_mismatch': 'ಭಾಷೆಯ ಅಸಿರಿದ್ಧ ಕಂಡುಬಂದಿದೆ. ದಯವಿಟ್ಟು ಆಯ್ಕೆಮಾಡಿದ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ.',
        'similar_complaints_found': 'ಸದೃಶ ಮನವಿಗಳು ಕಂಡುಬಂದಿವೆ. ಅಸ್ತಿತ್ವದ ಮನವಿಗೆ ಸೇರಲು ಪರಿಗಣಿಸಿ.',
        'ai_analysis_timeout': 'AI ವಿಶ್ಲೇಷಣೆ ನಿರೀಕ್ಷೆಗಿಂತ ಹೆಚ್ಚು ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದೆ. ನೀವು ಹಸ್ತಚಾಲಿತವಾಗಿ ಮುಂದುವರಿಯಬಹುದು.',
        'switching_to_text': 'ಪಠ್ಯ ಇನ್‌ಪುಟ್ ಕ್ರಮಕ್ಕೆ ಬದಲಾಯಿಸುತ್ತಿದೆ.',
        'please_speak': 'ದಯವಿಟ್ಟು ಈಗ ಮಾತನಾಡಿ...',
        'listening': 'ಕೇಳುತ್ತಿದೆ...',
        'processing': 'ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆ ಮಾಡುತ್ತಿದೆ...',
        'fallback_message': 'ಕ್ಷಮಿಸಿ, ನಾನು ಸರ್ಕಾರ ಸಂಬಂಧಿತ ಸೇವೆಗಳಿಗೆ ಮಾತ್ರ ಸಹಾಯ ಮಾಡಬಹುದು.'
      }
    };

    return messages[language] || messages['en-IN'];
  }

  /**
   * Format date according to language locale
   */
  formatDate(date: Date, language?: string): string {
    const lang = language || this.currentLanguageSubject.value;
    const config = this.SUPPORTED_LANGUAGES[lang];
    return date.toLocaleDateString(config.locale);
  }

  /**
   * Format time according to language locale
   */
  formatTime(date: Date, language?: string): string {
    const lang = language || this.currentLanguageSubject.value;
    const config = this.SUPPORTED_LANGUAGES[lang];
    return date.toLocaleTimeString(config.locale);
  }
}
