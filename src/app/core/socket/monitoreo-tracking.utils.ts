
import { MonitoreoGps, MonitoreoUltimaUbicacion } from 'src/app/features/monitoreo/interfaces';
import type { TrackingActualizadoSocket } from './monitoreo-socket.types';

function identificador(value: unknown): number | null {

  if (typeof value !== 'string' && typeof value !== 'number')
    return null;

  if (!/^[1-9]\d*$/.test(String(value)))
    return null;

  const result = Number(value);

  return Number.isSafeInteger(result) ? result : null;
}

/** No convertir BIGINT fuera del rango seguro ni aceptar fechas/coordenadas inválidas. */
export function normalizarTracking(event: TrackingActualizadoSocket): MonitoreoUltimaUbicacion | null {
  if (!event?.ubicacion)
    return null;

  const u = event.ubicacion;
  const recorrido = identificador(event.id_recorrido);
  const posicion = identificador(event.id_posicion);
  const ultima = identificador(u.id_ultima_ubicacion);
  const usuario = identificador(u.id_usuario);
  const lat = Number(u.latitud), lng = Number(u.longitud);

  if (!recorrido || !posicion || !ultima || !usuario ||
    identificador(u.id_recorrido) !== recorrido || identificador(u.id_posicion) !== posicion ||
    u.latitud == null || u.longitud == null ||
    String(u.latitud).trim() === '' || String(u.longitud).trim() === '' ||
    !Number.isFinite(lat) || !Number.isFinite(lng) ||
    Math.abs(lat) > 90 || Math.abs(lng) > 180 || u.es_ubicacion_simulada !== false ||
    !Number.isFinite(Date.parse(u.fecha_dispositivo)) ||
    !Number.isFinite(Date.parse(u.fecha_recepcion)) ||
    Date.parse(u.fecha_dispositivo) > Date.now() + 300000) return null;

  const decimal = (value: unknown): string | null => value == null ? null : String(value);

  return {
    ...u,
    id_ultima_ubicacion: ultima,
    id_recorrido: recorrido,
    id_posicion: posicion,
    id_usuario: usuario,

    latitud: String(u.latitud),
    longitud: String(u.longitud),

    precision_gps: decimal(u.precision_gps),
    altitud: decimal(u.altitud),
    velocidad_mps: decimal(u.velocidad_mps),
    rumbo: decimal(u.rumbo),
    nivel_bateria: decimal(u.nivel_bateria),

    es_ubicacion_simulada: false,
    fecha_dispositivo: '',
    fecha_recepcion: '',
    created_at: '',
    updated_at: ''
  };
}

export function esMasReciente(nueva: MonitoreoUltimaUbicacion, actual: MonitoreoUltimaUbicacion | null): boolean {
  if (!actual)
    return true;

  const a = Date.parse(actual.fecha_dispositivo), n = Date.parse(nueva.fecha_dispositivo);

  if (!Number.isFinite(n)) return false;
  if (!Number.isFinite(a)) return true;

  return n > a || (n === a && Number(nueva.id_posicion) > Number(actual.id_posicion));
}

/** Estado visual del cliente; las reglas de alertas continúan en el backend. */
export function gpsVisual(ubicacion: MonitoreoUltimaUbicacion, ahora = Date.now()): MonitoreoGps {
  const fecha = Date.parse(ubicacion.fecha_dispositivo);
  const segundos = Number.isFinite(fecha) ?
    Math.max(0, Math.floor((ahora - fecha) / 1000)) :
    null;

  return {
    estado: segundos !== null && segundos <= 120 ? 'ACTUALIZADO' : 'DESACTUALIZADO',
    segundos_sin_actualizar: segundos,
    fecha_ultima_posicion: ubicacion.fecha_dispositivo,
  };
}
