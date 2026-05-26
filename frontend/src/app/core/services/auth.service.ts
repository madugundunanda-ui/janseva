import { computed, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserRole } from '../models/user.model';

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly currentUser = signal<User | null>(null);
  readonly token = signal<string | null>(null);
  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly userRole = computed<UserRole | null>(() => this.currentUser()?.role ?? null);

  constructor(private apiService: ApiService) {
    this.restoreSession();
  }

  login(credentials: { email: string; password: string; role?: string }): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((response) => this.persistSession(response.token, response.user))
    );
  }

  register(userData: Partial<User> & { password: string }): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/register', userData).pipe(
      tap((response) => this.persistSession(response.token, response.user))
    );
  }

  me(): Observable<{ user: User }> {
    return this.apiService.get<{ user: User }>('/auth/me').pipe(
      tap((response) => {
        if (response?.user) {
          this.currentUser.set(response.user);
        }
      })
    );
  }

  logout(): void {
    this.clearSession();
  }

  hasRole(roles: UserRole[]): boolean {
    const role = this.userRole();
    return !!role && roles.includes(role);
  }

  private restoreSession(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const savedToken = window.localStorage.getItem('token');
    const savedUser = window.localStorage.getItem('user');

    if (!savedToken || !savedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser) as User;
      this.token.set(savedToken);
      this.currentUser.set(parsedUser);
    } catch {
      this.clearSession();
    }
  }

  private persistSession(token: string, user: User): void {
    this.token.set(token);
    this.currentUser.set(user);

    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('token', token);
    window.localStorage.setItem('user', JSON.stringify(user));
  }

  private clearSession(): void {
    this.token.set(null);
    this.currentUser.set(null);

    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
  }
}
