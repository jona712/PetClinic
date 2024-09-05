import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReporteServiciosComponent } from './reporte-mas-vendidos/reporte-mas-vendidos.component';
import { ReporteCitasComponent } from './reporte-citas/reporte-citas.component';

const routes: Routes = [
  { path: 'MasVendidos', component: ReporteServiciosComponent },
  { path: 'reporteCitas', component: ReporteCitasComponent },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReporteRoutingModule { }
