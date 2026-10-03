import { ApiResponse } from 'src/app/core/models/api-response.model';
import { UsuarioIdentificador } from './get-usuarios-paginados.interface';

// ============================================================
// DATA
// ============================================================
export interface DeleteUsuarioData {
  id_usuario: UsuarioIdentificador;
  deleted: boolean;
  sesiones_revocadas: number;
}

// ============================================================
// RESPONSE
// ============================================================
export type DeleteUsuarioResponse = ApiResponse<DeleteUsuarioData>;
