import { ApiResponse } from 'src/app/core/models/api-response.model';
import { RecorridoEvento } from './cancelar-recorrido.interface';

// *********************************************************
// QUERY PARAMS
// *********************************************************
export interface GetRecorridoEventosParams {
  page?: number;
  limit?: number;
  tipo_evento?: RecorridoEvento['tipo_evento'];
}

// *********************************************************
// DATA PAGINADA
// *********************************************************
export interface RecorridoEventosData {
  items: RecorridoEvento[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetRecorridoEventosResponse = ApiResponse<RecorridoEventosData>;
