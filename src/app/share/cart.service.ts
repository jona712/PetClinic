import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export class ItemCart {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  impuesto: number;
  totalLinea: number;
  estado: boolean; // Nueva propiedad para diferenciar productos y servicios
  item: any;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cart = new BehaviorSubject<ItemCart[]>([]);
  public currentDataCart$ = this.cart.asObservable();
  public qtyItems = new Subject<number>();
  public total = new Subject<number>();

  constructor() {
    this.cart = new BehaviorSubject<ItemCart[]>(
      JSON.parse(localStorage.getItem('orden')) || []
    );
    this.currentDataCart$ = this.cart.asObservable();
  }

  saveCart(): void {
    localStorage.setItem('orden', JSON.stringify(this.cart.getValue()));
  }

  addToCart(item: any, estado: boolean) {
    const newItem = new ItemCart();
    newItem.id = item.id;
    newItem.precio = item.precio;

    // Ajustar cantidad: si es 0 o undefined, se establece en 1; de lo contrario, se usa la cantidad del item
  newItem.cantidad = (item.cantidad === 0 || item.cantidad === undefined || item.cantidad === null) ? 1 : item.cantidad;

    newItem.estado = estado;
    newItem.impuesto = estado ? 0.05 : 0.1;

    // Asigna nombre o descripción según el estado
    if (estado) {
      newItem.nombre = item.nombre;
      newItem.descripcion = ''; // Limpia la propiedad descripcion
    } else {
      newItem.nombre = ''; // Limpia la propiedad nombre
      newItem.descripcion = item.descripcion;
    }

    newItem.totalLinea = this.calculototalLinea(newItem);

    newItem.item = item

    let listCart = this.cart.getValue();
    let objIndex = listCart.findIndex(
      (obj) => obj.id === newItem.id && obj.estado === newItem.estado
    );

    if (objIndex !== -1) {
      listCart[objIndex].cantidad += 1;
      newItem.cantidad = listCart[objIndex].cantidad;
      listCart[objIndex].totalLinea = this.calculototalLinea(newItem);
    } else {
      listCart.push(newItem);
    }

    this.cart.next(listCart);
    this.qtyItems.next(this.quantityItems());
    this.total.next(this.calculoTotal());
    this.saveCart();
  }

  private calculototalLinea(item: ItemCart) {
    return item.precio * item.cantidad * (1 + item.impuesto);
  }

  public removeFromCart(id: number, estado: boolean) {
    let listCart = this.cart.getValue();
    let objIndex = listCart.findIndex(
      (obj) => obj.id == id && obj.estado === estado
    );

    if (objIndex != -1) {
      listCart.splice(objIndex, 1);
    }

    this.cart.next(listCart);
    this.qtyItems.next(this.quantityItems());
    this.total.next(this.calculoTotal());
    this.saveCart();
  }

  public updateCant(id: number, estado: boolean, cantidad: number) {
    let listCart = this.cart.getValue();
    let objIndex = listCart.findIndex(
      (obj) => obj.id === id && obj.estado === estado
    );

    if (objIndex !== -1) {
      // Actualizar la cantidad y recalcular el total de línea
      listCart[objIndex].cantidad = cantidad;
      listCart[objIndex].totalLinea = this.calculototalLinea(
        listCart[objIndex]
      );

      // Eliminar el ítem del carrito si la cantidad es 0
      if (listCart[objIndex].cantidad <= 0) {
        listCart.splice(objIndex, 1);
      }

      this.cart.next(listCart);
      this.qtyItems.next(this.quantityItems());
      this.total.next(this.calculoTotal());
      this.saveCart();
    }
  }

  getItems(): Observable<ItemCart[]> {
    return this.currentDataCart$;
  }

  get countItems(): Observable<number> {
    this.qtyItems.next(this.quantityItems());
    return this.qtyItems.asObservable();
  }

  quantityItems() {
    let listCart = this.cart.getValue();
    let sum = 0;
    if (listCart != null) {
      listCart.forEach((obj) => {
        sum += obj.cantidad;
      });
    }
    return sum;
  }

  public calculoTotal(): number {
    let totalCalc = 0;
    let listCart = this.cart.getValue();
    if (listCart != null) {
      listCart.forEach((item: ItemCart) => {
        totalCalc += item.totalLinea;
      });
    }
    return totalCalc;
  }

  get getTotal(): Observable<number> {
    this.total.next(this.calculoTotal());
    return this.total.asObservable();
  }

  public deleteCart() {
    this.cart.next([]);
    this.qtyItems.next(0);
    this.total.next(0);
    this.saveCart();
  }
}
