// src/app/app.component.ts
import {Component} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true, // Es standalone
  imports: [RouterOutlet, RouterLink, RouterLinkActive], // Importaciones necesarias
  templateUrl: './app.component.html',
  styleUrl: './app.component.css' // O styleUrls si tienes varios
})
export class AppComponent {
  title = 'proyecto'; // Puedes mantener o cambiar esto
  currentYear = new Date().getFullYear();
}
