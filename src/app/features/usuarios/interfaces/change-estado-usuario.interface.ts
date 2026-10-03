import { ApiResponse } from 'src/app/core/models/api-response.model';
import { UsuarioIdentificador } from './get-usuarios-paginados.interface';

// ============================================================
// REQUEST
// ============================================================
export interface ChangeEstadoUsuarioRequest {
  estado: boolean;
}

// ============================================================
// DATA
// ============================================================
export interface ChangeEstadoUsuarioData {
  id_usuario: UsuarioIdentificador;
  estado: boolean;
  updated_at: string;

  // false cuando el usuario ya tenía el estado solicitado.
  changed: boolean;
}

// ============================================================
// RESPONSE
// ============================================================
export type ChangeEstadoUsuarioResponse = ApiResponse<ChangeEstadoUsuarioData>;
