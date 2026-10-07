import { Component, computed, input, signal } from '@angular/core';

import { Question, Selection, Survey } from '../../models/survey.model';
import { getAnswerPercent, toLetter, withPendingVotes } from '../../utils/vote-key.util';

@Component({
  selector: 'app-survey-results',
  templateUrl: './survey-results.html',
  styleUrl: './survey-results.scss',
})
export class SurveyResults {
  readonly survey = input.required<Survey>();
  readonly pending = input<Selection>({});
  protected readonly toLetter = toLetter;
  protected readonly open = signal(true);
  private readonly shown = computed<Survey>(() => withPendingVotes(this.survey(), this.pending()));

  protected toggle(): void {
    this.open.update((isOpen) => !isOpen);
  }

  protected percentOf(question: Question, answerId: string): number {
    return getAnswerPercent(this.shown(), question, answerId);
  }
}
