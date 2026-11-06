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

import {
  PublicPageHeaderComponent,
} from '../../components/public-page-header/public-page-header.component';
import { RUTAS_PUBLICAS_DEMO } from '../public-demo-data/public-demo-data.component';



interface ReporteVistaPrevia {
  ruta: string;
  tipo: string;
  referencia: string;
  descripcion: string;
}

@Component({
  selector: 'app-reportar-problema-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PublicPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reportar-problema-page.component.html',
})
export class ReportarProblemaPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly rutas = RUTAS_PUBLICAS_DEMO;

  readonly tipos = [
    'Recolección no realizada',
    'Residuos acumulados',
    'Problema durante el recorrido',
    'Otro',
  ];

  readonly form = this.fb.group({
    idRuta: ['', Validators.required],
    tipo: ['', Validators.required],
    referencia: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(200),
        Validators.pattern(/\S(?:[\s\S]*\S)?/),
      ],
    ],
    descripcion: [
      '',
      [
        Validators.required,
        Validators.minLength(15),
        Validators.maxLength(1500),
        Validators.pattern(/\S(?:[\s\S]*\S)?/),
      ],
    ],
  });

  readonly vistaPrevia = signal<ReporteVistaPrevia | null>(null);

  invalido(campo: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[campo];

    return control.touched && control.invalid;
  }

  previsualizar(): void {
    this.vistaPrevia.set(null);

    this.form.patchValue({
      referencia: this.form.controls.referencia.value.trim(),
      descripcion: this.form.controls.descripcion.value.trim(),
    });

    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const datos = this.form.getRawValue();

    const ruta = this.rutas.find(
      (item) => item.idRuta === Number(datos.idRuta),
    );

    if (!ruta || !this.tipos.includes(datos.tipo)) return;

    this.vistaPrevia.set({
      ruta: ruta.nombre,
      tipo: datos.tipo,
      referencia: datos.referencia,
      descripcion: datos.descripcion,
    });
  }
}
