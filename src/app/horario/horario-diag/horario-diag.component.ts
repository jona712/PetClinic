import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ServicioDiagComponent } from '../../servicio/servicio-diag/servicio-diag.component';

@Component({
  selector: 'app-horario-diag',
  templateUrl: './horario-diag.component.html',
  styleUrl: './horario-diag.component.css'
})
export class HorarioDiagComponent {
  datos: any;
  datosDialog: any;
  destroy$: Subject<boolean> = new Subject<boolean>();
  constructor(
    @Inject(MAT_DIALOG_DATA) data,
    private dialogRef: MatDialogRef<ServicioDiagComponent>,
    private gService: GenericService
  ) {
    this.datosDialog = data;
  }

  ngOnInit(): void {
    if (this.datosDialog.id) {
      this.obtenerServicio(this.datosDialog.id);
    } 
  }
  obtenerServicio(id: any) {
    this.gService
      .get('horario', id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {     
        
        const transformedData = {
          diaSemana: data.diaSemana,
          fecha: this.convertDateToFormat(data.fecha),
          horaInicio: this.convertToHours(data.horaInicio),
          horaFin: this.convertToHours(data.horaFin),
          tipoHorario: data.tipoHorario,
          sucursalId: data.sucursalId,
        };

        
        this.datos = transformedData;
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
    //Dentro de close ()
    //this.form.value
    this.dialogRef.close();
  }
}
