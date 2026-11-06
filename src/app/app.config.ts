import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

// Rutas
import { routes } from './app.routes';

// Interceptor
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
      ]),
      /*
      | Posteriormente:
      |
      | withInterceptors([
      |   authInterceptor,
      |   errorInterceptor,
      | ]),
      */
    ),
  ]


};
