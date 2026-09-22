import { PerfilCiudadanoData } from './create-perfil-ciudadano.interface';

// *********************************************************
// RESPONSE
// *********************************************************
export interface GetPerfilCiudadanoResponse {
  success: boolean;
  message: string;
  data: PerfilCiudadanoDetalle;
}

// *********************************************************
// PERFIL COMPLETO
// *********************************************************
export interface PerfilCiudadanoDetalle extends PerfilCiudadanoData {
  fecha_verificacion_celular: string | null;
  fecha_desactivacion: string | null;
  motivo_desactivacion: string | null;
  deleted_at: string | null;

  usuario: PerfilCiudadanoUsuario;

  // Pendiente de tipar cuando compartas un domicilio registrado.
  domicilios: unknown[];

  preferencias_notificacion: PerfilCiudadanoPreferencias;
}

// *********************************************************
// USUARIO
// *********************************************************
export interface PerfilCiudadanoUsuario {
  id_usuario: number;
  username: string;
  email_acceso: string;
  persona: PerfilCiudadanoPersona;
}

// *********************************************************
// PERSONA
// *********************************************************
export interface PerfilCiudadanoPersona {
  id_persona: number;
  nombres: string;
  apellidos: string;

  email_contacto: string | null;
  tipo_documento: string;
  numero_documento: string;
  fecha_nacimiento: string | null;

  celular: string | null;
  direccion: string | null;
  foto_url: string | null;
  genero: string | null;

  estado: boolean;

  createdAt: string;
  updatedAt: string;
}

// *********************************************************
// PREFERENCIAS DE NOTIFICACIÓN
// *********************************************************
export interface PerfilCiudadanoPreferencias {
  id_preferencia: number;
  id_ciudadano: number;

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

  hora_silencio_inicio: string | null;
  hora_silencio_fin: string | null;

  estado_preferencia: string;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
