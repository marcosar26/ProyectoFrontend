// src/app/app.component.ts
import {Component} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {CommonModule} from '@angular/common'; // <--- IMPORTAR CommonModule para *ngIf
import {AuthService} from './core/auth/auth.service'; // <--- IMPORTAR AuthService

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], // <--- AÑADIR CommonModule
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'proyecto';
  currentYear = new Date().getFullYear();

  constructor(public authService: AuthService) {
  } // <--- INYECTAR Y HACER PÚBLICO
}
