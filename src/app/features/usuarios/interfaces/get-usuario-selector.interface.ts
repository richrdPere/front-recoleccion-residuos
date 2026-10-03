import type {
  UsuarioIdentificador,
  UsuarioRolNombre,
  UsuarioTipoDocumento,
} from './get-usuarios-paginados.interface';

// *********************************************************
// FILTROS
// *********************************************************
export interface UsuarioSelectorFilters {
  search?: string;
  id_rol?: UsuarioIdentificador;
  limit?: number;
}

// *********************************************************
// ROL DEL SELECTOR
// *********************************************************
export interface UsuarioSelectorRol {
  id_rol: UsuarioIdentificador;
  nombre: UsuarioRolNombre;
}

// *********************************************************
// USUARIO DEL SELECTOR
// *********************************************************
export interface UsuarioSelectorItem {
  id_usuario: UsuarioIdentificador;
  id_persona: UsuarioIdentificador;
  username: string;
  email_acceso: string;
  nombre_completo: string;
  tipo_documento: UsuarioTipoDocumento;
  numero_documento: string;
  foto_url: string | null;
  label: string;
  roles: UsuarioSelectorRol[];
}

// *********************************************************
// RESPUESTA
// *********************************************************
export interface GetUsuarioSelectorResponse {
  success: boolean;
  message: string;
  data: UsuarioSelectorItem[];
}
