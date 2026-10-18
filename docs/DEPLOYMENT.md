# Deployment i environments

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
