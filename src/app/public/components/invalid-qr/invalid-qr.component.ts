import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

export type EstadoQrNoDisponible =
  | 'NO_ENCONTRADO'
  | 'INACTIVO'
  | 'REVOCADO'
  | 'EXPIRADO'
  | 'INVALIDO';

const MENSAJES_QR: Record<
  EstadoQrNoDisponible,
  { titulo: string; mensaje: string }
> = {
  NO_ENCONTRADO: {
    titulo: 'Código QR no encontrado',
    mensaje:
      'No encontramos información asociada a este código. Comprueba que el enlace esté completo.',
  },
  INACTIVO: {
    titulo: 'Código QR temporalmente inactivo',
    mensaje:
      'La consulta de este código está deshabilitada temporalmente.',
  },
  REVOCADO: {
    titulo: 'Este código QR fue retirado',
    mensaje:
      'Consulta el código vigente colocado en tu sector.',
  },
  EXPIRADO: {
    titulo: 'Este código QR ha expirado',
    mensaje:
      'Escanea un código vigente para consultar el servicio.',
  },
  INVALIDO: {
    titulo: 'Código QR inválido',
    mensaje:
      'El enlace no tiene un código válido. Vuelve a escanear el QR de tu sector.',
  },
};

@Component({
  selector: 'app-invalid-qr',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './invalid-qr.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvalidQrComponent {
  @Input() estado: EstadoQrNoDisponible = 'INVALIDO';
  @Input() mensaje = '';

  get contenido() {
    return MENSAJES_QR[this.estado] ?? MENSAJES_QR.INVALIDO;
  }
}
