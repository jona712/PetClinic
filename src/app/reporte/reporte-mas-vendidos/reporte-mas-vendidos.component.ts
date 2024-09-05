import { Component } from '@angular/core';
import { GenericService } from '../../share/generic.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-reporte-mas-vendidos',
  templateUrl: './reporte-mas-vendidos.component.html',
  styleUrl: './reporte-mas-vendidos.component.css',
})
export class ReporteServiciosComponent {
  destroy$: Subject<boolean> = new Subject<boolean>();

  //https://swimlane.gitbook.io/ngx-charts/examples/bar-charts/vertical-bar-chart
  view: [number, number] = [800, 600]; //Las dimensiones del gráfico [ancho, alto]
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  gradient: boolean = true;
  showLegend: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Sucursales';
  showYAxisLabel: boolean = true;
  yAxisLabel: string = 'Cantidades vendidas';
  legendTitle: string = 'Datos';
  colorScheme = 'aqua'; //natural, vivid, cool, fire, solar, air, aqua, flame, ocean,
  // forest, horizon, neons, picnic, night, nightLights
  //Los que prometen son: vivid, aqua
  //Los que MEDIO prometen son: cool, air, forest, picnic

  serviceData = [];
  productData = [];

  // options
  selectedSucursal: any;

  barPadding = 10;
  formattedData = [];
  sucursalList: any[] = [];
  sucursalesData: any[] = [];
  /**
   *
   */
  constructor(private gService: GenericService) {
    
  }

  ngOnInit() {
    // Aquí cargas la lista de sucursales, por ejemplo, desde un servicio
    this.listaSucursales();
  }

  listServicios() {
    this.gService
      .list(`reporte/vj-servicio/${this.selectedSucursal}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta) => {
        this.serviceData = respuesta;
      });
  }
  
  listProductos() {
    this.gService
      .list(`reporte/vj-producto/${this.selectedSucursal}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta) => {
        this.productData = respuesta;
      });
  }

  listaSucursales() {
    this.sucursalList = null;
    this.gService
      .list('sucursal')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.sucursalList = data;

        // Si la lista tiene elementos, selecciona el primero por defecto
        if (this.sucursalList && this.sucursalList.length > 0) {
          this.selectedSucursal = this.sucursalList[0].id;
          this.onSucursalChange(this.selectedSucursal);
        }
      });
  }

  // Cambiar los datos cuando se selecciona otra sucursal
  onSucursalChange(sucursalId: number) {
    this.selectedSucursal = sucursalId;
    this.listServicios();
    this.listProductos();
  }

  
  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
