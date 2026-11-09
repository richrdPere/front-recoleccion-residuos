import {  Injectable,  inject} from '@angular/core';
import {  HttpClient,  HttpParams} from '@angular/common/http';

import type {
  FeatureCollection,
} from 'geojson';

import {
  environment,
} from 'src/environments/environment';

import type {
  ApiResponse,
} from 'src/app/core/models/api-response.model';

import type {
  PuntoRecorridoData,
} from '../../recolecciones/interfaces';

export interface HistorialFila {
  id_recorrido: number;
  ruta: string | null;
  zona: string | null;
  placa: string | null;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string | null;
}

export interface HistorialListado {
  items: HistorialFila[];

  pagination: {
    page: number;
    total_pages: number;
    total: number;
  };
}

export interface HistorialDetalle {
  recorrido: {
    id_recorrido: number;
    estado_recorrido: string;

    fecha_hora_inicio: string;
    fecha_hora_finalizacion: string | null;

    kilometraje_inicio: string | number | null;
    kilometraje_final: string | number | null;

    distancia_recorrida_metros: string | number | null;
    motivo_cancelacion: string | null;

    resultado_final: {
      cantidad_total: number;
      unidad_medida: string;
      observacion: string;

      vehiculo?: {
        placa: string;
      } | null;

      capacidad?: {
        porcentaje: number;
      } | null;
    } | null;
  };

  programacion: {
    fecha_programada: string;
    turno: string;

    ruta: {
      nombre: string;
      zona: {
        nombre: string;
      } | null;
    } | null;

    vehiculo: {
      placa: string;
    } | null;
  };

  equipo: {
    id_personal: number;
    funcion: string;
    estado_asignacion: string;
    usuario: string | null;
  }[];

  tiempos: {
    total_segundos: number | null;
    pausa_segundos: number | null;
    operacion_segundos: number | null;

    pausas: {
      inicio: string;
      fin: string;
      duracion_segundos: number;
      abierta: boolean;
    }[];

    advertencias: string[];
  };

  eventos: {
    id_recorrido_evento: number;
    tipo_evento: string;
    fecha_evento: string;
    observacion: string | null;

    usuario: {
      username: string;
    } | null;
  }[];

  puntos: PuntoRecorridoData[];

  resumen_puntos: {
    total: number;
    atendidos: number;
    omitidos: number;
    pendientes: number;
  };

  incidencias: {
    id_incidencia: number;
    titulo: string;
    descripcion: string;
    tipo: string;
    prioridad: string;
    estado_incidencia: string;
    fecha_reporte: string;
  }[];

  generado_en: string;
  nota_incidencias: string;
}

export interface HistorialTrazado {
  geojson: FeatureCollection;

  total_en_servidor: number;
  muestras_cargadas: number;
  muestras_validas: number;
  muestras_descartadas: number;

  corte_por_hueco_segundos: number;
  sincronizacion_dispositivos_verificada: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HistorialService {
  private readonly http = inject(HttpClient);

  private readonly base =
    environment.apiUrl.replace(/\/+$/, '') +
    '/recorridos/historial';

  listar(
    filtros: Record<string, string | number>,
  ) {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(filtros)) {
      if (value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<ApiResponse<HistorialListado>>(
      this.base,
      { params },
    );
  }

  detalle(id: number) {
    return this.http.get<ApiResponse<HistorialDetalle>>(
      `${this.base}/${id}`,
    );
  }

  trazado(id: number) {
    return this.http.get<ApiResponse<HistorialTrazado>>(
      `${this.base}/${id}/trazado`,
    );
  }
}
