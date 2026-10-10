export interface VersionedRecord {
  id: string;
  revision: number;
  updatedAt: unknown;
}
export interface SemesterInput {
  name: string;
  startsOn: string;
  endsOn: string;
  isArchived: boolean;
}
export interface Semester extends VersionedRecord, SemesterInput {}
export interface CourseLink {
  label: string;
  url: string;
}
export interface AttendanceRule {
  total: number | null;
  minimum: number | null;
}
export interface CourseInput {
  semesterId: string;
  name: string;
  information: string;
  links: CourseLink[];
  isArchived: boolean;
  attendanceRules: { lecture: AttendanceRule; exercise: AttendanceRule };
}
export interface Course extends VersionedRecord, CourseInput {}
export interface Preferences extends VersionedRecord {
  activeSemesterId: string | null;
}
export interface Control {
  activeDatasetId: string;
  previousDatasetId: string | null;
  stagingDatasetId: string | null;
  restoreToken: string | null;
  dataRevision: number;
  schemaVersion: number;
  updatedAt: unknown;
}
export interface ActiveScope {
  uid: string;
  datasetId: string;
}
export const unknownAttendanceRules = (): CourseInput['attendanceRules'] => ({
  lecture: { total: null, minimum: null },
  exercise: { total: null, minimum: null },
});
