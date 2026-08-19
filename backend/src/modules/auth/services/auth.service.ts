import jwt from 'jsonwebtoken';
import { LoginDTO, LoginResponseDTO, JwtPayloadDTO, MeResponseDTO } from '../models/auth.model';
import { JWT_SECRET, JWT_SIGN_OPTIONS } from '../../../config/jwt';

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

    const payload: JwtPayloadDTO = { email: ADMIN_EMAIL, role: 'administrador' };
    const token = jwt.sign(payload, JWT_SECRET, JWT_SIGN_OPTIONS);

    return {
      success: true,
      message: 'Has iniciado sesión correctamente como administrador',
      role: 'administrador',
      token,
    };
  }

  public me(email: string): MeResponseDTO {
    return {
      success: true,
      email,
      role: 'administrador',
    };
  }
}

export const authService = new AuthService();
