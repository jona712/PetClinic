import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService, IndividualConfig, Toast } from 'ngx-toastr';
export enum TipoMessage{
  error,
  info,
  success,
  warning,
}
@Injectable({
  providedIn: 'root',
})
//https://www.npmjs.com/package/ngx-toastr
export class NotificacionService {
  options: IndividualConfig;
  private activeToasts: Toast[] = []; 
  constructor(private toastr: ToastrService, private router: Router) {
    this.options = this.toastr.toastrConfig;
    //https://www.npmjs.com/package/ngx-toastr#options
    //Habilitar formato HTML dentro de la notificación
    this.options.enableHtml = true;

    /* Top Right, Bottom Right, Bottom Left, Top Left, Top Full Width, Bottom Full Width, Top Center, Bottom Center */
    this.options.positionClass = 'toast-top-right';
  }
  /*
Presentar mensaje de notificación
Toast Type: success, info, warning, error
 */
  public mensaje(titulo: string, mensaje: string, tipo:TipoMessage) {

    this.options.timeOut = 5000;
    this.options.disableTimeOut = false;
    this.options.closeButton = false;

    this.toastr.show(mensaje, titulo, this.options, 'toast-'+TipoMessage[tipo]);
 
  }
  public mensajeRedirect(titulo: string, mensaje: string, tipo:TipoMessage, url: string) {

    this.options.timeOut = 5000;
    this.options.disableTimeOut = false;
    this.options.closeButton = false;

    this.toastr
      .show(mensaje, titulo, this.options, 'toast-'+TipoMessage[tipo])
      .onHidden.subscribe(()=>this.router.navigateByUrl(url))
 
  }

  public permanentMessage(titulo: string, mensaje: string, tipo:TipoMessage) {

    this.options.disableTimeOut = true;
    this.options.closeButton = true;

    this.toastr.show(mensaje, titulo, this.options, 'toast-'+TipoMessage[tipo]);
  }
  
    // Cerrar todas las notificaciones activas
    public clearAll() {
      this.activeToasts.forEach(toast => toast.remove());
      this.activeToasts = [];  // Limpiar la lista de notificaciones activas
    }
}
