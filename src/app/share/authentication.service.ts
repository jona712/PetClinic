import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {  Router } from '@angular/router';
import { environment } from '../../environments/environment.development';
import { CartService } from './cart.service';
import { jwtDecode } from 'jwt-decode';
//npm install jwt-decode
//npm audit fix --force

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  //Header para afirmar el tipo de contenido JSON
  //URL del API
  ServerUrl = environment.apiURL;
  //Variable observable para gestionar la información del token del usuario, con características especiales
  private tokenUserSubject: BehaviorSubject<any>;
  //Variable observable para gestionar la información del token
  public currentUser: Observable<any>;
  //Booleano para estado de usuario autenticado
  private authenticated = new BehaviorSubject<boolean>(false);
  //Variable observable para obtener la información del usuario
  private user = new BehaviorSubject<any>(null);


  constructor(private http: HttpClient,
    private router: Router,
    private cartService: CartService
  ) {
    //Obtener los datos del usuario en localStorage, si existe
    this.tokenUserSubject = new BehaviorSubject<any>(
      JSON.parse(localStorage.getItem('currentUser'))
    );
    //Establecer un observable para acceder a los datos del usuario
    this.currentUser = this.tokenUserSubject.asObservable();
  }
  //Obtener el valor del usuario actual
  public get tokenUserValue(): any {
    return this.tokenUserSubject.value;
  }
  //Establecer booleano verificando si esta autenticado
  get isAuthenticated() {
    if (this.tokenUserValue != null) {
      this.authenticated.next(true);
    } else {
      this.authenticated.next(false);
    }
    return this.authenticated.asObservable();
  }
  //Crear usuario
  createUser(user: any): Observable<any> {
    return this.http.post<any>(
      this.ServerUrl + 'usuario/registrar',
      user
    );
  }
  //Decodificar la información del token y obtener la información del usuario
  get decodeToken(): any {
    this.user.next(null);
    if (this.tokenUserValue != null ) {
      this.user.next(jwtDecode(this.tokenUserValue))
    }
   
    return this.user.asObservable();
  }
  
  //Login
  loginUser(user: any): Observable<any> {
    return this.http
      .post<any>(this.ServerUrl + 'usuario/login', user)
      .pipe(
        map((response) => {
          // almacene los detalles del usuario y el token jwt
          // en el almacenamiento local para mantener al usuario conectado entre las actualizaciones de la página
          
          localStorage.setItem('currentUser', JSON.stringify(response.token));
          this.authenticated.next(true);       
          this.tokenUserSubject.next(response.token);
          let userData=this.decodeToken;
          return userData;
        })
      );
  }
  //Logout de usuario autentificado
  logout() {
    let usuario = this.tokenUserSubject.value;
    if (usuario) {
      // eliminar usuario del almacenamiento local para cerrar la sesión del usuario
      localStorage.removeItem('currentUser');
      //Eliminarlo del observable del usuario actual
      this.tokenUserSubject.next(null);
      //Eliminarlo del observable del boleano si esta autenticado
      this.authenticated.next(false);
      //Eliminar carrito
      this.cartService.deleteCart();
      return true;
    }
    return false;
  }

  // Método para cargar el usuario decodificado en la variable currentUser
  chargeUser() {
    const token = this.tokenUserSubject.value; // Obtiene el token
    if (token) {
      const decodedToken: any = jwtDecode(token); // Decodifica el token
      this.currentUser = decodedToken; // Asigna el usuario decodificado a la variable currentUser
    }
  }
 
}
