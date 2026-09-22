export interface MarcarTodasNotificacionesLeidasResponse {
  success: boolean;
  message: string;
  data: MarcarTodasNotificacionesLeidasData;
}

export interface MarcarTodasNotificacionesLeidasData {
  actualizadas: number;
}
