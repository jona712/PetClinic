import { Component, Inject, ViewChild, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from '@angular/material/dialog';
import { GenericService } from '../../share/generic.service';
import { ReservaDiagComponent } from '../reserva-diag/reserva-diag.component';

@Component({
  selector: 'app-reserva-index',
  templateUrl: './reserva-index.component.html',
  styleUrls: ['./reserva-index.component.css'],
})
export class ReservaIndexComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<any>();
  displayedColumns = ['servicio', 'Hora', 'estado', 'correo', 'acciones'];

  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { date: Date; idSucursal: number },
    private dialogRef: MatDialogRef<ReservaIndexComponent>,
    private dialog: MatDialog,
    private gService: GenericService
  ) {}

  ngOnInit(): void {
    if (this.data) {
      const { date, idSucursal } = this.data;
      this.obtenerReservasPorFechaYSucursal(date, idSucursal);
    }
  }

  obtenerReservasPorFechaYSucursal(fecha: Date, idSucursal: number) {
    const formattedDate = this.convertDateToUTCFormat(fecha);
    this.gService
      .list(`reserva/byFecha/${formattedDate}/${idSucursal}`) // Asegúrate de usar el método adecuado para la ruta
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any[]) => {
          if (data && Array.isArray(data) && data.length > 0) {
            // Transformar fechas y horas para cada reserva
            const transformedData = data.map((item: any) => ({
              ...item,
              fecha: this.convertDateToFormat(item.fecha),
              hora: this.convertToHours(item.hora),
              horaFin: this.convertToHours(
                parseInt(item.hora, 10) + parseInt(item.servicio.duracion, 10)
              ),
            }));

            // Asigna toda la data para que incluya servicio, habitos, historial y razon
            this.dataSource.data = transformedData;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            console.log(data);
          } else {
            console.warn(
              'No se encontraron reservas para la fecha y sucursal especificadas'
            );
          }
        },
        (error) => {
          console.error('Error al obtener reservas:', error);
        }
      );
  }

  // Convierte los minutos a horas para ser mostradas en la interfaz
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

  convertDateToFormat(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mes es 0-indexado
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

  close() {
    this.dialogRef.close();
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
}
