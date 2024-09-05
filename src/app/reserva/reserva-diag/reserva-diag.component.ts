import { Component, Inject, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-reserva-diag',
  templateUrl: './reserva-diag.component.html',
  styleUrl: './reserva-diag.component.css',
})
export class ReservaDiagComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  currentUser: any;

  dataSource = new MatTableDataSource<any>();
  displayedColumns = ['Servicio', 'Habitos', 'Historial', 'Razon'];

  datos: any;
  datosDialog: any;
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    @Inject(MAT_DIALOG_DATA) data,
    private dialogRef: MatDialogRef<ReservaDiagComponent>,
    private gService: GenericService
  ) {
    this.datosDialog = data;
  }

  ngOnInit(): void {
    if (this.datosDialog.id) {
      this.obtenerReserva(this.datosDialog.id);
    }
  }
  obtenerReserva(id: any) {
    this.gService
      .get('reserva', Number(id))
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        // Transformar fecha y hora
        const transformedData = {
          ...data,
          fecha: this.convertDateToFormat(data.fecha),
          hora: this.convertToHours(data.hora),
          horaFin: this.convertToHours(
            parseInt(data.hora) + parseInt(data.servicio.duracion)
          ),
        };

        // Asigna toda la data para que incluya servicio, habitos, historial y razon
        this.datos = transformedData;
        this.dataSource.data = [transformedData];
      });
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

  convertDateToFormat(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mes es 0-tableado
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  close() {
    this.dialogRef.close();
  }
}
