import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CountriesService } from '../../core/services/countries.service';
import { Country, SurvivalRun } from '../../core/models/country.model';
import { FlagDisplayComponent } from '../../shared/components/flag-display/flag-display';
import { CountryInputComponent } from '../../shared/components/country-input/country-input';
import { GameService } from '../../core/services/game.service';
import { LanguageService } from '../../core/services/language.service';

type Phase = 'lobby' | 'countdown' | 'playing' | 'dead' | 'completed';

@Component({
  selector: 'app-survival',
  standalone: true,
  imports: [FlagDisplayComponent, CountryInputComponent],
  templateUrl: './survival.html',
  styleUrl: './survival.scss',
})
export class SurvivalComponent implements OnInit, OnDestroy {
  private countriesService = inject(CountriesService);
  gameService = inject(GameService);
  lang = inject(LanguageService);

  countries = signal<Country[]>([]);
  phase = signal<Phase>('lobby');
  countdown = signal(3);
  current = signal<Country | null>(null);
  score = signal(0);
  elapsedMs = signal(0);
  lastAnswer = signal('');
  lastCountry = signal<Country | null>(null);
  shake = signal(false);
  loading = signal(true);

  private usedIds = new Set<string>();
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;

  leaderboard = computed(() => {
    const runs = this.gameService.stats().survivalLeaderboard ?? [];
    return [...runs].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return a.timeMs - b.timeMs;
    });
  });

  formattedTime = computed(() => this.formatMs(this.elapsedMs()));

  ngOnInit(): void {
    this.countriesService.getAll().subscribe(c => {
      this.countries.set(c);
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  startCountdown(): void {
    this.phase.set('countdown');
    this.countdown.set(3);
    this.countdownInterval = setInterval(() => {
      const next = this.countdown() - 1;
      this.countdown.set(next);
      if (next <= 0) {
        clearInterval(this.countdownInterval!);
        this.countdownInterval = null;
        setTimeout(() => this.startGame(), 700);
      }
    }, 1000);
  }

  private startGame(): void {
    this.score.set(0);
    this.usedIds.clear();
    this.lastAnswer.set('');
    this.phase.set('playing');
    this.startTime = Date.now();
    this.elapsedMs.set(0);
    this.timerInterval = setInterval(() => {
      this.elapsedMs.set(Date.now() - this.startTime);
    }, 100);
    this.nextCountry();
  }

  private nextCountry(): void {
    const list = this.countries();
    const available = list.filter(c => !this.usedIds.has(c.cca2));
    if (available.length === 0) {
      this.finishGame(true);
      return;
    }
    const picked = available[Math.floor(Math.random() * available.length)];
    this.usedIds.add(picked.cca2);
    this.current.set(picked);
  }

  onGuess(input: string): void {
    const country = this.current();
    if (!country || this.phase() !== 'playing') return;

    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const correct = norm(input) === norm(country.name) || (country.nameEs ? norm(input) === norm(country.nameEs) : false);

    if (correct) {
      this.score.update(s => s + 1);
      this.nextCountry();
    } else {
      this.lastCountry.set(country);
      this.lastAnswer.set(
        this.lang.lang() === 'es' && country.nameEs ? country.nameEs : country.name
      );
      this.shake.set(true);
      setTimeout(() => {
        this.shake.set(false);
        this.finishGame(false);
      }, 600);
    }
  }

  private finishGame(completed: boolean): void {
    this.clearTimers();
    const finalTime = Date.now() - this.startTime;
    this.elapsedMs.set(finalTime);
    const run: SurvivalRun = {
      score: this.score(),
      timeMs: finalTime,
      completed,
      date: new Date().toISOString().slice(0, 10),
    };
    this.gameService.recordSurvivalRun(run);
    this.phase.set(completed ? 'completed' : 'dead');
  }

  backToLobby(): void {
    this.clearTimers();
    this.phase.set('lobby');
    this.current.set(null);
  }

  playAgain(): void {
    this.clearTimers();
    this.current.set(null);
    this.startCountdown();
  }

  formatMs(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private clearTimers(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
  }
}
