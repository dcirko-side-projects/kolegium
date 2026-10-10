# Testing Guide

Owner release priprema 2026-10-10: `npm run test:release-rules` PASS 2/2 na izoliranom demo-kolegium-tests. Kompilira stvarni Rules kandidat s potvrđenim UID-em, provjerava atomarni owner init/read, odbijanje anonymous/other/local-owner i invalid pointer/allowlist/foreign putanja; default deploy i dalje deny-all čak za ownera. Lokalna impersonacija UID-a nije real Google OAuth/cloud dokaz. Prvi direktni Vitest pokušaj stao je na Windows temp EPERM prije testova; standardni workspace TMP runner zatim prolazi. Typecheck/format i production build PASS, početni bundle 833.52 kB uz postojeći 500 kB warning. Prethodne pune suite nisu ponovno izvedene u ovom konfiguracijskom koraku.

Datum baselinea 2026-10-07. TASK-001–005 lokalne provjere izvršene su 2026-10-08/09; ostatak je strategija i budući acceptance. Točni rezultati su u CURRENT_STATE.

## 1. Strategy / tools

Pure domain: Vitest. Angular component/service: Angular TestBed + Vitest. Firebase integration i Rules: Auth/Firestore emulators + @firebase/rules-unit-testing. E2E: Playwright Chromium/WebKit; accessibility: axe u kritičnim ekranima + keyboard/manual provjera. Emulacija ne dokazuje stvarni Google OAuth ili iPhone PWA.

Birati najlakši test koji pouzdano pokriva rizik; ne svaki CRUD svim slojevima. Coverage prag nije cilj sam po sebi. Critical domain/rules/recovery invariant mora imati test.

## 2. Traceability / acceptance registry

| Test ID | FR / flow | Tip i dokaz |
|---|---|---|
| TC-001 | FR-001 / SCR-001 | Rules odbija anonymous/drugi UID; approved može dopuštene operacije; production OAuth smoke |
| TC-002 | FR-002 / FL-008 | Arhiva i promjena semestra čuvaju povijest; eksplicitni edit |
| TC-003 | FR-003 | Informacije/linkovi validirani; povezani sadržaji bez duplikata |
| TC-004 | FR-004 / FL-002 | Tjedni prikaz, validFrom/Until, DST i promjena buduće satnice ne mijenjaju recorded povijest |
| TC-005 | FR-005 / FL-001 | Mark/retry/reload = jedan dolazak; edit prije server ack; unmarked != absent |
| TC-006 | FR-006 | Odvojeni lecture/exercise counts, unknown total, minimum boundary, incomplete evidence |
| TC-007 | FR-007 | Cancel bez izostanka; ručni total/min ostaju; nadoknada zasebna |
| TC-008 | FR-008 / FL-004 | Svi pokušaji ostaju; ispravak != novi pokušaj; datum ne znači completed |
| TC-009 | FR-009 / FL-006 | Projekt course/null, linked tasks, completion ne dovršava taskove automatski |
| TC-010 | FR-010 / FL-003 | Samostalni/task konteksti, filtri, optional deadline, project course inference |
| TC-011 | FR-011 | Diplomski bez teme/mentora, dodaj i dovrši task |
| TC-012 | FR-012 / FL-007 | EUR cents, dueOn date-only, paid/reopen i nadolazeći prikaz |
| TC-013 | FR-013 | Dan/tjedan, overdue i 14-day horizon, bez učitavanja svih arhiva |
| TC-014 | FR-014 | Null vs 0, decimal parse, grade i points zasebno, unique source |
| TC-015 | FR-015 / FL-005 | Zbroj bez double count, attempt unresolved flag, missing rules => nema grade; sintetički grade boundary i kasnije stvarni kolegiji |
| TC-016 | FR-016 | Dva klijenta stale revision, concurrency conflict, root revision, mrežni prekid i quota error; nema false saved |
| TC-017 | FR-017 / FL-009 | Export revision race; invalid/oversize/schema backup; referential validation; prekid svakog restore koraka; atomic activation/recovery |
| TC-018 | FR-018 | Mobile/desktop nav, keyboard/contrast; install/logout/update na stvarnom Androidu/iPhoneu i Windowsu |

## 3. Concrete high-risk scenarios

TC-005 precondition sintetički lecture template s jednim terminom. Klik Prisutan dvaput, prekini odgovor nakon commit-a, retry i reload. Expected: jedan session, present, server revision konzistentan, točan count. Exercise evidencija ne promijeni se.

TC-015 sintetička, jasno označena pravila (nisu TVZ): aktivnosti A/B, decimal points, pragovi s inclusive lower/exclusive upper. Test exact boundary, unknown max/rules, null/0, dva pokušaja jedne aktivnosti, nedostajući counted selection, project included false/unknown. Official grade ne prepisuje se calculated. Stvarne kolegije testirati tek nakon izvora.

TC-016 dva emulator klijenta učitaju revision 3; prvi commit revision 4; drugi s expected 3 dobiva conflict i čuva lokalni input. Normalni write tijekom restore lock-a odbijen, stari dataset write nakon switch-a odbijen.

TC-017 svakog koraka test interruption (lock, staging chunks, readback, prije/poslije commit-a, cleanup). Expected: active pointer uvijek old ili potpuno new; nije mixed; abort/restart oslobađa lock; invalid file nikad ne mijenja active kopiju. Restore nakon lost response čita pointer da ne ponovi zamjenu. Cleanup nikad active/previous.

## 4. Test data i isolation

Sintetički korisnici i kolegiji, deterministic IDs i datumi. Nema privatnih stvarnih TVZ/korisnikovih podataka u fixtures. Test project demo-prefixed, emulator variables, clear data između suiteova. Unit tests bez mreže. E2E auth emuliran lokalno; odvojeni pravi OAuth smoke.

## 5. Gates i release regression

Task gates: relevant tests, lint/format/static/template/build, dokumentacijski ugovori i CURRENT_STATE. PR/CI puni scripts prema CODE_STYLE, emulator tests i kritični E2E. Nema hosted CI tvrdnje dok run nije verificiran. npm audit visok/kritičan advisory procjena, ne automatski upgrade svih dependency.

Release: auth allowed/forbidden, stvarna dolaznost write/read, drugi uređaj refresh, backup roundtrip i interruption, Rules production smoke, PWA auth/install/update na oba OS-a, accessibility i performance target iz TRD. Prijaviti točan uređaj/preglednik/verziju kada testirano.

## 6. Definition of Done

Requested behavior i FR acceptance implementirani; validation/permissions/error states; relevant tests prolaze; build/lint/static checks prolaze; documentation/current state ažurirani; nema secrets/debug artifacts. Ako stvarni podaci ili device dokaz nedostaju, navesti granicu i ne označiti taj acceptance kao verified.

Službeni izvori: [Angular Vitest testing](https://angular.dev/guide/testing), [Emulator Suite](https://firebase.google.com/docs/emulator-suite/install_and_configure).

## 7. TASK-001 foundation evidence

2026-10-08: FR-018/TC-018 foundation podskup pokriven s 4 Vitest routing testa i 9 prolaznih Playwright scenarija (1 mobile skip jer je keyboard scenario desktop). Testovi provjeravaju deep link/reload, promjenu istog preview componenta, recovery, pristup diplomskom/ratama, 320px overflow i axe WCAG 2/2.1 A/AA na tri ekrana. E2E očekuje zasebno pokrenut lokalni server; README daje stvarne naredbe. To nije auth/Rules/domain/PWA/device acceptance. Potpuni rezultati i ograničenja u CURRENT_STATE.

Windows sandbox EPERM na Vitest temp renameu razriješen je lokalnim .angular/tmp; to je environment workaround, ne izmjena domain ponašanja. Playwright upravlja samo browserima; test server je zaseban proces kako test završetak ne ovisi o Windows shell teardownu. Unit testovi ne traže mrežu ili Firebase.

## 8. TASK-002/003 evidence — 2026-10-08

- 11 unit tests (3 files): routanje/guard, sigurni linkovi, path ID, stvarni date-only datumi, nepoznato/nula i bounds dolaznosti.
- 7 Rules tests: approved/anonymous/other, atomic init, zatvoreni tipovi/nested maps/reference/revizije/datumi, archive active pointer, lock/stale dataset, buduće putanje deny i production deny-all.
- 6 SDK integration tests: istodobni init jednog prostora, forbidden init fallback, semester/course povijest i korekcija, idempotent create, stale edit i concurrent edits, offline mutation guard i null pravila.
- 21 Playwright scenarij prolazi, 1 namjerni mobile skip (keyboard test prolazi na desktopu). Novi tokovi: login/forbidden/logout, semester/course create/edit/link/reload/archive, dva nezavisna browser klijenta sa stale inputom, network disconnect/reconnect s očuvanim draftom, form axe i 320px overflow. Temeljna navigacija i deep links prolaze i s auth guardom.

| FR / TC | Lokalni dokaz | Preostala granica |
|---|---|---|
| FR-001 / TC-001 | Mock Google adapter, persistence/reload, forbidden/anonymous Rules, UI guard i logout | Pravi Google OAuth, session expiry/revocation i Safari redirect nisu stvarno provjereni |
| FR-002 / TC-002 | Semestri, aktualni kontekst, arhiva sa sačuvanim kolegijima i eksplicitna korekcija | Budući povezani feature podaci i pravi cloud/device još nisu acceptance |
| FR-003 / TC-003 | Kolegiji, plain text/linkovi, parent reference, persistence i arhiva | Rezultati/dolaznost/raspored i druge veze slijede u kasnijim taskovima |
| FR-016 / TC-016 | Server confirmation, dvije SDK/browser instance, stale revision/conflict, offline/lock deny | Quota/outage/lost-response write i real cross-device cloud nisu testirani; backup TASK-010 |
| FR-018 / TC-018 | Hrvatski responsive UI, sve sekcije, keyboard/axe/narrow viewport | Pravi uređaji, WebKit/Safari i PWA install/update nisu testirani |

`test:rules`, `test:integration`, `test:e2e` i capture-academic koriste isti izolirani disposable test projekt i moraju biti sekvencijalni. BeforeEach resetira samo testnu bazu. Dev dataset se ne prazni. Screenshot fixtures jasno su sintetičke; nema stvarnih TVZ pravila. Unit testovi bez mreže ne dokazuju SDK transaction behavior, zato postoji odvojen integration suite.


## 9. TASK-004/005 — izvršeno lokalno 2026-10-09

Ukupno: unit 19/19 (5 files), Rules 10/10 (2 files), SDK integration 11/11 (2 files), puna Playwright regresija 29 passed / 1 namjerni mobile keyboard skip (isti keyboard scenarij prolazi na desktopu). Lint/typecheck/format/build prolaze; build warning i dependency release gate ostaju u CURRENT_STATE.

| FR / TC | Dokaz | Granica |
|---|---|---|
| FR-004 / TC-004 | Recurrence weekday/date/preview/day-week, Zagreb/DST, deterministic ID i snapshot merge | Pravi TVZ raspored tek čeka podatke |
| FR-005 / TC-005 | Početna quick mark, reload, poništenje, cancel/nadoknada na oba viewporta | Fizički uređaji NOT RUN |
| FR-006 / TC-006 | Separate lecture/exercise counts, unknown/zero/minimum, canceled/future exclusion, invalid input preserved | Stvarne jedinice/uvjeti čekaju izvore |
| FR-007 / TC-007 | Future version split, recorded time preserved, recorded future block, immutable Rules | Cloud indexes NOT RUN |
| FR-016 / TC-016 | Idempotent same-payload retry/lost-ack simulation, stale server conflict, revision/root lock, offline draft | Stvarni network lost-response/cloud/provider outage NOT RUN |
| FR-018 / TC-018 | Axe forme, keyboard, 320px overflow, desktop/Pixel 7 Chromium viewport | Nije Safari/device ili WCAG certification |

Captures su sintetički testni podaci; capture helper čeka server potvrđeni aria-pressed prije navigacije. Unit/Rules/SDK/E2E su različite razine dokaza. Testovi i capture nikad ne resetiraju dev projekt.


## 10. TASK-006/007 — dokazi 2026-10-09

Unit ukupno 24 (6 files): null/zero/decimal granice, one context, optional thesis/project, real assessment date/time i stable attempt identity. Rules ukupno 13 (3 files): closed shapes, nested refs, unknown fields, canonical activity/attempt, decimal tip/granica, other/anonymous, root/lock i delete deny. SDK ukupno 18 (3 files): sve history/ispravak/lost-ack idempotency, stale server conflict, project completion/archive bez task kaskade, thesis refs/offline, course consistency/canonical course view i 51-task pagination.

TC-008/FR-008: browser create/detail/reload i svi pokušaji; completion ne proizlazi iz datuma/grade.
TC-009/FR-009: projekt optional context, rezultati i isti linked task; archive/history bez cascade.
TC-010/FR-010: samostalni i povezani task, context/status filters i complete/reopen.
TC-011/FR-011: tema/mentor unknown, singleton i isti task u To-do.
TC-014/FR-014: assessment/project canonical attempts i course pregled; lecture/exercise/course outcome i izračun ostaju TASK-009.
TC-016/FR-016: two-browser stale form, server opis, offline preserved draft; real provider/cloud NOT RUN.
TC-018/FR-018: desktop/Pixel Chromium, axe forme i 320px; physical Android/iPhone/Safari NOT RUN.

Puna browser regresija i završni visual/build status u CURRENT_STATE. Nema tvrdnje o FR-015 obračunu bez pravila. Suiteovi i captures ostaju sekvencijalni na disposable demo-kolegium-tests.

## TASK-008/009 — provjere

TC-012/FR-012: exact EUR cents, decimal comma, invalid precision/zero, paid/reopen/reload, stale/conflict/offline. TC-013/FR-013: overdue bez lower bounda, 14-day upper edge i exclusion paid/completed/archive, undated open task i 51-item paging. TC-014/015: canonical manual source, history/metadata max, exact decimals, grade intervals, null/zero, duplicate/foreign attempt rejection, selection/config/rounding incomplete, separate official mismatch. TC-016/018: browser stale/offline/forms/axe/320px uz postojeću regresiju. Brojevi i stvarne granice u CURRENT_STATE; stvarni kolegiji/uređaji/OAuth/cloud NOT RUN.

## TASK-010/011 — TC-017/016/018

Pure backup envelope/graph tests: closed fields/version/size/IDs/refs, svi pokušaji uključujući unknown/zero. SDK backup suite: sve kolekcije, arhivski semestri, recorded nastava različita od current templatea, six-component/100-selection restore, concurrent export conflict, stale approval, prekid locked/uploaded/frozen/verified/beforeCommit, blocked normal write, drugi approved client abort/cleanup, freeze late-write deny, mismatched readback i lost-final-response. Active/previous protected cleanup i anonymous/other denial. Sintetički prekidi su determinističke fault-injection točke, ne dokaz svih stvarnih mrežnih/provider kvarova.

Browser backup suite: stvarno preuzeta JSON datoteka, preview/restore/reload, drugi otvoreni browser context čuva dirty input i ne smije pisati nakon promjene generacije; invalid/offline/axe/320px. Suiteovi resetiraju samo demo-kolegium-tests i izvode se sekvencijalno.

PWA production smoke `npm run test:pwa`: built unconfigured public shell, cache allowlist, auth/private endpoints izvan cachea, offline login shell, waiting worker/update i drugi tab bez automatskog reloada, sintetički install prompt adapter. Unit pokriva update guards dirty/pending/restore/offline/stale. Native browser instalacija, pravi OAuth i fizički uređaji ostaju NOT RUN. Brojevi i granice svih završnih provjera u CURRENT_STATE.
Završno unit proširenje 2026-10-10: near-5 MiB compact export/import roundtrip i kružne nadoknade. Puna regresija 49 passed/1 namjerni skip; nakon compact serialization izmjene dodatno backup browser suite 4/4 i production PWA smoke ponovno PASS. Aktualni brojevi u CURRENT_STATE.
