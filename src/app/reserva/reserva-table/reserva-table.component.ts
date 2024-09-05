import { Component, Input, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { GenericService } from '../../share/generic.service';
import { Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ReservaDiagComponent } from '../reserva-diag/reserva-diag.component';
import { AuthenticationService } from '../../share/authentication.service';

@Component({
  selector: 'app-reserva-table',
  templateUrl: './reserva-table.component.html',
  styleUrl: './reserva-table.component.css',
})
export class ReservaTableComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  @Input() data: any[] = [];
  @Input() context: string = '';

  // Datos simulados del usuario actual
  isAuntenticated = true;
  showCreateButton: boolean = false;
  clienteList: any;

  filtro: string = '';
  filterDatos: any;

  selectedDate: any;

  //Para datetime picker
  //minDate: Date;
  allowedDates: Date[] = [];
  sucursalHorarioData: any[] = [];
  rangosPermitidos: { start: string; end: string }[] = [];
  dateSelected: Date;

  currentUser: any;

  //@ViewChild(MatTable) table!: MatTable<FacturaTableItem>;
  dataSource = new MatTableDataSource<any>();

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['id', 'cliente', 'fecha', 'hora',  'estado', 'acciones'];
  //Respuesta del API
  datos: any;
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private gService: GenericService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private authService: AuthenticationService
  ) {
   
   
  }

  ngOnInit() {
    // Leer el contexto de los parámetros de consulta
    this.route.queryParams.subscribe((params) => {
      this.context = params['context'] || 'default';
      if (this.context === 'report') {
        this.showCreateButton = false;
      } else if (this.context === 'processes') {
        this.showCreateButton = true;
      }
    });

    this.authService.chargeUser(); // Carga el usuario
    this.currentUser = this.authService.currentUser; // Asigna el usuario cargado a la variable local
    //this.minDate = new Date(); // Fecha mínima es hoy
    this.getClientes();
    this.listReservas();
  }

  ngAfterViewInit(): void {}

  dateFilter = (date: Date | null): boolean => {
    if (!date) {
      return false;
    }
    return this.allowedDates.some(
      (allowedDate) =>
        allowedDate.getFullYear() === date.getFullYear() &&
        allowedDate.getMonth() === date.getMonth() &&
        allowedDate.getDate() === date.getDate()
    );
  };

  //Listar todos los Reservas del API
  listReservas() {
    // Filtrar las reservas por idSucursal del usuario actual
    const idSucursalUsuario = parseInt(this.currentUser.idSucursal, 10);
    //localhost:3000/videojuego
    this.gService
      .list('reserva/', { sucursalId: idSucursalUsuario })
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta: any) => {
        console.log(respuesta);
        this.datos = respuesta;
        this.getFechasDisponibles();

        const transformedData = respuesta.map((item: any) => ({
          ...item,
          fecha: this.convertDateToFormat(item.fecha),
          hora: this.convertToHours(item.hora),
        }));

        this.dataSource = new MatTableDataSource(transformedData);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      });
  }



  //Obtiene todos los usuarios con rol = cliente
  getClientes() {
    this.gService
      .list('usuario/getClientes')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.clienteList = data;
      });
  }

  // detalle(id: number) {
  //   this.router.navigate(['/reserva', id]);
  // }

  detalleReserva(id: number) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = 'auto';
    dialogConfig.disableClose = false;
    dialogConfig.data = {
      id: id,
    };
    this.dialog.open(ReservaDiagComponent, dialogConfig);
  }

  convertDateToFormat(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mes es 0-tableado
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  convertDateToUTCFormat(date: Date): string {
    // Convierte la fecha local a UTC-6 y luego a formato YYYY-MM-DD
    const utcDate = new Date(date.toUTCString());
    const day = utcDate.getUTCDate().toString().padStart(2, '0');
    const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = utcDate.getUTCFullYear();
    return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
  }

  //Convierte los minutos a horas para ser mostradas en la interfaz
  convertToHours(minutes: number): string {
    if (isNaN(minutes)) {
      console.error('El valor de minutos no es un número:', minutes);
      return '00:00';
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convertir 0 a 12 para el formato de 12 horas
    const formattedMinutes = remainingMinutes.toString().padStart(2, '0');

    return `${formattedHours
      .toString()
      .padStart(2, '0')}:${formattedMinutes} ${period}`;
  }
  crearReserva() {
    this.router.navigate(['/reserva/create'], {
      relativeTo: this.route,
    });
  }

  searchReservaCliente(nombre: any) {
    if (nombre) {
      this.gService
        .list(`reserva/byCliente/${nombre}/${this.currentUser.idSucursal}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe((respuesta: any) => {
          console.log('Respuesta: ');
          console.log(respuesta);

          const transformedData = respuesta.map((item: any) => ({
            ...item,
            fecha: this.convertDateToFormat(item.fecha),
            hora: this.convertToHours(item.hora),
          }));

          const filteredReservas = respuesta.filter(
            (reserva: any) => reserva.sucursalId === this.currentUser.idSucursal
          );
          console.log(filteredReservas);

          this.dataSource = new MatTableDataSource(transformedData);
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;
        });
    } else {
      this.listReservas();
    }
  }

  limpiarFiltroInput() {
    if (this.filtro != '') {
      this.listReservas();
    }
    this.filtro = '';
  }

  limpiarFiltroDate() {
    if (this.selectedDate != null) {
      this.listReservas();
    }
    this.selectedDate = null;
  }

  //Define las fechas en las que existe un horario, para ser enviadas al datePicker
  getFechasDisponibles() {
    this.allowedDates = this.datos.map((item: any) => new Date(item.fecha));
  }

  //Evento que se utiliza para mostrar los detalles de los horarios y bloqueos en una fecha específica
  onDateChange(event: any): void {
    this.selectedDate = event.value;
    const formattedDate = this.convertDateToUTCFormat(event.value);
    this.gService
      .list(`reserva/byFecha/${formattedDate}/${this.currentUser.idSucursal}`)    
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any[]) => {
        // this.datos = data;

        const transformedData = data.map((item: any) => ({
          ...item,
          fecha: this.convertDateToFormat(item.fecha),
          hora: this.convertToHours(item.hora),
        }));

        // Asignar los datos transformados a la tabla
        this.dataSource = new MatTableDataSource(transformedData);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
