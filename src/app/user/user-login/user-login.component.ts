import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../share/authentication.service';
import { NotificacionService, TipoMessage } from '../../share/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormErrorMessage } from '../../form-error-message';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrl: './user-login.component.css'
})
export class UserLoginComponent implements OnInit {
  hide=true;
  formulario: FormGroup;
  makeSubmit: boolean = false;
  infoUsuario: any;
  constructor(
    public fb: FormBuilder,
    private authService: AuthenticationService,
    private notificacion: NotificacionService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.reactiveForm();
  }
  // Definir el formulario con su reglas de validación
  reactiveForm() {
    this.formulario = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }
  ngOnInit(): void {
   
  }

  onReset() {
    this.formulario.reset();
  } 
  submitForm() {
    this.makeSubmit=true;
    //Validación
    if(this.formulario.invalid){      
     return;
    }
    //Login
    this.authService.loginUser(this.formulario.value)
    .subscribe((respuesta:any)=>{
      this.notificacion.mensaje(
        'Login',
        'Usuario identificado',
        TipoMessage.success
      )
      this.router.navigate(['/'])

      //Carga el usuario a vista de todos los elementos que lo necesiten
      this.authService.chargeUser();
    })
    
  }
  /* Manejar errores de formulario en Angular */

  public errorHandling = (controlName: string) => {
    let messageError=''
    const control = this.formulario.get(controlName);
    if(control.errors){
      for (const message of FormErrorMessage) {
      
        if (control &&
            control.errors[message.forValidator] &&
            message.forControl==controlName) {
              messageError = message.text;
        }
      }
      return messageError
    }else{
      return false
    }
  };
}

