import { ApiResponse } from 'src/app/core/models/api-response.model';

import {
  UsuarioIdentificador,
  UsuarioRolNombre,
} from './get-usuarios-paginados.interface';

// ============================================================
// ROL DEL CATÁLOGO
// ============================================================
export interface UsuarioRolCatalogo {
  id_rol: UsuarioIdentificador;
  nombre: UsuarioRolNombre;
  descripcion: string | null;
  estado: boolean;
}

// ============================================================
// RESPONSE
// ============================================================
export type GetRolesResponse = ApiResponse<UsuarioRolCatalogo[]>;
