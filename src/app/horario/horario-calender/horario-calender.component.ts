import { Component, Inject, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import {
  NotificacionService,
  TipoMessage,
} from '../../share/notification.service';
import { AuthenticationService } from '../../share/authentication.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ReservaDiagComponent } from '../../reserva/reserva-diag/reserva-diag.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReservaIndexComponent } from '../../reserva/reserva-index/reserva-index.component';

// Define una interfaz para eventos del calendario
interface CalendarEvent {
  id?: number;
  descripcion?: string; // Descripción de la reserva
  razon?: string; // Descripción de la reserva
  hora?: string; // Hora de la reserva
  estadoColor?: string; // Color asociado al estado de la reserva
}

@Component({
  selector: 'app-horario-calender',
  templateUrl: './horario-calender.component.html',
  styleUrls: ['./horario-calender.component.css'],
})
export class HorarioCalenderComponent implements OnInit {
  destroy$: Subject<boolean> = new Subject<boolean>();
  viewDate: Date = new Date();
  monthName: string = ''; // Propiedad para almacenar el nombre del mes en español
  daysOfWeek: string[] = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];
  calendarDays: {
    date: Date;
    currentMonth: boolean;
    events: CalendarEvent[];
    isBlocked;
  }[] = [];
  horarios: any[] = []; // Aquí almacenaremos los horarios
  reservas: any[] = []; // Aquí almacenaremos las reservas

  isAdmin: boolean = false;
  selectedSucursal: any;
  sucursalList: any;

  idSucursalUsuario: any;

  currentUser: any;
  // Variables para las fechas mínima y máxima
  fechaMinima: Date | null = null;
  fechaMaxima: Date | null = null;
  showDailyView = false; // Bandera para mostrar la vista detallada del día
  selectedDate: Date | null = null; // Fecha seleccionada para la vista detallada
  dailyReservations: any[] = []; // Reservas del día seleccionado

  constructor(
    private gService: GenericService,
    private noti: NotificacionService,
    private authService: AuthenticationService,
    private dialog: MatDialog
  ) {
    this.listaSucursales();
  }

  ngOnInit() {
    this.authService.decodeToken.subscribe((decodedToken: any) => {
      // Decodifica y asigna el token al currentUser
      this.currentUser = decodedToken;

      // Verifica si currentUser tiene el rol de 'Administrador'
      if (this.currentUser && this.currentUser.rol === 'Administrador') {
        this.isAdmin = true;
      }
    });
    this.authService.chargeUser(); // Carga el usuario
    this.currentUser = this.authService.currentUser; // Asigna el usuario cargado a la variable local
    this.idSucursalUsuario = this.currentUser.idSucursal;
    this.listHorarios(this.idSucursalUsuario); // Reemplaza con el ID de sucursal que corresponda
    this.listReservas(this.idSucursalUsuario);

    // console.log('Eventos:  ' + this.calendarDays);
  }

  listHorarios(sucursalId: string): void {
    this.gService
      .list(`sucursalHorario/${sucursalId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any[]) => {
        this.horarios = data.map((item) => ({
          diaSemana: item.horario.diaSemana,
          fecha: new Date(item.horario.fecha),
          horaInicio: this.convertToHours(item.horario.horaInicio),
          horaFin: this.convertToHours(item.horario.horaFin),
          tipoHorario: item.horario.tipoHorario,
          sucursalId: item.sucursalId,
          horarioId: item.horario.id,
        }));

        console.log(data);

        // Calcular la fecha mínima y máxima
        if (this.horarios.length > 0) {
          const fechas = this.horarios.map((h) => h.fecha);
          this.fechaMinima = new Date(Math.min.apply(null, fechas));
          this.fechaMaxima = new Date(Math.max.apply(null, fechas));

          // Asegurarse de que la fecha de vista esté dentro del rango
          if (this.viewDate < this.fechaMinima) {
            this.viewDate = new Date(
              this.fechaMinima.getFullYear(),
              this.fechaMinima.getMonth(),
              1
            );
          } else if (this.viewDate > this.fechaMaxima) {
            this.viewDate = new Date(
              this.fechaMaxima.getFullYear(),
              this.fechaMaxima.getMonth(),
              1
            );
          }

          // Generar el calendario basado en el rango de fechas
          this.generateCalendar();
        }
      });
  }

  generateCalendar(): void {
    // Verificar si no hay reservas ni horarios, en cuyo caso no se genera el calendario
    if (
      (!this.reservas || this.reservas.length === 0) &&
      (!this.horarios || this.horarios.length === 0)
    ) {
      // console.warn('No hay datos disponibles para generar el calendario.');
      return;
    }

    if (!this.fechaMinima || !this.fechaMaxima) {
      return;
    }

    // Verificar si hay eventos en el mes siguiente y si es así, cargar ese mes
    const nextMonthDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth() + 1,
      1
    );
    const eventsNextMonth = (this.reservas || []).some(
      (reserva) =>
        new Date(reserva.fecha).getMonth() === nextMonthDate.getMonth() &&
        new Date(reserva.fecha).getFullYear() === nextMonthDate.getFullYear()
    );

    const blockEventsNextMonth = (this.horarios || []).some(
      (horario) =>
        horario.tipoHorario === false && // Tipo de horario es bloqueo
        new Date(horario.fecha).getMonth() === nextMonthDate.getMonth() &&
        new Date(horario.fecha).getFullYear() === nextMonthDate.getFullYear()
    );

    if (eventsNextMonth || blockEventsNextMonth) {
      this.viewDate = nextMonthDate; // Cambiar el mes visible al siguiente mes
    }

    // Primer y último día del mes en curso (actualizado)
    const startDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth(),
      1
    );
    const endDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth() + 1,
      0
    );

    // Primer día de la semana visible
    const firstDayOfMonth = startDate.getDay();

    // Primer día del mes
    const firstVisibleDate = new Date(startDate);
    firstVisibleDate.setDate(startDate.getDate() - firstDayOfMonth);

    // Calcular el último día visible del calendario (para llenar la cuadrícula)
    const lastVisibleDate = new Date(firstVisibleDate);
    lastVisibleDate.setDate(firstVisibleDate.getDate() + 41);

    this.calendarDays = [];

    // Iterar sobre cada día en la cuadrícula
    for (
      let date = new Date(firstVisibleDate);
      date <= lastVisibleDate;
      date.setDate(date.getDate() + 1)
    ) {
      this.calendarDays.push({
        date: new Date(date),
        currentMonth: this.viewDate.getMonth() === date.getMonth(),
        events: this.getEventsForDate(new Date(date)),
        isBlocked: this.isBlockedDate(new Date(date)), // Agregar el estado de bloqueo
      });
    }

    // Obtener el nombre del mes en español
    const formatter = new Intl.DateTimeFormat('es-ES', { month: 'long' });
    this.monthName = formatter.format(this.viewDate);
  }

  isBlockedDate(date: Date): boolean {
    // Comparar cada horario con la fecha actual
    return (this.horarios || []).some(
      (horario) =>
        horario.tipoHorario === false && // Tipo de horario es bloqueo
        new Date(horario.fecha).toDateString() === date.toDateString()
    );
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    // Filtra las reservas para la fecha específica
    const reservasEvents: CalendarEvent[] = (this.reservas || [])
      .filter((reserva) => this.isSameDay(new Date(reserva.fecha), date))
      .map((reserva) => ({
        id: reserva.id,
        descripcion: reserva.descripcion,
        razon: reserva.razon,
        hora: this.convertToHours(parseInt(reserva.hora, 10)),
        estadoColor: reserva.Estado.color,
        class: '', // Puedes definir una clase específica si es necesario
      }));

    // Filtra los bloqueos para la fecha específica
    const bloqueosEvents: CalendarEvent[] = (this.horarios || [])
      .filter(
        (horario) =>
          horario.tipoHorario === false && // Tipo de horario es bloqueo
          this.isSameDay(new Date(horario.fecha), date)
      )
      .map((horario) => ({
        id: horario.horarioId,
        descripcion: 'Bloqueo',
        razon: '', // Puedes dejarlo vacío o agregar una descripción adecuada
        hora: horario.horaInicio,
        estadoColor: '', // Deja el color vacío aquí
        class: 'blocked-day', // Usa una clase específica para los días bloqueados
      }));

    // Combina eventos de reservas y bloqueos
    const allEvents = [...reservasEvents, ...bloqueosEvents];

    // Elimina eventos duplicados usando el ID como clave
    const uniqueEvents = Array.from(
      new Map(
        allEvents.map((event) => [event.id, event]) // Usa el ID como clave para Map
      ).values()
    );

    return uniqueEvents;
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return today.toDateString() === date.toDateString();
  }

  prevMonth(): void {
    if (!this.fechaMinima) return;

    // Mover la fecha de vista al mes anterior
    const newViewDate = new Date(this.viewDate);
    newViewDate.setMonth(newViewDate.getMonth() - 1);

    // Verificar si la nueva vista está dentro del rango de fechas
    if (this.isInRange(newViewDate)) {
      this.viewDate = newViewDate;
      this.generateCalendar();
    }
  }

  nextMonth(): void {
    if (!this.fechaMaxima) return;

    // Mover la fecha de vista al mes siguiente
    const newViewDate = new Date(this.viewDate);
    newViewDate.setMonth(newViewDate.getMonth() + 1);

    // Verificar si la nueva vista está dentro del rango de fechas
    if (this.isInRange(newViewDate)) {
      this.viewDate = newViewDate;
      this.generateCalendar();
    }
  }

  isInRange(date: Date): boolean {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return this.fechaMinima <= endOfMonth && this.fechaMaxima >= startOfMonth;
  }

  dayClicked(day: any): void {
    console.log('Día seleccionado:', day);
    // Aquí puedes manejar la lógica al hacer clic en un día
  }

  listReservas(sucursalId: string): void {
    this.gService
      .list('reserva/', { sucursalId: parseInt(sucursalId, 10) })
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (reservas: any[]) => {
          this.reservas = reservas; // Almacenar las reservas en la variable local
          console.log(reservas);

          if (this.reservas.length === 0) {
            // Si no hay reservas, limpiar el calendario
            this.calendarDays = [];
            console.warn('No hay reservas para la sucursal seleccionada.');
            this.noti.mensaje(
              'Atención',
              'Esta Sucursal no posee reservas registradas',
              TipoMessage.warning
            );
          } else {
            // Mapear las reservas para que coincidan con los días del calendario
            this.generateCalendar(); // Regenerar el calendario con las reservas actualizadas
          }
        },
        (error) => {
          console.error('Error al obtener reservas:', error);
        }
      );
  }

  onSucursalChange(sucursalId: string): void {
    this.selectedSucursal = sucursalId;
    this.listHorarios(sucursalId); // Listar horarios de la sucursal
    this.listReservas(sucursalId); // Listar reservas de la sucursal
  }

  // Para cargar al comboBox múltiple de Sucursales
  listaSucursales() {
    this.sucursalList = null;
    this.gService
      .list('sucursal')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.sucursalList = data;

        if (this.sucursalList && this.sucursalList.length > 0) {
          // Si es admin, seleccionar automáticamente la primera sucursal
          if (this.isAdmin) {
            this.selectedSucursal = this.sucursalList[0].id; // Selecciona el primer ítem en la lista
            this.onSucursalChange(this.selectedSucursal);
          } else {
            // Si no es admin, encontrar la sucursal actual y asignarla
            const selected = this.sucursalList.find(
              (sucursal) => sucursal.id === this.currentUser.idSucursal
            );

            // Si encuentra la sucursal, asigna su id a selectedSucursal
            if (selected) {
              this.selectedSucursal = selected.id;
              this.onSucursalChange(this.selectedSucursal);
            }
          }
        }
      });
  }

  detalleReserva(id: number) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = 'auto';
    dialogConfig.disableClose = false;
    dialogConfig.data = {
      id: id,
    };
    this.dialog.open(ReservaDiagComponent, dialogConfig);
  }

  showReservations(date: Date): void {
    // Filtrar reservas para la fecha seleccionada
    const filteredReservations = this.reservas.filter((reserva) =>
      this.isSameDay(new Date(reserva.fecha), date)
    );

    // Configurar el diálogo
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = 'auto';
    dialogConfig.disableClose = false;
    dialogConfig.data = {
      date: date, // Pasar la fecha en formato ISO
      idSucursal: this.selectedSucursal, // Pasar el ID de sucursal
    };
    console.log('sucursal enviada: ' + this.selectedSucursal);
    console.log('Reservas para hoy:', filteredReservations);

    // Abrir el diálogo
    this.dialog.open(ReservaIndexComponent, dialogConfig);
  }

  convertToHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}`;
  }

  getTooltipText(day: any): string {
    if (this.isToday(day.date)) {
      return 'Día actual';
    }
    if (day.isBlocked) {
      return 'Este día está bloqueado';
    }
    return '';
  }
}
