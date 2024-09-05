import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ReservaDetailComponent } from './reserva-detail/reserva-detail.component';
import { ReservaTableComponent } from './reserva-table/reserva-table.component';
import { ReservaFormComponent } from './reserva-form/reserva-form.component';
import { authGuard } from '../share/auth.guard';
import { ReservaIndexComponent } from './reserva-index/reserva-index.component';

const authEncargadoAdmin = {
  canActivate: [authGuard],
  data: { roles: ['Encargado', 'Administrador'] },
};

const routes: Routes = [
  {
    path: 'reserva-table',
    component: ReservaTableComponent,
    ...authEncargadoAdmin,
  },
  {
    path: 'reserva/create',
    component: ReservaFormComponent,
    ...authEncargadoAdmin,
  },
  {
    path: 'reserva/:id',
    component: ReservaDetailComponent,
    ...authEncargadoAdmin,
  },
  { path: 'reserva/', component: ReservaIndexComponent, ...authEncargadoAdmin },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReservaRoutingModule {}
