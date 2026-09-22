import { MiDomicilioData } from './get-mis-domicilios.interface';

// *********************************************************
// RESPONSE
// *********************************************************
export interface EstablecerDomicilioPrincipalResponse {
  success: boolean;
  message: string;
  data: DomicilioPrincipalData;
}

// *********************************************************
// DOMICILIO SIN ASOCIACIONES
// *********************************************************
export type DomicilioPrincipalData = Omit<
  MiDomicilioData,
  'zona' | 'ruta' | 'usuario_validacion'
>;
