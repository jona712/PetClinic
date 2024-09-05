import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReservaRoutingModule } from './reserva-routing.module';


import { ReservaDetailComponent } from './reserva-detail/reserva-detail.component';
import { ReservaTableComponent } from './reserva-table/reserva-table.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReservaFormComponent } from './reserva-form/reserva-form.component';


import {MatNativeDateModule} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReservaDiagComponent } from './reserva-diag/reserva-diag.component';
import { ReservaIndexComponent } from './reserva-index/reserva-index.component';




@NgModule({
  declarations: [
    ReservaTableComponent,
    ReservaDetailComponent,
    ReservaFormComponent,
    ReservaDiagComponent,
    ReservaIndexComponent,
  ],
  imports: [
    CommonModule,
    ReservaRoutingModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDividerModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    ReactiveFormsModule
  ]
})
export class ReservaModule { }
