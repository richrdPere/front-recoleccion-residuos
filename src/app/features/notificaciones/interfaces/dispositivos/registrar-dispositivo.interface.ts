// *********************************************************
// REQUEST
// *********************************************************
export interface RegistrarDispositivoRequest {
  identificador_dispositivo: string;
  token_push: string;
  plataforma: string;
  nombre_dispositivo: string;
  modelo_dispositivo: string;
  version_sistema: string;
  version_aplicacion: string;
  permiso_notificaciones: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface RegistrarDispositivoResponse {
  success: boolean;
  message: string;
  data: RegistrarDispositivoData;
}

export interface RegistrarDispositivoData {
  dispositivo: DispositivoNotificacionData;
  creado: boolean;
  token_actualizado: boolean;
}

// *********************************************************
// DISPOSITIVO
// *********************************************************
export interface DispositivoNotificacionData {
  id_dispositivo: number;
  id_usuario: number;
  identificador_dispositivo: string;

  plataforma: string;
  nombre_dispositivo: string | null;
  modelo_dispositivo: string | null;
  version_sistema: string | null;
  version_aplicacion: string | null;

  permiso_notificaciones: string;
  estado_dispositivo: string;

  fecha_registro_token: string | null;
  fecha_ultima_actividad: string | null;
  fecha_desactivacion: string | null;
  motivo_desactivacion: string | null;

  updated_at: string;
  created_at: string;

  token_registrado: boolean;
}
