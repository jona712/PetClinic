import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServicioTableComponent } from './servicio-table/servicio-table.component';
import { ServicioFormComponent } from './servicio-form/servicio-form.component';

const routes: Routes = [
  { path: 'servicio-table', component: ServicioTableComponent },
  { path: 'servicio/create', component: ServicioFormComponent },
  { path: 'servicio/update/:id', component: ServicioFormComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServicioRoutingModule {}
