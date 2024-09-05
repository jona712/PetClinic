import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CoreModule } from './core/core.module';
import { ShareModule } from './share/share.module';
import { HomeModule } from './home/home.module';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { ProductoModule } from './producto/producto.module';
import { FacturaModule } from './factura/factura.module';
import { ReservaModule } from './reserva/reserva.module';
import { ServicioModule } from './servicio/servicio.module';
import { SucursalModule } from './sucursal/sucursal.module';
import { HorarioModule } from './horario/horario.module';
import { ReporteModule } from './reporte/reporte.module';
import { UserModule } from './user/user.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    ToastrModule.forRoot(),
    CoreModule,
    ShareModule,
    HomeModule,
    ProductoModule,
    FacturaModule,
    ReservaModule,
    ServicioModule,
    SucursalModule,
    HorarioModule,   
    ReporteModule, 
    UserModule,
    AppRoutingModule, //SIEMPRE debe ir de último
  ],
  providers: [provideAnimationsAsync()],
  bootstrap: [AppComponent],
})
export class AppModule {}
