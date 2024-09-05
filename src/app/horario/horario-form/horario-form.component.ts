import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import {
  NotificacionService,
  TipoMessage,
} from '../../share/notification.service';
import { FormErrorMessage } from '../../form-error-message';
import Inputmask from 'inputmask';

import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DiaSemana } from '../../dias-semana.enum';
import { AuthenticationService } from '../../share/authentication.service';

@Component({
  selector: 'app-horario-form',
  templateUrl: './horario-form.component.html',
  styleUrl: './horario-form.component.css',
})
export class HorarioFormComponent {
  destroy$: Subject<boolean> = new Subject<boolean>();
  titleForm: string = 'Crear';
  horarioForm: FormGroup;
  horarioInfo: any;

  respHorario: any;
  idHorario: number = 0;
  isCreate: boolean = true;
  isAdmin: boolean = false;
  diasList: any;
  sucursalList: any;
  sucursalSelectList: any;
  diasSelectList: any;
  currentUser: any;

  isBlockSchedule = true; // Valor inicial activo
  rangeDates: Date[]; // Define rangeDates como un arreglo de fechas
  // minDate: Date = new Date(); 
  readonly minDate = new Date();

  number4digits = /^\d{4}$/;
  precioFormat: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activeRouter: ActivatedRoute,
    private gService: GenericService,
    private noti: NotificacionService,
    private authService: AuthenticationService
  ) {
    this.chargeUser();
    this.formularioReactive();
    this.listaDias();
    this.listaSucursales();
  }

  ngOnInit(): void {
    this.activeRouter.params.subscribe((params: Params) => {
      this.idHorario = params['id'];

      if (this.idHorario !== undefined) {
        this.isCreate = false;
        this.titleForm = 'Actualizar';
        this.gService
          .get('horario', this.idHorario)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data: any) => {
            this.horarioInfo = data;

            console.log('Formulario: ');
            console.log(this.horarioInfo);

            this.horarioForm.patchValue({
              id: data.id,
              horaInicio: this.convertToHours(data.horaInicio),
              horaFin: this.convertToHours(data.horaFin),
              sucursal: this.horarioInfo.sucursal.map(
                (sucursal: any) => sucursal.sucursalId
              ),
              dias: this.horarioInfo.dias.map(
                (dia: any) => dia.horario.diaSemana
              ),
            });
          });

        console.log('Datos: ');
        console.log(this.horarioForm.value);
      }
    });
    
    this.aplicarMascaras();    
  }

  chargeUser() {
    this.authService.decodeToken.subscribe((decodedToken: any) => {
      // Decodifica y asigna el token al currentUser
      this.currentUser = decodedToken;
  
      // Verifica si currentUser tiene el rol de 'Administrador'
      if (this.currentUser && this.currentUser.rol === 'Administrador') {
        this.isAdmin = true;
      }
    });
  }

  formularioReactive() {
    let regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

    this.horarioForm = this.fb.group({
      id: [null],
      dias: [null, Validators.required],      
      fecha: this.fb.group({
        start: [null, Validators.required],
        end: [null, Validators.required]
      }),
      sucursal: [null, Validators.required],
      horaInicio: [
        null,
        Validators.compose([Validators.required, Validators.pattern(regex)]),
      ],
      horaFin: [
        null,
        Validators.compose([Validators.required, Validators.pattern(regex)]),
      ],
      estado: [true, Validators.required],
    });

        // Suscribirse a los cambios en el grupo de fechas
        this.horarioForm.get('fecha')?.valueChanges.subscribe((val: { start: Date; end: Date }) => {
          this.rangeDates = [val.start, val.end];
        });

  }

  submitHorario(): void {
    if (this.horarioForm.invalid) {
      return;
    }

    let diasForm = this.horarioForm
      .get('dias')
      .value.map((x: any) => ({ ['id']: x }));

    const horarioData = {
      ...this.horarioForm.value,
      horaInicio: this.convertToMinutes(this.horarioForm.value.horaInicio), // Conversión a minutos
      horaFin: this.convertToMinutes(this.horarioForm.value.horaFin), // Conversión a minutos
      estado: this.isBlockSchedule,
      fechas: this.formatDatesArray(this.rangeDates),
      dias: diasForm,
    };

    if (this.isCreate) {
      this.gService
        .create('horario', horarioData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: any) => {
            if (data.error) {
              // Manejar error específico
              const message = data.error;
              this.noti.mensaje(
                `${
                  this.isBlockSchedule
                    ? 'Error al Crear Horario'
                    : 'Error al Crear Bloqueo'
                }`,
                message,
                TipoMessage.error
              );
            } else {
              // Manejar caso exitoso
              const mensaje = horarioData.estado ? 'Común' : 'Bloqueo';
              this.respHorario = data;
              this.noti.mensaje(
                'Crear Horario',
                `Horario creado: ${mensaje}`,
                TipoMessage.success
              );
              this.router.navigate(['/horario-table']);
            }
          },
          error: (err) => {
            // Manejo de error en la llamada HTTP
            const errorMessage =
              err.error?.error || 'Ocurrió un error al crear el horario';
            // Manejo de error en la llamada HTTP
            this.noti.mensaje(
              `${
                this.isBlockSchedule
                  ? 'Error al Crear Horario'
                  : 'Error al Crear Bloqueo'
              }`,
              errorMessage,
              TipoMessage.error
            );
          },
        });
    } else {
      this.gService
        .update('horario', horarioData)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.respHorario = data;
          this.noti.mensaje(
            'Actualizar Horario',
            `Horario actualizado: ${data.estado}`,
            TipoMessage.success
          );
          this.router.navigate(['/horario-table']);
        });
    }
  }  

  //Mascaras para formato hh:mm de los inputs de tiempo
  aplicarMascaras() {
    const inputHoraInicio = document.getElementById('horaInicio');
    const inputHoraFin = document.getElementById('horaFin');

    const maskDuracion = {
      mask: '99:99',
      placeholder: '_',
    };
    Inputmask(maskDuracion).mask(inputHoraInicio);
    Inputmask(maskDuracion).mask(inputHoraFin);
  }


  //Para cargar al comboBox multiple de Dias de la Semana 
  listaDias() {
    this.diasList = Object.keys(DiaSemana).map((key) => ({
      key,
      value: DiaSemana[key as keyof typeof DiaSemana],
    }));
    // console.log(this.diasList);
  }

  //Para cargar al comboBox multiple de Sucursales
  listaSucursales() {
    this.sucursalList = [];
    if (this.isAdmin) {
      this.gService
      .list('sucursal')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.sucursalList = data;
      });
    }else{
      this.gService
        .get('sucursal', this.currentUser.idSucursal)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.sucursalList = [data]; // Asegúrate de que `sucursalList` sea un array
          this.horarioForm.get('sucursal')?.setValue(this.sucursalList[0]?.id || '');
        });
     
    }
    
  }


  onScheduleTypeChange(event: MatSlideToggleChange) {
    this.isBlockSchedule = event.checked;
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

  //Convierte las horas a minutos
  convertToDateTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    return date.toISOString();
  };

  //Convierte las fechas ISO a dd/mm/yyyy
  formatDatesArray(input: Date | Date[]): string | string[] {
    if (Array.isArray(input)) {
      return input.map((date) => new Date(date).toISOString());
    } else {
      return new Date(input).toISOString();
    }
  }

  public errorHandling = (controlName: string): string | false => {
    let messageError = '';
    const control = this.horarioForm.get(controlName);
  
    if (control && control.errors) {
      for (const message of FormErrorMessage) {
        if (
          control.errors[message.forValidator] &&
          message.forControl === controlName
        ) {
          messageError = message.text;
          break; // Sale del bucle una vez que se encuentra el primer error
        }
      }
    }
  
    return messageError || false;
  };
  

  onReset() {
    this.horarioForm.reset();
  }

  onBack() {
    this.router.navigate(['/horario-table']);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
