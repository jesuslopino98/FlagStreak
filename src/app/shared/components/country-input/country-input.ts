import { Component, Input, Output, EventEmitter, signal, computed, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Country } from '../../../core/models/country.model';
import { LanguageService } from '../../../core/services/language.service';

export interface CountrySuggestion {
  country: Country;
  label: string;
}

@Component({
  selector: 'app-country-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './country-input.html',
  styleUrl: './country-input.scss',
})
export class CountryInputComponent {
  @Input({ required: true }) countries: Country[] = [];
  @Input() shake = false;
  @Output() guessed = new EventEmitter<string>();

  lang = inject(LanguageService);

  readonly listboxId = 'country-listbox';
  readonly MAX_INPUT_LENGTH = 100;

  inputValue = signal('');
  showDropdown = signal(false);
  activeIndex = signal(-1);

  suggestions = computed<CountrySuggestion[]>(() => {
    const q = this.norm(this.inputValue().trim());
    const isEs = this.lang.lang() === 'es';
    if (q.length < 1) return [];
    return this.countries
      .filter(c =>
        this.norm(c.name).includes(q) ||
        (c.nameEs ? this.norm(c.nameEs).includes(q) : false)
      )
      .slice(0, 8)
      .map(c => ({ country: c, label: isEs && c.nameEs ? c.nameEs : c.name }));
  });

  isExpanded = computed(() => this.showDropdown() && this.suggestions().length > 0);
  activeDescendantId = computed(() =>
    this.activeIndex() >= 0 ? `country-option-${this.activeIndex()}` : null
  );

  onInput(value: string): void {
    if (value.length > this.MAX_INPUT_LENGTH) return;
    this.inputValue.set(value);
    this.showDropdown.set(true);
    this.activeIndex.set(-1);
  }

  select(suggestion: CountrySuggestion): void {
    this.inputValue.set(suggestion.label);
    this.showDropdown.set(false);
    this.activeIndex.set(-1);
    this.submit();
  }

  submit(): void {
    const val = this.inputValue().trim();
    if (!val) return;
    this.guessed.emit(val);
    this.inputValue.set('');
    this.showDropdown.set(false);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const sugg = this.suggestions();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex.set(Math.min(this.activeIndex() + 1, sugg.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex.set(Math.max(this.activeIndex() - 1, -1));
    } else if (e.key === 'Enter') {
      if (this.activeIndex() >= 0 && sugg[this.activeIndex()]) {
        this.select(sugg[this.activeIndex()]);
      } else {
        this.submit();
      }
    } else if (e.key === 'Escape') {
      this.showDropdown.set(false);
    }
  }

  onBlur(): void {
    setTimeout(() => this.showDropdown.set(false), 200);
  }

  private norm(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}
