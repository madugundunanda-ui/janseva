import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SmsProvider {
  name: string;
  sendOtp(phone: string): Observable<any>;
  verifyOtp(phone: string, otp: string): Observable<any>;
}

@Injectable({
  providedIn: 'root'
})
export class SmsService implements SmsProvider {
  name = 'MSG91';
  private apiUrl = (environment as any).apiUrl || '/api';

  constructor(private http: HttpClient) {}

  sendOtp(phone: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/otp/send-sms`, { phone });
  }

  verifyOtp(phone: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/otp/verify-sms`, { phone, otp });
  }
}
