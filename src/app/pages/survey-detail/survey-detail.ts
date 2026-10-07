import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { SiteHeader } from '../../components/site-header/site-header';
import { SurveyResults } from '../../components/survey-results/survey-results';
import { SurveyVote } from '../../components/survey-vote/survey-vote';
import { Selection } from '../../models/survey.model';
import { SurveyDialogStore } from '../../services/survey-dialog.store';
import { SurveyService } from '../../services/survey.service';
import { formatDate, isPastSurvey } from '../../utils/survey-date.util';

@Component({
  selector: 'app-survey-detail',
  imports: [RouterLink, SiteHeader, SurveyVote, SurveyResults],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetail {
  readonly id = input.required<string>();

  private readonly surveyService = inject(SurveyService);
  private readonly hasVotedNow = signal<boolean>(false);
  protected readonly dialogStore = inject(SurveyDialogStore);

  protected readonly formatDate = formatDate;
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly pendingSelection = signal<Selection>({});
  protected readonly submitError = signal<string>('');
  protected readonly survey = toSignal(
    toObservable(this.id).pipe(switchMap((id) => this.surveyService.watchSurvey(id))),
  );
  protected readonly isPast = computed<boolean>(() => {
    const survey = this.survey();
    return survey ? isPastSurvey(survey) : false;
  });
  protected readonly hasVoted = computed<boolean>(
    () => this.hasVotedNow() || this.surveyService.hasVoted(this.id()),
  );
  protected readonly isLocked = computed<boolean>(() => this.isPast() || this.hasVoted());

  protected async vote(selection: Selection): Promise<void> {
    this.isSubmitting.set(true);
    this.submitError.set('');
    try {
      await this.surveyService.submitVotes(this.id(), selection);
      this.hasVotedNow.set(true);
      this.pendingSelection.set({});
    } catch {
      this.submitError.set('Your vote could not be saved. Please try again.');
    }
    this.isSubmitting.set(false);
  }
}
