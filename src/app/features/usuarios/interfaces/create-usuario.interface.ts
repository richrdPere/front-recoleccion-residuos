import { ApiResponse } from 'src/app/core/models/api-response.model';
import { UsuarioGenero, UsuarioIdentificador, UsuarioRolNombre, UsuarioTipoDocumento } from './get-usuarios-paginados.interface';

// ============================================================
// REQUEST: PERSONA
// ============================================================

export interface CreateUsuarioPersonaRequest {
  nombres: string;
  apellidos: string;

  // El backend usa DNI cuando se omite.
  tipo_documento?: UsuarioTipoDocumento;
  numero_documento: string;

  email_contacto?: string | null;
  fecha_nacimiento?: string | null;
  celular?: string | null;
  direccion?: string | null;
  foto_url?: string | null;
  genero?: UsuarioGenero | null;
}

// ============================================================
// REQUEST: USUARIO
// ============================================================

export interface CreateUsuarioRequest {
  username: string;
  email_acceso: string;
  password: string;

  estado?: boolean;

  roles_ids: UsuarioIdentificador[];

  persona: CreateUsuarioPersonaRequest;
}

// ============================================================
// RESPONSE: PERSONA
// ============================================================

export interface CreateUsuarioPersonaData {
  id_persona: UsuarioIdentificador;

  nombres: string;
  apellidos: string;

  email_contacto: string | null;
  tipo_documento: UsuarioTipoDocumento;
  numero_documento: string;

  fecha_nacimiento: string | null;
  celular: string | null;
  direccion: string | null;
  foto_url: string | null;
  genero: UsuarioGenero | null;

  estado: boolean;

  createdAt: string;
  updatedAt: string;
}

// ============================================================
// RESPONSE: ROL ASIGNADO
// ============================================================

export interface CreateUsuarioRolData {
  id_rol: UsuarioIdentificador;
  nombre: UsuarioRolNombre;
  descripcion: string | null;
  estado: boolean;

  id_usuario_rol: UsuarioIdentificador;
  estado_asignacion: boolean;
  fecha_asignacion: string;
}

// ============================================================
// RESPONSE: USUARIO
// ============================================================

export interface CreateUsuarioData {
  id_usuario: UsuarioIdentificador;
  id_persona: UsuarioIdentificador;

  email_acceso: string;
  username: string;
  estado: boolean;

  ultimo_acceso: string | null;

  created_at: string;
  updated_at: string;

  persona: CreateUsuarioPersonaData;
  roles: CreateUsuarioRolData[];
}

// ============================================================
// RESPONSE
// ============================================================

export type CreateUsuarioResponse = ApiResponse<CreateUsuarioData>;
