/**
 * DTOs (Data Transfer Objects) del módulo auth.
 * Sin base de datos: las credenciales de administrador están
 * definidas en el servicio.
 */

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  success: boolean;
  message: string;
  role: string;
}