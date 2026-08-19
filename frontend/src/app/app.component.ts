import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, AVISO_SEGUNDOS } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  protected authService = inject(AuthService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  cargando = signal(false);
  verificando = signal(false);
  errorMensaje = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  mostrarPassword = signal(false);
  capsLockActivo = signal(false);
  extendiendo = signal(false);
  anio = new Date().getFullYear();

  protected avisoSegundos = AVISO_SEGUNDOS;

  private vigilanciaUI: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.authService.iniciarVigilancia();

    // Vigilancia directa en la UI: si el token ya expiró, volvemos al login
    // aunque el aviso o los timers del servicio fallen.
    this.vigilanciaUI = setInterval(() => {
      if (this.mensajeExito() && !this.authService.isAuthenticated()) {
        this.volverAlLogin();
      }
    }, 1000);

    if (this.authService.token && this.authService.isAuthenticated()) {
      this.restaurarSesion();
    }
  }

  ngOnDestroy(): void {
    if (this.vigilanciaUI !== null) {
      clearInterval(this.vigilanciaUI);
      this.vigilanciaUI = null;
    }
  }

  private volverAlLogin(): void {
    const mensaje =
      this.authService.sesionExpirada() ?? 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
    this.authService.cerrarSesion();
    this.mensajeExito.set(null);
    this.errorMensaje.set(mensaje);
    this.loginForm.reset();
  }

  /** Detecta si Bloq Mayús está activado mientras se escribe la contraseña. */
  detectarCapsLock(event: KeyboardEvent): void {
    const esLetra = event.key.length === 1 && /[a-zA-Z]/.test(event.key);
    if (!esLetra) {
      return;
    }
    this.capsLockActivo.set(event.getModifierState('CapsLock'));
  }

  /** Inclina la tarjeta siguiendo el mouse (efecto 3D). */
  cardTilt(event: MouseEvent): void {
    const card = event.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--rotate-y', `${px * 8}deg`);
    card.style.setProperty('--rotate-x', `${-py * 8}deg`);
  }

  cardReset(): void {
    const card = document.querySelector('.login-panel-inner') as HTMLElement | null;
    if (!card) return;
    card.style.setProperty('--rotate-y', '0deg');
    card.style.setProperty('--rotate-x', '0deg');
  }

  togglePassword(): void {
    this.mostrarPassword.update((valor) => !valor);
  }

  /**
   * Si ya existe un token válido, valida contra el backend con /me.
   * Si el token no es válido, limpia la sesión.
   */
  private restaurarSesion(): void {
    this.verificando.set(true);

    this.authService.me().subscribe({
      next: (res) => {
        this.verificando.set(false);
        this.mensajeExito.set(`Sesión de ${res.usuario.email} (${res.usuario.role})`);
      },
      error: () => {
        this.verificando.set(false);
        this.authService.cerrarSesion();
      },
    });
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
        this.mensajeExito.set(res.message);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err?.error?.message ?? 'No se pudo conectar con el servidor.');
      },
    });
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.mensajeExito.set(null);
    this.loginForm.reset();
    this.errorMensaje.set(null);
  }

  extender(): void {
    this.extendiendo.set(true);

    this.authService.extenderSesion().subscribe({
      next: () => {
        this.extendiendo.set(false);
        this.authService.descartarAviso();
      },
      error: () => {
        this.extendiendo.set(false);
        this.authService.descartarAviso();
      },
    });
  }

  noExtender(): void {
    this.authService.descartarAviso();
  }

  get emailInvalido(): boolean {
    const c = this.loginForm.controls.email;
    return (c.touched || c.dirty) && !!c.errors;
  }

  get emailValido(): boolean {
    const c = this.loginForm.controls.email;
    return c.valid && (c.touched || c.dirty);
  }

  get passwordInvalido(): boolean {
    const c = this.loginForm.controls.password;
    return (c.touched || c.dirty) && !!c.errors;
  }

  get passwordValido(): boolean {
    const c = this.loginForm.controls.password;
    return c.valid && (c.touched || c.dirty);
  }
}
