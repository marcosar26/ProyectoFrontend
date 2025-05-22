// src/app/app.component.ts
import {Component} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router'; // Importar Router
import {CommonModule} from '@angular/common';
import {AuthService} from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css' // o styleUrls si tienes varios
})
export class AppComponent {
  title = 'proyecto';
  currentYear = new Date().getFullYear();

  constructor(
    public authService: AuthService, // Ya lo tenías público, lo cual es bueno
    private router: Router // Inyectar Router para la navegación si AuthService.logout() no lo hiciera (aunque ya lo hace)
  ) {
  }

  logout(event: MouseEvent): void {
    event.preventDefault(); // Prevenir la acción por defecto del enlace href="#"
    this.authService.logout();
    // AuthService.logout() ya navega a '/login', por lo que la siguiente línea es redundante
    // pero la dejo comentada como recordatorio de que la navegación ocurre.
    // this.router.navigate(['/login']);
  }
}
