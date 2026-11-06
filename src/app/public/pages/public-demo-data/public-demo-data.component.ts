import { ServicioPublicoVista } from "../../components/next-collection-card/next-collection-card.component";
import { HorarioPublicoVista } from "../../components/schedule-card/schedule-card.component";


export interface ServicioPublicoDemo extends ServicioPublicoVista {
  id: number;
  fecha: string;
}

export interface RutaPublicaDemo {
  idRuta: number;
  nombre: string;
  codigo: string;
  sector: string;
  horarios: readonly HorarioPublicoVista[];
  servicios: readonly ServicioPublicoDemo[];
}

export const RUTAS_PUBLICAS_DEMO: readonly RutaPublicaDemo[] = [
  {
    idRuta: 9,
    nombre: 'Ruta Calca Centro',
    codigo: 'RUTA-0001',
    sector: 'Calca Centro',
    horarios: [
      {
        id: 'horario-demo-1',
        dias: 'Lunes, miércoles y viernes',
        horaInicio: '06:30',
        horaFin: '09:30',
      },
    ],
    servicios: [
      {
        id: 1,
        fecha: '2026-11-09',
        fechaLabel: 'Lunes 9 de noviembre de 2026',
        horaInicio: '07:00',
        horaFin: '10:00',
        estado: 'PENDIENTE',
      },
      {
        id: 2,
        fecha: '2026-11-11',
        fechaLabel: 'Miércoles 11 de noviembre de 2026',
        horaInicio: '06:30',
        horaFin: '09:30',
        estado: 'PENDIENTE',
      },
      {
        id: 3,
        fecha: '2026-11-13',
        fechaLabel: 'Viernes 13 de noviembre de 2026',
        horaInicio: '06:30',
        horaFin: '09:30',
        estado: 'CANCELADO',
      },
    ],
  },
  {
    idRuta: 10,
    nombre: 'Ruta adicional de demostración',
    codigo: 'DEMO-0002',
    sector: 'Calca Centro',
    horarios: [
      {
        id: 'horario-demo-2',
        dias: 'Martes y jueves',
        horaInicio: '07:00',
        horaFin: '10:00',
      },
    ],
    servicios: [],
  },
];
