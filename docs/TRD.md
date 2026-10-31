# Technical Requirements Document

31.10.2026. — FR-018 obrasci koriste native modal i mobile bottom sheet s focus trap/povratom fokusa, dirty/pending zaštitom i vidljivim greškama/offline/konfliktom. Nova tamna paleta i PWA boje prema DESIGN_SYSTEM. FR-013 i FR-004 dijele activeRows iz istog ScheduleStore snapshot-a; sat Europe/Zagreb osvježava se i pri focus/visibility događaju nakon buđenja. Ručni .ics izvoz ostaje jedina vanjska calendar mogućnost prema posljednjoj korisnikovoj odluci, bez Microsoft API-ja ili promjene auth/data ugovora.


23.10.2026. — lokalni emulator adapter koristi forced long-polling/5s idle timeout nakon ponovljivih WebKit/Windows stream zastoja pri reloadu. Produkcijski transport/cache/authorization ostaju isti. Dodatni opt-in WebKit projekti imaju60s ukupni rok i10s assertion rok; višekoračni restore ima120s ukupno/60s aktivaciju. Ti testni rokovi nisu NFR-005 mjerni rezultat. Stvarni Safari/phone/cloud recovery i dalje zasebni.

Datum: 2026-10-07. Zahtjevi, ne izvještaj o provedenim provjerama.

Izvedbeni update 2026-10-08: TASK-002/003 dodaje izolirane dev/test Firebase demo projekte, server reads i revision/lock transakcije za semestre/kolegije, memory-only Firestore cache te network disable/enable pri offline/reconnect prije refresha. Firebase SDK 12.19.0 podržava Node 22 baseline. Production ostaje zatvoren i bez clouda. Aktualni dokazi su u CURRENT_STATE; dependency i bundle upozorenja u DEPENDENCY_REVIEW nisu puni release PASS.

## 1. Objectives i skala

Jedan korisnik, dva ili više vlastitih uređaja, nekoliko kolegija po semestru i višegodišnja tekstualna evidencija. Nema zahtjeva za enterprise SLA ili velikim prometom. App dostupna preko interneta neovisno o računalu korisnika.

## 2. Technical requirements

| ID | Zahtjev | Acceptance |
|---|---|---|
| TFR-001 | Angular/TypeScript responsive PWA | Browser i instalirani prikaz, hrvatski UI |
| TFR-002 | Firebase Google Auth i Rules | Odbijeni neprijavljeni/drugi UID, validirani zapisi |
| TFR-003 | Cloud Firestore persistence | Server-confirmed spremanje; refresh između uređaja |
| TFR-004 | Concurrency i idempotentnost | Revision provjera; duplikat klika nije novi dolazak |
| TFR-005 | Konzistentan backup/povrat | Validacija, izolirana staging kopija i atomarna promjena aktivne kopije |
| TFR-006 | Deterministički izračuni | Isti ulazi daju iste rezultate; nedostajuća pravila ne daju ocjenu |

## 3. Non-functional requirements

- NFR-001 / MUST: online-only mutacije. Persistent offline Firestore cache/write queue nije dio MVP-a. Povrat veze zahtijeva server refresh.
- NFR-002 / MUST: datumi rokova kao kalendarski datumi, nastava Europe/Zagreb; DST testovi.
- NFR-003 / MUST: WCAG 2.2 AA cilj, keyboard, focus, labels, kontrast, reduced motion. Formalna certifikacija nije obećana.
- NFR-004 / MUST: testirati aktualne stabilne Chrome Android, Safari iOS, Edge/Chrome Windows pri releaseu, browser i instalirani PWA. Emulacija nije fizički device dokaz.
- NFR-005 / cilj: na reprezentativnom mid-range telefonu osnovni prikaz uporabiv unutar 3 s na dobroj mreži; loading feedback odmah, cilj <150 ms. To su mjerljivi release ciljevi, ne izmjereni rezultati.
- NFR-006 / MUST: list query po potrebnom semestru/datumu; nema učitavanja sve povijesti na Početnoj. Ograničiti listenere i ugasiti ih nakon izlaska.
- NFR-007 / MUST: nema silent loss pri konkurentnoj izmjeni/povratu; oporavak nakon prekida.
- NFR-008 / MUST: preferirano 0 EUR, ukupno najviše 5 EUR/mjesečno. Početno Spark; plaćeni plan zahtijeva procjenu i korisnikovu odluku. Budget alert nije hard cap.
- NFR-009 / MUST: export/povrat lokalnom datotekom, bez auth tokena; backups korisnik čuva privatno. Odabrani tehnički limit 5 MiB po importu, do 10.000 zapisa; UI odbija veće uz poruku, ne skraćuje. Limit preispitati ako reprezentativna evidencija ne stane.

## 4. Integrations i okruženja

Samo Firebase Auth/Firestore/Hosting. TVZ materijali su ručno dostavljeni izvori, bez scraper/integracije. Local: Auth/Firestore emulator sa sintetičkim podacima. Production: korisnikov Spark projekt; nema zasebnog staging cloud projekta u početnom MVP-u, staging testovi na emulatoru i Hosting preview bez stvarnih podataka kada je potrebno.

## 5. Gates

Formatter, lint, TypeScript/template checks, Vitest unit/component, emulator integration/Rules, Playwright kritični browser tokovi i production build. Stvarni OAuth/PWA/device/recovery smoke odvojeni release dokazi. CI odabir GitHub Actions ako korisnik odobri remote repository; lokalni scriptovi rade istu provjeru bez GitHuba.

## 6. Open boundaries

Pravila kolegija, stvarni podaci i obračunski izbor pokušaja nedostaju. Angular/Node/TypeScript/tooling kompatibilnost i pinned verzije verificirane su u TASK-001, vidjeti CODE_STYLE/package.json. Firebase SDK pinanje i emulator konfiguracija pripadaju TASK-002. Cloud projekt/UID/regija postavljaju se pri deploy pripremi; lokaciju EU provjeriti prije nepovratnog kreiranja baze.

## TASK-004/005 lokalna provedba

Date-bound server queries, paging i vidljivi safety limiti sprječavaju tiho trunciranje dolaznosti. Pending mutations koordinirane su globalno; RAM draft nije offline queue. Desktop/mobile Chromium viewport testovi odvojeni su od fizičkog Android/iPhone, Safari, real OAuth i cloud index dokaza, koji ostaju NOT RUN.

## TASK-008/009

Početna čita samo open/date-bound stranice uz 50-item paging i archive parent checks, ne sve povijesne entitete. Exact grading koristi integer scale 10.000, unknown/config/selection states i official separation. Real TVZ FR-015 acceptance čeka TASK-009C. Nema cloud/device readiness tvrdnje na temelju sintetičke konfiguracije.
