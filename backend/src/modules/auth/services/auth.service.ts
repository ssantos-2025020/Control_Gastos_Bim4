import { LoginDTO, LoginResponseDTO } from '../models/auth.model';

const ADMIN_EMAIL = 'admin@controlgastos.com';
const ADMIN_PASSWORD = 'Admin123!';

/**
 * Error de dominio para credenciales inválidas.
 * El controlador lo traduce a una respuesta HTTP 401.
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Correo o contraseña incorrectos.');
    this.name = 'InvalidCredentialsError';
  }
}

class AuthService {
  public login({ email, password }: LoginDTO): LoginResponseDTO {
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      throw new InvalidCredentialsError();
    }

    return {
      success: true,
      message: 'Has iniciado sesión correctamente como administrador',
      role: 'administrador',
    };
  }
}

export const authService = new AuthService();