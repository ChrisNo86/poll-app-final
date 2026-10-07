import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  increment,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Observable } from 'rxjs';

import { FIREBASE_CONFIG } from '../../environments/firebase.config';
import { SURVEYS_COLLECTION, VOTED_STORAGE_KEY } from '../models/survey.constants';
import { NewSurvey, Selection, Survey } from '../models/survey.model';
import { buildVoteKey } from '../utils/vote-key.util';
import { createSeedSurveys } from './survey-seed';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly database: Firestore = getFirestore(initializeApp(FIREBASE_CONFIG));

  watchSurveys(): Observable<Survey[]> {
    return new Observable<Survey[]>((subscriber) =>
      onSnapshot(
        collection(this.database, SURVEYS_COLLECTION),
        (snapshot) =>
          subscriber.next(snapshot.docs.map((entry) => this.toSurvey(entry.id, entry.data()))),
        (error) => subscriber.error(error),
      ),
    );
  }

  watchSurvey(surveyId: string): Observable<Survey | null> {
    return new Observable<Survey | null>((subscriber) =>
      onSnapshot(
        doc(this.database, SURVEYS_COLLECTION, surveyId),
        (snapshot) =>
          subscriber.next(snapshot.exists() ? this.toSurvey(snapshot.id, snapshot.data()) : null),
        (error) => subscriber.error(error),
      ),
    );
  }

  async createSurvey(survey: NewSurvey): Promise<string> {
    const payload = { ...survey, createdAt: Date.now(), votes: {} };
    const reference = await addDoc(collection(this.database, SURVEYS_COLLECTION), payload);
    return reference.id;
  }

  async submitVotes(surveyId: string, selection: Selection): Promise<void> {
    const updates: Record<string, unknown> = {};
    Object.entries(selection).forEach(([questionId, answerIds]) =>
      answerIds.forEach(
        (answerId) => (updates[`votes.${buildVoteKey(questionId, answerId)}`] = increment(1)),
      ),
    );
    await updateDoc(doc(this.database, SURVEYS_COLLECTION, surveyId), updates);
    this.markAsVoted(surveyId);
  }

  hasVoted(surveyId: string): boolean {
    return this.readVotedIds().includes(surveyId);
  }

  async seedIfEmpty(): Promise<void> {
    const collectionRef = collection(this.database, SURVEYS_COLLECTION);
    const existing = await getDocs(query(collectionRef, limit(1)));
    if (!existing.empty) {
      return;
    }
    await Promise.all(
      createSeedSurveys().map(({ id, ...data }) =>
        setDoc(doc(this.database, SURVEYS_COLLECTION, id), data),
      ),
    );
  }

  private toSurvey(id: string, data: Record<string, unknown>): Survey {
    return { votes: {}, description: '', endDate: null, ...data, id } as Survey;
  }

  private markAsVoted(surveyId: string): void {
    const voted = [...this.readVotedIds(), surveyId];
    localStorage.setItem(VOTED_STORAGE_KEY, JSON.stringify(voted));
  }

  private readVotedIds(): string[] {
    const raw = localStorage.getItem(VOTED_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  }
}
