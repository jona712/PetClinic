import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import {
  NotificacionService,
  TipoMessage,
} from '../../share/notification.service';
import { FormErrorMessage } from '../../form-error-message';
import Inputmask from 'inputmask';

@Component({
  selector: 'app-servicio-form',
  templateUrl: './servicio-form.component.html',
  styleUrl: './servicio-form.component.css',
})
export class ServicioFormComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  titleForm: string = 'Crear';
  servicioForm: FormGroup;
  respServicio: any;
  idServicio: number = 0;
  isCreate: boolean = true;

  number4digits = /^\d{4}$/;
  precioFormat: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activeRouter: ActivatedRoute,
    private gService: GenericService,
    private noti: NotificacionService
  ) {
    this.formularioReactive();
  }

  ngOnInit(): void {
    this.activeRouter.params.subscribe((params: Params) => {
      this.idServicio = params['id'];
      if (this.idServicio !== undefined) {
        this.isCreate = false;
        this.titleForm = 'Actualizar';
        this.gService
          .get('servicio', this.idServicio)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data: any) => {
            this.servicioForm.patchValue({
              id: data.id,
              descripcion: data.descripcion,
              precio: this.formatoPrecio(data.precio),
              duracion: this.convertToHours(data.duracion),
              beneficio: data.beneficio,
              requerimiento: data.requerimiento,
              estado: data.estado,
            });
          });
      }
    });

    this.aplicarMascaras();
  }

  aplicarMascaras() {
    const inputDuracion = document.getElementById('duracion');
    const maskDuracion = {
      mask: '99:99',
      placeholder: '_',
    };
    Inputmask(maskDuracion).mask(inputDuracion);
  }

  formularioReactive() {
    let regex = /^([0-9]+):([0-5][0-9])$/;
    this.servicioForm = this.fb.group({
      id: [null],
      descripcion: [null, Validators.required],
      precio: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern(/^\d{1,3}(,\d{3})*(\.\d{1,3})?$/),
        ]),
      ],
      duracion: [
        null,
        Validators.compose([Validators.required, Validators.pattern(regex)]),
      ],
      beneficio: [null, Validators.required],
      requerimiento: [null, Validators.required],
      estado: [true, Validators.required],
    });
  }

  public errorHandling = (controlName: string) => {
    let messageError = '';
    const control = this.servicioForm.get(controlName);
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

  submitServicio(): void {
    if (this.servicioForm.invalid) {
      return;
    }
    const servicioData = {
      ...this.servicioForm.value,
      duracion: this.convertToMinutes(this.servicioForm.value.duracion), // Conversión a minutos
      precio: this.acoplarPrecio(this.servicioForm.value.precio),
    };

    console.log('Duración en minutos:', servicioData);

    if (this.isCreate) {
      this.gService
        .create('servicio', servicioData)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.respServicio = data;
          this.noti.mensaje(
            'Crear Servicio',
            `Servicio creado: ${data.descripcion}`,
            TipoMessage.success
          );
          this.router.navigate(['/servicio-table']);
        });
    } else {
      this.gService
        .update('servicio', servicioData)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.respServicio = data;
          this.noti.mensaje(
            'Actualizar Servicio',
            `Servicio actualizado: ${data.descripcion}`,
            TipoMessage.success
          );
          this.router.navigate(['/servicio-table']);
        });
    }
  }

  onReset() {
    this.servicioForm.reset();
  }
  onBack() {
    this.router.navigate(['/servicio-table']);
  }

  //Convierte las horas a minutos para ser guardadas en la BD
  convertToMinutes(duration: string): string {
    const [hours, minutes] = duration.split(':').map(Number);
    return (hours * 60 + minutes).toString();
  }

  //Convierte los minutos a horas para ser mostradas en la interfaz
  convertToHours(minutes: number): string {
    if (isNaN(minutes)) {
      console.error('El valor de minutos no es un número:', minutes);
      return '00:00';
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes
      .toString()
      .padStart(2, '0')}`;
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
    this.servicioForm.get('precio').setValue(partes.join('.'));
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
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
