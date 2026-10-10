import { ApplicationError } from '../core/errors/application-error';
import { dateOnly, plainText, recordId } from './academic.validation';
import { decimalPoints, optionalText } from './work.validation';
import { CourseOutcomeInput, GradingRulesInput, InstallmentInput } from './planning.models';
import { ScoreActivity, ScoreAttempt } from './work.models';
function invalid(message: string): never {
  throw new ApplicationError('validation', message);
}
export function units(value: string): number {
  const parsed = decimalPoints(value);
  if (parsed === null) return invalid('Bodovi nisu poznati.');
  const [whole, fraction = ''] = parsed.split('.');
  return Number(whole) * 10000 + Number(fraction.padEnd(4, '0'));
}
export function formatUnits(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) return invalid('Zbroj prelazi siguran raspon.');
  const fraction = String(value % 10000)
    .padStart(4, '0')
    .replace(/0+$/, '');
  return String(Math.floor(value / 10000)) + (fraction ? '.' + fraction : '');
}
export function eurosToCents(value: string): number {
  if (!/^(0|[1-9][0-9]{0,7})([.,][0-9]{1,2})?$/.test(value))
    invalid('Iznos mora imati najviše dvije decimale.');
  const [whole, part = ''] = value.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(part.padEnd(2, '0'));
  if (cents <= 0 || cents > 1000000000)
    invalid('Iznos mora biti pozitivan i najviše 10.000.000 EUR.');
  return cents;
}
export function installmentInput(v: InstallmentInput): InstallmentInput {
  if (
    !Number.isSafeInteger(v.amountCents) ||
    v.amountCents <= 0 ||
    v.amountCents > 1000000000 ||
    typeof v.isPaid !== 'boolean'
  )
    invalid('Iznos ili status rate nije valjan.');
  return {
    name: plainText(v.name, 200, true),
    amountCents: v.amountCents,
    dueOn: dateOnly(v.dueOn),
    isPaid: v.isPaid,
  };
}
export function outcomeInput(v: CourseOutcomeInput): CourseOutcomeInput {
  return {
    officialGrade: optionalText(v.officialGrade, 200),
    officialPoints: decimalPoints(v.officialPoints),
  };
}
export function rulesInput(v: GradingRulesInput): GradingRulesInput {
  if (
    !Array.isArray(v.scale) ||
    v.scale.length > 10 ||
    !Array.isArray(v.components) ||
    v.components.length > 10 ||
    v.components.length + v.scale.length > 6 ||
    !Array.isArray(v.countedAttemptIds) ||
    v.countedAttemptIds.length > 100 ||
    typeof v.isConfirmed !== 'boolean' ||
    ![true, false, null].includes(v.projectPointsIncluded)
  )
    invalid('Pravila nisu valjana (ukupno najviše 6 komponenti i intervala te 100 izbora).');
  const components = v.components.map((c) => {
    const maxPoints = decimalPoints(c.maxPoints),
      minimumPoints = decimalPoints(c.minimumPoints);
    if (maxPoints !== null && minimumPoints !== null && units(minimumPoints) > units(maxPoints))
      invalid('Minimum komponente prelazi maksimum.');
    return { key: recordId(c.key), label: plainText(c.label, 200, true), maxPoints, minimumPoints };
  });
  if (new Set(components.map((c) => c.key)).size !== components.length)
    invalid('Ključevi komponenti moraju biti jedinstveni.');
  const scale = v.scale.map((c) => {
    const minInclusive = decimalPoints(c.minInclusive),
      maxExclusive = decimalPoints(c.maxExclusive);
    if (
      minInclusive === null ||
      (maxExclusive !== null && units(maxExclusive) <= units(minInclusive))
    )
      invalid('Interval ocjene nije valjan.');
    return { grade: plainText(c.grade, 200, true), minInclusive, maxExclusive };
  });
  for (let i = 1; i < scale.length; i++)
    if (
      scale[i - 1].maxExclusive === null ||
      units(scale[i].minInclusive) < units(scale[i - 1].maxExclusive!)
    )
      invalid('Intervali moraju biti poredani i ne smiju se preklapati.');
  const countedAttemptIds = v.countedAttemptIds.map(recordId);
  if (new Set(countedAttemptIds).size !== countedAttemptIds.length)
    invalid('Isti pokušaj odabran je više puta.');
  return {
    components,
    scale,
    countedAttemptIds,
    projectPointsIncluded: v.projectPointsIncluded,
    roundingPolicy: optionalText(v.roundingPolicy, 200),
    isConfirmed: v.isConfirmed,
  };
}
export function calculateCourse(
  courseId: string,
  activities: ScoreActivity[],
  attempts: ScoreAttempt[],
  input: GradingRulesInput | null,
  completedSources: Set<string>,
) {
  const reasons: string[] = [],
    selected = new Map<string, ScoreAttempt>();
  let total = 0,
    known = 0;
  if (!input)
    return {
      total: null as string | null,
      grade: null as string | null,
      complete: false,
      reasons: ['Pravila ocjenjivanja još nisu unesena.'],
    };
  const rules = rulesInput(input);
  if (!rules.isConfirmed) reasons.push('Pravila još nisu potvrđena prema izvoru kolegija.');
  if (rules.roundingPolicy !== 'none')
    reasons.push('Politika zaokruživanja nije podržana ili nije poznata.');
  if (!rules.components.length) reasons.push('Komponente nisu definirane.');
  if (!rules.scale.length) reasons.push('Pragovi ocjena nisu uneseni.');
  if (rules.projectPointsIncluded === null)
    reasons.push('Uključivanje projektnih bodova nije određeno.');
  const activityMap = new Map(activities.map((a) => [a.id, a])),
    attemptMap = new Map(attempts.map((a) => [a.id, a]));
  if (activityMap.size !== activities.length || attemptMap.size !== attempts.length)
    invalid('Duplicirana evidencija rezultata.');
  const componentTotals = new Map<string, number>();
  for (const id of rules.countedAttemptIds) {
    const attempt = attemptMap.get(id),
      activity = attempt && activityMap.get(attempt.activityId);
    if (!attempt || !activity || activity.courseId !== courseId)
      invalid('Odabrani pokušaj ne pripada ovom kolegiju.');
    if (selected.has(activity.id)) invalid('Odabrana su dva pokušaja iste aktivnosti.');
    if (activity.source.type === 'project' && rules.projectPointsIncluded !== true) {
      reasons.push('Odabrani projekt nije uključen potvrđenim pravilom.');
      continue;
    }
    selected.set(activity.id, attempt);
    if (attempt.points === null) {
      reasons.push('Odabrani pokušaj nema poznate bodove: ' + activity.name);
      continue;
    }
    const value = units(attempt.points);
    if (activity.maxPoints !== null && value > units(activity.maxPoints))
      invalid('Rezultat prelazi maksimum aktivnosti.');
    if (activity.minimumPoints !== null && value < units(activity.minimumPoints))
      reasons.push('Minimum aktivnosti nije dosegnut: ' + activity.name);
    total += value;
    known++;
    if (!Number.isSafeInteger(total)) invalid('Zbroj prelazi siguran raspon.');
    if (!activity.componentKey || !rules.components.some((c) => c.key === activity.componentKey))
      reasons.push('Aktivnost nema poznatu komponentu: ' + activity.name);
    else
      componentTotals.set(
        activity.componentKey,
        (componentTotals.get(activity.componentKey) ?? 0) + value,
      );
  }
  for (const activity of activities) {
    if (activity.courseId !== courseId) invalid('Aktivnost pripada drugom kolegiju.');
    if (activity.source.type === 'project' && rules.projectPointsIncluded === false) continue;
    if (!selected.has(activity.id))
      reasons.push('Obračunski pokušaj nije odabran: ' + activity.name);
    if (
      (activity.source.type === 'assessment' || activity.source.type === 'project') &&
      !completedSources.has(activity.id)
    )
      reasons.push('Aktivnost još nije označena obavljenom: ' + activity.name);
  }
  if (!activities.length) reasons.push('Nema bodovanih aktivnosti.');
  for (const c of rules.components) {
    const value = componentTotals.get(c.key);
    if (value === undefined) reasons.push('Nedostaju rezultati komponente: ' + c.label);
    if (c.maxPoints === null || c.minimumPoints === null)
      reasons.push('Uvjeti komponente nisu potpuni: ' + c.label);
    if (value !== undefined && c.maxPoints !== null && value > units(c.maxPoints))
      invalid('Zbroj prelazi maksimum komponente.');
    if (value !== undefined && c.minimumPoints !== null && value < units(c.minimumPoints))
      reasons.push('Minimum komponente nije dosegnut: ' + c.label);
  }
  const interval = rules.scale.find(
    (c) =>
      total >= units(c.minInclusive) && (c.maxExclusive === null || total < units(c.maxExclusive)),
  );
  if (!interval) reasons.push('Zbroj nije pokriven unesenim intervalima ocjena.');
  return {
    total: known ? formatUnits(total) : null,
    grade: reasons.length ? null : (interval?.grade ?? null),
    complete: reasons.length === 0,
    reasons: [...new Set(reasons)],
  };
}
