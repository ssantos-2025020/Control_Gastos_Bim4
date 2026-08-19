import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginResponse {
  success: boolean;
  message: string;
  role?: string;
  token?: string;
}

export interface MeResponse {
  success: boolean;
  email: string;
  role: string;
}

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3100/api/auth';

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get expiracion(): number | null {
    const token = this.token;
    if (!token) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const json = JSON.parse(atob(padded));
      return typeof json.exp === 'number' ? json.exp : null;
    } catch {
      return null;
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password });
  }

  guardarToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/me`);
  }

  cerrarSesion(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}