import { ApiResponse } from "src/app/core/models/api-response.model";


export interface LogoutData {
  sesion_revocada: boolean;
  ya_estaba_cerrada: boolean;
}

export type LogoutResponse = ApiResponse<LogoutData>;
