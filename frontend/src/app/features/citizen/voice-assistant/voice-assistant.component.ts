import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';
import { ComplaintsService } from '../../../core/services/complaints.service';
import { UpdatesService } from '../../../core/services/updates.service';
import { ApiService } from '../../../core/services/api.service';
import { AiService } from '../../../core/services/ai.service';

interface Message {
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
  status?: string;
  jobId?: string;
  complaintDetails?: any;
  updateDetails?: any[];
  emergencyDetails?: boolean;
}

@Component({
  selector: 'app-voice-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Bubble Launcher -->
    <div class="fixed bottom-6 right-6 z-50">
      <button (click)="toggleChat()" 
              class="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.65)] hover:scale-105 transition-all duration-300 cursor-pointer relative group">
        @if (voiceRecognizing) {
          <div class="w-full h-full rounded-full border border-cyan-400 animate-ping absolute opacity-70"></div>
        }
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span class="absolute bottom-16 right-0 bg-[#0d1527]/90 text-cyan-400 text-[9px] font-mono tracking-wider px-2 py-1 rounded border border-cyan-500/35 uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          JANSEVA CO-PILOT
        </span>
      </button>
    </div>

    <!-- Chat Console Drawer -->
    @if (isOpen) {
      <div class="fixed right-6 bottom-24 w-[420px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[80vh] rounded-2xl glass-panel border border-cyan-500/30 bg-[#0d1527]/95 shadow-[0_0_40px_rgba(0,0,0,0.6)] z-50 flex flex-col overflow-hidden transition-all duration-300">
        
        <!-- Header -->
        <header class="p-4 border-b border-cyan-500/20 bg-cyan-950/20 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-5 h-5 rounded-full border border-cyan-500/40 flex items-center justify-center bg-cyan-950/40">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            </div>
            <span class="font-mono text-xs tracking-wider uppercase font-bold text-glow text-white">
              JANSEVA <span class="text-cyan-400">AI CO-PILOT</span>
            </span>
          </div>

          <div class="flex items-center gap-3">
            @if (languageLocked) {
              <span class="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 font-mono text-[9px] text-cyan-400 uppercase">
                LOCK: {{ activeLang.toUpperCase() }}
              </span>
            }
            <button (click)="toggleChat()" class="text-muted-var hover:text-primary-var font-mono text-xs uppercase cursor-pointer text-gray-400">
              [CLOSE]
            </button>
          </div>
        </header>

        <!-- Message Stack Area -->
        <div class="flex-1 p-4 space-y-4 overflow-y-auto font-mono text-[10px] text-gray-300" #messageArea>
          
          <!-- Welcome Message -->
          @if (!languageLocked) {
            <div class="space-y-4">
              <div class="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/10 text-primary-var uppercase leading-relaxed">
                🤖 WELCOME TO JANSEVA GOVERNANCE ASSISTANT. PLEASE CHOOSE A LANGUAGE TO PROCEED / జనసేవ సహాయకుడికి స్వాగతం. దయచేసి ఒక భాషను ఎంచుకోండి.
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button (click)="selectLanguage('en')" class="px-3 py-2 rounded-lg border border-var hover:border-cyan-500/50 bg-white/2 hover:bg-cyan-500/5 transition-all text-xs font-bold text-primary-var cursor-pointer text-white">ENGLISH</button>
                <button (click)="selectLanguage('te')" class="px-3 py-2 rounded-lg border border-var hover:border-cyan-500/50 bg-white/2 hover:bg-cyan-500/5 transition-all text-xs font-bold text-primary-var cursor-pointer text-white">తెలుగు (TELUGU)</button>
                <button (click)="selectLanguage('ta')" class="px-3 py-2 rounded-lg border border-var hover:border-cyan-500/50 bg-white/2 hover:bg-cyan-500/5 transition-all text-xs font-bold text-primary-var cursor-pointer text-white">தமிழ் (TAMIL)</button>
                <button (click)="selectLanguage('kn')" class="px-3 py-2 rounded-lg border border-var hover:border-cyan-500/50 bg-white/2 hover:bg-cyan-500/5 transition-all text-xs font-bold text-primary-var cursor-pointer text-white">ಕನ್ನಡ (KANNADA)</button>
              </div>
            </div>
          }

          <!-- Conversational Dialogue -->
          @for (msg of messages; track $index) {
            <div class="flex flex-col" [class.items-end]="msg.sender === 'user'" [class.items-start]="msg.sender === 'bot'">
              
              <!-- Message Bubble -->
              <div class="max-w-[85%] p-3.5 rounded-xl border uppercase leading-relaxed" 
                   [ngClass]="{
                     'bg-[#A33F93]/10 border-[#A33F93]/30 text-white rounded-br-none': msg.sender === 'user',
                     'bg-cyan-950/10 border-cyan-500/20 text-cyan-300 rounded-bl-none': msg.sender === 'bot'
                   }">
                {{ msg.text }}

                <!-- Custom Workflow Elements -->
                @if (msg.status === 'menu') {
                  <div class="mt-3.5 flex flex-col gap-1.5 w-full">
                    <button (click)="triggerIntent('Raise Complaint')" class="w-full text-left px-3 py-2 rounded border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-400 font-bold tracking-wide transition-colors cursor-pointer">{{ getMenuLabel('Raise Complaint') }}</button>
                    <button (click)="triggerIntent('Track Complaint')" class="w-full text-left px-3 py-2 rounded border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-400 font-bold tracking-wide transition-colors cursor-pointer">{{ getMenuLabel('Track Complaint') }}</button>
                    <button (click)="triggerIntent('Government Updates')" class="w-full text-left px-3 py-2 rounded border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-400 font-bold tracking-wide transition-colors cursor-pointer">{{ getMenuLabel('Government Updates') }}</button>
                    <button (click)="triggerIntent('Emergency Help')" class="w-full text-left px-3 py-2 rounded border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-400 font-bold tracking-wide transition-colors cursor-pointer">{{ getMenuLabel('Emergency Help') }}</button>
                  </div>
                }

                @if (msg.status === 'awaiting_image') {
                  <div class="mt-4 p-3 rounded-lg border border-dashed border-cyan-500/30 bg-white/2 hover:bg-white/5 flex flex-col items-center justify-center cursor-pointer"
                       (click)="botFileInput.click()">
                    <input #botFileInput type="file" (change)="onBotFileSelected($event)" (click)="$event.stopPropagation()" class="hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-cyan-400 mb-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-[8px] text-muted-var uppercase">CLICK TO SELECT IMAGE PROOF</span>
                  </div>
                }

                @if (msg.jobId && chatbotJobProgress !== null) {
                  <div class="mt-3.5 p-3 rounded border border-cyan-500/20 bg-cyan-950/20 space-y-2 text-[8px] uppercase">
                    <div class="flex justify-between font-bold text-white">
                      <span>AI Pipeline Status:</span>
                      <span>{{ chatbotJobProgress }}%</span>
                    </div>
                    <div class="space-y-1 text-muted-var text-gray-400">
                      <div class="flex justify-between"><span>✓ Upload Success</span><span class="text-cyan-400">DONE</span></div>
                      <div class="flex justify-between"><span>{{ chatbotJobProgress >= 40 ? '✓' : '●' }} Visual Classification</span><span [class.text-cyan-400]="chatbotJobProgress >= 40">{{ chatbotJobProgress >= 40 ? 'DONE' : 'RUNNING' }}</span></div>
                      <div class="flex justify-between"><span>{{ chatbotJobProgress >= 70 ? '✓' : '●' }} Severity Indexing</span><span [class.text-cyan-400]="chatbotJobProgress >= 70">{{ chatbotJobProgress >= 70 ? 'DONE' : 'RUNNING' }}</span></div>
                      <div class="flex justify-between"><span>{{ chatbotJobProgress >= 90 ? '✓' : '●' }} Duplicate Check</span><span [class.text-cyan-400]="chatbotJobProgress >= 90">{{ chatbotJobProgress >= 90 ? 'DONE' : 'RUNNING' }}</span></div>
                    </div>
                  </div>
                }

                @if (msg.status === 'confirm_details' && tempComplaintData) {
                  <div class="mt-4 p-3 rounded-lg border border-cyan-500/25 bg-cyan-950/15 space-y-2.5 text-[8px] text-primary-var">
                    <div>TITLE: <span class="font-bold text-white">{{ tempComplaintData.title || 'CIVIC ISSUE' }}</span></div>
                    <div>DEPT: <span class="font-bold text-white">{{ tempComplaintData.departmentName }}</span></div>
                    <div>SEVERITY: <span class="font-bold text-red-400">{{ tempComplaintData.priority }} (SCORE: {{ tempComplaintData.severityScore }})</span></div>
                    <div>ETA: <span class="font-bold text-emerald-400">{{ tempComplaintData.estimatedDays }} DAYS</span></div>
                    
                    <div class="pt-2 flex gap-2">
                      <button (click)="submitBotComplaint()" class="flex-1 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase transition-colors cursor-pointer">CONFIRM SUBMIT</button>
                      <button (click)="cancelBotComplaint()" class="px-2.5 py-1.5 rounded border border-var hover:bg-white/5 text-primary-var uppercase text-white cursor-pointer">CANCEL</button>
                    </div>
                  </div>
                }

                @if (msg.updateDetails && msg.updateDetails.length > 0) {
                  <div class="mt-3.5 space-y-3">
                    @for (upd of msg.updateDetails; track upd.id) {
                      <div class="p-3 rounded border border-white/5 bg-white/2 space-y-1.5 text-[8px] uppercase">
                        <div class="flex justify-between text-cyan-400 font-bold">
                          <span>{{ upd.department }}</span>
                          <span>{{ upd.timestamp | date:'shortDate' }}</span>
                        </div>
                        <p class="text-primary-var font-semibold text-white">{{ upd.message }}</p>
                      </div>
                    }
                  </div>
                }

                @if (msg.emergencyDetails) {
                  <div class="mt-3.5 p-3 rounded border border-red-500/35 bg-red-950/20 text-red-400 space-y-2.5">
                    <div class="font-bold">🚨 EMERGENCY RESPONSE DIAL:</div>
                    <a href="tel:112" class="block w-full text-center py-2 rounded bg-red-500 hover:bg-red-400 text-black font-bold uppercase tracking-wider transition-colors">CALL HOTLINE 112</a>
                    <a href="tel:18004251111" class="block w-full text-center py-2 rounded border border-red-500/40 hover:bg-red-900/10 text-red-400 font-bold uppercase transition-colors">CALL WARD ASSISTANCE</a>
                  </div>
                }
              </div>

              <!-- Message Timestamp -->
              <span class="text-[8px] text-muted-var mt-1 text-gray-500">{{ msg.timestamp | date:'shortTime' }}</span>
            </div>
          }

          <!-- Micro-animation speaker indicator -->
          @if (botIsSpeaking) {
            <div class="flex items-center gap-1.5 p-2 rounded bg-cyan-500/5 border border-cyan-500/10 max-w-[150px]">
              <span class="text-[8px] text-cyan-400 animate-pulse">Assistant Speaking</span>
              <div class="flex gap-0.5 items-end h-3">
                <div class="w-0.5 bg-cyan-400 animate-sound-bar-1 h-3"></div>
                <div class="w-0.5 bg-cyan-400 animate-sound-bar-2 h-1.5"></div>
                <div class="w-0.5 bg-cyan-400 animate-sound-bar-3 h-2.5"></div>
              </div>
            </div>
          }
        </div>

        <!-- Chat Input Footer -->
        @if (languageLocked) {
          <footer class="p-3 border-t border-cyan-500/20 bg-cyan-950/20 flex gap-2 items-center shrink-0">
            <input type="text" 
                   [(ngModel)]="userInputText"
                   (keyup.enter)="sendTextMessage()"
                   [disabled]="voiceRecognizing || chatbotJobProgress !== null"
                   class="flex-1 glass-input !py-2 !px-3 font-mono text-[10px] uppercase text-primary-var outline-none bg-black text-white border border-white/10 rounded" 
                   placeholder="SPEAK OR TYPE HERE...">

            <button (click)="toggleVoiceListening()" 
                    [disabled]="chatbotJobProgress !== null"
                    [class.bg-red-950/30]="voiceRecognizing"
                    [class.border-red-500/40]="voiceRecognizing"
                    [class.text-red-400]="voiceRecognizing"
                    [class.animate-pulse]="voiceRecognizing"
                    class="p-2.5 rounded-xl border border-cyan-500/30 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/30 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            <button (click)="sendTextMessage()"
                    [disabled]="voiceRecognizing || chatbotJobProgress !== null"
                    class="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase transition-colors cursor-pointer text-[10px]">
              SEND
            </button>
          </footer>
        }

      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    @keyframes soundwave-1 {
      0%, 100% { height: 4px; }
      50% { height: 12px; }
    }
    @keyframes soundwave-2 {
      0%, 100% { height: 10px; }
      50% { height: 3px; }
    }
    @keyframes soundwave-3 {
      0%, 100% { height: 6px; }
      50% { height: 11px; }
    }
    .animate-sound-bar-1 { animation: soundwave-1 0.6s ease-in-out infinite; }
    .animate-sound-bar-2 { animation: soundwave-2 0.7s ease-in-out infinite; }
    .animate-sound-bar-3 { animation: soundwave-3 0.5s ease-in-out infinite; }
  `]
})
export class VoiceAssistantComponent implements OnInit, OnDestroy {
  isOpen = false;
  languageLocked = false;
  activeLang: 'en' | 'te' | 'ta' | 'kn' = 'en';

  messages: Message[] = [];
  userInputText = '';
  voiceRecognizing = false;
  botIsSpeaking = false;

  private recognition: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private consecutiveFailures = 0;

  private chatbotState: 'idle' | 'awaiting_intent' | 'raise_awaiting_image' | 'raise_awaiting_description' | 'raise_confirm' | 'track_awaiting_id' = 'idle';

  tempComplaintFile: File | null = null;
  tempComplaintData: any = null;
  chatbotJobProgress: number | null = null;
  private aiStreamSub: any = null;

  private readonly LOCALIZED_PROMPTS: Record<string, Record<string, string>> = {
    WELCOME: {
      en: "Select a menu option or speak your request.",
      te: "దయచేసి ఒక మెను ఎంపికను చెప్పండి లేదా మీ సమస్యను చెప్పండి.",
      ta: "தயவுசெய்து ஒரு மெனுவை தேர்வு செய்யவும் அல்லது உங்கள் கோரிக்கையை கூறவும்.",
      kn: "ದಯವಿಟ್ಟು ಮೆನುವಿನಿಂದ ಆಯ್ಕೆ ಮಾಡಿ ಅಥವಾ ನಿಮ್ಮ ದೂರು ತಿಳಿಸಿ."
    },
    MENU_OPTIONS: {
      en: "You can say: Raise Complaint, Track Complaint, Government Updates, or Emergency Help.",
      te: "మీరు చెప్పవచ్చు: ఫిర్యాదు నమోదు చేయండి, ఫిర్యాదు స్థితి తెలుసుకోండి, ప్రభుత్వ అప్డేట్లు, అత్యవసర సహాయం.",
      ta: "நீங்கள் கூறலாம்: புகார் அளிக்கவும், புகாரைக் கண்கಾಣிக்கவும், அரசு அறிவிப்புகள், அவசர உதவி.",
      kn: "ನೀವು ಹೇಳಬಹುದು: ದೂರು ನೋಂದಾಯಿಸಿ, ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ, ಸರ್ಕಾರದ ಅಪ್ಡೇಟ್ಗಳು, ತುರ್ತು ಸಹಾಯ."
    },
    REFUSAL: {
      en: "Sorry, I can only help with government-related services. Please choose:\n\nRaise Complaint\nTrack Complaint\nGovernment Updates\nEmergency Help.",
      te: "క్షమించండి. నేను ప్రభుత్వ సేవలకు సంబంధించిన సహాయం మాత్రమే చేయగలను. దయచేసి ఎంపికను చెప్పండి:\n\nఫిర్యాదు నమోదు చేయండి\nఫిర్యాదు స్థితి తెలుసుకోండి\nప్రభుత్వ అప్డేట్లు\nఅత్యవసర సహాయం.",
      ta: "மன்னிக்கவும். அரசு சேவைகள் தொடர்பான உதவிகளை மட்டுமே வழங்க முடியும். தயவுசெய்து தேர்வு செய்யவும்:\n\nபுகார் அளிக்கவும்\nபுகாரைக் கண்கಾಣிக்கவும்\nஅரசு அறிவிப்புகள்\nஅவசர உதவி.",
      kn: "ಕ್ಷಮಿಸಿ. ನಾನು ಸರ್ಕಾರದ ಸೇವೆಗಳ ಸಹಾಯವನ್ನು ಮಾತ್ರ ನೀಡಬಹುದು. ದಯವಿಟ್ಟು ಆಯ್ಕೆಮಾಡಿ:\n\nದೂರು ನೋಂದಾಯಿಸಿ\nದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ\nಸರ್ಕಾರದ ಅಪ್ಡೇಟ್ಗಳು\nತುರ್ತು ಸಹಾಯ."
    },
    RAISE_START: {
      en: "Let's raise a new complaint. Please click or select the image proof of the issue first.",
      te: "కొత్త ఫిర్యాదును నమోదు చేద్దాం. దయచేసి మొదటగా సమస్య ఫోటోను సమర్పించండి.",
      ta: "புதிய புகாரை பதிவு செய்வோம். முதலில் பிரச்சனை தொடர்பான புகைப்படத்தை சமர்ப்பிக்கவும்.",
      kn: "ಹೊಸ ದೂರನ್ನು ನೋಂದಾಯಿಸೋಣ. ದಯವಿಟ್ಟು ಮೊದಲು ಸಮಸ್ಯೆಯ ಫೋಟೋವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ."
    },
    UPLOAD_SUCCESS: {
      en: "✓ Image uploaded successfully. AI is analyzing in the background. While we wait, please speak or type a short description of the issue.",
      te: "✓ చిత్రం విజయవంతంగా అప్‌లోడ్ చేయబడింది. నేపధ్యంలో AI విశ్లేషణ జరుగుతోంది. దయచేసి సమస్య గురించిన చిన్న వివరణను చెప్పండి లేదా టైప్ చేయండి.",
      ta: "✓ படம் வெற்றிகரமாக பதிவேற்றப்பட்டது. பின்புலத்தில் AI பகுப்பாய்வு செய்கிறது. தயவுசெய்து பிரச்சனை குறித்த ஒரு சிறிய விளக்கத்தை கூறவும்.",
      kn: "✓ ಫೋಟೋ ಯಶಸ್ವಿಯಾಗಿ ಅಪ್ಲೋಡ್ ಆಗಿದೆ. ಹಿನ್ನೆಲೆಯಲ್ಲಿ AI ವಿಶ್ಲೇಷಣೆ ನಡೆಸುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಸಮಸ್ಯೆಯ ಸಣ್ಣ ವಿವರಣೆಯನ್ನು ಹೇಳಿ ಅಥವಾ ಬರೆಯಿರಿ."
    },
    AI_COMPLETE: {
      en: "AI analysis is complete. Detected department is {dept} with {priority} priority. Do you want to submit this complaint now?",
      te: "AI విశ్లేషణ పూర్తయింది. గుర్తించబడిన విభాగం: {dept}, ప్రాధాన్యత: {priority}. ఈ ఫిర్యాదును సమర్పించాలనుకుంటున్నారా?",
      ta: "AI பகுப்பாய்வு முடிந்தது. கண்டறியப்பட்ட துறை: {dept}, முன்னுரிமை: {priority}. இந்த புகாரை சமர்ப்பிக்க விரும்புகிறீರಾ?",
      kn: "AI ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಪತ್ತೆಯಾದ ಇಲಾಖೆ: {dept}, ಆದ್ಯತೆ: {priority}. ಈ ದೂರನ್ನು ಸಲ್ಲಿಸಲು ಬಯಸುವಿರಾ?"
    },
    SUBMIT_SUCCESS: {
      en: "Complaint submitted successfully! Your Ticket ID is {id}. You can track this status anytime.",
      te: "ఫిర్యాదు విజయవంతంగా సమర్పించబడింది! మీ టికెట్ ఐడి: {id}. దీని స్థితిని ఎప్పుడైనా తెలుసుకోవచ్చు.",
      ta: "புகார் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது! உங்கள் டிக்கெட் ஐடி: {id}. இதன் நிலையை எப்போது வேண்டுமானாலும் கண்காணிக்கலாம்.",
      kn: "ದೂರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ! ನಿಮ್ಮ ಟಿಕೆಟ್ ಐಡಿ: {id}. ಇದರ ಸ್ಥಿತಿಯನ್ನು ಯಾವಾಗ ಬೇಕಾದರೂ ಪರಿಶೀಲಿಸಬಹುದು."
    },
    CANCELLED: {
      en: "Complaint draft cancelled. Returning to main menu.",
      te: "ఫిర్యాదు రద్దు చేయబడింది. ప్రధాన మెనూకి తిరిగి వెళ్తున్నాము.",
      ta: "புகார் வரைவு ರத்து செய்யப்பட்டது. முதன்மை மெனுவிற்கு திரும்புகிறது.",
      kn: "ದೂರಿನ ಕರಡು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ. ಮುಖ್ಯ ಮೆನುಗೆ ಹಿಂತಿರುಗುತ್ತಿದ್ದೇವೆ."
    },
    TRACK_START: {
      en: "Please speak or type your Complaint ID to track status.",
      te: "స్థితిని తెలుసుకోవడానికి దయచేసి మీ ఫిర్యాదు ఐడిని చెప్పండి లేదా టైప్ చేయండి.",
      ta: "புகாரின் நிலையை கண்காணிக்க தயவுசெய்து புகாரின் ஐடியை கூறவும் அல்லது எழுதவும்.",
      kn: "ಸ್ಥಿತಿಯನ್ನು ತಿಳಿಯಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ದೂರಿನ ಐಡಿಯನ್ನು ಹೇಳಿ ಅಥವಾ ಬರೆಯಿರಿ."
    },
    TRACK_NOT_FOUND: {
      en: "Sorry, I could not find a complaint with ID {id}. Please try again.",
      te: "క్షమించండి, {id} ఐడితో ఏ ఫిర్యాదు కనుగొనబడలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.",
      ta: "மன்னிக்கவும், {id} ஐடியுடன் எந்த புகாரும் கண்டறியப்படவில்லை. மீண்டும் முயற்சிக்கவும்.",
      kn: "ಕ್ಷಮಿಸಿ, {id} ಐಡಿಯೊಂದಿಗೆ ಯಾವುದೇ ದೂರು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ."
    },
    TRACK_FOUND: {
      en: "Your complaint for {title} is currently {status}.",
      te: "{title} కి సంబంధించిన మీ ఫిర్యాదు ప్రస్తుతం {status} స్థితిలో ఉంది.",
      ta: "{title} தொடர்பான உங்கள் புகாரின் தற்போதைய நிலை: {status}.",
      kn: "{title} ಗೆ ಸಂಬಂಧಿಸಿದ ನಿಮ್ಮ ದೂರು ಪ್ರಸ್ತುತ {status} ಸ್ಥಿತಿಯಲ್ಲಿದೆ."
    },
    UPDATES_START: {
      en: "Here are the top recent government updates:",
      te: "ఇటీవలి ప్రధాన ప్రభుత్వ సమాచారం ఇక్కడ ఉంది:",
      ta: "அண்மைக்கால முக்கிய அரசு அறிவிப்புகள் பின்வருமாறு:",
      kn: "ಇತ್ತೀಚಿನ ಪ್ರಮುಖ ಸರ್ಕಾರಿ ಅಪ್ಡೇಟ್ಗಳು ಇಲ್ಲಿವೆ:"
    },
    EMERGENCY_START: {
      en: "For emergency help, please call 112 immediately.",
      te: "అత్యవసర సహాయం కోసం దయచేసి వెంటనే 112 కి కాల్ చేయండి.",
      ta: "அவசர உதவிக்கு தயவுசெய்து உடனடியாக 112 ஐ அழைக்கவும்.",
      kn: "ತುರ್ತು ಸಹಾಯಕ್ಕಾಗಿ ದಯವಿಟ್ಟು ತಕ್ಷಣ 112 ಗೆ ಕರೆ ಮಾಡಿ."
    },
    MIC_RETRY: {
      en: "I didn't catch that. Please repeat or choose menu options manually.",
      te: "నాకు అర్థం కాలేదు. దయచేసి మళ్ళీ చెప్పండి లేదా మాన్యువల్‌గా ఎంచుకోండి.",
      ta: "எனకు புரியவில்லை. தயவுசெய்து மீண்டும் கூறவும் அல்லது கைமுறையாக தேர்வு செய்யவும்.",
      kn: "ನನಗೆ ಸರಿಯಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ ಅಥವಾ ಹಸ್ತಚಾಲಿತವಾಗಿ ಆಯ್ಕೆಮಾಡಿ."
    }
  };

  private readonly MENU_LABELS: Record<string, Record<string, string>> = {
    'Raise Complaint': { en: 'Raise Complaint', te: 'ఫిర్యాదు నమోదు చేయండి', ta: 'புகார் அளிக்கவும்', kn: 'ದೂರು ನೋಂದಾಯಿಸಿ' },
    'Track Complaint': { en: 'Track Complaint', te: 'ఫిర్యాదు స్థితి తెలుసుకోండి', ta: 'புகாரைக் கண்கಾಣிக்கவும்', kn: 'ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ' },
    'Government Updates': { en: 'Government Updates', te: 'ప్రభుత్వ అప్డేట్లు', ta: 'அರசு அறிவிப்புகள்', kn: 'ಸರ್ಕಾರದ ಅಪ್ಡೇಟ್ಗಳು' },
    'Emergency Help': { en: 'Emergency Help', te: 'అత్యవసర సహాయం', ta: 'அவசர உதவி', kn: 'ತುರ್ತು ಸಹಾಯ' }
  };

  public translationService = inject(TranslationService);
  private complaintsService = inject(ComplaintsService);
  private updatesService = inject(UpdatesService);
  private apiService = inject(ApiService);
  private aiService = inject(AiService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.initSpeechRecognition();
  }

  ngOnDestroy(): void {
    this.stopSpeaking();
    if (this.recognition) {
      this.recognition.abort();
    }
    if (this.aiStreamSub) {
      this.aiStreamSub.unsubscribe();
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      this.botIsSpeaking = false;
      this.languageLocked = false;
    }
  }

  selectLanguage(lang: 'en' | 'te' | 'ta' | 'kn') {
    this.activeLang = lang;
    this.languageLocked = true;
    this.chatbotState = 'awaiting_intent';
    this.translationService.setLang(lang);

    const greeting = this.LOCALIZED_PROMPTS['WELCOME'][lang] + " " + this.LOCALIZED_PROMPTS['MENU_OPTIONS'][lang];
    this.addBotMessage(greeting, 'menu');
    this.speakText(greeting);
  }

  getMenuLabel(intent: string): string {
    return this.MENU_LABELS[intent]?.[this.activeLang] || intent;
  }

  addBotMessage(text: string, status?: string, extra: Partial<Message> = {}) {
    this.messages.push({
      sender: 'bot',
      text,
      timestamp: new Date(),
      status,
      ...extra
    });
    this.cdr.detectChanges();
  }

  addUserMessage(text: string) {
    this.messages.push({
      sender: 'user',
      text,
      timestamp: new Date()
    });
    this.cdr.detectChanges();
  }

  speakText(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    this.stopSpeaking();
    this.botIsSpeaking = true;
    
    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    let voiceLang = 'en-IN';
    if (this.activeLang === 'te') voiceLang = 'te-IN';
    else if (this.activeLang === 'ta') voiceLang = 'ta-IN';
    else if (this.activeLang === 'kn') voiceLang = 'kn-IN';

    utterance.lang = voiceLang;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(this.activeLang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => {
      this.botIsSpeaking = false;
      this.cdr.detectChanges();
    };

    utterance.onerror = () => {
      this.botIsSpeaking = false;
      this.cdr.detectChanges();
    };

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.botIsSpeaking = false;
  }

  initSpeechRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    this.recognition = rec;

    rec.onresult = (event: any) => {
      this.voiceRecognizing = false;
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        this.consecutiveFailures = 0;
        this.processUserInput(transcript);
      }
    };

    rec.onerror = (err: any) => {
      console.error('Speech recognition error', err);
      this.voiceRecognizing = false;
      this.consecutiveFailures++;

      if (this.consecutiveFailures >= 3) {
        this.addBotMessage("MIC TROUBLE. SWITCHING TO MANUAL INPUT INTERFACE.");
        this.speakText("Microphone error. Please use manual input console.");
      } else {
        const retryMsg = this.LOCALIZED_PROMPTS['MIC_RETRY'][this.activeLang];
        this.addBotMessage(retryMsg);
        this.speakText(retryMsg);
      }
      this.cdr.detectChanges();
    };

    rec.onend = () => {
      this.voiceRecognizing = false;
      this.cdr.detectChanges();
    };
  }

  toggleVoiceListening() {
    if (!this.recognition) {
      this.addBotMessage("STT MIC INTERFACE OFFLINE ON BROWSER CORE.");
      return;
    }

    if (this.voiceRecognizing) {
      this.recognition.stop();
    } else {
      this.stopSpeaking();
      let recognitionLang = 'en-IN';
      if (this.activeLang === 'te') recognitionLang = 'te-IN';
      else if (this.activeLang === 'ta') recognitionLang = 'ta-IN';
      else if (this.activeLang === 'kn') recognitionLang = 'kn-IN';

      this.recognition.lang = recognitionLang;
      this.voiceRecognizing = true;
      this.recognition.start();
    }
  }

  sendTextMessage() {
    if (!this.userInputText.trim()) return;
    const text = this.userInputText.trim();
    this.userInputText = '';
    this.processUserInput(text);
  }

  processUserInput(text: string) {
    this.addUserMessage(text);
    const cleaned = text.toLowerCase().trim();

    if (this.chatbotState === 'awaiting_intent') {
      const intent = this.classifyIntent(cleaned);
      if (intent) {
        this.triggerIntent(intent);
      } else {
        const refusal = this.LOCALIZED_PROMPTS['REFUSAL'][this.activeLang];
        this.addBotMessage(refusal, 'menu');
        this.speakText(refusal);
      }
      return;
    }

    if (this.chatbotState === 'raise_awaiting_description') {
      this.tempComplaintData.description = text;
      
      if (this.chatbotJobProgress === 100) {
        this.promptConfirmation();
      } else {
        this.addBotMessage("CAPTURED DESCRIPTION. WAITING FOR AI AUDITING TO FINISH...");
        this.speakText("Thank you, description captured. Waiting for visual analysis to finish.");
        this.chatbotState = 'raise_confirm';
      }
      return;
    }

    if (this.chatbotState === 'raise_confirm') {
      if (cleaned.includes('yes') || cleaned.includes('submit') || cleaned.includes('confirm') || cleaned.includes('అవును') || cleaned.includes('ஆம்') || cleaned.includes('ಹೌದು')) {
        this.submitBotComplaint();
      } else if (cleaned.includes('no') || cleaned.includes('cancel') || cleaned.includes('వద్దు') || cleaned.includes('இல்லை') || cleaned.includes('ಬೇಡ')) {
        this.cancelBotComplaint();
      } else {
        this.speakText("Do you want to submit? Please say yes or no.");
      }
      return;
    }

    if (this.chatbotState === 'track_awaiting_id') {
      this.chatbotState = 'awaiting_intent';
      this.trackComplaintDetails(cleaned);
      return;
    }
  }

  classifyIntent(text: string): string | null {
    const enKeys = {
      raise: ['raise', 'complaint', 'file', 'register', 'submit', 'report', 'grievance', 'ticket', 'issue'],
      track: ['track', 'status', 'check', 'find', 'where is', 'search'],
      updates: ['updates', 'news', 'announcements', 'whats new', 'government updates', 'govern'],
      emergency: ['emergency', 'help', 'sos', 'danger', 'hazard', 'rescue', 'hotline', 'police', 'fire', 'ambulance']
    };

    const teKeys = {
      raise: ['ఫిర్యాదు', 'నమోదు', 'సమర్పించు', 'రిపోర్ట్', 'టికెట్'],
      track: ['స్థితి', 'ట్రాక్', 'చెక్', 'ఎక్కడ', 'వెతకండి'],
      updates: ['అప్డేట్లు', 'వార్తలు', 'ప్రభుత్వ', 'సమాచారం', 'నవీకరణలు'],
      emergency: ['అత్యవసర', 'సహాయం', 'సహాయపడండి', 'ప్రమాదం', 'హాట్‌లైన్']
    };

    const taKeys = {
      raise: ['புகார்', 'பதிவு', 'சமர்ப்பி', 'அறிக்கை'],
      track: ['நிலை', 'கண்காணி', 'சரிபார்', 'எங்கே', 'தேடு'],
      updates: ['அறிவிப்புகள்', 'செய்திகள்', 'அரசு', 'தகவல்'],
      emergency: ['அவசரம்', 'உதவி', 'ஆபத்து', 'மீட்பு']
    };

    const knKeys = {
      raise: ['ದೂರು', 'ನೋಂದಾಯಿಸು', 'ಸಲ್ಲಿಸು', 'ವರದಿ'],
      track: ['ಸ್ಥಿತಿ', 'ಟ್ರ್ಯಾಕ್', 'ಪರಿಶೀಲಿಸು', 'ಎಲ್ಲಿದೆ', 'ಹುಡುಕು'],
      updates: ['ಅಪ್ಡೇಟ್', 'ಸುದ್ದಿ', 'ಸರ್ಕಾರದ', 'ಮಾಹಿತಿ'],
      emergency: ['ತುರ್ತು', 'ಸಹಾಯ', 'ಆಪತ್ತು', 'ರಕ್ಷಣೆ']
    };

    let keys = enKeys;
    if (this.activeLang === 'te') keys = teKeys;
    else if (this.activeLang === 'ta') keys = taKeys;
    else if (this.activeLang === 'kn') keys = knKeys;

    if (keys.raise.some(kw => text.includes(kw))) return 'Raise Complaint';
    if (keys.track.some(kw => text.includes(kw))) return 'Track Complaint';
    if (keys.updates.some(kw => text.includes(kw))) return 'Government Updates';
    if (keys.emergency.some(kw => text.includes(kw))) return 'Emergency Help';

    if (enKeys.raise.some(kw => text.includes(kw))) return 'Raise Complaint';
    if (enKeys.track.some(kw => text.includes(kw))) return 'Track Complaint';
    if (enKeys.updates.some(kw => text.includes(kw))) return 'Government Updates';
    if (enKeys.emergency.some(kw => text.includes(kw))) return 'Emergency Help';

    return null;
  }

  triggerIntent(intent: string) {
    if (intent === 'Raise Complaint') {
      this.chatbotState = 'raise_awaiting_image';
      const prompt = this.LOCALIZED_PROMPTS['RAISE_START'][this.activeLang];
      this.addBotMessage(prompt, 'awaiting_image');
      this.speakText(prompt);
    } else if (intent === 'Track Complaint') {
      this.chatbotState = 'track_awaiting_id';
      const prompt = this.LOCALIZED_PROMPTS['TRACK_START'][this.activeLang];
      this.addBotMessage(prompt);
      this.speakText(prompt);
    } else if (intent === 'Government Updates') {
      this.chatbotState = 'awaiting_intent';
      this.fetchGovernmentUpdates();
    } else if (intent === 'Emergency Help') {
      this.chatbotState = 'awaiting_intent';
      this.showEmergencyInfo();
    }
  }

  onBotFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.tempComplaintFile = file;
      this.chatbotJobProgress = 10;
      this.chatbotState = 'raise_awaiting_description';

      const uploadAck = this.LOCALIZED_PROMPTS['UPLOAD_SUCCESS'][this.activeLang];
      this.addBotMessage(uploadAck, 'upload_complete', { jobId: 'uploading' });
      this.speakText(uploadAck);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('location', 'Ward 12 Main St');

      this.apiService.postForm<any>('/ai/analyze', formData).subscribe({
        next: (res) => {
          const jobId = res?.jobId || res?.data?.jobId || res?.job?.id || res?.analysisId;
          if (jobId) {
            this.subscribeToAiStream(jobId);
          } else {
            this.handleAiFailure();
          }
        },
        error: () => this.handleAiFailure()
      });
    }
  }

  private subscribeToAiStream(jobId: string) {
    this.aiStreamSub = this.aiService.analyzeImageStream(jobId).subscribe({
      next: (event: any) => {
        this.chatbotJobProgress = event.progress || this.chatbotJobProgress;
        
        if (event.status === 'completed') {
          this.chatbotJobProgress = 100;
          this.tempComplaintData = {
            title: event.title || 'Civic Issue',
            description: this.tempComplaintData?.description || 'AI assisted intake.',
            department: event.department || 'General Inquiry',
            departmentName: event.department || 'General Inquiry',
            priority: event.priority || 'medium',
            severityScore: event.severityScore || 50,
            estimatedDays: event.estimatedDays || 3,
            location: {
              address: 'Ward 12 Main St',
              latitude: 12.9716,
              longitude: 77.5946,
              ward: '12'
            }
          };

          if (this.chatbotState === 'raise_confirm' || this.tempComplaintData.description !== 'AI assisted intake.') {
            this.promptConfirmation();
          }
        }
      },
      error: () => this.handleAiFailure()
    });
  }

  private promptConfirmation() {
    this.chatbotState = 'raise_confirm';
    let text = this.LOCALIZED_PROMPTS['AI_COMPLETE'][this.activeLang];
    text = text.replace('{dept}', this.tempComplaintData.departmentName).replace('{priority}', this.tempComplaintData.priority);
    
    this.addBotMessage(text, 'confirm_details');
    this.speakText(text);
  }

  private handleAiFailure() {
    this.chatbotJobProgress = null;
    this.chatbotState = 'raise_confirm';
    this.tempComplaintData = {
      title: 'Civic Issue',
      description: this.tempComplaintData?.description || 'Visual details uploaded.',
      department: '',
      departmentName: 'General Inquiry',
      priority: 'medium',
      severityScore: 0,
      estimatedDays: 4,
      location: {
        address: 'Ward 12 Main St',
        latitude: 12.9716,
        longitude: 77.5946,
        ward: '12'
      }
    };
    
    this.addBotMessage("AI audit is taking longer than expected. We've created a general intake ticket. Would you like to submit now?", 'confirm_details');
    this.speakText("AI suggestions are taking longer than expected. We can submit a manual ticket. Would you like to proceed?");
  }

  submitBotComplaint() {
    if (!this.tempComplaintData) return;
    
    const formData = new FormData();
    formData.append('title', this.tempComplaintData.title);
    formData.append('description', this.tempComplaintData.description);
    
    this.apiService.getDepartments().subscribe((depts) => {
      const match = depts.find(d => d.name.toLowerCase() === this.tempComplaintData.departmentName.toLowerCase());
      const deptId = match ? match.id : (depts[0]?.id || '');
      
      formData.append('department', deptId);
      formData.append('location', JSON.stringify(this.tempComplaintData.location));
      if (this.tempComplaintFile) {
        formData.append('image', this.tempComplaintFile);
      }

      this.complaintsService.createComplaint(formData).subscribe({
        next: (complaint: any) => {
          this.chatbotState = 'awaiting_intent';
          this.tempComplaintData = null;
          this.tempComplaintFile = null;
          this.chatbotJobProgress = null;

          let successPrompt = this.LOCALIZED_PROMPTS['SUBMIT_SUCCESS'][this.activeLang];
          successPrompt = successPrompt.replace('{id}', complaint.id || complaint._id);
          
          this.addBotMessage(successPrompt, 'menu');
          this.speakText(successPrompt);
        },
        error: () => {
          this.addBotMessage("Failed to submit complaint. Please check your data.");
          this.speakText("Sorry, submission failed. Please try again.");
        }
      });
    });
  }

  cancelBotComplaint() {
    this.chatbotState = 'awaiting_intent';
    this.tempComplaintData = null;
    this.tempComplaintFile = null;
    this.chatbotJobProgress = null;

    const cancelMsg = this.LOCALIZED_PROMPTS['CANCELLED'][this.activeLang];
    this.addBotMessage(cancelMsg, 'menu');
    this.speakText(cancelMsg);
  }

  private trackComplaintDetails(id: string) {
    const cleanId = id.toUpperCase().replace(/\s+/g, '');
    
    this.apiService.getComplaintById(cleanId).subscribe({
      next: (complaint: any) => {
        if (complaint && complaint.title) {
          let foundMsg = this.LOCALIZED_PROMPTS['TRACK_FOUND'][this.activeLang];
          foundMsg = foundMsg.replace('{title}', complaint.title).replace('{status}', complaint.status);
          
          this.addBotMessage(foundMsg, 'menu', { complaintDetails: complaint });
          this.speakText(foundMsg);
        } else {
          this.handleComplaintNotFound(cleanId);
        }
      },
      error: () => this.handleComplaintNotFound(cleanId)
    });
  }

  private handleComplaintNotFound(id: string) {
    let notFound = this.LOCALIZED_PROMPTS['TRACK_NOT_FOUND'][this.activeLang];
    notFound = notFound.replace('{id}', id);
    
    this.addBotMessage(notFound, 'menu');
    this.speakText(notFound);
  }

  private fetchGovernmentUpdates() {
    this.updatesService.getLiveUpdates().subscribe({
      next: (updates) => {
        const topUpdates = updates.slice(0, 3);
        const intro = this.LOCALIZED_PROMPTS['UPDATES_START'][this.activeLang];
        
        let ttsSummary = intro + " ";
        topUpdates.forEach((upd, idx) => {
          ttsSummary += `${idx + 1}. From ${upd.department}: ${upd.message.split(':')[0]}. `;
        });

        this.addBotMessage(intro, 'menu', { updateDetails: topUpdates });
        this.speakText(ttsSummary);
      },
      error: () => {
        this.addBotMessage("Unable to fetch live updates. Please try again later.");
        this.speakText("Sorry, updates feed is temporarily offline.");
      }
    });
  }

  private showEmergencyInfo() {
    const msg = this.LOCALIZED_PROMPTS['EMERGENCY_START'][this.activeLang];
    this.addBotMessage(msg, 'menu', { emergencyDetails: true });
    this.speakText(msg);
  }
}
