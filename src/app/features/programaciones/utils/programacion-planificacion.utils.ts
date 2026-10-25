import { RutaActivaData } from '../../rutas/interfaces/rutas/get-rutas-activas.interface';
import { RutaHorarioData } from '../../rutas/interfaces/rutas/get-ruta-by-zona-id.interface';

export function fechaCalendarioValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
    return false;

  const valor = new Date(`${fecha}T12:00:00Z`);
  return Number.isFinite(valor.getTime()) && valor.toISOString().slice(0, 10) === fecha;
}

export function dentroDeVigencia(
  fecha: string,
  desde: string,
  hasta: string | null
): boolean {

  return fechaCalendarioValida(fecha) && fechaCalendarioValida(desde) &&
    (!hasta || fechaCalendarioValida(hasta)) && fecha >= desde && (!hasta || fecha <= hasta);
}

export function versionProgramable(ruta: RutaActivaData, fecha: string): boolean {
  const version = ruta.version_vigente;

  return ruta.estado && ruta.estado_ruta === 'ACTIVA'
    && !ruta.deleted_at &&
    !!version &&
    version.id_ruta === ruta.id_ruta &&
    version.estado && version.vigente &&
    !version.deleted_at &&
    dentroDeVigencia(fecha, version.fecha_vigencia_desde, version.fecha_vigencia_hasta);
}

export function horarioAplicable(
  horario: RutaHorarioData,
  fecha: string): boolean {

  if (!horario.estado || horario.deleted_at || !dentroDeVigencia(fecha, horario.fecha_vigencia_desde, horario.fecha_vigencia_hasta)) return false;

  const dia = horario.dia_semana.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

  const dias = [
    ['DOMINGO', 'DOM', 'DO', '7', '0'],
    ['LUNES', 'LUN', 'LU', '1'],
    ['MARTES', 'MAR', 'MA', '2'],
    ['MIERCOLES', 'MIE', 'MI', '3'],
    ['JUEVES', 'JUE', 'JU', '4'],
    ['VIERNES', 'VIE', 'VI', '5'],
    ['SABADO', 'SAB', 'SA', '6']
  ];

  const indice = new Date(`${fecha}T12:00:00Z`).getUTCDay();
  return dias[indice].includes(dia) || ['TODOS', 'DIARIO', 'TODOS LOS DIAS'].includes(dia);
}
