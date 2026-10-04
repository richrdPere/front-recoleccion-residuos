// *********************************************************
// TIPOS
// *********************************************************

// BIGINT puede llegar como número o cadena desde el backend.
export type UsuarioIdentificador = number | string;

export type UsuarioTipoDocumento =
  | 'DNI'
  | 'RUC'
  | 'CE'
  | 'PASAPORTE';

export type UsuarioGenero = 'M' | 'F' | 'OTRO';

export type UsuarioRolNombre =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'OPERADOR'
  | 'CONDUCTOR'
  | 'RECOLECTOR'
  | 'CIUDADANO';

export type UsuariosSortBy =
  | 'id_usuario'
  | 'username'
  | 'email_acceso'
  | 'estado'
  | 'ultimo_acceso'
  | 'created_at'
  | 'updated_at';

export type UsuariosSortOrder = 'ASC' | 'DESC';

// *********************************************************
// FILTROS DE LA SOLICITUD
// *********************************************************
export interface UsuariosPaginadosFilters {
  page?: number;
  limit?: number;
  search?: string;
  estado?: boolean;
  id_rol?: UsuarioIdentificador;
  sort_by?: UsuariosSortBy;
  sort_order?: UsuariosSortOrder;
}

// *********************************************************
// PERSONA
// *********************************************************
export interface UsuarioPersona {
  id_persona: UsuarioIdentificador;
  nombres: string;
  apellidos: string;
  email_contacto: string | null;
  tipo_documento: UsuarioTipoDocumento;
  numero_documento: string;

  // Fecha YYYY-MM-DD.
  fecha_nacimiento: string | null;

  celular: string | null;
  direccion: string | null;
  foto_url: string | null;
  genero: UsuarioGenero | null;
  estado: boolean;

  // Fechas ISO enviadas por el backend.
  createdAt: string;
  updatedAt: string;
}

// *********************************************************
// ROL ASIGNADO
// *********************************************************
export interface UsuarioRolAsignado {
  id_rol: number;
  nombre: UsuarioRolNombre;
  descripcion: string | null;

  // Estado del rol en el catálogo.
  estado: boolean;

  id_usuario_rol: number;

  // Estado de la asignación al usuario.
  estado_asignacion: boolean;

  fecha_asignacion: string;
}

// *********************************************************
// USUARIO DEL LISTADO
// *********************************************************
export interface UsuarioPaginadoItem {
  id_usuario: number;
  id_persona: number;
  email_acceso: string;
  username: string;
  estado: boolean;
  ultimo_acceso: string | null;
  created_at: string;
  updated_at: string;
  persona: UsuarioPersona;
  roles: UsuarioRolAsignado[];
}

// *********************************************************
// PAGINACIÓN
// *********************************************************
export interface UsuariosPaginadosPagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// FILTROS APLICADOS POR EL BACKEND
// *********************************************************
export interface UsuariosPaginadosAppliedFilters {
  search: string;
  estado: boolean | null;
  id_rol: UsuarioIdentificador | null;
  sort_by: UsuariosSortBy;
  sort_order: UsuariosSortOrder;
}

// *********************************************************
// DATOS DE LA RESPUESTA
// *********************************************************
export interface UsuariosPaginadosData {
  items: UsuarioPaginadoItem[];
  pagination: UsuariosPaginadosPagination;
  filters: UsuariosPaginadosAppliedFilters;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export interface GetUsuariosPaginatedResponse {
  success: boolean;
  message: string;
  data: UsuariosPaginadosData;
}
