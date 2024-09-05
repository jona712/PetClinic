import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';

@Component({
  selector: 'app-servicio-diag',
  templateUrl: './servicio-diag.component.html',
  styleUrls: ['./servicio-diag.component.css'],
})
export class ServicioDiagComponent implements OnInit {
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
      .get('servicio', id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        data.duracion = this.convertToHours(data.duracion); 
        this.datos = data;
      });
  }

  convertToHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
  }

  close() {
    //Dentro de close ()
    //this.form.value
    this.dialogRef.close();
  }
}
