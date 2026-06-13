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
    <!-- Premium Floating AI Launcher -->
    <div class="fixed bottom-8 right-8 z-50">
      <button (click)="toggleChat()" 
              class="w-[180px] h-[60px] rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white flex items-center justify-start px-4 shadow-[0_8px_30px_rgb(99,102,241,0.3)] hover:shadow-[0_8px_40px_rgb(99,102,241,0.5)] hover:scale-105 transition-all duration-300 cursor-pointer relative group border border-white/20 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-indigo-500/50 overflow-hidden"
              title="Talk to JanSeva AI"
              aria-label="Open JanSeva Assistant">
        
        <!-- Background pulse effect when listening -->
        @if (voiceRecognizing) {
          <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
        }

        <!-- Icon -->
        <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/20 shadow-inner mr-3 shrink-0 group-hover:bg-white/30 transition-colors z-10">
          <span class="text-xl">🤖</span>
        </div>

        <!-- Text Content -->
        <div class="flex flex-col text-left z-10">
          <span class="font-bold text-sm leading-tight drop-shadow-sm">JanSeva AI</span>
          <span class="text-[10px] font-medium text-white/80 uppercase tracking-wider">Voice Assistant</span>
        </div>
      </button>
    </div>

    <!-- Assistant Modal -->
    @if (isOpen) {
      <div class="fixed right-4 sm:right-8 bottom-28 w-full sm:w-[420px] max-w-[calc(100vw-2rem)] h-[700px] max-h-[85vh] rounded-[24px] bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 animate-fade-in-up origin-bottom-right">
        
        <!-- Header -->
        <header class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-3">
            <div class="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
              <span class="text-xl">🤖</span>
              <span class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
            </div>
            <div>
              <h3 class="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                JanSeva AI
                @if (languageLocked) {
                  <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 uppercase">
                    {{ activeLang }}
                  </span>
                }
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Government Services Assistant</p>
            </div>
          </div>
          <button (click)="toggleChat()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close Assistant">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <!-- Message Stack Area -->
        <div class="flex-1 p-6 space-y-6 overflow-y-auto font-sans text-sm scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent bg-slate-50/30 dark:bg-slate-900/30" #messageArea>
          
          <!-- Welcome Screen & Language Selection -->
          @if (!languageLocked) {
            <div class="space-y-6 animate-fade-in-up">
              <div class="flex flex-col items-center justify-center py-6 text-center">
                <div class="w-20 h-20 bg-gradient-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-4">
                  <span class="text-4xl">👋</span>
                </div>
                <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Hello Nanda</h2>
                <p class="text-slate-500 dark:text-slate-400">Please choose your preferred language to continue.</p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <button (click)="selectLanguage('en')" class="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm group">
                  <span class="text-2xl group-hover:scale-110 transition-transform">🇬🇧</span>
                  English
                </button>
                <button (click)="selectLanguage('te')" class="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm group">
                  <span class="text-2xl group-hover:scale-110 transition-transform">🇮🇳</span>
                  తెలుగు
                </button>
                <button (click)="selectLanguage('ta')" class="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm group">
                  <span class="text-2xl group-hover:scale-110 transition-transform">🇮🇳</span>
                  தமிழ்
                </button>
                <button (click)="selectLanguage('kn')" class="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm group">
                  <span class="text-2xl group-hover:scale-110 transition-transform">🇮🇳</span>
                  ಕನ್ನಡ
                </button>
              </div>
            </div>
          }

          <!-- Conversational Dialogue -->
          @for (msg of messages; track $index) {
            <div class="flex flex-col animate-fade-in-up mb-6" [class.items-end]="msg.sender === 'user'" [class.items-start]="msg.sender === 'bot'">
              
              <div class="flex gap-3 max-w-[90%]" [class.flex-row-reverse]="msg.sender === 'user'">
                <!-- Avatar -->
                @if (msg.sender === 'bot') {
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <span class="text-sm">🤖</span>
                  </div>
                }

                <!-- Message Bubble -->
                <div class="flex flex-col" [class.items-end]="msg.sender === 'user'">
                  <div class="p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed" 
                       [ngClass]="{
                         'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm': msg.sender === 'user',
                         'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm': msg.sender === 'bot'
                       }">
                    <p class="whitespace-pre-wrap">{{ msg.text }}</p>

                    <!-- Custom Workflow Elements -->
                    
                    <!-- 1. Menu Buttons (Action Cards) -->
                    @if (msg.status === 'menu') {
                      <div class="mt-5 grid grid-cols-2 gap-3 w-full min-w-[280px]">
                        <button (click)="triggerIntent('Raise Complaint')" class="flex flex-col text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
                          <span class="text-2xl mb-2 group-hover:scale-110 transition-transform">📢</span>
                          <span class="font-bold text-slate-800 dark:text-slate-100 mb-1">Raise Complaint</span>
                          <span class="text-xs text-slate-500 dark:text-slate-400 leading-tight">Track civic issues and report problems.</span>
                        </button>
                        
                        <button (click)="triggerIntent('Track Complaint')" class="flex flex-col text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
                          <span class="text-2xl mb-2 group-hover:scale-110 transition-transform">📍</span>
                          <span class="font-bold text-slate-800 dark:text-slate-100 mb-1">Track Complaint</span>
                          <span class="text-xs text-slate-500 dark:text-slate-400 leading-tight">Check complaint status and updates.</span>
                        </button>

                        <button (click)="triggerIntent('Government Updates')" class="flex flex-col text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
                          <span class="text-2xl mb-2 group-hover:scale-110 transition-transform">🏛</span>
                          <span class="font-bold text-slate-800 dark:text-slate-100 mb-1">Updates</span>
                          <span class="text-xs text-slate-500 dark:text-slate-400 leading-tight">Latest schemes and announcements.</span>
                        </button>

                        <button (click)="triggerIntent('Emergency Help')" class="flex flex-col text-left p-4 rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-500/50 hover:shadow-md transition-all cursor-pointer group">
                          <span class="text-2xl mb-2 group-hover:scale-110 transition-transform">🚨</span>
                          <span class="font-bold text-red-700 dark:text-red-400 mb-1">Emergency</span>
                          <span class="text-xs text-red-600/80 dark:text-red-400/80 leading-tight">Immediate emergency assistance.</span>
                        </button>
                      </div>
                    }

                    <!-- 2. Image Upload Panel (Complaint Workflow Step 1) -->
                    @if (msg.status === 'awaiting_image') {
                      <div class="mt-5">
                        <div class="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <span class="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">1</span>
                          Upload Image
                        </div>
                        <div class="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer transition-all group"
                             (click)="botFileInput.click()"
                             tabindex="0"
                             (keydown.enter)="botFileInput.click()">
                          <input #botFileInput type="file" accept="image/*" (change)="onBotFileSelected($event)" (click)="$event.stopPropagation()" class="hidden" aria-label="Upload image proof">
                          <div class="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:shadow-md group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 flex items-center justify-center mb-4 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </div>
                          <span class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Click to upload photo</span>
                          <span class="text-xs text-slate-500 dark:text-slate-400">JPG, PNG up to 10MB</span>
                        </div>
                      </div>
                    }

                    <!-- 3. AI Analysis Progress steps in Chat -->
                    @if (msg.jobId && chatbotJobProgress !== null) {
                      <div class="mt-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <div class="flex justify-between items-center">
                          <span class="text-sm font-bold text-slate-800 dark:text-slate-200">AI Analysis Progress</span>
                          <span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">{{ chatbotJobProgress }}%</span>
                        </div>
                        <!-- Progress bar -->
                        <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500" [style.width.%]="chatbotJobProgress"></div>
                        </div>
                        
                        <!-- Timeline Stepper -->
                        <div class="space-y-3 pt-2">
                          <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Image Uploaded</span>
                          </div>
                          
                          <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0" 
                                 [ngClass]="chatbotJobProgress >= 40 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'border-2 border-indigo-200 dark:border-indigo-900 border-t-indigo-500 dark:border-t-indigo-400 animate-spin'">
                              @if (chatbotJobProgress >= 40) {
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                              }
                            </div>
                            <span class="text-sm font-medium" [ngClass]="chatbotJobProgress >= 40 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'">Detecting Department</span>
                          </div>

                          <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0" 
                                 [ngClass]="chatbotJobProgress >= 70 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : (chatbotJobProgress >= 40 ? 'border-2 border-indigo-200 dark:border-indigo-900 border-t-indigo-500 dark:border-t-indigo-400 animate-spin' : 'border-2 border-slate-200 dark:border-slate-700')">
                              @if (chatbotJobProgress >= 70) {
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                              }
                            </div>
                            <span class="text-sm font-medium" [ngClass]="chatbotJobProgress >= 70 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'">Detecting Category</span>
                          </div>

                          <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0" 
                                 [ngClass]="chatbotJobProgress >= 90 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : (chatbotJobProgress >= 70 ? 'border-2 border-indigo-200 dark:border-indigo-900 border-t-indigo-500 dark:border-t-indigo-400 animate-spin' : 'border-2 border-slate-200 dark:border-slate-700')">
                              @if (chatbotJobProgress >= 90) {
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                              }
                            </div>
                            <span class="text-sm font-medium" [ngClass]="chatbotJobProgress >= 90 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'">Detecting Severity</span>
                          </div>
                        </div>
                      </div>
                    }

                    <!-- 4. Confirm Complaint Details Form Autofill -->
                    @if (msg.status === 'confirm_details' && tempComplaintData) {
                      <div class="mt-5">
                        <div class="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <span class="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">4</span>
                          Review & Submit
                        </div>
                        <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm space-y-4">
                          
                          <div class="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-3">
                            <div class="flex flex-col">
                              <span class="text-xs text-slate-500 dark:text-slate-400 mb-1">Category</span>
                              <span class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ tempComplaintData.title || 'Civic Issue' }}</span>
                            </div>
                            
                            <div class="flex flex-col">
                              <span class="text-xs text-slate-500 dark:text-slate-400 mb-1">Department</span>
                              <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ tempComplaintData.departmentName }}</span>
                            </div>
                            
                            <div class="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                              <div class="flex flex-col">
                                <span class="text-xs text-slate-500 dark:text-slate-400 mb-1">Severity Priority</span>
                                <span class="text-sm font-bold flex items-center gap-2" [ngClass]="{'text-red-600 dark:text-red-400': tempComplaintData.priority === 'high' || tempComplaintData.priority === 'critical', 'text-amber-600 dark:text-amber-400': tempComplaintData.priority === 'medium', 'text-emerald-600 dark:text-emerald-400': tempComplaintData.priority === 'low'}">
                                  <span class="capitalize">{{ tempComplaintData.priority }}</span> 
                                </span>
                              </div>
                              <div class="flex flex-col items-end">
                                <span class="text-xs text-slate-500 dark:text-slate-400 mb-1">Estimated Resolution</span>
                                <span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">{{ tempComplaintData.estimatedDays }} Days</span>
                              </div>
                            </div>
                          </div>
                          
                          <div class="flex gap-3 pt-2">
                            <button (click)="submitBotComplaint()" class="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-indigo-500/30">Submit Complaint</button>
                            <button (click)="cancelBotComplaint()" class="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all">Cancel</button>
                          </div>
                        </div>
                      </div>
                    }

                    <!-- 5. News Updates Cards -->
                    @if (msg.updateDetails && msg.updateDetails.length > 0) {
                      <div class="mt-5 space-y-4">
                        @for (upd of msg.updateDetails; track upd.id) {
                          <div class="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                            <div class="flex justify-between items-start mb-2">
                              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{{ upd.department }}</span>
                              <span class="text-xs text-slate-500 dark:text-slate-400">{{ upd.timestamp | date:'mediumDate' }}</span>
                            </div>
                            <p class="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{{ upd.message }}</p>
                          </div>
                        }
                      </div>
                    }

                    <!-- 6. Emergency Details -->
                    @if (msg.emergencyDetails) {
                      <div class="mt-5 p-5 rounded-2xl bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-900/30">
                        <div class="flex items-center gap-3 font-bold text-red-700 dark:text-red-400 text-lg mb-4">
                          <span class="p-2 rounded-full bg-red-100 dark:bg-red-900/50">🚨</span>
                          Emergency Services
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                          <a href="tel:100" class="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 hover:border-red-400 hover:shadow-md transition-all text-center group">
                            <span class="text-2xl group-hover:scale-110 transition-transform">🚓</span>
                            <span class="font-bold text-slate-800 dark:text-slate-100 text-sm">Police</span>
                            <span class="text-red-600 dark:text-red-400 font-bold">100</span>
                          </a>
                          <a href="tel:108" class="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 hover:border-red-400 hover:shadow-md transition-all text-center group">
                            <span class="text-2xl group-hover:scale-110 transition-transform">🚑</span>
                            <span class="font-bold text-slate-800 dark:text-slate-100 text-sm">Ambulance</span>
                            <span class="text-red-600 dark:text-red-400 font-bold">108</span>
                          </a>
                          <a href="tel:101" class="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 hover:border-red-400 hover:shadow-md transition-all text-center group">
                            <span class="text-2xl group-hover:scale-110 transition-transform">🚒</span>
                            <span class="font-bold text-slate-800 dark:text-slate-100 text-sm">Fire Service</span>
                            <span class="text-red-600 dark:text-red-400 font-bold">101</span>
                          </a>
                          <a href="tel:1091" class="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 hover:border-red-400 hover:shadow-md transition-all text-center group">
                            <span class="text-2xl group-hover:scale-110 transition-transform">👩</span>
                            <span class="font-bold text-slate-800 dark:text-slate-100 text-sm">Women Help</span>
                            <span class="text-red-600 dark:text-red-400 font-bold">1091</span>
                          </a>
                        </div>
                        <a href="tel:112" class="mt-3 flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all focus:ring-4 focus:ring-red-500/30">
                          📞 National Emergency (112)
                        </a>
                      </div>
                    }

                  </div>

                  <!-- Message Timestamp -->
                  <span class="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 px-2 font-medium" [class.text-right]="msg.sender === 'user'">{{ msg.timestamp | date:'shortTime' }}</span>
                </div>
              </div>
            </div>
          }

          <!-- Micro-animation voice listening indicator / Typing indicator -->
          @if (voiceRecognizing) {
            <div class="flex items-start gap-3 mb-6 animate-fade-in-up">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                <span class="text-sm">🤖</span>
              </div>
              <div class="flex flex-col">
                <div class="p-4 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm max-w-[200px]">
                  <div class="flex flex-col items-center gap-2">
                    <span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">Listening...</span>
                    <!-- CSS soundwave bars -->
                    <div class="flex gap-1.5 items-end h-6 mt-1">
                      <div class="w-1.5 bg-indigo-500 rounded-full animate-sound-bar-1 h-6"></div>
                      <div class="w-1.5 bg-indigo-500 rounded-full animate-sound-bar-2 h-3"></div>
                      <div class="w-1.5 bg-indigo-500 rounded-full animate-sound-bar-3 h-5"></div>
                      <div class="w-1.5 bg-indigo-500 rounded-full animate-sound-bar-1 h-4" style="animation-delay: 0.2s"></div>
                      <div class="w-1.5 bg-indigo-500 rounded-full animate-sound-bar-2 h-6" style="animation-delay: 0.1s"></div>
                    </div>
                  </div>
                </div>
                <span class="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 px-2 font-medium">Speak now</span>
              </div>
            </div>
          } @else if (botIsSpeaking || chatbotState === 'raise_awaiting_image') {
            <!-- Just basic typing indicator style if bot is thinking but not voice reco -->
            <div class="flex items-start gap-3 mb-6 animate-fade-in-up">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                <span class="text-sm">🤖</span>
              </div>
              <div class="p-4 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                 <div class="flex gap-1.5 items-end h-5">
                  <div class="w-1.5 bg-indigo-400 rounded-full animate-sound-bar-1 h-5"></div>
                  <div class="w-1.5 bg-indigo-400 rounded-full animate-sound-bar-2 h-2.5"></div>
                  <div class="w-1.5 bg-indigo-400 rounded-full animate-sound-bar-3 h-4"></div>
                </div>
              </div>
            </div>
          }

        </div>

        <!-- Chat Input Footer Console -->
        @if (languageLocked) {
          <footer class="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 items-end shrink-0 relative">
            <div class="flex-1 bg-slate-100 dark:bg-slate-800 border border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-4 focus-within:ring-indigo-500/20 rounded-2xl transition-all flex items-end min-h-[52px]">
              <textarea
                     [(ngModel)]="userInputText"
                     (keydown.enter)="onEnterPress($event)"
                     [disabled]="voiceRecognizing || chatbotJobProgress !== null"
                     class="flex-1 bg-transparent w-full py-3.5 px-4 text-[15px] text-slate-800 dark:text-slate-200 outline-none resize-none max-h-32 placeholder-slate-400 dark:placeholder-slate-500 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 disabled:opacity-50" 
                     [placeholder]="translationService.t('PH_MSG_JANSEVA_AI')"
                     rows="1"
                     aria-label="Message input"
                     (input)="autoResize($event)"></textarea>
            </div>

            <div class="flex gap-2 shrink-0">
              <!-- Mic Trigger Button -->
              <button (click)="toggleVoiceListening()" 
                      [disabled]="chatbotJobProgress !== null"
                      [class.bg-red-500]="voiceRecognizing"
                      [class.text-white]="voiceRecognizing"
                      [class.shadow-lg]="voiceRecognizing"
                      [class.animate-pulse]="voiceRecognizing"
                      [class.bg-slate-100]="!voiceRecognizing"
                      [class.dark:bg-slate-800]="!voiceRecognizing"
                      [class.text-slate-600]="!voiceRecognizing"
                      [class.dark:text-slate-300]="!voiceRecognizing"
                      [class.hover:bg-slate-200]="!voiceRecognizing"
                      [class.dark:hover:bg-slate-700]="!voiceRecognizing"
                      class="p-3.5 rounded-2xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center h-[52px] w-[52px]"
                      aria-label="Voice input">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              <!-- Send button -->
              <button (click)="sendTextMessage()"
                      [disabled]="voiceRecognizing || chatbotJobProgress !== null || !userInputText.trim()"
                      class="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:shadow-none flex items-center justify-center h-[52px] w-[52px]"
                      aria-label="Send message">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
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
      0%, 100% { height: 6px; }
      50% { height: 16px; }
    }
    @keyframes soundwave-2 {
      0%, 100% { height: 12px; }
      50% { height: 4px; }
    }
    @keyframes soundwave-3 {
      0%, 100% { height: 8px; }
      50% { height: 14px; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(15px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-sound-bar-1 { animation: soundwave-1 0.6s ease-in-out infinite; }
    .animate-sound-bar-2 { animation: soundwave-2 0.7s ease-in-out infinite; }
    .animate-sound-bar-3 { animation: soundwave-3 0.5s ease-in-out infinite; }
    .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
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

  // Web Speech API references
  private recognition: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private consecutiveFailures = 0;

  // State Machine logic
  public chatbotState: 'idle' | 'awaiting_intent' | 'raise_awaiting_image' | 'raise_awaiting_description' | 'raise_confirm' | 'track_awaiting_id' = 'idle';

  // Complaint building
  tempComplaintFile: File | null = null;
  tempComplaintData: any = null;
  chatbotJobProgress: number | null = null;
  private aiStreamSub: any = null;

  // Dictionaries
  private readonly LOCALIZED_PROMPTS: Record<string, Record<string, string>> = {
    WELCOME: {
      en: "How can I help you today?",
      te: "నేను ఈ రోజు మీకు ఎలా సహాయపడగలను?",
      ta: "இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
      kn: "ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?"
    },
    MENU_OPTIONS: {
      en: "Choose an option below or speak your request.",
      te: "దయచేసి ఒక మెను ఎంపికను ఎంచుకోండి లేదా మీ సమస్యను చెప్పండి.",
      ta: "கீழே உள்ள ஒரு விருப்பத்தை தேர்வு செய்யவும் அல்லது உங்கள் கோரிக்கையை கூறவும்.",
      kn: "ಕೆಳಗಿನ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ ಅಥವಾ ನಿಮ್ಮ ದೂರು ತಿಳಿಸಿ."
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
      ta: "AI பகுப்பாய்வு முடிந்தது. கண்டறியப்பட்ட துறை: {dept}, முன்னுரிமை: {priority}. இந்த புகாரை சமர்ப்பிக்க விரும்புகிறೀರಾ?",
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
      ta: "புகார் வரைவு ரத்து செய்யப்பட்டது. முதன்மை மெனுவிற்கு திரும்புகிறது.",
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
      ta: "எனக்கு புரியவில்லை. தயவுசெய்து மீண்டும் கூறவும் அல்லது கைமுறையாக தேர்வு செய்யவும்.",
      kn: "ನನಗೆ ಸರಿಯಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ ಅಥವಾ ಹಸ್ತಚಾಲಿತವಾಗಿ ಆಯ್ಕೆಮಾಡಿ."
    }
  };

  private readonly MENU_LABELS: Record<string, Record<string, string>> = {
    'Raise Complaint': { en: 'Raise Complaint', te: 'ఫిర్యాదు నమోదు చేయండి', ta: 'புகார் அளிக்கவும்', kn: 'ದೂರು ನೋಂದಾಯಿಸಿ' },
    'Track Complaint': { en: 'Track Complaint', te: 'ఫిర్యాదు స్థితి తెలుసుకోండి', ta: 'புகாரைக் கண்கಾಣிக்கவும்', kn: 'ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ' },
    'Government Updates': { en: 'Government Updates', te: 'ప్రభుత్వ అప్డేట్లు', ta: 'அரசு அறிவிப்புகள்', kn: 'ಸರ್ಕಾರದ ಅಪ್ಡೇಟ್ಗಳು' },
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
    
    // Change core system language to match
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

  // Speak synthesized response locks configuration
  speakText(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    this.stopSpeaking();
    this.botIsSpeaking = true;
    
    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Resolve matching language voice
    let voiceLang = 'en-IN';
    if (this.activeLang === 'te') voiceLang = 'te-IN';
    else if (this.activeLang === 'ta') voiceLang = 'ta-IN';
    else if (this.activeLang === 'kn') voiceLang = 'kn-IN';

    utterance.lang = voiceLang;

    // Query native synthesis list for accuracy
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

  // --- Voice recognition STT ---
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
    if (!this.userInputText?.trim()) return;
    const text = this.userInputText.trim();
    this.userInputText = '';
    
    // Reset textarea height if exists
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(ta => ta.style.height = 'auto');
      }, 0);
    }
    
    this.processUserInput(text);
  }

  onEnterPress(event: Event) {
    event.preventDefault();
    this.sendTextMessage();
  }

  autoResize(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight) + 'px';
  }

  // --- Processing intents ---
  processUserInput(text: string) {
    this.addUserMessage(text);
    const cleaned = text.toLowerCase().trim();

    // 1. Gating to allow only governance intents when in idle or menu selection state
    if (this.chatbotState === 'awaiting_intent') {
      const intent = this.classifyIntent(cleaned);
      if (intent) {
        this.triggerIntent(intent);
      } else {
        // Refusal Prompt when off-topic/casual conversation attempt
        const refusal = this.LOCALIZED_PROMPTS['REFUSAL'][this.activeLang];
        this.addBotMessage(refusal, 'menu');
        this.speakText(refusal);
      }
      return;
    }

    // 2. Guided workflow states
    
    // State: description input for Raise Complaint
    if (this.chatbotState === 'raise_awaiting_description') {
      this.tempComplaintData.description = text;
      
      // If AI classification is done, transition to confirm, else wait.
      if (this.chatbotJobProgress === 100) {
        this.promptConfirmation();
      } else {
        this.addBotMessage("CAPTURED DESCRIPTION. WAITING FOR AI AUDITING TO FINISH...");
        this.speakText("Thank you, description captured. Waiting for visual analysis to finish.");
        this.chatbotState = 'raise_confirm';
      }
      return;
    }

    // State: confirming submission
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

    // State: asking for complaint ID to track status
    if (this.chatbotState === 'track_awaiting_id') {
      // Look for complaint in system
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

    // Combine keys based on locked activeLang
    let keys = enKeys;
    if (this.activeLang === 'te') keys = teKeys;
    else if (this.activeLang === 'ta') keys = taKeys;
    else if (this.activeLang === 'kn') keys = knKeys;

    if (keys.raise.some(kw => text.includes(kw))) return 'Raise Complaint';
    if (keys.track.some(kw => text.includes(kw))) return 'Track Complaint';
    if (keys.updates.some(kw => text.includes(kw))) return 'Government Updates';
    if (keys.emergency.some(kw => text.includes(kw))) return 'Emergency Help';

    // Fallback to cross-language checks in case they speak english phrases
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

  // --- Guided workflows ---

  // 1. Raise Complaint flow
  onBotFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.tempComplaintFile = file;
      this.chatbotJobProgress = 10;
      this.chatbotState = 'raise_awaiting_description';

      const uploadAck = this.LOCALIZED_PROMPTS['UPLOAD_SUCCESS'][this.activeLang];
      this.addBotMessage(uploadAck, 'upload_complete', { jobId: 'uploading' });
      this.speakText(uploadAck);

      // Call API to trigger background vision pipeline
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

          // If description was already provided, prompt confirmation, else wait.
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
    
    // Find department ID matching name or use default first department
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
        error: (err) => {
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

  // 2. Track Complaint flow
  private trackComplaintDetails(id: string) {
    // Standardize IDs or query
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

  // 3. Government Updates flow
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

  // 4. Emergency flow
  private showEmergencyInfo() {
    const msg = this.LOCALIZED_PROMPTS['EMERGENCY_START'][this.activeLang];
    this.addBotMessage(msg, 'menu', { emergencyDetails: true });
    this.speakText(msg);
  }
}
