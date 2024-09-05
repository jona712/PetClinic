import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { HttpResponse } from '@angular/common/http';
import {
  NotificacionService,
  TipoMessage,
} from '../../share/notification.service';
import { FileUploadService } from '../../share/file-upload.service';
import { FormErrorMessage } from '../../form-error-message';

@Component({
  selector: 'app-producto-form',
  templateUrl: './producto-form.component.html',
  styleUrls: ['./producto-form.component.css'],
})
export class ProductoFormComponent implements OnInit {
  destroy$: Subject<boolean> = new Subject<boolean>();
  //Titulo
  titleForm: string = 'Crear';
  //Lista de generos
  categoriasList: any;
  //Producto a actualizar
  productoInfo: any;
  //Respuesta del API crear/modificar
  respProducto: any;
  //Nombre del formulario
  productoForm: FormGroup;
  //id del Producto
  idProducto: number = 0;
  //Sí es crear
  isCreate: boolean = true;
  number4digits = /^\d{4}$/;
  precioFormat: string = '';

  //Imagenes
  currentFile?: File;
  message = '';
  preview = '';
  nameImage = 'image-not-found.jpg';
  imageInfos?: Observable<any>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activeRouter: ActivatedRoute,
    private gService: GenericService,
    private noti: NotificacionService,
    private uploadService: FileUploadService
  ) {
    this.formularioReactive();
    this.listaCategorias();
  }

  ngOnInit(): void {
    // Verificar si se envió un id por parámetro para crear formulario para actualizar
    this.activeRouter.params.subscribe((params: Params) => {
      this.idProducto = params['id'];
      if (this.idProducto != undefined) {
        // Actualizar
        this.isCreate = false;
        this.titleForm = 'Actualizar';
        // Obtener el producto del API que se va actualizar
        this.gService
          .get('producto', this.idProducto)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data: any) => {
            console.log(data);
            this.productoInfo = data;

            // Asignar valores al formulario
            this.productoForm.patchValue({
              id: this.productoInfo.id,
              nombre: this.productoInfo.nombre,
              descripcion: this.productoInfo.descripcion,
              ingrediente: this.productoInfo.ingrediente,
              especificacion: this.productoInfo.especificacion,
              imagen: this.productoInfo.imagen,
              precio_producto: this.formatoPrecio(this.productoInfo.precio),
              estado: this.productoInfo.estado,
              categoriaId: this.productoInfo.categoria.id, // Asignar solo el ID de la categoría
            });
            this.nameImage = this.productoInfo.imagen;
            // Armar los datos a mostrar en el formulario
          });
      }
    });
  }

  //Crear Formulario
  formularioReactive() {
    this.productoForm = this.fb.group({
      id: [null],
      nombre: [
        null,
        Validators.compose([Validators.required, Validators.minLength(2)]),
      ],
      descripcion: [null, Validators.required],
      precio_producto: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern(/^\d{1,3}(,\d{3})*(\.\d{1,3})?$/),
        ]),
      ],
      imagen: [this.nameImage, Validators.required],
      ingrediente: [null, Validators.required],
      especificacion: [null, Validators.required],
      categoriaId: [null, Validators.required],
      estado: [true, Validators.required],
    });
  }

  listaCategorias() {
    this.categoriasList = null;
    this.gService
      .list('categoria')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        console.log(data);
        this.categoriasList = data;
      });
  }

  public errorHandling = (controlName: string) => {
    let messageError = '';
    const control = this.productoForm.get(controlName);
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

  submitProducto(): void {
    if (this.productoForm.invalid) {
      return;
    }

    console.log(this.productoForm.value);
    //Subir imagen
    if (this.upload()) {
      this.noti.mensaje(
        'Crear Producto',
        'Imagen guardada',
        TipoMessage.success
      );
    }

    const productoData = {
      ...this.productoForm.value,
      precio: this.acoplarPrecio(this.productoForm.value.precio_producto),
      imagen: this.nameImage,
    };

    console.log(this.productoForm.value);

    if (this.isCreate) {
      this.gService
        .create('producto', productoData)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.respProducto = data;
          this.noti.mensaje(
            'Crear Producto',
            `Producto creado: ${data.descripcion}`,
            TipoMessage.success
          );
          this.router.navigate(['/producto-table']);
        });
    } else {
      this.gService
        .update('producto', productoData)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.respProducto = data;
          this.noti.mensaje(
            'Actualizar Producto',
            `Producto actualizado: ${data.descripcion}`,
            TipoMessage.success
          );
          this.router.navigate(['/producto-table']);
        });
    }
  }

  selectFile(event: any): void {
    let label = document.getElementById('selectFile');
    let imagePreview = document.getElementById(
      'image-preview'
    ) as HTMLImageElement;
    this.message = '';
    this.preview = '';
    const selectedFiles = event.target.files;

    if (selectedFiles) {
      const file: File | null = selectedFiles.item(0);

      if (file) {
        this.preview = '';
        this.currentFile = file;
        this.nameImage = this.currentFile.name;
        label.innerHTML = this.currentFile.name;
        const reader = new FileReader();

        reader.onload = (e: any) => {
          console.log(e.target.result);
          this.preview = e.target.result;
          imagePreview.src = this.preview; // Actualiza el src del img
        };

        reader.readAsDataURL(this.currentFile);
      }
    }
  }

  upload(): boolean {
    if (this.currentFile) {
      this.uploadService.upload(this.currentFile).subscribe({
        next: (event: any) => {
          if (event instanceof HttpResponse) {
            this.message = event.body.message;
            this.imageInfos = this.uploadService.getFiles();
          }
          return true;
        },
        error: (err: any) => {
          console.log(err);

          if (err.error && err.error.message) {
            this.message = err.error.message;
          } else {
            this.message = '¡No se pudo subir la imagen!';
            this.noti.mensajeRedirect(
              'Foto',
              this.message,
              TipoMessage.warning,
              'producto-table'
            );
          }
          return false;
        },
        complete: () => {
          this.currentFile = undefined;
        },
      });
    }
    return false;
  }

  onReset() {
    this.productoForm.reset();
    document.getElementById('selectFile').innerHTML = 'Seleccionar archivo';
    let imagePreview = document.getElementById(
      'image-preview'
    ) as HTMLImageElement;
    imagePreview.src = ''; // Limpia la vista previa de la imagen
  }

  onBack() {
    this.router.navigate(['/producto-table']);
  }
  ngOnDestroy() {
    this.destroy$.next(true);
    // Desinscribirse
    this.destroy$.unsubscribe();
  }

  //Quita el formato ##,### y lo convierte a un formato sin comas ###
  acoplarPrecio(price: string): number {
    // Elimina las comas y convierte la cadena a número
    return Number(price.replace(/,/g, ''));
  }

  //
  formatoPrecio(price: string): string {
    // Eliminar cualquier coma existente para evitar duplicados
    price = price.replace(/,/g, '');

    // Obtener la parte entera y la parte decimal
    const parts = price.split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1] ? '.' + parts[1] : '';

    // Agregar comas cada tres dígitos en la parte entera
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Reconstruir el número con el formato aplicado
    return integerPart + decimalPart;
  }

  //
  formatoConComas(event: any): void {
    let valor = event.target.value.replace(/,/g, ''); // Elimina comas existentes
    const partes = valor.toString().split('.'); // Divide en parte entera y parte decimal
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Aplica formato con comas

    // Actualiza el valor en el formulario
    this.productoForm.get('precio_producto').setValue(partes.join('.'));
  }

  onKeyDown(event: KeyboardEvent) {
    // Obtener el código de caracter (charCode) y el código de la tecla (keyCode)
    const charCode = event.charCode || event.which;
    const keyCode = event.keyCode || event.which;

    // Permitir números (48-57), el carácter ':' (58), backspace (8) y TAB (9)
    if (
      !(charCode >= 48 && charCode <= 57) &&
      charCode !== 58 &&
      keyCode !== 8 &&
      keyCode !== 9 // TAB
    ) {
      event.preventDefault();
    }
  }
}
