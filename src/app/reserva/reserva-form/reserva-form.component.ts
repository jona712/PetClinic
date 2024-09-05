import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  NotificacionService,
  TipoMessage,
} from '../../share/notification.service';
import Inputmask from 'inputmask';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { GenericService } from '../../share/generic.service';
import { FormErrorMessage } from '../../form-error-message';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { AuthenticationService } from '../../share/authentication.service';
import { jwtDecode } from 'jwt-decode'; 

@Component({
  selector: 'app-reserva-form',
  templateUrl: './reserva-form.component.html',
  styleUrl: './reserva-form.component.css',
})
export class ReservaFormComponent {
  destroy$: Subject<boolean> = new Subject<boolean>();
  titleForm: string = 'Crear';
  reservaForm: FormGroup;
  reservaInfo: any;

  // Datos simulados del usuario actual  
  currentUser: any;

  sucursal: any;

  listServicios: any;
  listClientes: any;

  selectedCliente: any;
  selectedServicio: any;

  estadoReserva: any;

  formattedDuracion: string = ''; // Para almacenar la duración formateada
  respReserva: any;
  idReserva: number = 0;
  isCreate: boolean = true;

  minDate: Date;
  sucursalHorarioData: any[] = [];
  allowedDates: Date[] = [];

  // Variables para almacenar los rangos extraídos
  rangosPermitidos: { start: string; end: string }[] = [];
  rangosBloqueos: { start: string; end: string }[] = []; 

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activeRouter: ActivatedRoute,
    private gService: GenericService,
    private noti: NotificacionService,
    private authService: AuthenticationService
  ) {
    this.formularioReactive();
  }

  ngOnInit(): void {
    this.activeRouter.params.subscribe((params: Params) => {
      this.idReserva = params['id'];

      console.log('Id de Reserva:' + this.idReserva);

      if (this.idReserva !== undefined) {
        this.isCreate = false;
        this.titleForm = 'Actualizar';
        this.gService
          .get('reserva', this.idReserva)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data: any) => {
            this.reservaInfo = data;

            console.log('Formulario: ');
            console.log(this.reservaInfo);

            this.reservaForm.patchValue({
              id: data.id,
              horaInicio: this.convertToHours(data.horaInicio),
              horaFin: this.convertToHours(data.horaFin),
              sucursal: this.reservaInfo.sucursal.map(
                (sucursal: any) => sucursal.sucursalId
              ),
              dias: this.reservaInfo.dias.map(
                (dia: any) => dia.reserva.diaSemana
              ),
            });
          });

        console.log('Datos: ');
        console.log(this.reservaForm.value);
      }

      // this.authService.chargeUser(); // Carga el usuario
      this.currentUser = this.authService.currentUser; // Asigna el usuario cargado a la variable local
    });

    this.minDate = new Date(); // Fecha mínima es hoy
    this.aplicarMascaras();
    this.getSucursal();
    this.getServicios();
    this.getClientes();
    this.getFechasDisponibles();
    this.getEstado();
  }

  formularioReactive() {
    let regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

    this.reservaForm = this.fb.group({
      id: [null],
      sucursal: [null, Validators.required],
      descripcion: [null, Validators.required],

      //No son necesarios para enviarlos al controller, pero si para resetear los valores
      telefono: [null],
      correo: [null],
      duracion: [{ value: '', disabled: false }],
      //---------------------------------------------------//

      habitos: [null, Validators.required],
      historial: [null, Validators.required],
      razon: [null, Validators.required],
      
      fecha: [null, Validators.required],
      servicio: [null, Validators.required],
      cliente: [null, Validators.required],

      horaInicio: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern(regex),
          this.horaInicioValidator(this.rangosPermitidos, this.rangosBloqueos),
        ]),
      ],
      estado: [{ value: this.estadoReserva, disabled: false }],
    });
  }

  //Mascaras para formato hh:mm de los inputs de tiempo
  aplicarMascaras() {
    const inputHoraInicio = document.getElementById('horaInicio');

    const maskDuracion = {
      mask: '99:99',
      placeholder: '_',
    };
    Inputmask(maskDuracion).mask(inputHoraInicio);
  }

  //Se utiliza en el datePicker para bloquear los dias en los que no
  //se encuentra ningun registro de horarios
  dateFilter = (date: Date | null): boolean => {
    if (!date) {
      return false;
    }
    return this.allowedDates.some(
      (allowedDate) =>
        allowedDate.getFullYear() === date.getFullYear() &&
        allowedDate.getMonth() === date.getMonth() &&
        allowedDate.getDate() === date.getDate()
    );
  };

  //Obtiene la sucursal a la que pertenece el usuario conectado
  getSucursal() {
    this.gService
      .get('sucursal', this.currentUser.idSucursal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.sucursal = data;
        // Actualiza el valor de sucursal en el formulario
      this.reservaForm.get('sucursal')?.setValue(this.sucursal, { emitEvent: false });
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

  //Obtiene todos los usuarios con rol = cliente
  getClientes() {
    this.gService
      .list('usuario/getClientes')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.listClientes = data;
      });
  }

  getEstado(){
    this.gService
    .list('estado')
    .pipe(takeUntil(this.destroy$))
    .subscribe((data: any) => {      
      this.estadoReserva = data.find(
        (item: any) => item.descripcion === 'Pendiente'
      );;
    });    
  }

  //Define las fechas en las que existe un horario, para ser enviadas al datePicker
  getFechasDisponibles() {
    this.gService
      .get('sucursalHorario', this.currentUser.idSucursal)
      .subscribe((data: any) => {
        this.allowedDates = data.map(
          (item: any) => new Date(item.horario.fecha)
        );

        this.sucursalHorarioData = data.map((item) => ({
          ...item,
          horario: {
            ...item.horario,
            horaInicio: this.convertToHours(item.horario.horaInicio),
            horaFin: this.convertToHours(item.horario.horaFin), 
          },
        }));
      });
  }

  // Validador personalizado para horaInicio
  horaInicioValidator( rangosPermitidos: { start: string; end: string }[],rangosBloqueo: { start: string; end: string }[]):
   ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) {
        return null; // No valida si el campo está vacío
      }

      const horaInicio = this.convertToMinutes(control.value);

      const enRangoPermitido = rangosPermitidos.some(
        (rango) =>
          horaInicio >= this.convertToMinutes(rango.start) &&
          horaInicio <= this.convertToMinutes(rango.end)
      );

      const enRangoBloqueo = rangosBloqueo.some(
        (rango) =>
          horaInicio >= this.convertToMinutes(rango.start) &&
          horaInicio <= this.convertToMinutes(rango.end)
      );

      if (enRangoPermitido && !enRangoBloqueo) {
        return null; // Valor válido
      } else {
        return { horaInicioInvalid: true }; // Valor inválido
      }
    };
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

  //Evento que se utiliza para mostrar los detalles de los horarios y bloqueos en una fecha específica
  onDateChange(event: any): void {
    const selectedDate = event.value;

    console.log("Fecha seleccionada:", selectedDate);

    // Limpiar los rangos antes de agregar los nuevos valores
    this.rangosPermitidos = [];
    this.rangosBloqueos = [];

    // Encuentra los horarios y bloqueos para la fecha seleccionada
    const availableSchedules = this.sucursalHorarioData.filter(
      (item: any) =>
        new Date(item.horario.fecha).toDateString() ===
        selectedDate.toDateString()
    );

    // Mensaje a mostrar
    let messageHorarios = '';
    let messageBloqueos = '';
    let bloqueos = false;
    let comun = false;

    availableSchedules.forEach((item: any) => {
      const startHour = item.horario.horaInicio;
      const endHour = item.horario.horaFin;
      if (item.horario.tipoHorario) {
        this.rangosPermitidos.push({ start: startHour, end: endHour });
        messageHorarios += `${startHour} a ${endHour}\n`;
        comun = true;
      } else {
        this.rangosBloqueos.push({ start: startHour, end: endHour });
        messageBloqueos += `${startHour} a ${endHour}\n`;
        bloqueos = true;
      }
    });

    // Mostrar notificaciones separadas si hay mensajes
    if (comun) {
      this.noti.permanentMessage(
        'Horario',
        `Horarios de:\n${messageHorarios}`,
        TipoMessage.success
      );
    }

    if (bloqueos) {
      this.noti.permanentMessage(
        'Bloqueo',
        `Bloqueos de:\n${messageBloqueos}`,
        TipoMessage.warning
      );
    }

    // Reaplicar validaciones 
  this.reservaForm.get('horaInicio')?.setValidators(
    Validators.compose([
      Validators.required,
      Validators.pattern(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/),
      this.horaInicioValidator(this.rangosPermitidos, this.rangosBloqueos)
    ])
  );
  this.reservaForm.get('horaInicio')?.updateValueAndValidity();
  this.reservaForm.get('horaInicio').reset();

  }

  onServicioChange(servicioId: string) {
    this.gService
      .get('servicio', servicioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.selectedServicio = data;
        //this.duracionServicio = data.duracion;
        this.formattedDuracion = this.formatDuracion(data.duracion);
      });    
  }
  

  //Da formato a la duración del servicio
  formatDuracion(duracion: number): string {
    if (duracion < 60) {
      return `${duracion} minutos`;
    } else {
      const horas = Math.floor(duracion / 60);
      const minutos = duracion % 60;
      const horasText = horas === 1 ? '1 hora' : `${horas} horas`;
      const minutosText = minutos === 1 ? '1 minuto' : `${minutos} minutos`;

      if (minutos === 0) {
        return horasText;
      } else {
        return `${horasText} y ${minutosText}`;
      }
    }
  }

  public errorHandling = (controlName: string) => {
    let messageError = '';
    const control = this.reservaForm.get(controlName);
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

  submitReserva(): void {
 
    if (this.reservaForm.invalid) {
      // Recorre todos los controles del formulario
      Object.keys(this.reservaForm.controls).forEach(field => {
        const control = this.reservaForm.get(field);
        // Si el control es inválido, imprime los errores
        if (control && control.invalid) {
          console.error(`Error en el campo: ${field}`);
          const errors = control.errors;
          if (errors) {
            Object.keys(errors).forEach(errorKey => {
              console.error(`  ${errorKey}: ${errors[errorKey]}`);
            });
          }
        }
      });
      return;
    }
    
    const reservaData = {
      ...this.reservaForm.value,
      horaInicio: this.convertToMinutes(this.reservaForm.value.horaInicio), // Conversión a minutos  
      estado: this.estadoReserva    
    };

    // console.log(reservaData);
    // return;

    const facturaData = {
      fecha: this.minDate, 
      usuarioId: reservaData.cliente,
      sucursalId: this.sucursal.id,
      //total: this.cartService.calculoTotal(),
      estado: false, //False ya que es proforma
      total: this.selectedServicio.precio * (1 + 0.1), // Precio más el impuesto
      facturaDetalle: [
        {
          servicioId: reservaData.servicio, // ID del servicio desde la reserva
          precio: this.selectedServicio.precio, // Precio del servicio
          cantidad: 1, //Solo es un servicio
          impuesto: 0.1, 
        },
      ],      
    };

    // console.log(facturaData);
    // return;

    //Suma de la hora de la reserva + el tiempo que toma el servicio seleccionado    
    const tiempoEstimado = parseInt(reservaData.horaInicio) + parseInt(this.selectedServicio.duracion);

     // Verificar si el tiempo estimado de finalización se encuentra dentro de los rangos permitidos
    const enRangoPermitido = this.rangosPermitidos.some(rango => {
      const start = this.convertToMinutes(rango.start);
      const end = parseInt(this.convertToMinutes(rango.end));
      return reservaData.horaInicio >= start && tiempoEstimado <= end;
    });

    if (!enRangoPermitido) {
      this.noti.mensaje(
        'Atención',
        'El tiempo del servicio sobrepasa el horario establecido o no está en los rangos permitidos',
        TipoMessage.error
      );
      return;
    }
    
    if (this.isCreate) {
      this.gService
        .create('reserva', reservaData)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.respReserva = data;
          this.noti.mensaje(
            'Reserva',
            'Reserva creada',
            TipoMessage.success
          );
          //this.router.navigate(['/reserva-table'], { queryParams: { context: 'processes' } });
        });

        //Llamado al servicio para crear la factura proforma
        
        this.gService
        .create('factura', facturaData)
        .pipe(takeUntil(this.destroy$))
        .subscribe((factura: any) => {
            this.noti.mensaje(
              'Factura',
              'Proforma registrada',
              TipoMessage.success
            );
            this.router.navigate(['/reserva-table'], { queryParams: { context: 'processes' } });
          }
        );
      
    } else {
      this.gService
        .update('reserva', reservaData)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.respReserva = data;
          this.noti.mensaje(
            'Actualización de Reserva',
            `Reserva actualizada: ${data.descripcion}`,
            TipoMessage.success
          );
          //this.router.navigate(['/reserva-table']);
        });
    }
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

  //Limpia los valores almacenados en el form
  onReset() {
    this.reservaForm.reset();
  }

  //Retrocede a la página anterior
  onBack() {    
    this.router.navigate(['/reserva-table'], { queryParams: { context: 'processes' } });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
