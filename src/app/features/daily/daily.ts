import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { GameService } from '../../core/services/game.service';
import { LanguageService } from '../../core/services/language.service';
import { FlagDisplayComponent } from '../../shared/components/flag-display/flag-display';
import { CountryInputComponent } from '../../shared/components/country-input/country-input';
import { StarsDisplayComponent } from '../../shared/components/stars-display/stars-display';
import { ShareModalComponent } from '../../shared/components/share-modal/share-modal';
import { GameHint } from '../../core/models/country.model';

export interface HintCircle {
  icon: string;
  label: string;
  value: string | null;  // null = not revealed yet
  revealed: boolean;
}

@Component({
  selector: 'app-daily',
  standalone: true,
  imports: [
    FlagDisplayComponent,
    CountryInputComponent,
    StarsDisplayComponent,
    ShareModalComponent,
  ],
  templateUrl: './daily.html',
  styleUrl: './daily.scss',
})
export class DailyComponent implements OnInit, OnDestroy {
  game = inject(GameService);
  lang = inject(LanguageService);

  feedback = signal<{ message: string; type: 'success' | 'error' | 'warning' | '' }>({ message: '', type: '' });
  showShare = signal(false);
  guessShake = signal(false);

  private feedbackTimer?: ReturnType<typeof setTimeout>;
  private shakeTimer?: ReturnType<typeof setTimeout>;

  countryName = computed(() => {
    const state = this.game.gameState();
    if (!state) return '';
    const c = state.country;
    return (this.lang.lang() === 'es' && c.nameEs) ? c.nameEs : c.name;
  });

  // 4 circles: one per hint slot — reactive to language changes
  hintCircles = computed<HintCircle[]>(() => {
    const hints = this.game.currentHints();
    const hintMap = new Map<string, GameHint>(hints.map(h => [h.type, h]));
    const status = this.game.status();
    const country = this.game.gameState()?.country ?? null;
    const isEs = this.lang.lang() === 'es';

    const slots = [
      { type: 'continent',   label: this.lang.t('continent'),   icon: '🌍' },
      { type: 'subregion',   label: this.lang.t('zone'),        icon: '📍' },
      { type: 'firstLetter', label: this.lang.t('firstLetter'), icon: '🔤' },
      { type: 'capital',     label: this.lang.t('capital'),     icon: '🏛️' },
    ];

    return slots.map(slot => {
      const hint = hintMap.get(slot.type);
      let value: string | null = null;

      if (hint) {
        // Hint revealed: translate its rawValue
        if (hint.type === 'continent') value = this.lang.translateRegion(hint.rawValue);
        else if (hint.type === 'subregion') value = this.lang.translateSubregion(hint.rawValue);
        else if (hint.type === 'firstLetter') value = isEs ? (hint.rawValueEs ?? hint.rawValue) : hint.rawValue;
        else value = hint.rawValue;
      } else if (status === 'won' && country) {
        // Unused hint on win: compute the value it would have shown
        if (slot.type === 'continent') value = this.lang.translateRegion(country.region);
        else if (slot.type === 'subregion') value = this.lang.translateSubregion(country.subregion);
        else if (slot.type === 'firstLetter') value = isEs ? (country.nameEs ?? country.name)[0].toUpperCase() : country.name[0].toUpperCase();
        else if (slot.type === 'capital') value = country.capital;
      }

      return {
        icon: slot.icon,
        label: slot.label,
        value,
        revealed: !!hint,
      };
    });
  });

  ngOnInit(): void {
    this.game.init();
  }

  ngOnDestroy(): void {
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.shakeTimer);
  }

  onGuess(value: string): void {
    if (!value.trim()) return;

    const result = this.game.guess(value);

    if (result === 'correct') {
      this.showFeedback(this.lang.t('correctFeedback'), 'success');
    } else if (result === 'wrong') {
      const state = this.game.gameState();
      if (state?.status !== 'lost') {
        this.showFeedback(this.lang.t('wrongFeedback'), 'warning');
        this.triggerShake();
      }
    } else if (result === 'already_guessed') {
      this.showFeedback(this.lang.t('alreadyGuessed'), 'warning');
      this.triggerShake();
    }
  }

  private showFeedback(message: string, type: 'success' | 'error' | 'warning'): void {
    clearTimeout(this.feedbackTimer);
    this.feedback.set({ message, type });
    this.feedbackTimer = setTimeout(() => this.feedback.set({ message: '', type: '' }), 3000);
  }

  private triggerShake(): void {
    clearTimeout(this.shakeTimer);
    this.guessShake.set(true);
    this.shakeTimer = setTimeout(() => this.guessShake.set(false), 600);
  }
}
