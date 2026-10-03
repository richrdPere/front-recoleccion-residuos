import type {
  UsuarioIdentificador,
  UsuarioRolAsignado,
} from './get-usuarios-paginados.interface';

// *********************************************************
// FILTROS DE LA SOLICITUD
// *********************************************************
export interface UsuarioRolesFilters {
  estado?: boolean;
}

// *********************************************************
// FILTROS APLICADOS
// *********************************************************
export interface UsuarioRolesAppliedFilters {
  estado: boolean | null;
}

// *********************************************************
// DATOS
// *********************************************************
export interface UsuarioRolesData {
  id_usuario: UsuarioIdentificador;
  username: string;
  estado_usuario: boolean;
  roles: UsuarioRolAsignado[];
  total: number;
  filters: UsuarioRolesAppliedFilters;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export interface GetUsuarioRolesResponse {
  success: boolean;
  message: string;
  data: UsuarioRolesData;
}
