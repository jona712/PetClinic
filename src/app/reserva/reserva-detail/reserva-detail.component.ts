import { Component, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DataSource } from '@angular/cdk/collections';

@Component({
  selector: 'app-reserva-detail',
  templateUrl: './reserva-detail.component.html',
  styleUrl: './reserva-detail.component.css',
})
export class ReservaDetailComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  currentUser: any;

  dataSource = new MatTableDataSource<any>();
  displayedColumns = ['Servicio', 'Habitos', 'Historial', 'Razon'];

  datos: any;
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private gService: GenericService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.obtenerReserva();
  }

  obtenerReserva(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(Number(id))) {
      this.gService
        .get('reserva', Number(id))
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (data: any) => {
            // Transformar fecha y hora
            const transformedData = {
              ...data,
              fecha: this.convertDateToFormat(data.fecha),
              hora: this.convertToHours(data.hora),
            };
  
            // Asigna toda la data para que incluya servicio, habitos, historial y razon
            this.datos = transformedData;
            this.dataSource.data = [transformedData];
            console.log(this.dataSource.data);
          }
        );
    }
  }

    //Convierte los minutos a horas para ser mostradas en la interfaz
    convertToHours(minutes: number): string {
      if (isNaN(minutes)) {
        console.error('El valor de minutos no es un número:', minutes);
        return '00:00';
      }
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12; // Convertir 0 a 12 para el formato de 12 horas
      const formattedMinutes = remainingMinutes.toString().padStart(2, '0');
  
      return `${formattedHours
        .toString()
        .padStart(2, '0')}:${formattedMinutes} ${period}`;
    }
  
  convertDateToFormat(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mes es 0-tableado
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  close() {
    this.router.navigate(['/reserva-table']);
  }

  ngOnDestroy() { 
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.currentUser = {
      email: 'isw@prueba.com',
      idUsuario: '2',
      idSucursal: '2',
    };
  }
}
