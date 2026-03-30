import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CountriesService } from '../../core/services/countries.service';
import { Country } from '../../core/models/country.model';
import { FlagDisplayComponent } from '../../shared/components/flag-display/flag-display';
import { CountryInputComponent } from '../../shared/components/country-input/country-input';
import { LanguageService } from '../../core/services/language.service';

type TrainingPhase = 'playing' | 'correct' | 'wrong';

const MAX_ATTEMPTS = 2;

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [FlagDisplayComponent, CountryInputComponent],
  templateUrl: './training.html',
  styleUrl: './training.scss',
})
export class TrainingComponent implements OnInit, OnDestroy {
  private countriesService = inject(CountriesService);
  lang = inject(LanguageService);

  loading = signal(true);
  phase = signal<TrainingPhase>('playing');
  flagAttempts = signal(0);
  guessed = signal(0);
  errors = signal(0);
  current = signal<Country | null>(null);
  lastAnswer = signal('');
  shake = signal(false);

  private pool: Country[] = [];
  private poolIndex = 0;
  private correctTimer: ReturnType<typeof setTimeout> | null = null;

  attemptsArray = computed(() =>
    Array.from({ length: MAX_ATTEMPTS }, (_, i) => i < MAX_ATTEMPTS - this.flagAttempts())
  );

  countries = signal<Country[]>([]);

  ngOnInit(): void {
    this.countriesService.getAll().subscribe(c => {
      this.countries.set(c);
      this.pool = this.shuffle([...c]);
      this.poolIndex = 0;
      this.loading.set(false);
      this.nextFlag();
    });
  }

  ngOnDestroy(): void {
    if (this.correctTimer) clearTimeout(this.correctTimer);
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private nextFlag(): void {
    if (this.poolIndex >= this.pool.length) {
      this.pool = this.shuffle([...this.countries()]);
      this.poolIndex = 0;
    }
    this.current.set(this.pool[this.poolIndex++]);
    this.flagAttempts.set(0);
    this.phase.set('playing');
  }

  onGuess(input: string): void {
    if (this.phase() !== 'playing') return;
    const country = this.current();
    if (!country) return;

    const norm = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const correct =
      norm(input) === norm(country.name) ||
      (country.nameEs ? norm(input) === norm(country.nameEs) : false);

    if (correct) {
      this.guessed.update(n => n + 1);
      this.phase.set('correct');
      this.correctTimer = setTimeout(() => this.nextFlag(), 1000);
    } else {
      this.shake.set(true);
      setTimeout(() => this.shake.set(false), 600);

      const attempts = this.flagAttempts() + 1;
      this.flagAttempts.set(attempts);
      if (attempts >= MAX_ATTEMPTS) {
        this.errors.update(n => n + 1);
        this.lastAnswer.set(
          this.lang.lang() === 'es' && country.nameEs ? country.nameEs : country.name
        );
        this.phase.set('wrong');
      }
    }
  }

  nextAfterWrong(): void {
    this.nextFlag();
  }
}
