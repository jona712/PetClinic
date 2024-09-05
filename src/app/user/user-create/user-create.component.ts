import { Component } from '@angular/core';
import { FormErrorMessage } from '../../form-error-message';
import { Subject, takeUntil } from 'rxjs';
import { NotificacionService, TipoMessage } from '../../share/notification.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GenericService } from '../../share/generic.service';
import { AuthenticationService } from '../../share/authentication.service';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.css'
})
export class UserCreateComponent {
  hide = true;
  maxDate: Date;
  minDate: Date;
  usuario: any;
  roles: any;
  formCreate: FormGroup;
  makeSubmit: boolean = false;
  destroy$: Subject<boolean> = new Subject<boolean>();
  constructor(
    public fb: FormBuilder,
    private router: Router,
    private gService: GenericService,
    private authService: AuthenticationService,
    private notificacion: NotificacionService
  ) {
    const today = new Date();
    this.maxDate = today;
    this.minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

    this.reactiveForm();
  }

  reactiveForm() {
    this.formCreate = this.fb.group({
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      telefono: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(/^\d+$/), 
        ]),
      ],
      direccion: ['', [Validators.required]],
      nacimiento: [null, [Validators.required]],
      rol: ['', [Validators.required]],
      estado: true
    });
    this.getRoles();
  }

  ngOnInit(): void {}
  submitForm() {
    this.makeSubmit = true;
    //Validación
    if (this.formCreate.invalid) {
      return;
    }
    //Crear usuario
    this.authService.createUser(this.formCreate.value)
    .subscribe((respuesta:any)=>{
      this.notificacion.mensaje(
        'Registrar usuario',
        'Usuario Creado',
        TipoMessage.success
      )
      this.router.navigate(['/usuario/login'])
    })
  }
  onReset() {
    this.formCreate.reset();
  }
  getRoles() {
    this.gService
      .list('rol')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.roles = data;
        console.log(this.roles);
      });
  }
  /* Manejar errores de formulario en Angular */

  public errorHandling = (controlName: string) => {
    let messageError = '';
    const control = this.formCreate.get(controlName);
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
}
