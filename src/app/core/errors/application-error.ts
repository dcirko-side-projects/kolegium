export type ErrorCategory =
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'offline'
  | 'quotaExceeded'
  | 'unavailable'
  | 'restoreInProgress'
  | 'invalidBackup'
  | 'unsupportedSchema';
export class ApplicationError extends Error {
  constructor(
    readonly category: ErrorCategory,
    message: string,
    readonly serverRecord?: unknown,
  ) {
    super(message);
  }
}
export function asApplicationError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) return error;
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (code.includes('permission-denied'))
    return new ApplicationError(
      'forbidden',
      'Korisnički račun nema dopušten pristup ili zapis ne zadovoljava sigurnosna pravila.',
    );
  if (code.includes('unauthenticated') || code.includes('user-token-expired'))
    return new ApplicationError('unauthenticated', 'Prijava je istekla. Prijavi se ponovno.');
  if (code.includes('resource-exhausted'))
    return new ApplicationError(
      'quotaExceeded',
      'Dosegnuto je ograničenje usluge. Pokušaj ponovno kasnije.',
    );
  if (code.includes('unavailable') || code.includes('network-request-failed'))
    return new ApplicationError(
      'unavailable',
      'Spremanje ili dohvat nije potvrđen. Provjeri vezu i pokušaj ponovno.',
    );
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request'))
    return new ApplicationError('unavailable', 'Prijava nije dovršena. Pokušaj ponovno.');
  return new ApplicationError(
    'unavailable',
    'Radnja nije potvrđena. Tvoj unos ostaje sačuvan; pokušaj ponovno.',
  );
}
