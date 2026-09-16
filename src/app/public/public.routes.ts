import { Routes } from '@angular/router';
import { PublicLayoutComponent } from '../layouts/public-layout/public-layout.component';


export const publicRoutes: Routes = [

  {
    path: '',
    component: PublicLayoutComponent,
    children: [
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

      // Cronograma
      {
        path: 'cronogramas',
        loadComponent: () => import('./pages/cronograma-publicos-page/cronograma-publicos-page.component').then(
          (m) => m.CronogramaPublicosPageComponent,
        ),
      },

      // Consulta sector
      {
        path: 'consulta',
        loadComponent: () => import('./pages/consulta-qr-page/consulta-qr-page.component').then(
          (m) => m.ConsultaQrPageComponent,
        ),
      },

      // Estado rutas
      {
        path: 'rutas',
        loadComponent: () => import('./pages/seguimiento-publico-page/seguimiento-publico-page.component').then(
          (m) => m.SeguimientoPublicoPageComponent,
        ),
      },

      // Reportar problema
      {
        path: 'reportar',
        loadComponent: () => import('./pages/reportar-problema-page/reportar-problema-page.component').then(
          (m) => m.ReportarProblemaPageComponent,
        ),
      },


      // {
      //   path: 'qr/:tokenPublico',
      //   loadComponent: () => import('./public/pages/consulta-qr-page/consulta-qr-page.component').then(
      //     (component) =>
      //       component.ConsultaQrPageComponent,
      //   ),
      // },


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
