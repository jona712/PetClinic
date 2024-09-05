import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HorarioTableComponent } from './horario-table/horario-table.component';
import { HorarioFormComponent } from './horario-form/horario-form.component';
import { HorarioCalenderComponent } from './horario-calender/horario-calender.component';

const routes: Routes = [
  { path: 'horario-table', component: HorarioTableComponent },
  { path: 'horario/create', component: HorarioFormComponent },
  { path: 'horario-calender', component: HorarioCalenderComponent },
  // { path: 'horario/update/:id', component: HorarioFormComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HorarioRoutingModule {}
