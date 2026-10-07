import { AbstractControl, ValidationErrors } from '@angular/forms';

export function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim().length > 0 ? null : { blank: true };
}

export function notInPast(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const endOfDay = parseDateInput(control.value);
  return endOfDay > Date.now() ? null : { inPast: true };
}

export function parseDateInput(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59).getTime();
}

export function showsError(control: AbstractControl): boolean {
  return control.invalid && (control.touched || control.dirty);
}
