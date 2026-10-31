import { IconName } from '../../shared/ui/icon/icon.component';

export interface NavigationItem {
  readonly path: string;
  readonly label: string;
  readonly description: string;
  readonly icon: IconName;
}

export const navigationItems: readonly NavigationItem[] = [
  { path: '/', label: 'Početna', description: 'Tvoj dan i nadolazeće obaveze.', icon: 'home' },
  {
    path: '/schedule',
    label: 'Raspored',
    description: 'Nastava danas i kroz tjedan.',
    icon: 'calendar',
  },
  {
    path: '/attendance',
    label: 'Dolaznost',
    description: 'Predavanja i vježbe po kolegiju.',
    icon: 'check',
  },
  {
    path: '/courses',
    label: 'Kolegiji',
    description: 'Informacije, uvjeti i rezultati kolegija.',
    icon: 'book',
  },
  {
    path: '/assessments',
    label: 'Kolokviji i ispiti',
    description: 'Termini provjera i svi tvoji pokušaji.',
    icon: 'clipboard',
  },
  {
    path: '/projects',
    label: 'Projekti',
    description: 'Projektne obaveze, rokovi i zadaci.',
    icon: 'folder',
  },
  { path: '/todo', label: 'To-do', description: 'Svi zadaci na jednom mjestu.', icon: 'list' },
  {
    path: '/thesis',
    label: 'Diplomski',
    description: 'Tema, mentor i tvoji sljedeći koraci.',
    icon: 'cap',
  },
  {
    path: '/installments',
    label: 'Rate fakulteta',
    description: 'Iznosi, rokovi i evidencija plaćanja.',
    icon: 'wallet',
  },
  {
    path: '/reminders',
    label: 'Podsjetnici',
    description: 'Rokovi, nastava i podsjetnici za kalendar mobitela.',
    icon: 'bell',
  },
  {
    path: '/settings',
    label: 'Postavke',
    description: 'Semestri, sigurnosna kopija i pristup.',
    icon: 'settings',
  },
];

export const mobileNavigationItems: readonly NavigationItem[] = [
  navigationItems[0],
  navigationItems[1],
  navigationItems[6],
  {
    path: '/sections',
    label: 'Sve sekcije',
    description: 'Sva područja aplikacije.',
    icon: 'grid',
  },
];
