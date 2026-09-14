import {
  inject,
} from '@angular/core';

import {
  CanActivateFn,
  Router,
  UrlTree,
} from '@angular/router';

import {
  Observable,
  catchError,
  map,
  of,
} from 'rxjs';

// Services
import {
  AuthService,
} from '../../features/auth/services/auth.service';

import {
  AuthStorageService,
} from '../auth/auth-storage.service';

/*
|--------------------------------------------------------------------------
| Normalizar rol
|--------------------------------------------------------------------------
*/

const normalizeRole = (
  role: string,
): string => {
  return role
    .trim()
    .toUpperCase();
};

/*
|--------------------------------------------------------------------------
| Role guard
|--------------------------------------------------------------------------
*/

export const roleGuard: CanActivateFn = (
  route,
  state,
):
  | boolean
  | UrlTree
  | Observable<boolean | UrlTree> => {
  /*
  |--------------------------------------------------------------------------
  | Dependencias
  |--------------------------------------------------------------------------
  */

  const router =
    inject(Router);

  const authService =
    inject(AuthService);

  const authStorage =
    inject(AuthStorageService);

  /*
  |--------------------------------------------------------------------------
  | Redirigir al login
  |--------------------------------------------------------------------------
  */

  const redirectToLogin = (): UrlTree => {
    authService.closeLocalSession();

    return router.createUrlTree(
      [
        '/auth/login',
      ],
      {
        queryParams: {
          returnUrl:
            state.url,
        },
      },
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Redirigir a acceso denegado
  |--------------------------------------------------------------------------
  */

  const redirectToAccessDenied =
    (): UrlTree => {
      return router.createUrlTree(
        [
          '/acceso-denegado',
        ],
        {
          queryParams: {
            returnUrl:
              state.url,
          },
        },
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Validar roles
  |--------------------------------------------------------------------------
  */

  const validateRoles = (): boolean | UrlTree => {
    /*
    |--------------------------------------------------------------------------
    | Obtener usuario
    |--------------------------------------------------------------------------
    */

    const usuario = authService.getCurrentUser();

    if (!usuario) {
      return redirectToLogin();
    }

    /*
    |--------------------------------------------------------------------------
    | Roles almacenados
    |--------------------------------------------------------------------------
    */

    const storedRoles = authStorage.getRoles();

    /*
    |--------------------------------------------------------------------------
    | Roles del usuario
    |--------------------------------------------------------------------------
    |
    | usuario.roles es AuthRole[].
    |
    */

    const userRoles = (usuario.roles ?? [])
      .map((role) => {
        return role.nombre;
      });

    /*
    |--------------------------------------------------------------------------
    | Combinar y normalizar roles
    |--------------------------------------------------------------------------
    */

    const currentRoles = new Set<string>(
      [
        ...storedRoles,
        ...userRoles,
      ].map((role) => {
        return normalizeRole(role);
      }),
    );

    /*
    |--------------------------------------------------------------------------
    | Roles permitidos en la ruta
    |--------------------------------------------------------------------------
    */
    const routeRoles = route.data?.['roles'] as readonly string[] | undefined;

    const allowedRoles =
      (routeRoles ?? [])
        .map((role) => {
          return normalizeRole(role);
        });

    /*
    |--------------------------------------------------------------------------
    | Comprobar configuración
    |--------------------------------------------------------------------------
    */
    if (allowedRoles.length === 0) {
      console.warn(
        `La ruta "${state.url}" utiliza roleGuard, pero no define data.roles.`,
      );

      return redirectToAccessDenied();
    }

    /*
    |--------------------------------------------------------------------------
    | SUPER_ADMIN
    |--------------------------------------------------------------------------
    */
    if (currentRoles.has('SUPER_ADMIN')) {
      return true;
    }

    /*
    |--------------------------------------------------------------------------
    | Verificar coincidencia de roles
    |--------------------------------------------------------------------------
    */

    const hasAccess = allowedRoles.some(
      (allowedRole) => {
        return currentRoles.has(
          allowedRole,
        );
      },
    );

    if (!hasAccess) {
      return redirectToAccessDenied();
    }

    return true;
  };

  /*
  |--------------------------------------------------------------------------
  | 1. Comprobar información de sesión
  |--------------------------------------------------------------------------
  */

  if (!authStorage.hasSession()) {
    return redirectToLogin();
  }

  /*
  |--------------------------------------------------------------------------
  | 2. Access token vigente
  |--------------------------------------------------------------------------
  */

  if (authService.isAuthenticated()) {
    return validateRoles();
  }

  /*
  |--------------------------------------------------------------------------
  | 3. Comprobar refresh token
  |--------------------------------------------------------------------------
  */

  if (!authService.canRefreshSession()) {
    return redirectToLogin();
  }

  /*
  |--------------------------------------------------------------------------
  | 4. Renovar access token
  |--------------------------------------------------------------------------
  */

  return authService
    .refreshToken()
    .pipe(
      map(() => {
        return validateRoles();
      }),

      catchError(() => {
        return of(
          redirectToLogin(),
        );
      }),
    );
};
