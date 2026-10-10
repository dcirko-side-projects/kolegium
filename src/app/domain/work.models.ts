import { VersionedRecord } from './academic.models';
export type AssessmentType = 'quiz' | 'exam' | 'oral' | 'defense' | 'other';
export interface AssessmentInput {
  courseId: string;
  name: string;
  type: AssessmentType;
  scheduledOn: string;
  scheduledAt: string | null;
  isCompleted: boolean;
}
export interface Assessment extends VersionedRecord, AssessmentInput {}
export interface ProjectInput {
  courseId: string | null;
  name: string;
  dueOn: string | null;
  isCompleted: boolean;
  isArchived: boolean;
}
export interface Project extends VersionedRecord, ProjectInput {}
export interface TaskContext {
  type: 'none' | 'course' | 'project' | 'thesis';
  id: string | null;
}
export interface TaskInput {
  title: string;
  dueOn: string | null;
  isCompleted: boolean;
  context: TaskContext;
}
export interface Task extends VersionedRecord, TaskInput {}
export interface ThesisInput {
  topic: string | null;
  mentor: string | null;
  information: string;
}
export interface Thesis extends VersionedRecord, ThesisInput {}
export type ResultSource = 'assessment' | 'project' | 'lecture' | 'exercise';
export interface ScoreActivityInput {
  courseId: string | null;
  name: string;
  source: { type: ResultSource; id: string | null };
  componentKey: string | null;
  maxPoints: string | null;
  minimumPoints: string | null;
}
export interface ScoreActivity extends VersionedRecord, ScoreActivityInput {}
export interface ScoreAttemptInput {
  activityId: string;
  attemptNumber: number;
  takenOn: string | null;
  points: string | null;
  grade: string | null;
}
export interface ScoreAttempt extends VersionedRecord, ScoreAttemptInput {}
