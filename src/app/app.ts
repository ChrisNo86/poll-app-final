import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CreateSurveyDialog } from './components/create-survey-dialog/create-survey-dialog';
import { SurveyDialogStore } from './services/survey-dialog.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CreateSurveyDialog],
  templateUrl: './app.html',
})
export class App {
  protected readonly dialogStore = inject(SurveyDialogStore);
}
