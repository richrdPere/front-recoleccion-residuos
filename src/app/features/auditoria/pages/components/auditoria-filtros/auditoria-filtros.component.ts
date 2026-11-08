import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, Output } from '@angular/core';

// Interfaces
import { AuditoriaPaginadoFilters } from '../../../interfaces';

@Component({
  selector: 'auditoria-filtros',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './auditoria-filtros.component.html',
})
export class AuditoriaFiltrosComponent {

  // *********************************************************
  // INPUTS
  // *********************************************************

  @Input({ required: true })
  filtros!: AuditoriaPaginadoFilters;

  @Input()
  cargando = false;

  // *********************************************************
  // OUTPUTS
  // *********************************************************

  @Output()
  filtrosChange = new EventEmitter<AuditoriaPaginadoFilters>();

  @Output()
  consultar = new EventEmitter<AuditoriaPaginadoFilters>();

  @Output()
  restablecer = new EventEmitter<void>();

  // *********************************************************
  // OPCIONES
  // *********************************************************

  readonly tiposActor = [
    'USUARIO',
    'SISTEMA',
    'ANONIMO',
  ] as const;

  readonly resultados = [
    'EXITOSO',
    'RECHAZADO',
    'FALLIDO',
  ] as const;

  readonly origenes = [
    'WEB',
    'MOVIL',
    'API',
    'SISTEMA',
    'DESCONOCIDO',
  ] as const;

  readonly ordenes = [
    { value: 'DESC', label: 'Más recientes primero' },
    { value: 'ASC', label: 'Más antiguos primero' },
  ] as const;

  errorValidacion = '';

  // *********************************************************
  // CAMBIOS
  // *********************************************************

  actualizar<K extends keyof AuditoriaPaginadoFilters>(
    campo: K,
    valor: AuditoriaPaginadoFilters[K],
  ): void {
    if (this.cargando) return;

    this.errorValidacion = '';

    this.filtrosChange.emit({
      ...this.filtros,
      [campo]: valor,
      page: 1,
    });
  }

  actualizarTexto(
    campo:
      | 'modulo'
      | 'accion'
      | 'tipo_entidad'
      | 'id_entidad'
      | 'id_usuario'
      | 'request_id'
      | 'clave_operacion',
    valor: string,
  ): void {
    const esCodigo = [
      'modulo',
      'accion',
      'tipo_entidad',
    ].includes(campo);

    const texto = esCodigo
      ? valor.toUpperCase()
      : valor;

    this.actualizar(
      campo,
      texto.trim() ? texto : null,
    );
  }

  // *********************************************************
  // CONSULTAR
  // *********************************************************

  solicitarConsulta(formularioValido: boolean): void {
    if (this.cargando || !formularioValido) return;

    this.errorValidacion = '';

    const fechaCivil = (valor: string): number | null => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;

      const fecha = new Date(`${valor}T00:00:00Z`);

      if (
        !Number.isFinite(fecha.getTime()) ||
        fecha.toISOString().slice(0, 10) !== valor
      ) {
        return null;
      }

      return fecha.getTime();
    };

    const inicio = fechaCivil(this.filtros.fecha_inicio);
    const fin = fechaCivil(this.filtros.fecha_fin);

    if (inicio === null || fin === null) {
      this.errorValidacion = 'Selecciona fechas válidas.';
      return;
    }

    const dias = (fin - inicio) / 86400000 + 1;

    if (dias < 1 || dias > 366) {
      this.errorValidacion =
        'El período debe comprender entre 1 y 366 días.';
      return;
    }

    const filtros: AuditoriaPaginadoFilters = {
      ...this.filtros,
      page: 1,
    };

    // Normaliza los textos antes de emitir la consulta.
    filtros.modulo = filtros.modulo?.trim() || null;
    filtros.accion = filtros.accion?.trim() || null;
    filtros.tipo_entidad = filtros.tipo_entidad?.trim() || null;
    filtros.request_id = filtros.request_id?.trim() || null;
    filtros.clave_operacion =
      filtros.clave_operacion?.trim() || null;

    filtros.id_usuario =
      filtros.id_usuario == null
        ? null
        : String(filtros.id_usuario).trim() || null;

    filtros.id_entidad =
      filtros.id_entidad == null
        ? null
        : String(filtros.id_entidad).trim() || null;

    if (filtros.id_entidad !== null && !filtros.tipo_entidad) {
      this.errorValidacion =
        'Indica el tipo de entidad para consultar su identificador.';
      return;
    }

    this.consultar.emit(filtros);
  }

  solicitarRestablecer(): void {
    if (this.cargando) return;

    this.errorValidacion = '';
    this.restablecer.emit();
  }

  // *********************************************************
  // PRESENTACIÓN
  // *********************************************************

  etiqueta(valor: string): string {
    const etiquetas: Record<string, string> = {
      USUARIO: 'Usuario',
      SISTEMA: 'Sistema',
      ANONIMO: 'Anónimo',
      EXITOSO: 'Exitoso',
      RECHAZADO: 'Rechazado',
      FALLIDO: 'Fallido',
      WEB: 'Web',
      MOVIL: 'Móvil',
      API: 'API',
      DESCONOCIDO: 'Desconocido',
    };

    return etiquetas[valor] ?? valor;
  }
}
