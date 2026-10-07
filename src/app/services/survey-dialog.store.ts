import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SurveyDialogStore {
  readonly isOpen = signal<boolean>(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
