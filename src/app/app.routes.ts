import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [

  // =========================================================
  // Layout público
  // =========================================================
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout.component').then(
      (component) =>
        component.PublicLayoutComponent,
    ),
    children: [
      {
        path: 'publico',
        loadComponent: () => import('./public/pages/inicio-publico-page/inicio-publico-page.component').then(
          (component) =>
            component.InicioPublicoPageComponent,
        ),
      },
      // {
      //   path: 'qr/:tokenPublico',
      //   loadComponent: () => import('./public/pages/consulta-qr-page/consulta-qr-page.component').then(
      //     (component) =>
      //       component.ConsultaQrPageComponent,
      //   ),
      // },
      // {
      //   path: 'cronogramas',
      //   loadComponent: () => import('./public/pages/cronogramas-publicos-page/cronogramas-publicos-page.component').then(
      //     (component) =>
      //       component.CronogramasPublicosPageComponent,
      //   ),
      // },
      // {
      //   path: 'consulta',
      //   loadComponent: () => import('./public/pages/consulta-sector-page/consulta-sector-page.component').then(
      //     (component) =>
      //       component.ConsultaSectorPageComponent,
      //   ),
      // },
      // {
      //   path: 'rutas',
      //   loadComponent: () => import('./public/pages/estado-rutas-page/estado-rutas-page.component').then(
      //     (component) =>
      //       component.EstadoRutasPageComponent,
      //   ),
      // },
      // {
      //   path: 'reportar',
      //   loadComponent: () => import('./public/pages/reportar-problema-page/reportar-problema-page.component').then(
      //     (component) =>
      //       component.ReportarProblemaPageComponent,
      //   ),
      // },
    ],
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
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(
      (component) =>
        component.AdminLayoutComponent,
    ),
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: {
          roles: [
            'SUPER_ADMIN',
            'ADMIN',
          ],
        },
        loadComponent: () => import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
          (m) => m.DashboardPageComponent
        ),
      },

      // {
      //   path: 'monitoreo',
      //   loadChildren: () =>
      //     import(
      //       './features/monitoreo/monitoreo.routes'
      //     ).then(
      //       (routes) =>
      //         routes.MONITOREO_ROUTES,
      //     ),
      // },

      // {
      //   path: 'programaciones',
      //   loadChildren: () =>
      //     import(
      //       './features/programaciones/programaciones.routes'
      //     ).then(
      //       (routes) =>
      //         routes.PROGRAMACIONES_ROUTES,
      //     ),
      // },

      {
        path: 'vehiculos',
        canActivate: [roleGuard],
        data: {
          roles: [
            'SUPER_ADMIN',
            'ADMIN',
            'SUPERVISOR',
          ],
        },
        loadComponent: () =>
          import('./features/vehiculos/pages/vehiculos-page/vehiculos-page.component').then(
            (m) => m.VehiculosPageComponent,
          ),
      },

      // {
      //   path: 'reportes',
      //   loadChildren: () =>
      //     import(
      //       './features/reportes/reportes.routes'
      //     ).then(
      //       (routes) =>
      //         routes.REPORTES_ROUTES,
      //     ),
      // },

      {// =====================================================
        // REDIRECCIÓN INTERNA
        // =====================================================
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
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
