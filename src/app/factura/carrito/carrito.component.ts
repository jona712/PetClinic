import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { CartService } from '../../share/cart.service';
import {
  NotificacionService,
  TipoMessage,
} from '../../share/notification.service';
import { GenericService } from '../../share/generic.service';
import { AuthenticationService } from '../../share/authentication.service';

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css'],
})
export class CarritoComponent implements OnInit {
  isAuthenticated: boolean = false;
  total = 0;
  fecha = Date.now();
  qtyItems = 0;
  //Tabla
  displayedColumns: string[] = [
    'producto',
    'precio',
    'cantidad',
    'impuesto',
    'totalLinea',
    'acciones',
  ];
  dataSource = new MatTableDataSource<any>();
  constructor(
    private cartService: CartService,
    private noti: NotificacionService,
    private gService: GenericService,
    private router: Router,
    private authService: AuthenticationService,
    private cdr: ChangeDetectorRef // Inyecta ChangeDetectorRef
  ) {
    this.cartService.getTotal.subscribe((valor) => {
      this.total = valor;
    });
  }

  ngOnInit(): void {
    //Obtener todos los items de la Compra
    this.cartService.currentDataCart$.subscribe((data) => {
      this.dataSource = new MatTableDataSource(data);
    });
    this.authService.isAuthenticated.subscribe((valor) => {
      this.isAuthenticated = valor;
      this.cdr.detectChanges();
    });
    this.cartService.getTotal.subscribe((valor) => {
      this.total = valor;
    });
  }

  onCantidadChange(event: Event, element: any): void {
    const inputElement = event.target as HTMLInputElement;
    const cantidad = Number(inputElement.value);

    if (cantidad === 0) {
      this.deleteItem(element.id, element.estado);
    } else {
      // Actualiza la cantidad del elemento en el carrito utilizando el CartService
      this.cartService.updateCant(element.id, element.estado, cantidad);

      // Actualiza la cantidad del elemento en la interfaz
      element.cantidad = cantidad;
    }

    this.cartService.getItems().subscribe((items) => {
      console.log('%cItems en el carrito:', 'background: red; color: #000;');
      console.log(items);
    });
  }

  deleteItem(id: number, estado: boolean): void {
    this.cartService.removeFromCart(id, true); // Marcar como producto
    this.cartService.getItems().subscribe((items) => {
      console.log('%cItems en el carrito:', 'background: red; color: #000;');
      console.log(items);
    });
  }

  addInvoice() {
    this.router.navigate(['/factura/create']);
  }

  onKeyDown(event: KeyboardEvent) {
    const charCode = event.charCode || event.which;
    const keyCode = event.keyCode || event.which;

    if (
      !(charCode >= 48 && charCode <= 57) &&
      charCode !== 58 &&
      keyCode !== 8 &&
      keyCode !== 9
    ) {
      event.preventDefault();
    }
  }
}
