import { Component, computed, input, output, signal } from '@angular/core';

import { Question, Selection, Survey } from '../../models/survey.model';
import { toLetter } from '../../utils/vote-key.util';

@Component({
  selector: 'app-survey-vote',
  templateUrl: './survey-vote.html',
  styleUrl: './survey-vote.scss',
})
export class SurveyVote {
  readonly survey = input.required<Survey>();
  readonly locked = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly submitted = output<Selection>();

  protected readonly toLetter = toLetter;
  private readonly selection = signal<Selection>({});

  protected readonly canSubmit = computed<boolean>(
    () =>
      !this.locked() &&
      !this.isSubmitting() &&
      this.survey().questions.every((question) => (this.selection()[question.id] ?? []).length > 0),
  );

  protected isSelected(questionId: string, answerId: string): boolean {
    return (this.selection()[questionId] ?? []).includes(answerId);
  }

  protected choose(question: Question, answerId: string): void {
    const current = this.selection()[question.id] ?? [];
    const next = this.computeSelection(question, current, answerId);
    this.selection.update((selection) => ({ ...selection, [question.id]: next }));
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.canSubmit()) {
      this.submitted.emit(this.selection());
    }
  }

  private computeSelection(question: Question, current: string[], answerId: string): string[] {
    if (!question.allowMultiple) {
      return [answerId];
    }
    return current.includes(answerId)
      ? current.filter((id) => id !== answerId)
      : [...current, answerId];
  }
}
