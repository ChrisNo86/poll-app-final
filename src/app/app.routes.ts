import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { SurveyDetail } from './pages/survey-detail/survey-detail';

export const routes: Routes = [
  { path: '', component: Home, title: 'Poll App' },
  { path: 'survey/:id', component: SurveyDetail, title: 'Survey – Poll App' },
  { path: '**', redirectTo: '' },
];
