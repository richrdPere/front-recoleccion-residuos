import type { Provider } from '@angular/core';
import { environment } from '@environments/environment';


import { AuthService } from 'src/app/features/auth/services/auth.service';
import { MONITOREO_SOCKET_CONFIG, MonitoreoSocketConfig } from './monitoreo-socket.types';
/**
 * Reutiliza la sesión existente. No registra otra instancia de AuthService.
 * Si el backend socket usa otro origen, pasar su URL en el argumento.
 */
export function provideMonitoreoSocketAutenticado(urlSocket?: string): Provider {
  return {
    provide: MONITOREO_SOCKET_CONFIG,
    deps: [AuthService],
    useFactory: (auth: AuthService): MonitoreoSocketConfig => {
      const origen = typeof location !== 'undefined' ? location.origin : undefined;
      const url = urlSocket ?? new URL(environment.apiUrl, origen).origin;
      return {
        url,
        obtenerToken: () => auth.getAccessTokenForSocket(),
        renovarToken: () => auth.getAccessTokenForSocket(true),
        tokensActualizados$: auth.tokensActualizados$,
        sesionCerrada$: auth.sesionCerrada$,
      };
    },
  };
}
