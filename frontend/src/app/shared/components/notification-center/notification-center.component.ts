import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from '../../../core/services/notifications.service';
import { NotificationItem } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative">
      <!-- Bell Icon -->
      <button 
        class="relative p-2 rounded-full hover:bg-white/10 transition-colors duration-200 focus:outline-none"
        (click)="toggleDropdown()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-300 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <!-- Unread Badge -->
        @if (unreadCount() > 0) {
          <span class="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
            {{ unreadCount() > 99 ? '99+' : unreadCount() }}
          </span>
        }
      </button>

      <!-- Dropdown Panel -->
      @if (isOpen()) {
        <div class="absolute right-0 mt-2 w-80 md:w-96 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          
          <!-- Header -->
          <div class="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h3 class="text-sm font-semibold text-white tracking-wide">Notifications</h3>
            @if (unreadCount() > 0) {
              <button 
                class="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                (click)="markAllAsRead()"
              >
                Mark all as read
              </button>
            }
          </div>

          <!-- Filters -->
          <div class="flex p-2 border-b border-white/5 gap-2">
            <button 
              class="flex-1 py-1 text-xs rounded transition-colors"
              [class.bg-white/10]="filter() === 'ALL'"
              [class.text-white]="filter() === 'ALL'"
              [class.text-gray-400]="filter() !== 'ALL'"
              (click)="setFilter('ALL')"
            >
              All
            </button>
            <button 
              class="flex-1 py-1 text-xs rounded transition-colors"
              [class.bg-white/10]="filter() === 'UNREAD'"
              [class.text-white]="filter() === 'UNREAD'"
              [class.text-gray-400]="filter() !== 'UNREAD'"
              (click)="setFilter('UNREAD')"
            >
              Unread
            </button>
          </div>

          <!-- Notification List -->
          <div class="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            @if (filteredNotifications().length === 0) {
              <div class="p-8 text-center text-sm text-gray-500">
                No notifications found.
              </div>
            } @else {
              <div class="divide-y divide-white/5">
                @for (item of filteredNotifications(); track item.id) {
                  <div 
                    class="p-4 hover:bg-white/5 transition-colors cursor-pointer group flex gap-3"
                    [class.bg-cyan-900/10]="!item.read"
                    (click)="markAsRead(item.id)"
                  >
                    <!-- Priority Indicator -->
                    <div class="mt-1 flex-shrink-0">
                      @if (item.priority === 'Critical') {
                        <div class="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                      } @else if (item.priority === 'High') {
                        <div class="w-2 h-2 rounded-full bg-orange-500"></div>
                      } @else if (item.priority === 'Medium') {
                        <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                      } @else {
                        <div class="w-2 h-2 rounded-full bg-cyan-500"></div>
                      }
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-start mb-1">
                        <p class="text-sm font-medium text-gray-200 truncate pr-2 group-hover:text-white transition-colors" [class.text-white]="!item.read">
                          {{ item.title }}
                        </p>
                        <span class="text-[10px] text-gray-500 whitespace-nowrap">{{ formatTime(item.timestamp) }}</span>
                      </div>
                      <p class="text-xs text-gray-400 line-clamp-2">
                        {{ item.message }}
                      </p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

        </div>
      }
    </div>

    <!-- Backdrop to close dropdown -->
    @if (isOpen()) {
      <div class="fixed inset-0 z-40" (click)="closeDropdown()"></div>
    }
  `
})
export class NotificationCenterComponent {
  private notificationsService = inject(NotificationsService);
  
  isOpen = signal(false);
  filter = signal<'ALL' | 'UNREAD'>('ALL');

  // Derive counts and lists from the centralized service
  unreadCount = computed(() => {
    return this.notificationsService.notifications().filter(n => !n.read).length;
  });

  filteredNotifications = computed(() => {
    const items = this.notificationsService.notifications();
    // Sort by timestamp desc
    const sorted = [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (this.filter() === 'UNREAD') {
      return sorted.filter(n => !n.read);
    }
    return sorted;
  });

  toggleDropdown() {
    this.isOpen.update(v => !v);
  }

  closeDropdown() {
    this.isOpen.set(false);
  }

  setFilter(f: 'ALL' | 'UNREAD') {
    this.filter.set(f);
  }

  markAsRead(id: string) {
    this.notificationsService.markRead(id);
  }

  markAllAsRead() {
    this.notificationsService.clearAll(); // Or a specific markAllAsRead if implemented
  }

  formatTime(isoString: string): string {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString();
  }
}
