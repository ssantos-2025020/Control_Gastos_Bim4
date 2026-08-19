import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  usuario: Usuario;
}

export interface RefreshResponse {
  success: boolean;
  token: string;
  usuario: Usuario;
}

export interface MeResponse {
  success: boolean;
  usuario: Usuario;
}

const TOKEN_KEY = 'auth_token';
const USUARIO_KEY = 'auth_usuario';

/** Segundos antes de la expiración en que se muestra el aviso de cierre de sesión. */
export const AVISO_SEGUNDOS = 5;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3100/api/auth';

  private expiracionTimer: ReturnType<typeof setTimeout> | null = null;
  private avisoTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private vigilanciaInterval: ReturnType<typeof setInterval> | null = null;

  /** Aviso de cierre inminente: nombre del usuario y segundos restantes. */
  readonly avisoExpiracion = signal<{ nombre: string; segundos: number } | null>(null);

  /** Mensaje (personalizado) de sesión expirada. La UI reacciona para volver al login. */
  readonly sesionExpirada = signal<string | null>(null);

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((respuesta) => this.guardarSesion(respuesta.token, respuesta.usuario)),
    );
  }

  /** Renueva la sesión con un token nuevo y reprograma la expiración. */
  extenderSesion(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap((respuesta) => {
        this.guardarSesion(respuesta.token, respuesta.usuario);
      }),
    );
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/me`);
  }

  getUsuario(): Usuario | null {
    const raw = localStorage.getItem(USUARIO_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.token;
    const tokenExp = this.expiracion;
    return !!token && tokenExp !== null && tokenExp * 1000 > Date.now();
  }

  /**
   * Timestamp de expiración (segundos) del token actual.
   * Devuelve null si no hay token o si no se puede decodificar.
   */
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

  /** Programa el cierre de sesión automático y el aviso previo. */
  iniciarVigilancia(): void {
    this.cerrarTimer();
    this.cerrarAviso();
    this.detenerVigilanciaInterval();

    const tokenExp = this.expiracion;
    if (tokenExp === null) {
      return;
    }

    const ms = tokenExp * 1000 - Date.now();

    if (ms <= 0) {
      this.expirarSesion();
      return;
    }

    // Chequeo periódico: garantiza el cierre aunque el setTimeout se pierda
    this.vigilanciaInterval = setInterval(() => {
      if (!this.isAuthenticated()) {
        this.expirarSesion();
      }
    }, 1000);

    // Aviso unos segundos antes de que expire
    if (ms > AVISO_SEGUNDOS * 1000) {
      this.avisoTimer = setTimeout(() => this.mostrarAviso(), ms - AVISO_SEGUNDOS * 1000);
    }

    this.expiracionTimer = setTimeout(() => this.expirarSesion(), ms);
  }

  /** Oculta el aviso (el cierre de sesión sigue ocurriendo). */
  descartarAviso(): void {
    this.cerrarAviso();
  }

  cerrarSesion(): void {
    this.cerrarTimer();
    this.cerrarAviso();
    this.detenerVigilanciaInterval();
    this.sesionExpirada.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  }

  private guardarSesion(token: string, usuario: Usuario): void {
    this.sesionExpirada.set(null);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
    this.iniciarVigilancia();
  }

  private mostrarAviso(): void {
    const nombre = this.getUsuario()?.nombre?.trim() || '';
    let restante = AVISO_SEGUNDOS;

    this.avisoExpiracion.set({ nombre, segundos: restante });

    this.countdownTimer = setInterval(() => {
      restante -= 1;

      if (restante <= 0) {
        this.expirarSesion();
        return;
      }

      this.avisoExpiracion.set({ nombre, segundos: restante });
    }, 1000);
  }

  private expirarSesion(): void {
    this.cerrarSesion();
    this.sesionExpirada.set('Tu sesión ha expirado. Vuelve a iniciar sesión.');
  }

  private cerrarAviso(): void {
    this.avisoExpiracion.set(null);

    if (this.avisoTimer !== null) {
      clearTimeout(this.avisoTimer);
      this.avisoTimer = null;
    }

    if (this.countdownTimer !== null) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private cerrarTimer(): void {
    if (this.expiracionTimer !== null) {
      clearTimeout(this.expiracionTimer);
      this.expiracionTimer = null;
    }
  }

  private detenerVigilanciaInterval(): void {
    if (this.vigilanciaInterval !== null) {
      clearInterval(this.vigilanciaInterval);
      this.vigilanciaInterval = null;
    }
  }
}
