import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should issue a GET request and unwrap the response data', async () => {
      const mockData = { id: '1', title: 'Test' };
      const apiResponse = { success: true, data: mockData };

      const requestPromise = firstValueFrom(service.get<any>('/test-path'));

      const req = httpMock.expectOne(`${environment.apiUrl}/test-path`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);

      const response = await requestPromise;
      expect(response).toEqual(mockData);
    });

    it('should handle errors and propagate them', async () => {
      const requestPromise = firstValueFrom(service.get<any>('/error-path'));

      const req = httpMock.expectOne(`${environment.apiUrl}/error-path`);
      req.flush('Error occurred', { status: 400, statusText: 'Bad Request' });

      try {
        await requestPromise;
        expect.fail('Should have failed');
      } catch (error: any) {
        expect(error.status).toBe(400);
      }
    });
  });

  describe('post', () => {
    it('should issue a POST request', async () => {
      const mockPayload = { title: 'New Item' };
      const mockResponse = { id: '2', ...mockPayload };

      const requestPromise = firstValueFrom(service.post<any>('/create-path', mockPayload));

      const req = httpMock.expectOne(`${environment.apiUrl}/create-path`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockPayload);
      req.flush({ success: true, data: mockResponse });

      const response = await requestPromise;
      expect(response).toEqual(mockResponse);
    });
  });
});
