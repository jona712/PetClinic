import { AfterViewInit, Component, ViewChild, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { GenericService } from '../../share/generic.service';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ServicioDiagComponent } from '../servicio-diag/servicio-diag.component';

@Component({
  selector: 'app-servicio-table',
  templateUrl: './servicio-table.component.html',
  styleUrls: ['./servicio-table.component.css'],
})
export class ServicioTableComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<any>();

  displayedColumns = ['id', 'descripcion', 'acciones'];
  datos: any;
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private gService: GenericService,
    private router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {}

  ngAfterViewInit(): void {
    this.listServicios();
  }

  listServicios() {
    this.gService
      .list('servicio/')
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta: any) => {
        console.log(respuesta);
        this.datos = respuesta;
        this.dataSource = new MatTableDataSource(this.datos);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      });
  }

  detalleServicio(id: number) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '50%';
    dialogConfig.disableClose = false;
    dialogConfig.data = {
      id: id,
    };
    this.dialog.open(ServicioDiagComponent, dialogConfig);
  }
  crearServicio() {
    this.router.navigate(['/servicio/create'], {
      relativeTo: this.route,
    });
  }

  actualizarServicio(id: number) {
    this.router.navigate(['/servicio/update', id], {
      relativeTo: this.route,
    });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
