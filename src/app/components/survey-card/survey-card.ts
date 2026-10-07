import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Survey } from '../../models/survey.model';
import { formatDeadline } from '../../utils/survey-date.util';

@Component({
  selector: 'app-survey-card',
  imports: [RouterLink],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.scss',
})
export class SurveyCard {
  readonly survey = input.required<Survey>();
  readonly variant = input<'featured' | 'compact'>('compact');
  protected readonly deadline = computed<string>(() => formatDeadline(this.survey()));
}
