import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GenericService } from '../../share/generic.service';
import {
  NotificacionService,
  TipoMessage,
} from '../../share/notification.service';
import { FormErrorMessage } from '../../form-error-message';

@Component({
  selector: 'app-sucursal-form',
  templateUrl: './sucursal-form.component.html',
  styleUrls: ['./sucursal-form.component.css'],
})
export class SucursalFormComponent implements OnInit {
  destroy$: Subject<boolean> = new Subject<boolean>();
  titleForm: string = 'Crear';
  encargadosList: any;
  encargadosDisponiblesList: any; // Lista para encargados disponibles
  sucursalInfo: any;
  respSucursal: any;
  sucursalForm: FormGroup;
  idSucursal: number = 0;
  isCreate: boolean = true;

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
      this.idSucursal = params['id'];
      if (this.idSucursal != undefined) {
        this.isCreate = false;
        this.titleForm = 'Actualizar';
        this.gService
          .get('sucursal', this.idSucursal)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data: any) => {
            this.sucursalInfo = data;
            this.encargadosList = data.encargados;

            this.sucursalForm.patchValue({
              id: this.sucursalInfo.id,
              nombre: this.sucursalInfo.nombre,
              descripcion: this.sucursalInfo.descripcion,
              telefono: this.sucursalInfo.telefono,
              direccion: this.sucursalInfo.direccion,
              correo: this.sucursalInfo.correo,
              encargados: this.sucursalInfo.encargados.map(
                (encargado: any) => encargado.id
              ),
            });
          });
      }
    });

    // Obtener encargados disponibles
    this.getEncargadosDisponibles();
  }

  formularioReactive() {
    this.sucursalForm = this.fb.group({
      id: [null],
      nombre: [
        null,
        Validators.compose([Validators.required, Validators.minLength(2)]),
      ],
      descripcion: [null, Validators.required],
      telefono: [null, Validators.required],
      direccion: [null, Validators.required],
      correo: [null, Validators.required],
      encargados: [null],
      encargadosDisponibles: [null],
    });
  }

  getEncargadosDisponibles() {
    this.gService
      .list('usuario/getEncargadosDisponibles')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.encargadosDisponiblesList = data;
      });
  }

  public errorHandling = (controlName: string) => {
    let messageError = '';
    const control = this.sucursalForm.get(controlName);
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

  submitSucursal(): void {
    if (this.sucursalForm.invalid) {
      return;
    }
  
    const sucursalData = {
      ...this.sucursalForm.value,
      estado: true,
    };
  
    if (this.isCreate) {
      this.gService
        .create('sucursal', sucursalData)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.respSucursal = data;
  
          // Actualizar encargados disponibles
          this.updateEncargadosDisponibles(data.id);
  
          this.noti.mensaje(
            'Crear Sucursal',
            `Sucursal creada: ${data.descripcion}`,
            TipoMessage.success
          );
          
          // Espera 5 segundos (5000 milisegundos) antes de ejecutar el navigate
          setTimeout(() => {
            this.router.navigate(['/sucursal-table']);
          }, 1000);
          
        });
    } else {
      this.gService
        .update('sucursal', sucursalData)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.respSucursal = data;
  
          // Actualizar encargados disponibles
          this.updateEncargadosDisponibles(data.id);
  
          // Eliminar encargados no seleccionados
          this.removeUnselectedEncargados();
  
          this.noti.mensaje(
            'Actualizar Sucursal',
            `Sucursal actualizada: ${data.descripcion}`,
            TipoMessage.success
          );
          // Espera 5 segundos (5000 milisegundos) antes de ejecutar el navigate
          setTimeout(() => {
            this.router.navigate(['/sucursal-table']);
          }, 1000);
        });
    }
  }
  
  private updateEncargadosDisponibles(sucursalId: number): void {
    const selectedEncargadosIds = this.sucursalForm.get('encargadosDisponibles')?.value;
  
    if (selectedEncargadosIds && selectedEncargadosIds.length > 0) {
      selectedEncargadosIds.forEach((id: number) => {
        this.gService
          .update('usuario', { id, SucursalId: sucursalId })
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            console.log(`Encargado con ID ${id} actualizado con SucursalId ${sucursalId}`);
          });
      });
    } else {
      console.log('No se seleccionaron encargados disponibles.');
    }
  }
  
  private removeUnselectedEncargados(): void {
    const selectedEncargadosIds = this.sucursalForm.get('encargados')?.value || [];
    const encargadosActualesIds = this.encargadosList.map(enc => enc.id);
  
    const encargadosParaEliminar = encargadosActualesIds.filter(id => !selectedEncargadosIds.includes(id));
  
    if (encargadosParaEliminar.length > 0) {
      encargadosParaEliminar.forEach((id: number) => {
        this.gService
          .update('usuario', { id, SucursalId: null })
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            console.log(`Encargado con ID ${id} actualizado con SucursalId null`);
          });
      });
    } else {
      console.log('No hay encargados para eliminar.');
    }
  }


  onReset() {
    this.sucursalForm.reset();
  }

  onBack() {
    this.router.navigate(['/sucursal-table']);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
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
