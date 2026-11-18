# Kolegium

Kolegium is a personal university organizer for schedules, attendance, courses, assessments, projects, to-dos, thesis work, and tuition installments. It is an Angular and TypeScript PWA with a Croatian interface, Google sign-in through Firebase Authentication, Firestore storage, and Firebase Hosting. The hosted app uses a single approved account for academic records.

## Status

The current implementation includes semesters and courses, schedule and ICS import, attendance tracking, assessments and attempts, a project list, a to-do list, thesis tracking, installments, an overview, grading tools, and staged backup and restore. An online test version is available at [Kolegium](https://kolegium-c8970.firebaseapp.com). See [Current state](docs/CURRENT_STATE.md) for the latest verification, known gaps, and remaining device and data acceptance checks. The service worker supports the public app shell and installation. Working with academic records requires an online connection.

## Local development

Use Node.js 22.x (22.22.2 or later), npm 11, and JDK 21. The Firebase emulator startup script uses JAVA_HOME or the installed Windows JDK. Angular, TypeScript, and Firebase versions are pinned in the lockfile.

```powershell
npm.cmd exec --yes --package=npm@11.21.0 -- npm ci
npm.cmd run emulators:start
```

In another terminal:

```powershell
npm.cmd run auth:seed
npm.cmd run start
```

Open http://127.0.0.1:4200 and choose the test Google sign-in option. The seed creates a synthetic sign-in account. Add and activate a semester in Settings before adding courses. The local Auth and Firestore emulators use ports 9099 and 8080. A clean Ctrl+C exports local emulator data into the ignored .emulator-data directory for the next startup. Keep that directory private. The default production configuration denies access until explicitly configured.

## Checks

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd test
```

For integration and browser tests, start `npm.cmd run emulators:test` and `npm.cmd run start:e2e` in separate terminals. They use the disposable demo-kolegium-tests project with Auth on 19099, Firestore on 18080, and the app on 4300. Run these suites sequentially because they reset the same test database:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.playwright-browsers'
npx.cmd playwright install chromium
npm.cmd run test:rules
npm.cmd run test:integration
npm.cmd run test:e2e
```

After building, use `npm.cmd run test:pwa` for the local production shell. WebKit and private backup-file verification have separate procedures in the original setup notes linked below. Browser emulation and real-device acceptance are tracked separately.

## Backups and releases

Settings includes JSON backup export, a validated preview, and a confirmed staged restore. The restore replaces the active dataset and preserves the previous dataset for recovery. Clients need to reload the new dataset after activation. Backups contain private academic data.

The Firebase release uses a separate `firebase.release.json` and owner-only Firestore rules. The release build and PWA checks are `npm run release:build` and `npm run test:pwa:release`. See the [release checklist](docs/RELEASE_CHECKLIST.md) before releasing.

## Documentation

- [Project requirements](docs/PRD.md), [app flows](docs/APP_FLOW.md), and [technical requirements](docs/TRD.md)
- [Architecture](docs/ARCHITECTURE.md), [database](docs/DATABASE.md), and [security](docs/SECURITY.md)
- [Design system](docs/DESIGN_SYSTEM.md), [code style](docs/CODE_STYLE.md), and [testing](docs/TESTING.md)
- [Project decisions](docs/DECISIONS.md), [implementation plan](docs/IMPLEMENTATION_PLAN.md), and [deployment](docs/DEPLOYMENT.md)
- [New computer setup](docs/NEW_LAPTOP_SETUP.md) and [handoff notes](docs/NEXT_CHAT_PROMPT.md)
- [Original Croatian README with the full document index and detailed setup](https://github.com/dcirko-side-projects/kolegium/blob/00bdce9d412451a8899a4b8dd69047509c09e7ba/README.md)
