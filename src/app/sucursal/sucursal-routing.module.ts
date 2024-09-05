import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SucursalTableComponent } from './sucursal-table/sucursal-table.component';
import { SucursalFormComponent } from './sucursal-form/sucursal-form.component';

const routes: Routes = [
  { path: 'sucursal-table', component: SucursalTableComponent },
  { path: 'sucursal/create', component: SucursalFormComponent },
  { path: 'sucursal/update/:id', component: SucursalFormComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SucursalRoutingModule {}
