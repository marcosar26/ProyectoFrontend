// src/app/features/home/home.component.ts
import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  appName = 'Gestor de Stock Pro';
  welcomeMessage = 'Optimiza tu inventario de forma sencilla y eficiente.';
}
