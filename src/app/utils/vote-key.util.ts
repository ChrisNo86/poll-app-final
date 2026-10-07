import { Question, Survey } from '../models/survey.model';

export function buildVoteKey(questionId: string, answerId: string): string {
  return `${questionId}_${answerId}`;
}

export function countQuestionVotes(survey: Survey, question: Question): number {
  return question.answers.reduce(
    (sum, answer) => sum + (survey.votes[buildVoteKey(question.id, answer.id)] ?? 0),
    0,
  );
}

export function getAnswerPercent(survey: Survey, question: Question, answerId: string): number {
  const total = countQuestionVotes(survey, question);
  const votes = survey.votes[buildVoteKey(question.id, answerId)] ?? 0;
  return total === 0 ? 0 : Math.round((votes / total) * 100);
}

export function toLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}
