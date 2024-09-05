import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';

import { FormErrorMessage } from '../../form-error-message';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { HorarioDiagComponent } from '../horario-diag/horario-diag.component';
import {
  NotificacionService,
  TipoMessage,
} from '../../share/notification.service';
import { AuthenticationService } from '../../share/authentication.service';

@Component({
  selector: 'app-horario-table',
  templateUrl: './horario-table.component.html',
  styleUrl: './horario-table.component.css',
})
export class HorarioTableComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  destroy$: Subject<boolean> = new Subject<boolean>();
  dataSource = new MatTableDataSource<any>();
  displayedColumns = ['diaSemana', 'fecha', 'horario', 'tipo', 'acciones'];
  datos: any;

  selectedSucursal: any;
  horarioForm: FormGroup;

  sucursalList: any;
  diasList: any;
  currentUser: any;

  isAdmin: boolean = false;

  horarioInfo: any;

  idSucursal: number = 0;

  constructor(
    private router: Router,
    private gService: GenericService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private noti: NotificacionService,
    private authService: AuthenticationService
  ) {
    // this.formularioReactive();
    // this.listaDias();
    this.listaSucursales();
  }

  public errorHandling = (controlName: string) => {
    let messageError = '';
    const control = this.horarioForm.get(controlName);
    if (control.errors) {
      for (const message of FormErrorMessage) {
        if (
          control &&
          control.errors[message.forValidator] &&
          message.forControl == controlName
        ) {
          messageError = message.text;
        }
      }
      return messageError;
    } else {
      return false;
    }
  };

  ngOnInit() {
    this.authService.decodeToken.subscribe((decodedToken: any) => {
      // Decodifica y asigna el token al currentUser
      this.currentUser = decodedToken;
  
      // Verifica si currentUser tiene el rol de 'Administrador'
      if (this.currentUser && this.currentUser.rol === 'Administrador') {
        this.isAdmin = true;
      }
    });
  }
  
  onSucursalChange(sucursalId: string): void {
    this.selectedSucursal = sucursalId;
    this.listHorarios(sucursalId);
  }

  listHorarios(sucursalId: string): void {
    this.gService
      .list(`sucursalHorario/${sucursalId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any[]) => {
        const transformedData = data.map((item) => ({
          diaSemana: item.horario.diaSemana,
          fecha: this.convertDateToFormat(item.horario.fecha),
          horaInicio: this.convertToHours(item.horario.horaInicio),
          horaFin: this.convertToHours(item.horario.horaFin),
          tipoHorario: item.horario.tipoHorario,
          sucursalId: item.sucursalId,
          horarioId: item.horario.id,
        }));

        // Asignar los datos transformados a la tabla
        this.dataSource = new MatTableDataSource(transformedData);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;

        // Mostrar notificación si no hay horarios ni bloqueos
        if (transformedData.length === 0) {
          this.noti.mensaje(
            'Atención',
            'Esta Sucursal no posee horarios ni bloqueos registrados',
            TipoMessage.warning
          );
        }
      });
  }

  detalleHorario(id: number) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '50%';
    dialogConfig.disableClose = false;
    dialogConfig.data = {
      id: id,
    };
    this.dialog.open(HorarioDiagComponent, dialogConfig);
  }
  crearHorario() {
    this.router.navigate(['/horario/create'], {
      relativeTo: this.route,
    });
  }

  actualizarHorario(id: number) {
    this.router.navigate(['/horario/update', id], {
      relativeTo: this.route,
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

  //Para cargar al comboBox multiple de Sucursales
  listaSucursales() {
    this.sucursalList = null;
    this.gService
      .list('sucursal')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.sucursalList = data;

        if (this.sucursalList && this.sucursalList.length > 0) {
          const selected = this.sucursalList.find(
            (sucursal) => sucursal.id === this.currentUser.idSucursal
          );

          // Si encuentra la sucursal, asigna su id a selectedSucursal
          if (selected) {
            this.selectedSucursal = selected.id;
            this.onSucursalChange(this.selectedSucursal);
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
