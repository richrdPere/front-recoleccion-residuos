import { ApiResponse } from 'src/app/core/models/api-response.model';

import {
  AuditoriaAlcance,
  AuditoriaListadoItem,
} from './auditoria-paginado.interface';

// *********************************************************
// CAMBIOS REGISTRADOS
// *********************************************************

export type AuditoriaValorSimple =
  | string
  | number
  | boolean
  | null;

export type AuditoriaValorCambio =
  | AuditoriaValorSimple
  | AuditoriaValorSimple[];

export interface AuditoriaCambioCampo {
  anterior: AuditoriaValorCambio;
  posterior: AuditoriaValorCambio;
}

export interface AuditoriaCambios {
  [campo: string]: AuditoriaCambioCampo;
}

// *********************************************************
// EVENTO COMPLETO
// *********************************************************

export interface AuditoriaEventoCompleto
  extends AuditoriaListadoItem {

  roles_actor: string[];

  cambios: AuditoriaCambios | null;

  motivo: string | null;
  codigo_resultado: string | null;

  ip: string | null;
  user_agent: string | null;
}

// *********************************************************
// DATA SEGÚN EL ALCANCE AUTORIZADO
// *********************************************************

export interface AuditoriaDetalleCompletoData {
  evento: AuditoriaEventoCompleto;

  metadata: {
    alcance: Extract<AuditoriaAlcance, 'COMPLETO'>;
  };
}

export interface AuditoriaDetalleOperativoData {
  // El backend no incluye los campos adicionales del detalle.
  evento: AuditoriaListadoItem;

  metadata: {
    alcance: Extract<
      AuditoriaAlcance,
      'METADATOS_OPERATIVOS'
    >;
  };
}

export type AuditoriaDetalleData =
  | AuditoriaDetalleCompletoData
  | AuditoriaDetalleOperativoData;

// *********************************************************
// RESPONSE
// *********************************************************

export type GetAuditoriaByIdResponse = ApiResponse<AuditoriaDetalleData>;
