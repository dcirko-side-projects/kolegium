# Trenutno stanje

**Datum:** 2026-10-10
**Faza:** TASK-001–010 lokalno implementirani/provjereni; TASK-009C čeka izvore. TASK-011 PWA/hardening lokalno, release gates otvoreni; TASK-012: prva online testna verzija objavljena po korisnikovu nalogu, privatni GitHub repo s kodom na main. Stvarni owner/device/cross-device/recovery acceptance još je otvoren.

## Odobrenje i granice

TASK-001 odobren 2026-10-07, TASK-002/003 2026-10-08, nastavak TASK-004/005, TASK-006/007 i TASK-008/009 2026-10-09. TASK-010/011/012 nastavak odobren 2026-10-10, ADR-004 izričito prihvaćen istog dana. Korisnik naknadno kreirao Firebase projekt `kolegium-c8970` i bazu u Frankfurtu te uključio Google provider i dostavio owner UID. Rad nastavlja postojeći bootstrap bez promjene stacka/scopea. Agent nije commitirao, pushao, deployao niti aktivirao naplatu. Lokalni emulator zahtijeva pokrenut laptop; samostalan pristup s mobitela čeka TASK-012.

## Implementirano

- Foundation: Angular standalone/zoneless, lazy routes, strict templates, hrvatski responsive shell, dostupne sve sekcije, quantum blue/ice glass tokeni, keyboard/safe-area i manifest/ikone.
- Privatni Firebase auth adapter: sintetički lokalni Google credential, allowed UID, guards, RAM draft i state cleanup. Pravi desktop popup/mobile redirect postoji, ali real OAuth nije testiran. Production konfiguracija i Rules ostaju zatvorene.
- Root/active dataset inicijalizacija, schema v1, server timestamps, revision/dataRevision transakcije, lock, paging, root listener i refresh nakon fokusa/reconnecta. Stale edit daje konflikt; ne prepisuje server tiho. UI nema Firebase pozive.
- Semestri/kolegiji: CRUD, aktivni semestar, informacije, sigurni linkovi, arhiva i eksplicitna korekcija. Nepoznata pravila ostaju null; upis kolegija ne seli se u drugi semestar.
- Raspored: ponavljajuća predavanja/vježbe s rasponom datuma, preview, dan/tjedan, lokacija, datum buduće primjene, otkazivanje i nadoknada.
- Virtualni termini materializiraju se jednom pri korisničkoj radnji. Recorded snapshot ostaje isti pri budućem edit-u; postojeći recorded budući termin blokira pogođenu promjenu. Retry istog session payload-a ne duplicira upis/reviziju.
- Dolaznost: brzi Prisutan/Odsutan/Poništi na Početnoj, rasporedu i povijesti; odvojeni zbrojevi predavanja/vježbi, nullable ukupni/minimalni broj, osobni postotak/preostali dolasci. Canceled != absent; nezavršeni/budući termini nisu propušteni. Nadoknade izvan redovnog semestra ulaze u povijest.
- Globalni pending write blokira odjavu/route promjenu i daje beforeunload upozorenje do server potvrde. Error/conflict čuva input. Nema offline queue; prisilno zatvaranje nije jamstvo spremanja.
- Query bounds/paging, vidljivi limiti i kompozitni index config; lokalne closed-shape Rules pokrivaju parents/date/time/weekday/snapshot/revision/lock.

## TASK-006/007 — implementirano

- Provjere znanja: kolegij, tip, datum/opcionalno vrijeme, dovršeno/ponovno otvoreno i detail route. Povijest svih pokušaja s nullable bodovima/ocjenom; ispravak zadržava identitet i reviziju pokušaja. Unknown nije zero, rezultat ne određuje completion automatski.
- Projekti: opcionalni kolegij/rok, completion/reopen, arhiva i eksplicitna korekcija. Completion/arhiva ne dovršavaju niti brišu taskove/rezultate.
- Jedna To-do lista: standalone/course/project/thesis context (jedan po zadatku), opcionalni rok, completion/reopen, context/status server filteri. Projekt i diplomski prikazuju iste canonical taskove kao globalna lista.
- Osnovni diplomski: tema i mentor mogu ostati nepoznati, osnovne informacije i povezani zadaci; bez dodatnih milestone/notifikacijskih featurea.
- Isti rezultati u izvoru i na kolegiju bez kopiranja ili zbrajanja. Nakon prvog canonical rezultata izvor se ne premješta na drugi kolegij. Decimalni unos čuva do 4 mjesta; ne biramo best/latest pokušaj niti izmišljamo grading pravila.
- WorkRepository, page-scoped WorkStore, shared Task/ResultHistory, zatvorene Rules, transakcijski root/revision/lock i idempotent retry. Forme zadržavaju RAM draft pri error/offline; konflikt prikazuje novu server verziju.
- Additive schema v1 bez izmjene postojećih dokumenata. List paging 50; course history učitava dodatne izvore po 50; safety limit 2000 pokušaja daje vidljivu grešku. Project chooser prva stranica 50; ostalim projektima pristupa se kroz paginated Projects/detail. Cloud indices/migration nisu izvedeni.

## TASK-008/009 — implementirano

- Rate EUR cents/dueOn/paid/reopen; edit/reload/conflict/offline i RAM draft.
- Početna: današnja nastava i quick attendance, overdue + idućih 14 dana, otvoreni zadaci bez obveznog roka. Query status/date bounds, stranice 50 i load-more; arhivirane obaveze izostavljene. Nema kopija canonical zapisa niti historical full scan.
- Kolegij: manual lecture/exercise bodovane aktivnosti i shared attempt history, editable metadata komponenta/max/min i rezultati provjere/projekta na istom izvoru.
- Structured grading config: komponente, intervali, eksplicitni obračunski izbor jednog pokušaja aktivnosti, project inclusion i potvrda prema izvoru. Null/unsupported rounding, missing points/mapping/selection/minima ili unfinished source daju incomplete, bez grade.
- Fixed-point zbroj scale 10.000 i safe-integer guard. Poznati odabrani subtotal označen osobnim, unknown nije zero; nema derived aggregate writea.
- Službeni points/grade zasebni i ostaju pri promjeni izračuna; razlike tekstualno vidljive. Potvrda configa znači korisnikov source review svih bodovanih aktivnosti, ne automatski TVZ dokaz.
- Additive schema v1, root/revision/lock transakcije i stale conflict, grading double-read i graf validation. Nove dependencies/cloud/data migration nisu uvedene. Limits: ukupno 6 komponenti/intervala, 100 izbora, grading reads 500 aktivnosti/2000 pokušaja; vidljiva greška umjesto skraćivanja.

## TASK-010 — implementirano i lokalno provjereno

- Zatvoreni backup envelope schema v1 svih 14 kolekcija, svi semestri/pokušaji i recorded povijest; bez UID/auth/control/runtime metadata. Limiti 5 MiB i 10.000 zapisa, preview prije mrežnog zapisa, version/type/IDs/refs/max-points/selection graph validation, cikličke nadoknade odbijene. Kompaktni export ostaje unutar istog UTF-8 limita kao import; test provjerava kopiju blizu 5 MiB.
- Konzistentan server export root revision prije/poslije čitanja, current i previous export. Konkretna JSON datoteka preuzeta u browser testu.
- Accepted ADR-004: očekivana root revizija, lock i nova izolirana generacija; pojedinačni server-confirmed upisi u reference redu. Zamrzavanje staging → verifying prije readbacka sprječava kasni upis u već provjerenu kopiju. Canonical readback i validacija cijelog grafa prethode atomarnom switchu/unlocku.
- Stara kopija zadržana; interrupted lock/precommit ostavlja stari active. Abort je moguć iz drugog approved klijenta, orphan cleanup eksplicitan i protected active/previous/staging. Lost final response provjerava root pointer, ne ponavlja restore na slijepo.
- Root listener prepoznaje novu generaciju: stari dirty input ostaje vidljiv i writes su blokirani. Korisnik eksplicitno učitava novu kopiju, uz potvrdu odbacivanja nespremljenog unosa.
- Lokalna Rules promjena aktivira samo closed recovery prijelaze/stage create/orphan delete. Production deny-all ostaje. Nema stvarnih podataka ili cloud migracije; schema v1 existing normal records ne zahtijevaju rewrite.

## TASK-011/012 — lokalni dio

- Production PWA worker generiran iz build allowlista/content verzije; cache samo javni shell/JS/CSS/ikone/manifest. Private API, Firebase Auth/Firestore i /__/auth/* nisu runtime cache. Nema offline queue.
- Install prompt adapter, iPhone/Safari uputa, waiting update UI i dirty/pending/offline/restore/stale zaštita. Drugi otvoreni tab nikad se automatski ne osvježava; stare javne verzije cachea ostaju radi lazy chunks i nespremljenog rada.
- Popravljeno checkbox oblikovanje. Schedule week/date i To-do filter controls prikazuju disabled pending state, tako da se korisnička radnja ne zanemari tijekom server potvrde. Keyboard smoke čeka auth shell prije Tab-a; nisu promijenjena pravila proizvoda.
- Hosting public path/rewrite/headers pripremljeni u firebase.json; CSP Report-Only je kandidat, nije enforcement niti real OAuth dokaz. Cloud projekt/UID/config/deploy nedostaju. Konkretni gates u RELEASE_CHECKLIST.

## Dokazi — lokalno 2026-10-10

Node 22.20.0, npm 11.4.2, JDK 21. Angular runtime/compiler 21.2.25, CLI/build 21.2.26, TypeScript 5.9.3. Firebase SDK 12.19.0, CLI 15.33.0; scoped gRPC override 1.14.5. TASK-004–011 nisu dodali dependencies.

| Provjera | Rezultat | Granica |
|---|---|---|
| Production build + PWA generator | PASS s warningom | 833.37 kB initial / 220.50 kB estimated transfer; 500 kB warning ostaje, 1 MB error budget prolazi bez povećanja |
| typecheck / lint / format:check | PASS | Strict source/templates; Markdown/Rules format nisu dio formattera |
| Unit | PASS 36/36, 9 files | Pure domain/backup/decimal/date/recurrence i auth/routes/RAM/pending/PWA guards |
| Rules | PASS 17/17, 4 files | Approved/other/anonymous, nested/closed shapes, parent/revision/lock/snapshot, maximum grading configuration, production deny |
| SDK integration | PASS 31/31, 5 files | Existing foundation/schedule/work/planning + 9 backup scenarija, sve faze interruption/recovery i maximum 6 components/100 selections restore |
| Puna Playwright regresija | PASS 49 passed / 1 namjerni skip | 50 cases: desktop i Pixel 7 Chromium; namjerni mobile keyboard skip, desktop provjerava keyboard |
| Production PWA smoke | PASS | Closed built shell, worker registration/static-only cache, offline shell, waiting update, drugi tab bez reloada, synthetic install adapter. Fizička instalacija NOT RUN |
| Visual/axe/keyboard/320px | PASS lokalni podskup; završne desktop/mobile snimke pregledane | Nije puna WCAG certifikacija, Safari ili fizički device dokaz |
| Runtime audit | PASS snapshot: 0 | `npm audit --omit=dev`, registry rezultat nije potpuna security revizija |
| Puni audit / release dependency gate | OPEN: 12 (7 high/5 moderate) | Firebase CLI development lanci, bez neprovjerenog major overridea ili force fix-a |

Svi podatkovni suiteovi i captures izvršavaju se sekvencijalno nad demo-kolegium-tests (Auth 19099/Firestore 18080). Dev demo-kolegium (9099/8080) nikad se ne prazni. Playwright download/tmp koristi .angular/tmp zbog Windows sandboxa; actual download proof prolazi. Snimke su sintetičke, ne TVZ/device/cloud dokaz.

## Otvoreno / NOT RUN

- TASK-009C i puni stvarni FR-015 acceptance: izvori kolegija, raspored, jedinice/uvjeti dolaznosti, bodovna pravila i attempt politika čekaju korisnika. Podržana konfiguracija ima ukupno 6 komponenti/intervala i 100 izbora zbog verificiranog Rules expression limita. Pri izvorima provjeriti kapacitet, ne skraćivati pravila niti izmišljati pragove/zaokruživanje.
- Firebase projekt nije napravljen; real approved UID/web config/Google OAuth, cloud Rules/indeksi/Hosting, Safari i fizički Android/iPhone/Windows, native PWA install/update, hosted CI i real cross-device/cloud recovery: NOT RUN.
- TASK-011 nije puni release Done: otvoreni CLI dependency gate, bundle warning, stvarni mid-range performance i device/OAuth smoke. Browser cache testa ne dokazuje offline private data niti provider outage recovery.
- TASK-012 je lokalna priprema; nema objave, javnog URL-a, naplate, commita ni pusha. Lokalni app zahtijeva pokrenut laptop. Samostalni mobile pristup slijedi tek nakon odobrene objave.
- Emulator export/import restart roundtrip, višegodišnji stvarni volume i real mrežni kvarovi nisu provjereni. Deterministički restore checkpoint fault tests dokazuju lokalni recovery ugovor, ne svaku provider situaciju.

## Sljedeće faze

Završna readiness provjera svih 10 cloud indeksa: READY 10/10. Hosted login/SPA rute/worker/manifest/auth helper 200; HTML Cache-Control no-cache nakon korekcije potvrđen, anonymous Firestore owner-root 403. Odobrena objava i privatni GitHub repo ostvareni. Slijede real owner Google prijava, server-confirmed prvi osobni unos/refresh, drugi uređaj/PWA i odvojeni backup acceptance; TASK-012 zato nije full Done. TASK-009C čeka stvarne TVZ izvore; TASK-011 upozorenja/performance/CSP/mobile acceptance ostaju otvoreni. Nema izmišljenih stvarnih podataka, credentials u repou ili billing upgradea.

GitHub završna provjera: privatni https://github.com/dcirko/kolegium (Private vidljivo u UI) s početnim commitom `99c2e73` na main, push PASS i remote hash jednak lokalnom HEAD. .firebase-cli/.emulator-data/node_modules/dist/artifacts/.env nisu u commit-u; pregled obrasca private keys/refresh tokens bez nalaza u izvorima. Nema automatskog deploy workflowa. Git metadata/credential-helper pristup zahtijevao standardnu sandbox eskalaciju koja je odobrena; ne radi se o GitHub grešci. Screenshot privatnog repoa u artifacts/release/github-private.png.

Hosted smoke: primarni origin /login, /courses SPA, service-worker, manifest i reserved Auth iframe vraćaju 200; anonymous owner-root i nakon Rules deploya 403. Browser prikazuje hrvatski Google login gumb bez unconfigured poruke. Ispravljen stvarno uočen SPA HTML cache header (opći no-cache, worker no-store, hashed assets immutable), Hosting ponovno objavljen. Screenshot login dokaza u ignoriranom artifacts/release/hosted-login.png. Privatni repo https://github.com/dcirko/kolegium kreiran korisnikovim nalogom; source/ignore provjera bez credentials/privatnih lokalnih podataka. Git zapis/slanje evidentirati nakon uspjeha; nisu izvedeni real private writes niti physical-device/cloud restore testovi.

Korisnik odobrio konkretnu prvu online objavu i kreiranje GitHub repozitorija. Read-only preflight users collection (showMissing=true, limit 1) bez evidencije; nema potrebe za migracijom postojećih zapisa, nije izveden destructive restore/cleanup. Firestore Rules/indeksi i Hosting deploy uspješni u kolegium-c8970; 10 indeksa početno CREATING, završno stanje treba potvrditi. Primarni app URL https://kolegium-c8970.firebaseapp.com, alias web.app. CLI compile PASS uz warning za neupotrijebljenu helper funkciju active; deploy nije prekinut. Kreiran privatni dcirko/kolegium repo; inicijalno slanje koda slijedi nakon ignore/secret provjere. Agent nije aktivirao naplatu, Functions/Storage/App Hosting niti CI auto deploy.

Cloud CLI prijava stvarno uspješna; projects:list vidi ACTIVE kolegium-c8970. Read-only databases:list potvrđuje `(default)`, europe-west3, STANDARD/FIRESTORE_NATIVE i freeTier=true. Indeksi u cloud trenutno prazni. Pripremljeni odvojeni firebase.release.json i Angular production,release build; shared public UID/config u firebase-project.ts, default mode i default deploy ostaju zatvoreni. Release build PASS (833.54 kB initial / 220.74 kB estimated transfer, warning ostaje); release PWA smoke PASS s pravim Google login gumbom/project ID i javnim cache/update invariants. Nema cloud write/deploy/naplate. Konkretan prvi online testni kandidat i preostale granice u RELEASE_CANDIDATE. Real app OAuth/private write/device/restore/performance NOT RUN, kandidat nije puni MVP DoD. Svježi puni audit 12 (7 high / 5 moderate); djelomična deploy-path procjena u DEPENDENCY_REVIEW ne zatvara sve nalaze.

Korisnikov screenshot potvrdio prikazani production deny-all sadržaj Firestore Rules; korisnik potvrdio Spark plan. Nema aktivacije naplate niti release deploya. Dodan pripremni Firebase CLI wrapper s ignoriranim workspace config storeom i ograničenim login/project-inspection naredbama; služi za korisnikovu prijavu alata prije read-only cloud reviewa. Real owner write i hosted app/device acceptance i dalje NOT RUN.

Owner UID primljen: `loXiXfiaODeZ71X2T1sqVnqwhzr1`. App config ga sadrži uz unconfigured mode; generated firestore.release.rules mijenja isključivo owner konstantu postojećeg ugovora. Firebase default deploy ostaje deny-all. PASS: release Rules 2/2, typecheck/format, production build/PWA generation (833.52 kB initial, 220.75 kB estimated transfer, postojeći warning). UID dobiven prema korisnikovu odgovoru nakon Auth helpera; stvarni OAuth browser rezultat nije agent neposredno promatrao. Cloud Rules/Spark/indeksi/CSP/dependency gates i objava ostaju otvoreni. Bez schema izmjene, nema data rewritea niti cloud mutacije.

Ograničeni stvarni cloud smoke: unauthenticated REST GET owner root putanje u kolegium-c8970 vratio HTTP 403 / PERMISSION_DENIED. Nije ispisan payload osobnih podataka ni token. To dokazuje odbijanje tog neprijavljenog zahtjeva; ne dokazuje puni deny-all Rules sadržaj, approved/other OAuth pristup, lokaciju ni Spark plan. Nema write/deploy/cleanup poziva u cloud.

Daljnji TASK-012: korisnik potvrdio da je `(default)` baza kreirana u Frankfurtu. Stvarni Rules sadržaj i Spark plan još nisu neposredno provjereni. Pripremljena zasebna lokalna Auth-only stranica `node scripts/owner-login.mjs` na `http://localhost:4402/`: bundled postojeći Firebase Auth SDK, in-memory persistence, prikaz samo UID-a, sign-out nakon prijave, bez Firestore importa/pristupa ili automatskog owner approvala. Server loopback-only, GET allowlist/Host provjera/no-store/CSP; bundle i lokalni HTTP HTML/JS smoke prolaze. Real Google popup/UID još čeka korisnikov klik; nije označen OAuth PASS. Normalni app/config/production Rules ostaju zatvoreni.

Cloud nastavak: korisnik potvrdio uključeni Google provider i odobrio Frankfurt `europe-west3`. Odluka lokacije zabilježena u DECISIONS. Slijedi kreiranje `(default)` Standard baze u Production mode, provjera zatvorenih Rules i stvarni owner Google UID. Ovo je korisnikova potvrda postavke providera, ne izveden OAuth/cloud test. Baza/naplata/objava nisu provedene u ovom koraku.

1. Korisnik dostavio project ID `kolegium-c8970` i public web config; vrijednosti spremljene u production config modul uz `mode: unconfigured` i prazan approved UID. Potvrditi Spark u konzoli, dogovoriti EU lokaciju prije kreiranja baze, povezati stvarni Google UID i zatvoriti release gates iz RELEASE_CHECKLIST. Poslani Analytics snippet nije implementiran.
2. TASK-009C: unijeti stvarne izvore kolegija/rasporeda i provjeriti svaki obračun; može slijediti neovisno o cloud pripremi.
3. Dovršiti TASK-011/012: real OAuth, permission/indeksi, fizički uređaji/PWA, performance/kvote i cloud backup smoke. Konkretna objava traži korisnikov nalog.

Lokalni task Done nije potvrda cijelog MVP-a ili stvarnog cloud/device acceptance-a.

TASK-012 nastavak 2026-10-10: korisnik odobrio iduću fazu. Live `.firebaserc` ne postoji; Firebase CLI `login:list --non-interactive` nema autoriziranih računa i dodatno javlja update config-store grešku. Nema cloud pristupa niti deploya. RELEASE_CHECKLIST sada sadrži konkretan prvi batch za korisnikovo kreiranje Spark projekta i registraciju web appa. Frankfurt `europe-west3` je prijedlog koji čeka potvrdu prije kreiranja baze; production konfiguracija/Rules nisu promijenjene. Ovaj nastavak mijenja samo dokumentaciju; prethodni test rezultati nisu ponovno izvođeni niti predstavljeni kao novi dokaz.

Dodatna završna provjera: nakon compact export serialization i update-request lifecycle izmjene backup Playwright suite ponovno PASS 4/4, unit 36/36 i production PWA smoke ponovno PASS. Development server 4200 i emulatore 9099/8080 pokrenuli smo za lokalni pregled; HTTP login 200, sintetički auth seed bez akademskog seeda. Actual OAuth/cloud nije time provjeren.
