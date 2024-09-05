import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReporteRoutingModule } from './reporte-routing.module';
import { ReporteServiciosComponent } from './reporte-mas-vendidos/reporte-mas-vendidos.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReporteCitasComponent } from './reporte-citas/reporte-citas.component';




@NgModule({
  declarations: [
    ReporteServiciosComponent,
    ReporteCitasComponent,    
  ],
  imports: [
    CommonModule,  
    ReporteRoutingModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxChartsModule,
  ]
})
export class ReporteModule { }
