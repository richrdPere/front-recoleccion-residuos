import { Routes } from '@angular/router';
import { PublicLayoutComponent } from '../layouts/public-layout/public-layout.component';

const cargarConsulta = () =>
  import(
    './pages/consulta-qr-page/consulta-qr-page.component'
  ).then(
    (m) => m.ConsultaQrPageComponent,
  );

export const publicRoutes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: 'q/:tokenPublico',
        redirectTo: 'consulta/:tokenPublico',
        pathMatch: 'full',
      },

      // *****************************************************
      // RUTAS PUBLICAS
      // *****************************************************

      // Inicio - publico
      {
        path: 'publico',
        loadComponent: () => import('./pages/inicio-publico-page/inicio-publico-page.component').then(
          (m) => m.InicioPublicoPageComponent,
        ),
      },

      // Consulta sector
      {
        path: 'consulta',
        loadComponent: cargarConsulta,
      },

      {
        path: 'consulta/:tokenPublico',
        loadComponent: cargarConsulta,
      },
      // {
      //   path: 'consulta',
      //   loadComponent: () => import('./pages/consulta-qr-page/consulta-qr-page.component').then(
      //     (m) => m.ConsultaQrPageComponent,
      //   ),
      // },
      // {
      //   path: 'consulta/:tokenPublico',
      //   loadComponent: () =>
      //     import(
      //       './pages/consulta-qr-page/consulta-qr-page.component'
      //     ).then((m) => m.ConsultaQrPageComponent),
      // },

      // Cronogramas
      {
        path: 'cronogramas',
        loadComponent: cargarConsulta,
      },

      // {
      //   path: 'cronogramas',
      //   loadComponent: () => import('./pages/cronograma-publicos-page/cronograma-publicos-page.component').then(
      //     (m) => m.CronogramaPublicosPageComponent,
      //   ),
      // },

      // Estado rutas
      {
        path: 'rutas',
        loadComponent: cargarConsulta,
      },

      // {
      //   path: 'rutas',
      //   loadComponent: () => import('./pages/seguimiento-publico-page/seguimiento-publico-page.component').then(
      //     (m) => m.SeguimientoPublicoPageComponent,
      //   ),
      // },

      // Reportar problema
      {
        path: 'reportar',
        loadComponent: () => import('./pages/reportar-problema-page/reportar-problema-page.component').then(
          (m) => m.ReportarProblemaPageComponent,
        ),
      },

      // Registro de alertas
      {
        path: 'registro-alertas',
        loadComponent: () =>
          import(
            './pages/registro-alertas-page/registro-alertas-page.component'
          ).then((m) => m.RegistroAlertasPageComponent),
      },

      // Privacidad
      {
        path: 'privacidad',
        loadComponent: () =>
          import(
            './pages/privacidad-page/privacidad-page.component'
          ).then((m) => m.PrivacidadPageComponent),
      },

      // Pagina no encontrada
      {
        path: 'pagina-no-encontrada',
        loadComponent: () =>
          import(
            './pages/public-not-found-page/public-not-found-page.component'
          ).then((m) => m.PublicNotFoundPageComponent),
      },


      // *****************************************************
      // REDIRECCIÓN INTERNA
      // *****************************************************
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'publico',
      },
    ]
  }
]


export default publicRoutes;
