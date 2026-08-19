import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  private expiracionTimer: ReturnType<typeof setTimeout> | null = null;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  cargando = signal(false);
  errorMensaje = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  mostrarPassword = signal(false);
  anio = new Date().getFullYear();

  ngOnInit(): void {
    if (this.authService.token) {
      this.authService.me().subscribe({
        next: (res) => {
          this.mensajeExito.set(`Sesión de ${res.email} (${res.role})`);
          this.programarExpiracion();
        },
        error: (err) => {
          this.authService.cerrarSesion();
          this.errorMensaje.set(
            err?.status === 401
              ? 'Tu sesión ha expirado. Vuelve a iniciar sesión.'
              : 'No se pudo conectar con el servidor.'
          );
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.cerrarTimer();
  }

  private programarExpiracion(): void {
    const exp = this.authService.expiracion;
    if (exp === null) {
      return;
    }

    const ms = exp * 1000 - Date.now();
    if (ms <= 0) {
      this.expirarSesion();
      return;
    }

    this.expiracionTimer = setTimeout(() => this.expirarSesion(), ms);
  }

  private expirarSesion(): void {
    this.authService.cerrarSesion();
    this.mensajeExito.set(null);
    this.loginForm.reset();
    this.errorMensaje.set('Tu sesión ha expirado. Vuelve a iniciar sesión.');
  }

  private cerrarTimer(): void {
    if (this.expiracionTimer !== null) {
      clearTimeout(this.expiracionTimer);
      this.expiracionTimer = null;
    }
  }

  get emailInvalido(): boolean {
    const c = this.loginForm.controls.email;
    return (c.touched || c.dirty) && !!c.errors;
  }

  get passwordInvalido(): boolean {
    const c = this.loginForm.controls.password;
    return (c.touched || c.dirty) && !!c.errors;
  }

  togglePassword(): void {
    this.mostrarPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.authService.login(email ?? '', password ?? '').subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.token) {
          this.authService.guardarToken(res.token);
        }
        this.mensajeExito.set(res.message);
        this.programarExpiracion();
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err?.error?.message ?? 'No se pudo conectar con el servidor.';
        this.errorMensaje.set(msg);
      },
    });
  }

  cerrarSesion(): void {
    this.cerrarTimer();
    this.authService.cerrarSesion();
    this.mensajeExito.set(null);
    this.loginForm.reset();
    this.errorMensaje.set(null);
  }
}