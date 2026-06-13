import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { of, throwError, firstValueFrom } from 'rxjs';
import { User } from '../models/user.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let apiServiceMock: any;

  beforeEach(() => {
    // Mock window.localStorage
    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(key => delete store[key]); }
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

    apiServiceMock = {
      post: vi.fn(),
      get: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiServiceMock }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBe(false);
  });

  describe('login', () => {
    it('should login user and persist session', async () => {
      const mockUser: User = {
        id: '1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'citizen'
      };
      const mockResponse = { token: 'jwt-token', user: mockUser };
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      const response = await firstValueFrom(service.login({ email: 'jane@example.com', password: 'password123' }));
      expect(response).toEqual(mockResponse);
      expect(service.token()).toBe('jwt-token');
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(window.localStorage.getItem('token')).toBe('jwt-token');
    });
  });

  describe('logout', () => {
    it('should clear session and storage', () => {
      service.token.set('jwt-token');
      service.currentUser.set({ id: '1', name: 'Jane', email: 'j@example.com', role: 'citizen' });

      service.logout();

      expect(service.token()).toBeNull();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(window.localStorage.getItem('token')).toBeNull();
    });
  });
});
