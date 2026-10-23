import { VersionedRecord } from './academic.models';
export interface InstallmentInput {
  name: string;
  amountCents: number;
  dueOn: string;
  isPaid: boolean;
}
export interface Installment extends InstallmentInput, VersionedRecord {}
export interface GradingRulesInput {
  scale: { grade: string; minInclusive: string; maxExclusive: string | null }[];
  components: {
    key: string;
    label: string;
    maxPoints: string | null;
    minimumPoints: string | null;
  }[];
  countedAttemptIds: string[];
  projectPointsIncluded: boolean | null;
  roundingPolicy: string | null;
  isConfirmed: boolean;
}
export interface GradingRules extends GradingRulesInput, VersionedRecord {}
export interface CourseOutcomeInput {
  officialGrade: string | null;
  officialPoints: string | null;
}
export interface CourseOutcome extends CourseOutcomeInput, VersionedRecord {}
export interface Deadline {
  id: string;
  name: string;
  date: string;
  route: string;
  kind: string;
  scheduledAt?: string | null;
}
