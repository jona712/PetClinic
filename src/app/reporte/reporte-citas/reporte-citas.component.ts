import { Component } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { DatePipe } from '@angular/common';
import { AuthenticationService } from '../../share/authentication.service';

@Component({
  selector: 'app-reporte-citas',
  templateUrl: './reporte-citas.component.html',
  styleUrl: './reporte-citas.component.css',
})
export class ReporteCitasComponent {
  destroy$: Subject<boolean> = new Subject<boolean>();

  //https://swimlane.gitbook.io/ngx-charts/examples/bar-charts/vertical-bar-chart
  view: [number, number] = [800, 600]; //Las dimensiones del gráfico [ancho, alto]
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  gradient: boolean = true;
  showLegend: boolean = false;
  showXAxisLabel: boolean = false;
  xAxisLabel: string = 'Reservas';
  showYAxisLabel: boolean = true;
  yAxisLabel: string = 'Citas registradas';
  legendTitle: string = 'Datos';
  barPadding = 10;
  colorScheme = 'aqua'; //natural, vivid, cool, fire, solar, air, aqua, flame, ocean,
  // forest, horizon, neons, picnic, night, nightLights
  //Los que prometen son: vivid, aqua
  //Los que MEDIO prometen son: cool, air, forest, picnic

  data = [];

  date = new Date();

  dataSucursal: any;
  currentUser: any;

  constructor(
    private gService: GenericService,
    private authService: AuthenticationService
  ) {
    //this.authService.chargeUser(); // Carga el usuario
    this.currentUser = this.authService.currentUser; // Asigna el usuario cargado a la variable local    
    
    this.getSucursal();
    this.listCitas();
  }

  getSucursal() {
    this.gService
      .list(`sucursal/${this.currentUser.idSucursal}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta) => {
        this.dataSucursal = respuesta;
        console.log(respuesta);
      });
  }

  listCitas() {
    this.gService
      .list(`reporte/vj-citas/${this.currentUser.idSucursal}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta) => {
        this.data = respuesta;
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
