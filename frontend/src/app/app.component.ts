import { Component, inject, signal } from '@angular/core';
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
export class AppComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  cargando = signal(false);
  errorMensaje = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  mostrarPassword = signal(false);
  anio = new Date().getFullYear();

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
        this.mensajeExito.set(res.message);
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err?.error?.message ?? 'No se pudo conectar con el servidor.';
        this.errorMensaje.set(msg);
      },
    });
  }

  cerrarSesion(): void {
    this.mensajeExito.set(null);
    this.loginForm.reset();
    this.errorMensaje.set(null);
  }
}