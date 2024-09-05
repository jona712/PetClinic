import { Component } from '@angular/core';
import { GenericService } from '../../share/generic.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ProductoDiagComponent } from '../producto-diag/producto-diag.component';
import { CartService } from '../../share/cart.service';
import {
  NotificacionService,
  TipoMessage,
} from '../../share/notification.service';

@Component({
  selector: 'app-producto-index',
  templateUrl: './producto-index.component.html',
  styleUrl: './producto-index.component.css',
})
export class productoIndexComponent {
  //Respuesta del API
  datos: any;
  lcategoria: any;
  destroy$: Subject<boolean> = new Subject<boolean>();
  filtro: string = '';
  categoria: any;
  filterDatos: any;

  constructor(
    private gService: GenericService,
    private dialog: MatDialog,
    private cartService: CartService,
    private noti: NotificacionService
  ) {
    this.listProductos();
    this.listCategorias();
  }

  //Listar todos los productos del API
  listProductos() {
    //localhost:3000/producto
    this.gService
      .list('producto/')
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta: any) => {
        console.log(respuesta);
        this.datos = respuesta;
        this.filterDatos = this.datos;
      });
  }

  listCategorias() {
    //localhost:3000/categoria
    this.gService
      .list('categoria/')
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta: any) => {
        console.log(respuesta);
        this.lcategoria = respuesta;
      });
  }

  // Método para filtrar productos
  buscarProductos() {
    // Inicialmente, establecer filterDatos como una copia de datos
    this.filterDatos = [...this.datos];

    // Filtrar por nombre del producto si se ha ingresado un filtro
    if (this.filtro) {
      this.filterDatos = this.filterDatos.filter((producto) =>
        producto.nombre.toLowerCase().includes(this.filtro.toLowerCase())
      );
    }

    // Filtrar por categoría si hay categorías seleccionadas
    if (this.categoria && this.categoria.length > 0) {
      this.filterDatos = this.filterDatos.filter((producto) =>
        this.categoria.includes(producto.categoriaId)
      );
    }
  }

  // Método para rastrear por ID (usado en ngFor)
  trackById(index: number, item: any): number {
    return item.id;
  }

  addProducto(id: number, estado: boolean) {
    this.gService
      .get('producto/', id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta: any) => {
        // Agregar el producto al carrito, pasando también el estado
        this.cartService.addToCart(respuesta, estado);
        this.noti.mensaje(
          'Carrito',
          'Producto ' + respuesta.nombre + ' agregado al carrito',
          TipoMessage.success
        );
      });
    this.cartService.getItems().subscribe((items) => {
      console.log('%cItems en el carrito:', 'background: red; color: #000;');
      console.log(items);
    });
  }

  detalleProducto(id: number) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '50%';
    dialogConfig.disableClose = false;
    dialogConfig.data = {
      id: id,
    };
    this.dialog.open(ProductoDiagComponent, dialogConfig);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
