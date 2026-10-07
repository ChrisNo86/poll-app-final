export interface Answer {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  allowMultiple: boolean;
  answers: Answer[];
}

export interface Survey {
  id: string;
  title: string;
  category: string;
  description: string;
  endDate: number | null;
  createdAt: number;
  questions: Question[];
  votes: Record<string, number>;
}

export type NewSurvey = Omit<Survey, 'id' | 'createdAt' | 'votes'>;

export type Selection = Record<string, string[]>;
