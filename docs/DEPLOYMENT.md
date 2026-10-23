# Deployment i environments

23.10.2026. — lokalne kompatibilne sigurnosne zakrpe alata (DEPENDENCY_REVIEW), zatim Tab fokus ispravak i emulator-only transport kompatibilnost. Default/release build i oba PWA smokea PASS, konačni lokalni release **08e81c515a7f1629ce7e**,42assets, initial361.36kB/~99.39kBtransfer bez warninga. Online ostaje f1cf18a3673985c5f1fe; nije izvršen novi deploy/commit/push/billing ili cloud restore. Početni artefakt samo s alatnim zakrpama bio je identičan online verziji (42SHA-256 usporedbe), prije naknadnog UI ispravka. Read-only cloud export root28 spremljen privatno i validiran aktualnim parserom za sandbox provjeru oporavka. Hosting-only nova objava Tab ispravka traži konkretan nalog; Rules/indeksi/data se ne mijenjaju. Fizički uređaji/real OAuth/CSP enforcement i cloud restore gates ostaju zasebni.

20.10.2026. — objavljen release **f1cf18a3673985c5f1fe**: podsjetnici/privatni ICS, excused/absenceNote i prikaz informacija. Local52unit/18Rules/34SDK/2releaseRules,65jedinstvenih primjenjivih browser PASS kroz puni+ciljani run, build/PWA/staticPASS. Initial361.36kB,42PWAassets/43Hostingdatoteke. Nakon validiranog svježeg backupa root26/188sessions i izričitog korisnikova odgovora „Odobravam objavu tih Firestore pravila i aplikacije” wrapperom zasebno izvršeni deploy `--only firestore:rules` i `--only hosting`, PASS. Prvo automatsko odbijanje zbog nedovoljno izričitog Rules odobrenja nije zaobiđeno; konkretna potvrda razriješila je blokadu. Deployed Rules readback identičan lokalnom release izvoru uz normalizaciju CRLF; anonimni root403. Nema index deploya, migracije, novih data upisa, naplate, servisa ili Git commit/pusha. Primarni URL https://kolegium-c8970.firebaseapp.com.

Hosted read-only smoke PASS za f1cf18a3673985c5f1fe:18 HTTP/cache provjera na firebaseapp.com i web.app (uključujući /reminders), byte-identičan service worker i SHA-256 svih42javnihassets; produkcijski login/Google gumb, bez testnog logina i horizontalnog overflowa na1440/390px. Dokazi/snimke u ignoriranom artifacts/release/reminders-2026-10-20. Dva početna HTTP pokušaja prekinuta ECONNRESET; idući je prošao HTTP provjere, ali čekanje browser load događaja isteklo. Završni run s ograničenim HTTP retryjem i domcontentloaded plus eksplicitnim UI provjerama PASS. Nema nove owner prijave ili privatnog upisa; fizički alarm/install/cross-device nisu dokazani tim javnim smokeom.

## Online objava kalendara i filtara — 20.10.2026.

Korisnik nakon završnih sandbox provjera izričito zatražio „objavi online”. Proveden Hosting-only deploy aktualnog production,release frontenda u postojeći **kolegium-c8970**, s kalendarom Dan/Tjedan/Mjesec, eksplicitnim Pretraži/Poništi filtrima, projektnim filtrima i pojašnjenom arhivom. **Objava PASS**, content version **26a5b1aedb998aa9f514**, 40 PWA assets / 41 Hosting datoteka.

Release build na Node 22.23.3 i release PWA smoke PASS: 361.07 kB initial / 99.31 kB estimated transfer, bez build warninga. Naredba kroz postojeći firebase-cloud wrapper: deploy --project kolegium-c8970 --config firebase.release.json --only hosting --non-interactive. Objavljene su samo javne app datoteke; nema Rules/index/schema promjene, cloud data upisa, seeda, Git commit/pusha ili billing promjene.

Hosted read-only smoke **PASS**: 16 provjera na firebaseapp.com i web.app (/login, /schedule, /assessments, /projects, /todo, service-worker.js, manifest i reserved Auth iframe); 200 statusi, HTML no-cache, worker no-store i byte-identičan lokalnom releaseu. Svih **40 javnih assets** na primarnom originu SHA-256 identično provjerenom buildu, uključujući kalendar/filter lazy chunks. Stvarni javni browser smoke 1440/390 px potvrđuje produkcijski project ID, Google login gumb i odsutnost testnog login gumba/overflowa. Snimke i sanitized JSON u ignoriranom artifacts/release/calendar-2026-10-20. Nije izvršena nova owner prijava niti privatni cloud upis; sandbox funkcionalni dokazi i raniji device/OAuth/grading/recovery gates ostaju odvojeni.

Online: https://kolegium-c8970.firebaseapp.com (primarni Auth origin), https://kolegium-c8970.web.app (alias). U postojećem tabu/PWA spremiti otvoren unos pa odabrati **Učitaj novu verziju** kada se ponudi. Nalog pokriva ovu konkretnu objavu, bez trajnog automatskog deploya.


## Online ažuriranje cijelog frontenda — 2026-10-19

Korisnik nakon lokalnog redizajna izričito zatražio „Ažuriraj full i online”. Objavljen cijeli aktualni production,release frontend na postojeći Hosting kolegium-c8970, uključujući novi dizajn, lazy shell/Firestore učitavanje i već postojeći in-app prikaz podsjetnika. Nije aktiviran mobile push, naplata, novi seed, data migracija ili Rules/index rollout. Nalog se odnosi na ovu objavu; nema trajnog automatskog deploya.

Release build + PWA generator PASS (361.07 kB initial / 99.31 kB estimated transfer); release PWA smoke PASS. Content version **276da58dcec7220b4701**, 40 javnih PWA assets / 41 Hosting datoteka. Firebase CLI `deploy --project kolegium-c8970 --config firebase.release.json --only hosting --non-interactive` PASS. Postojeći Rules/index/schema ugovori nepromijenjeni.

Hosted read-only smoke PASS: /login, /schedule, /courses HTTP 200 no-cache; service-worker.js HTTP 200 no-store i byte-identičan lokalnom release artefaktu; manifest 200 no-cache; reserved /__/auth/iframe 200. firebaseapp.com i web.app imaju isti worker. Stvarni javni browser prikaz na 1440 i 390 px: novi login, produkcijski project ID i Google gumb, bez horizontalnog overflowa. Snimke i metadata u ignoriranom artifacts/release/ui-2026-10-19. Nisu izvršeni privatni cloud upisi ni nova owner Google prijava; prethodna korisnička owner-access potvrda ostaje valjana prema svom opsegu.

Online: https://kolegium-c8970.firebaseapp.com (primarni Auth origin), https://kolegium-c8970.web.app (alias). Već otvoreni PWA/tab može ponuditi Učitaj novu verziju; najprije spremiti otvorene izmjene. Otvoreni grading/device/cross-device/recovery/dependency ugovori ostaju odvojeni. Nije izvršen Git commit/push.

2026-10-11: korisnik zasebno odobrio sljedeći hosting-only deploy za TVZ import/pojedinačne termine. Release build/type/lint/format/targeted tests/PWA PASS, hosting deploy PASS, public HTTP /login i /schedule 200 no-cache, worker 200 no-store (cfc6dc22010eee79fdc7). Nema novog Rules rollouta, CI, Git commit/pusha ili naplate. Korisnik izričito zatražio upis bez browser prijave: postojećim CLI admin računom atomarno dodano i readback validirano 5 kolegija/174 termina te semestar/preferences (181 zapisa). Default build/config ostaju zatvoreni. Daljnji deploy zahtijeva zaseban nalog. Detalji i backup u SCHEDULE_IMPORT/CURRENT_STATE.

Datum: 2026-10-07. Plan, ne aktivirano okruženje.
TASK-001–003 update 2026-10-08: lokalni Angular runtime i Auth/Firestore emulatore verificirali smo na JDK 21. Development demo-kolegium koristi 4200/9099/8080; odvojeni disposable test app demo-kolegium-tests koristi 4300/19099/18080. Emulatori su loopback-only, nema cloud fallbacka. Wrapper koristi lokalni ignorirani .emulator-cache/.firebase-cli i razvojni export/import .emulator-data. README daje preduvjete i naredbe; nagli prekid procesa nije dokaz trajnog backupa.

Production build nalazi se u dist/kolegium, koristi unconfigured environment i deny-all production Rules iz firebase.json. Cloud/Hosting nisu konfigurirani niti objavljeni. Manifest/ikone nisu dokaz service worker/PWA installa; lokalni emulator app nije release artifact za objavu. Prije produkcije odvojiti real approved UID/config i testirati real Rules/OAuth; nikad objaviti lokalni mock.

## 1. Environments / runtime

Local: Node/Angular CLI + Firebase Auth/Firestore emulator sa sintetičkim podacima. Emulator JDK zahtjev verificirati na pinned CLI; planirati JDK 21 ili kompatibilan noviji. Production: korisnikov Spark Firebase projekt, Hosting/Google Auth/Firestore. Firebase Hosting, ne Firebase App Hosting. Zadana besplatna provider domena; custom domain nije MVP trošak/requirement.

Staging zaseban cloud projekt nije potreban za početni single-user MVP. Hosting preview koristi emulator/test projekt i synthetic data; nikad preview sa production zapisima po defaultu.

## 2. Priprema nakon odobrenja implementacije

1. Provjeriti kompatibilne Node LTS/Angular/TypeScript/Firebase CLI verzije, pinati i zabilježiti commands.
2. Izraditi lokalni app/emulator baseline, tests i deny-by-default Rules prije clouda.
3. Korisnik kreira/povezuje Firebase projekt na svom računu; početno Spark, bez billing accounta.
4. Prije kreiranja baze odabrati dostupnu EU lokaciju prema latenciji/trošku; odluku zabilježiti jer je lokacija važna za kasniju promjenu. Ne obećavati da svi Firebase Auth podaci ostaju u EU.
5. Enable Google Auth, authorized domain i stvarni UID. Deploy Rules s odobrenim UID-em; nikad test mode za production.
6. Firebase web config per environment; emulator config se ne smije naći u production buildu. .env.example/config example bez secrets. SDK public config nije razlog za writable Rules.

## 3. Build i deploy flow

Build output dist/kolegium/browser verificiran je lokalno; stvarni scripts su u package.json/README/CODE_STYLE. To nije odobrenje objave.

Prije deploya: relevant quality gates, backup ako postoje podaci, schema/Rules kompatibilnost. Rules/indexes i app objaviti redom koji održava kompatibilnost; promjena ugovora ima staged migration. Hosting SPA rewrite na index.html za app rute, auth /__/ handler ne smije biti pokvaren rewriteom. Auth domain uskladiti sa hosting originom za Safari redirect.

Hosting HTTPS i headers iz SECURITY. PWA manifest, icons, standalone, safe area i update strategija; cache samo app shell/static assets. Ne cacheirati Firestore REST/Auth odgovore ili private dataset u service workeru. Firestore persistent offline cache nije uključen. Odjava čisti privatni in-memory state.

Automatski production deploy iz CI-ja nije odobren. CI može verify/build; objava traži korisnikov nalog u odgovarajućoj fazi.

## 4. Monitoring / costs

Firebase console za storage/read/write/Hosting kvote. Nema obećanog SLA ni zasebnog monitoring servisa. Prije releasea izmjeriti reprezentativnu potrošnju, nakon prvog tjedna ponovno pregledati. Kontinuirani listeneri ograničeni prema TRD.

Spark cilj 0 EUR. Blaze nije hard capped na 5 EUR; budget alert nije ograničenje naplate. Ako paid service postane potreban: procjena cijelog mjesečnog troška, rizik prekoračenja, konkretan izbor korisnika. Nema automatskog upgradea. Nema keep-alive workarounda ili paid external service bez potrebe.

## 5. Recovery i rollback

Ručni data export prije rizične promjene. Restore proces u DATABASE. Prethodna kopija čuva se pri activationu; interrupted restore ima owner-only abort/retry, bez ručnog brisanja active podataka.

Hosting rollback na known-good release ne vraća bazu. Rules rollback samo ako sigurno održava podatkovni ugovor i pristup; ne vraćati otvorene Rules. Migracije forward-fix ili eksplicitni validirani backup restore. Zabilježiti schema version i release koji radi s njom.

Nema klasičnog HTTP health endpointa. Smoke: Hosting load, login, authorized/forbidden read, test record write/read/cleanup i provjera aktivnog dataset-a. OAuth/provider outage prikazati kao unavailable, ne brisati podatke.

## 6. Release checklist

- [ ] Lokalni gates i stvarni device/browser testovi prolaze.
- [ ] Pravila stvarnih kolegija validirana ili granica jasno označena.
- [ ] Rules i uid provjereni u real cloud okruženju.
- [ ] Server-confirmed write, drugi uređaj i backup roundtrip provjereni.
- [ ] OAuth Safari/PWA, restart, logout i update provjereni.
- [ ] CSP, SPA rute i manifest provjereni.
- [ ] Kvote/trošak, backup i rollback evidentirani.
- [ ] Korisnik odobrio objavu; CURRENT_STATE bilježi URL i stvarne dokaze.

Izvori: [Firebase pricing](https://firebase.google.com/pricing), [planovi/naplata](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans), [Safari redirect](https://firebase.google.com/docs/auth/web/redirect-best-practices), [Emulator requirements](https://firebase.google.com/docs/emulator-suite/install_and_configure).

## TASK-004/005

Kompozitni schedule/session indeksi pripremljeni su u firebase/firestore.indexes.json. Emulator provjera ne dokazuje cloud index readiness. Production config i Rules ostaju zatvorene; nema deploya, cloud migracije ni naplate. Prije objave potreban je pregled Rules/index ugovora i backup postojeće stvarne baze.
## TASK-006/007

Novi work kolekcijski Rules/index ugovori provjereni su lokalno. Production Rules/config i dalje zatvoreni. Nema cloud index deploymenta, migracije, naplate ni javnog URL-a. Prije stvarne objave potreban backup postojeće baze i Rules/index review; hostani/device dokazi zasebno.

## TASK-008/009 lokalni impact

Nove lokalne Rules/index definitions za installments/gradingRules/courseOutcomes/manual scoreActivities i status/date Početna queries. Production config/Rules ostaju zatvorene; cloud indexes NOT RUN. Nema nove dependency/naplate. Existing documents ne zahtijevaju rewrite; prije objave backup i review ugovora/indeksa. Stvarne konfiguracije ne seedaju se iz sintetičkih testova.

## TASK-010–012 — lokalna priprema 2026-10-10

Prva odobrena objava: korisnik izričito odobrio Rules/indekse/Hosting i GitHub repo. Preflight users collection showMissing/limit 1 prazna. Wrapper sada dopušta deploy samo s explicit kolegium-c8970 + firebase.release.json + only firestore:rules,firestore:indexes ili hosting. Deploy oba koraka PASS; cloud index READY provjeriti zasebno. Primary origin firebaseapp.com (isti authDomain), web.app alias. HTTP smoke /login i SPA /courses 200, worker no-store, manifest no-cache, reserved Auth iframe 200. Prvi cloud smoke otkrio SPA HTML max-age=3600: ispravljeno općim Cache-Control no-cache uz postojeće immutable JS/CSS iznimke i ponovljeni Hosting deploy. Nema privatne evidencije/credentials u objavljenim datotekama. Real owner Google login/write/device acceptance još nije neposredno provjeren.

Nakon stvarne CLI prijave read-only cloud pregled potvrđuje projekt/bazu Frankfurt i prazne composite indekse. `npm run release:build` generira zasebnu firebase.release.json i Rules te Angular production,release build. Shared javni config je firebase-project.ts, release replacement izravno uvozi njega; default build ostaje zatvoren. `npm run test:pwa:release` provjerava taj build bez korisničke prijave. CLI wrapper dopušta dodatno samo read-only firestore:databases:list/firestore:indexes, još nema deploy naredbe. Konkretna objava i otvorene granice u RELEASE_CANDIDATE; korisnikovo odobrenje još nedostaje. Ne zamijeniti default config usput niti tvrditi da prvi online test završava device/cloud acceptance.

Prijava lokalnog Firebase alata: `node scripts/firebase-cloud.mjs login --reauth --interactive` pokreće standardni Google OAuth s localhost callbackom. U agent okruženju CLI inače bira non-interactive remote code flow; authorization code ne slati u razgovor. Wrapper dopušta samo login/login:list/projects:list, credentials završavaju u ignoriranom `.firebase-cli` storeu. Standardni CLI OAuth traži Firebase/Cloud ovlasti; lokalna priprema nije deploy i alat ne objavljuje automatski. Korisnik završava prijavu na Google stranici. Read-only project review nakon uspjeha; release gates i odobrenje objave ostaju zasebni.

Nakon dobivanja UID-a: `npm run release:prepare-rules` priprema pregledni owner Rules kandidat u `firebase/firestore.release.rules`, bez promjene `firebase.json` ili objave. `npm run test:release-rules` koristi samo izolirani test emulator 18080. Standardni production build još ima `mode: unconfigured`; isključivo owner/config priprema ne predstavlja odobrenje niti spreman cloud release. Aktivacija production moda i izbor kandidata za deploy slijede review gates i konkretan nalog objave. Kod mijenja samo odobreni identitet, nema schema promjene/rewritea; za postojeću stvarnu evidenciju prije Rules rollouta vrijedi backup/compatibility ugovor.

Owner onboarding nakon korisnikove potvrde kreirane Frankfurt baze: `node scripts/owner-login.mjs` pokreće loopback-only Auth stranicu na localhost:4402. Firebase Authentication authorized domains mora sadržavati `localhost`; pristup odobrava korisnik prijavom vlastitim Google računom. Stranica koristi postojeći Firebase Auth i Angularov instalirani esbuild za lokalni bundle bez nove dependency; UID prikazuje u browseru, bez slanja serveru ili token logova, persistence samo memory pa sign-out. Ne čita/piše bazu, ne deploya niti automatski odobrava UID. Nakon ručne provjere UID-a povezati app/Rules i ugasiti helper. Real Google login tek nakon korisnikova klika; HTTP smoke nije OAuth dokaz.

Korisnik prihvatio ADR-004. Local staged backup/restore verificiran je na izoliranom emulatoru; prije svakog cloud schema/Rules rollouta čuvati actual export i pregled kompatibilnosti. Existing schema v1 proširena je dopuštenim metadata recovery stanjima bez rewrita normalnih domain dokumenata. Production deny-all Rules ostaju zatvorene.

`npm run build` generira content-versioned service-worker.js u dist/kolegium/browser nakon Angular production builda; development/e2e ne registrira worker. `npm run test:pwa` koristi privremeni lokalni server 4401 i zatvoreni build, bez clouda. Javne stare cache verzije ostaju za otvorene tabove; nema private API/Firestore/Auth caching-a. Fizički install/update/OAuth acceptance tek slijedi.

firebase.json sada sadrži Hosting public path, SPA rewrite i osnovne headers. CSP je Report-Only kandidat, nije enforce niti verificiran real OAuth policy. firebase.json i dalje bira deny-all production Rules; nema povezanog projekta, command deploya ni naplate. Korisnik potvrdio da projekt nije napravljen. Konkretan redoslijed i stvarne otvorene release gates: RELEASE_CHECKLIST.md.
