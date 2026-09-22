// *********************************************************
// RESPONSE
// *********************************************************
export interface EliminarDomicilioResponse {
  success: boolean;
  message: string;
  data: EliminarDomicilioData;
}

export interface EliminarDomicilioData {
  id_domicilio: number;
  eliminado: boolean;
}
