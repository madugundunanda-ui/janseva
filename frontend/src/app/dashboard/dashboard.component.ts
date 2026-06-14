import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationsService } from '../core/services/notifications.service';
import { TranslationService, LanguageCode } from '../core/services/translation.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  constructor(
    public authService: AuthService,
    private notificationsService: NotificationsService,
    public translationService: TranslationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notificationsService.connect();
    if (this.router.url === '/dashboard' || this.router.url === '/dashboard/') {
      this.redirectToRoleDashboard();
    }
  }

  redirectToRoleDashboard() {
    const role = this.authService.userRole();
    if (role === 'citizen') {
      this.router.navigate(['/dashboard/citizen']);
    } else if (role === 'officer') {
      this.router.navigate(['/dashboard/officer']);
    } else if (role === 'supervisor') {
      this.router.navigate(['/dashboard/supervisor']);
    } else if (role === 'admin') {
      this.router.navigate(['/dashboard/admin']);
    } else {
      this.router.navigate(['/dashboard/complaints']);
    }
  }

  getConsoleTitle(): string {
    const role = this.authService.userRole();
    if (role === 'citizen') {
      return 'JANSEVA CITIZEN PORTAL // WARD INTAKE CONSOLE';
    } else if (role === 'officer') {
      return 'JANSEVA OFFICER OPERATIONS // SERVICE DISPATCH CENTER';
    } else if (role === 'supervisor') {
      return 'JANSEVA GOVERNANCE MANAGEMENT // ADMINISTRATIVE CONTROL';
    } else if (role === 'admin') {
      return 'JANSEVA STATE INTELLIGENCE CONTROL CENTER // MAIN CONSOLE';
    }
    return this.translationService.t('ACTIVE_CONSOLE');
  }

  ngOnDestroy(): void {
    this.notificationsService.disconnect();
  }

  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.translationService.setLang(select.value as LanguageCode);
  }

  canAccess(roles: string[]): boolean {
    const userRole = this.authService.userRole();
    return userRole ? roles.includes(userRole) : false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/citizen/login']);
  }
}

