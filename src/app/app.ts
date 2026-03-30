import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  lang = inject(LanguageService);
  theme = signal<'dark' | 'light'>(this.initTheme());
  menuOpen = signal(false);
  settingsOpen = signal(false);

  toggleTheme() {
    const newTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(newTheme);
    document.documentElement.dataset['theme'] = newTheme;
    localStorage.setItem('flagstreak-theme', newTheme);
  }

  toggleLanguage(event: Event) {
    event.stopPropagation();
    this.lang.toggle();
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen.update(v => !v);
    this.settingsOpen.set(false);
  }

  toggleSettings(event: Event) {
    event.stopPropagation();
    this.settingsOpen.update(v => !v);
    this.menuOpen.set(false);
  }

  @HostListener('document:click')
  closeMenus() {
    this.menuOpen.set(false);
    this.settingsOpen.set(false);
  }

  private initTheme(): 'dark' | 'light' {
    const saved = localStorage.getItem('flagstreak-theme');
    const theme = (saved === 'dark' || saved === 'light')
      ? saved
      : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.dataset['theme'] = theme;
    return theme;
  }
}
