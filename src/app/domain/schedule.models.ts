import { VersionedRecord } from './academic.models';
export type TeachingKind = 'lecture' | 'exercise';
export type Attendance = 'unmarked' | 'present' | 'absent';
export interface TemplateInput {
  courseId: string;
  kind: TeachingKind;
  weekday: number;
  startsAt: string;
  endsAt: string;
  location: string | null;
  validFrom: string;
  validUntil: string;
}
export interface ScheduleTemplate extends TemplateInput, VersionedRecord {}
export interface SessionInput {
  courseId: string;
  templateId: string | null;
  scheduledOn: string;
  startsAt: string;
  endsAt: string;
  kind: TeachingKind;
  location: string | null;
  isCancelled: boolean;
  attendance: Attendance;
  replacementForId: string | null;
}
export interface Session extends SessionInput, VersionedRecord {}
export interface Occurrence extends SessionInput {
  id: string;
  revision: number | null;
}
