import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, finalize, takeUntil, timeout } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Services
import { AuthStorageService } from 'src/app/core/auth/auth-storage.service';
import { HttpServiceHelper } from 'src/app/core/auth/http-service.helper';

// Interfaces
interface IntentoDiagnostico {
  id_envio: string;
  id_dispositivo: string;
  numero_intento: number;

  estado_envio: string;
  codigo_error: string | null;

  fecha_intento: string;
  fecha_envio: string | null;

  fecha_recepcion_app: string | null;
  contexto_recepcion: string | null;

  aceptada_firebase: boolean;
  recepcion: 'CONFIRMADA_APP' | 'NO_CONFIRMADA';
}

interface DestinatarioDiagnostico {
  id_notificacion_usuario: string;
  id_usuario: string;

  estado_push: string;

  sin_dispositivo_en_ultimo_proceso: boolean;
  dispositivos_habilitados_actuales: number;

  leida: boolean;
  fecha_leida: string | null;

  intentos: IntentoDiagnostico[];
}

interface Diagnostico {
  notificacion: {
    id_notificacion: string;
    titulo: string;
    estado_notificacion: string;

    created_at: string;

    fecha_programada: string | null;
    fecha_expiracion: string | null;
    fecha_procesamiento: string | null;

    enviar_interna: boolean;
    enviar_push: boolean;
  };

  page: number;
  total: number;
  total_paginas: number;
  historial_limitado: boolean;

  destinatarios: DestinatarioDiagnostico[];
}

@Component({
  selector: 'app-diagnostico-notificaciones-page',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  templateUrl:
    './diagnostico-notificaciones-page.component.html',
})
export class DiagnosticoNotificacionesPageComponent
  implements OnDestroy {

  private readonly http = inject(HttpClient);
  private readonly storage = inject(AuthStorageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();

  private readonly api =
    environment.apiUrl.replace(/\/+$/, '') +
    '/notificaciones/diagnostico';

  idNotificacion = '';

  cargando = false;
  error = '';

  diagnostico: Diagnostico | null = null;

  cargar(page = 1): void {
    if (this.cargando) return;

    const id = this.idNotificacion.trim();

    if (!/^[1-9]\d*$/.test(id)) {
      this.error = 'Ingresa un ID de notificación válido.';
      this.diagnostico = null;
      return;
    }

    this.cargando = true;
    this.error = '';
    this.diagnostico = null;

    const headers = HttpServiceHelper.getHeaders({
      token: this.storage.getAccessToken(),
    });

    this.http
      .get<{
        success: boolean;
        message: string;
        data: Diagnostico;
      }>(
        `${this.api}/${encodeURIComponent(id)}`,
        {
          headers,
          params: {
            page: String(page),
          },
        },
      )
      .pipe(
        timeout(15000),

        takeUntil(this.destroy$),

        finalize(() => {
          this.cargando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: response => {
          if (!response.success || !response.data) {
            this.error =
              response.message ||
              'No se pudo consultar el diagnóstico.';
            return;
          }

          this.diagnostico = response.data;
        },

        error: (error: unknown) => {
          const err = error as {
            error?: { message?: string };
            message?: string;
          };

          this.error =
            err?.error?.message ||
            err?.message ||
            'No se pudo consultar el diagnóstico.';
        },
      });
  }

  estadoIntento(estado: string): string {
    switch (estado) {
      case 'ENVIADO':
        return 'Aceptado por Firebase';

      case 'FALLIDO':
        return 'Envío fallido';

      case 'TOKEN_INVALIDO':
        return 'Token inválido';

      case 'PROCESANDO':
        return 'En proceso o sin resultado confirmado';

      case 'CANCELADO':
        return 'Cancelado';

      default:
        return estado;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
