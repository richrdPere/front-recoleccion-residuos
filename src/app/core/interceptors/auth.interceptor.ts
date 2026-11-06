
import { DOCUMENT, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, defer, switchMap, takeUntil, throwError } from 'rxjs';


// Environment
import { environment } from 'src/environments/environment';

// Services
import { AuthService } from 'src/app/features/auth/services/auth.service';


export const authInterceptor: HttpInterceptorFn = (request, next) => {

  const document = inject(DOCUMENT);

  const base = new URL(
    environment.apiUrl.replace(/\/+$/, '') + '/',
    document.baseURI,
  );

  const destino = new URL(
    request.url,
    document.baseURI,
  );

  const perteneceApi =
    destino.origin === base.origin &&
    destino.pathname.startsWith(base.pathname);

  // No agregar credenciales a otros servidores.
  if (!perteneceApi) {
    return next(request);
  }

  const recurso = destino.pathname
    .slice(base.pathname.length)
    .replace(/\/+$/, '');

  const esPublica =
    recurso === 'publico' ||
    recurso.startsWith('publico/') ||
    recurso === 'auth/login' ||
    recurso === 'auth/register' ||
    recurso === 'auth/refresh';

  if (esPublica) {
    // También eliminar tokens agregados manualmente.
    return next(
      request.clone({
        headers:
          request.headers.delete('Authorization'),
      }),
    );
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  return defer((): Observable<HttpEvent<unknown>> => {
    const version = auth.getSessionVersion();

    const mismaSesion = () =>
      version === auth.getSessionVersion();

    const irAlLogin = (): void => {
      // Una consulta en segundo plano no debe expulsar
      // al visitante de una página pública.
      if (
        router.url === '/admin' ||
        router.url.startsWith('/admin/') ||
        router.url.startsWith('/admin?')
      ) {
        void router.navigate(
          ['/auth/login'],

          {
            queryParams: {
              returnUrl: router.url,
            },
          },
        );
      }
    };

    const cerrarSesion = (
      error: unknown,
    ): Observable<never> => {
      if (mismaSesion()) {
        auth.closeLocalSession();
        irAlLogin();
      }

      return throwError(() => error);
    };

    const renovar = (): Observable<HttpEvent<unknown>> => {
      if (!mismaSesion()) {
        return EMPTY;
      }

      if (!auth.canRefreshSession()) {
        return cerrarSesion(
          new HttpErrorResponse({
            status: 401,

            error: {
              message:
                'La sesión ha expirado.',
            },
          }),
        );
      }

      return auth.refreshToken().pipe(
        catchError((error: unknown) => {
          const status =
            error instanceof HttpErrorResponse
              ? error.status
              : 0;

          // AuthService ya cierra la sesión cuando
          // el servidor rechaza el refresh token.
          if (
            (status === 401 || status === 403) &&
            !auth.getCurrentUser()
          ) {
            irAlLogin();
          }

          return throwError(() => error);
        }),

        switchMap(() => {
          if (!mismaSesion()) {
            return EMPTY;
          }

          const token = auth.getAccessToken();

          if (!token) {
            return cerrarSesion(
              new HttpErrorResponse({
                status: 401,
              }),
            );
          }

          return enviar(token, false);
        }),
      );
    };

    const enviar = (
      token: string,
      permitirRenovacion: boolean,
    ): Observable<HttpEvent<unknown>> => {
      if (!mismaSesion()) {
        return EMPTY;
      }

      // Logout debe enviar el refresh token vigente,
      // incluso si se renovó mientras esperaba.
      const body =
        recurso === 'auth/logout'
          ? {
            ...(request.body as
              Record<string, unknown> | null),

            refresh_token:
              auth.getRefreshToken(),
          }
          : request.body;

      const autenticada = request.clone({
        body,

        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      return next(autenticada).pipe(
        takeUntil(auth.sesionCerrada$),

        catchError((error: unknown) => {
          if (!mismaSesion()) {
            return EMPTY;
          }

          if (
            !(error instanceof HttpErrorResponse) ||
            error.status !== 401
          ) {
            return throwError(() => error);
          }

          if (!permitirRenovacion) {
            return cerrarSesion(error);
          }

          const actual = auth.getAccessToken();

          // Otra petición o el socket pudo renovar
          // mientras esta petición estaba en curso.
          if (
            actual &&
            actual !== token &&
            auth.isAuthenticated()
          ) {
            return enviar(actual, false);
          }

          return renovar();
        }),
      );
    };

    const token = auth.getAccessToken();

    if (
      token &&
      auth.isAuthenticated() &&
      !auth.isRefreshingSession()
    ) {
      return enviar(token, true);
    }

    // JWT vencido o renovación ya iniciada por Socket/HTTP.
    return renovar();
  });
};

// import { HttpInterceptorFn } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { AuthService } from 'src/app/features/auth/services/auth.service';

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   const authService = inject(AuthService);
//   const token = authService.getToken();

//   if (token) {
//     req = req.clone({
//       setHeaders: {
//         Authorization: `Bearer ${token}`
//       }
//     });
//   }

//   return next(req);
// };

