import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { productoIndexComponent } from './producto-index/producto-index.component';
import { ProductoTableComponent } from './producto-table/producto-table.component';
import { ProductoFormComponent } from './producto-form/producto-form.component';

const routes: Routes = [
  { path: 'producto', component: productoIndexComponent },
  { path: 'producto-table', component: ProductoTableComponent },
  { path: 'producto/create', component: ProductoFormComponent },
  { path: 'producto/update/:id', component: ProductoFormComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class productoRoutingModule {}
