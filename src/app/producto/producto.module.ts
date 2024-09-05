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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { productoRoutingModule } from './producto-routing.module';
import { ProductoDiagComponent } from './producto-diag/producto-diag.component';
import { productoIndexComponent } from './producto-index/producto-index.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductoTableComponent } from './producto-table/producto-table.component';
import { ProductoFormComponent } from './producto-form/producto-form.component';

@NgModule({
  declarations: [
    ProductoDiagComponent,
    productoIndexComponent,
    ProductoTableComponent,
    ProductoFormComponent,
  ],
  imports: [
    CommonModule,
    productoRoutingModule,
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
    MatTooltipModule,
    MatBadgeModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class ProductoModule {}
