import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stars-display',
  standalone: true,
  imports: [],
  templateUrl: './stars-display.html',
  styleUrl: './stars-display.scss',
})
export class StarsDisplayComponent {
  @Input({ required: true }) stars = 5;
  @Input() maxStars = 5;

  get starsArray(): boolean[] {
    return Array.from({ length: this.maxStars }, (_, i) => i < this.stars);
  }
}
