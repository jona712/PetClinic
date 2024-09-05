import { Component, ViewChild, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2'; // Asegúrate de tener SweetAlert2 instalado para notificaciones
import {
  NotificacionService,
  TipoMessage,
} from '../../share/notification.service';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../share/authentication.service';

@Component({
  selector: 'app-factura-detail',
  templateUrl: './factura-detail.component.html',
  styleUrls: ['./factura-detail.component.css'],
})
export class FacturaDetailComponent implements OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSourceProductos = new MatTableDataSource<any>();
  dataSourceServicios = new MatTableDataSource<any>();

  displayedColumnsProductos: string[] = [
    'id',
    'Producto',
    'Precio',
    'Cantidad',
    'Impuesto',
    'Subtotal',
  ];
  displayedColumnsServicios: string[] = [
    'id',
    'Servicio',
    'Precio',
    'Cantidad',
    'Impuesto',
    'Subtotal',
  ];

  datos: any;
  destroy$: Subject<boolean> = new Subject<boolean>();

  mostrarProductos = false;
  mostrarServicios = false;

  isChecked = false;
  idFactura = 0;
  factura: any;

  // Datos simulados del usuario actual
  currentUser: any;

  constructor(
    private gService: GenericService,
    private route: ActivatedRoute,
    private router: Router,
    private noti: NotificacionService,
    private http: HttpClient, // Inyección de HttpClient,
    private authService: AuthenticationService
  ) {
    let id = this.route.snapshot.paramMap.get('id');
    if (!isNaN(Number(id))) this.obtenerFactura(Number(id));
  }

  ngOnInit(): void {
    this.authService.chargeUser(); // Carga el usuario
    this.currentUser = this.authService.currentUser; // Asigna el usuario cargado a la variable local
    console.log(this.authService.currentUser);
  }

  obtenerFactura(id: any) {
    this.gService
      .get('factura', id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        console.log(data);
        this.datos = data;
        this.idFactura = data.id;
        this.factura = data;
        this.dataSourceProductos.data = this.datos.FacturaDetalle.filter(
          (detalle: any) => detalle.producto
        );
        this.dataSourceServicios.data = this.datos.FacturaDetalle.filter(
          (detalle: any) => detalle.servicio
        );
      });
  }

  calcularSubtotal(detalle: any): number {
    const precio = parseFloat(detalle.precio.replace('₡', '').replace(',', ''));
    const cantidad = detalle.cantidad;
    const impuesto = parseFloat(detalle.impuesto);

    // Calcula el subtotal sin impuesto
    const subtotalSinImpuesto = precio * cantidad;

    // Calcula el impuesto sobre el subtotal
    const impuestoMonto = subtotalSinImpuesto * (impuesto / 100);

    // Calcula el subtotal total
    const subtotalTotal = subtotalSinImpuesto + impuestoMonto;

    return subtotalTotal;
  }

  calcularTotal(detalles: any[]): number {
    // Inicializa el total en 0
    let total = 0;

    // Recorre los detalles de la factura
    for (const detalle of detalles) {
      // Verifica si el detalle tiene un producto o un servicio
      if (detalle.producto || detalle.servicio) {
        total += this.calcularSubtotal(detalle);
      }
    }

    return total;
  }

  confirmarSeleccion() {
    if (this.isChecked) {
      console.log('Checkbox está seleccionado. Confirmar la acción.');

      const statusUpdate = {
        id: this.idFactura,
        estado: true,
      };

      this.gService
        .update('factura/updateStatus', statusUpdate)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response: any) => {
            Swal.fire({
              title: 'Factura actualizada correctamente!',
              icon: 'success',
              showConfirmButton: true,
              timer: 2000,
              timerProgressBar: true,
            });

            // Genera y sube el PDF
            this.generatePDF();

            // Enviar el correo después de subir el PDF
            setTimeout(() => {
              this.enviarFacturaEmail();
            }, 3000); // Ajusta el tiempo según sea necesario para asegurar que el PDF se haya subido

            this.close();
          },
          (error: any) => {
            console.error('Error al actualizar la factura:', error);
          }
        );
    } else {
      this.noti.mensaje(
        'Atención',
        'No se ha seleccionado el confirmar',
        TipoMessage.error
      );
    }
  }

  // Método para enviar la factura por correo
  enviarFacturaEmail() {
    const emailData = {
      facturaId: this.idFactura,
    };

    this.http
      .post('http://localhost.com/email/enviar-factura', emailData)
      .subscribe(
        (response) => {
          console.log('Correo de factura enviado correctamente:', response);
        },
        (error) => {
          console.error('Error al enviar el correo de factura:', error);
        }
      );
  }

  actualizarProforma(id: number) {
    this.router.navigate(['/factura/update', id], {
      relativeTo: this.route,
    });
  }

  generatePDF() {
    // Activa el toggle de productos y servicios
    this.toggleProductos();
    this.toggleServicios();

    // Despliega las pestañas primero
    this.toggleCheck();

    // Usa setTimeout para asegurar que el DOM se actualice antes de generar el PDF
    setTimeout(() => {
      const content = document.querySelector('.home-card') as HTMLElement;

      if (content) {
        html2canvas(content, {
          scale: 2, // Mejora la resolución de la imagen capturada
        }).then((canvas) => {
          const imgData = canvas.toDataURL('image/png');

          // Configura el PDF
          const pdf = new jsPDF({
            orientation: 'p', // 'p' para vertical, 'l' para horizontal
            unit: 'mm',
            format: 'a4', // Formato A4 en milímetros
          });

          // Calcula el tamaño de la imagen para ajustarla al tamaño de la página
          const pdfWidth = 190; // Ancho máximo en mm
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // Calcula la altura para mantener la proporción

          // Agrega la imagen al PDF
          pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);

          // Guarda el PDF con el nombre de la factura
          if (this.factura.estado) pdf.save(`Factura #${this.idFactura}.pdf`);
          else pdf.save(`Proforma #${this.idFactura}.pdf`);
        });
      } else {
        console.error('No se encontró el contenido para generar el PDF');
      }
    }, 300); // Ajusta el tiempo si es necesario
  }

  toggleCheck() {
    this.isChecked = !this.isChecked;
  }

  toggleProductos() {
    this.mostrarProductos = !this.mostrarProductos;
  }

  toggleServicios() {
    this.mostrarServicios = !this.mostrarServicios;
  }

  detalle(id: number) {
    this.router.navigate(['/factura', id]);
  }

  close() {
    this.router.navigate(['/factura-table']);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
