import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import {
  NotificacionService,
  TipoMessage,
} from '../../share/notification.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { GenericService } from '../../share/generic.service';
import { FormErrorMessage } from '../../form-error-message';
import { CartService, ItemCart } from '../../share/cart.service';
import { MatTableDataSource } from '@angular/material/table';
import { delay, map, switchMap } from 'rxjs/operators';
import { DecimalPipe } from '@angular/common';
import Swal from 'sweetalert2';
import { AuthenticationService } from '../../share/authentication.service';

@Component({
  selector: 'app-factura-form',
  templateUrl: './factura-form.component.html',
  styleUrl: './factura-form.component.css',
})
export class FacturaFormComponent {
  destroy$: Subject<boolean> = new Subject<boolean>();
  titleForm: string = 'Crear';
  facturaForm: FormGroup;
  facturaInfo: any;

  isLoading = false;

  totalFactura: any;

  // Datos simulados del usuario actual
  currentUser: any;

  sucursal: any;
  encargado: any;

  listServicios: any;
  listProductos: any;
  listClientes: any;

  selectedCliente: any;
  selectedProductos: any[] = [];
  selectedServicios: any[] = [];

  sucursalList: any[] = [];
  sucursalesData: any[] = [];
  // options
  selectedSucursal: any;

  totalProductos: number = 0;
  totalServicios: number = 0;
  totalGeneral: number = 0;

  displayedColumnsProductos: string[] = [
    'nombre',
    'precio',
    'impuesto',
    'cantidad',
    'totalLinea',
    'opciones',
  ];
  displayedColumnsServicios: string[] = [
    'descripcion',
    'precio',
    'impuesto',
    'cantidad',
    'totalLinea',
    'opciones',
  ];

  productosDataSource = new MatTableDataSource<any>([]);
  serviciosDataSource = new MatTableDataSource<any>([]);

  productosCarrito: any[] = [];
  serviciosCarrito: any[] = [];
  detallesFactura: any[] = []; // Agregar para los detalles de la factura

  formattedDuracion: string = '';
  respFactura: any;
  idFactura: number = 0;
  isCreate: boolean = true;

  minDate: Date;
  sucursalHorarioData: any[] = [];
  allowedDates: Date[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activeRouter: ActivatedRoute,
    private gService: GenericService,
    private noti: NotificacionService,
    private cartService: CartService,
    private authService: AuthenticationService
  ) {
    this.formularioReactive();
  }

  ngOnInit(): void {
    this.formularioReactive();

    this.activeRouter.params.subscribe((params: Params) => {
      this.idFactura = params['id'];
      if (this.idFactura) {
        this.isCreate = false;
        this.titleForm = 'Actualizar';

        // Obtener datos de la factura del API
        this.gService
          .get('factura', this.idFactura)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data: any) => {
            this.facturaForm.patchValue({
              id: data.id,
              fecha: new Date(data.fecha),
              sucursal: data.sucursal.id,
              usuario: data.usuario.id,
              estado: data.estado,
              total: data.total,
              facturaDetalle: data.FacturaDetalle,
            });

            this.selectedCliente = data.usuario;
            this.sucursal = data.sucursal;
            this.facturaForm.get('usuario')?.disable();
            this.facturaForm.get('sucursal')?.disable();
            console.log(this.facturaForm.value);

            this.cartService.deleteCart();

            const servicios = data.FacturaDetalle.filter(
              (detalle: any) => detalle.servicioId
            ).map((detalle: any) => ({
              id: detalle.servicio.id,
              descripcion: detalle.servicio.descripcion,
              precio: parseFloat(detalle.precio),
              cantidad: detalle.cantidad,
              impuesto: parseFloat(detalle.impuesto),
              totalLinea: this.calcularTotalLinea({
                precio: parseFloat(detalle.precio),
                cantidad: detalle.cantidad,
                impuesto: parseFloat(detalle.impuesto),
              }),
              estado: false,
            }));

            const productos = data.FacturaDetalle.filter(
              (detalle: any) => detalle.productoId
            ).map((detalle: any) => ({
              id: detalle.producto.id,
              nombre: detalle.producto.nombre,
              precio: parseFloat(detalle.precio),
              cantidad: detalle.cantidad,
              impuesto: parseFloat(detalle.impuesto),
              totalLinea: this.calcularTotalLinea({
                precio: parseFloat(detalle.precio),
                cantidad: detalle.cantidad,
                impuesto: parseFloat(detalle.impuesto),
              }),
              estado: true,
            }));

            productos.forEach((item) => this.cartService.addToCart(item, true));
            servicios.forEach((item) =>
              this.cartService.addToCart(item, false)
            );

            this.cartService.getItems().subscribe((items) => {
              this.productosCarrito = items.filter((item) => item.estado);
              this.serviciosCarrito = items.filter((item) => !item.estado);

              this.productosDataSource.data = [...this.productosCarrito];
              this.serviciosDataSource.data = [...this.serviciosCarrito];

              this.calcularTotal();

              // Filtrar y cargar productos
              this.gService
                .list('producto')
                .pipe(
                  takeUntil(this.destroy$),
                  map((productos: any[]) => {
                    return productos.filter(
                      (producto) =>
                        !this.productosCarrito.some(
                          (carritoItem) => carritoItem.id === producto.id
                        )
                    );
                  })
                )
                .subscribe((data: any) => {
                  this.listProductos = data;
                });

              // Filtrar y cargar servicios
              this.gService
                .list('servicio')
                .pipe(
                  takeUntil(this.destroy$),
                  map((servicios: any[]) => {
                    return servicios.filter(
                      (servicio) =>
                        !this.serviciosCarrito.some(
                          (carritoItem) => carritoItem.id === servicio.id
                        )
                    );
                  })
                )
                .subscribe((data: any) => {
                  this.listServicios = data;
                });

              console.log(
                '%cItems en el carrito:',
                'background: red; color: #000;'
              );
              console.log(items);
            });
          });
      } else {
        this.isCreate = true;
        this.titleForm = 'Crear';

        // Cargar productos sin filtrar
        this.gService
          .list('producto')
          .pipe(takeUntil(this.destroy$))
          .subscribe((data: any) => {
            this.listProductos = data;
          });

        // Cargar servicios sin filtrar
        this.gService
          .list('servicio')
          .pipe(takeUntil(this.destroy$))
          .subscribe((data: any) => {
            this.listServicios = data;
          });

        // Verificar si el carrito tiene items
        this.cartService.getItems().subscribe((items) => {
          // Filtrar productos y servicios en el carrito
          this.productosCarrito = items.filter((item) => item.estado);
          this.serviciosCarrito = items.filter((item) => !item.estado);

          // Actualizar dataSource de tablas
          this.productosDataSource.data = [...this.productosCarrito];
          this.serviciosDataSource.data = [...this.serviciosCarrito];

          this.calcularTotal();

          // Filtrar y cargar productos no en el carrito
          this.gService
            .list('producto')
            .pipe(
              takeUntil(this.destroy$),
              map((productos: any[]) => {
                return productos.filter(
                  (producto) =>
                    !this.productosCarrito.some(
                      (carritoItem) => carritoItem.id === producto.id
                    )
                );
              })
            )
            .subscribe((data: any) => {
              this.listProductos = data;
            });

          // Filtrar y cargar servicios no en el carrito
          this.gService
            .list('servicio')
            .pipe(
              takeUntil(this.destroy$),
              map((servicios: any[]) => {
                return servicios.filter(
                  (servicio) =>
                    !this.serviciosCarrito.some(
                      (carritoItem) => carritoItem.id === servicio.id
                    )
                );
              })
            )
            .subscribe((data: any) => {
              this.listServicios = data;
            });

          console.log(
            '%cItems en el carrito:',
            'background: red; color: #000;'
          );
          console.log(items);
        });
      }
    });

    this.authService.chargeUser(); // Carga el usuario
    this.currentUser = this.authService.currentUser; // Asigna el usuario cargado a la variable local

    if (this.currentUser.rol === 'Cliente') {
      this.selectedCliente = this.currentUser;
      console.log(this.selectedCliente);
    }
    this.minDate = new Date();
    // Aquí cargas la lista de sucursales, por ejemplo, desde un servicio
    this.listaSucursales();
    this.getSucursal();
    this.getClientes();
  }

  formularioReactive() {
    this.facturaForm = this.fb.group({
      id: [null],
      fecha: [null, Validators.required],
      sucursal: [null, Validators.required],
      usuario: [null, Validators.required],
      estado: [true],
      total: [null, Validators.required],
      facturaDetalle: [null, Validators.required],
    });
  }

  //Listado de los servicios disponibles
  getProductos() {
    this.gService
      .list('producto')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.listProductos = data;
      });
  }

  //Listado de los servicios disponibles
  getServicios() {
    this.gService
      .list('servicio')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.listServicios = data;
      });
  }

  // Método para obtener la sucursal basada en el rol del usuario conectado
  getSucursal() {
    console.log(this.currentUser.idSucursal);

    // Verificar el rol del usuario y usar la ruta correspondiente
    if (this.currentUser.rol === 'Encargado') {
      // Si el rol es 'Encargado', utiliza la ruta normal para obtener la sucursal
      this.gService
        .get('sucursal', this.currentUser.idSucursal) // Reemplaza 'sucursal' por la ruta correcta en tu API
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (data: any) => {
            this.sucursal = data;

            // Actualiza el valor de sucursal en el formulario
            this.facturaForm
              .get('sucursal')
              ?.setValue(this.currentUser.idSucursal, { emitEvent: false });

            // Guarda el encargado actual
            this.encargado = this.currentUser;
          },
          (error: any) => {
            console.error(
              'Error al obtener la sucursal para Encargado:',
              error
            );
          }
        );
    } else if (
      this.currentUser.rol === 'Administrador' ||
      this.currentUser.rol === 'Cliente'
    ) {
      if (this.selectedSucursal) {
        // Verifica si selectedSucursal no es undefined o null
        this.gService
          .get('sucursal', this.selectedSucursal) // Reemplaza con la ruta específica si es diferente
          .pipe(takeUntil(this.destroy$))
          .subscribe(
            (data: any) => {
              this.sucursal = data;
              // Actualiza el valor de sucursal en el formulario
              this.facturaForm
                .get('sucursal')
                ?.setValue(this.selectedSucursal, { emitEvent: false });
            },
            (error: any) => {
              console.error(
                'Error al obtener la sucursal para Administrador o Cliente:',
                error
              );
            }
          );
      }
    }
  }

  //Obtiene todos los usuarios con rol = cliente
  getClientes() {
    this.gService
      .list('usuario/getClientes')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.listClientes = data;
      });
  }

  // Método para obtener la lista de sucursales
  listaSucursales() {
    this.sucursalList = [];
    this.gService
      .list('sucursal')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any[]) => {
        this.sucursalList = data;
      });
  }

  // Cambiar los datos cuando se selecciona otra sucursal
  onSucursalChange(sucursalId: string) {
    this.selectedSucursal = sucursalId;

    // Obtener la sucursal por id
    this.gService
      .get('sucursal', sucursalId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          this.sucursal = data;
        },
        (error: any) => {
          console.error('Error al obtener la sucursal:', error);
        }
      );
  }

  //Evento que actualiza la información relacionada con el cliente
  onClienteChange(clienteId: string) {
    this.gService
      .get('usuario', clienteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.selectedCliente = data;
      });
  }

  onProductoChange(productoIds: string[]): void {
    this.selectedProductos = []; // Limpiar la lista antes de agregar nuevos productos
    productoIds.forEach((productoId) => {
      this.gService
        .get('producto', productoId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.selectedProductos.push(data);
        });
    });
  }

  onServicioChange(servicioIds: string[]): void {
    this.selectedServicios = []; // Limpiar la lista antes de agregar nuevos servicios
    servicioIds.forEach((servicioId) => {
      this.gService
        .get('servicio', servicioId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.selectedServicios.push(data);
        });
    });
  }

  onCantidadChange(event: Event, element: any): void {
    const inputElement = event.target as HTMLInputElement;
    const cantidad = Number(inputElement.value);

    if (cantidad === 0) {
      this.eliminarElemento(element.id, element.estado);
    } else {
      // Actualiza la cantidad del elemento en el carrito utilizando el CartService
      this.cartService.updateCant(element.id, element.estado, cantidad);

      // Actualiza la cantidad del elemento en la interfaz
      element.cantidad = cantidad;

      // Llama al método para calcular el total de línea
      this.calcularTotalLinea(element);
      this.calcularTotal();

      // Actualiza el dataSource
      if (element.estado) {
        // Si es producto
        this.productosDataSource.data = [...this.productosCarrito];
      } else {
        // Si es servicio
        this.serviciosDataSource.data = [...this.serviciosCarrito];
      }
    }
  }

  addProductosSeleccionados(): void {
    if (this.selectedProductos.length > 0) {
      this.selectedProductos.forEach((producto) => {
        // Verificar si el producto ya está en el carrito
        const productoEnCarrito = this.productosCarrito.find(
          (item) => item.id === producto.id && item.estado === true
        );

        if (!productoEnCarrito) {
          producto.cantidad = 1; // Establece la cantidad a 1
          this.cartService.addToCart(producto, true); // Marcar como producto
          this.productosCarrito.push(producto); // Añadir el producto al carrito
          this.calcularTotalLinea(producto); // Llama a calcularTotalLinea
        } else {
          // Si ya está en el carrito, puedes actualizar la cantidad o realizar otras acciones si es necesario
          productoEnCarrito.cantidad += 1; // Ejemplo de incremento de cantidad
          this.calcularTotalLinea(productoEnCarrito); // Actualizar el total para el producto ya existente
        }
      });

      // Actualiza el dataSource solo si isCreate es false
      if (!this.isCreate) {
        this.productosDataSource.data = [...this.productosCarrito];
      }

      this.calcularTotal();

      this.noti.mensaje(
        'Producto',
        'Producto(s) agregado(s) a la lista',
        TipoMessage.success
      );

      // Filtrar los productos ya seleccionados de la lista disponible
      this.listProductos = this.listProductos.filter(
        (item) => !this.selectedProductos.some((p) => p.id === item.id)
      );

      this.selectedProductos = [];

      // Mostrar todos los items del carrito
      this.cartService.getItems().subscribe((items) => {
        console.log('%cItems en el carrito:', 'background: red; color: #000;');
        console.log(items);
      });
    } else {
      this.noti.mensaje(
        'Atención',
        'No se ha seleccionado ningún PRODUCTO',
        TipoMessage.warning
      );
    }
  }

  addServiciosSeleccionados(): void {
    if (this.selectedServicios.length > 0) {
      this.selectedServicios.forEach((servicio) => {
        // Verificar si el servicio ya está en el carrito
        const servicioEnCarrito = this.serviciosCarrito.find(
          (item) => item.id === servicio.id && item.estado === false
        );

        if (!servicioEnCarrito) {
          servicio.cantidad = 1; // Establece la cantidad a 1
          this.cartService.addToCart(servicio, false); // Marcar como servicio
          this.serviciosCarrito.push(servicio); // Añadir el servicio al carrito
          this.calcularTotalLinea(servicio); // Llama a calcularTotalLinea
        } else {
          // Si ya está en el carrito, puedes actualizar la cantidad o realizar otras acciones si es necesario
          servicioEnCarrito.cantidad += 1; // Ejemplo de incremento de cantidad
          this.calcularTotalLinea(servicioEnCarrito); // Actualizar el total para el servicio ya existente
        }
      });

      // Actualiza el dataSource solo si isCreate es false
      if (!this.isCreate) {
        this.serviciosDataSource.data = [...this.serviciosCarrito];
      }

      this.calcularTotal();

      this.noti.mensaje(
        'Servicio',
        'Servicio(s) agregado(s) a la lista',
        TipoMessage.success
      );

      // Filtrar los servicios ya seleccionados de la lista disponible
      this.listServicios = this.listServicios.filter(
        (item) => !this.selectedServicios.some((s) => s.id === item.id)
      );

      this.selectedServicios = [];

      // Mostrar todos los items del carrito
      this.cartService.getItems().subscribe((items) => {
        console.log('%cItems en el carrito:', 'background: red; color: #000;');
        console.log(items);
      });
    } else {
      this.noti.mensaje(
        'Atención',
        'No se ha seleccionado ningún SERVICIO',
        TipoMessage.warning
      );
    }
  }

  eliminarElemento(id: number, estado: boolean): void {
    // Desactivar validaciones temporales
    this.facturaForm.get('producto')?.clearValidators();
    this.facturaForm.get('servicio')?.clearValidators();

    if (estado) {
      // Eliminar un producto
      const productoEliminado = this.productosCarrito.find(
        (producto) => producto.id === id
      );
      if (productoEliminado) {
        this.productosCarrito = this.productosCarrito.filter(
          (producto) => producto.id !== id
        );
        this.productosDataSource.data = [...this.productosCarrito];
        this.cartService.removeFromCart(id, true); // Marcar como producto

        // Limpiar la selección en el mat-select de productos
        const control = this.facturaForm.get('producto');
        if (control) {
          const valoresSeleccionados = control.value as number[];
          control.setValue(
            valoresSeleccionados.filter((value) => value !== id)
          );
        }

        // Añadir el producto eliminado de vuelta a la lista de productos disponibles
        this.listProductos.push(productoEliminado);
        this.listProductos = [...this.listProductos]; // Actualizar el array para que Angular detecte los cambios
        this.calcularTotal();
      }
    } else {
      // Eliminar un servicio
      const servicioEliminado = this.serviciosCarrito.find(
        (servicio) => servicio.id === id
      );
      if (servicioEliminado) {
        this.serviciosCarrito = this.serviciosCarrito.filter(
          (servicio) => servicio.id !== id
        );
        this.serviciosDataSource.data = [...this.serviciosCarrito];
        this.cartService.removeFromCart(id, false); // Marcar como servicio

        // Limpiar la selección en el mat-select de servicios
        const control = this.facturaForm.get('servicio');
        if (control) {
          const valoresSeleccionados = control.value as number[];
          control.setValue(
            valoresSeleccionados.filter((value) => value !== id)
          );
        }

        // Añadir el servicio eliminado de vuelta a la lista de servicios disponibles
        this.listServicios.push(servicioEliminado);
        this.listServicios = [...this.listServicios]; // Actualizar el array para que Angular detecte los cambios
        this.calcularTotal();
      }
    }

    // // Reactivar validaciones después de la eliminación
    // this.facturaForm.get('producto')?.setValidators([Validators.required]);
    // this.facturaForm.get('servicio')?.setValidators([Validators.required]);

    // Mostrar todos los items del carrito
    this.cartService.getItems().subscribe((items) => {
      console.log('%cItems en el carrito:', 'background: red; color: #000;');
      console.log(items);
    });
  }

  calcularTotalLinea(element: any): void {
    let impuesto: number;
    let precio: number;
    const cantidad = element.cantidad || 1; // Asegúrate de que 'cantidad' tenga un valor

    if (element.estado) {
      // Si es producto
      precio = element.precio;
      impuesto = 0.05; // Impuesto para productos
    } else {
      // Si es servicio
      precio = element.precio;
      impuesto = 0.1; // Impuesto para servicios
    }

    const totalLinea = precio * cantidad * (1 + impuesto);

    // Actualiza el total de línea en el elemento
    element.totalLinea = totalLinea;
  }

  calcularTotal(): void {
    let totalProductos = 0;
    let totalServicios = 0;

    // Sumar el total de línea de todos los productos
    this.productosCarrito.forEach((producto) => {
      totalProductos += producto.totalLinea;
    });

    // Sumar el total de línea de todos los servicios
    this.serviciosCarrito.forEach((servicio) => {
      totalServicios += servicio.totalLinea;
    });

    // Actualizar los totales
    this.totalProductos = totalProductos;
    this.totalServicios = totalServicios;
    this.totalGeneral = totalProductos + totalServicios;
  }

  public errorHandling = (controlName: string) => {
    let messageError = '';
    const control = this.facturaForm.get(controlName);
    if (control.errors) {
      for (const message of FormErrorMessage) {
        if (
          control &&
          control.errors[message.forValidator] &&
          message.forControl == controlName
        ) {
          messageError = message.text;
        }
      }
      return messageError;
    } else {
      return false;
    }
  };

  submitForm(): void {
    this.cartService.getItems().subscribe((cartItems) => {
      // Verificar que el carrito no está vacío
      if (this.isCreate && cartItems.length === 0) {
        this.noti.mensaje(
          'Atención',
          'Debe agregar al menos un detalle de factura',
          TipoMessage.warning
        );
        return;
      }

      const facturaDetalles = cartItems.map((item) => ({
        productoId: item.estado ? item.id : null,
        servicioId: !item.estado ? item.id : null,
        precio: item.precio,
        cantidad: item.cantidad,
        impuesto: parseFloat(item.impuesto.toFixed(2)),
      }));

      // Verificar que hay al menos un detalle de factura
      if (facturaDetalles.length === 0) {
        this.noti.mensaje(
          'Atención',
          'Debe agregar al menos un detalle de factura',
          TipoMessage.warning
        );
        return;
      }

      const formValues = this.facturaForm.value;
      const fechaActual = new Date();
      fechaActual.setDate(fechaActual.getDate() - 1);
      const fechaISO = fechaActual.toISOString();

      // Obtener el rol del currentUser
      const currentUserRole = this.currentUser?.role; // Ajusta esto según cómo obtengas el rol del usuario actual

      const data = {
        ...formValues,
        fecha: fechaISO,
        usuarioId: this.selectedCliente?.id,
        sucursalId:
          currentUserRole === 'Cliente'
            ? this.currentUser?.id
            : this.sucursal?.id,
        total: this.totalGeneral,
        estado: false,
        facturaDetalle: facturaDetalles,
      };

      if (this.isCreate) {
        this.crearFactura(data);
      } else {
        this.actualizarFactura(this.idFactura, data);
      }
    });
  }

  crearFactura(data: any): void {
    this.gService
      .create('factura', data)
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta: any) => {
        this.respFactura = respuesta;
        Swal.fire({
          title: 'La factura ha sido creada con éxito',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        });

        this.detalle(this.respFactura.id);
        this.cartService.deleteCart();
      });
  }

  actualizarFactura(idFactura: number, data: any): void {
    this.gService
      .update('factura', data) // Usa la plantilla literal correctamente
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta: any) => {
        Swal.fire({
          title: 'La factura ha sido actualizada con éxito',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        });

        this.respFactura = respuesta;
        this.detalle(this.respFactura.id);
      });
  }

  detalle(id: number) {
    this.router.navigate(['/factura', id]);
  }

  private showSpinner(): void {
    document.getElementById('loader').className = 'loading';
  }

  private hideSpinner(): void {
    document.getElementById('loader').className = '';
  }

  // Función para mostrar el spinner
  showLoader() {
    this.isLoading = true;
  }

  // Función para ocultar el spinner
  hideLoader() {
    this.isLoading = false;
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

  onReset() {
    // Limpia los valores almacenados en el formulario
    this.facturaForm.reset();
    this.selectedCliente = null;
    this.cartService.deleteCart();

    // Limpia las listas de productos y servicios seleccionados
    this.selectedProductos = [];
    this.selectedServicios = [];

    // Limpia el carrito de productos y servicios
    this.productosCarrito = [];
    this.serviciosCarrito = [];

    // Actualiza los dataSource para reflejar los arrays vacíos
    this.productosDataSource.data = [];
    this.serviciosDataSource.data = [];

    // Restablece los totales a cero
    this.totalProductos = 0;
    this.totalServicios = 0;
    this.totalGeneral = 0;
  }

  //Retrocede a la página anterior
  onBack() {
    this.router.navigate(['/factura-table'], {});
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    // Llama al método para limpiar el carrito cuando el componente es destruido
    if (!this.isCreate) {
      this.cartService.deleteCart();
    }
  }
}
