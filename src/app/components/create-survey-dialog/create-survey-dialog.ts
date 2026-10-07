import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import {
  MAX_ANSWERS_PER_QUESTION,
  MAX_ANSWER_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_QUESTION_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_ANSWERS_PER_QUESTION,
  PUBLISH_REDIRECT_DELAY_MS,
  SURVEY_CATEGORIES,
} from '../../models/survey.constants';
import { NewSurvey, Question } from '../../models/survey.model';
import { SurveyService } from '../../services/survey.service';
import { notBlank, notInPast, parseDateInput, showsError } from '../../utils/form-validators.util';
import { toLetter } from '../../utils/vote-key.util';

type QuestionGroup = FormGroup<{
  text: FormControl<string>;
  allowMultiple: FormControl<boolean>;
  answers: FormArray<FormControl<string>>;
}>;

@Component({
  selector: 'app-create-survey-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './create-survey-dialog.html',
  styleUrl: './create-survey-dialog.scss',
  host: { '(document:keydown.escape)': 'close()' },
})
export class CreateSurveyDialog {
  readonly closed = output<void>();

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly surveyService = inject(SurveyService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private redirectTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly categories = SURVEY_CATEGORIES;
  protected readonly maxAnswers = MAX_ANSWERS_PER_QUESTION;
  protected readonly titleMaxLength = MAX_TITLE_LENGTH;
  protected readonly descriptionMaxLength = MAX_DESCRIPTION_LENGTH;
  protected readonly questionMaxLength = MAX_QUESTION_LENGTH;
  protected readonly answerMaxLength = MAX_ANSWER_LENGTH;
  protected readonly isSaving = signal<boolean>(false);
  protected readonly saveError = signal<string>('');
  protected readonly submitAttempted = signal<boolean>(false);
  protected readonly publishedSurveyId = signal<string>('');
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly showsError = showsError;
  protected readonly toLetter = toLetter;

  protected readonly form = this.formBuilder.group({
    title: ['', [notBlank, Validators.maxLength(MAX_TITLE_LENGTH)]],
    category: ['', [Validators.required]],
    endDate: ['', [notInPast]],
    description: ['', [Validators.maxLength(MAX_DESCRIPTION_LENGTH)]],
    questions: this.formBuilder.array<QuestionGroup>([this.createQuestion()]),
  });

  constructor() {
    afterNextRender(() =>
      this.elementRef.nativeElement.querySelector<HTMLElement>('#survey-title')?.focus(),
    );

    const body = this.document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    this.destroyRef.onDestroy(() => {
      body.style.overflow = previousOverflow;
      this.cancelRedirect();
    });
  }

  protected get questions(): FormArray<QuestionGroup> {
    return this.form.controls.questions;
  }

  protected close(): void {
    this.cancelRedirect();
    if (this.publishedSurveyId()) {
      void this.router.navigate(['/']);
    }
    this.closed.emit();
  }

  protected answersOf(question: QuestionGroup): FormArray<FormControl<string>> {
    return question.controls.answers;
  }

  protected addQuestion(): void {
    this.questions.push(this.createQuestion());
  }

  protected removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    }
  }

  protected clearQuestion(index: number): void {
    const question = this.questions.at(index);
    question.controls.text.reset('');
    question.controls.allowMultiple.reset(false);
    question.controls.answers.controls.forEach((answer) => answer.reset(''));
  }

  protected clearField(control: FormControl<string>): void {
    control.reset('');
  }

  protected addAnswer(question: QuestionGroup): void {
    if (this.answersOf(question).length < this.maxAnswers) {
      this.answersOf(question).push(
        this.formBuilder.control('', [notBlank, Validators.maxLength(MAX_ANSWER_LENGTH)]),
      );
    }
  }

  protected removeAnswer(question: QuestionGroup, index: number): void {
    if (this.answersOf(question).length > MIN_ANSWERS_PER_QUESTION) {
      this.answersOf(question).removeAt(index);
    }
  }

  protected get missingFields(): string[] {
    const { title, category, endDate } = this.form.controls;
    return [
      ...(title.invalid ? ['Please enter a survey name.'] : []),
      ...(category.invalid ? ['Please choose a category.'] : []),
      ...(endDate.invalid ? ['The end date must not be in the past.'] : []),
      ...this.questions.controls.flatMap((question, index) =>
        this.missingInQuestion(question, index + 1),
      ),
    ];
  }

  protected async publish(): Promise<void> {
    this.form.markAllAsTouched();
    this.submitAttempted.set(true);
    if (this.form.invalid) {
      this.revealMissingFields();
      return;
    }
    if (this.isSaving()) {
      return;
    }
    this.isSaving.set(true);
    try {
      this.publishedSurveyId.set(await this.surveyService.createSurvey(this.buildSurvey()));
      this.redirectTimer = setTimeout(() => this.close(), PUBLISH_REDIRECT_DELAY_MS);
    } catch {
      this.saveError.set('The survey could not be saved. Please try again.');
      this.isSaving.set(false);
    }
  }

  private missingInQuestion(question: QuestionGroup, number: number): string[] {
    const missing = question.controls.text.invalid
      ? [`Question ${number}: please enter the question.`]
      : [];
    question.controls.answers.controls.forEach((answer, index) => {
      if (answer.invalid) {
        missing.push(`Question ${number}: please fill in answer ${toLetter(index)}.`);
      }
    });
    return missing;
  }

  private revealMissingFields(): void {
    afterNextRender(
      () =>
        this.elementRef.nativeElement
          .querySelector<HTMLElement>('.dialog__missing')
          ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
      { injector: this.injector },
    );
  }

  private cancelRedirect(): void {
    clearTimeout(this.redirectTimer);
    this.redirectTimer = undefined;
  }

  private createQuestion(): QuestionGroup {
    return this.formBuilder.group({
      text: ['', [notBlank, Validators.maxLength(MAX_QUESTION_LENGTH)]],
      allowMultiple: [false],
      answers: this.formBuilder.array(
        Array.from({ length: MIN_ANSWERS_PER_QUESTION }, () =>
          this.formBuilder.control('', [notBlank, Validators.maxLength(MAX_ANSWER_LENGTH)]),
        ),
      ),
    });
  }

  private buildSurvey(): NewSurvey {
    const { title, category, endDate, description, questions } = this.form.getRawValue();
    return {
      title: title.trim(),
      category,
      description: description.trim(),
      endDate: endDate ? parseDateInput(endDate) : null,
      questions: questions.map((question, index) => this.buildQuestion(question, index)),
    };
  }

  private buildQuestion(
    question: { text: string; allowMultiple: boolean; answers: string[] },
    index: number,
  ): Question {
    return {
      id: `q${index + 1}`,
      text: question.text.trim(),
      allowMultiple: question.allowMultiple,
      answers: question.answers.map((text, answerIndex) => ({
        id: `a${answerIndex + 1}`,
        text: text.trim(),
      })),
    };
  }
}
