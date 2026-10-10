# Kolegium — radni naziv

Osobna aplikacija za organizaciju fakultetskih obaveza: nastava, dolaznost, kolegiji, provjere, projekti, To-do, diplomski i rate.

Radni naziv izveden je iz workspacea; konačan naziv/branding nije potvrđen. UI je hrvatski.

## Status

TASK-001–010 imaju lokalnu implementaciju: responsive shell, Firebase Auth/Firestore emulator, privatni pristup, semestri, kolegiji, informacije/linkovi, arhiva, dan/tjedan raspored, iznimke i odvojena dolaznost predavanja/vježbi. Početna prikazuje današnju nastavu s brzim unosom. Spremanje potvrđuje server; zastarjele izmjene ne prepisuju noviji zapis. Provjere znanja imaju povijest svih pokušaja s opcionalnim bodovima/ocjenom; projekti, jedna To-do lista i osnovni diplomski dijele iste zadatke. Rezultati su vidljivi i na kolegiju bez kopiranja; obračun na kolegiju koristi odabrane canonical pokušaje. Rate, objedinjena Početna i generičko bodovanje sada su lokalno implementirani. Bodovanje zahtijeva potvrđenu konfiguraciju i eksplicitni izbor; stvarna pravila čekaju TASK-009C. Produkcijski Firebase projekt, pravi Google OAuth i objava još nisu konfigurirani. Stvarno stanje i granice provjera: [CURRENT_STATE](docs/CURRENT_STATE.md).

## Potvrđeni stack

Angular + TypeScript, responsive PWA, Firebase Authentication (Google), Cloud Firestore i Firebase Hosting. Online MVP za Android, iPhone i Windows. Jedan odobren korisnički UID. Preferirano besplatno; ukupan prihvatljiv trošak do 5 EUR mjesečno. Početni plan Spark.

## Dokumentacija

| Dokument | Odgovornost |
|---|---|
| [AGENTS](AGENTS.md) | Workflow i pravila budućih agenata |
| [PRD](docs/PRD.md) | Scope, zahtjevi i domain ponašanje |
| [APP_FLOW](docs/APP_FLOW.md) | Ekrani, navigacija i tokovi |
| [TRD](docs/TRD.md) | Tehnički zahtjevi i quality gates |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Komponente, granice i data flow |
| [DATABASE](docs/DATABASE.md) | Firestore ugovori, operacije, backup i concurrency |
| [DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md) | Tokeni, reusable UI i pristupačnost |
| [SECURITY](docs/SECURITY.md) | Pristup i sigurnosna pravila |
| [CODE_STYLE](docs/CODE_STYLE.md) | Coding konvencije i alati |
| [TESTING](docs/TESTING.md) | Test strategija i acceptance scenariji |
| [DEPLOYMENT](docs/DEPLOYMENT.md) | Okruženja, objava, kvote i recovery |
| [DECISIONS](docs/DECISIONS.md) | ADR index |
| [CONSISTENCY_AUDIT](docs/CONSISTENCY_AUDIT.md) | Provjera dokumentacije i otvorene odluke |
| [IMPLEMENTATION_PLAN](docs/IMPLEMENTATION_PLAN.md) | Dependency roadmap nakon audita |
| [CURRENT_STATE](docs/CURRENT_STATE.md) | Implementacijska stvarnost |
| [DOCUMENTATION_PLAN](docs/DOCUMENTATION_PLAN.md) | Odabir dokumentacije |
| [Attendance spec](docs/features/attendance.md) | Ciljana specifikacija dolaznosti |
| [Grading spec](docs/features/grading.md) | Ciljana specifikacija bodovanja |
| [ADR template](docs/templates/ADR_TEMPLATE.md) | Izvorni template odluka |
| [Feature template](docs/templates/FEATURE_SPEC_TEMPLATE.md) | Izvorni feature template |

Nema vlastitog HTTP API-ja; podatkovni ugovori su u DATABASE.md. [DISCOVERY_NOTES](DISCOVERY_NOTES.md) čuva razgovorne odluke, ali finalni domain ugovor je PRD. [DOCUMENTATION_PLAN](docs/DOCUMENTATION_PLAN.md) objašnjava odabir dokumenata.

## Pokretanje

Preduvjeti: Node 22.x, najmanje 22.13 (verificirano 22.20.0), npm 11 i Java JDK 21. Emulator script koristi JAVA_HOME ili instalirani Windows jdk-21. Angular runtime 21.2.25, CLI/build 21.2.26, TypeScript 5.9.3 i Firebase SDK 12.19.0 zaključani su u package.json/package-lock.json. [Angular kompatibilnost](https://angular.dev/reference/versions).

Instalacija iz lockfilea kroz npm 11.21.0, bez promjene globalnog npm-a:

```powershell
npm.cmd exec --yes --package=npm@11.21.0 -- npm ci
npm.cmd run emulators:start
```

U drugom terminalu:

```powershell
npm.cmd run auth:seed
npm.cmd run start
```

Otvori http://127.0.0.1:4200 i odaberi **Prijava testnim Google računom**. Seed stvara samo sintetički login račun, bez kolegija. Semestar dodaj u Postavkama, postavi ga kao aktualni, zatim dodaj kolegije. Lokalni demo koristi Auth 9099 i Firestore 8080; nema veze s cloud projektom. Za mobitel ovo nije javno dostupan app; objava je zaseban korak.

Prvo pokretanje preuzima emulator JAR. Pri urednom Ctrl+C emulator izvozi lokalne podatke u ignorirani `.emulator-data`, a iduće pokretanje ih uvozi. Naglo zatvaranje procesa može izgubiti izmjene nakon zadnjeg izvoza; to nije FR-017 backup. `.emulator-data` može sadržavati osobne podatke pa ga ne commitati. Production build koristi zatvorenu, nekonfiguriranu konfiguraciju i deny-all production Rules.

Provjere:

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd test
```

Rules/integration/browser testovi koriste zaseban, potrošan projekt `demo-kolegium-tests` (Auth 19099, Firestore 18080), nikad dev podatke. U odvojenim terminalima pokreni `npm.cmd run emulators:test` i `npm.cmd run start:e2e` (HTTP 4300). Zatim, sekvencijalno jer testovi prazne istu testnu bazu:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.playwright-browsers'
npx.cmd playwright install chromium
npm.cmd run test:rules
npm.cmd run test:integration
npm.cmd run test:e2e
```

Za drugi HTTP port postavi `KOLEGIUM_E2E_URL`, ali app mora koristiti e2e konfiguraciju. Browser fixture provjerava project ID prije resetiranja. Playwright ima desktop i mobile viewport; nije dokaz fizičkog Androida/iPhonea. Snimke akademskih ekrana nastaju kroz `node scripts/capture-academic.mjs` na testnom appu (ignorirani artifacts/academic). Ikone su reproducibilne kroz `node scripts/generate-icons.mjs`.

Test runner automatski koristi lokalni `.angular/tmp` zbog Windows sandbox Vitest cache rename ograničenja. Manifest/ikone postoje; service worker, offline rad i PWA install/update još nisu implementirani. Pregled ovisnosti i preostalih razvojnih upozorenja: [DEPENDENCY_REVIEW](docs/DEPENDENCY_REVIEW.md).

## Radni proces

Pročitaj AGENTS i CURRENT_STATE, provjeri scope, napravi malu promjenu prema roadmapu, pokreni relevantne provjere i ažuriraj dokumentaciju. Commit/push/deploy samo kada korisnik to odobri. Planning odobrenje ne aktivira plaćene usluge.

## Otvoreni ulazni podaci

Korisnik će dostaviti stvarne kolegije, raspored i pravila dolaznosti/bodovanja. Primjeri i testovi do tada koriste isključivo označene sintetičke podatke. License i konačan naziv nisu odlučeni; projekt je private.


## Backup, PWA i release priprema

TASK-010: Postavke → Sigurnosna kopija omogućuju export svih semestara i pokušaja, preview validirane datoteke do 5 MiB/10.000 zapisa i confirmed staged restore prema prihvaćenom ADR-004. Povrat zamjenjuje cijelu evidenciju; previous dataset ostaje za oporavak. Otvoreni klijenti moraju eksplicitno učitati novu generaciju. Backup sadržava osobne podatke; čuvaj ga privatno.

TASK-011: production build generira javni PWA service worker bez private data cachea. Instalacija/update i dalje zahtijevaju stvarni device smoke. Za lokalnu provjeru built shell-a nakon `npm run build`:

```powershell
npm.cmd run test:pwa
```

Dev/e2e ne registriraju worker. PWA nije offline sinkronizacija. TASK-012 ima pripremljen Hosting config, ali projekt još nije napravljen; produkcija ostaje zatvorena. [Release checklist](docs/RELEASE_CHECKLIST.md) bilježi konkretne korake prije objave i granice dokaza. Nema public URL-a niti samostalnog pristupa s mobitela dok se ne poveže i odobri Hosting release.
# Online testna verzija

Prva verzija objavljena po korisnikovu odobrenju: [Kolegium](https://kolegium-c8970.firebaseapp.com). Privatni kod: [dcirko/kolegium](https://github.com/dcirko/kolegium). App shell je javno dostupan; evidencija je ograničena na odobreni Google UID kroz Firestore Rules. Spark, bez aktivirane naplate ili Analyticsa. Stvarni device/private-data acceptance još otvoren; detalji u docs/CURRENT_STATE.md i docs/RELEASE_CHECKLIST.md.

Release build: `npm run release:build`, zatim `npm run test:pwa:release`. Odvojena `firebase.release.json` bira owner Rules; default build/deploy config ostaju zatvoreni. Objave isključivo po korisnikovu nalogu; nema CI auto deploya. Firebase CLI credentials i lokalni podaci ignorirani su u Gitu.

