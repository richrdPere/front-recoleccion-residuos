import {
  PerfilCiudadanoPreferencias,
} from './get-perfil-ciudadano.interface';

// *********************************************************
// REQUEST
// *********************************************************
export interface ActualizarPreferenciasNotificacionRequest {
  notificaciones_habilitadas: boolean;

  canal_push: boolean;
  canal_interno: boolean;

  notificar_recordatorio: boolean;
  notificar_inicio_ruta: boolean;
  notificar_proximidad_vehiculo: boolean;
  notificar_cambio_horario: boolean;
  notificar_cambio_ruta: boolean;
  notificar_cancelacion: boolean;
  notificar_incidencias: boolean;

  minutos_anticipacion: number;
  frecuencia_recordatorio: string;

  // Formato HH:mm:ss.
  hora_silencio_inicio: string | null;
  hora_silencio_fin: string | null;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface ActualizarPreferenciasNotificacionResponse {
  success: boolean;
  message: string;
  data: PerfilCiudadanoPreferencias;
}
