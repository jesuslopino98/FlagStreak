import { Component, Input, signal } from '@angular/core';
import { Country } from '../../../core/models/country.model';

@Component({
  selector: 'app-flag-display',
  standalone: true,
  imports: [],
  templateUrl: './flag-display.html',
  styleUrl: './flag-display.scss',
})
export class FlagDisplayComponent {
  @Input({ required: true }) country!: Country;
  loaded = signal(false);
  error = signal(false);

  onLoad(): void { this.loaded.set(true); }
  onError(): void { this.error.set(true); }
}
