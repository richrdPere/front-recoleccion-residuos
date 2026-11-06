import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { RouterLink } from '@angular/router';

import {
  PublicPageHeaderComponent,
} from '../../components/public-page-header/public-page-header.component';
import { RUTAS_PUBLICAS_DEMO } from '../public-demo-data/public-demo-data.component';



@Component({
  selector: 'app-registro-alertas-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PublicPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registro-alertas-page.component.html',
})
export class RegistroAlertasPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly rutas = RUTAS_PUBLICAS_DEMO;
  readonly mensaje = signal('');

  readonly form = this.fb.group({
    nombre: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(/\S(?:[\s\S]*\S)?/),
      ],
    ],
    celular: [
      '',
      [
        Validators.required,
        Validators.pattern(/^9\d{8}$/),
      ],
    ],
    idRuta: ['', Validators.required],
    inicio: true,
    cambios: true,
    incidencias: true,
    acepta: [false, Validators.requiredTrue],
  });

  invalido(campo: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[campo];

    return control.touched && control.invalid;
  }

  revisar(): void {
    this.mensaje.set('');

    this.form.patchValue({
      nombre: this.form.controls.nombre.value.trim(),
      celular: this.form.controls.celular.value.trim(),
    });

    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const datos = this.form.getRawValue();

    if (!datos.inicio && !datos.cambios && !datos.incidencias) {
      this.mensaje.set('Selecciona al menos una preferencia de aviso.');
      return;
    }

    const ruta = this.rutas.find(
      (item) => item.idRuta === Number(datos.idRuta),
    );

    if (!ruta) return;

    this.mensaje.set(
      `Formulario validado para ${ruta.nombre}. `
      + 'La suscripción se habilitará al conectar el servicio de registro.',
    );
  }
}
