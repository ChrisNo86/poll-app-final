import { MILLISECONDS_PER_DAY } from '../models/survey.constants';
import { Question, Survey } from '../models/survey.model';

interface SeedDefinition {
  id: string;
  title: string;
  category: string;
  description: string;
  daysFromNow: number | null;
  questions: [string, boolean, string[]][];
}

const SEED_DEFINITIONS: SeedDefinition[] = [
  {
    id: 'seed-team-event',
    title: 'Let’s Plan the Next Team Event Together',
    category: 'Team Activities',
    description: 'Share your preferences and ideas to help us plan better team experiences.',
    daysFromNow: 1,
    questions: [
      [
        'Which date would work best for you?',
        true,
        ['19.09., Friday', '10.10., Friday', '11.10., Saturday', '31.10., Friday'],
      ],
      [
        'Choose the activities you prefer',
        true,
        [
          'Outdoor adventure',
          'Office costume party',
          'Bowling and mini-golf',
          'Beach party',
          'Escape room',
        ],
      ],
      [
        'How long would you prefer the event to last?',
        false,
        ['Half a day', 'Full day', 'Evening only'],
      ],
    ],
  },
  {
    id: 'seed-wellness',
    title: 'Fit & wellness survey!',
    category: 'Health & Wellness',
    description: 'Tell us what would help you stay healthy at work.',
    daysFromNow: 2,
    questions: [
      ['What would you use most?', false, ['Gym membership', 'Healthy snacks', 'Standing desks']],
    ],
  },
  {
    id: 'seed-gaming',
    title: 'Gaming habits and favorite games!',
    category: 'Gaming & Entertainment',
    description: 'What do you play and how often?',
    daysFromNow: 3,
    questions: [['How often do you play?', false, ['Daily', 'Weekly', 'Rarely']]],
  },
  {
    id: 'seed-learning',
    title: 'Which training topics interest you?',
    category: 'Education & Learning',
    description: 'Help us choose the next training budget priorities.',
    daysFromNow: 12,
    questions: [['Pick your topics', true, ['Security', 'Cloud', 'Soft skills', 'Leadership']]],
  },
  {
    id: 'seed-open-end',
    title: 'Office snack wishlist',
    category: 'Lifestyle & Preferences',
    description: 'No deadline, vote anytime.',
    daysFromNow: null,
    questions: [['Favorite snack?', false, ['Fruit', 'Chocolate', 'Nuts']]],
  },
  {
    id: 'seed-past-offsite',
    title: 'Summer offsite feedback',
    category: 'Team Activities',
    description: 'This survey has ended. Results are read-only.',
    daysFromNow: -10,
    questions: [['How was the offsite?', false, ['Great', 'Okay', 'Not good']]],
  },
  {
    id: 'seed-past-gaming',
    title: 'Game night winners',
    category: 'Gaming & Entertainment',
    description: 'This survey has ended. Results are read-only.',
    daysFromNow: -3,
    questions: [['Which game should return?', true, ['Mario Kart', 'Catan', 'Skribbl']]],
  },
];

function buildQuestions(definition: SeedDefinition): Question[] {
  return definition.questions.map(([text, allowMultiple, answers], questionIndex) => ({
    id: `q${questionIndex + 1}`,
    text,
    allowMultiple,
    answers: answers.map((answer, answerIndex) => ({ id: `a${answerIndex + 1}`, text: answer })),
  }));
}

function buildVotes(questions: Question[]): Record<string, number> {
  const votes: Record<string, number> = {};
  questions.forEach((question) =>
    question.answers.forEach((answer, index) => {
      votes[`${question.id}_${answer.id}`] = (index * 3 + question.text.length) % 7;
    }),
  );
  return votes;
}

export function createSeedSurveys(now: number = Date.now()): Survey[] {
  return SEED_DEFINITIONS.map((definition) => {
    const questions = buildQuestions(definition);
    const endDate =
      definition.daysFromNow === null ? null : now + definition.daysFromNow * MILLISECONDS_PER_DAY;
    const { daysFromNow, questions: _raw, ...base } = definition;
    return { ...base, endDate, createdAt: now, questions, votes: buildVotes(questions) };
  });
}
