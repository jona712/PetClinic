import { ChangeDetectorRef, Component } from '@angular/core';
import { CartService } from '../../share/cart.service';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../share/authentication.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isAuthenticated: boolean = false;
  currentUser: any = null;
  qtyItems: Number = 0;
  
  constructor(private cartService: CartService,
    private router: Router,
    private authService: AuthenticationService,
    private cdr: ChangeDetectorRef // Inyecta ChangeDetectorRef
  ) {
    //Obtener valor actual de la cantidad de items comprados
    this.qtyItems=this.cartService.quantityItems()
  }

  ngOnInit():void{
    //Suscripción al método que cuenta la cantidad de items comprados
    this.cartService.countItems.subscribe((valor)=>{
      this.qtyItems=valor
      this.cdr.detectChanges();
    })
    this.authService.isAuthenticated.subscribe((valor)=>{
      this.isAuthenticated=valor
      this.cdr.detectChanges();
     
    })
    //Información usuario actual
    this.authService.decodeToken.subscribe((user:any)=>{
      this.currentUser=user
      this.cdr.detectChanges();
    })
  }
  login(){
    this.router.navigate(['usuario/login']);
  }
  logout(){
    this.authService.logout();
    this.router.navigate(['inicio']).then(() => {
      this.cdr.detectChanges(); // Forzar la detección de cambios después de la navegación
    });
  }

}
