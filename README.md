# Kolegium — radni naziv

Osobna aplikacija za organizaciju fakultetskih obaveza: nastava, dolaznost, kolegiji, provjere, projekti, To-do, diplomski i rate.

Radni naziv izveden je iz workspacea; konačan naziv/branding nije potvrđen. UI je hrvatski.

## Status

Nastavak 19.10.2026.: teme FoodLoop/PHP/Bihevioralno i budući raspored ažurirani su u cloudu uz backup i puni readback. Evidencija sada ima 188 termina uključujući sačuvane otkazane zapise i 5 projekata. Dovršeno je lazy učitavanje privatnog podatkovnog sloja i početno skrivanje otkazanih termina; paralelni redizajn ostaje sačuvan. Korisnik je u zasebnom radu odobrio Hosting objavu cijelog frontenda 19.10. [FINAL_ACCEPTANCE](docs/FINAL_ACCEPTANCE.md) navodi završne korisničke provjere; [CURRENT_STATE](docs/CURRENT_STATE.md) daje točne dokaze i granice.

Aktualni checkpoint 2026-10-18: online testna aplikacija već postoji, source i upute prenose se korisnikovim nalogom u privatni GitHub. Raspored (5 kolegija/174 termina), četiri rate i informacije/projekti iz nastavnih izvora već su u cloudu. Korisnik je potvrdio fazu Google prijave/pregleda; sljedeća je cross-device provjera spremanja. Podsjetnici su odgođeni, dio njihova koda postoji samo lokalno/u sourceu. Za novi laptop prvo [NEW_LAPTOP_SETUP](docs/NEW_LAPTOP_SETUP.md) i [NEXT_CHAT_PROMPT](docs/NEXT_CHAT_PROMPT.md). Stariji statusni odlomci ispod prikazuju prethodne faze; aktualni autoritet je CURRENT_STATE.

TASK-001–010 imaju lokalnu implementaciju: responsive shell, Firebase Auth/Firestore adapteri i emulatore, privatni pristup, semestre/kolegije/arhivu, raspored/ICS/iznimke, odvojenu dolaznost, provjere sa svim pokušajima, projekte, jednu To-do listu, osnovni diplomski, rate, objedinjenu Početnu, generičko bodovanje i backup/restore. Spremanje potvrđuje server, a zastarjele izmjene ne prepisuju noviji zapis. Cloud projekt i odvojena testna release verzija već postoje; korisnik je potvrdio prijavu/pregled na svojim uređajima. Cross-device writes/recovery i drugi završni gates ostaju otvoreni. Dio stvarnih pravila iz izvora je poznat, ali puni obračun i dalje čeka nepotpune ugovore TASK-009C. Stvarno stanje i granice provjera: [CURRENT_STATE](docs/CURRENT_STATE.md).

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
| [NEW_LAPTOP_SETUP](docs/NEW_LAPTOP_SETUP.md) | Clone, okruženje i kontekst za novi laptop |
| [NEXT_CHAT_PROMPT](docs/NEXT_CHAT_PROMPT.md) | Početna uputa za nastavak bez starog razgovora |
| [COURSE_SOURCE_REVIEW](docs/COURSE_SOURCE_REVIEW.md) | Izvori kolegija, potvrđena pravila i otvorene nejasnoće |
| [DOCUMENTATION_PLAN](docs/DOCUMENTATION_PLAN.md) | Odabir dokumentacije |
| [Attendance spec](docs/features/attendance.md) | Ciljana specifikacija dolaznosti |
| [Grading spec](docs/features/grading.md) | Ciljana specifikacija bodovanja |
| [ADR template](docs/templates/ADR_TEMPLATE.md) | Izvorni template odluka |
| [Feature template](docs/templates/FEATURE_SPEC_TEMPLATE.md) | Izvorni feature template |

Nema vlastitog HTTP API-ja; podatkovni ugovori su u DATABASE.md. [DISCOVERY_NOTES](DISCOVERY_NOTES.md) čuva razgovorne odluke, ali finalni domain ugovor je PRD. [DOCUMENTATION_PLAN](docs/DOCUMENTATION_PLAN.md) objašnjava odabir dokumenata.

## Pokretanje

Preduvjeti: Node 22.x, najmanje 22.22.2 (verificirano 22.23.3), npm 11 i Java JDK 21. Emulator script koristi JAVA_HOME ili instalirani Windows jdk-21. Angular runtime 21.2.25, CLI/build 21.2.28, TypeScript 5.9.3 i Firebase SDK 12.19.0 zaključani su u package.json/package-lock.json. [Angular kompatibilnost](https://angular.dev/reference/versions).

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

Za dodatnu WebKit provjeru na Windowsu (nije fizički Safari/iPhone dokaz), uz isti pokrenuti testni app/emulatore:

Lokalni Firestore adapter koristi long-polling/5s idle odgovore radi WebKit/Windows kompatibilnosti; produkcijski transport ostaje SDK default. WebKit scenariji imaju60s ukupno/10s assertion rok; višekoračni restore120s/60s aktivaciju. Rokovi nisu mjerenje stvarne mobilne brzine. Tijekom browser runa ne uređivati aplikacijske izvore jer dev server šalje reload/HMR.

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = '.playwright-browsers'
npx.cmd playwright install webkit
$env:KOLEGIUM_E2E_WEBKIT = '1'
npm.cmd run test:e2e
Remove-Item Env:KOLEGIUM_E2E_WEBKIT
```

Za provjeru vlastite JSON kopije koristi `test:backup-file` **zasebno od svih drugih data testova**. Pokrenuti smiju biti samo testni emulatori `demo-kolegium-tests` na 18080/19099. Putanju unesi lokalno, ne šalji datoteku u chat i ne dodaj je u Git:

```powershell
$env:KOLEGIUM_BACKUP_VERIFY_FILE = 'C:\privatna-mapa\kolegium-backup.json'
npm.cmd run test:backup-file
Remove-Item Env:KOLEGIUM_BACKUP_VERIFY_FILE
```

Datoteka se validira prije pristupa emulatoru. Test resetira samo fiksni disposable testni projekt, vraća i ponovno izvozi sve zapise, provjerava prekid prije aktivacije/abort/cleanup i na kraju prazni privatni testni sadržaj. Ne koristi CLI credentials i ne može odabrati produkcijski projekt/host. Izostavljena varijabla daje neuspješan izlaz; ovo nije stvarni cloud restore.

Test runner automatski koristi lokalni `.angular/tmp` zbog Windows sandbox Vitest cache rename ograničenja. Manifest, ikone i javni-shell service worker s install/update tokovima implementirani su; stvarne native device provjere još su zaseban gate. Nema offline evidencije/write queuea. Pregled ovisnosti i preostalih razvojnih upozorenja: [DEPENDENCY_REVIEW](docs/DEPENDENCY_REVIEW.md).

## Radni proces

Pročitaj AGENTS i CURRENT_STATE, provjeri scope, napravi malu promjenu prema roadmapu, pokreni relevantne provjere i ažuriraj dokumentaciju. Commit/push/deploy samo kada korisnik to odobri. Planning odobrenje ne aktivira plaćene usluge.

## Otvoreni ulazni podaci

Stvarni raspored/kolegiji i dio nastavnih izvora već su obrađeni i upisani u cloud. Preostala nepoznata pravila dolaznosti/bodovanja i osobne teme čekaju izvore/dogovor; ne popunjavati ih pretpostavkama. Primjeri i testovi koriste isključivo označene sintetičke podatke, a privatni source materijali nisu Git fixtures. License i konačan naziv nisu odlučeni; projekt je private.


## Backup, PWA i release priprema

TASK-010: Postavke → Sigurnosna kopija omogućuju export svih semestara i pokušaja, preview validirane datoteke do 5 MiB/10.000 zapisa i confirmed staged restore prema prihvaćenom ADR-004. Povrat zamjenjuje cijelu evidenciju; previous dataset ostaje za oporavak. Otvoreni klijenti moraju eksplicitno učitati novu generaciju. Backup sadržava osobne podatke; čuvaj ga privatno.

TASK-011: production build generira javni PWA service worker bez private data cachea. Instalacija/update i dalje zahtijevaju stvarni device smoke. Za lokalnu provjeru built shell-a nakon `npm run build`:

```powershell
npm.cmd run test:pwa
```

Dev/e2e ne registriraju worker. PWA nije offline sinkronizacija. TASK-012 ima odvojeni release config i već objavljenu testnu aplikaciju na Firebase Hostingu. Zadani build/firebase.json ostaju zatvoreni. [Release checklist](docs/RELEASE_CHECKLIST.md) bilježi otvorene provjere i granice dokaza; nova objava zahtijeva zaseban nalog.
# Online testna verzija

Prva verzija objavljena po korisnikovu odobrenju: [Kolegium](https://kolegium-c8970.firebaseapp.com). Privatni kod: [dcirko/kolegium](https://github.com/dcirko-side-projects/kolegium). App shell je javno dostupan; evidencija je ograničena na odobreni Google UID kroz Firestore Rules. Spark, bez aktivirane naplate ili Analyticsa. Stvarni device/private-data acceptance još otvoren; detalji u docs/CURRENT_STATE.md i docs/RELEASE_CHECKLIST.md.

Release build: `npm run release:build`, zatim `npm run test:pwa:release`. Odvojena `firebase.release.json` bira owner Rules; default build/deploy config ostaju zatvoreni. Objave isključivo po korisnikovu nalogu; nema CI auto deploya. Firebase CLI credentials i lokalni podaci ignorirani su u Gitu.

