import { ApiResponse } from 'src/app/core/models/api-response.model';

// *********************************************************
// TIPOS
// *********************************************************

// BIGINT puede recibirse como número o texto desde Sequelize.
// Evita convertir identificadores grandes mediante Number().
export type AuditoriaId = number | string;

export type AuditoriaTipoActor =
  | 'USUARIO'
  | 'SISTEMA'
  | 'ANONIMO';

export type AuditoriaResultado =
  | 'EXITOSO'
  | 'RECHAZADO'
  | 'FALLIDO';

export type AuditoriaOrigen =
  | 'WEB'
  | 'MOVIL'
  | 'API'
  | 'SISTEMA'
  | 'DESCONOCIDO';

export type AuditoriaOrden = 'ASC' | 'DESC';

export type AuditoriaAlcance =
  | 'COMPLETO'
  | 'METADATOS_OPERATIVOS';

// *********************************************************
// FILTROS PARA CONSULTAR
// *********************************************************

export interface AuditoriaPaginadoFilters {
  /** Fecha civil de Perú: YYYY-MM-DD. */
  fecha_inicio: string;

  /** Fecha civil de Perú: YYYY-MM-DD. */
  fecha_fin: string;

  id_usuario?: AuditoriaId | null;

  tipo_actor?: AuditoriaTipoActor | null;

  modulo?: string | null;
  accion?: string | null;

  tipo_entidad?: string | null;

  /** Requiere tipo_entidad. */
  id_entidad?: AuditoriaId | null;

  resultado?: AuditoriaResultado | null;
  origen?: AuditoriaOrigen | null;

  request_id?: string | null;
  clave_operacion?: string | null;

  page?: number | null;
  limit?: number | null;

  sort_order?: AuditoriaOrden | null;
}

// *********************************************************
// FILTROS APLICADOS POR EL BACKEND
// *********************************************************

export interface AuditoriaFiltrosAplicados {
  fecha_inicio: string;
  fecha_fin: string;

  // El service del backend normaliza este ID a texto.
  id_usuario?: string;

  tipo_actor?: AuditoriaTipoActor;

  modulo?: string;
  accion?: string;

  tipo_entidad?: string;
  id_entidad?: string;

  resultado?: AuditoriaResultado;
  origen?: AuditoriaOrigen;

  request_id?: string;
  clave_operacion?: string;
}

// *********************************************************
// ITEM DEL LISTADO
// *********************************************************

export interface AuditoriaListadoItem {
  id_auditoria: AuditoriaId;
  clave_evento: string;

  id_usuario: AuditoriaId | null;
  tipo_actor: AuditoriaTipoActor;

  modulo: string;
  accion: string;

  tipo_entidad: string | null;
  id_entidad: string | null;

  resultado: AuditoriaResultado;

  /** Fecha ISO en UTC. */
  fecha_servidor: string;

  /** Fecha ISO en UTC, cuando la operación incluye esta fecha. */
  fecha_dispositivo: string | null;

  origen: AuditoriaOrigen;

  request_id: string | null;
  clave_operacion: string | null;
}

// *********************************************************
// PAGINACIÓN
// *********************************************************

export interface AuditoriaPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// METADATA
// *********************************************************

export interface AuditoriaPaginadoMetadata {
  zona_horaria: 'America/Lima';
  generado_en: string;

  orden: {
    sort_by: 'fecha_servidor';
    sort_order: AuditoriaOrden;
  };

  alcance: AuditoriaAlcance;

  // obtenerActor() normaliza el identificador a texto.
  generado_por: string;
}

// *********************************************************
// DATA
// *********************************************************

export interface AuditoriaPaginadoData {
  items: AuditoriaListadoItem[];
  filtros_aplicados: AuditoriaFiltrosAplicados;
  pagination: AuditoriaPagination;
  metadata: AuditoriaPaginadoMetadata;
}

// *********************************************************
// RESPONSE
// *********************************************************

export type GetAuditoriaPaginadoResponse = ApiResponse<AuditoriaPaginadoData>;
