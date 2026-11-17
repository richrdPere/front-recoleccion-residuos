import {
  ApiResponse,
} from 'src/app/core/models/api-response.model';

export type EstadoCiudadano =
  | 'PENDIENTE'
  | 'ACTIVO'
  | 'SUSPENDIDO'
  | 'INACTIVO';

export type OrigenRegistroCiudadano =
  | 'WEB'
  | 'APP'
  | 'QR'
  | 'ADMINISTRATIVO';

export interface CiudadanosPaginadosFilters {
  page?: number;
  limit?: number;
  search?: string;

  estado_ciudadano?: EstadoCiudadano;
  origen_registro?: OrigenRegistroCiudadano;
}

export interface CiudadanoListadoItem {
  id_ciudadano: number | string;
  id_usuario: number | string;

  nombres: string | null;
  apellidos: string | null;

  tipo_documento: string | null;
  numero_documento: string | null;

  celular: string | null;
  email_acceso: string | null;
  username: string | null;

  estado_ciudadano: EstadoCiudadano;
  origen_registro: OrigenRegistroCiudadano;

  celular_verificado: boolean;

  acepta_tratamiento_datos: boolean;
  fecha_consentimiento: string | null;
  version_consentimiento: string | null;

  fecha_registro: string;
}

export interface CiudadanosPaginadosData {
  items: CiudadanoListadoItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export type GetCiudadanosPaginadosResponse =
  ApiResponse<CiudadanosPaginadosData>;
