import { ApiResponse } from
  'src/app/core/models/api-response.model';

import {
  UsuarioIdentificador,
  UsuarioRolNombre,
  UsuarioTipoDocumento,
} from './get-usuarios-paginados.interface';

// ============================================================
// FILTROS
// ============================================================
export interface UsuariosSinPersonalFilters {
  search?: string;
  id_rol?: UsuarioIdentificador;
  limit?: number;
}

// ============================================================
// ROL DEL USUARIO
// ============================================================
export interface UsuarioSinPersonalRol {
  id_rol: UsuarioIdentificador;
  nombre: UsuarioRolNombre;
}

// ============================================================
// USUARIO DISPONIBLE
// ============================================================
export interface UsuarioSinPersonalItem {
  id_usuario: UsuarioIdentificador;
  id_persona: UsuarioIdentificador;

  username: string;
  email_acceso: string;

  nombre_completo: string;
  tipo_documento: UsuarioTipoDocumento;
  numero_documento: string;
  foto_url: string | null;

  label: string;

  roles: UsuarioSinPersonalRol[];
}

// ============================================================
// RESPONSE
// ============================================================
export type GetUsuariosSinPersonalResponse = ApiResponse<UsuarioSinPersonalItem[]>;
