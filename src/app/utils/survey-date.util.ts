import { MILLISECONDS_PER_DAY } from '../models/survey.constants';
import { Survey } from '../models/survey.model';

export function isPastSurvey(survey: Survey, now: number = Date.now()): boolean {
  return survey.endDate !== null && survey.endDate <= now;
}

export function sortByEndDate(surveys: Survey[]): Survey[] {
  const toKey = (survey: Survey): number => survey.endDate ?? Number.MAX_SAFE_INTEGER;
  return [...surveys].sort((first, second) => toKey(first) - toKey(second));
}

export function formatDeadline(survey: Survey, now: number = Date.now()): string {
  if (survey.endDate === null) {
    return 'No deadline';
  }
  if (isPastSurvey(survey, now)) {
    return `Ended ${formatDate(survey.endDate)}`;
  }
  const days = Math.max(1, Math.ceil((survey.endDate - now) / MILLISECONDS_PER_DAY));
  return `Ends in ${days} ${days === 1 ? 'Day' : 'Days'}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
