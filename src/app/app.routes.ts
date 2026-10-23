import { Routes } from '@angular/router';
import { navigationItems } from './core/navigation/navigation';
import { authGuard } from './core/auth/auth.guard';
import { unsavedChangesGuard } from './core/forms/unsaved-changes.service';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Prijava | Kolegium',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/app-shell.component').then((m) => m.AppShellComponent),
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Početna | Kolegium',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/overview/overview.component').then((m) => m.OverviewComponent),
      },
      {
        path: 'sections',
        title: 'Sve sekcije | Kolegium',
        loadComponent: () =>
          import('./features/sections/sections.component').then((m) => m.SectionsComponent),
      },
      ...navigationItems
        .filter(
          (item) =>
            ![
              '/',
              '/courses',
              '/settings',
              '/schedule',
              '/attendance',
              '/assessments',
              '/projects',
              '/todo',
              '/thesis',
              '/installments',
              '/reminders',
            ].includes(item.path),
        )
        .map((item) => ({
          path: item.path.slice(1),
          title: `${item.label} | Kolegium`,
          data: { heading: item.label, description: item.description, icon: item.icon },
          loadComponent: () =>
            import('./shared/ui/section-preview/section-preview.component').then(
              (m) => m.SectionPreviewComponent,
            ),
        })),
      ...['assessments', 'projects'].flatMap((path) =>
        [path, path + '/:id'].map((entry) => ({
          path: entry,
          title: (path === 'assessments' ? 'Kolokviji i ispiti' : 'Projekti') + ' | Kolegium',
          data: { workKind: path },
          canDeactivate: [unsavedChangesGuard],
          loadComponent: () =>
            import('./features/work/work-items.component').then((m) => m.WorkItemsComponent),
        })),
      ),
      {
        path: 'reminders',
        title: 'Podsjetnici | Kolegium',
        loadComponent: () =>
          import('./features/reminders/reminders.component').then((m) => m.RemindersComponent),
      },
      {
        path: 'installments',
        title: 'Rate fakulteta | Kolegium',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/installments/installments.component').then(
            (m) => m.InstallmentsComponent,
          ),
      },
      {
        path: 'todo',
        title: 'To-do | Kolegium',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/todo/tasks.component').then((m) => m.TasksComponent),
      },
      {
        path: 'thesis',
        title: 'Diplomski | Kolegium',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/thesis/thesis.component').then((m) => m.ThesisComponent),
      },
      {
        path: 'settings',
        title: 'Postavke | Kolegium',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/semesters/semesters.component').then((m) => m.SemestersComponent),
      },
      {
        path: 'schedule',
        title: 'Raspored | Kolegium',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/schedule/schedule.component').then((m) => m.ScheduleComponent),
      },
      {
        path: 'attendance',
        title: 'Dolaznost | Kolegium',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/attendance/attendance.component').then((m) => m.AttendanceComponent),
      },
      {
        path: 'courses',
        title: 'Kolegiji | Kolegium',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/courses/courses.component').then((m) => m.CoursesComponent),
      },
      {
        path: 'courses/:id',
        title: 'Kolegij | Kolegium',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/courses/course-detail.component').then((m) => m.CourseDetailComponent),
      },
      {
        path: '**',
        title: 'Stranica nije pronađena | Kolegium',
        loadComponent: () =>
          import('./shared/ui/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
