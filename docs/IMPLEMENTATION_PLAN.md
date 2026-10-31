# Implementation Roadmap

31.10.2026. — naknadni izričiti nalog „Objavi online” izvršen: Hosting-only **2d05521c7c64e5c60e82**, hosted smoke PASS. Bez Rules/data/billing/Git promjena. Raniji lokalni status ispod opisuje prethodnu fazu. Dokazi CURRENT_STATE/DEPLOYMENT.


## UX nastavak — 31.10.2026.

Korisnik izričito odobrio implementaciju redizajna, modalnih obrazaca, statusa zadataka i ispravka današnje nastave. Outlook dio naknadno sužen na ručni .ics izvoz i upute. Lokalna implementacija i primjenjivi automatizirani gateovi dovršeni; UX_REFRESH_2026-10-31.md opisuje izmjene, CURRENT_STATE donosi završne dokaze (unit52, browser71 + završni15, Rules18, SDK34, releaseRules2, UI audit100, static/build/PWA PASS). TASK-009C/device/cloud recovery gates ostaju zasebni. Ovaj nalog ne uključuje novu objavu/commit/push.


23.10.naknadno izvršenje: po korisnikovu izričitom nalogu commit00bdce9 i push postojećeg privatnog main PASS; Hosting-only08e81c515a7f1629ce7e i hosted18ruta/42assets/1440-390px smoke PASS. Release-evidence docs također commitirane/pushane. Ova konkretna objava dovršena; WebKit/native/grading/cloudrestore otvoreni gates nisu zatvoreni. Dokazi u CURRENT_STATE/DEPLOYMENT; stariji pending navodi ispod su povijest.

23.10.2026. — nastavak TASK-011/012 po nalogu „dovrši sve što možeš”: kompatibilne razvojne zakrpe (0runtime/5moderateCLI/0high/critical), skip-link tabindex0 i semantički aria-busy, pozitivno čekanje spremnosti u login helperu, deterministički početni course izbor i opt-in privatni backup sandbox provjera. Svježi root28 snapshot read-only, payload restore/export i prekid/abort/cleanup2/2PASS; nema cloud mutacije. Lokalni kandidat08e81c515a7f1629ce7e, build/PWA/static/unit/Rules/SDK dokazi u CURRENT_STATE. **WebKit reload/restore ostaje otvoren**, unatoč ciljanim prolazima i emulator-only transport poboljšanju; nije cijeli TASK-011/012 Done. Konačni Chromium run i sljedeći koraci u CURRENT_STATE. Nema novog deploy/commit/push/billing naloga.

TASK-REM-001 / TASK-ATT-002 / TASK-UI-003 —20.10.2026., **Done u odobrenom opsegu**: /reminders za pet izvora i privatni .ics izvoz s alarmima; zasebni excused s opcionalnom napomenom bez promjene službenog fonda/minimuma; course informacije po postojećim cjelinama i izvorni tekst. Zapisane faze i ograničenja dostupne u Podsjetnicima. Jednokratni cloud upis dolaznosti dovršen uz potvrdu korisnika (20absent/4present, 15 promjena, root25→26). Nakon izričitog odgovora „Odobravam objavu tih Firestore pravila i aplikacije” objavljeni owner Rules i Hosting f1cf18a3673985c5f1fe. Završni testovi/release/dokazi u CURRENT_STATE. Fizički uvoz/isporuka alarma ostaje korisnička provjera; nema nove naplate ili push infrastrukture. Raniji TASK-009C i device/cross-device/recovery gates ostaju otvoreni.

TASK-UI-002 naknadna objava 20.10.2026.: korisnik izričito naložio „objavi online”. Hosting-only release **26a5b1aedb998aa9f514** objavljen; release build/PWA i hosted HTTP/assets/browser smoke PASS. Lokalni feature scope i ova konkretna objava dovršeni; otvoreni TASK-009C/physical-device/recovery ugovori odvojeni. Dokazi u CURRENT_STATE/DEPLOYMENT.

TASK-UI-002 — 20.10.2026., korisnik odobrio kalendar Dan/Tjedan/Mjesec, filtre s Pretraži/Poništi, projektne filtre, razjašnjenje arhive i funkcionalnu regresiju na sandbox bazi. Done za lokalni scope; dokazi i granice u CURRENT_STATE (43 unit / 17 Rules / 33 SDK; 59 browser PASS + 1 skip i završni prošireni calendar PASS). Opseg FR-004/007/008/009/010/018; bez data/Rules migracije ili objave.

Datum baselinea: 2026-10-07. PHASE 8 roadmap nakon CONSISTENCY_AUDIT; update 2026-10-09. TASK-001 odobren 2026-10-07; TASK-002/003 odobreni 2026-10-08. TASK-004/005 i TASK-006/007 odobreni 2026-10-09; TASK-008/009 također odobreni 2026-10-09; TASK-010/011/012 nastavak odobren 2026-10-10, TASK-009C čeka izvore.

Prioriteti: P0 foundation/blocker, P1 MVP core, P2 korisno nakon MVP-a, P3 LATER. MUST iz PRD se ne pretvara u P2 zbog nedostajućih konfiguracija; označiti gate.

## Vizualni redizajn — nalog 2026-10-19

TASK-UI-001 — Done za lokalni vizualni scope (provjere u CURRENT_STATE): cjelovit frontend pregled i dosljedan redizajn postojećih sekcija (FR-018, prikazi FR-001–017), bez promjene poslovnih ugovora. Implementirani tokeni, shell/navigation/tablet layout, Početna, dnevni raspored, SessionRow, form grids, record liste, iznos rate, detalj kolegija, diplomski i styling rezultata/backup/importa. Audit nalazi u UI_REDESIGN; aktualni dokazi u CURRENT_STATE/TESTING. Status ove promjene ne zatvara otvorene TASK-009C/011/012 cloud/device ugovore. Naknadno korisnik odobrio online ažuriranje; Hosting-only objava 19.10. PASS, verzija 276da58dcec7220b4701, dokazi u CURRENT_STATE.
## 1. Dependency roadmap

Nastavak 19.10.2026.: FoodLoop seminar/opis i novi utorci inovacija, PHP izuzeće te BU radna tema primijenjeni i readback potvrđeni (COURSE_SOURCE_REVIEW). TASK-009C ostaje djelomičan zbog nepoznatih brojčanih ugovora. TASK-011: lazy shell i odvojeni Auth/Firestore context spustili initial bundle ispod postojećeg warning budgeta; otkazani termini početno skriveni uz dostupnu povijest. Sigurnosna re2 zakrpa podiže Node 22 minimum na 22.22.2; framework/runtime biblioteke ostaju isti. TASK-012: stvarni desktop owner OAuth/course/project writes i validirani cloud export opaženi; admin readback nije physical cross-device ili cloud restore acceptance. Preostali korisnički koraci u FINAL_ACCEPTANCE; nema nove objave/commita/pusha/naplate.

Završetak istog dana: **41 unit / 17 Rules / 33 SDK / 2 release Rules / 53 browser PASS**, uz 1 namjerni mobile keyboard skip; build/PWA/lint/typecheck/standardni format PASS. Release-Rules alat sada vraća testna local-owner pravila prije idućeg suitea. Frontend je u paralelnom radu zasebno odobren i objavljen (276da58dcec7220b4701); opaženo njegovo učitavanje u stvarnom owner Chromeu potvrđuje novi raspored i sačuvanu prijavu. Ovaj nastavak nije sam izvršio deploy/commit/push. Mobile push, puna stvarna grading konfiguracija i ostale real device/recovery gates ostaju odvojeni.

2026-10-15 korisnička završna provjera: faza 1 (Google prijava/prikaz podataka na mobitelu/laptopu) PASS prema korisnikovu izvještaju „sve radi”. Sljedeća faza je cross-device spremanje/refresh/reopen i odvojeno conflict/offline. Ovo zatvara owner-access podskup, ne puni TASK-011/012 ili sve device/recovery gates.

| ID | Cilj / milestone | Prioritet | FR | Depends on | Status |
|---|---|---|---|---|---|
| TASK-001 | Foundation: compatible pinned versions, Angular shell, tooling, docs/run baseline | P0 | FR-018 | Korisnikovo odobrenje dobiveno 2026-10-07 | Done — foundation dokazi u CURRENT_STATE |
| TASK-002 | Emulator, Google auth adapter, approved UID Rules, root/dataset/revision osnova | P0 | FR-001, FR-016 | TASK-001 | Done — lokalni emulator podskup; real OAuth/cloud NOT RUN |
| TASK-003 | Semestri, kolegiji, informacije i arhiva | P1 | FR-002, FR-003 | TASK-002 | Done — lokalni CRUD/reload/archive/conflict; povezani featurei slijede |
| TASK-004 | Tjedni raspored, konkretni termini, iznimke | P1 | FR-004, FR-007 | TASK-003 | Done — lokalna implementacija i dokazi u CURRENT_STATE |
| TASK-005 | Brzi unos i pregled dolaznosti | P1 | FR-005, FR-006, FR-016 | TASK-004 | Done — lokalna implementacija i dokazi u CURRENT_STATE |
| TASK-006 | Provjere znanja i povijest pokušaja/rezultata | P1 | FR-008, FR-014 | TASK-003 | Done — lokalna implementacija i dokazi u CURRENT_STATE |
| TASK-007 | To-do, projekti i osnovni diplomski | P1 | FR-009, FR-010, FR-011, FR-014 | TASK-003, TASK-006 za shared results | Done — lokalna implementacija i dokazi u CURRENT_STATE |
| TASK-008 | Rate i objedinjena Početna | P1 | FR-012, FR-013 | TASK-005, TASK-006, TASK-007 | Done — lokalna provedba i dokazi u CURRENT_STATE |
| TASK-009 | Canonical score model, pure zbroj/grade i incomplete-config UX | P1 | FR-014, FR-015 | TASK-006, TASK-007 | Done — generic engine/config lokalno; real TASK-009C pending |
| TASK-009C | Stvarni kolegiji/rules, complete configured grading | P1 | FR-004, FR-006, FR-015 | TASK-009 + korisnikovi izvori | In progress — 5 stvarnih kolegija/174 termina upisano 2026-10-11; pravila dolaznosti/bodovanja čekaju izvore; SCHEDULE_IMPORT |
| TASK-010 | Ručni export/validirani staged restore/recovery | P1 | FR-017 | TASK-002–009; ADR-004 Accepted 2026-10-10 | Done — lokalni export/restore/recovery; cloud smoke NOT RUN |
| TASK-011 | Hardening, PWA install/update, accessibility i regresija | P1 | FR-001–018 | TASK-005–010; stvarni grade dokaz ovisi o TASK-009C | In progress — PWA/hardening lokalno; dependency/performance/device release gates otvoreni |
| TASK-012 | Cloud priprema, objava i stvarni device/recovery smoke | P1 | FR-001, FR-016–018 | TASK-011 + korisnikovo odobrenje cloud/deploy koraka | In progress — prva testna verzija objavljena po korisnikovu nalogu; real owner/device/cross-device/recovery acceptance ostaje otvoren |

Milestone 0 — Bootstrap: dokumentacija/audit/roadmap pripremljeni. Milestone 1 — TASK-001/002 lokalno dovršeni. Milestone 2 — TASK-003–005 dovršeni za prvi lokalni svakodnevni tok. Milestone 3 — TASK-006–010. Milestone 4 — TASK-011. Milestone 5 — TASK-012 i stvarne konfiguracije. Ne vezati redoslijed za proizvoljne datume.

## 2. Task delivery details

### TASK-001 — Angular foundation

Scope: kompatibilne pinned verzije i lockfile, standalone zoneless shell, lazy routing, hrvatski preview svih sekcija, responsive navigacija, shared tokeni/ikone, manifest/PNG ikone, formatter/lint/type-template/Vitest/Playwright/build. README stvarne lokalne naredbe. Bez Firebase SDK-a, autha, CRUD-a ili cloud aktivacije. Evidence i granice u CURRENT_STATE; checklist u FOUNDATION_CHECKLIST.

### TASK-002 — Siguran pristup i persistence osnova

Goal: provjerljiv local shell i siguran podatkovni pristup. Areas: core/data/shared, config i firebase/test tooling. Steps: live workspace inspect; versions compatibility check; standalone Angular + reactive forms baseline; format/lint/typecheck/build/test script contracts; emulator konfiguracija; deny-default UID/shape/revision/lock Rules; normal mutation/init contract. Bez production cloud podataka.

Tests: minimal component smoke, approved/other/anonymous Rules, stale revision, root initialize i restore lock. DoD: scripts verified, output evidence, README stvarni run commands, CURRENT_STATE. Izvorni user data nije prerequisite. Nema automatic commit/push.

### TASK-003 — Domain foundation

Goal: semestri i kolegiji kao kontekst. Areas: semester/course UI/data/domain. Steps: dates, information/links, current pointer, archive explicit edit; parent reference validation i filters. Tests TC-002/003 + failure/revision. DoD: persistence/reload/emulator proof i docs; sintetički podaci označeni, stvarni se ne izmišljaju.

### TASK-004 / TASK-005 — Raspored i dolaznost

Goal: prvi svakodnevni core tok. Areas: schedule/attendance/home preview/domain/session adapter. Steps: validFrom/Until, virtual termini/recorded snapshots, iznimke, deterministic IDs, fast marks/correction, separate counts/minimum, unknown configuration states. Prije stvarnog unosa provjeriti jedinice i datume korisnika. Konflikt s već evidentiranim budućim terminom zaustavlja destructive regenerate i traži izričitu korekciju.

Tests TC-004–007/016, early mobile layout smoke. DoD: dvije radnje za unos, retry bez duplikata, server persistence i preserved history; feature spec attendance ažuriran. Device proof tek ako stvarno izveden.

### TASK-006 / TASK-007 — Obaveze i rezultat history

Goal: povezane provjere/projekti/taskovi/diplomski. Areas: corresponding features + canonical scoring adapter. Steps: basic CRUD/complete flags, one context, all attempts, grade/points optional, missing topic/mentor. Ne implementirati grading selection policy bez pravila.

Tests TC-008–011/014/016 i nepovezani/project-linked task. DoD: isti task/result u svim prikazima; history preserved; tests/static/build/docs/state.

### TASK-008 — Rate i Početna

2026-10-11 osobni unos: sve četiri rate po 645 EUR upisane u cloud uz backup/preconditions/readback (INSTALLMENTS_IMPORT.md); prva do 5.10.2026. plaćena, ostale neplaćene. In-app prozor 30/7 dana lokalno implementiran/provjeren; nije deployan. Mobile push po korisnikovu izboru samo Proposed u PUSH_REMINDERS_PROPOSAL.md, bez aktivacije naplate; implementacija infrastrukture čeka konkretnu odluku.

Goal: dnevni/nadolazeći pregled. Steps: EUR cents/due dates/paid state; combine next 14 days + overdue/open tasks/current timetable bez povijesnog full scan. All nav sections one predictable access. Tests TC-012/013, responsive/empty/error. DoD: nema duplicate data u dashboardu, paid rata nije upcoming, late obaveze ostaju vidljive.

### TASK-009 / TASK-009C — Bodovanje

2026-10-15 TASK-009C: stvarni izvori za pet kolegija obrađeni; informacije/linkovi upisani u pet postojećih cloud courses. Po suženom korisnikovu nalogu dodana četiri projects, dva BU assessments i šest scoreActivities s nepoznatim bodovima; bez prijava/Mendeley tasks ili inovacijskog/NoSQL projekta. Local domain/graph, genuine read-only plan, backup/preconditions/atomic commit i puni readback PASS. Opseg/nejasnoće u COURSE_SOURCE_REVIEW.md. Stvarna grading konfiguracija i brojčana dolaznost ostaju nepotpune gdje nedostaje ugovor izvora; TASK-009C nije full Done. Raspored/rate očuvani, nema code/deploy/commit/push/billing zahvata.

Goal: pure deterministic engine za potvrđeni additive model, uz konfiguraciju. Steps: exact decimal parser/safe sum, canonical activities/attempts, incomplete flags, thresholds i official/calculated separation. Configure stvarne kolegije samo po izvorima; bounds/rounding/component/attempt izbor provjeriti.

Tests TC-014/015, synthetic boundary tests pa actual per-course regression. DoD generic: ne izmišlja grade, nema double count. DoD real: svi dostupni stvarni rules mapirani i verified; ako nedostaju, TASK-009C i puni FR-015 ostaju incomplete. Nastaviti ostale neovisne taskove.

### TASK-010 — Backup

Goal: puna kopija i safe recovery. Prvo ADR-004 review acceptance; potom envelope validation, consistent export, owner lock/staging, chunk upload/readback, atomic switch, abort/recovery/cleanup. Areas: data/backup/settings/Rules.

Tests TC-017/016, oversized/malformed/reference file, interrupt svakog koraka i lost final response. DoD: active uvijek old ili complete new, drugi uređaj lock poštuje, previous ne briše se prerano, verified roundtrip s višesemestralnim sintetičkim datasetom. Bez ovog dokaza nema stvarnog restorea.

### TASK-011 / TASK-012 — Hardening i release

Goal: upotrebljiv mobile/private online release. Steps: complete state handling, accessibility/contrast/keyboard, PWA cache/install/update, cross-device refresh, OAuth Safari config, headers, dependencies/quotas, backup/recovery. CI verification može se dodati uz odobren remote, nije uvjet za lokalne quality gates.

Tests full critical regression, emulator Rules, production build, Playwright; zatim stvarni Android/iPhone/Windows, real approved/forbidden OAuth, cloud write/read i backup smoke. DoD: evidence s uređajima/verzijama, release checklist, stvarni URL samo nakon odobrene objave. Nema full MVP tvrdnje za stvarnu ocjenu bez TASK-009C.

## 3. Risk register

| Rizik | Utjecaj | Mitigation |
|---|---|---|
| Pravila kolegija nisu dostupna | Actual grading acceptance čeka | Generički unos, incomplete UX, zaseban TASK-009C |
| Model pravila ne pokriva novi kolegij | Domain change | Source review i lokalni audit ugovora prije proširenja |
| Safari OAuth/PWA ponašanje | Mobile pristup | Same-domain config i early stvarni smoke |
| Stale writes / interrupted restore | Gubitak podataka | Revision/lock/staging/recovery tests |
| Besplatne kvote / mala naplata | Dostupnost/trošak | Sparkom početak, query bounds, pregled potrošnje, bez automatskog upgradea |
| Documentation-only readiness | Lažan dojam gotovog appa | CURRENT_STATE odvaja planned/implemented/verified |

## 4. Deferred

P2: pomoćno sortiranje/traženje ako ga stvarna uporaba traži. P3: offline, notifikacije, AI, imports/integracije, widgeti, uploads, partial payments i napredni thesis/statistics. Ništa od toga nije TASK-001–012.

## 5. Progress i checkpoints

Nakon svakog taska ažurirati task status, FR/TC dokaze i CURRENT_STATE. Prije milestonea relevant build/regression; commit checkpoint samo po nalogu korisnika. Nakon novih stvarnih pravila ponoviti pogođeni consistency audit. Stop kada korisnik traži.

## 6. Approval gate

TASK-001–007 lokalno dovršeni; TASK-006/007 odobreni 2026-10-09. TASK-008/009 odobreni u nastavku; TASK-010/011/012 nastavak odobren 2026-10-10, TASK-009C čeka izvore. Odobrenje razvoja ne znači commit/push/deploy niti billing activation. ADR-004 Accepted od korisnika 2026-10-10; TASK-010 lokalno provjeren. Cloud projekt još nije napravljen, prema korisnikovu odgovoru.




## Nastavak 2026-10-10

Korisnik odobrio nastavak TASK-010 i TASK-011/012 nakon TASK-008/009, uz preostali radni kapacitet. ADR-004 izričito prihvaćen 2026-10-10. TASK-009C čeka stvarne izvore. Odobrenje implementacije ne aktivira naplatu, ne objavljuje aplikaciju i ne dopušta commit/push; cloud koraci zahtijevaju konkretan projekt/UID i zasebno odobrenje objave.
