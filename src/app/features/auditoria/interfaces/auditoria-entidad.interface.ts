import { ApiResponse } from 'src/app/core/models/api-response.model';

import {
  AuditoriaFiltrosAplicados,
  AuditoriaPaginadoData,
  AuditoriaPaginadoFilters,
} from './auditoria-paginado.interface';

// *********************************************************
// FILTROS DE CONSULTA
// *********************************************************

// La entidad se indica exclusivamente en la URL.
export type AuditoriaEntidadFilters = Omit<
  AuditoriaPaginadoFilters,
  'tipo_entidad' | 'id_entidad'
>;

// *********************************************************
// FILTROS APLICADOS
// *********************************************************

export interface AuditoriaEntidadFiltrosAplicados
  extends AuditoriaFiltrosAplicados {

  tipo_entidad: string;
  id_entidad: string;
}

// *********************************************************
// DATA
// *********************************************************

export interface AuditoriaEntidadData
  extends AuditoriaPaginadoData {

  filtros_aplicados: AuditoriaEntidadFiltrosAplicados;
}

// *********************************************************
// RESPONSE
// *********************************************************

export type GetAuditoriaByEntidadResponse = ApiResponse<AuditoriaEntidadData>;
