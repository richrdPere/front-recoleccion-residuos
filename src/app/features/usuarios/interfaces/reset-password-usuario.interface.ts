import { ApiResponse } from 'src/app/core/models/api-response.model';
import { UsuarioIdentificador } from './get-usuarios-paginados.interface';

// ============================================================
// REQUEST
// ============================================================

export interface ResetPasswordUsuarioRequest {
  nueva_password: string;
}

// ============================================================
// DATA
// ============================================================

export interface ResetPasswordUsuarioData {
  id_usuario: UsuarioIdentificador;
  password_actualizada: boolean;
  sesiones_revocadas: number;
}

// ============================================================
// RESPONSE
// ============================================================

export type ResetPasswordUsuarioResponse =
  ApiResponse<ResetPasswordUsuarioData>;
