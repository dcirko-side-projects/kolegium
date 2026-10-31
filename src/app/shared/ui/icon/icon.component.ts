import { Component, input } from '@angular/core';

const iconPaths = {
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  calendar:
    'M8 2v4m8-4v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  check: 'm7 12 3 3 7-7M21 12a9 9 0 1 1-6-8.5',
  book: 'M12 5v16M3 3l9 2 9-2v16l-9 2-9-2Z',
  clipboard:
    'M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3M9 2h6v4H9Zm-1 9h8m-8 5h5',
  folder: 'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
  list: 'm3 6 1 1 2-2m-3 8 1 1 2-2m-3 8 1 1 2-2M10 6h11m-11 7h11m-11 7h11',
  cap: 'm2 9 10-6 10 6-10 6Zm4 3v6c4 3 8 3 12 0v-6m4-3v8',
  wallet: 'M20 8H5a2 2 0 0 1 0-4h14v4M5 8H3v11a2 2 0 0 0 2 2h15V8Zm11 5h6v4h-6Z',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  grid: 'M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
} as const;

export type IconName = keyof typeof iconPaths;

@Component({
  selector: 'app-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="paths[name()]" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 22px;
      height: 22px;
      flex: 0 0 auto;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  protected readonly paths = iconPaths;
}
