import { Component, Input, inject } from '@angular/core';
import { GameHint } from '../../../core/models/country.model';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';

const HINT_ICONS: Record<string, string> = {
  continent:   '🌍',
  subregion:   '📍',
  firstLetter: '🔤',
  capital:     '🏛️',
};

const HINT_LABEL_KEYS: Record<string, TranslationKey> = {
  continent:   'continent',
  subregion:   'zone',
  firstLetter: 'firstLetter',
  capital:     'capital',
};

@Component({
  selector: 'app-hint-panel',
  standalone: true,
  imports: [],
  templateUrl: './hint-panel.html',
  styleUrl: './hint-panel.scss',
})
export class HintPanelComponent {
  @Input({ required: true }) hints: GameHint[] = [];

  lang = inject(LanguageService);

  iconFor(type: string): string {
    return HINT_ICONS[type] ?? '💡';
  }

  labelFor(type: string): string {
    const key = HINT_LABEL_KEYS[type];
    return key ? this.lang.t(key) : type;
  }

  valueFor(hint: GameHint): string {
    if (hint.type === 'continent') return this.lang.translateRegion(hint.rawValue);
    if (hint.type === 'subregion') return this.lang.translateSubregion(hint.rawValue);
    if (hint.type === 'firstLetter') return this.lang.lang() === 'es' ? (hint.rawValueEs ?? hint.rawValue) : hint.rawValue;
    return hint.rawValue;
  }
}
