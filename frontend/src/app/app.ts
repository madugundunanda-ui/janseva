import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SmoothScrollService } from './core/services/smooth-scroll.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  constructor(private scrollService: SmoothScrollService) {}

  ngOnInit(): void {
    this.scrollService.init();
  }
}
