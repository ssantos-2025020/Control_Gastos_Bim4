import { Request, Response } from 'express';
import { authService, InvalidCredentialsError } from '../services/auth.service';
import { LoginDTO } from '../models/auth.model';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

class AuthController {
  public login(req: Request, res: Response): void {
    const { email, password } = req.body as LoginDTO;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Correo y contraseña son obligatorios.' });
      return;
    }

    try {
      const resultado = authService.login({ email, password });
      res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        res.status(401).json({ success: false, message: error.message });
        return;
      }

      console.error('[AuthController] Error en login:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
  }

  public me(req: AuthenticatedRequest, res: Response): void {
    const email = req.user?.email ?? '';
    res.status(200).json(authService.me(email));
  }
}

export const authController = new AuthController();
