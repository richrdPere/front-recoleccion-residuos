import { Routes } from '@angular/router';
import { roleGuard } from '../core/guards/role.guard';
import { AdminLayoutComponent } from '../layouts/admin-layout/admin-layout.component';

export const adminFeatureRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [roleGuard],
    canActivateChild: [roleGuard],
    data: {
      roles: [
        'SUPER_ADMIN',
        'ADMIN',
        'SUPERVISOR',
        'OPERADOR',
      ],
    },
    children: [

      // *****************************************************
      // RUTAS ADMIN FEATURE
      // *****************************************************

      // Auditoria
      {
        path: 'auditoria',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./auditoria/pages/auditoria-page/auditoria-page.component').then(
            (m) => m.AuditoriaPageComponent,
          ),
      },

      // Ciudadanos
      {
        path: 'ciudadanos',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./ciudadanos/pages/ciudadanos-page/ciudadanos-page.component').then(
            (m) => m.CiudadanosPageComponent,
          ),
      },

      // Codigos QR
      {
        path: 'codigos-qr',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./codigos-qr/pages/codigos-qr-page/codigos-qr-page.component').then(
            (m) => m.CodigosQrPageComponent,
          ),
      },

      // Dashboard
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
        loadComponent: () => import('./dashboard/pages/dashboard-page/dashboard-page.component').then(
          (m) => m.DashboardPageComponent
        ),
      },

      // Incidencias
      {
        path: 'incidencias',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./incidencias/pages/incidencias-page/incidencias-page.component').then(
            (m) => m.IncidenciasPageComponent,
          ),
      },

      // Mantenimientos
      {
        path: 'mantenimientos',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./mantenimientos/pages/mantenimientos-page/mantenimientos-page.component').then(
            (m) => m.MantenimientosPageComponent,
          ),
      },

      // Monitoreo
      {
        path: 'monitoreo',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./monitoreo/pages/monitoreo-page/monitoreo-page.component').then(
            (m) => m.MonitoreoPageComponent,
          ),
      },

      // Notificaciones
      {
        path: 'notificaciones',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./notificaciones/pages/notificaciones-page/notificaciones-page.component').then(
            (m) => m.NotificacionesPageComponent,
          ),
      },

      // Personal
      {
        path: 'personal',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./personal/pages/personal-page/personal-page.component').then(
            (m) => m.PersonalPageComponent,
          ),
      },

      // Programaciones
      {
        path: 'programaciones',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./programaciones/pages/programaciones-page/programaciones-page.component').then(
            (m) => m.ProgramacionesPageComponent,
          ),
      },

      // Recolecciones
      {
        path: 'recolecciones',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./recolecciones/pages/recolecciones-page/recolecciones-page.component').then(
            (m) => m.RecoleccionesPageComponent,
          ),
      },

      // Recorridos
      {
        path: 'recorridos',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./recorridos/pages/recorridos-page/recorridos-page.component').then(
            (m) => m.RecorridosPageComponent,
          ),
      },

      // Reportes
      {
        path: 'reportes',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./reportes/pages/reportes-page/reportes-page.component').then(
            (m) => m.ReportesPageComponent,
          ),
      },

      // Reportes ciudadanos
      {
        path: 'reportes-ciudadanos',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./reportes-ciudadanos/pages/reportes-ciudadanos-page/reportes-ciudadanos-page.component').then(
            (m) => m.ReportesCiudadanosPageComponent,
          ),
      },

      // Rutas
      {
        path: 'rutas',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./rutas/pages/rutas-page/rutas-page.component').then(
            (m) => m.RutasPageComponent,
          ),
      },

      // Usuarios
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./usuarios/pages/usuarios-page/usuarios-page.component').then(
            (m) => m.UsuariosPageComponent,
          ),
      },

      // Vehiculos
      {
        path: 'vehiculos',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./vehiculos/pages/vehiculos-page/vehiculos-page.component').then(
            (m) => m.VehiculosPageComponent,
          ),
      },

      // Zonas
      {
        path: 'zonas',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
        loadComponent: () =>
          import('./zonas/pages/zonas-page/zonas-page.component').then(
            (m) => m.ZonasPageComponent,
          ),
      },

      // *****************************************************
      // REDIRECCIÓN INTERNA
      // *****************************************************
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ]
  }
];


export default adminFeatureRoutes;
