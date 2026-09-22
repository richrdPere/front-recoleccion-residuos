import {
  PerfilCiudadanoPreferencias,
} from './get-perfil-ciudadano.interface';

// *********************************************************
// RESPONSE
// *********************************************************
export interface GetPreferenciasNotificacionResponse {
  success: boolean;
  message: string;
  data: PerfilCiudadanoPreferencias;
}
