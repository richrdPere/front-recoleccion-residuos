import { InjectionToken, Provider } from '@angular/core';
import type { Observable } from 'rxjs';
import { MonitoreoUltimaUbicacion } from 'src/app/features/monitoreo/interfaces';

export interface MonitoreoSocketConfig {
  /** Origen del servidor, sin /api. Ejemplo: https://api.municipalidad.pe */
  url: string;
  /** Leer la sesión actual cada vez; no capturar un token fijo al arrancar. */
  obtenerToken: () => string | null | Promise<string | null>;
  path?: string;
  renovarToken?: () => Promise<string | null>;
  tokensActualizados$?: Observable<void>;
  sesionCerrada$?: Observable<void>;
}

export const MONITOREO_SOCKET_CONFIG = new InjectionToken<MonitoreoSocketConfig>('MONITOREO_SOCKET_CONFIG');

export function provideMonitoreoSocket(config: MonitoreoSocketConfig): Provider {
  return { provide: MONITOREO_SOCKET_CONFIG, useValue: config };
}

export interface ErrorSocket {
  code: string;
  message: string;
  statusCode: number;
}

export type EstadoConexionSocket =
  | 'DESCONECTADO'
  | 'CONECTANDO'
  | 'SUSCRIBIENDO'
  | 'EN_VIVO'
  | 'ERROR';

export interface TrackingActualizadoSocket {
  id_recorrido: number | string;
  id_posicion: number | string;
  fecha_dispositivo: string;
  // DECIMAL y BIGINT pueden serializarse como texto.
  ubicacion: Omit<MonitoreoUltimaUbicacion,
    'id_ultima_ubicacion' | 'id_recorrido' | 'id_posicion' | 'id_usuario' |
    'latitud' | 'longitud'> & {
      id_ultima_ubicacion: number | string;
      id_recorrido: number | string;
      id_posicion: number | string;
      id_usuario: number | string;
      latitud: number | string;
      longitud: number | string;
    };
}

export interface RecorridoActualizadoSocket {
  id_recorrido: number | string;
  id_programacion: number | string;
  estado_recorrido: string;
  updated_at: string;
}

export type RespuestaSocket<T> =
  | { success: true; data: T; message: string }
  | ({ success: false; data?: null } & ErrorSocket);

