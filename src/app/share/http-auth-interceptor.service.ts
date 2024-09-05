import { Injectable } from '@angular/core';
import {  HttpRequest, HttpHandler, 
  HttpInterceptor,
} from '@angular/common/http';;

import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root',
})
export class HttpAuthInterceptorService implements HttpInterceptor {
  //Recuerde que es necesario llamarlo como Proveedor
  //en AppModule
  constructor(
    private auth: AuthenticationService,
  ) {}
  intercept(request: HttpRequest<any>, next: HttpHandler){
    //Obtener token
    let token = null;
    if (this.auth.tokenUserValue != null) {
      token = this.auth.tokenUserValue;
    }
    //Agregar headers a la solicitud
    if (token) {
      //Header con el token
      request = request.clone({
        headers: request.headers.set('Authorization', 'Bearer ' + token),
      });
    }
    return next.handle(request);
    
    }
  }
