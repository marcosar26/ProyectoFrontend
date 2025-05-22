import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LegendPosition, NgxChartsModule, ScaleType} from '@swimlane/ngx-charts';
import {Subject} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';
import {DashboardService, MovementTypeStat, PeriodSummary, ProductStats} from '../dashboard.service'; // Asumiendo que creaste el servicio

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [CommonModule, NgxChartsModule], // Añadir NgxChartsModule
  templateUrl: './dashboard-view.component.html',
  styleUrls: ['./dashboard-view.component.css']
})
export class DashboardViewComponent implements OnInit, OnDestroy {
  isLoading = true;
  errorMessage: string | null = null;

  productStats: ProductStats | null = null;
  movementTypeStats: MovementTypeStat[] = []; // Para gráfico de pastel o barras
  movementSummary: PeriodSummary | null = null;

  // Opciones para el gráfico de pastel
  gradient: boolean = true;
  showLegend: boolean = true;
  showLabels: boolean = true;
  isDoughnut: boolean = false;
  legendPosition: LegendPosition = LegendPosition.Right;

  pieChartOptions = { // Agrupar opciones para el pie chart
    gradient: true,
    showLegend: true,
    legendTitle: 'Tipos',
    legendPosition: LegendPosition.Right, // <--- CAMBIO: Probar con 'Right'
    labels: true,
    doughnut: false
  };

  // Opciones para el gráfico de barras
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Tipo de Movimiento';
  showYAxisLabel: boolean = true;
  yAxisLabel: string = 'Cantidad';
  colorScheme = { // Puedes definir un esquema de colores
    name: 'cool', // Nombre del esquema (opcional)
    selectable: true,
    group: ScaleType.Ordinal, // O ScaleType.Linear si los datos son lineales
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'] // Colores para las series
  };


  private destroy$ = new Subject<void>();

  constructor(private dashboardService: DashboardService) {
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.dashboardService.getDashboardData()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.productStats = data.productStats;
          this.movementTypeStats = data.movementTypeStats;
          this.movementSummary = data.movementSummary;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al cargar datos del dashboard.';
          console.error(err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Formateador para etiquetas de gráfico de pastel (opcional)
  onSelect(data: any): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  formatDataLabel(value: number): string {
    return `${value}`;
  }
}
