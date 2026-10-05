import {
  EstadoLaboralPersonal,
  EstadoLicencia,
  GeneroPersona,
  NombreRol,
  TipoContratoPersonal,
  TipoDocumento,
  TurnoPreferentePersonal,
} from './personal-operativo.types';

// =========================================================
// ROL
// =========================================================

export interface PersonalRolData {
  id_rol: number;
  nombre: NombreRol;
  descripcion: string | null;
}

// =========================================================
// PERSONA
// =========================================================

export interface PersonalPersonaData {
  id_persona: number;

  nombres: string;
  apellidos: string;

  email_contacto: string | null;

  tipo_documento: TipoDocumento;
  numero_documento: string;

  fecha_nacimiento: string | null;

  celular: string | null;
  direccion: string | null;
  foto_url: string | null;

  genero: GeneroPersona | null;

  estado: boolean;
}

// =========================================================
// USUARIO
// =========================================================

export interface PersonalUsuarioData {
  id_usuario: number;
  id_persona: number;

  email_acceso: string;
  username: string;

  estado: boolean;
  ultimo_acceso: string | null;

  persona: PersonalPersonaData;
  roles: PersonalRolData[];
}

// =========================================================
// CONDUCTOR
// =========================================================

export interface PersonalConductorData {
  id_conductor: number;
  id_personal: number;

  numero_licencia: string;
  categoria_licencia: string;

  fecha_emision_licencia: string;
  fecha_vencimiento_licencia: string;

  estado_licencia: EstadoLicencia;

  restricciones: string | null;
  observacion: string | null;

  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// =========================================================
// PERSONAL OPERATIVO
// =========================================================

export interface PersonalOperativoData {
  id_personal: number;
  id_usuario: number;

  codigo_empleado: string;

  fecha_ingreso: string;
  fecha_salida: string | null;

  tipo_contrato: TipoContratoPersonal;
  turno_preferente: TurnoPreferentePersonal | null;
  estado_laboral: EstadoLaboralPersonal;

  observacion: string | null;

  estado: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  usuario: PersonalUsuarioData;

  /*
   * Solamente tendrá datos cuando el personal
   * también tenga registrado un perfil de conductor.
   */
  conductor: PersonalConductorData | null;
}
