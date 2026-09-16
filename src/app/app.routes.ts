import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [

  // =========================================================
  // Layout público
  // =========================================================
  {
    path: '',
    loadChildren: () => import('./public/public.routes'),
    // loadComponent: () => import('./layouts/public-layout/public-layout.component').then(
    //   (component) =>
    //     component.PublicLayoutComponent,
    // ),
    // children: [
    //   {
    //     path: 'publico',
    //     loadComponent: () => import('./public/pages/inicio-publico-page/inicio-publico-page.component').then(
    //       (component) =>
    //         component.InicioPublicoPageComponent,
    //     ),
    //   },

    // ],
  },


  // =========================================================
  // Layout auth
  // =========================================================
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(
      (component) =>
        component.AuthLayoutComponent,
    ),

    children: [
      {
        path: 'login',
        loadComponent: () =>
          import(
            './features/auth/pages/login-page/login-page.component'
          ).then(
            (component) =>
              component.LoginPageComponent,
          ),
      },
    ],
  },

  // =========================================================
  // Layout admin
  // =========================================================
  {
    path: 'admin',
    canActivate: [roleGuard],
    data: {
      roles: [
        'SUPER_ADMIN',
        'ADMIN',
        'SUPERVISOR',
        'OPERADOR',
      ],
    },
    loadChildren: () => import('./features/features.routes'),
  },



  // =========================================================
  // Acceso denegado
  // =========================================================
  {
    path: 'acceso-denegado',
    loadComponent: () => import('./shared/pages/access-denied/access-denied.component').then(
      m => m.AccessDeniedComponent),
  },

  // =========================================================
  // Página no encontrada
  // =========================================================
  {
    path: '**',
    loadComponent: () => import('./shared/pages/no-found-page/no-found-page.component').then(
      (m) => m.NoFoundPageComponent
    ),
  },
];
