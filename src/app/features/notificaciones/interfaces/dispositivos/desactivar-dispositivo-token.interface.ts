// *********************************************************
// REQUEST
// *********************************************************
export interface DesactivarDispositivoTokenRequest {
  token_push: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface DesactivarDispositivoTokenResponse {
  success: boolean;
  message: string;
  data: DesactivarDispositivoTokenData;
}

export interface DesactivarDispositivoTokenData {
  desactivado: boolean;
  ya_estaba_desactivado: boolean;
}
