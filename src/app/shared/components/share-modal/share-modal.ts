import { Component, Input, Output, EventEmitter, OnDestroy, signal, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [],
  templateUrl: './share-modal.html',
  styleUrl: './share-modal.scss',
})
export class ShareModalComponent implements OnDestroy {
  @Input({ required: true }) shareText = '';
  @Output() closed = new EventEmitter<void>();

  lang = inject(LanguageService);
  copied = signal(false);

  private copyTimer?: ReturnType<typeof setTimeout>;

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shareText);
    } catch {
      return;
    }
    clearTimeout(this.copyTimer);
    this.copied.set(true);
    this.copyTimer = setTimeout(() => this.copied.set(false), 2000);
  }

  async share(): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({ text: this.shareText });
      } catch {
        this.copy();
      }
    } else {
      this.copy();
    }
  }

  close(): void {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    clearTimeout(this.copyTimer);
  }
}
