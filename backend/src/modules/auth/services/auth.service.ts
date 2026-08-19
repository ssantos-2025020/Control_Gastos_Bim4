import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../../../shared/database/database.service';
import {
  LoginDTO,
  LoginResponseDTO,
  RefreshResponseDTO,
  JwtPayloadDTO,
  MeResponseDTO,
  UsuarioDTO,
} from '../models/auth.model';
import { JWT_SECRET, JWT_SIGN_OPTIONS } from '../../../config/jwt';

interface UsuarioRow {
  email: string;
  nombre: string;
  password: string;
  role: string;
}

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

function aUsuarioDTO(usuario: UsuarioRow): UsuarioDTO {
  return { email: usuario.email, nombre: usuario.nombre, role: usuario.role };
}

async function buscarUsuarioPorEmail(email: string): Promise<UsuarioRow | null> {
  const filas = await query<UsuarioRow>(
    'SELECT email, nombre, password, role FROM "usuarios" WHERE LOWER(email) = $1',
    [email.trim().toLowerCase()],
  );
  return filas[0] ?? null;
}

class AuthService {
  public async login({ email, password }: LoginDTO): Promise<LoginResponseDTO> {
    const usuario = await buscarUsuarioPorEmail(email);

    if (!usuario) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await bcrypt.compare(password, usuario.password);

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const dto = aUsuarioDTO(usuario);
    const token = this.firmarToken(dto);

    return {
      success: true,
      message: 'Has iniciado sesión correctamente como administrador',
      token,
      usuario: dto,
    };
  }

  /** Emite un token nuevo con vigencia renovada a partir de un token válido. */
  public async refresh(email: string, nombre: string, role: string): Promise<RefreshResponseDTO> {
    const usuario = await buscarUsuarioPorEmail(email);

    if (!usuario) {
      throw new InvalidCredentialsError();
    }

    const dto = aUsuarioDTO(usuario);
    const token = this.firmarToken(dto);

    return {
      success: true,
      token,
      usuario: dto,
    };
  }

  public async me(email: string, nombre: string, role: string): Promise<MeResponseDTO> {
    const usuario = await buscarUsuarioPorEmail(email);

    if (!usuario) {
      throw new InvalidCredentialsError();
    }

    return {
      success: true,
      usuario: aUsuarioDTO(usuario),
    };
  }

  private firmarToken(usuario: UsuarioDTO): string {
    const payload: JwtPayloadDTO = { email: usuario.email, nombre: usuario.nombre, role: usuario.role };
    return jwt.sign(payload, JWT_SECRET, JWT_SIGN_OPTIONS);
  }
}

export const authService = new AuthService();