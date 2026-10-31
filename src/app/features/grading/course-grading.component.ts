import { EditorDialogComponent } from '../../shared/ui/editor-dialog/editor-dialog.component';
import { Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PlanningStoreService } from '../../core/academic/planning-store.service';
import { WorkStoreService } from '../../core/academic/work-store.service';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { ApplicationError, asApplicationError } from '../../core/errors/application-error';
import { GradingRules, CourseOutcome } from '../../domain/planning.models';
import { ScoreActivity, ScoreAttempt } from '../../domain/work.models';
import {
  calculateCourse,
  rulesInput,
  outcomeInput,
  units,
  formatUnits,
} from '../../domain/grading';
import { scoreActivityInput } from '../../domain/work.validation';
import { ResultHistoryComponent } from '../../shared/ui/results/result-history.component';
type Data = {
  activities: ScoreActivity[];
  attempts: ScoreAttempt[];
  completed: Set<string>;
  rules: GradingRules | null;
  outcome: CourseOutcome | null;
};
type ComponentValue = { key: string; label: string; maxPoints: string; minimumPoints: string };
type ScaleValue = { grade: string; minInclusive: string; maxExclusive: string };
type SelectionValue = { activityId: string; attemptId: string };
type RulesValue = {
  projectPointsIncluded: string;
  roundingPolicy: string;
  isConfirmed: boolean;
  components: ComponentValue[];
  scale: ScaleValue[];
  selections: SelectionValue[];
};
type ActivityValue = {
  name: string;
  type: string;
  componentKey: string;
  maxPoints: string;
  minimumPoints: string;
};
type OutcomeValue = { officialGrade: string; officialPoints: string };
type Draft = {
  editor: 'activity' | 'rules' | 'outcome' | null;
  activity: ActivityValue;
  rules: RulesValue;
  outcome: OutcomeValue;
  oldActivity: ScoreActivity | null;
  oldRules: GradingRules | null;
  oldOutcome: CourseOutcome | null;
  id: string;
};
@Component({
  selector: 'app-course-grading',
  imports: [EditorDialogComponent, ReactiveFormsModule, ResultHistoryComponent],
  providers: [PlanningStoreService, WorkStoreService],
  templateUrl: './course-grading.component.html',
})
export class CourseGradingComponent {
  readonly courseId = input.required<string>();
  protected readonly store = inject(PlanningStoreService);
  protected readonly work = inject(WorkStoreService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly changes = inject(UnsavedChangesService);
  protected readonly data = signal<Data | null>(null);
  protected readonly loading = signal(false);
  protected readonly opened = signal(false);
  protected readonly archived = signal(false);
  protected readonly error = signal<ApplicationError | null>(null);
  protected readonly summary = signal<ReturnType<typeof calculateCourse> | null>(null);
  protected readonly editor = signal<'activity' | 'rules' | 'outcome' | null>(null);
  protected readonly history = signal<string | null>(null);
  protected readonly activityForm = this.fb.group({
    name: '',
    type: 'exercise',
    componentKey: '',
    maxPoints: '',
    minimumPoints: '',
  });
  protected readonly outcomeForm = this.fb.group({ officialGrade: '', officialPoints: '' });
  protected readonly rulesForm = this.fb.group({
    projectPointsIncluded: '',
    roundingPolicy: '',
    isConfirmed: false,
    components: this.fb.array<ReturnType<typeof this.componentGroup>>([]),
    scale: this.fb.array<ReturnType<typeof this.scaleGroup>>([]),
    selections: this.fb.array<ReturnType<typeof this.selectionGroup>>([]),
  });
  private oldActivity: ScoreActivity | null = null;
  private oldRules: GradingRules | null = null;
  private oldOutcome: CourseOutcome | null = null;
  private id = '';
  private request = 0;
  private restored = false;
  constructor() {
    this.store.kind.set('grading');
    this.work.kind.set('results');
    const destroy = inject(DestroyRef);
    destroy.onDestroy(this.changes.register(() => this.dirty()));
    destroy.onDestroy(() => {
      this.request++;
      if (this.dirty())
        this.changes.keepDraft(this.prefix(), {
          editor: this.editor(),
          activity: this.activityForm.getRawValue(),
          rules: this.rulesForm.getRawValue(),
          outcome: this.outcomeForm.getRawValue(),
          oldActivity: this.oldActivity,
          oldRules: this.oldRules,
          oldOutcome: this.oldOutcome,
          id: this.id,
        } satisfies Draft);
    });
    effect(() => {
      const ready = this.store.academic.ready(),
        scope = this.store.academic.scope(),
        online = this.store.academic.online();
      this.store.academic.control();
      this.courseId();
      untracked(() => {
        if (ready && scope && online) {
          if (this.opened()) void this.refresh();
          if (!this.restored) {
            this.restored = true;
            const draft = this.changes.takeDraft<Draft>(this.prefix());
            if (draft) {
              this.opened.set(true);
              this.activityForm.reset(draft.activity);
              this.outcomeForm.reset(draft.outcome);
              this.setRules(draft.rules);
              this.oldActivity = draft.oldActivity;
              this.oldRules = draft.oldRules;
              this.oldOutcome = draft.oldOutcome;
              this.id = draft.id;
              this.editor.set(draft.editor);
              if (draft.editor === 'activity') this.activityForm.markAsDirty();
              if (draft.editor === 'rules') this.rulesForm.markAsDirty();
              if (draft.editor === 'outcome') this.outcomeForm.markAsDirty();
              void this.refresh();
            }
          }
        } else if (!scope) {
          this.request++;
          this.data.set(null);
          this.summary.set(null);
        }
      });
    });
  }
  private prefix() {
    return 'grading-' + this.courseId();
  }
  private dirty() {
    return this.activityForm.dirty || this.rulesForm.dirty || this.outcomeForm.dirty;
  }
  protected canWrite() {
    return (
      this.store.canWrite() && !this.loading() && (!this.archived() || this.work.archiveEditing())
    );
  }
  protected componentGroup(
    v: ComponentValue = { key: '', label: '', maxPoints: '', minimumPoints: '' },
  ) {
    return this.fb.group(v);
  }
  protected scaleGroup(v: ScaleValue = { grade: '', minInclusive: '', maxExclusive: '' }) {
    return this.fb.group(v);
  }
  private selectionGroup(v: SelectionValue) {
    return this.fb.group(v);
  }
  protected pointsDiffer() {
    const official = this.data()?.outcome?.officialPoints,
      selected = this.summary()?.total;
    return official != null && selected != null && formatUnits(units(official)) !== selected;
  }
  protected attempts(id: string) {
    return this.data()?.attempts.filter((a) => a.activityId === id) ?? [];
  }
  protected activityName(id: string) {
    return this.data()?.activities.find((a) => a.id === id)?.name ?? 'Aktivnost';
  }
  protected async refresh() {
    const scope = this.store.academic.scope();
    if (!scope || !this.store.academic.online()) return;
    this.opened.set(true);
    const request = ++this.request;
    this.loading.set(true);
    try {
      const course = await this.store.academic.getCourse(this.courseId()),
        semester = await this.store.academic.getSemester(course.semesterId),
        data = await this.store.repository().grading(scope, this.courseId());
      if (request !== this.request) return;
      this.data.set(data);
      this.archived.set(course.isArchived || semester.isArchived);
      this.summary.set(
        calculateCourse(
          this.courseId(),
          data.activities,
          data.attempts,
          data.rules,
          data.completed,
        ),
      );
      this.error.set(null);
    } catch (e) {
      if (request === this.request) this.error.set(asApplicationError(e));
    } finally {
      if (request === this.request) this.loading.set(false);
    }
  }
  protected beginActivity(row: ScoreActivity | null = null) {
    if (!this.changes.confirm()) return;
    this.resetForms();
    this.oldActivity = row;
    this.id = row?.id ?? crypto.randomUUID();
    this.activityForm.reset({
      name: row?.name ?? '',
      type: row?.source.type ?? 'exercise',
      componentKey: row?.componentKey ?? '',
      maxPoints: row?.maxPoints ?? '',
      minimumPoints: row?.minimumPoints ?? '',
    });
    if (row) this.activityForm.controls.type.disable();
    else this.activityForm.controls.type.enable();
    this.editor.set('activity');
  }
  protected beginOutcome() {
    if (!this.changes.confirm()) return;
    this.resetForms();
    this.oldOutcome = this.data()?.outcome ?? null;
    this.outcomeForm.reset({
      officialGrade: this.oldOutcome?.officialGrade ?? '',
      officialPoints: this.oldOutcome?.officialPoints ?? '',
    });
    this.editor.set('outcome');
  }
  private setRules(v: RulesValue) {
    this.rulesForm.controls.components.clear();
    this.rulesForm.controls.scale.clear();
    this.rulesForm.controls.selections.clear();
    for (const c of v.components) this.rulesForm.controls.components.push(this.componentGroup(c));
    for (const c of v.scale) this.rulesForm.controls.scale.push(this.scaleGroup(c));
    for (const c of v.selections) this.rulesForm.controls.selections.push(this.selectionGroup(c));
    this.rulesForm.patchValue({
      projectPointsIncluded: v.projectPointsIncluded,
      roundingPolicy: v.roundingPolicy,
      isConfirmed: v.isConfirmed,
    });
    this.rulesForm.markAsPristine();
  }
  protected beginRules() {
    if (!this.changes.confirm()) return;
    this.resetForms();
    this.oldRules = this.data()?.rules ?? null;
    const r = this.oldRules;
    this.setRules({
      projectPointsIncluded:
        r?.projectPointsIncluded === null || !r ? '' : String(r.projectPointsIncluded),
      roundingPolicy: r?.roundingPolicy ?? '',
      isConfirmed: r?.isConfirmed ?? false,
      components:
        r?.components.map((c) => ({
          ...c,
          maxPoints: c.maxPoints ?? '',
          minimumPoints: c.minimumPoints ?? '',
        })) ?? [],
      scale: r?.scale.map((c) => ({ ...c, maxExclusive: c.maxExclusive ?? '' })) ?? [],
      selections: this.data()!.activities.map((a) => ({
        activityId: a.id,
        attemptId:
          this.data()!.attempts.find(
            (t) => t.activityId === a.id && r?.countedAttemptIds.includes(t.id),
          )?.id ?? '',
      })),
    });
    this.editor.set('rules');
  }
  protected addComponent() {
    if (this.rulesForm.controls.components.length + this.rulesForm.controls.scale.length >= 6)
      return;
    this.rulesForm.controls.components.push(this.componentGroup());
    this.rulesForm.markAsDirty();
  }
  protected addScale() {
    if (this.rulesForm.controls.components.length + this.rulesForm.controls.scale.length >= 6)
      return;
    this.rulesForm.controls.scale.push(this.scaleGroup());
    this.rulesForm.markAsDirty();
  }
  protected removeComponent(i: number) {
    this.rulesForm.controls.components.removeAt(i);
    this.rulesForm.markAsDirty();
  }
  protected removeScale(i: number) {
    this.rulesForm.controls.scale.removeAt(i);
    this.rulesForm.markAsDirty();
  }
  private resetForms() {
    this.activityForm.reset();
    this.outcomeForm.reset();
    this.rulesForm.markAsPristine();
    this.error.set(null);
    this.store.success.set(null);
  }
  protected cancel() {
    if (!this.changes.confirm()) return;
    this.resetForms();
    this.editor.set(null);
  }
  protected async discard() {
    if (!this.changes.confirm()) return;
    this.resetForms();
    this.editor.set(null);
    await this.refresh();
  }
  protected serverDescription() {
    const r = this.error()?.serverRecord as
      | {
          revision?: number;
          name?: string;
          officialGrade?: string | null;
          officialPoints?: string | null;
        }
      | undefined;
    return r
      ? 'Revizija ' +
          r.revision +
          ' · ' +
          (r.name ?? r.officialGrade ?? 'pravila') +
          ' · ' +
          (r.officialPoints ?? '')
      : 'Osvježi prikaz za usporedbu.';
  }
  protected async submit() {
    this.error.set(null);
    this.store.success.set(null);
    try {
      if (!this.canWrite())
        throw new ApplicationError(
          'unavailable',
          'Najprije osvježi podatke ili uključi uređivanje arhive.',
        );
      await this.work.checkCourse(this.courseId());
      const scope = this.store.academic.scope()!;
      if (this.editor() === 'activity') {
        const v = this.activityForm.getRawValue(),
          type = this.oldActivity?.source.type ?? (v.type === 'lecture' ? 'lecture' : 'exercise');
        const id = this.oldActivity?.id ?? type + '_' + this.courseId() + '_' + this.id;
        const payload = scoreActivityInput({
          name: v.name,
          courseId: this.courseId(),
          source: this.oldActivity?.source ?? { type, id: null },
          componentKey: v.componentKey || null,
          maxPoints: v.maxPoints || null,
          minimumPoints: v.minimumPoints || null,
        });
        await this.store.write(() =>
          this.store
            .work()
            .saveActivity(scope, id, payload as ScoreActivity, this.oldActivity?.revision ?? null),
        );
      } else if (this.editor() === 'outcome') {
        const v = this.outcomeForm.getRawValue();
        await this.store.write(() =>
          this.store.repository().save(
            scope,
            'courseOutcomes',
            this.courseId(),
            outcomeInput({
              officialGrade: v.officialGrade || null,
              officialPoints: v.officialPoints || null,
            }),
            this.oldOutcome?.revision ?? null,
          ),
        );
      } else if (this.editor() === 'rules') {
        const v = this.rulesForm.getRawValue(),
          payload = rulesInput({
            components: v.components.map((c) => ({
              ...c,
              maxPoints: c.maxPoints || null,
              minimumPoints: c.minimumPoints || null,
            })),
            scale: v.scale.map((c) => ({ ...c, maxExclusive: c.maxExclusive || null })),
            countedAttemptIds: v.selections.map((c) => c.attemptId).filter(Boolean),
            projectPointsIncluded:
              v.projectPointsIncluded === '' ? null : v.projectPointsIncluded === 'true',
            roundingPolicy: v.roundingPolicy || null,
            isConfirmed: v.isConfirmed,
          });
        await this.store.write(() =>
          this.store
            .repository()
            .save(scope, 'gradingRules', this.courseId(), payload, this.oldRules?.revision ?? null),
        );
      }
      this.resetForms();
      this.editor.set(null);
      await this.refresh();
      this.store.success.set('Bodovanje je spremljeno i potvrđeno na poslužitelju.');
    } catch (e) {
      this.error.set(asApplicationError(e));
    }
  }
}
